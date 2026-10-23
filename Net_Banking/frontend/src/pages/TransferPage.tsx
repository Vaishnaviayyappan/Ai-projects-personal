import { useEffect, useRef, useState } from 'react';
import { ArrowRightLeft, CheckCircle2, AlertCircle, Loader2, Inbox } from 'lucide-react';
import { TransferRequest, TransferResponse } from '@netbank/shared';
import {
  Account,
  Beneficiary,
  LimitsResponse,
  Transaction,
  getAccounts,
  getBeneficiaries,
  getLimits,
  getTransactions,
  transfer,
} from '../api';
import { AccountCard } from '../components/AccountCard';
import { TransactionRow } from '../components/TransactionRow';
import { OtpModal } from '../components/OtpModal';
import { LimitMeter } from '../components/LimitMeter';
import { Sparkline } from '../components/Sparkline';
import { Skeleton } from '../components/Skeleton';
import { computeLast7DayDebitTotals } from '../lib/dailyTotals';

const PRIMARY_ACCOUNT = 'SB1001';

const ACCOUNT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'SB1001', label: 'SB1001 — Savings' },
  { value: 'CA2001', label: 'CA2001 — Current' },
];

export function TransferPage(): JSX.Element {
  const [fromAccount, setFromAccount] = useState('SB1001');
  const [toAccount, setToAccount] = useState('CA2001');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [limits, setLimits] = useState<LimitsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpRef, setOtpRef] = useState<string | null>(null);

  const submittingRef = useRef(false);

  const refreshDashboard = async (): Promise<void> => {
    // Check auth with a single request first, rather than firing all four
    // dashboard calls at once. If the session is invalid/expired, a burst of
    // concurrent requests can race: one may land after an earlier one has
    // already destroyed the session server-side and report the generic
    // "please log in" message instead of the more specific "session expired"
    // one, and whichever the browser processes first wins. Failing fast on a
    // single call means only that one request could ever hit this race.
    const accountsResult = await getAccounts();
    if (!Array.isArray(accountsResult)) {
      return;
    }
    setAccounts(accountsResult);

    const [transactionsResult, beneficiariesResult, limitsResult] = await Promise.all([
      getTransactions(),
      getBeneficiaries(),
      getLimits(fromAccount),
    ]);
    if (Array.isArray(transactionsResult)) {
      setTransactions(transactionsResult);
    }
    if (Array.isArray(beneficiariesResult)) {
      setBeneficiaries(beneficiariesResult);
    }
    if (limitsResult && 'dailyLimit' in limitsResult) {
      setLimits(limitsResult);
    }
  };

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await refreshDashboard();
      setIsLoading(false);
    })();
    // Re-fetch limits (among the rest of the dashboard) whenever the account the meter tracks changes.
  }, [fromAccount]);

  const handleTransfer = async (): Promise<void> => {
    if (submittingRef.current) return; // guards rapid double-clicks: refs update synchronously, unlike React state
    submittingRef.current = true;
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const idempotencyKey =
      typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

    const request: TransferRequest = {
      fromAccount,
      toAccount,
      amount: Number(amount),
      remarks: remarks || undefined,
    };

    try {
      const result = await transfer(request, idempotencyKey);
      if (result.status === 'OtpRequired') {
        setOtpRef(result.otpRef);
        return;
      }
      if (result.status === 'Error') {
        setErrorMessage(result.message);
        return;
      }
      setSuccessMessage(`Transfer Successful — ${result.transactionId}`);
      await refreshDashboard();
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleOtpSuccess = (response: TransferResponse): void => {
    setOtpRef(null);
    setSuccessMessage(`Transfer Successful — ${response.transactionId}`);
    void refreshDashboard();
  };

  const recentTransactions = transactions.slice(0, 5);
  const toAccountOptions = [
    ...ACCOUNT_OPTIONS,
    ...beneficiaries.map((beneficiary) => ({
      value: beneficiary.account_no,
      label: `${beneficiary.nickname} — ${beneficiary.account_no}`,
    })),
  ];
  const sparklineTotals = computeLast7DayDebitTotals(transactions, PRIMARY_ACCOUNT);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-navy">Fund Transfer</h1>
      <p className="mt-1 text-sm text-slate-500">Move money between your own accounts, instantly.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-card border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="space-y-5">
            <div>
              <label htmlFor="fromAccount" className="mb-1 block text-sm font-medium text-slate-700">
                From Account
              </label>
              <select
                id="fromAccount"
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full rounded-input border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                {ACCOUNT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">The account to debit.</p>
            </div>

            <div>
              <label htmlFor="toAccount" className="mb-1 block text-sm font-medium text-slate-700">
                To Account
              </label>
              <select
                id="toAccount"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full rounded-input border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                {toAccountOptions.map((option) => (
                  <option key={`${option.value}-${option.label}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">The account to credit — including saved beneficiaries.</p>
            </div>

            <div>
              <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">
                Amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  ₹
                </span>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-input border border-slate-300 py-2 pl-7 pr-3 text-sm tabular-nums text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Whole rupees only. Transfers over ₹10,000 need a one-time code.</p>
            </div>

            <div>
              <label htmlFor="remarks" className="mb-1 block text-sm font-medium text-slate-700">
                Remarks
              </label>
              <input
                id="remarks"
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-input border border-slate-300 py-2 px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              />
              <p className="mt-1 text-xs text-slate-400">Optional note for this transfer.</p>
            </div>

            <button
              onClick={() => void handleTransfer()}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-input bg-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
              )}
              Transfer
            </button>

            {successMessage && (
              <div
                role="status"
                className="success animate-fade-slide-in flex items-start gap-2 rounded-input border border-success/20 bg-success-bg px-3 py-2 text-sm text-success"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="error animate-fade-slide-in flex items-start gap-2 rounded-input border border-error/20 bg-error-bg px-3 py-2 text-sm text-error"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : (
              accounts.map((account) => <AccountCard key={account.account_no} account={account} />)
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            limits && <LimitMeter limits={limits} />
          )}

          <div className="rounded-card border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Spending, last 7 days</h2>
              <Sparkline dailyTotals={sparklineTotals} />
            </div>
          </div>

          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
            <div data-testid="txn-history" className="mt-2">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-slate-400">
                  <Inbox className="h-8 w-8" aria-hidden="true" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentTransactions.map((txn) => (
                    <TransactionRow key={txn.txn_ref} txn={txn} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {otpRef && (
        <OtpModal otpRef={otpRef} onClose={() => setOtpRef(null)} onSuccess={handleOtpSuccess} />
      )}
    </div>
  );
}
