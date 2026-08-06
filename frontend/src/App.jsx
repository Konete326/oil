import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Agentation } from "agentation";
import { getCurrentUserApi } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { CategoryManager } from "@/components/category-manager";
import { ProductManager } from "@/components/product-manager";
import { DecantingManager } from "@/components/decanting-manager";
import { TextileManager } from "@/components/textile-manager";
import { PosCounter } from "@/components/pos-counter";
import { PosHistory } from "@/components/pos-history";
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
import { LoginPage } from "@/components/login";
import { NotFoundPage } from "@/components/not-found";

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
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground text-xs">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Authenticating session...</span>
        </div>
      </div>
    );
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
              <AppShell user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/categories" element={<CategoryManager />} />
                  <Route path="/products" element={<ProductManager />} />
                  <Route path="/pos" element={<PosCounter />} />
                  <Route path="/pos/history" element={<PosHistory />} />
                  <Route path="/decanting" element={<DecantingManager />} />
                  <Route path="/textile" element={<TextileManager />} />
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
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppShell>
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
