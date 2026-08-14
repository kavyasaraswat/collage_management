import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const createExamSchema = z.object({
  name: z.string().min(2, 'Exam name is required'),
  examType: z.enum(['INTERNAL_1', 'INTERNAL_2', 'MID_SEM', 'END_SEM', 'PRACTICAL', 'ASSIGNMENT', 'QUIZ']),
  subjectId: z.string().min(1, 'Subject ID is required'),
  maxMarks: z.number().min(1, 'Max marks must be greater than 0').default(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  academicYear: z.string().min(1, 'Academic year is required'),
});

const updateExamSchema = createExamSchema.partial();

// POST /api/exams - Create a new exam
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const validated = createExamSchema.parse(req.body);

    const subject = await prisma.subject.findUnique({ where: { id: validated.subjectId } });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const exam = await prisma.exam.create({
      data: validated,
      include: {
        subject: {
          include: {
            course: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Error creating exam:', error);
    return res.status(500).json({ success: false, message: 'Failed to create exam' });
  }
});

// GET /api/exams - List all exams with optional filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId, examType, academicYear, courseId } = req.query;

    const where: any = {};
    if (subjectId) where.subjectId = String(subjectId);
    if (examType) where.examType = String(examType);
    if (academicYear) where.academicYear = String(academicYear);
    if (courseId) {
      where.subject = { courseId: String(courseId) };
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: {
          include: {
            course: true,
          },
        },
        _count: {
          select: { marks: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
});

// GET /api/exams/:id - Get single exam details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        subject: {
          include: {
            course: true,
          },
        },
        marks: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    return res.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exam details' });
  }
});

// PUT /api/exams/:id - Update exam details
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const validated = updateExamSchema.parse(req.body);

    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: validated,
      include: {
        subject: {
          include: {
            course: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Exam updated successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Error updating exam:', error);
    return res.status(500).json({ success: false, message: 'Failed to update exam' });
  }
});

// DELETE /api/exams/:id - Delete an exam
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    await prisma.exam.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete exam' });
  }
});

export default router;
