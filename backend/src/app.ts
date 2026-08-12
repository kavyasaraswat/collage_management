import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import departmentRoutes from './routes/department';
import courseRoutes from './routes/course';
import semesterRoutes from './routes/semester';
import sectionRoutes from './routes/section';
import subjectRoutes from './routes/subject';
import teacherRoutes from './routes/teacher';
import studentRoutes from './routes/student';
import attendanceRoutes from './routes/attendance';

const app: Express = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
