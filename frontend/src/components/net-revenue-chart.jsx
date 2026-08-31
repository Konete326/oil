"use client";

import { Bar, BarChart, XAxis } from "recharts";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { DashboardCard } from "@/components/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  sales: {
    label: "Sales (PKR)",
    color: "hsl(var(--chart-2))",
  },
};

function CustomGradientBar(props) {
  const { fill, x = 0, y = 0, width = 0, height = 0, dataKey = "sales", index = 0 } = props;
  const gid = `gradient-bar-${String(dataKey)}-${index}`;

  return (
    <>
      <rect fill={`url(#${gid})`} height={height} stroke="none" width={width} x={x} y={y} />
      <rect fill={fill} height={2} stroke="none" width={width} x={x} y={y} />
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.5} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
    </>
  );
}

export function NetRevenueChart({ revenue = [], loading }) {
  const chartRows = revenue || [];
  const firstDay = chartRows[0]?.sales || 0;
  const lastDay = chartRows.at(-1)?.sales || 0;
  const growthPct = firstDay > 0 ? (((lastDay - firstDay) / firstDay) * 100).toFixed(1) : "0.0";

  return (
    <DashboardCard className="gap-0 md:col-span-2 shadow-2xs rounded-2xl">
      <CardHeader className="p-3.5 pb-1 gap-1 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold text-foreground">Sales Revenue Performance</CardTitle>
            <Delta value={Number(growthPct)} variant="badge">
              <DeltaIcon variant="trend" />
              <DeltaValue />
            </Delta>
          </div>
          <CardDescription className="text-[11px]">Last 7 Days (PKR)</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {loading ? (
          <Skeleton className="h-44 sm:h-48 w-full" />
        ) : chartRows.length === 0 ? (
          <div className="h-44 sm:h-48 flex items-center justify-center text-xs text-muted-foreground">
            No sales revenue data available yet.
          </div>
        ) : (
          <ChartContainer className="aspect-auto h-44 sm:h-48 w-full" config={chartConfig}>
            <BarChart accessibilityLayer data={chartRows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis
                axisLine={false}
                dataKey="day"
                interval={0}
                tickFormatter={(value) => String(value)}
                tickLine={false}
                tickMargin={6}
                className="text-[10px]"
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
              <Bar dataKey="sales" fill="var(--color-sales)" shape={<CustomGradientBar />} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </DashboardCard>
  );
}
