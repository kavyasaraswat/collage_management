import api from './api';
import { Exam } from './examService';

export interface BatchMarkRecordInput {
  studentId: string;
  marksObtained: number;
}

export interface BatchMarksPayload {
  examId: string;
  subjectId: string;
  records: BatchMarkRecordInput[];
}

export interface ExamMarksItem {
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  email: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';
  gradePoint: number;
}

export interface StudentScorecardData {
  student: {
    id: string;
    studentId: string;
    name: string;
    email: string;
    department: string;
    course: string;
    semester: number;
    section: string;
  };
  results: {
    sgpa: number;
    cgpa: number;
    totalCredits: number;
    overallStatus: 'PASS' | 'FAIL' | 'PENDING';
    totalExamsTaken: number;
  };
  subjects: {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    obtained: number;
    maxMarks: number;
    percentage: number;
    grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';
    gradePoint: number;
    status: 'PASS' | 'FAIL' | 'PENDING';
    exams: {
      examId: string;
      examName: string;
      examType: string;
      marksObtained: number;
      maxMarks: number;
    }[];
  }[];
}

export interface LeaderboardItem {
  id: string;
  studentId: string;
  name: string;
  email: string;
  course: string;
  section: string;
  sgpa: number;
  cgpa: number;
  overallStatus: 'PASS' | 'FAIL' | 'PENDING';
}

export interface ResultsOverviewData {
  totalStudents: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  passPercentage: number;
  averageSGPA: number;
  gradeDistribution: {
    O: number;
    'A+': number;
    A: number;
    'B+': number;
    B: number;
    C: number;
    F: number;
  };
  leaderboard: LeaderboardItem[];
}

export const marksService = {
  // Batch submit marks
  batchMarks: async (payload: BatchMarksPayload) => {
    const response = await api.post('/marks/batch', payload);
    return response.data;
  },

  // Get marks for exam
  getMarksForExam: async (examId: string) => {
    const response = await api.get(`/marks/exam/${examId}`);
    return response.data;
  },

  // Get current student's scorecard
  getMyScorecard: async () => {
    const response = await api.get('/marks/me');
    return response.data;
  },

  // Get specific student scorecard
  getStudentScorecard: async (studentId: string) => {
    const response = await api.get(`/marks/student/${studentId}`);
    return response.data;
  },

  // Get results overview for admin/faculty
  getOverview: async (filters?: {
    departmentId?: string;
    courseId?: string;
    semesterId?: string;
    sectionId?: string;
  }) => {
    const response = await api.get('/marks/overview', { params: filters });
    return response.data;
  },
};
