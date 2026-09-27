import { useState, useEffect } from "react";
import {
  XIcon,
  CheckCircle2Icon,
  HandCoinsIcon,
  UserIcon,
  CreditCardIcon,
  Building2Icon,
  BanknoteIcon,
  ReceiptIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePosSaleApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque"];

export function PosUdharUpdateModal({
  isOpen,
  onClose,
  sale,
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState("vasooli");
  const [vasooliAmount, setVasooliAmount] = useState("");
  const [vasooliMode, setVasooliMode] = useState("Cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("Credit / Khata");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sale) {
      const remaining = Math.max(0, (Number(sale.grandTotal) || 0) - (Number(sale.cashReceived) || 0));
      setVasooliAmount(String(remaining || sale.grandTotal || ""));
      setCustomerName(sale.customerName || "");
      setCustomerPhone(sale.customerPhone || "");
      setPaymentMode(sale.paymentMode || "Credit / Khata");
      setNotes(sale.notes || "");
      setActiveTab("vasooli");
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  const grandTotal = Number(sale.grandTotal) || 0;
  const alreadyReceived = Number(sale.cashReceived) || 0;
  const remainingDue = Math.max(0, grandTotal - alreadyReceived);

  const handleVasooliSubmit = async (e) => {
    e.preventDefault();
    if (!vasooliAmount || Number(vasooliAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    try {
      setSaving(true);
      const res = await updatePosSaleApi(sale._id, {
        isVasooli: true,
        vasooliAmount: Number(vasooliAmount),
        vasooliPaymentMode: vasooliMode,
        notes: notes.trim(),
      });

      if (res?.success) {
        toast.success(`Rs ${Number(vasooliAmount).toLocaleString()} payment received and khata updated!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res?.message || "Failed to record payment.");
      }
    } catch (err) {
      toast.error(err.message || "Error processing payment");
    } finally {
      setSaving(false);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await updatePosSaleApi(sale._id, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMode,
        notes: notes.trim(),
      });

      if (res?.success) {
        toast.success("Sale bill and Customer Khata updated successfully!");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res?.message || "Failed to update sale bill.");
      }
    } catch (err) {
      toast.error(err.message || "Error updating sale");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <CreditCardIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">
                  Udhar Maal Update & Vasooli
                </h3>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {sale.saleNumber}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Update customer details, payment status, or record credit collection.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-bold text-foreground">{sale.customerName || "Walk-in Customer"}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Kul Bill Amount:</span>
            <span className="font-mono font-bold text-foreground">Rs {grandTotal.toLocaleString()}</span>
          </div>
          {alreadyReceived > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Pehle Ada Shuda (Paid):</span>
              <span className="font-mono font-semibold text-emerald-600">Rs {alreadyReceived.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-500/20 font-bold">
            <span className="text-amber-700 dark:text-amber-400">Baqaya Udhar:</span>
            <span className="font-mono text-sm text-amber-700 dark:text-amber-400">
              Rs {remainingDue.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-border/80 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("vasooli")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer",
              activeTab === "vasooli"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <HandCoinsIcon className="size-3.5" />
            <span>Udhar Wasool Karein</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer",
              activeTab === "details"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <UserIcon className="size-3.5" />
            <span>Customer & Bill Change</span>
          </button>
        </div>

        {activeTab === "vasooli" ? (
          <form onSubmit={handleVasooliSubmit} className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-foreground">Kitni Raqam Vasool Hui? (PKR) *</label>
                <button
                  type="button"
                  onClick={() => setVasooliAmount(String(remainingDue))}
                  className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  Poori Baqaya Raqam (Rs {remainingDue.toLocaleString()})
                </button>
              </div>
              <Input
                type="number"
                min="1"
                max={grandTotal}
                required
                value={vasooliAmount}
                onChange={(e) => setVasooliAmount(e.target.value)}
                className="h-8.5 text-xs font-mono font-bold"
                placeholder="e.g. 5000"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Payment Kahan / Kaise Aayi? *</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setVasooliMode(mode)}
                    className={cn(
                      "p-2 rounded-lg border text-center font-semibold text-[11px] transition-all cursor-pointer flex flex-col items-center gap-1",
                      vasooliMode === mode
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "Cash" && <BanknoteIcon className="size-4" />}
                    {mode === "Bank Transfer" && <Building2Icon className="size-4" />}
                    {mode === "Cheque" && <ReceiptIcon className="size-4" />}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Vasooli Notes (Optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dukan par aakar cash de gaya..."
                className="h-8 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {saving ? "Updating..." : "Wasooli Record & Khata Clear Karein"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleDetailsSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-foreground mb-1">Customer / Party Name *</label>
              <Input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer ka naam..."
                className="h-8.5 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Customer Contact / Phone</label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0300-1234567"
                className="h-8.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground cursor-pointer focus:outline-none"
              >
                <option value="Credit / Khata">Udhar / Credit Maal (Khata)</option>
                <option value="Cash">Cash (Paid in Full)</option>
                <option value="Bank Transfer">Bank Transfer (Paid in Full)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Koi zaroori baat ya reference..."
                className="h-8 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="h-8 text-xs font-bold cursor-pointer"
              >
                {saving ? "Updating..." : "Bill & Khata Update Karein"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
