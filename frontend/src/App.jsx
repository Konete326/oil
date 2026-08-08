import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Agentation } from "agentation";
import { getCurrentUserApi } from "@/lib/api";
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

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    getCurrentUserApi().then((data) => {
      if (data) {
        setUser(data);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return <CloudLoader fullScreen label="Authenticating session..." />;
  }

  return (
    <>
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
              </ToastNotificationProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>

      {import.meta.env.DEV && (
        <Agentation
          endpoint="http://localhost:4747"
          onSessionCreated={(sessionId) => {
            console.log("Session started:", sessionId);
          }}
        />
      )}
    </>
  );
}
