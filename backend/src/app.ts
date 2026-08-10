import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';

const app: Express = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);

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
