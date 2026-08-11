import api from './api';

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  sectionId: string;
  academicYear: string;
  teacher?: { id: string; name: string; teacherId: string };
  section?: { id: string; name: string };
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  courseId: string;
  semesterNumber: number;
  credits: number;
  isPractical: boolean;
  course?: { id: string; name: string; code: string };
  teacherSubjects?: TeacherAssignment[];
}

export const subjectService = {
  getAll: async (params?: { courseId?: string; semesterNumber?: number }) => {
    const res = await api.get<{ success: boolean; data: Subject[] }>('/subjects', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Subject }>(`/subjects/${id}`);
    return res.data;
  },
  create: async (data: { code: string; name: string; courseId: string; semesterNumber: number; credits?: number; isPractical?: boolean }) => {
    const res = await api.post<{ success: boolean; message: string; data: Subject }>('/subjects', data);
    return res.data;
  },
  update: async (id: string, data: { code?: string; name?: string; courseId?: string; semesterNumber?: number; credits?: number; isPractical?: boolean }) => {
    const res = await api.put<{ success: boolean; message: string; data: Subject }>(`/subjects/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/subjects/${id}`);
    return res.data;
  },
};
