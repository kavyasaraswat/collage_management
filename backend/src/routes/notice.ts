import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const noticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  targetAudience: z
    .enum(['EVERYONE', 'DEPARTMENT', 'COURSE', 'SEMESTER', 'SECTION'])
    .default('EVERYONE'),
  departmentId: z.string().optional(),
  courseId: z.string().optional(),
  semesterId: z.string().optional(),
  sectionId: z.string().optional(),
  publishDate: z.string().min(1, 'Publish date is required'),
  expiryDate: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

// POST /api/notices - Create notice (ADMIN / TEACHER)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'TEACHER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = noticeSchema.parse(req.body);
      const authorId = req.user!.id;

      const notice = await prisma.notice.create({
        data: {
          ...validated,
          authorId,
          isActive: true,
        },
        include: {
          author: { select: { id: true, email: true, role: true } },
          department: true,
          course: true,
          semester: true,
          section: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Notice published successfully',
        data: notice,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error publishing notice:', error);
      return res.status(500).json({ success: false, message: 'Failed to publish notice' });
    }
  }
);

// GET /api/notices - Fetch target-filtered notices for logged-in user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user!.id;

    let targetOR: any[] = [{ targetAudience: 'EVERYONE' }];

    if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId },
      });
      if (student) {
        targetOR.push(
          { targetAudience: 'DEPARTMENT', departmentId: student.departmentId },
          { targetAudience: 'COURSE', courseId: student.courseId },
          { targetAudience: 'SEMESTER', semesterId: student.semesterId },
          { targetAudience: 'SECTION', sectionId: student.sectionId }
        );
      }
    } else if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (teacher) {
        targetOR.push({ targetAudience: 'DEPARTMENT', departmentId: teacher.departmentId });
      }
    } else if (userRole === 'ADMIN') {
      // Admins see all notices
      targetOR = [];
    }

    const where: any = { isActive: true };
    if (targetOR.length > 0) {
      where.OR = targetOR;
    }

    const notices = await prisma.notice.findMany({
      where,
      include: {
        author: { select: { id: true, email: true, role: true } },
        department: true,
        course: true,
        semester: true,
        section: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: notices,
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch campus notices' });
  }
});

// PUT /api/notices/:id - Update notice (ADMIN / TEACHER)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'TEACHER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const validated = noticeSchema.partial().parse(req.body);

      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Notice not found' });
      }

      const updated = await prisma.notice.update({
        where: { id },
        data: validated,
        include: {
          author: { select: { id: true, email: true, role: true } },
          department: true,
          course: true,
          semester: true,
          section: true,
        },
      });

      return res.json({
        success: true,
        message: 'Notice updated successfully',
        data: updated,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error updating notice:', error);
      return res.status(500).json({ success: false, message: 'Failed to update notice' });
    }
  }
);

// DELETE /api/notices/:id - Delete notice (ADMIN / TEACHER)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'TEACHER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);

      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Notice not found' });
      }

      await prisma.notice.delete({ where: { id } });

      return res.json({
        success: true,
        message: 'Notice deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting notice:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete notice' });
    }
  }
);

export default router;
