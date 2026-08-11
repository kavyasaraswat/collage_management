import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const createSubjectSchema = z.object({
  code: z.string().min(2, 'Subject code is required').toUpperCase(),
  name: z.string().min(2, 'Subject name is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  semesterNumber: z.number().min(1, 'Semester number must be at least 1'),
  credits: z.number().min(1).default(4),
  isPractical: z.boolean().default(false),
});

const updateSubjectSchema = z.object({
  code: z.string().min(2).toUpperCase().optional(),
  name: z.string().min(2).optional(),
  courseId: z.string().optional(),
  semesterNumber: z.number().min(1).optional(),
  credits: z.number().min(1).optional(),
  isPractical: z.boolean().optional(),
});

// GET /api/subjects - List subjects
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, semesterNumber } = req.query;

    const where: any = {};
    if (courseId) where.courseId = String(courseId);
    if (semesterNumber) where.semesterNumber = Number(semesterNumber);

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
        teacherSubjects: {
          include: {
            teacher: { select: { id: true, name: true, teacherId: true } },
            section: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ courseId: 'asc' }, { semesterNumber: 'asc' }, { code: 'asc' }],
    });

    res.json({ success: true, data: subjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch subjects' });
  }
});

// GET /api/subjects/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        course: true,
        teacherSubjects: {
          include: {
            teacher: true,
            section: true,
          },
        },
      },
    });

    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }

    res.json({ success: true, data: subject });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch subject' });
  }
});

// POST /api/subjects - Create subject (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createSubjectSchema.parse(req.body);

    const existingCode = await prisma.subject.findUnique({
      where: { code: parsed.code },
    });

    if (existingCode) {
      res.status(400).json({ success: false, message: `Subject code '${parsed.code}' already exists` });
      return;
    }

    const course = await prisma.course.findUnique({ where: { id: parsed.courseId } });
    if (!course) {
      res.status(400).json({ success: false, message: 'Invalid course ID' });
      return;
    }

    const subject = await prisma.subject.create({
      data: parsed,
      include: { course: { select: { id: true, name: true, code: true } } },
    });

    res.status(201).json({ success: true, message: 'Subject created successfully', data: subject });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create subject' });
  }
});

// PUT /api/subjects/:id - Update subject (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateSubjectSchema.parse(req.body);

    if (parsed.code) {
      const existing = await prisma.subject.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        res.status(400).json({ success: false, message: `Subject code '${parsed.code}' is taken by another subject` });
        return;
      }
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: parsed,
      include: { course: { select: { id: true, name: true, code: true } } },
    });

    res.json({ success: true, message: 'Subject updated successfully', data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update subject' });
  }
});

// DELETE /api/subjects/:id - Delete subject (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: { _count: { select: { attendances: true, exams: true, marks: true } } },
    });

    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }

    if (subject._count.attendances > 0 || subject._count.exams > 0 || subject._count.marks > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete subject with linked attendance records, exams, or marks.`,
      });
      return;
    }

    await prisma.subject.delete({ where: { id } });
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete subject' });
  }
});

export default router;
