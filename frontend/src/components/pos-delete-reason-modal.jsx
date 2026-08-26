import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, RotateCcwIcon, XIcon, PackageCheckIcon, FileTextIcon } from "lucide-react";

export function PosDeleteReasonModal({
  isOpen,
  onClose,
  onConfirm,
  sale,
  loading = false,
}) {
  const [reason, setReason] = useState("Customer Returned Goods / Order Cancelled");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("Customer Returned Goods / Order Cancelled");
      setNotes("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || loading) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !sale || typeof window === "undefined") return null;

  const items = sale.items || [];
  const grandTotal = sale.grandTotal || sale.totalAmount || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ reason, notes });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center">
              <AlertTriangleIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Delete Sale & Restore Stock</h3>
              <p className="text-[11px] text-muted-foreground">Super Admin Audit Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Receipt #</span>
              <span className="font-mono font-bold text-primary">{sale.saleNumber}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Customer</span>
              <span className="font-semibold text-foreground">{sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ""}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Sale Value</span>
              <span className="font-mono font-bold text-destructive">Rs {grandTotal.toLocaleString()}</span>
            </div>

            {items.length > 0 && (
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                  <PackageCheckIcon className="size-3.5" />
                  <span>Items Automatically Restored to Inventory:</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {items.map((itm, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-muted/40 px-2 py-1 rounded">
                      <span className="truncate max-w-[240px] text-foreground font-medium">{itm.productName || "Product"}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{itm.quantity} {itm.unitType || "Liters"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <RotateCcwIcon className="size-3.5 text-primary" />
              <span>Reason for Cancellation / Deletion <span className="text-destructive">*</span></span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              required
            >
              <option value="Customer Returned Goods / Order Cancelled">Customer Returned Goods / Order Cancelled</option>
              <option value="Wrong Punching / Billing Mistake">Wrong Punching / Billing Mistake</option>
              <option value="Cash / Payment Mismatch">Cash / Payment Mismatch</option>
              <option value="Duplicate Sale Punch">Duplicate Sale Punch</option>
              <option value="Customer Changed Mind / Left Counter">Customer Changed Mind / Left Counter</option>
              <option value="Defective Product / Leakage">Defective Product / Leakage</option>
              <option value="Other Operational Reason">Other Operational Reason</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileTextIcon className="size-3.5 text-muted-foreground" />
              <span>Audit Notes / Remarks (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Return approved by manager, full cash refund issued."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer text-xs"
            >
              Keep Sale
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={loading}
              className="cursor-pointer text-xs font-semibold gap-1.5"
            >
              <RotateCcwIcon className="size-3.5" />
              <span>{loading ? "Restoring Stock & Deleting..." : "Confirm Delete & Restore Stock"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
