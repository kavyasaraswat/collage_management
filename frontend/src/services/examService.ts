import api from './api';
import { Subject } from './subjectService';

export interface Exam {
  id: string;
  name: string;
  examType: 'INTERNAL_1' | 'INTERNAL_2' | 'MID_SEM' | 'END_SEM' | 'PRACTICAL' | 'ASSIGNMENT' | 'QUIZ';
  subjectId: string;
  maxMarks: number;
  date: string;
  academicYear: string;
  createdAt?: string;
  updatedAt?: string;
  subject?: Subject;
  _count?: {
    marks: number;
  };
}

export interface CreateExamInput {
  name: string;
  examType: 'INTERNAL_1' | 'INTERNAL_2' | 'MID_SEM' | 'END_SEM' | 'PRACTICAL' | 'ASSIGNMENT' | 'QUIZ';
  subjectId: string;
  maxMarks: number;
  date: string;
  academicYear: string;
}

export const examService = {
  // Create exam
  create: async (data: CreateExamInput) => {
    const response = await api.post('/exams', data);
    return response.data;
  },

  // Get all exams with optional filters
  getAll: async (filters?: {
    subjectId?: string;
    examType?: string;
    academicYear?: string;
    courseId?: string;
  }) => {
    const response = await api.get('/exams', { params: filters });
    return response.data;
  },

  // Get exam by ID
  getById: async (id: string) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  // Update exam
  update: async (id: string, data: Partial<CreateExamInput>) => {
    const response = await api.put(`/exams/${id}`, data);
    return response.data;
  },

  // Delete exam
  delete: async (id: string) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },
};
