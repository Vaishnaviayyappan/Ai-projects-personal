import { Request, Response, NextFunction } from 'express';
import { MESSAGES } from '../messages';
import { ApiError } from '@netbank/shared';

const IDLE_TIMEOUT_MS = Number(process.env.TEST_IDLE_MS ?? 10 * 60 * 1000);

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.username) {
    const body: ApiError = { status: 'Error', message: MESSAGES.UNAUTHORIZED };
    res.status(401).json(body);
    return;
  }

  const now = Date.now();
  const lastActivity = req.session.lastActivity ?? now;
  if (now - lastActivity > IDLE_TIMEOUT_MS) {
    req.session.destroy(() => {
      const body: ApiError = { status: 'Error', message: MESSAGES.SESSION_EXPIRED };
      res.status(401).json(body);
    });
    return;
  }

  req.session.lastActivity = now;
  next();
}
