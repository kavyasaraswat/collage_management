import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const createSemesterSchema = z.object({
  number: z.number().min(1, 'Semester number must be at least 1'),
  academicYear: z.string().min(4, 'Academic year is required (e.g. 2026-2027)'),
  isCurrent: z.boolean().default(false),
  courseId: z.string().min(1, 'Course ID is required'),
});

const updateSemesterSchema = z.object({
  number: z.number().min(1).optional(),
  academicYear: z.string().min(4).optional(),
  isCurrent: z.boolean().optional(),
  courseId: z.string().optional(),
});

// GET /api/semesters - List semesters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.query;

    const semesters = await prisma.semester.findMany({
      where: courseId ? { courseId: String(courseId) } : {},
      include: {
        course: { select: { id: true, name: true, code: true } },
        _count: { select: { sections: true, students: true } },
      },
      orderBy: [{ courseId: 'asc' }, { number: 'asc' }],
    });

    res.json({ success: true, data: semesters });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch semesters' });
  }
});

// POST /api/semesters - Create semester (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createSemesterSchema.parse(req.body);

    const existing = await prisma.semester.findUnique({
      where: {
        courseId_number_academicYear: {
          courseId: parsed.courseId,
          number: parsed.number,
          academicYear: parsed.academicYear,
        },
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: `Semester ${parsed.number} for academic year '${parsed.academicYear}' already exists for this course`,
      });
      return;
    }

    const semester = await prisma.semester.create({
      data: parsed,
      include: { course: { select: { id: true, name: true, code: true } } },
    });

    res.status(201).json({ success: true, message: 'Semester created successfully', data: semester });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create semester' });
  }
});

// PUT /api/semesters/:id - Update semester (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateSemesterSchema.parse(req.body);

    const updated = await prisma.semester.update({
      where: { id },
      data: parsed,
      include: { course: { select: { id: true, name: true, code: true } } },
    });

    res.json({ success: true, message: 'Semester updated successfully', data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update semester' });
  }
});

// DELETE /api/semesters/:id - Delete semester (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const sem = await prisma.semester.findUnique({
      where: { id },
      include: { _count: { select: { students: true, sections: true } } },
    });

    if (!sem) {
      res.status(404).json({ success: false, message: 'Semester not found' });
      return;
    }

    if (sem._count.students > 0 || sem._count.sections > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete semester with enrolled students (${sem._count.students}) or sections (${sem._count.sections}).`,
      });
      return;
    }

    await prisma.semester.delete({ where: { id } });
    res.json({ success: true, message: 'Semester deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete semester' });
  }
});

export default router;
