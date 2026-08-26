import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUserApi, refreshTokenApi, logoutUserApi } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { ToastNotificationProvider } from "@/components/toast-notification-provider";
import { Dashboard } from "@/components/dashboard";
import { CategoryManager } from "@/components/category-manager";
import { ProductManager } from "@/components/product-manager";
import { DecantingManager } from "@/components/decanting-manager";
import { TextileManager } from "@/components/textile-manager";
import { PosCounter } from "@/components/pos-counter";
import { PosHistory } from "@/components/pos-history";
import { CustomerManager } from "@/components/customer-manager";
import { LedgerManager } from "@/components/ledger-manager";
import { CashManager } from "@/components/cash-manager";
import { SalesPurchaseManager } from "@/components/sales-purchase-manager";
import { ProfitLossWidget } from "@/components/profit-loss-widget";
import { SupplierLedgerManager } from "@/components/supplier-ledger-manager";
import { FinancialReportsManager } from "@/components/financial-reports-manager";
import { ExpensesManager } from "@/components/expenses-manager";
import { EmployeePayrollManager } from "@/components/employee-payroll-manager";
import { UserManagementManager } from "@/components/user-management-manager";
import { AuditTrailManager } from "@/components/audit-trail-manager";
import { NotificationManager } from "@/components/notification-manager";
import { DocumentationView } from "@/components/documentation-view";
import { SettingsManager } from "@/components/settings-manager";
import { LoginPage } from "@/components/login";
import { NotFoundPage } from "@/components/not-found";

import { CloudLoader } from "@/components/ui/cloud-loader";
import { LanguageProvider } from "@/context/language-context";
import { SyncProvider } from "@/context/sync-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { Agentation } from "agentation";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("user");
    if (!token && !saved) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
      setLoading(false);
    }

    if (navigator.onLine) {
      getCurrentUserApi().then((fresh) => {
        if (fresh) setUser(fresh);
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let lastRefreshTime = Date.now();
    const triggerSilentRefresh = async () => {
      if (navigator.onLine && Date.now() - lastRefreshTime > 4 * 60 * 60 * 1000) {
        lastRefreshTime = Date.now();
        const refreshed = await refreshTokenApi();
        if (refreshed) {
          setUser((prev) => ({ ...prev, ...refreshed }));
        }
      }
    };

    const handleUserActivity = () => {
      triggerSilentRefresh();
    };

    window.addEventListener("click", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });

    const periodicInterval = setInterval(() => {
      if (navigator.onLine) {
        refreshTokenApi().then((refreshed) => {
          if (refreshed) {
            setUser((prev) => ({ ...prev, ...refreshed }));
          }
        });
      }
    }, 12 * 60 * 60 * 1000);

    return () => {
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      clearInterval(periodicInterval);
    };
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logoutUserApi();
    setUser(null);
  };

  if (loading) {
    return <CloudLoader fullScreen label="Authenticating session..." />;
  }

  return (
    <SyncProvider>
      <LanguageProvider>
        <Routes>
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
            }
          />
          <Route
            path="/*"
            element={
              user ? (
                <ToastNotificationProvider>
                  <ErrorBoundary>
                    <AppShell user={user} onLogout={handleLogout}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/categories" element={<CategoryManager />} />
                        <Route path="/products" element={<ProductManager />} />
                        <Route path="/pos" element={<PosCounter />} />
                        <Route path="/pos/history" element={<PosHistory />} />
                        <Route path="/decanting" element={<DecantingManager />} />
                        <Route path="/textile" element={<TextileManager />} />
                        <Route path="/customers" element={<CustomerManager />} />
                        <Route path="/ledger" element={<LedgerManager />} />
                        <Route path="/cash" element={<CashManager />} />
                        <Route path="/sales-purchases" element={<SalesPurchaseManager />} />
                        <Route path="/profit-loss" element={<ProfitLossWidget />} />
                        <Route path="/supplier-ledger" element={<SupplierLedgerManager />} />
                        <Route path="/financial-reports" element={<FinancialReportsManager />} />
                        <Route path="/expenses" element={<ExpensesManager />} />
                        <Route path="/payroll" element={<EmployeePayrollManager />} />
                        <Route path="/users" element={<UserManagementManager />} />
                        <Route path="/audit-trail" element={<AuditTrailManager />} />
                        <Route path="/settings" element={<SettingsManager user={user} />} />
                        <Route path="/notifications" element={<NotificationManager user={user} />} />
                        <Route path="/documentation" element={<DocumentationView />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </AppShell>
                  </ErrorBoundary>
                </ToastNotificationProvider>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
        {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
      </LanguageProvider>
    </SyncProvider>
  );
}
