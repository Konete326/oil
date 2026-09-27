import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardData } from "@/lib/api";
import { DashboardHeroCards } from "@/components/dashboard-hero-cards";
import { BillingHealth } from "@/components/billing-health";
import { ChannelSalesChart } from "@/components/channel-sales-chart";
import { DashboardActivity } from "@/components/dashboard-activity";
import { DashboardInvoices } from "@/components/dashboard-invoices";
import { NetRevenueChart } from "@/components/net-revenue-chart";
import { DashboardStats } from "@/components/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropletIcon,
  LayersIcon,
  TrendingUpIcon,
  WalletCardsIcon,
  RotateCwIcon,
  CalendarIcon,
  FilterIcon,
  ClockIcon,
} from "lucide-react";

const PERIODS = [
  { key: "today", label: "Today", icon: ClockIcon, color: "text-emerald-500" },
  { key: "monthly", label: "Month", icon: CalendarIcon, color: "text-blue-500" },
  { key: "custom", label: "Custom", icon: FilterIcon, color: "text-amber-500" },
];

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  const loadDashboard = (activePeriod = period, sDate = startDate, eDate = endDate) => {
    setLoading(true);
    const params = { period: activePeriod };
    if (activePeriod === "custom") {
      if (sDate) params.startDate = sDate;
      if (eDate) params.endDate = eDate;
    }

    fetchDashboardData(params).then((res) => {
      if (res && res.success) {
        setData(res.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDashboard(period, startDate, endDate);
    const handleRefresh = () => loadDashboard(period, startDate, endDate);
    window.addEventListener("refresh-dashboard", handleRefresh);
    return () => window.removeEventListener("refresh-dashboard", handleRefresh);
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom") {
      loadDashboard(newPeriod, "", "");
    }
  };

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    if (startDate) {
      loadDashboard("custom", startDate, endDate);
    }
  };

  const kpis = data?.kpis || [
    { label: "Stock in Hand", value: "0 L", subtext: "Active Stock", type: "green" },
    { label: "Stock Valuation", value: "Rs. 0", subtext: "Asset at Cost", type: "blue" },
    { label: "Net Sales", value: "Rs. 0", subtext: "Monthly Volume", type: "purple" },
    { label: "Receivables", value: "Rs. 0", subtext: "Pending Khata", type: "orange" },
  ];

  const kpiConfig = [
    { icon: DropletIcon, card: "border-emerald-500/25 bg-emerald-500/8 text-emerald-500", fig: "text-emerald-600 dark:text-emerald-400" },
    { icon: LayersIcon, card: "border-blue-500/25 bg-blue-500/8 text-blue-500", fig: "text-blue-600 dark:text-blue-400" },
    { icon: TrendingUpIcon, card: "border-indigo-500/25 bg-indigo-500/8 text-indigo-500", fig: "text-indigo-600 dark:text-indigo-400" },
    { icon: WalletCardsIcon, card: "border-amber-500/25 bg-amber-500/8 text-amber-500", fig: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground leading-tight">
            Operational Dashboard
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Rozana hisab · stock status · revenue
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-0.5 rounded-lg bg-muted/50 border border-border/60 text-xs">
            {PERIODS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => handlePeriodChange(key)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium flex items-center gap-1 ${
                  period === key
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`size-3 ${color}`} />
                {label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard(period, startDate, endDate)}
            disabled={loading}
            className="h-7 px-2.5 text-xs gap-1 cursor-pointer shrink-0"
          >
            <RotateCwIcon className={`size-3 ${loading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {period === "custom" && (
        <form
          onSubmit={handleApplyCustomFilter}
          className="px-3 py-2 rounded-lg border border-border/60 bg-muted/20 flex flex-wrap items-center gap-2 text-xs animate-in fade-in"
        >
          <CalendarIcon className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">Range:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs h-7 bg-background w-32"
            required
          />
          <span className="text-muted-foreground">→</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs h-7 bg-background w-32"
          />
          <Button type="submit" size="sm" className="h-7 text-xs px-3 cursor-pointer">
            Apply
          </Button>
        </form>
      )}

      <DashboardHeroCards heroCards={data?.heroCards} loading={loading} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, index) => {
          const { icon: Icon, card, fig } = kpiConfig[index] || kpiConfig[0];
          return (
            <div
              key={kpi.label || index}
              className="rounded-xl border p-3.5 bg-card transition-all hover:border-border/70 hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
                  {kpi.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${card}`}>
                  <Icon className="size-3.5" />
                </div>
              </div>
              <p className={`text-xl font-extrabold tabular-nums tracking-tight ${fig}`}>
                {kpi.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.subtext}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats stats={data?.stats} loading={loading} />
        <NetRevenueChart revenue={data?.revenue} loading={loading} />
        <ChannelSalesChart data={data?.channelSales} loading={loading} />
        <DashboardInvoices invoices={data?.invoices} loading={loading} />
        <BillingHealth />
        <DashboardActivity activities={data?.activities} loading={loading} />
      </div>
    </div>
  );
}
