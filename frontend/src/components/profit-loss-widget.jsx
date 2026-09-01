import { useState, useEffect } from "react";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PrinterIcon,
  BarChart3Icon,
  PieChartIcon,
  LayersIcon,
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
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const SERIES_CONFIG = [
  { key: "Sales Revenue", color: "#10b981", label: "Sales Revenue" },
  { key: "Cost of Goods (COGS)", color: "#f59e0b", label: "Cost of Goods (COGS)" },
  { key: "Gross Profit", color: "#3b82f6", label: "Gross Profit" },
  { key: "Operating Expenses", color: "#ef4444", label: "Operating Expenses" },
  { key: "Net Profit", color: "#8b5cf6", label: "Net Profit" },
];

const DONUT_COLORS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

export function ProfitLossWidget() {
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartView, setChartView] = useState("bar");
  const [hiddenSeries, setHiddenSeries] = useState([]);
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

  const toggleSeries = (key) => {
    setHiddenSeries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

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

  const totalRevenue = Number(data.totalSalesRevenue || 0);
  const allocationPieData = [
    {
      name: "Cost of Goods (COGS)",
      value: Math.max(0, Number(data.totalCOGS || 0)),
      color: "#f59e0b",
      pct: totalRevenue > 0 ? ((Number(data.totalCOGS || 0) / totalRevenue) * 100).toFixed(1) : 0,
    },
    {
      name: "Operating Expenses",
      value: Math.max(0, Number(data.operatingExpenses || 0)),
      color: "#ef4444",
      pct: totalRevenue > 0 ? ((Number(data.operatingExpenses || 0) / totalRevenue) * 100).toFixed(1) : 0,
    },
    {
      name: "Net Profit Margin",
      value: Math.max(0, Number(data.netProfit || 0)),
      color: "#10b981",
      pct: totalRevenue > 0 ? ((Number(data.netProfit || 0) / totalRevenue) * 100).toFixed(1) : 0,
    },
  ].filter((item) => item.value > 0);

  const expenseCategoryList = Object.entries(data.expenseCategoryMap || {}).map(([cat, val], idx) => ({
    name: cat,
    value: Number(val || 0),
    color: DONUT_COLORS[idx % DONUT_COLORS.length],
  })).filter((item) => item.value > 0);

  const marginPct = Number(data.marginPercentage || 0);
  const healthStatus =
    marginPct >= 15
      ? {
          label: "Profitable",
          badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
          dotClass: "bg-emerald-500",
        }
      : marginPct >= 8
      ? {
          label: "Average Margin",
          badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
          dotClass: "bg-amber-500",
        }
      : {
          label: "Low Margin Alert",
          badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 animate-pulse",
          dotClass: "bg-rose-500",
        };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1 min-w-[180px]">
          <p className="font-bold text-foreground border-b border-border/60 pb-0.5">{label}</p>
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color || item.fill }} />
                <span className="text-muted-foreground">{item.name}:</span>
              </div>
              <span className="font-mono font-bold text-foreground">
                Rs. {Number(item.value || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1 min-w-[170px]">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.payload?.color }} />
            <span>{item.name}</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/60 text-[11px]">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-mono font-bold text-foreground">Rs. {Number(item.value || 0).toLocaleString()}</span>
          </div>
          {item.payload?.pct !== undefined && (
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground">Share:</span>
              <span className="font-mono font-bold text-primary">{item.payload.pct}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-card p-3 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border/60">
            {[
              { id: "daily", label: "Daily" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setPeriod(btn.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  period === btn.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${healthStatus.badgeClass}`}>
            <span className={`size-2 rounded-full shrink-0 ${healthStatus.dotClass}`} />
            <span>{healthStatus.label} ({marginPct}%)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-background text-foreground px-2.5 py-1 rounded-md border border-border text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-hidden text-xs cursor-pointer"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-hidden text-xs cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="gap-1.5 text-xs cursor-pointer h-8 px-2.5"
            title="Print A4 Statement"
          >
            <PrinterIcon className="size-3.5" />
            <span className="hidden sm:inline">Print A4</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="rounded-xl border border-border bg-card p-3 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Sales Revenue</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
            Rs. {(data.totalSalesRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[10.5px] text-muted-foreground truncate">
            POS ({(data.posRevenue || 0).toLocaleString()}) · Challans ({(data.challanRevenue || 0).toLocaleString()})
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Cost of Goods (COGS)</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-500">
            Rs. {(data.totalCOGS || 0).toLocaleString()}
          </div>
          <p className="text-[10.5px] text-muted-foreground">Product Base Cost</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Gross Profit</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            Rs. {(data.grossProfit || 0).toLocaleString()}
          </div>
          <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
            Margin: {data.grossMarginPercentage || 0}%
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Operating Expenses</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-500">
            Rs. {(data.operatingExpenses || 0).toLocaleString()}
          </div>
          <p className="text-[10.5px] text-muted-foreground">Salaries + Bills</p>
        </div>

        <div
          className={`rounded-xl border p-3 space-y-1 ${
            marginPct >= 15
              ? "border-emerald-500/30 bg-emerald-500/10"
              : marginPct >= 8
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-destructive/30 bg-destructive/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Net Profit</span>
            {data.netProfit >= 0 ? (
              <TrendingUpIcon className="size-3.5 text-emerald-500" />
            ) : (
              <TrendingDownIcon className="size-3.5 text-destructive" />
            )}
          </div>
          <div
            className={`text-lg sm:text-xl font-bold font-mono ${
              data.netProfit >= 0 ? "text-emerald-500" : "text-destructive"
            }`}
          >
            {data.netProfit >= 0 ? "+" : ""}Rs. {(data.netProfit || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
            <span>Margin: {marginPct}%</span>
            <span className="font-semibold text-foreground">{healthStatus.label}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 space-y-2.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
          <div>
            <h2 className="font-bold text-xs sm:text-sm text-foreground">Financial Performance Chart</h2>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg border border-border/60 text-[11px]">
            <button
              onClick={() => setChartView("bar")}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                chartView === "bar"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3Icon className="size-3" />
              <span>Comparative Flow</span>
            </button>

            <button
              onClick={() => setChartView("pie")}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                chartView === "pie"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PieChartIcon className="size-3" />
              <span>Allocation</span>
            </button>

            {expenseCategoryList.length > 0 && (
              <button
                onClick={() => setChartView("expenses")}
                className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  chartView === "expenses"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayersIcon className="size-3" />
                <span>Expenses</span>
              </button>
            )}
          </div>
        </div>

        {chartView === "bar" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground">Series:</span>
            {SERIES_CONFIG.map((item) => {
              const isHidden = hiddenSeries.includes(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => toggleSeries(item.key)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                    isHidden
                      ? "opacity-40 line-through bg-muted/30 text-muted-foreground border-dashed border-border"
                      : "bg-background text-foreground border-border/80 shadow-2xs hover:border-primary"
                  }`}
                >
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="h-52 w-full pt-1">
          {chartView === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={10.5} />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={false} />
                {SERIES_CONFIG.map((item) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    fill={item.color}
                    radius={[4, 4, 0, 0]}
                    hide={hiddenSeries.includes(item.key)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : chartView === "pie" ? (
            allocationPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                No revenue allocation data recorded for this period.
              </div>
            ) : (
              <div className="h-full grid grid-cols-1 md:grid-cols-2 items-center gap-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {allocationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-1.5 text-xs">
                  {allocationPieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-muted/40 border border-border/40 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-foreground">Rs. {item.value.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground ms-1">({item.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            expenseCategoryList.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                No operational expense categories recorded for this period.
              </div>
            ) : (
              <div className="h-full grid grid-cols-1 md:grid-cols-2 items-center gap-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryList}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseCategoryList.map((entry, index) => (
                        <Cell key={`exp-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-1 text-xs max-h-44 overflow-y-auto pe-1">
                  {expenseCategoryList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1 px-2 rounded-lg bg-muted/40 border border-border/40 text-[10.5px]">
                      <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-foreground truncate max-w-[130px]">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-foreground">Rs. {item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
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
