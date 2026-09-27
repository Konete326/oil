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
import { Badge } from "@/components/ui/badge";
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
    { label: "Total Stock in Hand", value: "0 L", subtext: "Active Stock in Liters", type: "green" },
    { label: "Total Stock Valuation", value: "Rs. 0", subtext: "Asset value at cost", type: "blue" },
    { label: "Net Sales Of This Month", value: "Rs. 0", subtext: "Monthly Volume", type: "purple" },
    { label: "Customer Receivables", value: "Rs. 0", subtext: "Pending Khata Accounts", type: "orange" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Dashboard</h1>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono uppercase px-2 py-0.5 ${
                period === "today"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : period === "monthly"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              }`}
            >
              {period === "today"
                ? "Daily Fresh (Rozana)"
                : period === "monthly"
                ? "Monthly Aggregate"
                : "Custom Range"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rozana ka taza hisab kitab, monthly aggregated revenue, aur inventory stock status.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-muted/40 border border-border text-xs">
            <button
              onClick={() => handlePeriodChange("today")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                period === "today"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ClockIcon className="size-3.5 text-emerald-500" />
              <span>Today (آج کا دن)</span>
            </button>

            <button
              onClick={() => handlePeriodChange("monthly")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                period === "monthly"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="size-3.5 text-blue-500" />
              <span>This Month (اس ماہ)</span>
            </button>

            <button
              onClick={() => handlePeriodChange("custom")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                period === "custom"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FilterIcon className="size-3.5 text-amber-500" />
              <span>Custom Date Range</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard(period, startDate, endDate)}
            disabled={loading}
            className="h-9 px-3 text-xs gap-1.5 cursor-pointer shrink-0"
          >
            <RotateCwIcon className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {period === "custom" && (
        <form
          onSubmit={handleApplyCustomFilter}
          className="p-3 rounded-xl border border-border/80 bg-muted/20 flex flex-wrap items-center gap-3 text-xs animate-in fade-in"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarIcon className="size-3.5 text-primary" />
            <span className="font-semibold text-foreground">Select Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs h-8 bg-background w-36"
              required
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs h-8 bg-background w-36"
            />
          </div>

          <Button type="submit" size="sm" className="h-8 text-xs px-3 font-semibold cursor-pointer">
            Apply Custom Filter
          </Button>
        </form>
      )}

      <DashboardHeroCards heroCards={data?.heroCards} loading={loading} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          let cardStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
          let figureStyle = "text-emerald-500";
          let Icon = DropletIcon;

          if (kpi.type === "blue" || index === 1) {
            cardStyle = "border-blue-500/30 bg-blue-500/10 text-blue-500";
            figureStyle = "text-blue-500";
            Icon = LayersIcon;
          } else if (kpi.type === "purple" || index === 2) {
            cardStyle = "border-indigo-500/30 bg-indigo-500/10 text-indigo-500";
            figureStyle = "text-indigo-500";
            Icon = TrendingUpIcon;
          } else if (kpi.type === "orange" || index === 3) {
            cardStyle = "border-amber-500/30 bg-amber-500/10 text-amber-500";
            figureStyle = "text-amber-500";
            Icon = WalletCardsIcon;
          }

          return (
            <div key={kpi.label || index} className="rounded-xl border p-4 shadow-xs bg-card transition-all space-y-2 hover:border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-2 rounded-lg border ${cardStyle}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <div>
                <p className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight ${figureStyle}`}>
                  {kpi.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">{kpi.subtext || "Real-time Metrics"}</p>
              </div>
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
