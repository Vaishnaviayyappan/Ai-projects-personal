import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatINR } from '../lib/format';
import type { Transaction } from '../api';

const PRIMARY_ACCOUNT = 'SB1001';

interface TransactionRowProps {
  txn: Transaction;
}

export function TransactionRow({ txn }: TransactionRowProps): JSX.Element {
  const isDebit = txn.from_account === PRIMARY_ACCOUNT;
  const counterparty = isDebit ? txn.to_account : txn.from_account;
  const date = new Date(txn.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <li className="flex items-center gap-3 py-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isDebit ? 'bg-error-bg text-error' : 'bg-success-bg text-success'
        }`}
        aria-hidden="true"
      >
        {isDebit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-slate-800">{counterparty}</span>
          <span
            className={`shrink-0 text-sm font-semibold tabular-nums ${isDebit ? 'text-error' : 'text-success'}`}
          >
            {isDebit ? '−' : '+'}
            {formatINR(txn.amount)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate">{txn.remarks ?? 'No remarks'}</span>
          <span className="shrink-0">{date}</span>
        </div>
      </div>
    </li>
  );
}
