import api from './api';

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    courses: number;
    teachers: number;
    students: number;
  };
}

export const departmentService = {
  getAll: async () => {
    const res = await api.get<{ success: boolean; data: Department[] }>('/departments');
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Department }>(`/departments/${id}`);
    return res.data;
  },
  create: async (data: { code: string; name: string; description?: string }) => {
    const res = await api.post<{ success: boolean; message: string; data: Department }>('/departments', data);
    return res.data;
  },
  update: async (id: string, data: { code?: string; name?: string; description?: string }) => {
    const res = await api.put<{ success: boolean; message: string; data: Department }>(`/departments/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/departments/${id}`);
    return res.data;
  },
};
