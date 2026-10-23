import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db';
import { MESSAGES } from '../messages';
import { writeAudit } from '../audit';
import { ApiError } from '@netbank/shared';

interface LoginBody {
  username?: unknown;
  password?: unknown;
}

const THROTTLE_WINDOW_MS = 15 * 60 * 1000;
const THROTTLE_MAX_ATTEMPTS = 5;

interface ThrottleEntry {
  count: number;
  windowStart: number;
}

const loginThrottle = new Map<string, ThrottleEntry>();

export function clearLoginThrottle(): void {
  loginThrottle.clear();
}

function isThrottled(username: string): boolean {
  const entry = loginThrottle.get(username);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > THROTTLE_WINDOW_MS) {
    loginThrottle.delete(username);
    return false;
  }
  return entry.count >= THROTTLE_MAX_ATTEMPTS;
}

function recordFailure(username: string): void {
  const entry = loginThrottle.get(username);
  if (!entry || Date.now() - entry.windowStart > THROTTLE_WINDOW_MS) {
    loginThrottle.set(username, { count: 1, windowStart: Date.now() });
  } else {
    entry.count += 1;
  }
}

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
  const body = req.body as LoginBody;
  const username = typeof body.username === 'string' ? body.username : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (isThrottled(username)) {
    await writeAudit(username, 'failed_login', { reason: 'throttled' });
    const error: ApiError = { status: 'Error', message: MESSAGES.TOO_MANY_ATTEMPTS };
    res.status(429).json(error);
    return;
  }

  const result = await pool.query<{ username: string; password_hash: string }>(
    'SELECT username, password_hash FROM users WHERE username = $1',
    [username],
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    recordFailure(username);
    await writeAudit(username, 'failed_login', { reason: 'invalid_credentials' });
    const error: ApiError = { status: 'Error', message: MESSAGES.INVALID_CREDENTIALS };
    res.status(401).json(error);
    return;
  }

  loginThrottle.delete(username);
  req.session.username = user.username;
  req.session.lastActivity = Date.now();
  await writeAudit(user.username, 'login', {});
  res.status(200).json({ username: user.username });
});

authRouter.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.status(200).json({ ok: true });
  });
});
