import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
  courseId: z.string().optional(),
  semesterId: z.string().optional(),
  sectionId: z.string().optional(),
  designation: z.string().optional(),
  batch: z.string().optional(),
});
