import { useState } from "react";
import { XIcon, PlusIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createSupplierPaymentApi } from "@/lib/api";

const PAYMENT_MODES = ["Cash", "Cheque", "Bank Transfer", "Online POS"];

export function SupplierPaymentModal({ isOpen, onClose, suppliers = [], onSuccess }) {
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const [amountValid, setAmountValid] = useState(false);

  const isFormValid = amountValid;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      const targetSupplierId = supplierId || suppliers[0]?._id;
      await createSupplierPaymentApi({
        supplierId: targetSupplierId,
        amount: Number(amount),
        paymentMode,
        referenceNumber: paymentMode === "Cash" ? "" : referenceNumber,
      });

      toast.success("Supplier payment recorded successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to record supplier payment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSupplierId("");
    setAmount("");
    setPaymentMode("Cash");
    setReferenceNumber("");
  };

  const selectedSupplierObj = suppliers.find((s) => s._id === supplierId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Record Supplier Payment</h2>
            <p className="text-xs text-muted-foreground">Record payment paid to vendor / refinery (Khareedari Khata).</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground">Select Supplier / Refinery (Optional)</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">-- Choose Supplier (Default: First Available) --</option>
              {suppliers.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name} (Balance: Rs. {sup.currentBalance?.toLocaleString() || 0})
                </option>
              ))}
            </select>
          </div>

          {selectedSupplierObj && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance Owed:</span>
                <span className="font-mono font-bold text-amber-500">Rs. {selectedSupplierObj.currentBalance?.toLocaleString() || 0}</span>
              </div>
            </div>
          )}

          <ValidatedInput
            label="Payment Amount Paid (Rs.) *"
            rule="amount"
            required
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onValidationChange={setAmountValid}
            className="font-mono"
          />

          <div className="space-y-1">
            <label className="font-medium text-foreground">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {paymentMode !== "Cash" && (
            <ValidatedInput
              label="Reference / Cheque / Bank Slip No. (Optional)"
              rule="text"
              required={false}
              placeholder="e.g. CHQ-90412 or Bank Ref #"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="font-mono"
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>Save Supplier Payment</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
