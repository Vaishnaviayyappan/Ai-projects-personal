import { Router, Request, Response } from 'express';
import { MESSAGES } from '../messages';
import { requireAuth } from '../middleware/requireAuth';
import { pool } from '../db';
import { DAILY_LIMIT_RUPEES, getTodayTotal } from '../dailyLimit';

export const limitsRouter = Router();

limitsRouter.get('/limits', requireAuth, async (req: Request, res: Response) => {
  const account = typeof req.query.account === 'string' ? req.query.account : '';

  const accountResult = await pool.query('SELECT 1 FROM accounts WHERE account_no = $1', [account]);
  if (accountResult.rows.length === 0) {
    res.status(400).json({ status: 'Error', message: MESSAGES.INVALID_ACCOUNT });
    return;
  }

  const usedToday = await getTodayTotal(account);
  res.status(200).json({
    dailyLimit: DAILY_LIMIT_RUPEES,
    usedToday,
    remaining: Math.max(0, DAILY_LIMIT_RUPEES - usedToday),
  });
});
