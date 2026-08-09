import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      system: 'College Management System API',
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'DEGRADED',
      system: 'College Management System API',
      timestamp: new Date().toISOString(),
      database: 'DISCONNECTED',
      error: error.message,
    });
  }
});

export default router;
