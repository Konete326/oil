import {
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  CreditCardIcon,
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CoinsIcon,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
      <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
        <div className="size-9 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <ArrowUpRightIcon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground font-medium truncate">Kul Farokht (Revenue)</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono">
            Rs {totalRevenue.toLocaleString()}
          </p>
          <p className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono truncate">
            Cash: Rs {totalCashRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/35 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
        <div className="size-9 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <CreditCardIcon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground font-medium truncate">Udhar Maal (Khata)</p>
          <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
            Rs {totalCreditRevenue.toLocaleString()}
          </p>
          <p className="text-[9.5px] text-amber-600 dark:text-amber-400 font-semibold font-mono truncate">
            Aaj: Rs {todayCreditRevenue.toLocaleString()} ({creditSalesCount} Bills)
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
        <div className="size-9 rounded-md bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
          <CoinsIcon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground font-medium truncate">Kharid Lagat & Khaam Nafa</p>
          <p className="text-base sm:text-lg font-bold text-foreground font-mono">
            Rs {grossProfit.toLocaleString()}
          </p>
          <p className="text-[9.5px] text-muted-foreground font-mono truncate">
            Lagat (COGS): Rs {totalCOGS.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-rose-500/30 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
        <div className="size-9 rounded-md bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
          <ArrowDownRightIcon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground font-medium truncate">Kul Akhrajat & Tankhwah</p>
          <p className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            Rs {totalExpenses.toLocaleString()}
          </p>
          <p className="text-[9.5px] text-rose-600 dark:text-rose-400 font-semibold font-mono truncate">
            Staff Advance: Rs {totalStaffExpenses.toLocaleString()} | Aaj: Rs {todayTotalExpenses.toLocaleString()}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs transition-colors",
          isLoss
            ? "border-rose-500/60 bg-rose-500/10 text-rose-900 dark:text-rose-100"
            : "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
        )}
      >
        <div
          className={cn(
            "size-9 rounded-md flex items-center justify-center shrink-0",
            isLoss
              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {isLoss ? <TrendingDownIcon className="size-5" /> : <TrendingUpIcon className="size-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[10px] font-bold uppercase tracking-wider">
              {isLoss ? "Nuqsan (Net Loss)" : "Khális Nafa (Net Profit)"}
            </p>
            <span
              className={cn(
                "text-[9px] px-1.5 py-0.2 rounded font-mono font-bold",
                isLoss ? "bg-rose-500/20 text-rose-700 dark:text-rose-300" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              )}
            >
              {netMargin}%
            </span>
          </div>
          <p
            className={cn(
              "text-base sm:text-lg font-bold font-mono",
              isLoss ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {isLoss ? "-" : "+"} Rs {absNet.toLocaleString()}
          </p>
          <p className="text-[9.5px] text-muted-foreground font-mono truncate">
            Galla Cash: Rs {netCashInHand.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
