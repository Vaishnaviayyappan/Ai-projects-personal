import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { buildStatementUrl } from '../api';
import { parseStatementCsv, StatementRow } from '../lib/csv';
import { formatINR } from '../lib/format';
import { Skeleton } from '../components/Skeleton';

const ACCOUNT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'SB1001', label: 'SB1001 — Savings' },
  { value: 'CA2001', label: 'CA2001 — Current' },
];

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function StatementsPage(): JSX.Element {
  const [account, setAccount] = useState('SB1001');
  const [from, setFrom] = useState(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return toDateInputValue(thirtyDaysAgo);
  });
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      const res = await fetch(buildStatementUrl(account, from, to), { credentials: 'same-origin' });
      const text = await res.text();
      setRows(parseStatementCsv(text));
      setIsLoading(false);
    })();
  }, [account, from, to]);

  const handleDownload = (): void => {
    const link = document.createElement('a');
    link.href = buildStatementUrl(account, from, to);
    link.download = `statement-${account}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-navy">Statements</h1>
      <p className="mt-1 text-sm text-slate-500">Preview and download your account statement.</p>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="statementAccount" className="mb-1 block text-sm font-medium text-slate-700">
              Account
            </label>
            <select
              id="statementAccount"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full rounded-input border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              {ACCOUNT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="statementFrom" className="mb-1 block text-sm font-medium text-slate-700">
              From
            </label>
            <input
              id="statementFrom"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-input border border-slate-300 py-2 px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            />
          </div>
          <div>
            <label htmlFor="statementTo" className="mb-1 block text-sm font-medium text-slate-700">
              To
            </label>
            <input
              id="statementTo"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-input border border-slate-300 py-2 px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            />
          </div>
        </div>

        <button
          type="button"
          data-testid="download-csv"
          onClick={handleDownload}
          className="mt-4 flex items-center gap-2 rounded-input bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download CSV
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Preview</h2>
        {isLoading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-slate-400">
            <FileText className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm">No transactions in this range</p>
          </div>
        ) : (
          <table className="mt-3 w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Counterparty</th>
                <th className="py-2 pr-3 font-medium">Remarks</th>
                <th className="py-2 pr-3 text-right font-medium">Amount</th>
                <th className="py-2 pr-3 text-right font-medium">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.txn_ref}>
                  <td className="py-2 pr-3 tabular-nums">{row.date}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.type === 'DEBIT' ? 'bg-error-bg text-error' : 'bg-success-bg text-success'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{row.counterparty}</td>
                  <td className="py-2 pr-3 text-slate-500">{row.remarks || '—'}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatINR(row.amount)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatINR(row.balance_after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
