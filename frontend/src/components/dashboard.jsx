import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardData, createExpenseApi } from "@/lib/api";
import { DashboardHeroCards } from "@/components/dashboard-hero-cards";
import { LiveGallaWidget } from "@/components/live-galla-widget";
import { NetRevenueChart } from "@/components/net-revenue-chart";
import { DashboardInvoices } from "@/components/dashboard-invoices";
import { ExpenseModal } from "@/components/expense-modal";
import { Button } from "@/components/ui/button";
import {
  ShoppingCartIcon,
  ReceiptIcon,
  PackagePlusIcon,
  TruckIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      const res = await fetchDashboardData();
      if (res && res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData(true);
    }, 10000);

    const handleFocus = () => {
      loadData(true);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadData]);

  const handleExpenseSave = async (expenseData) => {
    try {
      const res = await createExpenseApi(expenseData);
      if (res && res.success) {
        toast.success("Expense recorded successfully and deducted from Cash Drawer!");
        loadData();
      }
    } catch (err) {
      toast.error(err.message || "Failed to record expense");
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Al-Khaleej Lubricants Dashboard</h1>
            <p className="text-xs text-muted-foreground">Real-time live business summary, cash in drawer, stock value, and daily operations.</p>
          </div>
          {refreshing && (
            <RefreshCwIcon className="size-3.5 text-primary animate-spin shrink-0" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/pos")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs gap-1.5 cursor-pointer shadow-xs h-8 px-3"
          >
            <ShoppingCartIcon className="size-3.5" />
            <span>New POS Sale (F1)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs gap-1.5 cursor-pointer shadow-xs h-8 px-3"
          >
            <ReceiptIcon className="size-3.5" />
            <span>Record Expense</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/products")}
            className="border-border text-foreground font-semibold text-xs gap-1.5 cursor-pointer hover:bg-muted/50 shadow-xs h-8 px-3"
          >
            <PackagePlusIcon className="size-3.5" />
            <span>Add Stock</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/textile")}
            className="border-border text-foreground font-semibold text-xs gap-1.5 cursor-pointer hover:bg-muted/50 shadow-xs h-8 px-3"
          >
            <TruckIcon className="size-3.5" />
            <span>Dispatch Challan</span>
          </Button>
        </div>
      </div>

      <DashboardHeroCards
        heroCards={data?.heroCards}
        gallaStatus={data?.gallaStatus}
        loading={loading}
      />

      <LiveGallaWidget
        lowStockItems={data?.lowStockItems}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NetRevenueChart revenue={data?.revenue} loading={loading} />
        <DashboardInvoices invoices={data?.invoices} loading={loading} />
      </div>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleExpenseSave}
      />
    </div>
  );
}
