export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
}

export interface Semester {
  id: string;
  number: number;
  academicYear: string;
}

export interface Section {
  id: string;
  name: string;
}

export interface StudentProfile {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  batch: string;
  department?: Department;
  course?: Course;
  semester?: Semester;
  section?: Section;
}

export interface TeacherProfile {
  id: string;
  teacherId: string;
  name: string;
  email: string;
  phone?: string;
  designation: string;
  department?: Department;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isDeactivated: boolean;
  createdAt: string;
  student?: StudentProfile;
  teacher?: TeacherProfile;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}
