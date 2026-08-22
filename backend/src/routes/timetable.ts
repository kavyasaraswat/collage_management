import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const timetableSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (e.g. 09:00)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (e.g. 10:00)'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  semesterId: z.string().min(1, 'Semester ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
});

// Conflict Prevention Helper Engine
export async function checkTimetableConflicts(data: {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  sectionId: string;
  roomId: string;
  excludeId?: string;
}) {
  const { dayOfWeek, startTime, endTime, teacherId, sectionId, roomId, excludeId } = data;

  // 1. Fetch all slots on the same day (excluding current slot if editing)
  const slotsOnDay = await prisma.timetable.findMany({
    where: {
      dayOfWeek,
      ...(excludeId && { id: { not: excludeId } }),
    },
    include: {
      teacher: true,
      subject: true,
      section: true,
    },
  });

  for (const slot of slotsOnDay) {
    // Check if time windows overlap: startA < endB AND endA > startB
    const overlaps = startTime < slot.endTime && endTime > slot.startTime;

    if (overlaps) {
      // Conflict 1: Teacher double booking
      if (slot.teacherId === teacherId) {
        return {
          hasConflict: true,
          reason: `Teacher Conflict: ${slot.teacher.name} is already assigned to ${slot.subject.name} in Room ${slot.roomId} from ${slot.startTime} to ${slot.endTime} on ${dayOfWeek}.`,
        };
      }

      // Conflict 2: Section double booking
      if (slot.sectionId === sectionId) {
        return {
          hasConflict: true,
          reason: `Section Conflict: ${slot.section.name} already has a class scheduled (${slot.subject.name}) from ${slot.startTime} to ${slot.endTime} on ${dayOfWeek}.`,
        };
      }

      // Conflict 3: Room double booking
      if (slot.roomId === roomId) {
        return {
          hasConflict: true,
          reason: `Room Conflict: Room ${roomId} is already occupied by ${slot.subject.name} from ${slot.startTime} to ${slot.endTime} on ${dayOfWeek}.`,
        };
      }
    }
  }

  return { hasConflict: false };
}

// POST /api/timetable - Create a schedule slot (ADMIN)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = timetableSchema.parse(req.body);
      const { startTime, endTime } = validated;

      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be before end time',
        });
      }

      // Run conflict engine
      const conflictCheck = await checkTimetableConflicts(validated);
      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          success: false,
          message: conflictCheck.reason,
        });
      }

      const slot = await prisma.timetable.create({
        data: validated,
        include: {
          subject: true,
          teacher: true,
          course: true,
          semester: true,
          section: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Timetable entry created successfully with 0 conflicts',
        data: slot,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error creating timetable slot:', error);
      return res.status(500).json({ success: false, message: 'Failed to create timetable slot' });
    }
  }
);

// GET /api/timetable - Fetch timetable slots with optional filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, semesterId, sectionId, teacherId, dayOfWeek } = req.query;

    const where: any = {};
    if (courseId) where.courseId = String(courseId);
    if (semesterId) where.semesterId = String(semesterId);
    if (sectionId) where.sectionId = String(sectionId);
    if (teacherId) where.teacherId = String(teacherId);
    if (dayOfWeek) where.dayOfWeek = String(dayOfWeek);

    const slots = await prisma.timetable.findMany({
      where,
      include: {
        subject: true,
        teacher: true,
        course: true,
        semester: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error('Error fetching timetable slots:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch timetable slots' });
  }
});

// GET /api/timetable/me - Fetch personalized timetable for logged-in user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    let where: any = {};

    if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id },
      });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      where = {
        courseId: student.courseId,
        semesterId: student.semesterId,
        sectionId: student.sectionId,
      };
    } else if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id },
      });
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher profile not found' });
      }
      where = { teacherId: teacher.id };
    } else {
      // Admin sees all slots by default
    }

    const slots = await prisma.timetable.findMany({
      where,
      include: {
        subject: true,
        teacher: true,
        course: true,
        semester: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error('Error fetching personalized timetable:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch personalized timetable' });
  }
});

// PUT /api/timetable/:id - Update timetable slot (ADMIN)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const validated = timetableSchema.partial().parse(req.body);

      const existing = await prisma.timetable.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Timetable slot not found' });
      }

      const mergedData = {
        dayOfWeek: validated.dayOfWeek || existing.dayOfWeek,
        startTime: validated.startTime || existing.startTime,
        endTime: validated.endTime || existing.endTime,
        teacherId: validated.teacherId || existing.teacherId,
        sectionId: validated.sectionId || existing.sectionId,
        roomId: validated.roomId || existing.roomId,
        excludeId: id,
      };

      if (mergedData.startTime >= mergedData.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be before end time',
        });
      }

      const conflictCheck = await checkTimetableConflicts(mergedData);
      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          success: false,
          message: conflictCheck.reason,
        });
      }

      const updated = await prisma.timetable.update({
        where: { id },
        data: validated,
        include: {
          subject: true,
          teacher: true,
          course: true,
          semester: true,
          section: true,
        },
      });

      return res.json({
        success: true,
        message: 'Timetable slot updated successfully',
        data: updated,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error updating timetable slot:', error);
      return res.status(500).json({ success: false, message: 'Failed to update timetable slot' });
    }
  }
);

// DELETE /api/timetable/:id - Delete timetable slot (ADMIN)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);

      const existing = await prisma.timetable.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Timetable slot not found' });
      }

      await prisma.timetable.delete({ where: { id } });

      return res.json({
        success: true,
        message: 'Timetable slot deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting timetable slot:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete timetable slot' });
    }
  }
);

export default router;
