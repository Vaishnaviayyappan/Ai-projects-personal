import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/requireAuth';

export const auditRouter = Router();

auditRouter.get('/audit', requireAuth, async (req: Request, res: Response) => {
  const username = req.session.username as string;
  const result = await pool.query(
    'SELECT id, username, action, details, at FROM audit_log WHERE username = $1 ORDER BY at DESC LIMIT 20',
    [username],
  );
  res.status(200).json(result.rows);
});
