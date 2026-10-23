import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { MESSAGES } from '../messages';
import { requireAuth } from '../middleware/requireAuth';
import { writeAudit } from '../audit';
import { DAILY_LIMIT_RUPEES, getTodayTotal } from '../dailyLimit';
import { ApiError, OtpConfirmRequest, TransferResponse, TransferResult } from '@netbank/shared';

// Amounts strictly greater than this require OTP step-up. Kept at 10000 so an
// exact-10000 transfer still completes directly (unchanged legacy behavior).
export const OTP_THRESHOLD_RUPEES = 10000;
const OTP_CODE = '123456';
const OTP_TTL_MS = 120_000;

// In-memory idempotency cache: repeated Idempotency-Key returns the original
// response instead of running the transfer again. Fine for a single-process POC.
const idempotencyCache = new Map<string, { statusCode: number; body: TransferResult }>();

interface PendingOtp {
  fromAccount: string;
  toAccount: string;
  amount: number;
  remarks: string | null;
  username: string;
  expiresAt: number;
}

const pendingOtps = new Map<string, PendingOtp>();
// Keyed by otpRef: once a confirm succeeds, further confirms of the same
// otpRef (e.g. a double-clicked Confirm button) replay this instead of
// debiting twice.
const confirmedResults = new Map<string, TransferResponse>();

export function clearIdempotencyCache(): void {
  idempotencyCache.clear();
}

export function clearOtpState(): void {
  pendingOtps.clear();
  confirmedResults.clear();
}

interface TransferBody {
  fromAccount?: unknown;
  toAccount?: unknown;
  amount?: unknown;
  remarks?: unknown;
}

function generateTxnRef(): string {
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `TXN${digits}`;
}

function generateOtpRef(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `OTP${digits}`;
}

async function executeTransfer(
  fromAccount: string,
  toAccount: string,
  amount: number,
  remarks: string | null,
): Promise<TransferResponse> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let txnRef = generateTxnRef();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exists = await client.query('SELECT 1 FROM transactions WHERE txn_ref = $1', [txnRef]);
      if (exists.rows.length === 0) break;
      txnRef = generateTxnRef();
    }

    await client.query('UPDATE accounts SET balance_rupees = balance_rupees - $1 WHERE account_no = $2', [
      amount,
      fromAccount,
    ]);
    await client.query('UPDATE accounts SET balance_rupees = balance_rupees + $1 WHERE account_no = $2', [
      amount,
      toAccount,
    ]);
    await client.query(
      `INSERT INTO transactions (txn_ref, from_account, to_account, amount, remarks)
       VALUES ($1, $2, $3, $4, $5)`,
      [txnRef, fromAccount, toAccount, amount, remarks],
    );

    await client.query('COMMIT');
    return { status: 'Success', transactionId: txnRef };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export const transferRouter = Router();

