import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { transferConfirm } from '../api';
import { TransferResponse } from '@netbank/shared';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 120;

interface OtpModalProps {
  otpRef: string;
  onClose: () => void;
  onSuccess: (response: TransferResponse) => void;
}

export function OtpModal({ otpRef, onClose, onSuccess }: OtpModalProps): JSX.Element {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, rawValue: string): void => {
    const digitsOnly = rawValue.replace(/\D/g, '');

    if (digitsOnly.length <= 1) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = digitsOnly;
        return next;
      });
      if (digitsOnly && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }

    // More than one character arrived at once (paste, or an automated test's
    // .fill()) — distribute the digits across this input and the ones after it.
    setDigits((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const char of digitsOnly) {
        if (cursor >= OTP_LENGTH) break;
        next[cursor] = char;
        cursor += 1;
      }
      return next;
    });
    const lastFilled = Math.min(index + digitsOnly.length, OTP_LENGTH) - 1;
    inputRefs.current[lastFilled]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;
  const isExpired = secondsLeft <= 0;

  const handleConfirm = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    const result = await transferConfirm({ otpRef, otp });
    setIsSubmitting(false);
    if ('message' in result) {
      setError(result.message);
      return;
    }
    onSuccess(result);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const countdownLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-modal-title"
        data-testid="otp-modal"
        className="animate-fade-slide-in w-full max-w-sm rounded-card bg-white p-6 shadow-md"
      >
        <div className="flex items-start justify-between">
          <h2 id="otp-modal-title" className="text-lg font-semibold text-navy">
            Verify this transfer
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-input p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Enter the 6-digit code to confirm this transfer.</p>

        <div className="mt-5 flex justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              data-testid={`otp-digit-${index}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isSubmitting}
              className="h-12 w-10 rounded-input border border-slate-300 text-center text-lg font-semibold tabular-nums text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            />
          ))}
        </div>

        <p className={`mt-3 text-xs ${isExpired ? 'text-error' : 'text-slate-400'}`}>
          {isExpired ? 'Code expired — request a new transfer to try again.' : `Expires in ${countdownLabel}`}
        </p>

        <button
          type="button"
          data-testid="otp-confirm"
          onClick={() => void handleConfirm()}
          disabled={!isComplete || isSubmitting}
          className="mt-4 w-full rounded-input bg-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          Confirm
        </button>

        {error && (
          <div
            role="alert"
            className="error animate-fade-slide-in mt-3 flex items-start gap-2 rounded-input border border-error/20 bg-error-bg px-3 py-2 text-sm text-error"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">Demo OTP: 123456</p>
      </div>
    </div>
  );
}
