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
    <DashboardCard className="gap-0 md:col-span-2">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Net Sales Revenue (PKR)</CardTitle>
          <Delta value={Number(growthPct)} variant="badge">
            <DeltaIcon variant="trend" />
            <DeltaValue />
          </Delta>
        </div>
        <CardDescription>Daily net sales performance (Last 7 Days).</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-60 w-full md:h-80" />
        ) : chartRows.length === 0 ? (
          <div className="h-60 md:h-80 flex items-center justify-center text-xs text-muted-foreground">
            No sales revenue data available yet.
          </div>
        ) : (
          <ChartContainer className="aspect-auto h-60 w-full md:h-80" config={chartConfig}>
            <BarChart accessibilityLayer data={chartRows}>
              <XAxis
                axisLine={false}
                dataKey="day"
                interval={0}
                tickFormatter={(value) => String(value)}
                tickLine={false}
                tickMargin={10}
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
