import { ArrowRightLeft, LogIn, ShieldAlert, ShieldCheck, UserMinus, UserPlus, History } from 'lucide-react';
import { AuditEntry } from '../api';
import { formatRelativeTime } from '../lib/relativeTime';

const ACTION_ICON: Record<string, typeof History> = {
  login: LogIn,
  failed_login: ShieldAlert,
  transfer: ArrowRightLeft,
  otp_confirm: ShieldCheck,
  beneficiary_add: UserPlus,
  beneficiary_delete: UserMinus,
};

const ACTION_LABEL: Record<string, string> = {
  login: 'Logged in',
  failed_login: 'Failed login attempt',
  transfer: 'Transfer completed',
  otp_confirm: 'OTP verified',
  beneficiary_add: 'Beneficiary added',
  beneficiary_delete: 'Beneficiary removed',
};

const ACTION_COLOR: Record<string, string> = {
  login: 'bg-success-bg text-success',
  failed_login: 'bg-error-bg text-error',
  transfer: 'bg-navy/10 text-navy',
  otp_confirm: 'bg-teal/10 text-teal-dark',
  beneficiary_add: 'bg-teal/10 text-teal-dark',
  beneficiary_delete: 'bg-slate-100 text-slate-500',
};

interface AuditEntryRowProps {
  entry: AuditEntry;
}

export function AuditEntryRow({ entry }: AuditEntryRowProps): JSX.Element {
  const Icon = ACTION_ICON[entry.action] ?? History;
  const label = ACTION_LABEL[entry.action] ?? entry.action;
  const colorClass = ACTION_COLOR[entry.action] ?? 'bg-slate-100 text-slate-500';
  const detailsText = Object.entries(entry.details)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');

  return (
    <li className="flex items-start gap-3 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-800">{label}</span>
          <span className="shrink-0 text-xs text-slate-400">{formatRelativeTime(entry.at)}</span>
        </div>
        {detailsText && <p className="mt-0.5 truncate text-xs text-slate-500">{detailsText}</p>}
      </div>
    </li>
  );
}
