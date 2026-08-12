import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation Schemas
const markAttendanceSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      })
    )
    .min(1, 'At least one student record is required'),
});

// Helper function to calculate health category from percentage
export const calculateHealthCategory = (percentage: number): 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' => {
  if (percentage >= 85) return 'EXCELLENT';
  if (percentage >= 75) return 'GOOD';
  if (percentage >= 65) return 'WARNING';
  return 'CRITICAL';
};

// POST /api/attendance/mark - Bulk record/update attendance for a class session
router.post(
  '/mark',
  authenticateToken,
  authorizeRoles('ADMIN', 'TEACHER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = markAttendanceSchema.parse(req.body);
      const { subjectId, sectionId, date, records } = validated;
      const markedById = req.user!.id;

      // Verify subject and section exist
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      const section = await prisma.section.findUnique({ where: { id: sectionId } });
      if (!section) {
        return res.status(404).json({ success: false, message: 'Section not found' });
      }

      // Upsert records in a transaction
      const operations = records.map((rec) =>
        prisma.attendance.upsert({
          where: {
            studentId_subjectId_date: {
              studentId: rec.studentId,
              subjectId,
              date,
            },
          },
          update: {
            sectionId,
            status: rec.status,
            markedById,
          },
          create: {
            studentId: rec.studentId,
            subjectId,
            sectionId,
            date,
            status: rec.status,
            markedById,
          },
        })
      );

      const results = await prisma.$transaction(operations);

      return res.json({
        success: true,
        message: `Attendance successfully recorded for ${results.length} student(s)`,
        count: results.length,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error marking attendance:', error);
      return res.status(500).json({ success: false, message: 'Failed to record attendance' });
    }
  }
);

// GET /api/attendance/session - Fetch attendance records for a specific session (subject, section, date)
router.get('/session', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId, sectionId, date } = req.query;

    if (!subjectId || !sectionId || !date) {
      return res.status(400).json({
        success: false,
        message: 'subjectId, sectionId, and date query parameters are required',
      });
    }

    const records = await prisma.attendance.findMany({
      where: {
        subjectId: String(subjectId),
        sectionId: String(sectionId),
        date: String(date),
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        student: {
          studentId: 'asc',
        },
      },
    });

    return res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch session attendance' });
  }
});

// Helper function to build student attendance summary
async function getStudentAttendanceSummary(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      course: true,
      department: true,
      semester: true,
      section: true,
    },
  });

  if (!student) return null;

  // Get all attendance records for student
  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    include: {
      subject: true,
      section: true,
    },
    orderBy: { date: 'desc' },
  });

  // Group by subject
  const subjectMap = new Map<string, {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
  }>();

  // Also fetch all subjects assigned to student's semester to show subjects with 0 sessions
  const courseSubjects = await prisma.subject.findMany({
    where: {
      courseId: student.courseId,
      semesterNumber: student.semester.number,
    },
  });

  for (const subj of courseSubjects) {
    subjectMap.set(subj.id, {
      subjectId: subj.id,
      subjectCode: subj.code,
      subjectName: subj.name,
      credits: subj.credits,
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    });
  }

  for (const att of attendances) {
    let entry = subjectMap.get(att.subjectId);
    if (!entry) {
      entry = {
        subjectId: att.subject.id,
        subjectCode: att.subject.code,
        subjectName: att.subject.name,
        credits: att.subject.credits,
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      };
      subjectMap.set(att.subjectId, entry);
    }

    entry.total += 1;
    if (att.status === 'PRESENT') entry.present += 1;
    else if (att.status === 'LATE') entry.late += 1;
    else if (att.status === 'ABSENT') entry.absent += 1;
    else if (att.status === 'EXCUSED') entry.excused += 1;
  }

  let totalClasses = 0;
  let totalAttended = 0;

  const subjectsSummary = Array.from(subjectMap.values()).map((s) => {
    const attended = s.present + s.late;
    const percentage = s.total > 0 ? Number(((attended / s.total) * 100).toFixed(2)) : 100;
    const healthCategory = s.total > 0 ? calculateHealthCategory(percentage) : 'EXCELLENT';

    totalClasses += s.total;
    totalAttended += attended;

    return {
      ...s,
      attended,
      percentage,
      healthCategory,
    };
  });

  const overallPercentage = totalClasses > 0 ? Number(((totalAttended / totalClasses) * 100).toFixed(2)) : 100;
  const overallHealthCategory = totalClasses > 0 ? calculateHealthCategory(overallPercentage) : 'EXCELLENT';

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      department: student.department.name,
      course: student.course.name,
      semester: student.semester.number,
      section: student.section.name,
    },
    overall: {
      totalClasses,
      totalAttended,
      totalAbsent: totalClasses - totalAttended,
      percentage: overallPercentage,
      healthCategory: overallHealthCategory,
    },
    subjects: subjectsSummary,
    recentLogs: attendances.slice(0, 20).map((a) => ({
      id: a.id,
      date: a.date,
      subjectCode: a.subject.code,
      subjectName: a.subject.name,
      status: a.status,
    })),
  };
}

