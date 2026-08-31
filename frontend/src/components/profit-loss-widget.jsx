import { useState, useEffect } from "react";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  PercentIcon,
  BarChart3Icon,
  PrinterIcon,
  CoinsIcon,
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
    posRevenue: 0,
    challanRevenue: 0,
    totalCOGS: 0,
    posCOGS: 0,
    challanCOGS: 0,
    grossProfit: 0,
    grossMarginPercentage: 0,
    operatingExpenses: 0,
    totalStaffSalaries: 0,
    totalGeneralExpenses: 0,
    expenseCategoryMap: {},
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
      name: "Financial Overview",
      "Sales Revenue": Number(data.totalSalesRevenue || 0),
      "Cost of Goods (COGS)": Number(data.totalCOGS || 0),
      "Gross Profit": Number(data.grossProfit || 0),
      "Operating Expenses": Number(data.operatingExpenses || 0),
      "Net Profit": Number(data.netProfit || 0),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Profit & Loss Margin Calculator (Nafa Nuqsan)</h1>
          <p className="text-xs text-muted-foreground">Accurate financial analytics: Revenue vs Real Cost of Goods Sold (COGS) & Operating Expenses.</p>
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
          <span className="text-xs text-muted-foreground font-medium">Total Sales Revenue</span>
          <div className="text-xl font-bold font-mono text-foreground">
            Rs. {(data.totalSalesRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">POS ({(data.posRevenue || 0).toLocaleString()}) · Challans ({(data.challanRevenue || 0).toLocaleString()})</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Cost of Goods Sold (COGS)</span>
          <div className="text-xl font-bold font-mono text-amber-500">
            Rs. {(data.totalCOGS || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Actual Product Base Cost</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Gross Profit (Margin)</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            Rs. {(data.grossProfit || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Margin: {data.grossMarginPercentage || 0}%</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Operating Expenses</span>
          <div className="text-xl font-bold font-mono text-red-500">
            Rs. {(data.operatingExpenses || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Salaries + Operational Bills</p>
        </div>

        <div className={`rounded-xl border p-4 space-y-1 ${
          data.netProfit >= 0 ? "border-emerald-500/30 bg-emerald-500/10" : "border-destructive/30 bg-destructive/10"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Net Profit / Loss</span>
            {data.netProfit >= 0 ? <TrendingUpIcon className="size-4 text-emerald-500" /> : <TrendingDownIcon className="size-4 text-destructive" />}
          </div>
          <div className={`text-xl font-bold font-mono ${data.netProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
            {data.netProfit >= 0 ? "+" : ""}Rs. {(data.netProfit || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Net Margin: {data.marginPercentage || 0}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-foreground">Revenue, Real COGS & Net Margin Visual Breakdown</h2>
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
              <Bar dataKey="Cost of Goods (COGS)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gross Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Operating Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
