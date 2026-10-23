import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Lock, User, AlertCircle, Info } from 'lucide-react';
import { login, consumeSessionExpiredMessage } from '../api';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasConsumedBannerRef = useRef(false);

  useEffect(() => {
    // consumeSessionExpiredMessage() both reads AND clears sessionStorage, so
    // it isn't safe to call from a useState lazy initializer or a bare
    // useEffect body: React 18 StrictMode double-invokes both in development,
    // and the second call would find the value already cleared. Guard with a
    // ref so the read+clear genuinely happens exactly once.
    if (hasConsumedBannerRef.current) return;
    hasConsumedBannerRef.current = true;
    setInfoBanner(consumeSessionExpiredMessage());
  }, []);

  const handleLogin = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    const result = await login(username, password);
    setIsSubmitting(false);
    if ('message' in result) {
      setError(result.message);
      return;
    }
    navigate('/transfer');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy-dark to-slate-900 px-4 font-sans">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy">
            <Landmark className="h-6 w-6 text-teal" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-navy">NetBank</h1>
          <p className="text-sm text-slate-500">Sign in to manage your accounts</p>
        </div>

        {infoBanner && (
          <div
            role="status"
            className="info animate-fade-slide-in mb-4 flex items-start gap-2 rounded-input border border-teal/20 bg-teal/5 px-3 py-2 text-sm text-teal-dark"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{infoBanner}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
              Username
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full rounded-input border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-input border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              />
            </div>
          </div>

          <button
            onClick={() => void handleLogin()}
            disabled={isSubmitting}
            className="w-full rounded-input bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-60"
          >
            Login
          </button>

          {error && (
            <div
              role="alert"
              className="error animate-fade-slide-in flex items-start gap-2 rounded-input border border-error/20 bg-error-bg px-3 py-2 text-sm text-error"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">Demo: john / Password123</p>
      </div>
    </div>
  );
}