// GET /api/attendance/me - Current student's attendance metrics
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Access denied: Student role required' });
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const summary = await getStudentAttendanceSummary(student.id);
    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching student me attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance metrics' });
  }
});

// GET /api/attendance/student/:studentId - Specific student attendance metrics
router.get('/student/:studentId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const summary = await getStudentAttendanceSummary(String(studentId));

    if (!summary) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student attendance' });
  }
});

// GET /api/attendance/overview - Admin & Faculty overview analytics
router.get('/overview', authenticateToken, authorizeRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId, courseId, semesterId, sectionId } = req.query;

    const studentWhere: any = {
      user: { isDeactivated: false },
    };
    if (departmentId) studentWhere.departmentId = String(departmentId);
    if (courseId) studentWhere.courseId = String(courseId);
    if (semesterId) studentWhere.semesterId = String(semesterId);
    if (sectionId) studentWhere.sectionId = String(sectionId);

    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        department: true,
        course: true,
        semester: true,
        section: true,
      },
    });

    const studentIds = students.map((s) => s.id);

    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
      },
    });

    // Map student ID to attendance records
    const attendanceByStudent = new Map<string, { total: number; attended: number }>();
    for (const id of studentIds) {
      attendanceByStudent.set(id, { total: 0, attended: 0 });
    }

    for (const att of attendances) {
      const stats = attendanceByStudent.get(att.studentId);
      if (stats) {
        stats.total += 1;
        if (att.status === 'PRESENT' || att.status === 'LATE') {
          stats.attended += 1;
        }
      }
    }

    let overallTotalClasses = 0;
    let overallTotalAttended = 0;
    let excellentCount = 0;
    let goodCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    const studentMetrics = students.map((s) => {
      const stats = attendanceByStudent.get(s.id) || { total: 0, attended: 0 };
      const percentage = stats.total > 0 ? Number(((stats.attended / stats.total) * 100).toFixed(2)) : 100;
      const healthCategory = stats.total > 0 ? calculateHealthCategory(percentage) : 'EXCELLENT';

      overallTotalClasses += stats.total;
      overallTotalAttended += stats.attended;

      if (healthCategory === 'EXCELLENT') excellentCount += 1;
      else if (healthCategory === 'GOOD') goodCount += 1;
      else if (healthCategory === 'WARNING') warningCount += 1;
      else if (healthCategory === 'CRITICAL') criticalCount += 1;

      return {
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        department: s.department.name,
        course: s.course.name,
        semester: s.semester.number,
        section: s.section.name,
        totalClasses: stats.total,
        attendedClasses: stats.attended,
        percentage,
        healthCategory,
      };
    });

    const averagePercentage =
      students.length > 0
        ? Number(
            (
              studentMetrics.reduce((acc, curr) => acc + curr.percentage, 0) / students.length
            ).toFixed(2)
          )
        : 100;

    const defaulters = studentMetrics.filter((s) => s.percentage < 75);

    return res.json({
      success: true,
      data: {
        totalStudents: students.length,
        averagePercentage,
        defaultersCount: defaulters.length,
        criticalCount,
        categoryCounts: {
          excellent: excellentCount,
          good: goodCount,
          warning: warningCount,
          critical: criticalCount,
        },
        defaulters,
        allStudentsSummary: studentMetrics,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance overview' });
  }
});

export default router;
