import { useState, useEffect } from "react";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  PercentIcon,
  BarChart3Icon,
  PrinterIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchProfitLossApi } from "@/lib/api";
import { ProfitLossPrintModal } from "@/components/profit-loss-print-modal";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export function ProfitLossWidget() {
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [data, setData] = useState({
    totalSalesRevenue: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    netProfit: 0,
    marginPercentage: 0,
    totalStockPurchases: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadPLData = async () => {
    try {
      setLoading(true);
      const params = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await fetchProfitLossApi(params);
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error("Failed to load Profit & Loss data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPLData();
  }, [period, startDate, endDate]);

  const chartData = [
    {
      name: "Financial Summary",
      "Sales Revenue": data.totalSalesRevenue || 0,
      "Stock Purchases": data.totalStockPurchases || 0,
      "Operating Expenses": data.operatingExpenses || 0,
      "Net Profit": data.netProfit || 0,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Profit & Loss Margin Calculator (Nafa Nuqsan)</h1>
          <p className="text-xs text-muted-foreground">Automated financial margin analysis: Sales Revenue vs Stock Purchases & Operating Expenses.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <PrinterIcon className="size-3.5" />
            <span>View & Print A4 Statement</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/40">
          {[
            { id: "daily", label: "Daily P&L" },
            { id: "weekly", label: "Weekly P&L" },
            { id: "monthly", label: "Monthly P&L" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                period === btn.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-card text-foreground px-2.5 py-1 rounded-md border border-border text-xs outline-none"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-card text-foreground px-2.5 py-1 rounded-md border border-border text-xs outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Gross Revenue</span>
          <div className="text-xl font-bold font-mono text-foreground">
            Rs. {(data.totalSalesRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Combined Sales Income</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Stock Purchases</span>
          <div className="text-xl font-bold font-mono text-amber-500">
            Rs. {(data.totalStockPurchases || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Refinery / Supplier Cost</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Operating Expenses</span>
          <div className="text-xl font-bold font-mono text-red-500">
            Rs. {(data.operatingExpenses || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Salaries, Freight, Utilities</p>
        </div>

        <div className={`rounded-xl border p-4 space-y-1 ${
          data.netProfit >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Net Profit / Loss</span>
            {data.netProfit >= 0 ? <TrendingUpIcon className="size-4 text-emerald-500" /> : <TrendingDownIcon className="size-4 text-destructive" />}
          </div>
          <div className={`text-xl font-bold font-mono ${data.netProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
            {data.netProfit >= 0 ? "+" : ""}Rs. {(data.netProfit || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">{data.netProfit >= 0 ? "Net Profit Earned" : "Net Operating Loss"}</p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Net Profit Margin</span>
            <PercentIcon className="size-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-primary">
            {data.marginPercentage || 0}%
          </div>
          <p className="text-[11px] text-muted-foreground">Margin Ratio</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-foreground">Revenue vs Cost Breakdown Visualization</h2>
          <span className="text-xs text-muted-foreground font-mono">Period: {period.toUpperCase()}</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" stroke="#888888" fontSize={11} />
              <YAxis stroke="#888888" fontSize={11} tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Sales Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Stock Purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Operating Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ProfitLossPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={data}
        period={period}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
