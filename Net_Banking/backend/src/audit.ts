import { pool } from './db';

export async function writeAudit(
  username: string,
  action: string,
  details: Record<string, unknown>,
): Promise<void> {
  await pool.query('INSERT INTO audit_log (username, action, details) VALUES ($1, $2, $3::jsonb)', [
    username,
    action,
    JSON.stringify(details),
  ]);
}
