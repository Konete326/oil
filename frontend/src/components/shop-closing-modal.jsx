import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchCurrentShiftStatusApi, closeShopShiftApi } from "@/lib/api";
import { useToastNotification } from "@/components/toast-notification-provider";
import logoImg from "@/assets/logo.png";
import {
  XIcon,
  StoreIcon,
  ClockIcon,
  DollarSignIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  ReceiptIcon,
  DropletsIcon,
  WalletIcon,
  CreditCardIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  PrinterIcon,
  PackageIcon,
  SendIcon,
  BoxesIcon,
} from "lucide-react";

export function ShopClosingModal({ isOpen, onClose, onSuccess }) {
  const { notify } = useToastNotification();
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  const [notes, setNotes] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);
  const [viewMode, setViewMode] = useState("overview");

  useEffect(() => {
    if (!isOpen) {
      setConfirmStep(false);
      setNotes("");
      setViewMode("overview");
      return;
    }
    loadShift();
  }, [isOpen]);

  const loadShift = async () => {
    setLoading(true);
    const res = await fetchCurrentShiftStatusApi();
    if (res?.success && res.data) {
      setShiftData(res.data);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const m = shiftData?.metrics || {};
  const isClosed = Boolean(shiftData?.isClosed);
  const isShiftActive = Boolean(shiftData?.isShiftActive);

  const handleCloseShift = async () => {
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    setClosing(true);
    const res = await closeShopShiftApi({
      closeType: "Manual",
      notes: notes.trim(),
    });
    setClosing(false);

    if (res?.success) {
      notify({
        title: "Shop Shift Closed",
        message: "Today's shift closed successfully. Counter reset. Further sales will post to next day.",
        type: "success",
      });
      if (onSuccess) onSuccess(res.data);
      onClose();
    } else {
      notify({
        title: "Closing Failed",
        message: res?.message || "Failed to close shift. Please try again.",
        type: "error",
      });
    }
  };

  const handlePrint = () => {
    const orig = document.title;
    const dateStr = shiftData?.todayStr || new Date().toISOString().split("T")[0];
    document.title = `AlKhaleej_DayClosing_ZReport_${dateStr}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleWhatsAppShare = () => {
    const dateStr = shiftData?.todayStr || new Date().toLocaleDateString("en-GB");
    const text =
      `*AL KHALEEJ LUBRICANTS*\n` +
      `*DAILY SHOP CLOSING & Z-REPORT (روزانہ کلوزنگ رپورٹ)*\n` +
      `*Tareekh:* ${dateStr}\n` +
      `*Status:* ${isClosed ? "CLOSED (دوکان بند)" : "ACTIVE SHIFT"}\n` +
      `------------------------------------\n` +
      `▪ *Kul Farokht (Gross Sales):* Rs ${(m.totalSales || 0).toLocaleString()} (${m.ordersCount || 0} Orders)\n` +
      `▪ *Naqd Farokht (Cash):* Rs ${(m.cashSales || 0).toLocaleString()}\n` +
      `▪ *Udhar / Credit:* Rs ${(m.creditSales || 0).toLocaleString()}\n` +
      `▪ *Farokht Shuda Liters:* ${(m.totalLitersSold || 0).toLocaleString()} L\n` +
      `------------------------------------\n` +
      `▪ *Baqaya Mojooda Maal (In-Stock):* ${(m.totalStockRemainingLiters || 0).toLocaleString()} L\n` +
      `▪ *Stock Valuation:* Rs ${(m.totalStockValuation || 0).toLocaleString()}\n` +
      `------------------------------------\n` +
      `▪ *Kharid Cost:* Rs ${(m.totalCost || 0).toLocaleString()}\n` +
      `▪ *Kul Munafa (Gross Profit):* Rs ${(m.totalProfit || 0).toLocaleString()}\n` +
      `▪ *Akhrajaat (Expenses):* Rs ${(m.totalExpenses || 0).toLocaleString()}\n` +
      `▪ *Net Day Margin (Bachat):* Rs ${(m.netDayMargin || 0).toLocaleString()}\n` +
      `▪ *Galla Cash in Drawer:* Rs ${(m.netCashInDrawer || 0).toLocaleString()}\n` +
      `------------------------------------\n` +
      `Shop No. 23, Nishter Road, Karachi | Ph: 0300-2205541`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return createPortal(
    <div className="print-portal fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-portal {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
          .printable-report {
            display: block !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl my-auto max-h-[92vh] overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:p-0 print:block print:bg-white">
        
        <div className="flex items-start justify-between border-b pb-3 print:hidden gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <StoreIcon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Shop Day Closing & Z-Report
                </h2>
                <Badge
                  variant={isClosed ? "secondary" : isShiftActive ? "default" : "outline"}
                  className="text-[10px] uppercase font-mono px-2 py-0.5"
                >
                  {isClosed ? "Closed" : isShiftActive ? "Open (10 AM - 6 PM)" : "Shift Off"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Rozana hisab-kitab, sales, baqaya mojooda stock, aur cash drawer ka mukammal summary.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => setViewMode("overview")}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                  viewMode === "overview" ? "bg-card text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Overview Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("report")}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                  viewMode === "report" ? "bg-card text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Z-Report Sheet
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleWhatsAppShare}
              className="gap-1.5 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white h-8"
              title="Share Closing on WhatsApp"
            >
              <SendIcon className="size-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs cursor-pointer bg-primary text-primary-foreground font-semibold h-8"
              title="Print Complete Day Z-Report"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print Report</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">Loading shift & stock metrics...</p>
          </div>
        ) : (
          <>
            <div className={viewMode === "report" ? "hidden print:block printable-report" : "block print:hidden"}>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Kul Farokht (Gross)</span>
                    <ShoppingBagIcon className="size-3.5 text-blue-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                    Rs. {(m.totalSales || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Orders: {m.ordersCount || 0} Slips
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Naqd Farokht (Cash)</span>
                    <WalletIcon className="size-3.5 text-emerald-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                    Rs. {(m.cashSales || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Immediate In-Hand Cash
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Khata / Udhar (Credit)</span>
                    <CreditCardIcon className="size-3.5 text-purple-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-purple-400 font-mono">
                    Rs. {(m.creditSales || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Client Ledger Balance
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Farokht Shuda Liters</span>
                    <DropletsIcon className="size-3.5 text-cyan-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                    {(m.totalLitersSold || 0).toLocaleString()} Liters
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Volume Sold Today
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 mb-1 font-bold">
                    <span className="text-[11px]">Baqaya Mojooda Maal</span>
                    <BoxesIcon className="size-4" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-cyan-700 dark:text-cyan-300 font-mono">
                    {(m.totalStockRemainingLiters || 0).toLocaleString()} Liters
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Shop & Godown Me Mojood
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1 font-bold">
                    <span className="text-[11px]">Mojooda Maal Ki Maliyat</span>
                    <PackageIcon className="size-4" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 font-mono">
                    Rs. {(m.totalStockValuation || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Total Inventory Asset Value
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-medium">Kul Munafa (Gross)</span>
                    <TrendingUpIcon className="size-3.5 text-emerald-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-500 font-mono">
                    Rs. {(m.totalProfit || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Margin: {m.totalSales ? Math.round((m.totalProfit / m.totalSales) * 100) : 0}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between text-primary mb-1">
                    <span className="text-[11px] font-medium">Net Day Margin</span>
                    <ShieldCheckIcon className="size-3.5" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-primary font-mono">
                    Rs. {(m.netDayMargin || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Profit - Expenses ({m.totalExpenses ? `Rs ${m.totalExpenses.toLocaleString()}` : "Rs 0"})
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <DropletsIcon className="size-4 text-cyan-600 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200">
                    <strong>Stock Reconciliation:</strong> Aaj total <strong className="font-mono">{(m.totalLitersSold || 0).toLocaleString()} Liters</strong> maal bika hai, aur abhi shop/godown me <strong className="font-mono text-cyan-600 dark:text-cyan-400">{(m.totalStockRemainingLiters || 0).toLocaleString()} Liters</strong> maal mojood hai.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-background px-2.5 py-1 rounded-lg border border-border">
                  <span className="text-muted-foreground">Drawer Galla:</span>
                  <span className="font-bold text-foreground font-mono">
                    Rs. {(m.netCashInDrawer || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {!isClosed && (
                <div className="space-y-2 mt-4">
                  <Input
                    type="text"
                    placeholder="Closing Remarks / Handover Notes (Optional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs h-9 bg-muted/30"
                  />
                </div>
              )}

              {confirmStep && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs space-y-1 animate-in fade-in mt-3">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <AlertTriangleIcon className="size-4 shrink-0" />
                    <span>Khatmi Tasdeeq: Kya aap waqai shop close karna chahte hain?</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6">
                    Dukaan close hote hi aaj ka active sales counter 0 ho jayega. Iske baad jo bhi sale hogi wo agle din (Next Day Shift) par count hogi aur stock barabar cut hoga.
                  </p>
                </div>
              )}

              {isClosed && shiftData?.closedShift && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2Icon className="size-4" />
                    <span>
                      Dukaan band ho chuki hai ({shiftData.closedShift.closeType} Closed at{" "}
                      {new Date(shiftData.closedShift.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    By: {shiftData.closedShift.closedBy}
                  </span>
                </div>
              )}
            </div>

            <div className={viewMode === "report" ? "block printable-report" : "hidden print:block printable-report"}>
              <div className="border-2 border-slate-900 rounded-xl p-6 bg-white text-slate-900 space-y-5 font-sans">
                
                <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-3">
                    <img src={logoImg} alt="Al Khaleej" className="size-14 object-contain border border-slate-900 p-0.5 rounded-full" />
                    <div>
                      <h1 className="text-xl font-black text-slate-950 font-mono tracking-tight uppercase">
                        AL KHALEEJ LUBRICANTS
                      </h1>
                      <p className="text-xs font-bold text-slate-800">
                        DAILY SHOP SHIFT CLOSING & Z-REPORT (روزانہ حساب و کلوزنگ شیٹ)
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Shop No. 23, Near Fatima Jinnah Girls College, Nishter Road, Karachi | Ph: 0300-2205541
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold border border-slate-900 uppercase">
                      {isClosed ? "CLOSED SHIFT" : "ACTIVE SHIFT"}
                    </span>
                    <p className="font-bold pt-1.5 text-sm">
                      Tareekh: {shiftData?.todayStr || new Date().toLocaleDateString("en-GB")}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Timings: 10:00 AM — 06:00 PM
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-950 pb-1.5 border-b border-slate-400">
                      1. Sales & Revenue Hisab (فروخت و آمدنی)
                    </h3>
                    <table className="w-full text-xs mt-1.5 border border-slate-900 border-collapse">
                      <thead className="bg-slate-100 font-bold border-b border-slate-900">
                        <tr>
                          <th className="border-r border-slate-900 py-1.5 px-2 text-left">Description</th>
                          <th className="border-r border-slate-900 py-1.5 px-2 text-center">Orders</th>
                          <th className="border-r border-slate-900 py-1.5 px-2 text-right">Farokht (Sales)</th>
                          <th className="py-1.5 px-2 text-right">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        <tr>
                          <td className="border-r border-slate-900 py-1.5 px-2 font-medium">Naqd Farokht (Cash Counter Sales)</td>
                          <td className="border-r border-slate-900 py-1.5 px-2 text-center font-mono">-</td>
                          <td className="border-r border-slate-900 py-1.5 px-2 text-right font-mono font-bold">Rs. {(m.cashSales || 0).toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right text-emerald-800 font-bold">CASH RECEIVED</td>
                        </tr>
                        <tr>
                          <td className="border-r border-slate-900 py-1.5 px-2 font-medium">Udhar Farokht (Credit Khata Sales)</td>
                          <td className="border-r border-slate-900 py-1.5 px-2 text-center font-mono">-</td>
                          <td className="border-r border-slate-900 py-1.5 px-2 text-right font-mono font-bold">Rs. {(m.creditSales || 0).toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right text-amber-800 font-bold">KHATA RECEIVABLE</td>
                        </tr>
                        <tr className="bg-slate-50 font-black border-t-2 border-slate-900">
                          <td className="border-r border-slate-900 py-2 px-2 uppercase font-mono">Kul Farokht (Gross Total Sales)</td>
                          <td className="border-r border-slate-900 py-2 px-2 text-center font-mono">{m.ordersCount || 0} Slips</td>
                          <td className="border-r border-slate-900 py-2 px-2 text-right font-mono text-sm">Rs. {(m.totalSales || 0).toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-mono">100% Synced</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-950 pb-1.5 border-b border-slate-400">
                      2. Stock & Liters Reconciliation (اسٹاک و لیٹرز کی تصدیق)
                    </h3>
                    <table className="w-full text-xs mt-1.5 border border-slate-900 border-collapse">
                      <thead className="bg-slate-100 font-bold border-b border-slate-900">
                        <tr>
                          <th className="border-r border-slate-900 py-1.5 px-2 text-left">Stock Item / Details</th>
                          <th className="border-r border-slate-900 py-1.5 px-2 text-center">Volume (Liters)</th>
                          <th className="py-1.5 px-2 text-right">Value / Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        <tr>
                          <td className="border-r border-slate-900 py-1.5 px-2 font-medium">Farokht Shuda Liters (Aaj Ka Total Bika Hua Maal)</td>
                          <td className="border-r border-slate-900 py-1.5 px-2 text-center font-mono font-bold">{(m.totalLitersSold || 0).toLocaleString()} L</td>
                          <td className="py-1.5 px-2 text-right font-mono">Deducted from Inventory</td>
                        </tr>
                        <tr className="bg-cyan-50 font-bold">
                          <td className="border-r border-slate-900 py-2 px-2">Baqaya Mojooda Maal (Abhi Dukan & Godown Me Mojood Maal)</td>
                          <td className="border-r border-slate-900 py-2 px-2 text-center font-mono text-sm text-cyan-900">{(m.totalStockRemainingLiters || 0).toLocaleString()} L</td>
                          <td className="py-2 px-2 text-right font-mono font-black text-cyan-900">Rs. {(m.totalStockValuation || 0).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-950 pb-1.5 border-b border-slate-400">
                      3. Financial Profit, Cost & Expenses (منافع و اخراجات)
                    </h3>
                    <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-center">
                      <div className="border border-slate-800 p-2 rounded">
                        <span className="text-[10px] text-slate-600 block">Kharid Cost (Cost)</span>
                        <span className="font-bold text-xs">Rs. {(m.totalCost || 0).toLocaleString()}</span>
                      </div>
                      <div className="border border-slate-800 p-2 rounded">
                        <span className="text-[10px] text-slate-600 block">Kul Munafa (Gross)</span>
                        <span className="font-bold text-xs text-emerald-800">Rs. {(m.totalProfit || 0).toLocaleString()}</span>
                      </div>
                      <div className="border border-slate-800 p-2 rounded">
                        <span className="text-[10px] text-slate-600 block">Akhrajaat (Expenses)</span>
                        <span className="font-bold text-xs text-red-800">Rs. {(m.totalExpenses || 0).toLocaleString()}</span>
                      </div>
                      <div className="border-2 border-slate-900 bg-slate-100 p-2 rounded">
                        <span className="text-[10px] font-bold block">Net Day Margin</span>
                        <span className="font-black text-sm text-slate-950">Rs. {(m.netDayMargin || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-950 pb-1.5 border-b border-slate-400">
                      4. Galla Drawer Cash Hisab (دکان گلہ)
                    </h3>
                    <div className="flex items-center justify-between p-2.5 border border-slate-900 bg-slate-50 font-mono">
                      <span>Net Cash In Drawer (Galla Balance):</span>
                      <span className="text-base font-black">Rs. {(m.netCashInDrawer || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-10 grid grid-cols-2 gap-8 text-xs text-slate-800">
                  <div>
                    <div className="w-52 border-b border-slate-800 pt-1 text-center font-bold">
                      Cashier / Munshi Signature
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="w-52 border-b border-slate-800 pt-1 text-center font-bold">
                      Owner / Manager Stamp & Signature
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t pt-3 print:hidden gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground font-mono">
            {isClosed ? "Shift is closed for today." : "Official closing time: 06:00 PM."}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-4 cursor-pointer"
            >
              {isClosed ? "Close" : "Cancel"}
            </Button>

            {!isClosed && (
              <Button
                variant={confirmStep ? "destructive" : "default"}
                size="sm"
                disabled={loading || closing}
                onClick={handleCloseShift}
                className="text-xs h-9 px-4 font-semibold gap-1.5 shadow-sm cursor-pointer"
              >
                {closing ? (
                  <div className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <StoreIcon className="size-3.5" />
                )}
                <span>
                  {confirmStep ? "Yes, Close Shift" : "Close Shift (Dukaan Band)"}
                </span>
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
