import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const createTeacherSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name is required'),
  teacherId: z.string().min(2, 'Teacher ID / Employee ID is required').toUpperCase(),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
  designation: z.string().default('Assistant Professor'),
  joiningDate: z.string().optional(),
});

const updateTeacherSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().optional(),
  profilePhoto: z.string().optional(),
});

const assignSubjectSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  academicYear: z.string().min(4, 'Academic year is required (e.g. 2026-2027)'),
});

// GET /api/teachers - List teachers with search & filter
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, departmentId } = req.query;

    const where: any = {};
    if (departmentId) {
      where.departmentId = String(departmentId);
    }
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { teacherId: { contains: q } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, isDeactivated: true } },
        department: { select: { id: true, name: true, code: true } },
        teacherSubjects: {
          include: {
            subject: { select: { id: true, name: true, code: true, credits: true } },
            section: { select: { id: true, name: true, courseId: true, semesterId: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: teachers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch teachers' });
  }
});

// GET /api/teachers/:id - Teacher detail
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isDeactivated: true } },
        department: true,
        teacherSubjects: {
          include: {
            subject: { include: { course: true } },
            section: { include: { semester: true } },
          },
        },
      },
    });

    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    res.json({ success: true, data: teacher });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch teacher profile' });
  }
});

// POST /api/teachers - Create Teacher user & profile (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createTeacherSchema.parse(req.body);

    // Check unique email in User table
    const existingEmail = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existingEmail) {
      res.status(400).json({ success: false, message: `Email '${parsed.email}' is already registered` });
      return;
    }

    // Check unique teacherId in Teacher table
    const existingTeacherId = await prisma.teacher.findUnique({ where: { teacherId: parsed.teacherId } });
    if (existingTeacherId) {
      res.status(400).json({ success: false, message: `Teacher ID '${parsed.teacherId}' is already assigned` });
      return;
    }

    const dept = await prisma.department.findUnique({ where: { id: parsed.departmentId } });
    if (!dept) {
      res.status(400).json({ success: false, message: 'Invalid department ID' });
      return;
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsed.email,
          password: hashedPassword,
          role: 'TEACHER',
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          teacherId: parsed.teacherId,
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone || null,
          departmentId: parsed.departmentId,
          designation: parsed.designation,
          joiningDate: parsed.joiningDate || new Date().toISOString().split('T')[0],
        },
        include: {
          user: { select: { id: true, email: true, isDeactivated: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      });

      return teacher;
    });

    res.status(201).json({ success: true, message: 'Teacher created successfully', data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create teacher' });
  }
});

// PUT /api/teachers/:id - Update teacher (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateTeacherSchema.parse(req.body);

    const teacher = await prisma.teacher.update({
      where: { id },
      data: parsed,
      include: {
        department: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, email: true, isDeactivated: true } },
      },
    });

    res.json({ success: true, message: 'Teacher updated successfully', data: teacher });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update teacher' });
  }
});

// POST /api/teachers/:id/assign-subject - Assign subject & section to teacher (Admin only)
router.post('/:id/assign-subject', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = assignSubjectSchema.parse(req.body);
    const teacherId = String(req.params.id);

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const existingAssignment = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId_sectionId_academicYear: {
          teacherId,
          subjectId: parsed.subjectId,
          sectionId: parsed.sectionId,
          academicYear: parsed.academicYear,
        },
      },
    });

    if (existingAssignment) {
      res.status(400).json({ success: false, message: 'Teacher is already assigned to this subject & section for the academic year' });
      return;
    }

    const assignment = await prisma.teacherSubject.create({
      data: {
        teacherId,
        subjectId: parsed.subjectId,
        sectionId: parsed.sectionId,
        academicYear: parsed.academicYear,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Subject assigned successfully', data: assignment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to assign subject' });
  }
});

// DELETE /api/teachers/:id/assign-subject/:assignmentId - Remove assignment (Admin only)
router.delete('/:id/assign-subject/:assignmentId', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const assignmentId = String(req.params.assignmentId);
    await prisma.teacherSubject.delete({
      where: { id: assignmentId },
    });
    res.json({ success: true, message: 'Subject unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to unassign subject' });
  }
});

// PATCH /api/teachers/:id/status - Toggle deactivation status (Admin only)
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher || !teacher.user) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: teacher.userId },
      data: { isDeactivated: !teacher.user.isDeactivated },
    });

    res.json({
      success: true,
      message: `Teacher ${updatedUser.isDeactivated ? 'deactivated' : 'reactivated'} successfully`,
      data: { isDeactivated: updatedUser.isDeactivated },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update teacher status' });
  }
});

export default router;
