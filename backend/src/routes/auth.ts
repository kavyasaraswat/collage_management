import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { loginSchema, registerSchema } from '../utils/zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
        errors: parseResult.error.errors,
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: {
          include: {
            department: true,
            course: true,
            semester: true,
            section: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (user.isDeactivated) {
      res.status(403).json({ success: false, message: 'Account is deactivated. Please contact admin.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error during login' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
        errors: parseResult.error.errors,
      });
      return;
    }

    const {
      email,
      password,
      name,
      role,
      phone,
      departmentId,
      studentId,
      teacherId,
      courseId,
      semesterId,
      sectionId,
      designation,
      batch,
    } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let defaultDeptId = departmentId;
    let defaultCourseId = courseId;
    let defaultSemesterId = semesterId;
    let defaultSectionId = sectionId;

    // Fallback lookup if student/teacher registers without passing specific IDs
    if ((role === 'STUDENT' || role === 'TEACHER') && (!defaultDeptId || !defaultCourseId || !defaultSemesterId || !defaultSectionId)) {
      const defaultDept = await prisma.department.findFirst();
      const defaultCourse = await prisma.course.findFirst();
      const defaultSem = await prisma.semester.findFirst();
      const defaultSec = await prisma.section.findFirst();

      if (defaultDept) defaultDeptId = defaultDeptId || defaultDept.id;
      if (defaultCourse) defaultCourseId = defaultCourseId || defaultCourse.id;
      if (defaultSem) defaultSemesterId = defaultSemesterId || defaultSem.id;
      if (defaultSec) defaultSectionId = defaultSectionId || defaultSec.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        ...(role === 'STUDENT' && defaultDeptId && defaultCourseId && defaultSemesterId && defaultSectionId
          ? {
              student: {
                create: {
                  studentId: studentId || `STU-${Date.now().toString().slice(-6)}`,
                  name,
                  email,
                  phone: phone || '',
                  departmentId: defaultDeptId,
                  courseId: defaultCourseId,
                  semesterId: defaultSemesterId,
                  sectionId: defaultSectionId,
                  batch: batch || new Date().getFullYear().toString(),
                },
              },
            }
          : {}),
        ...(role === 'TEACHER' && defaultDeptId
          ? {
              teacher: {
                create: {
                  teacherId: teacherId || `TCH-${Date.now().toString().slice(-6)}`,
                  name,
                  email,
                  phone: phone || '',
                  departmentId: defaultDeptId,
                  designation: designation || 'Assistant Professor',
                },
              },
            }
          : {}),
      },
      include: {
        student: {
          include: {
            department: true,
            course: true,
            semester: true,
            section: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error during registration' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        student: {
          include: {
            department: true,
            course: true,
            semester: true,
            section: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User profile not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching user profile' });
  }
});

export default router;
