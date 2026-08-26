import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { XIcon, WalletIcon } from "lucide-react";

export function PaymentModal({ isOpen, onClose, onSave, mills }) {
  const [millId, setMillId] = useState("");
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [clientNameValid, setClientNameValid] = useState(true);
  const [amountValid, setAmountValid] = useState(false);

  const isFormValid = amountValid;

  const selectedMill = mills.find((m) => m._id === millId);

  useEffect(() => {
    if (isOpen) {
      setMillId(mills[0]?._id || "");
      setClientName(mills[0]?.name || "");
      setAmount("");
      setPaymentMode("Bank Transfer");
      setReferenceNumber("");
      setError("");
    }
  }, [isOpen, mills]);

  useEffect(() => {
    if (selectedMill) {
      setClientName(selectedMill.name);
    }
  }, [millId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError("");

    try {
      await onSave({
        millId: millId || undefined,
        clientName: selectedMill ? selectedMill.name : (clientName.trim() || "Walk-in Client"),
        amount: Number(amount),
        paymentMode,
        referenceNumber,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record payment entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <WalletIcon className="size-5 text-emerald-500" />
            Record Client Credit Payment Receipt
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground">Select Textile Mill / Client (Optional)</label>
            <select
              value={millId}
              onChange={(e) => setMillId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
            >
              <option value="">Manual Client / Walk-in Khata...</option>
              {mills.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} (Current Outstanding: Rs {m.currentBalance?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {!millId && (
            <ValidatedInput
              label="Client Name (Optional)"
              rule="text"
              required={false}
              placeholder="e.g. SITE Weaving Division / Walk-in"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onValidationChange={setClientNameValid}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ValidatedInput
              label="Amount Received (Rs) *"
              rule="amount"
              required
              type="number"
              placeholder="e.g. 250000"
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
              >
                <option value="Bank Transfer">Bank Transfer / Pay Order</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash Receipt</option>
                <option value="Online POS">Online POS</option>
              </select>
            </div>
          </div>

          <ValidatedInput
            label="Cheque / Bank Reference No. (Optional)"
            rule="text"
            required={false}
            placeholder="e.g. HBL Cheque #492104 or Online Deposit Ref"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isFormValid} className="cursor-pointer font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Recording..." : "Record Credit Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
