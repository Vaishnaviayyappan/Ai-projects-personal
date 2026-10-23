import { useEffect, useState } from 'react';
import { AlertCircle, Trash2, Users } from 'lucide-react';
import { Beneficiary, addBeneficiary, deleteBeneficiary, getBeneficiaries } from '../api';
import { useToast } from '../components/ToastProvider';
import { Skeleton } from '../components/Skeleton';

export function BeneficiariesPage(): JSX.Element {
  const { showToast } = useToast();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountNo, setAccountNo] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const refresh = async (): Promise<void> => {
    const result = await getBeneficiaries();
    if (Array.isArray(result)) {
      setBeneficiaries(result);
    }
  };

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await refresh();
      setIsLoading(false);
    })();
  }, []);

  const handleAdd = async (): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await addBeneficiary(accountNo, nickname);
    setIsSubmitting(false);
    if ('message' in result) {
      setErrorMessage(result.message);
      return;
    }
    setAccountNo('');
    setNickname('');
    await refresh();
    showToast(`${result.nickname} added as a beneficiary`, 'success');
  };

  const handleDelete = async (id: number): Promise<void> => {
    const target = beneficiaries.find((b) => b.id === id);
    setConfirmingId(null);
    const result = await deleteBeneficiary(id);
    if ('message' in result) {
      showToast(result.message, 'error');
      return;
    }
    await refresh();
    showToast(`${target?.nickname ?? 'Beneficiary'} removed`, 'info');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-navy">Beneficiaries</h1>
      <p className="mt-1 text-sm text-slate-500">Save accounts you transfer to often.</p>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="benAccount" className="mb-1 block text-sm font-medium text-slate-700">
              Account Number
            </label>
            <input
              id="benAccount"
              type="text"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              className="w-full rounded-input border border-slate-300 py-2 px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            />
          </div>
          <div>
            <label htmlFor="benNickname" className="mb-1 block text-sm font-medium text-slate-700">
              Nickname
            </label>
            <input
              id="benNickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-input border border-slate-300 py-2 px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            />
          </div>
        </div>
        <button
          onClick={() => void handleAdd()}
          disabled={isSubmitting}
          className="mt-4 rounded-input bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Beneficiary
        </button>

        {errorMessage && (
          <div
            role="alert"
            className="error animate-fade-slide-in mt-4 flex items-start gap-2 rounded-input border border-error/20 bg-error-bg px-3 py-2 text-sm text-error"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Saved Beneficiaries</h2>
        <div data-testid="beneficiary-list" className="mt-2">
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : beneficiaries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-slate-400">
              <Users className="h-8 w-8" aria-hidden="true" />
              <p className="text-sm">No beneficiaries saved yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {beneficiaries.map((beneficiary) => (
                <li key={beneficiary.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{beneficiary.nickname}</p>
                    <p className="text-xs text-slate-500">{beneficiary.account_no}</p>
                  </div>
                  {confirmingId === beneficiary.id ? (
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="text-slate-500">Remove?</span>
                      <button
                        onClick={() => void handleDelete(beneficiary.id)}
                        className="rounded-input bg-error px-2 py-1 font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="rounded-input border border-slate-300 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Remove ${beneficiary.nickname}`}
                      onClick={() => setConfirmingId(beneficiary.id)}
                      className="shrink-0 rounded-input p-2 text-slate-400 transition-colors hover:bg-error-bg hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
