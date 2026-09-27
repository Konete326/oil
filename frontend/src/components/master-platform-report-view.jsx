import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchMasterPlatformReportApi } from "@/lib/api";
import { exportMasterReportToExcel } from "@/lib/master-report-export";
import { useToastNotification } from "@/components/toast-notification-provider";
import {
  PrinterIcon,
  FileSpreadsheetIcon,
  RefreshCwIcon,
  CalendarIcon,
  TrendingUpIcon,
  DollarSignIcon,
  ShoppingBagIcon,
  ReceiptIcon,
  DropletsIcon,
  WalletIcon,
  UsersIcon,
  TruckIcon,
  ShieldCheckIcon,
  BoxesIcon,
  Building2Icon,
  BarChart3Icon,
} from "lucide-react";

export function MasterPlatformReportView() {
  const { notify } = useToastNotification();
  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    const params = { period };
    if (isCustom && startDate) params.startDate = startDate;
    if (isCustom && endDate) params.endDate = endDate;
    const res = await fetchMasterPlatformReportApi(params);
    if (res?.success && res.data) {
      setReport(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  const handlePeriodChange = (p) => {
    if (p === "custom") {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setPeriod(p);
    }
  };

  const handleCustomApply = () => {
    setPeriod("custom");
    loadReport();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!report) return;
    const filename = `Al_Khaleej_Master_Report_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    exportMasterReportToExcel(report, filename);
    notify({
      title: "Excel Report Exported",
      message: "Master platform report successfully downloaded.",
      type: "success",
    });
  };

  const ex = report?.executiveSummary || {};
  const cf = report?.cashFlow || {};
  const exp = report?.expenses || {};
  const inv = report?.inventory || {};
  const acc = report?.accounts || {};
  const meta = report?.meta || {};

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Master Platform Report & Audit
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono uppercase bg-primary/10 text-primary border-primary/20">
              Consolidated
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ek hi jagah poore platform ki farokht, kharid, munafa, akhrajaat, liters stock aur khaton ki comprehensive report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={loadReport}
            className="gap-1.5 h-9 text-xs cursor-pointer"
          >
            <RefreshCwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={loading || !report}
            onClick={handleExportExcel}
            className="gap-1.5 h-9 text-xs cursor-pointer border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <FileSpreadsheetIcon className="size-3.5" />
            <span>Export Excel</span>
          </Button>

          <Button
            size="sm"
            disabled={loading || !report}
            onClick={handlePrint}
            className="gap-1.5 h-9 text-xs cursor-pointer bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <PrinterIcon className="size-3.5" />
            <span>Print Report (A4 / PDF)</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-muted/40 border border-border/60 print:hidden">
        {[
          { id: "today", label: "Aaj Ka Din (Today)" },
          { id: "this_week", label: "Is Hafte (This Week)" },
          { id: "this_month", label: "Is Maheene (This Month)" },
          { id: "last_month", label: "Pichla Maheena (Last Month)" },
          { id: "this_year", label: "Maliyaati Saal (Year)" },
          { id: "all", label: "All-Time (Mukammal)" },
          { id: "custom", label: "Custom Dates" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handlePeriodChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              (tab.id === "custom" && isCustom) || (!isCustom && period === tab.id)
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}

        {isCustom && (
          <div className="flex items-center gap-2 pl-2 border-l border-border/80 w-full sm:w-auto mt-2 sm:mt-0">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs w-36 bg-background"
            />
            <span className="text-xs text-muted-foreground font-mono">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs w-36 bg-background"
            />
            <Button size="sm" onClick={handleCustomApply} className="h-8 px-3 text-xs">
              Filter
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">Consolidating platform audit records...</p>
        </div>
      ) : !report ? (
        <div className="py-16 text-center text-muted-foreground text-xs">
          No records found for the selected timeframe.
        </div>
      ) : (
        <div id="printable-master-report" className="space-y-6">
          <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-foreground">
                  Al Khaleej Lubricants & Oil Traders
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Official Master Platform Business & Financial Statement
                </p>
              </div>
              <div className="text-left sm:text-right space-y-0.5">
                <div className="text-[11px] font-mono text-muted-foreground">
                  Period: <strong className="text-foreground uppercase">{meta.period || "Selected Range"}</strong>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Generated: {new Date(meta.generatedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase">Gross Farokht (Sales)</span>
                  <ShoppingBagIcon className="size-4" />
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-foreground font-mono">
                  Rs. {(ex.grossRevenue || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>Slips: {ex.ordersCount || 0}</span>
                  <span>Cash: Rs. {((ex.cashSales || 0) / 1000).toFixed(0)}k</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase">Kharid Cost (COGS)</span>
                  <DollarSignIcon className="size-4" />
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-foreground font-mono">
                  Rs. {(ex.cogs || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Direct Stock Procurement Cost
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-between text-destructive mb-1">
                  <span className="text-[11px] font-semibold uppercase">Kul Akhrajaat (Expenses)</span>
                  <ReceiptIcon className="size-4" />
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-destructive font-mono">
                  Rs. {(ex.totalExpenses || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Operating Overhead Vouchers
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase">Khaalis Munafa (Net Profit)</span>
                  <TrendingUpIcon className="size-4" />
                </div>
                <div className={`text-lg sm:text-xl font-extrabold font-mono ${ex.netProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  Rs. {(ex.netProfit || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>Gross Margin: {ex.grossMarginPct}%</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Net: {ex.netMarginPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <WalletIcon className="size-4 text-emerald-500" />
                <span>Cash Flow & Counter Movement (Naqdi Record)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] text-muted-foreground uppercase">Cash Inflow</div>
                  <div className="text-sm font-bold text-emerald-500 font-mono mt-0.5">
                    Rs. {(cf.cashInflow || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="text-[10px] text-muted-foreground uppercase">Cash Outflow</div>
                  <div className="text-sm font-bold text-destructive font-mono mt-0.5">
                    Rs. {(cf.cashOutflow || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-[10px] text-muted-foreground uppercase">Net Cash Move</div>
                  <div className="text-sm font-bold text-primary font-mono mt-0.5">
                    Rs. {(cf.netCashMovement || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <BoxesIcon className="size-4 text-cyan-500" />
                <span>Inventory & Stock Volume (Sab Liters Me)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-[10px] text-muted-foreground uppercase">Available Liters</div>
                  <div className="text-sm font-bold text-cyan-500 font-mono mt-0.5">
                    {(inv.totalStockLiters || 0).toLocaleString()} L
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-[10px] text-muted-foreground uppercase">Stock Valuation</div>
                  <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                    Rs. {(inv.stockValuation || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] text-muted-foreground uppercase">Sold in Period</div>
                  <div className="text-sm font-bold text-emerald-500 font-mono mt-0.5">
                    {(ex.totalLitersSold || 0).toLocaleString()} L
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <ReceiptIcon className="size-4 text-destructive" />
                <span>Operating Expenses Breakdown by Category (Akhrajaat)</span>
              </div>
              <span className="text-xs font-mono font-bold text-destructive">
                Total: Rs. {(exp.total || 0).toLocaleString()}
              </span>
            </div>

            {Array.isArray(exp.byCategory) && exp.byCategory.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {exp.byCategory.map((cat, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="text-[11px] font-medium text-muted-foreground truncate">{cat.category}</div>
                    <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                      Rs. {cat.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{cat.percentage}% of total</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 text-center">No expense entries recorded in this timeframe.</p>
            )}
          </div>

          <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <DropletsIcon className="size-4 text-cyan-500" />
                <span>Product-Wise Stock & Valuation (Detailed Catalog)</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Total Items: {inv.totalProductsCount || 0}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border/60 text-[10px] uppercase text-muted-foreground font-mono">
                  <tr>
                    <th className="p-2">Product Name</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-right">Stock (Liters)</th>
                    <th className="p-2 text-right">Cost Rate</th>
                    <th className="p-2 text-right">Selling Rate</th>
                    <th className="p-2 text-right">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {(inv.productsList || []).map((p) => (
                    <tr key={p._id} className="hover:bg-muted/30">
                      <td className="p-2 font-sans font-medium text-foreground">{p.name}</td>
                      <td className="p-2 text-muted-foreground">{p.sku}</td>
                      <td className="p-2 text-muted-foreground">{p.category}</td>
                      <td className="p-2 text-right font-bold text-foreground">{p.stockLiters.toLocaleString()} L</td>
                      <td className="p-2 text-right text-muted-foreground">Rs. {p.costPrice.toLocaleString()}</td>
                      <td className="p-2 text-right text-foreground">Rs. {p.sellingPrice.toLocaleString()}</td>
                      <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {p.stockValuation.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <UsersIcon className="size-4 text-purple-500" />
                  <span>Customer Khata (Receivables Udhar)</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-500">
                  Total: Rs. {(acc.totalCustomerReceivables || 0).toLocaleString()}
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {(acc.topReceivables || []).slice(0, 6).map((c) => (
                  <div key={c._id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.phone || "No Phone"}</div>
                    </div>
                    <div className="font-bold font-mono text-purple-400">
                      Rs. {(c.currentBalance || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <TruckIcon className="size-4 text-amber-500" />
                  <span>Supplier Khata (Payables Khareedari)</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-500">
                  Total: Rs. {(acc.totalSupplierPayables || 0).toLocaleString()}
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {(acc.topPayables || []).slice(0, 6).map((s) => (
                  <div key={s._id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">{s.company || s.phone || "Refinery/Supplier"}</div>
                    </div>
                    <div className="font-bold font-mono text-amber-500">
                      Rs. {(s.currentBalance || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border grid grid-cols-3 gap-6 text-center text-xs font-medium text-muted-foreground">
            <div className="border-t border-muted-foreground/30 pt-2">
              <span>Prepared By (Cashier)</span>
            </div>
            <div className="border-t border-muted-foreground/30 pt-2">
              <span>Verified By (Accountant)</span>
            </div>
            <div className="border-t border-muted-foreground/30 pt-2">
              <span>Approved By (Super Admin)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
