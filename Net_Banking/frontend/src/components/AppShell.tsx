import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Landmark, LayoutDashboard, ArrowRightLeft, Users, FileText, History, LogOut } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/transfer', icon: LayoutDashboard },
  { label: 'Fund Transfer', to: '/transfer', icon: ArrowRightLeft },
  { label: 'Beneficiaries', to: '/beneficiaries', icon: Users },
  { label: 'Statements', to: '/statements', icon: FileText },
  { label: 'Activity', to: '/activity', icon: History },
];

export function AppShell({ children }: AppShellProps): JSX.Element {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-appbg font-sans">
      <aside className="flex w-16 flex-col bg-navy text-white md:w-60">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-3 md:px-5">
          <Landmark className="h-6 w-6 shrink-0 text-teal" aria-hidden="true" />
          <span className="hidden text-lg font-semibold tracking-tight md:inline">NetBank</span>
        </div>
        <nav className="flex-1 py-4" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                title={item.label}
                className={`flex items-center gap-3 border-l-4 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal md:px-5 ${
                  isActive
                    ? 'border-teal bg-white/5 text-white'
                    : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end gap-3 border-b border-slate-200 bg-white px-4 md:px-8">
          <span className="hidden text-sm font-medium text-slate-700 sm:inline">John</span>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white"
            aria-hidden="true"
          >
            J
          </div>
          <button
            type="button"
            aria-label="Log out"
            className="rounded-input p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
