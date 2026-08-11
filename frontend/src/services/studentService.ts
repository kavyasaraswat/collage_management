import api from './api';

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  departmentId: string;
  courseId: string;
  semesterId: string;
  sectionId: string;
  batch: string;
  admissionDate?: string | null;
  profilePhoto?: string | null;
  user?: { id: string; email: string; role?: string; isDeactivated: boolean; createdAt?: string };
  department?: { id: string; name: string; code: string };
  course?: { id: string; name: string; code: string };
  semester?: { id: string; number: number; academicYear: string };
  section?: { id: string; name: string };
  enrollments?: Array<any>;
}

export interface StudentListResponse {
  success: boolean;
  data: Student[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const studentService = {
  getAll: async (params?: {
    search?: string;
    departmentId?: string;
    courseId?: string;
    semesterId?: string;
    sectionId?: string;
    status?: 'active' | 'deactivated';
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<StudentListResponse>('/students', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Student }>(`/students/${id}`);
    return res.data;
  },
  create: async (data: {
    email: string;
    password: string;
    name: string;
    studentId: string;
    phone?: string;
    dob?: string;
    gender?: string;
    address?: string;
    departmentId: string;
    courseId: string;
    semesterId: string;
    sectionId: string;
    batch?: string;
    admissionDate?: string;
  }) => {
    const res = await api.post<{ success: boolean; message: string; data: Student }>('/students', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Student>) => {
    const res = await api.put<{ success: boolean; message: string; data: Student }>(`/students/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id: string) => {
    const res = await api.patch<{ success: boolean; message: string; data: { isDeactivated: boolean } }>(`/students/${id}/status`);
    return res.data;
  },
};
