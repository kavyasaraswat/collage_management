import api from './api';

export interface Notice {
  id: string;
  title: string;
  content: string;
  attachmentUrl?: string;
  targetAudience: 'EVERYONE' | 'DEPARTMENT' | 'COURSE' | 'SEMESTER' | 'SECTION';
  departmentId?: string;
  courseId?: string;
  semesterId?: string;
  sectionId?: string;
  authorId: string;
  publishDate: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; email: string; role: string };
  department?: { id: string; name: string };
  course?: { id: string; name: string; code: string };
  semester?: { id: string; number: number };
  section?: { id: string; name: string };
}

export const noticeService = {
  getAll: async () => {
    const res = await api.get<{ success: boolean; data: Notice[] }>('/notices');
    return res.data;
  },

  create: async (data: {
    title: string;
    content: string;
    targetAudience?: 'EVERYONE' | 'DEPARTMENT' | 'COURSE' | 'SEMESTER' | 'SECTION';
    departmentId?: string;
    courseId?: string;
    semesterId?: string;
    sectionId?: string;
    publishDate: string;
    expiryDate?: string;
    attachmentUrl?: string;
  }) => {
    const res = await api.post<{ success: boolean; message: string; data: Notice }>('/notices', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Notice>) => {
    const res = await api.put<{ success: boolean; message: string; data: Notice }>(`/notices/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/notices/${id}`);
    return res.data;
  },
};

export default noticeService;
