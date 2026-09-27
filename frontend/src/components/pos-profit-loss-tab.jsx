import { useState, useMemo } from "react";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PrinterIcon,
  CalendarIcon,
  DollarSignIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  UserCheckIcon,
  BuildingIcon,
  ZapIcon,
  TruckIcon,
  FileSpreadsheetIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PosProfitLossTab({
  salesHistory = [],
  expenses = [],
  staffAdvances = [],
}) {
  const [period, setPeriod] = useState("all");

  const filterByPeriod = (dateStr) => {
    if (!dateStr) return false;
    if (period === "all") return true;

    const itemDate = new Date(dateStr);
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
    return true;
  };

  const periodSales = useMemo(() => {
    return salesHistory.filter((s) => filterByPeriod(s.createdAt));
  }, [salesHistory, period]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => filterByPeriod(e.expenseDate || e.createdAt));
  }, [expenses, period]);

  const periodAdvances = useMemo(() => {
    return staffAdvances.filter((a) => a.type === "Advance Given" && filterByPeriod(a.date || a.createdAt));
  }, [staffAdvances, period]);

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
  const grossMarginPercent = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

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
    const generalExps = periodExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    return generalExps + staffAdvancesTotal;
  }, [periodExpenses, staffAdvancesTotal]);

  const netProfitOrLoss = grossProfit - totalOperatingExpenses;
  const isLoss = netProfitOrLoss < 0;
  const netMarginPercent = totalRevenue > 0 ? ((netProfitOrLoss / totalRevenue) * 100).toFixed(1) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/70">
        <div className="flex items-center gap-1.5 flex-wrap">
          <CalendarIcon className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Time Period:</span>
          {["all", "today", "week", "month"].map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="h-7 text-[11px] px-2.5 capitalize cursor-pointer"
            >
              {p === "all" ? "All Time" : p === "today" ? "Aaj (Today)" : p === "week" ? "This Week" : "This Month"}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-7 gap-1.5 text-xs px-2.5 cursor-pointer self-start sm:self-auto"
        >
          <PrinterIcon className="size-3.5 text-primary" />
          <span>Print P&L Statement</span>
        </Button>
      </div>

      <div
        className={cn(
          "rounded-xl border p-4 shadow-sm transition-all",
          isLoss
            ? "border-rose-500/50 bg-rose-500/10 text-rose-950 dark:text-rose-100"
            : "border-emerald-500/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                isLoss
                  ? "bg-rose-500 text-white"
                  : "bg-emerald-600 text-white"
              )}
            >
              {isLoss ? <TrendingDownIcon className="size-6" /> : <TrendingUpIcon className="size-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  {isLoss ? "Khatarnaak Nuqsan (Net Loss)" : "Khális Nafa (Net Profit)"}
                </h3>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono",
                    isLoss ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                  )}
                >
                  {isLoss ? "Loss Warning" : "Profitable"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoss
                  ? "Dukan ke kul Akhrajat aur Staff Advances sales margin se zyada hain jis wajah se nuqsan ho raha hai."
                  : "Dukan ke tamam akhrajat aur tankhwah ada karne ke baad safi bachat."}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10.5px] text-muted-foreground block font-medium">Net Result ({period.toUpperCase()})</span>
            <div
              className={cn(
                "text-2xl sm:text-3xl font-extrabold font-mono",
                isLoss ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isLoss ? "-" : "+"} Rs {Math.abs(netProfitOrLoss).toLocaleString()}
            </div>
            <span className="text-xs font-semibold font-mono text-muted-foreground">
              Net Profit Margin: {netMarginPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowUpRightIcon className="size-4 text-emerald-600" />
              <span>1. Amdani / Sales Revenue</span>
            </h4>
            <span className="font-mono font-bold text-xs text-emerald-600">
              Rs {totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/30">
              <span className="text-muted-foreground">Cash Sales (Counter Farokht)</span>
              <span className="font-mono font-semibold text-foreground">Rs {cashSalesTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/30">
              <span className="text-muted-foreground">Credit / Udhar Sales (Khatay)</span>
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">Rs {creditSalesTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/30">
              <span className="text-muted-foreground">Kharid Lagat (Cost of Goods Sold - COGS)</span>
              <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">- Rs {totalCOGS.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 font-bold bg-muted/30 p-2 rounded-md">
              <span className="text-foreground">Khaam Nafa (Gross Profit)</span>
              <div className="text-right">
                <span className="font-mono text-foreground text-sm">Rs {grossProfit.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground block font-mono">Margin: {grossMarginPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowDownRightIcon className="size-4 text-rose-600" />
              <span>2. Kul Akhrajat & Tankhwah (Expenses)</span>
            </h4>
            <span className="font-mono font-bold text-xs text-rose-600">
              Rs {totalOperatingExpenses.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pe-1">
            {Object.entries(categorizedExpenses).map(([categoryName, amount]) => (
              <div key={categoryName} className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-rose-500/60" />
                  <span>{categoryName}</span>
                </span>
                <span className="font-mono font-semibold text-foreground">
                  Rs {amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs">
        <h4 className="font-bold text-xs text-foreground mb-2">P&L Calculation Formula:</h4>
        <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-xs space-y-1 text-muted-foreground">
          <p>
            <strong className="text-foreground">Gross Profit</strong> = Total Revenue (Rs {totalRevenue.toLocaleString()}) - COGS (Rs {totalCOGS.toLocaleString()}) = <span className="text-foreground font-bold">Rs {grossProfit.toLocaleString()}</span>
          </p>
          <p>
            <strong className="text-foreground">Net Profit / Loss</strong> = Gross Profit (Rs {grossProfit.toLocaleString()}) - Total Expenses & Salaries (Rs {totalOperatingExpenses.toLocaleString()}) ={" "}
            <span className={cn("font-bold text-sm", isLoss ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
              {isLoss ? "-" : "+"} Rs {Math.abs(netProfitOrLoss).toLocaleString()}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
