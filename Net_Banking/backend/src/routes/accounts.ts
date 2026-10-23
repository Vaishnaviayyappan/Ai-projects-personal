import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/requireAuth';

export const accountsRouter = Router();

accountsRouter.get('/accounts', requireAuth, async (_req: Request, res: Response) => {
  const result = await pool.query<{ account_no: string; type: string; customer: string; balance_rupees: number }>(
    'SELECT account_no, type, customer, balance_rupees FROM accounts ORDER BY account_no',
  );
  res.status(200).json(result.rows);
});
