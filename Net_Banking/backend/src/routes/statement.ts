import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { MESSAGES } from '../messages';
import { requireAuth } from '../middleware/requireAuth';

interface StatementRow {
  txn_ref: string;
  created_at: string;
  type: 'DEBIT' | 'CREDIT';
  counterparty: string;
  remarks: string | null;
  amount: number;
  balance_after: number;
}

export const statementRouter = Router();

statementRouter.get('/statement.csv', requireAuth, async (req: Request, res: Response) => {
  const account = typeof req.query.account === 'string' ? req.query.account : '';
  const from = typeof req.query.from === 'string' ? req.query.from : '';
  const to = typeof req.query.to === 'string' ? req.query.to : '';

  const accountResult = await pool.query<{ balance_rupees: number }>(
    'SELECT balance_rupees FROM accounts WHERE account_no = $1',
    [account],
  );
  const currentBalance = accountResult.rows[0]?.balance_rupees;
  if (currentBalance === undefined) {
    res.status(400).json({ status: 'Error', message: MESSAGES.INVALID_ACCOUNT });
    return;
  }

  // balance_after is computed entirely in SQL via window functions: the
  // ledger CTE runs the running SUM over the account's FULL transaction
  // history (unfiltered), so the date-range filter in the outer query never
  // distorts the cumulative balance of the rows it keeps.
  const result = await pool.query<StatementRow>(
    `WITH ledger AS (
       SELECT
         txn_ref,
         created_at,
         CASE WHEN from_account = $1 THEN 'DEBIT' ELSE 'CREDIT' END AS type,
         CASE WHEN from_account = $1 THEN to_account ELSE from_account END AS counterparty,
         remarks,
         amount,
         CASE WHEN from_account = $1 THEN -amount ELSE amount END AS delta
       FROM transactions
       WHERE from_account = $1 OR to_account = $1
     ),
     running AS (
       SELECT
         txn_ref,
         created_at,
         type,
         counterparty,
         remarks,
         amount,
         ($2::int - SUM(delta) OVER () + SUM(delta) OVER (ORDER BY created_at, txn_ref))::int AS balance_after
       FROM ledger
     )
     SELECT txn_ref, created_at, type, counterparty, remarks, amount, balance_after
     FROM running
     WHERE created_at::date BETWEEN $3::date AND $4::date
     ORDER BY created_at`,
    [account, currentBalance, from, to],
  );

  const header = 'txn_ref,date,type,counterparty,remarks,amount,balance_after';
  const rows = result.rows.map((row) => {
    const date = new Date(row.created_at).toISOString().slice(0, 10);
    const remarks = (row.remarks ?? '').replace(/"/g, '""');
    return `${row.txn_ref},${date},${row.type},${row.counterparty},"${remarks}",${row.amount},${row.balance_after}`;
  });
  const csv = `${[header, ...rows].join('\n')}\n`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${account}.csv"`);
  res.status(200).send(csv);
});
