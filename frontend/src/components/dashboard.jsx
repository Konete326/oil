import { useState, useEffect } from "react";
import { fetchDashboardData } from "@/lib/api";
import { BillingHealth } from "@/components/billing-health";
import { ChannelSalesChart } from "@/components/channel-sales-chart";
import { DashboardActivity } from "@/components/dashboard-activity";
import { DashboardInvoices } from "@/components/dashboard-invoices";
import { NetRevenueChart } from "@/components/net-revenue-chart";
import { DashboardStats } from "@/components/stats";

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData().then((res) => {
      if (res && res.success) {
        setData(res.data);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:p-6 md:grid-cols-2 lg:grid-cols-4">
      <DashboardStats stats={data?.stats} loading={loading} />
      <NetRevenueChart revenue={data?.revenue} loading={loading} />
      <ChannelSalesChart data={data?.channelSales} loading={loading} />
      <DashboardInvoices invoices={data?.invoices} loading={loading} />
      <BillingHealth />
      <DashboardActivity activities={data?.activities} loading={loading} />
    </div>
  );
}
