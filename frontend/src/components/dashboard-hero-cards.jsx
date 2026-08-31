import { useNavigate } from "react-router-dom";
import {
  TrendingUpIcon,
  PackageCheckIcon,
  WalletCardsIcon,
  BanknoteIcon,
  ArrowRightIcon,
  BoxesIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeroCards({ heroCards, gallaStatus, loading }) {
  const navigate = useNavigate();

  if (loading && !heroCards) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <Skeleton key={n} className="h-28 w-full rounded-xl" />
        ))}
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
  };

  const receivablesSummary = heroCards?.receivablesSummary || {
    totalReceivable: 0,
    formattedTotal: "Rs. 0",
  };

  const netGalla = gallaStatus?.formattedNetGalla || "Rs. 0";
  const todayIn = gallaStatus?.formattedTodayIn || "Rs. 0";
  const todayOut = gallaStatus?.formattedTodayOut || "Rs. 0";
  const rawNet = gallaStatus?.todayNetGalla || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
      <div
        onClick={() => navigate("/pos/history")}
        className="group relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-card p-3 shadow-2xs hover:shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Today's Sales
              </span>
            </div>
            <p className="text-[9.5px] text-muted-foreground">
              {todaySales.ordersCount} orders today
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
            <TrendingUpIcon className="size-3.5" />
          </div>
        </div>

        <div className="my-1">
          <p className="text-lg sm:text-xl font-extrabold font-mono text-foreground tracking-tight">
            {todaySales.formatted}
          </p>
        </div>

        <div className="pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-[9.5px] text-muted-foreground">
          <span>Cash: <strong className="text-foreground font-mono">Rs. {Number(todaySales.cash || 0).toLocaleString()}</strong></span>
          <span>Khata: <strong className="text-foreground font-mono">Rs. {Number(todaySales.credit || 0).toLocaleString()}</strong></span>
        </div>
      </div>

      <div
        onClick={() => navigate("/cash")}
        className="group relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-card p-3 shadow-2xs hover:shadow-xs hover:border-primary transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                Cash in Drawer
              </span>
            </div>
            <p className="text-[9.5px] text-muted-foreground">
              Physical cash in till
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 group-hover:scale-105 transition-transform">
            <BanknoteIcon className="size-3.5" />
          </div>
        </div>

        <div className="my-1">
          <p className={`text-lg sm:text-xl font-extrabold font-mono tracking-tight ${rawNet >= 0 ? "text-primary" : "text-rose-500"}`}>
            {netGalla}
          </p>
        </div>

        <div className="pt-1.5 border-t border-border flex items-center justify-between text-[9.5px] text-muted-foreground">
          <span className="text-emerald-600 dark:text-emerald-400 font-mono">+{todayIn} In</span>
          <span className="text-rose-600 dark:text-rose-400 font-mono">-{todayOut} Out</span>
        </div>
      </div>

      <div
        onClick={() => navigate("/products")}
        className="group relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-card p-3 shadow-2xs hover:shadow-xs hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Total Items
              </span>
            </div>
            <p className="text-[9.5px] text-muted-foreground">
              Catalog products
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
            <BoxesIcon className="size-3.5" />
          </div>
        </div>

        <div className="my-1">
          <p className="text-lg sm:text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 tracking-tight">
            {stockSummary.totalProducts} <span className="text-xs font-semibold text-muted-foreground">Items</span>
          </p>
        </div>

        <div className="pt-1.5 border-t border-indigo-500/20 flex items-center justify-between text-[9.5px] text-muted-foreground">
          <span>Units: <strong className="text-foreground font-mono">{stockSummary.totalUnits}</strong></span>
          <span className="text-primary font-semibold flex items-center gap-0.5">
            Manage <ArrowRightIcon className="size-2.5" />
          </span>
        </div>
      </div>

      <div
        onClick={() => navigate("/products")}
        className="group relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-card p-3 shadow-2xs hover:shadow-xs hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Stock Valuation
              </span>
            </div>
            <p className="text-[9.5px] text-muted-foreground">
              Value of stock
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 group-hover:scale-105 transition-transform">
            <PackageCheckIcon className="size-3.5" />
          </div>
        </div>

        <div className="my-1">
          <p className="text-lg sm:text-xl font-extrabold font-mono text-foreground tracking-tight">
            {stockSummary.formattedValuation}
          </p>
        </div>

        <div className="pt-1.5 border-t border-blue-500/20 flex items-center justify-between text-[9.5px] text-muted-foreground">
          <span className="text-emerald-600 dark:text-emerald-400">{stockSummary.inStock} In-Stock</span>
          {stockSummary.lowStock > 0 ? (
            <span className="text-amber-600 dark:text-amber-400 font-bold">⚠️ {stockSummary.lowStock} Low</span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">All Stocked</span>
          )}
        </div>
      </div>

      <div
        onClick={() => navigate("/customers")}
        className="group relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-card p-3 shadow-2xs hover:shadow-xs hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Receivables
              </span>
            </div>
            <p className="text-[9.5px] text-muted-foreground">
              Market udhar
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
            <WalletCardsIcon className="size-3.5" />
          </div>
        </div>

        <div className="my-1">
          <p className="text-lg sm:text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            {receivablesSummary.formattedTotal}
          </p>
        </div>

        <div className="pt-1.5 border-t border-amber-500/20 flex items-center justify-between text-[9.5px] text-muted-foreground">
          <span>Uncollected</span>
          <span className="text-primary font-semibold flex items-center gap-0.5">
            Khata <ArrowRightIcon className="size-2.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
