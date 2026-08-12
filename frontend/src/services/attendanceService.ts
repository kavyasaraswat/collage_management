import api from './api';

export interface AttendanceRecordInput {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface MarkAttendancePayload {
  subjectId: string;
  sectionId: string;
  date: string;
  records: AttendanceRecordInput[];
}

export interface SessionAttendanceItem {
  id: string;
  studentId: string;
  subjectId: string;
  sectionId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  markedById: string;
  student: {
    id: string;
    studentId: string;
    name: string;
    email: string;
  };
}

export interface SubjectAttendanceStat {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attended: number;
  percentage: number;
  healthCategory: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
}

export interface StudentAttendanceSummary {
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
  overall: {
    totalClasses: number;
    totalAttended: number;
    totalAbsent: number;
    percentage: number;
    healthCategory: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  };
  subjects: SubjectAttendanceStat[];
  recentLogs: {
    id: string;
    date: string;
    subjectCode: string;
    subjectName: string;
    status: string;
  }[];
}

export interface DefaulterStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  course: string;
  semester: number;
  section: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  healthCategory: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
}

export interface AttendanceOverviewData {
  totalStudents: number;
  averagePercentage: number;
  defaultersCount: number;
  criticalCount: number;
  categoryCounts: {
    excellent: number;
    good: number;
    warning: number;
    critical: number;
  };
  defaulters: DefaulterStudent[];
  allStudentsSummary: DefaulterStudent[];
}

export const attendanceService = {
  // Bulk mark attendance
  markAttendance: async (payload: MarkAttendancePayload) => {
    const response = await api.post('/attendance/mark', payload);
    return response.data;
  },

  // Get session attendance for a specific subject, section, and date
  getSessionAttendance: async (subjectId: string, sectionId: string, date: string) => {
    const response = await api.get('/attendance/session', {
      params: { subjectId, sectionId, date },
    });
    return response.data;
  },

  // Get current logged-in student's attendance summary
  getMyAttendance: async () => {
    const response = await api.get('/attendance/me');
    return response.data;
  },

  // Get specific student's attendance summary
  getStudentAttendance: async (studentId: string) => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
  },

  // Get attendance overview for admin/faculty
  getOverview: async (filters?: {
    departmentId?: string;
    courseId?: string;
    semesterId?: string;
    sectionId?: string;
  }) => {
    const response = await api.get('/attendance/overview', { params: filters });
    return response.data;
  },
};
