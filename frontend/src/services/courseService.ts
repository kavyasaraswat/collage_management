import api from './api';

export interface Course {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  totalSemesters: number;
  durationYears: number;
  department?: { id: string; name: string; code: string };
  _count?: {
    semesters: number;
    subjects: number;
    students: number;
  };
}

export const courseService = {
  getAll: async (departmentId?: string) => {
    const params = departmentId ? { departmentId } : {};
    const res = await api.get<{ success: boolean; data: Course[] }>('/courses', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Course }>(`/courses/${id}`);
    return res.data;
  },
  create: async (data: { code: string; name: string; departmentId: string; totalSemesters?: number; durationYears?: number }) => {
    const res = await api.post<{ success: boolean; message: string; data: Course }>('/courses', data);
    return res.data;
  },
  update: async (id: string, data: { code?: string; name?: string; departmentId?: string; totalSemesters?: number; durationYears?: number }) => {
    const res = await api.put<{ success: boolean; message: string; data: Course }>(`/courses/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/courses/${id}`);
    return res.data;
  },
};
