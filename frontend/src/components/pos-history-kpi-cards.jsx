import {
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  CreditCardIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PosHistoryKpiCards({
  totalRevenue = 0,
  totalCashRevenue = 0,
  totalCreditRevenue = 0,
  creditSalesCount = 0,
  todayCreditRevenue = 0,
  totalCOGS = 0,
  grossProfit = 0,
  totalExpenses = 0,
  totalStaffExpenses = 0,
  todayTotalExpenses = 0,
  netProfitOrLoss = 0,
  netCashInHand = 0,
}) {
  const isLoss = netProfitOrLoss < 0;
  const absNet = Math.abs(netProfitOrLoss);
  const netMargin = totalRevenue > 0 ? ((netProfitOrLoss / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <div className="rounded-xl border border-border/80 bg-card p-3 flex items-center gap-3 shadow-xs">
        <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <ArrowUpRightIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground font-medium truncate">Total Revenue</p>
          <p className="text-lg font-bold text-foreground font-mono">
            Rs {totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono mt-0.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cash: Rs {totalCashRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/35 bg-card p-3 flex items-center gap-3 shadow-xs">
        <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <CreditCardIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground font-medium truncate">Udhar / Receivables</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
            Rs {totalCreditRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
            {creditSalesCount} credit bills pending
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-rose-500/30 bg-card p-3 flex items-center gap-3 shadow-xs">
        <div className="size-10 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
          <ArrowDownRightIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground font-medium truncate">Expenses & Staff</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            Rs {totalExpenses.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
            Staff Advances: Rs {totalStaffExpenses.toLocaleString()}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl border p-3 flex items-center gap-3 shadow-xs transition-colors",
          isLoss
            ? "border-rose-500/50 bg-rose-500/10 text-rose-900 dark:text-rose-100"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
        )}
      >
        <div
          className={cn(
            "size-10 rounded-lg flex items-center justify-center shrink-0",
            isLoss
              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {isLoss ? <TrendingDownIcon className="size-5" /> : <TrendingUpIcon className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] font-bold uppercase tracking-wider">
              {isLoss ? "Net Loss" : "Net Profit"}
            </p>
            <span
              className={cn(
                "text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold",
                isLoss ? "bg-rose-500/20 text-rose-700 dark:text-rose-300" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              )}
            >
              {netMargin}%
            </span>
          </div>
          <p
            className={cn(
              "text-lg font-bold font-mono",
              isLoss ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {isLoss ? "-" : "+"} Rs {absNet.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
            Drawer Cash: Rs {netCashInHand.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
