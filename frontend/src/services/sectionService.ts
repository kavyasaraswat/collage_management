import api from './api';

export interface Section {
  id: string;
  name: string;
  courseId: string;
  semesterId: string;
  capacity: number;
  course?: { id: string; name: string; code: string };
  semester?: { id: string; number: number; academicYear: string };
  _count?: {
    students: number;
    teacherSubjects: number;
  };
}

export const sectionService = {
  getAll: async (params?: { courseId?: string; semesterId?: string }) => {
    const res = await api.get<{ success: boolean; data: Section[] }>('/sections', { params });
    return res.data;
  },
  create: async (data: { name: string; courseId: string; semesterId: string; capacity?: number }) => {
    const res = await api.post<{ success: boolean; message: string; data: Section }>('/sections', data);
    return res.data;
  },
  update: async (id: string, data: { name?: string; courseId?: string; semesterId?: string; capacity?: number }) => {
    const res = await api.put<{ success: boolean; message: string; data: Section }>(`/sections/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/sections/${id}`);
    return res.data;
  },
};
