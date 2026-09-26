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
import {
  DropletIcon,
  LayersIcon,
  TrendingUpIcon,
  WalletCardsIcon,
  ShoppingCartIcon,
  ReceiptIcon,
  PackageIcon,
} from "lucide-react";

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboard = () => {
    fetchDashboardData().then((res) => {
      if (res && res.success) {
        setData(res.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDashboard();
    window.addEventListener("refresh-dashboard", loadDashboard);
    return () => window.removeEventListener("refresh-dashboard", loadDashboard);
  }, []);

  const kpis = data?.kpis || [
    { label: "Total Stock in Hand", value: "0 L", subtext: "Active Stock in Liters", type: "green" },
    { label: "Total Stock Valuation", value: "Rs. 0", subtext: "Asset value at cost", type: "blue" },
    { label: "Net Sales Of This Month", value: "Rs. 0", subtext: "Monthly Volume", type: "purple" },
    { label: "Customer Receivables", value: "Rs. 0", subtext: "Pending Khata Accounts", type: "orange" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Dashboard</h1>
        <p className="text-xs text-muted-foreground">Real-time KPI overview, oil inventory stock status, and sales metrics.</p>
      </div>

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
