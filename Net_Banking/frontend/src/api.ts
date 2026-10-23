import { ApiError, OtpConfirmRequest, TransferRequest, TransferResponse, TransferResult } from '@netbank/shared';

export interface Account {
  account_no: string;
  type: string;
  customer: string;
  balance_rupees: number;
}

export interface Transaction {
  txn_ref: string;
  from_account: string;
  to_account: string;
  amount: number;
  remarks: string | null;
  created_at: string;
}

export interface LoginResponse {
  username: string;
}

export interface Beneficiary {
  id: number;
  account_no: string;
  nickname: string;
  added_at: string;
}

export interface LimitsResponse {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
}

export interface AuditEntry {
  id: number;
  username: string;
  action: string;
  details: Record<string, unknown>;
  at: string;
}

const SESSION_EXPIRED_KEY = 'netbank:sessionExpiredMessage';

export function consumeSessionExpiredMessage(): string | null {
  const message = sessionStorage.getItem(SESSION_EXPIRED_KEY);
  if (message) {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  }
  return message;
}

// The dashboard fires several authenticated requests in parallel
// (Promise.all). Once a session is actually gone server-side, the first of
// those to be handled destroys it (and correctly reports SESSION_EXPIRED);
// the rest arrive against an already-destroyed session and get the generic
// UNAUTHORIZED message instead. This flag makes the first 401 observed
// client-side "win" so a later, less-specific message can't overwrite it.
let hasHandledUnauthorized = false;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init });
  const body = (await res.json()) as T;

  if (res.status === 401 && path !== '/api/login' && !hasHandledUnauthorized) {
    hasHandledUnauthorized = true;
    const maybeError = body as unknown as Partial<ApiError>;
    if (typeof maybeError.message === 'string') {
      sessionStorage.setItem(SESSION_EXPIRED_KEY, maybeError.message);
    }
    if (window.location.pathname !== '/') {
      window.location.assign('/');
    }
  }

  return body;
}

export async function login(username: string, password: string): Promise<LoginResponse | ApiError> {
  return request<LoginResponse | ApiError>('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function transfer(request_: TransferRequest, idempotencyKey: string): Promise<TransferResult> {
  return request<TransferResult>('/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(request_),
  });
}

export async function transferConfirm(body: OtpConfirmRequest): Promise<TransferResponse | ApiError> {
  return request<TransferResponse | ApiError>('/api/transfer/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getAccounts(): Promise<Account[] | ApiError> {
  return request<Account[] | ApiError>('/api/accounts');
}

export async function getTransactions(): Promise<Transaction[] | ApiError> {
  return request<Transaction[] | ApiError>('/api/transactions');
}

export async function getBeneficiaries(): Promise<Beneficiary[] | ApiError> {
  return request<Beneficiary[] | ApiError>('/api/beneficiaries');
}

export async function addBeneficiary(accountNo: string, nickname: string): Promise<Beneficiary | ApiError> {
  return request<Beneficiary | ApiError>('/api/beneficiaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_no: accountNo, nickname }),
  });
}

export async function deleteBeneficiary(id: number): Promise<{ ok: true } | ApiError> {
  return request<{ ok: true } | ApiError>(`/api/beneficiaries/${id}`, { method: 'DELETE' });
}

export async function getLimits(account: string): Promise<LimitsResponse | ApiError> {
  return request<LimitsResponse | ApiError>(`/api/limits?account=${encodeURIComponent(account)}`);
}

export async function getAudit(): Promise<AuditEntry[] | ApiError> {
  return request<AuditEntry[] | ApiError>('/api/audit');
}

export function buildStatementUrl(account: string, from: string, to: string): string {
  const params = new URLSearchParams({ account, from, to });
  return `/api/statement.csv?${params.toString()}`;
}
