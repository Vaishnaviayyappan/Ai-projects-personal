import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/requireAuth';

export const transactionsRouter = Router();

transactionsRouter.get('/transactions', requireAuth, async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT txn_ref, from_account, to_account, amount, remarks, created_at
     FROM transactions ORDER BY created_at DESC LIMIT 10`,
  );
  res.status(200).json(result.rows);
});
