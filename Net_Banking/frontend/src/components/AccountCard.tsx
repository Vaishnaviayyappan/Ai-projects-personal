import { formatINR } from '../lib/format';
import type { Account } from '../api';

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps): JSX.Element {
  const isSavings = account.type === 'Savings';

  return (
    <div
      className={`rounded-card border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
        isSavings ? 'border-navy/15' : 'border-teal/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{account.account_no}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isSavings ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal-dark'
          }`}
        >
          {account.type}
        </span>
      </div>
      <div
        data-testid={`balance-${account.account_no}`}
        className="mt-3 text-3xl font-bold tabular-nums text-slate-900"
      >
        {formatINR(account.balance_rupees)}
      </div>
    </div>
  );
}
