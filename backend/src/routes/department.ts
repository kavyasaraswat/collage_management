import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const createDepartmentSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').toUpperCase(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

const updateDepartmentSchema = z.object({
  code: z.string().min(2).toUpperCase().optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

// GET /api/departments - List all departments with counts
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            courses: true,
            teachers: true,
            students: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: departments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch departments' });
  }
});

// GET /api/departments/:id - Single department
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        courses: true,
        teachers: true,
        _count: { select: { students: true } },
      },
    });

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    res.json({ success: true, data: department });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch department' });
  }
});

// POST /api/departments - Create department (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createDepartmentSchema.parse(req.body);

    const existingCode = await prisma.department.findUnique({
      where: { code: parsed.code },
    });

    if (existingCode) {
      res.status(400).json({ success: false, message: `Department code '${parsed.code}' already exists` });
      return;
    }

    const department = await prisma.department.create({
      data: parsed,
    });

    res.status(201).json({ success: true, message: 'Department created successfully', data: department });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create department' });
  }
});

// PUT /api/departments/:id - Update department (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateDepartmentSchema.parse(req.body);

    if (parsed.code) {
      const existing = await prisma.department.findFirst({
        where: { code: parsed.code, NOT: { id } },
      });
      if (existing) {
        res.status(400).json({ success: false, message: `Department code '${parsed.code}' is taken by another department` });
        return;
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: parsed,
    });

    res.json({ success: true, message: 'Department updated successfully', data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to update department' });
  }
});

// DELETE /api/departments/:id - Delete department (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { courses: true, students: true, teachers: true } } },
    });

    if (!dept) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    if (dept._count.courses > 0 || dept._count.students > 0 || dept._count.teachers > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete department with assigned courses (${dept._count.courses}), students (${dept._count.students}), or teachers (${dept._count.teachers}).`,
      });
      return;
    }

    await prisma.department.delete({ where: { id } });
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete department' });
  }
});

export default router;
