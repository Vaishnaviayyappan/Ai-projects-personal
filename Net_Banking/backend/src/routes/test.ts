import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { clearIdempotencyCache, clearOtpState } from './transfer';
import { clearLoginThrottle } from './auth';
import { requireAuth } from '../middleware/requireAuth';

const SEED_BALANCES: Record<string, number> = {
  SB1001: 50000,
  CA2001: 20000,
};

interface ResetBody {
  balanceOverride?: {
    account?: unknown;
    balance?: unknown;
  };
}

export const testRouter = Router();

testRouter.post('/test/reset', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM transactions');
    await client.query('DELETE FROM beneficiaries');
    await client.query('DELETE FROM audit_log');
    for (const [accountNo, balance] of Object.entries(SEED_BALANCES)) {
      await client.query('UPDATE accounts SET balance_rupees = $1 WHERE account_no = $2', [balance, accountNo]);
    }

    const body = req.body as ResetBody;
    const override = body.balanceOverride;
    if (override && typeof override.account === 'string' && typeof override.balance === 'number') {
      await client.query('UPDATE accounts SET balance_rupees = $1 WHERE account_no = $2', [
        override.balance,
        override.account,
      ]);
    }

    await client.query('COMMIT');
    clearIdempotencyCache();
    clearOtpState();
    clearLoginThrottle();
    res.status(200).json({ ok: true });
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ status: 'Error', message: 'Reset failed' });
  } finally {
    client.release();
  }
});

// Fast-forwards the CALLER's own session to idle-expired, so the next
// authenticated request 401s with SESSION_EXPIRED. Used instead of a real
// wait (or a shortened global TEST_IDLE_MS) because every E2E test in the
// chromium project shares one storageState session cookie — actually letting
// that shared session go idle would break every other test.
testRouter.post('/test/expire-session', requireAuth, (req: Request, res: Response) => {
  req.session.lastActivity = 0;
  res.status(200).json({ ok: true });
});
