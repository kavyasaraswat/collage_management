import api from './api';

export interface Semester {
  id: string;
  number: number;
  academicYear: string;
  isCurrent: boolean;
  courseId: string;
  course?: { id: string; name: string; code: string };
  _count?: {
    sections: number;
    students: number;
  };
}

export const semesterService = {
  getAll: async (courseId?: string) => {
    const params = courseId ? { courseId } : {};
    const res = await api.get<{ success: boolean; data: Semester[] }>('/semesters', { params });
    return res.data;
  },
  create: async (data: { number: number; academicYear: string; isCurrent?: boolean; courseId: string }) => {
    const res = await api.post<{ success: boolean; message: string; data: Semester }>('/semesters', data);
    return res.data;
  },
  update: async (id: string, data: { number?: number; academicYear?: string; isCurrent?: boolean; courseId?: string }) => {
    const res = await api.put<{ success: boolean; message: string; data: Semester }>(`/semesters/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/semesters/${id}`);
    return res.data;
  },
};
