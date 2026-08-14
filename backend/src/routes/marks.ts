import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

const batchMarksSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        marksObtained: z.number().min(0, 'Marks cannot be negative'),
      })
    )
    .min(1, 'At least one student mark record is required'),
});

// Centralized Grading System Helper
export const getGradeAndPoints = (
  percentage: number
): { grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F'; gradePoint: number } => {
  if (percentage >= 90) return { grade: 'O', gradePoint: 10.0 };
  if (percentage >= 80) return { grade: 'A+', gradePoint: 9.0 };
  if (percentage >= 70) return { grade: 'A', gradePoint: 8.0 };
  if (percentage >= 60) return { grade: 'B+', gradePoint: 7.0 };
  if (percentage >= 50) return { grade: 'B', gradePoint: 6.0 };
  if (percentage >= 40) return { grade: 'C', gradePoint: 5.0 };
  return { grade: 'F', gradePoint: 0.0 };
};

// POST /api/marks/batch - Bulk record/update student marks for an exam
router.post(
  '/batch',
  authenticateToken,
  authorizeRoles('ADMIN', 'TEACHER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = batchMarksSchema.parse(req.body);
      const { examId, subjectId, records } = validated;
      const enteredById = req.user!.id;

      // Verify exam exists and validate maxMarks
      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      // Validate each student's marksObtained <= exam.maxMarks
      for (const rec of records) {
        if (rec.marksObtained > exam.maxMarks) {
          return res.status(400).json({
            success: false,
            message: `Marks obtained (${rec.marksObtained}) exceeds max marks (${exam.maxMarks}) for student ID ${rec.studentId}`,
          });
        }
      }

      // Upsert marks records in a transaction
      const operations = records.map((rec) =>
        prisma.marks.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: rec.studentId,
            },
          },
          update: {
            subjectId,
            marksObtained: rec.marksObtained,
            enteredById,
          },
          create: {
            examId,
            studentId: rec.studentId,
            subjectId,
            marksObtained: rec.marksObtained,
            enteredById,
          },
        })
      );

      const results = await prisma.$transaction(operations);

      return res.json({
        success: true,
        message: `Marks recorded successfully for ${results.length} student(s)`,
        count: results.length,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error recording marks:', error);
      return res.status(500).json({ success: false, message: 'Failed to record student marks' });
    }
  }
);

// GET /api/marks/exam/:examId - Fetch student marks for a given exam
router.get('/exam/:examId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const examId = String(req.params.examId);

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { subject: true },
    });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const marks = await prisma.marks.findMany({
      where: { examId },
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

    const formatted = marks.map((m) => {
      const percentage = Number(((m.marksObtained / exam.maxMarks) * 100).toFixed(2));
      const { grade, gradePoint } = getGradeAndPoints(percentage);
      return {
        id: m.id,
        studentId: m.student.id,
        rollNo: m.student.studentId,
        studentName: m.student.name,
        email: m.student.email,
        marksObtained: m.marksObtained,
        maxMarks: exam.maxMarks,
        percentage,
        grade,
        gradePoint,
      };
    });

    return res.json({
      success: true,
      data: {
        exam,
        marks: formatted,
      },
    });
  } catch (error) {
    console.error('Error fetching exam marks:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exam marks' });
  }
});

