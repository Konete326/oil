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
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  TrendingUpIcon,
  WalletIcon,
  PlusIcon,
  ShoppingCartIcon,
  ReceiptIcon,
  PackageIcon,
} from "lucide-react";

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData().then((res) => {
      if (res && res.success) {
        setData(res.data);
      }
      setLoading(false);
    });
  }, []);

  const kpis = data?.kpis || [
    { label: "Total Cash Received Today", value: "Rs. 0", type: "green" },
    { label: "Total Cash Paid Today", value: "Rs. 0", type: "red" },
    { label: "Net Sales Of This Month", value: "Rs. 0", type: "blue" },
    { label: "Total Receivable Balance", value: "Rs. 0", type: "orange" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Dashboard</h1>
        <p className="text-xs text-muted-foreground">Real-time KPI overview, daily cash inflow/outflow, and financial metrics.</p>
      </div>

      <DashboardHeroCards heroCards={data?.heroCards} loading={loading} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          let cardStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
          let figureStyle = "text-emerald-500";
          let Icon = ArrowDownLeftIcon;

          if (kpi.type === "red" || index === 1) {
            cardStyle = "border-rose-500/30 bg-rose-500/10 text-rose-500";
            figureStyle = "text-rose-500";
            Icon = ArrowUpRightIcon;
          } else if (kpi.type === "blue" || index === 2) {
            cardStyle = "border-blue-500/30 bg-blue-500/10 text-blue-500";
            figureStyle = "text-blue-500";
            Icon = TrendingUpIcon;
          } else if (kpi.type === "orange" || index === 3) {
            cardStyle = "border-amber-500/30 bg-amber-500/10 text-amber-500";
            figureStyle = "text-amber-500";
            Icon = WalletIcon;
          }

          return (
            <div key={kpi.label || index} className={`rounded-xl border p-4 shadow-sm bg-card transition-all space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-2 rounded-lg border ${cardStyle}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <div>
                <p className={`text-3xl font-extrabold tabular-nums tracking-tight ${figureStyle}`}>
                  {kpi.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">Real-time Metrics</p>
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
