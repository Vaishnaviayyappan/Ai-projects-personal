import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.PGHOST ?? 'localhost',
  port: Number(process.env.PGPORT ?? 5434),
  user: process.env.PGUSER ?? 'netbank',
  password: process.env.PGPASSWORD ?? 'netbank',
  database: process.env.PGDATABASE ?? 'netbank',
});
