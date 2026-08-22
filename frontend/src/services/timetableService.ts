import api from './api';

export interface TimetableSlot {
  id: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  courseId: string;
  semesterId: string;
  sectionId: string;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; code: string; credits: number };
  teacher?: { id: string; name: string; designation: string; email: string };
  course?: { id: string; name: string; code: string };
  semester?: { id: string; number: number; academicYear: string };
  section?: { id: string; name: string };
}

export const timetableService = {
  getAll: async (params?: {
    courseId?: string;
    semesterId?: string;
    sectionId?: string;
    teacherId?: string;
    dayOfWeek?: string;
  }) => {
    const res = await api.get<{ success: boolean; data: TimetableSlot[] }>('/timetable', { params });
    return res.data;
  },

  getMySchedule: async () => {
    const res = await api.get<{ success: boolean; data: TimetableSlot[] }>('/timetable/me');
    return res.data;
  },

  create: async (data: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherId: string;
    roomId: string;
    courseId: string;
    semesterId: string;
    sectionId: string;
  }) => {
    const res = await api.post<{ success: boolean; message: string; data: TimetableSlot }>('/timetable', data);
    return res.data;
  },

  update: async (id: string, data: Partial<TimetableSlot>) => {
    const res = await api.put<{ success: boolean; message: string; data: TimetableSlot }>(`/timetable/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/timetable/${id}`);
    return res.data;
  },
};

export default timetableService;
