import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_182312_ecommerce';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
}

export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const user = db.findUserById(decoded.id);
      if (!user) {
        res.status(401).json({ message: 'User matching this token was not found' });
        return;
      }

      req.user = user;
      next();
      return;
    } catch (error) {
      res.status(401).json({ message: 'Session expired or invalid, please login again' });
      return;
    }
  }

  res.status(401).json({ message: 'Authentication token is missing' });
}

export function admin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access only' });
  }
}
