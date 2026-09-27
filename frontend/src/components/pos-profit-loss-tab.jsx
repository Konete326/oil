import { useState, useMemo } from "react";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PrinterIcon,
  CalendarIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  PercentIcon,
  PackageIcon,
  ReceiptIcon,
  HandCoinsIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  StoreIcon,
  BuildingIcon,
  ZapIcon,
  TruckIcon,
  ShieldCheckIcon,
  CoffeeIcon,
  RotateCcwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  "Salaries & Wages": HandCoinsIcon,
  "Utilities": ZapIcon,
  "Transport & Freight": TruckIcon,
  "Rent": BuildingIcon,
  "Maintenance & Repairs": StoreIcon,
  "Office Petty Cash": CoffeeIcon,
  "Official Fees & Licenses": ShieldCheckIcon,
  "Staff Advances & Payouts": HandCoinsIcon,
};

export function PosProfitLossTab({
  salesHistory = [],
  expenses = [],
  staffAdvances = [],
}) {
  const [period, setPeriod] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filterByPeriod = (dateStr) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return false;

    const now = new Date();

    if (period === "today") {
      return itemDate.toDateString() === now.toDateString();
    }
    if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return itemDate >= weekAgo;
    }
    if (period === "month") {
      return (
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      );
    }
    if (period === "custom") {
      if (customStart && new Date(dateStr) < new Date(customStart + "T00:00:00")) {
        return false;
      }
      if (customEnd && new Date(dateStr) > new Date(customEnd + "T23:59:59")) {
        return false;
      }
      return true;
    }
    return true;
  };

  const periodSales = useMemo(() => {
    return salesHistory.filter((s) => filterByPeriod(s.createdAt));
  }, [salesHistory, period, customStart, customEnd]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => filterByPeriod(e.expenseDate || e.createdAt));
  }, [expenses, period, customStart, customEnd]);

  const periodAdvances = useMemo(() => {
    return staffAdvances.filter(
      (a) => a.type === "Advance Given" && filterByPeriod(a.date || a.createdAt)
    );
  }, [staffAdvances, period, customStart, customEnd]);

  const totalRevenue = useMemo(() => {
    return periodSales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
  }, [periodSales]);

  const cashSalesTotal = useMemo(() => {
    return periodSales
      .filter((s) => !s.isCredit)
      .reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
  }, [periodSales]);

  const creditSalesTotal = useMemo(() => {
    return periodSales
      .filter((s) => s.isCredit)
      .reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
  }, [periodSales]);

  const totalCOGS = useMemo(() => {
    return periodSales.reduce((acc, s) => {
      if (s.totalCost && Number(s.totalCost) > 0) {
        return acc + Number(s.totalCost);
      }
      const itemCost = (s.items || []).reduce((iAcc, it) => {
        const cp = Number(it.costPrice) || 0;
        const qty = Number(it.quantity) || 1;
        return iAcc + cp * qty;
      }, 0);
      return acc + itemCost;
    }, 0);
  }, [periodSales]);

  const grossProfit = totalRevenue - totalCOGS;
  const grossMarginPercent =
    totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const staffAdvancesTotal = useMemo(() => {
    return periodAdvances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
  }, [periodAdvances]);

  const categorizedExpenses = useMemo(() => {
    const map = {
      "Salaries & Wages": 0,
      "Utilities": 0,
      "Transport & Freight": 0,
      "Rent": 0,
      "Maintenance & Repairs": 0,
      "Office Petty Cash": 0,
      "Official Fees & Licenses": 0,
      "Other": 0,
    };

    periodExpenses.forEach((e) => {
      const cat = e.category || "Other";
      if (map[cat] !== undefined) {
        map[cat] += Number(e.amount) || 0;
      } else {
        map["Other"] += Number(e.amount) || 0;
      }
    });

    map["Staff Advances & Payouts"] = staffAdvancesTotal;

    return map;
  }, [periodExpenses, staffAdvancesTotal]);

  const totalOperatingExpenses = useMemo(() => {
    const generalExps = periodExpenses.reduce(
      (acc, e) => acc + (Number(e.amount) || 0),
      0
    );
    return generalExps + staffAdvancesTotal;
  }, [periodExpenses, staffAdvancesTotal]);

  const netProfitOrLoss = grossProfit - totalOperatingExpenses;
  const isLoss = netProfitOrLoss < 0;
  const netMarginPercent =
    totalRevenue > 0 ? ((netProfitOrLoss / totalRevenue) * 100).toFixed(1) : "0.0";

  const handlePrint = () => {
    window.print();
  };

  const periodLabel =
    period === "today"
      ? "Aaj (Today)"
      : period === "week"
      ? "Is Hafte (Last 7 Days)"
      : period === "month"
      ? "Is Mahine (This Month)"
      : period === "custom"
      ? "Makhsoos Muddat (Custom Dates)"
      : "Mukammal Record (All Time)";

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-bold text-foreground pe-2 border-r border-border/70">
            <CalendarIcon className="size-4 text-primary" />
            <span>Muddat (Period):</span>
          </div>

          {[
            { id: "today", label: "Aaj (Today)" },
            { id: "week", label: "Is Hafte (This Week)" },
            { id: "month", label: "Is Mahine (Month)" },
            { id: "all", label: "All Time (Mukammal)" },
            { id: "custom", label: "Custom Dates" },
          ].map((p) => (
            <Button
              key={p.id}
              variant={period === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "h-8 text-xs px-3 rounded-xl cursor-pointer font-medium transition-all",
                period === p.id && "shadow-xs font-bold"
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          {period === "custom" && (
            <div className="flex items-center gap-1.5 text-xs bg-muted/40 p-1 rounded-xl border border-border/70">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-background text-foreground px-2 py-1 rounded-lg border border-border text-xs outline-none"
              />
              <span className="text-muted-foreground text-[11px]">se</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-background text-foreground px-2 py-1 rounded-lg border border-border text-xs outline-none"
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 gap-1.5 text-xs px-3 rounded-xl cursor-pointer border-border hover:bg-muted"
          >
            <PrinterIcon className="size-3.5 text-primary" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden",
          isLoss
            ? "border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-card to-card text-foreground"
            : "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card text-foreground"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={cn(
                "size-13 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                isLoss
                  ? "bg-rose-600 text-white ring-4 ring-rose-500/20"
                  : "bg-emerald-600 text-white ring-4 ring-emerald-500/20"
              )}
            >
              {isLoss ? (
                <TrendingDownIcon className="size-7 stroke-[2.2]" />
              ) : (
                <TrendingUpIcon className="size-7 stroke-[2.2]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                  {isLoss ? "Nuqsan (Net Loss)" : "Asal Khális Nafa (Net Profit)"}
                </h3>
                <span
                  className={cn(
                    "text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono",
                    isLoss
                      ? "bg-rose-600 text-white"
                      : "bg-emerald-600 text-white"
                  )}
                >
                  {isLoss ? "Nuqsan Warning" : "Mubarak - Munafa"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                {isLoss
                  ? "Khabardar! Is muddat mein dukan ke akhrajat aur maal ki lagat kul sale se zyada rahi hai."
                  : "Dukan ke tamam akhrajat, tankhwah aur maal ki lagat nikalne ke baad aap ki asal bachat."}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right bg-background/80 backdrop-blur-xs p-3 rounded-xl border border-border/60 shadow-2xs">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {periodLabel}
            </div>
            <div
              className={cn(
                "text-2xl sm:text-3xl font-black font-mono tracking-tight my-0.5",
                isLoss
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isLoss ? "-" : "+"} Rs {Math.abs(netProfitOrLoss).toLocaleString()}
            </div>
            <div className="flex items-center md:justify-end gap-1 text-[11px] font-mono font-bold text-muted-foreground">
              <PercentIcon className="size-3 text-primary" />
              <span>Net Bachat Margin: {netMarginPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-foreground">
              Aasan 3-Step Hisab Kitab (Step-by-Step Profit Flow)
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Aam zaban mein nafa nuqsan ka calculation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Step 1: Kul Sale (+)
              </span>
              <ReceiptIcon className="size-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black font-mono text-foreground">
              Rs {totalRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cash: Rs {cashSalesTotal.toLocaleString()} | Udhar: Rs {creditSalesTotal.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Step 2: Maal Kharid Lagat (-)
              </span>
              <PackageIcon className="size-4 text-amber-600" />
            </div>
            <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
              - Rs {totalCOGS.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bikne walay oil aur filters ki kharid qeemat
            </p>
          </div>

          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                Step 3: Dukan Akhrajat (-)
              </span>
              <HandCoinsIcon className="size-4 text-rose-600" />
            </div>
            <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
              - Rs {totalOperatingExpenses.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bills, rent, tankhwah aur staff advances
            </p>
          </div>

          <div
            className={cn(
              "p-3 rounded-xl border space-y-1",
              isLoss
                ? "border-rose-500/40 bg-rose-500/10"
                : "border-emerald-500/40 bg-emerald-500/10"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wide",
                  isLoss
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-emerald-700 dark:text-emerald-400"
                )}
              >
                Final: Asal Bachat (=)
              </span>
              {isLoss ? (
                <AlertTriangleIcon className="size-4 text-rose-600" />
              ) : (
                <CheckCircle2Icon className="size-4 text-emerald-600" />
              )}
            </div>
            <div
              className={cn(
                "text-lg font-black font-mono",
                isLoss
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isLoss ? "-" : "+"} Rs {Math.abs(netProfitOrLoss).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Aap ki jaib mein bachi hui raqam
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
              <ArrowUpRightIcon className="size-4 text-emerald-600" />
              <span>Amdani & Maal Ki Lagat (Sales Details)</span>
            </h4>
            <span className="font-mono font-bold text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Rs {totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Cash Sales (Naqd Farokht)</span>
              <span className="font-mono font-bold text-foreground">
                Rs {cashSalesTotal.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Udhar / Credit Sales (Khatay)</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                Rs {creditSalesTotal.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Maal Kharid Lagat (Cost of Goods)</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                - Rs {totalCOGS.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40 border border-border/60">
              <div>
                <span className="font-bold text-foreground block">
                  Khaam Bachat (Gross Profit)
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  (Sale se maal ki lagat nikalne ke baad)
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-foreground text-sm block">
                  Rs {grossProfit.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  Margin: {grossMarginPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
              <ArrowDownRightIcon className="size-4 text-rose-600" />
              <span>Dukan Ke Akhrajat (Expenses Breakdown)</span>
            </h4>
            <span className="font-mono font-bold text-xs text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">
              Rs {totalOperatingExpenses.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs max-h-64 overflow-y-auto pe-1">
            {Object.entries(categorizedExpenses).map(([categoryName, amount]) => {
              const IconComp = CATEGORY_ICONS[categoryName] || HandCoinsIcon;
              const percentOfTotal =
                totalOperatingExpenses > 0
                  ? ((amount / totalOperatingExpenses) * 100).toFixed(0)
                  : 0;

              return (
                <div
                  key={categoryName}
                  className="p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2 font-medium">
                      <IconComp className="size-3.5 text-rose-500" />
                      <span>{categoryName}</span>
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      Rs {amount.toLocaleString()}
                    </span>
                  </div>

                  {amount > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all"
                          style={{ width: `${percentOfTotal}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                        {percentOfTotal}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-primary">
          <StoreIcon className="size-4" />
          <span>Aasan Misaal (Plain Words Summary):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-card border border-border/60">
            <span className="text-muted-foreground block text-[11px]">1. Kul Bikri (Sale)</span>
            <span className="font-mono font-bold text-foreground text-sm">
              Rs {totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-card border border-border/60">
            <span className="text-muted-foreground block text-[11px]">2. Kharid Lagat (Purchase Cost)</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
              Rs {totalCOGS.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-card border border-border/60">
            <span className="text-muted-foreground block text-[11px]">3. Kul Akhrajat & Tankhwah</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
              Rs {totalOperatingExpenses.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-card border border-border/60">
            <span className="text-muted-foreground block text-[11px]">4. Jaib Ki Asal Bachat</span>
            <span
              className={cn(
                "font-mono font-black text-sm",
                isLoss ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isLoss ? "-" : "+"} Rs {Math.abs(netProfitOrLoss).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