// Helper function to build student scorecard
export async function getStudentScorecard(studentId: string) {
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

  // Fetch all subjects for student's current semester
  const courseSubjects = await prisma.subject.findMany({
    where: {
      courseId: student.courseId,
      semesterNumber: student.semester.number,
    },
  });

  // Fetch all marks for student
  const studentMarks = await prisma.marks.findMany({
    where: { studentId },
    include: {
      exam: true,
      subject: true,
    },
  });

  // Group marks by subject
  const subjectMap = new Map<
    string,
    {
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      credits: number;
      obtained: number;
      maxMarks: number;
      exams: {
        examId: string;
        examName: string;
        examType: string;
        marksObtained: number;
        maxMarks: number;
      }[];
    }
  >();

  for (const subj of courseSubjects) {
    subjectMap.set(subj.id, {
      subjectId: subj.id,
      subjectCode: subj.code,
      subjectName: subj.name,
      credits: subj.credits,
      obtained: 0,
      maxMarks: 0,
      exams: [],
    });
  }

  for (const m of studentMarks) {
    let entry = subjectMap.get(m.subjectId);
    if (!entry) {
      entry = {
        subjectId: m.subject.id,
        subjectCode: m.subject.code,
        subjectName: m.subject.name,
        credits: m.subject.credits,
        obtained: 0,
        maxMarks: 0,
        exams: [],
      };
      subjectMap.set(m.subjectId, entry);
    }

    entry.obtained += m.marksObtained;
    entry.maxMarks += m.exam.maxMarks;
    entry.exams.push({
      examId: m.exam.id,
      examName: m.exam.name,
      examType: m.exam.examType,
      marksObtained: m.marksObtained,
      maxMarks: m.exam.maxMarks,
    });
  }

  let totalWeightedPoints = 0;
  let totalCredits = 0;
  let hasFailedSubject = false;
  let totalExamsTaken = studentMarks.length;

  const subjectsSummary = Array.from(subjectMap.values()).map((s) => {
    const percentage = s.maxMarks > 0 ? Number(((s.obtained / s.maxMarks) * 100).toFixed(2)) : 0;
    const { grade, gradePoint } = s.maxMarks > 0 ? getGradeAndPoints(percentage) : { grade: 'C' as const, gradePoint: 5.0 };
    const status = s.maxMarks > 0 && percentage >= 40 ? 'PASS' : s.maxMarks > 0 ? 'FAIL' : 'PENDING';

    if (status === 'FAIL') hasFailedSubject = true;

    totalWeightedPoints += gradePoint * s.credits;
    totalCredits += s.credits;

    return {
      ...s,
      percentage,
      grade,
      gradePoint,
      status,
    };
  });

  const sgpa = totalCredits > 0 ? Number((totalWeightedPoints / totalCredits).toFixed(2)) : 0.0;
  const cgpa = sgpa; // Cumulative for current active semester scope

  const overallStatus =
    totalExamsTaken === 0
      ? 'PENDING'
      : hasFailedSubject
      ? 'FAIL'
      : 'PASS';

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
    results: {
      sgpa,
      cgpa,
      totalCredits,
      overallStatus,
      totalExamsTaken,
    },
    subjects: subjectsSummary,
  };
}

// GET /api/marks/me - Current student's result scorecard
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

    const scorecard = await getStudentScorecard(student.id);
    return res.json({ success: true, data: scorecard });
  } catch (error) {
    console.error('Error fetching student me scorecard:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch result scorecard' });
  }
});

// GET /api/marks/student/:studentId - Specific student result scorecard
router.get('/student/:studentId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = String(req.params.studentId);
    const scorecard = await getStudentScorecard(studentId);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.json({ success: true, data: scorecard });
  } catch (error) {
    console.error('Error fetching student scorecard:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student result scorecard' });
  }
});

// GET /api/marks/overview - Admin & Faculty results analytics overview
router.get('/overview', authenticateToken, authorizeRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId, courseId, semesterId, sectionId } = req.query;

    const studentWhere: any = { user: { isDeactivated: false } };
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

    const scorecards = await Promise.all(students.map((st) => getStudentScorecard(st.id)));
    const validScorecards = scorecards.filter((sc) => sc !== null);

    let passCount = 0;
    let failCount = 0;
    let pendingCount = 0;
    let sgpaSum = 0;

    const gradeDistribution = {
      O: 0,
      'A+': 0,
      A: 0,
      'B+': 0,
      B: 0,
      C: 0,
      F: 0,
    };

    const leaderboard = validScorecards
      .map((sc) => {
        if (sc!.results.overallStatus === 'PASS') passCount++;
        else if (sc!.results.overallStatus === 'FAIL') failCount++;
        else pendingCount++;

        sgpaSum += sc!.results.sgpa;

        sc!.subjects.forEach((subj) => {
          if (subj.grade in gradeDistribution) {
            gradeDistribution[subj.grade as keyof typeof gradeDistribution]++;
          }
        });

        return {
          id: sc!.student.id,
          studentId: sc!.student.studentId,
          name: sc!.student.name,
          email: sc!.student.email,
          course: sc!.student.course,
          section: sc!.student.section,
          sgpa: sc!.results.sgpa,
          cgpa: sc!.results.cgpa,
          overallStatus: sc!.results.overallStatus,
        };
      })
      .sort((a, b) => b.sgpa - a.sgpa);

    const totalStudents = students.length;
    const averageSGPA = totalStudents > 0 ? Number((sgpaSum / totalStudents).toFixed(2)) : 0.0;
    const passPercentage = totalStudents > 0 ? Number(((passCount / totalStudents) * 100).toFixed(2)) : 0.0;

    return res.json({
      success: true,
      data: {
        totalStudents,
        passCount,
        failCount,
        pendingCount,
        passPercentage,
        averageSGPA,
        gradeDistribution,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('Error fetching marks overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exam results overview' });
  }
});

export default router;
