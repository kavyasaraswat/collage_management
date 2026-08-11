import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const createCourseSchema = z.object({
  code: z.string().min(2, 'Course code is required').toUpperCase(),
  name: z.string().min(2, 'Course name is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
  totalSemesters: z.number().min(1).default(8),
  durationYears: z.number().min(1).default(4),
});

const updateCourseSchema = z.object({
  code: z.string().min(2).toUpperCase().optional(),
  name: z.string().min(2).optional(),
  departmentId: z.string().optional(),
  totalSemesters: z.number().min(1).optional(),
  durationYears: z.number().min(1).optional(),
});

// GET /api/courses - List courses
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId } = req.query;

    const courses = await prisma.course.findMany({
      where: departmentId ? { departmentId: String(departmentId) } : {},
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { semesters: true, subjects: true, students: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch courses' });
  }
});

// GET /api/courses/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        semesters: { orderBy: { number: 'asc' } },
        subjects: true,
        sections: true,
      },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    res.json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch course' });
  }
});

// POST /api/courses - Create course (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createCourseSchema.parse(req.body);

    const existingCode = await prisma.course.findUnique({
      where: { code: parsed.code },
    });

    if (existingCode) {
      res.status(400).json({ success: false, message: `Course code '${parsed.code}' already exists` });
      return;
    }

    const dept = await prisma.department.findUnique({ where: { id: parsed.departmentId } });
    if (!dept) {
      res.status(400).json({ success: false, message: 'Invalid department ID' });
      return;
    }

    const course = await prisma.course.create({
      data: parsed,
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    res.status(201).json({ success: true, message: 'Course created successfully', data: course });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create course' });
  }
});

// PUT /api/courses/:id - Update course (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateCourseSchema.parse(req.body);

    if (parsed.code) {
      const existing = await prisma.course.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        res.status(400).json({ success: false, message: `Course code '${parsed.code}' is taken by another course` });
        return;
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data: parsed,
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    res.json({ success: true, message: 'Course updated successfully', data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - Delete course (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const course = await prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { students: true, subjects: true } } },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    if (course._count.students > 0 || course._count.subjects > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete course with associated students (${course._count.students}) or subjects (${course._count.subjects}).`,
      });
      return;
    }

    await prisma.course.delete({ where: { id } });
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete course' });
  }
});

export default router;
