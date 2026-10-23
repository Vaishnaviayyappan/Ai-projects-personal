CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  account_no TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  customer TEXT NOT NULL,
  balance_rupees INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  txn_ref TEXT UNIQUE NOT NULL,
  from_account TEXT NOT NULL REFERENCES accounts(account_no),
  to_account TEXT NOT NULL REFERENCES accounts(account_no),
  amount INTEGER NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id SERIAL PRIMARY KEY,
  owner_username TEXT NOT NULL REFERENCES users(username),
  account_no TEXT NOT NULL REFERENCES accounts(account_no),
  nickname TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_username, account_no)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Password is "Password123", hashed with bcryptjs (10 rounds).
INSERT INTO users (username, password_hash) VALUES
  ('john', '$2a$10$shLaMhhdZ7l6xldzd8JzpeUSYzU.J5eh9A6KUus171DPCAay17A9a')
ON CONFLICT (username) DO NOTHING;

INSERT INTO accounts (account_no, type, customer, balance_rupees) VALUES
  ('SB1001', 'Savings', 'john', 50000),
  ('CA2001', 'Current', 'john', 20000)
ON CONFLICT (account_no) DO NOTHING;
