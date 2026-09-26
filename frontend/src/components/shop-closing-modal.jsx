import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchCurrentShiftStatusApi, closeShopShiftApi } from "@/lib/api";
import { useToastNotification } from "@/components/toast-notification-provider";
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
} from "lucide-react";

export function ShopClosingModal({ isOpen, onClose, onSuccess }) {
  const { notify } = useToastNotification();
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  const [notes, setNotes] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmStep(false);
      setNotes("");
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
        title: "Dukaan Band Ho Gayi (Shop Closed)",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between border-b pb-3">
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
                Rozana hisab-kitab, sales, munafa aur cash drawer ka mukammal summary.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">Loading shift metrics...</p>
          </div>
        ) : (
          <>
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
                  <span className="text-[11px] font-medium">Kharid Cost (Cost)</span>
                  <DollarSignIcon className="size-3.5 text-amber-500" />
                </div>
                <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                  Rs. {(m.totalCost || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Direct Goods Cost
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-medium">Kul Munafa (Gross Profit)</span>
                  <TrendingUpIcon className="size-3.5 text-emerald-500" />
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-500 font-mono">
                  Rs. {(m.totalProfit || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Margin: {m.totalSales ? Math.round((m.totalProfit / m.totalSales) * 100) : 0}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-medium">Akhrajaat (Expenses)</span>
                  <ReceiptIcon className="size-3.5 text-destructive" />
                </div>
                <div className="text-base sm:text-lg font-bold text-destructive font-mono">
                  Rs. {(m.totalExpenses || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Today's Vouchers
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
                  Total Volume Deducted
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

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between text-primary mb-1">
                  <span className="text-[11px] font-medium">Net Day Margin</span>
                  <ShieldCheckIcon className="size-3.5" />
                </div>
                <div className="text-base sm:text-lg font-bold text-primary font-mono">
                  Rs. {(m.netDayMargin || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Profit - Expenses
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ClockIcon className="size-4 text-primary shrink-0" />
                <span>
                  Official Shift: <strong className="text-foreground">10:00 AM — 06:00 PM</strong>.
                  Manual closing can be initiated at any time.
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-muted-foreground">Drawer Balance:</span>
                <span className="font-bold text-foreground font-mono">
                  Rs. {(m.netCashInDrawer || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {!isClosed && (
              <div className="space-y-2">
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
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs space-y-1 animate-in fade-in">
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
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
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
          </>
        )}

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 px-4"
          >
            {isClosed ? "Band Karein (Close)" : "Cancel"}
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
                {confirmStep ? "Haan, Shop Close Karein" : "Shop Close (Dukaan Band)"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
