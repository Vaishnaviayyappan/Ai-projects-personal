import { pool } from './db';

export const DAILY_LIMIT_RUPEES = 500000;

export async function getTodayTotal(fromAccount: string): Promise<number> {
  const result = await pool.query<{ total: string | null }>(
    `SELECT SUM(amount)::bigint AS total FROM transactions
     WHERE from_account = $1 AND created_at::date = CURRENT_DATE`,
    [fromAccount],
  );
  return Number(result.rows[0]?.total ?? 0);
}
