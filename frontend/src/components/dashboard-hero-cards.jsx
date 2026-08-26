import { useNavigate } from "react-router-dom";
import {
  TrendingUpIcon,
  PackageCheckIcon,
  WalletCardsIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  Building2Icon,
  UserCheck2Icon,
  BanknoteIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeroCards({ heroCards, loading }) {
  const navigate = useNavigate();

  if (loading && !heroCards) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  const todaySales = heroCards?.todaySales || {
    total: 0,
    formatted: "Rs. 0",
    ordersCount: 0,
    cash: 0,
    credit: 0,
  };

  const stockSummary = heroCards?.stockSummary || {
    valuation: 0,
    formattedValuation: "Rs. 0",
    totalUnits: 0,
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  const receivablesSummary = heroCards?.receivablesSummary || {
    totalReceivable: 0,
    formattedTotal: "Rs. 0",
    customerReceivable: 0,
    millReceivable: 0,
    pendingParties: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
      <div
        onClick={() => navigate("/pos")}
        className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background p-5 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Today's Total Sales
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {todaySales.ordersCount} orders completed today
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
            <TrendingUpIcon className="size-5" />
          </div>
        </div>

        <div className="my-3 space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
            {todaySales.formatted}
          </p>
        </div>

        <div className="pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-muted-foreground">
              <BanknoteIcon className="size-3.5 text-emerald-500" />
              Cash: <strong className="text-foreground">Rs. {Number(todaySales.cash || 0).toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <WalletCardsIcon className="size-3.5 text-amber-500" />
              Credit: <strong className="text-foreground">Rs. {Number(todaySales.credit || 0).toLocaleString()}</strong>
            </span>
          </div>

          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            New Sale <ArrowRightIcon className="size-3" />
          </span>
        </div>
      </div>

      <div
        onClick={() => navigate("/products")}
        className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background p-5 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Total Inventory Stock
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Total {stockSummary.totalUnits} Units ({stockSummary.totalProducts} Products)
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 group-hover:scale-105 transition-transform">
            <PackageCheckIcon className="size-5" />
          </div>
        </div>

        <div className="my-3 space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
            {stockSummary.formattedValuation}
          </p>
        </div>

        <div className="pt-3 border-t border-blue-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <CheckCircle2Icon className="size-3" /> {stockSummary.inStock} In-Stock
            </span>
            {stockSummary.lowStock > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <AlertTriangleIcon className="size-3" /> {stockSummary.lowStock} Low Stock
              </span>
            )}
            {stockSummary.outOfStock > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                {stockSummary.outOfStock} Out of Stock
              </span>
            )}
          </div>

          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View Inventory <ArrowRightIcon className="size-3" />
          </span>
        </div>
      </div>

      <div
        onClick={() => navigate("/ledger")}
        className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background p-5 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Market Receivables (Khata)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {receivablesSummary.pendingParties} Pending Party Accounts
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
            <WalletCardsIcon className="size-5" />
          </div>
        </div>

        <div className="my-3 space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
            {receivablesSummary.formattedTotal}
          </p>
        </div>

        <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-muted-foreground">
              <UserCheck2Icon className="size-3.5 text-primary" />
              Customers: <strong className="text-foreground">Rs. {Number(receivablesSummary.customerReceivable || 0).toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Building2Icon className="size-3.5 text-amber-500" />
              Mills: <strong className="text-foreground">Rs. {Number(receivablesSummary.millReceivable || 0).toLocaleString()}</strong>
            </span>
          </div>

          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View Ledgers <ArrowRightIcon className="size-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
