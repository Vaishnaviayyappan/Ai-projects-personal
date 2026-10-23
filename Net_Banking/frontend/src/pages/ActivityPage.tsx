import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { AuditEntry, getAudit } from '../api';
import { AuditEntryRow } from '../components/AuditEntryRow';
import { Skeleton } from '../components/Skeleton';

export function ActivityPage(): JSX.Element {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      const result = await getAudit();
      if (Array.isArray(result)) {
        setEntries(result);
      }
      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-navy">Activity</h1>
      <p className="mt-1 text-sm text-slate-500">Recent account activity, most recent first.</p>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-6 shadow-sm">
        <div data-testid="audit-list">
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-slate-400">
              <History className="h-8 w-8" aria-hidden="true" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <AuditEntryRow key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