transferRouter.post('/transfer', requireAuth, async (req: Request, res: Response) => {
  const idempotencyKey = req.header('Idempotency-Key');
  if (idempotencyKey) {
    const cached = idempotencyCache.get(idempotencyKey);
    if (cached) {
      res.status(cached.statusCode).json(cached.body);
      return;
    }
  }

  const body = req.body as TransferBody;
  const fromAccount = typeof body.fromAccount === 'string' ? body.fromAccount : '';
  const toAccount = typeof body.toAccount === 'string' ? body.toAccount : '';
  const amount = typeof body.amount === 'number' ? body.amount : NaN;
  const remarks = typeof body.remarks === 'string' ? body.remarks : null;
  const username = req.session.username as string;

  const respond = (statusCode: number, respBody: TransferResult): void => {
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, { statusCode, body: respBody });
    }
    res.status(statusCode).json(respBody);
  };

  const accountsResult = await pool.query<{ account_no: string; balance_rupees: number }>(
    'SELECT account_no, balance_rupees FROM accounts WHERE account_no IN ($1, $2)',
    [fromAccount, toAccount],
  );
  const fromRow = accountsResult.rows.find((row) => row.account_no === fromAccount);
  const toRow = accountsResult.rows.find((row) => row.account_no === toAccount);

  if (!fromRow || !toRow) {
    respond(400, { status: 'Error', message: MESSAGES.INVALID_ACCOUNT });
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    respond(400, { status: 'Error', message: MESSAGES.AMOUNT_NOT_POSITIVE });
    return;
  }

  if (amount > fromRow.balance_rupees) {
    respond(400, { status: 'Error', message: MESSAGES.INSUFFICIENT_BALANCE });
    return;
  }

  const todayTotal = await getTodayTotal(fromAccount);
  if (amount + todayTotal > DAILY_LIMIT_RUPEES) {
    respond(400, { status: 'Error', message: MESSAGES.DAILY_LIMIT_EXCEEDED });
    return;
  }

  if (amount > OTP_THRESHOLD_RUPEES) {
    const otpRef = generateOtpRef();
    pendingOtps.set(otpRef, {
      fromAccount,
      toAccount,
      amount,
      remarks,
      username,
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    respond(200, { status: 'OtpRequired', otpRef });
    return;
  }

  try {
    const response = await executeTransfer(fromAccount, toAccount, amount, remarks);
    await writeAudit(username, 'transfer', { transactionId: response.transactionId, amount });
    respond(200, response);
  } catch {
    respond(500, { status: 'Error', message: MESSAGES.SERVER_ERROR });
  }
});

transferRouter.post('/transfer/confirm', requireAuth, async (req: Request, res: Response) => {
  const body = req.body as Partial<OtpConfirmRequest>;
  const otpRef = typeof body.otpRef === 'string' ? body.otpRef : '';
  const otp = typeof body.otp === 'string' ? body.otp : '';
  const username = req.session.username as string;

  const alreadyConfirmed = confirmedResults.get(otpRef);
  if (alreadyConfirmed) {
    res.status(200).json(alreadyConfirmed);
    return;
  }

  const pending = pendingOtps.get(otpRef);
  if (!pending) {
    const error: ApiError = { status: 'Error', message: MESSAGES.OTP_EXPIRED };
    res.status(400).json(error);
    return;
  }

  if (Date.now() > pending.expiresAt) {
    pendingOtps.delete(otpRef);
    const error: ApiError = { status: 'Error', message: MESSAGES.OTP_EXPIRED };
    res.status(400).json(error);
    return;
  }

  if (otp !== OTP_CODE) {
    const error: ApiError = { status: 'Error', message: MESSAGES.INVALID_OTP };
    res.status(400).json(error);
    return;
  }

  // Defensive re-check: state may have changed since the OTP was issued.
  const accountResult = await pool.query<{ balance_rupees: number }>(
    'SELECT balance_rupees FROM accounts WHERE account_no = $1',
    [pending.fromAccount],
  );
  const currentBalance = accountResult.rows[0]?.balance_rupees ?? 0;
  if (pending.amount > currentBalance) {
    pendingOtps.delete(otpRef);
    const error: ApiError = { status: 'Error', message: MESSAGES.INSUFFICIENT_BALANCE };
    res.status(400).json(error);
    return;
  }

  const todayTotal = await getTodayTotal(pending.fromAccount);
  if (pending.amount + todayTotal > DAILY_LIMIT_RUPEES) {
    pendingOtps.delete(otpRef);
    const error: ApiError = { status: 'Error', message: MESSAGES.DAILY_LIMIT_EXCEEDED };
    res.status(400).json(error);
    return;
  }

  try {
    const response = await executeTransfer(pending.fromAccount, pending.toAccount, pending.amount, pending.remarks);
    pendingOtps.delete(otpRef);
    confirmedResults.set(otpRef, response);
    await writeAudit(username, 'otp_confirm', { transactionId: response.transactionId, amount: pending.amount });
    res.status(200).json(response);
  } catch {
    const error: ApiError = { status: 'Error', message: MESSAGES.SERVER_ERROR };
    res.status(500).json(error);
  }
});
