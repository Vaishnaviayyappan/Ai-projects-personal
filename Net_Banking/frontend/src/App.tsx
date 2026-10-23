import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { TransferPage } from './pages/TransferPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { StatementsPage } from './pages/StatementsPage';
import { ActivityPage } from './pages/ActivityPage';
import { AppShell } from './components/AppShell';
import { ToastProvider } from './components/ToastProvider';

export default function App(): JSX.Element {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/transfer"
            element={
              <AppShell>
                <TransferPage />
              </AppShell>
            }
          />
          <Route
            path="/beneficiaries"
            element={
              <AppShell>
                <BeneficiariesPage />
              </AppShell>
            }
          />
          <Route
            path="/statements"
            element={
              <AppShell>
                <StatementsPage />
              </AppShell>
            }
          />
          <Route
            path="/activity"
            element={
              <AppShell>
                <ActivityPage />
              </AppShell>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
