import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const sendNotificationSchema = z.object({
  targetUserId: z.string().optional(),
  targetRole: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'EVERYONE']).optional(),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ALERT']).default('INFO'),
});

// GET /api/notifications - Get notifications for logged-in user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all - Mark all user notifications as read
router.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
});

// POST /api/notifications - Send notification to user or role (ADMIN)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = sendNotificationSchema.parse(req.body);
      const { targetUserId, targetRole, title, message, type } = validated;

      let targetUserIds: string[] = [];

      if (targetUserId) {
        targetUserIds = [targetUserId];
      } else if (targetRole && targetRole !== 'EVERYONE') {
        const users = await prisma.user.findMany({
          where: { role: targetRole, isDeactivated: false },
          select: { id: true },
        });
        targetUserIds = users.map((u) => u.id);
      } else {
        const users = await prisma.user.findMany({
          where: { isDeactivated: false },
          select: { id: true },
        });
        targetUserIds = users.map((u) => u.id);
      }

      if (targetUserIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No target users found for notification' });
      }

      const createOps = targetUserIds.map((uId) =>
        prisma.notification.create({
          data: {
            userId: uId,
            title,
            message,
            type,
          },
        })
      );

      const created = await prisma.$transaction(createOps);

      return res.json({
        success: true,
        message: `Notification sent successfully to ${created.length} user(s)`,
        count: created.length,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error sending notification:', error);
      return res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
  }
);

export default router;
