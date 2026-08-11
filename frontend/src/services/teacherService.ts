import api from './api';

export interface Teacher {
  id: string;
  userId: string;
  teacherId: string;
  name: string;
  email: string;
  phone?: string | null;
  departmentId: string;
  designation: string;
  joiningDate?: string | null;
  profilePhoto?: string | null;
  user?: { id: string; email: string; isDeactivated: boolean };
  department?: { id: string; name: string; code: string };
  teacherSubjects?: Array<{
    id: string;
    subjectId: string;
    sectionId: string;
    academicYear: string;
    subject?: { id: string; name: string; code: string; credits: number };
    section?: { id: string; name: string };
  }>;
}

export const teacherService = {
  getAll: async (params?: { search?: string; departmentId?: string }) => {
    const res = await api.get<{ success: boolean; data: Teacher[] }>('/teachers', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Teacher }>(`/teachers/${id}`);
    return res.data;
  },
  create: async (data: {
    email: string;
    password: string;
    name: string;
    teacherId: string;
    phone?: string;
    departmentId: string;
    designation?: string;
    joiningDate?: string;
  }) => {
    const res = await api.post<{ success: boolean; message: string; data: Teacher }>('/teachers', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Teacher>) => {
    const res = await api.put<{ success: boolean; message: string; data: Teacher }>(`/teachers/${id}`, data);
    return res.data;
  },
  assignSubject: async (teacherId: string, data: { subjectId: string; sectionId: string; academicYear: string }) => {
    const res = await api.post<{ success: boolean; message: string; data: any }>(`/teachers/${teacherId}/assign-subject`, data);
    return res.data;
  },
  unassignSubject: async (teacherId: string, assignmentId: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/teachers/${teacherId}/assign-subject/${assignmentId}`);
    return res.data;
  },
  toggleStatus: async (id: string) => {
    const res = await api.patch<{ success: boolean; message: string; data: { isDeactivated: boolean } }>(`/teachers/${id}/status`);
    return res.data;
  },
};
