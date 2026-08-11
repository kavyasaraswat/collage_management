import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const createStudentSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name is required'),
  studentId: z.string().min(2, 'Student ID / Roll Number is required').toUpperCase(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  semesterId: z.string().min(1, 'Semester ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  batch: z.string().default(new Date().getFullYear().toString()),
  admissionDate: z.string().optional(),
});

const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  departmentId: z.string().optional(),
  courseId: z.string().optional(),
  semesterId: z.string().optional(),
  sectionId: z.string().optional(),
  batch: z.string().optional(),
  admissionDate: z.string().optional(),
  profilePhoto: z.string().optional(),
});

// GET /api/students - List students with search, filters, and pagination
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, departmentId, courseId, semesterId, sectionId, status, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (departmentId) where.departmentId = String(departmentId);
    if (courseId) where.courseId = String(courseId);
    if (semesterId) where.semesterId = String(semesterId);
    if (sectionId) where.sectionId = String(sectionId);

    if (status === 'active') {
      where.user = { isDeactivated: false };
    } else if (status === 'deactivated') {
      where.user = { isDeactivated: true };
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { studentId: { contains: q } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, isDeactivated: true } },
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
          semester: { select: { id: true, number: true, academicYear: true } },
          section: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch students' });
  }
});

// GET /api/students/:id - Student profile details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isDeactivated: true, createdAt: true } },
        department: true,
        course: true,
        semester: true,
        section: true,
        enrollments: {
          include: {
            course: true,
            semester: true,
            section: true,
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    res.json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch student details' });
  }
});

// POST /api/students - Create Student user & profile (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createStudentSchema.parse(req.body);

    // Enforce unique email
    const existingEmail = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existingEmail) {
      res.status(400).json({ success: false, message: `Email '${parsed.email}' is already registered` });
      return;
    }

    // Enforce unique studentId
    const existingStudentId = await prisma.student.findUnique({ where: { studentId: parsed.studentId } });
    if (existingStudentId) {
      res.status(400).json({ success: false, message: `Student ID / Roll Number '${parsed.studentId}' is already assigned` });
      return;
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsed.email,
          password: hashedPassword,
          role: 'STUDENT',
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: parsed.studentId,
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone || null,
          dob: parsed.dob || null,
          gender: parsed.gender || null,
          address: parsed.address || null,
          departmentId: parsed.departmentId,
          courseId: parsed.courseId,
          semesterId: parsed.semesterId,
          sectionId: parsed.sectionId,
          batch: parsed.batch,
          admissionDate: parsed.admissionDate || new Date().toISOString().split('T')[0],
        },
        include: {
          user: { select: { id: true, email: true, isDeactivated: true } },
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
          semester: { select: { id: true, number: true, academicYear: true } },
          section: { select: { id: true, name: true } },
        },
      });

      // Create initial active enrollment
      await tx.enrollment.create({
        data: {
          studentId: student.id,
          courseId: parsed.courseId,
          semesterId: parsed.semesterId,
          sectionId: parsed.sectionId,
          academicYear: '2026-2027',
          status: 'ACTIVE',
        },
      });

      return student;
    });

    res.status(201).json({ success: true, message: 'Student registered successfully', data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create student' });
  }
});

// PUT /api/students/:id - Update student details (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateStudentSchema.parse(req.body);

    const updated = await prisma.student.update({
      where: { id },
      data: parsed,
      include: {
        user: { select: { id: true, email: true, isDeactivated: true } },
        department: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
        section: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, message: 'Student profile updated successfully', data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update student profile' });
  }
});

// PATCH /api/students/:id/status - Toggle deactivation (Admin only)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student || !student.user) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: student.userId },
      data: { isDeactivated: !student.user.isDeactivated },
    });

    res.json({
      success: true,
      message: `Student account ${updatedUser.isDeactivated ? 'deactivated' : 'reactivated'} successfully`,
      data: { isDeactivated: updatedUser.isDeactivated },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update student status' });
  }
});

export default router;
