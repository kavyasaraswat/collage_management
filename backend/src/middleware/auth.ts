import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token missing or invalid' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
    return;
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User unauthenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};
