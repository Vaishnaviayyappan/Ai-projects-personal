import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { MESSAGES } from '../messages';
import { requireAuth } from '../middleware/requireAuth';
import { writeAudit } from '../audit';
import { ApiError } from '@netbank/shared';

interface BeneficiaryBody {
  account_no?: unknown;
  nickname?: unknown;
}

export const beneficiariesRouter = Router();

beneficiariesRouter.get('/beneficiaries', requireAuth, async (req: Request, res: Response) => {
  const username = req.session.username as string;
  const result = await pool.query(
    'SELECT id, account_no, nickname, added_at FROM beneficiaries WHERE owner_username = $1 ORDER BY added_at',
    [username],
  );
  res.status(200).json(result.rows);
});

beneficiariesRouter.post('/beneficiaries', requireAuth, async (req: Request, res: Response) => {
  const username = req.session.username as string;
  const body = req.body as BeneficiaryBody;
  const accountNo = typeof body.account_no === 'string' ? body.account_no : '';
  const nickname = typeof body.nickname === 'string' ? body.nickname : '';

  const accountResult = await pool.query('SELECT 1 FROM accounts WHERE account_no = $1', [accountNo]);
  if (accountResult.rows.length === 0) {
    const error: ApiError = { status: 'Error', message: MESSAGES.INVALID_ACCOUNT };
    res.status(400).json(error);
    return;
  }

  const duplicateResult = await pool.query(
    'SELECT 1 FROM beneficiaries WHERE owner_username = $1 AND account_no = $2',
    [username, accountNo],
  );
  if (duplicateResult.rows.length > 0) {
    const error: ApiError = { status: 'Error', message: MESSAGES.BENEFICIARY_ALREADY_ADDED };
    res.status(400).json(error);
    return;
  }

  const insertResult = await pool.query(
    `INSERT INTO beneficiaries (owner_username, account_no, nickname)
     VALUES ($1, $2, $3)
     RETURNING id, account_no, nickname, added_at`,
    [username, accountNo, nickname],
  );

  await writeAudit(username, 'beneficiary_add', { account_no: accountNo, nickname });
  res.status(201).json(insertResult.rows[0]);
});

beneficiariesRouter.delete('/beneficiaries/:id', requireAuth, async (req: Request, res: Response) => {
  const username = req.session.username as string;
  const id = Number(req.params.id);

  const deleteResult = await pool.query(
    'DELETE FROM beneficiaries WHERE id = $1 AND owner_username = $2 RETURNING id, account_no, nickname',
    [id, username],
  );

  if (deleteResult.rows.length === 0) {
    const error: ApiError = { status: 'Error', message: MESSAGES.BENEFICIARY_NOT_FOUND };
    res.status(404).json(error);
    return;
  }

  await writeAudit(username, 'beneficiary_delete', deleteResult.rows[0]);
  res.status(200).json({ ok: true });
});
