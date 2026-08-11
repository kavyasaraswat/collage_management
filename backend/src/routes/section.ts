import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const createSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required (e.g. Section A)'),
  courseId: z.string().min(1, 'Course ID is required'),
  semesterId: z.string().min(1, 'Semester ID is required'),
  capacity: z.number().min(1).default(60),
});

const updateSectionSchema = z.object({
  name: z.string().min(1).optional(),
  courseId: z.string().optional(),
  semesterId: z.string().optional(),
  capacity: z.number().min(1).optional(),
});

// GET /api/sections - List sections
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, semesterId } = req.query;

    const where: any = {};
    if (courseId) where.courseId = String(courseId);
    if (semesterId) where.semesterId = String(semesterId);

    const sections = await prisma.section.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
        _count: { select: { students: true, teacherSubjects: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: sections });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch sections' });
  }
});

// POST /api/sections - Create section (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createSectionSchema.parse(req.body);

    const existing = await prisma.section.findUnique({
      where: {
        courseId_semesterId_name: {
          courseId: parsed.courseId,
          semesterId: parsed.semesterId,
          name: parsed.name,
        },
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: `'${parsed.name}' already exists for this course and semester`,
      });
      return;
    }

    const section = await prisma.section.create({
      data: parsed,
      include: {
        course: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Section created successfully', data: section });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create section' });
  }
});

// PUT /api/sections/:id - Update section (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateSectionSchema.parse(req.body);

    const updated = await prisma.section.update({
      where: { id },
      data: parsed,
      include: {
        course: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
      },
    });

    res.json({ success: true, message: 'Section updated successfully', data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update section' });
  }
});

// DELETE /api/sections/:id - Delete section (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const sec = await prisma.section.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });

    if (!sec) {
      res.status(404).json({ success: false, message: 'Section not found' });
      return;
    }

    if (sec._count.students > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete section with assigned students (${sec._count.students}).`,
      });
      return;
    }

    await prisma.section.delete({ where: { id } });
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete section' });
  }
});

export default router;
