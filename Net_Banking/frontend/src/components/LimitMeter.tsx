import { formatINR } from '../lib/format';
import { LimitsResponse } from '../api';

interface LimitMeterProps {
  limits: LimitsResponse;
}

export function LimitMeter({ limits }: LimitMeterProps): JSX.Element {
  const percentage = limits.dailyLimit > 0 ? Math.min(100, (limits.usedToday / limits.dailyLimit) * 100) : 0;
  const level = percentage > 90 ? 'red' : percentage > 70 ? 'amber' : 'teal';
  const barClass = level === 'red' ? 'bg-error' : level === 'amber' ? 'bg-warning' : 'bg-teal';
  const textClass = level === 'red' ? 'text-error' : level === 'amber' ? 'text-warning' : 'text-teal-dark';

  return (
    <div className="rounded-card border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Daily Transfer Limit</h2>
        <span className={`text-xs font-semibold ${textClass}`}>{percentage.toFixed(0)}%</span>
      </div>
      <div
        data-testid="limit-meter"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Daily transfer limit used"
        className={`limit-meter-${level} mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100`}
      >
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs tabular-nums text-slate-500">
        <span>{formatINR(limits.usedToday)} used</span>
        <span>{formatINR(limits.dailyLimit)} limit</span>
      </div>
    </div>
  );
}
