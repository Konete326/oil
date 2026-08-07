"use client";

import { useId } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { formatDate } from "@/components/formater";
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
  retail: {
    label: "Retail Sales",
    color: "hsl(var(--chart-2))",
  },
  online: {
    label: "Wholesale / DC",
    color: "hsl(var(--chart-1))",
  },
};

export function ChannelSalesChart({ data = [], loading }) {
  const chartUid = useId().replace(/:/g, "");
  const idLineGlow = `channel-sales-line-glow-${chartUid}`;

  const chartRows = data.length > 0 ? data : [];

  const growthPctNum =
    chartRows.length > 1
      ? ((chartRows[chartRows.length - 1].retail + chartRows[chartRows.length - 1].online -
          (chartRows[0].retail + chartRows[0].online)) /
          Math.max(1, chartRows[0].retail + chartRows[0].online)) *
        100
      : 0;

  if (loading) {
    return (
      <DashboardCard className="gap-0 md:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full md:h-80" />
        </CardContent>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className="gap-0 md:col-span-2">
      <CardHeader>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Retail vs Wholesale Sales Breakdown</CardTitle>
            <Delta value={growthPctNum} variant="badge">
              <DeltaIcon variant="trend" />
              <DeltaValue />
            </Delta>
          </div>
          <CardDescription>
            Daily transactions by sales channel (Last 7 Days).
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {chartRows.length === 0 ? (
          <div className="h-60 md:h-80 flex items-center justify-center text-xs text-muted-foreground">
            No sales data recorded yet for this period.
          </div>
        ) : (
          <ChartContainer className="aspect-auto h-60 w-full p-0 md:h-80" config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={chartRows}
              margin={{
                left: 12,
                right: 12,
                top: 8,
              }}
            >
              <CartesianGrid className="stroke-border" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                interval={0}
                tickFormatter={(value) => formatDate(String(value), "day-month")}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
              <defs>
                <filter height="140%" id={idLineGlow} width="140%" x="-20%" y="-20%">
                  <feGaussianBlur result="blur" stdDeviation="10" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <Line
                dataKey="online"
                dot={false}
                filter={`url(#${idLineGlow})`}
                stroke="var(--color-online)"
                strokeWidth={2}
                type="step"
              />
              <Line
                dataKey="retail"
                dot={false}
                filter={`url(#${idLineGlow})`}
                stroke="var(--color-retail)"
                strokeWidth={2}
                type="step"
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </DashboardCard>
  );
}
