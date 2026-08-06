import { useState } from "react";
import { XIcon, PlusIcon, ArrowUpRightIcon, ArrowDownLeftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCashTransactionApi } from "@/lib/api";

const CATEGORY_OPTIONS = [
  "General",
  "Vendor Payment",
  "Customer Collection",
  "Petty Cash",
  "Utility Expense",
  "Salary & Wages",
  "Transport & Freight",
  "Other Expense",
];

const PAYMENT_MODES = ["Cash", "Cheque", "Bank Transfer", "Online POS"];

export function CashTransactionModal({ isOpen, onClose, initialType = "Paid", onSuccess }) {
  const [type, setType] = useState(initialType);
  const [partyName, setPartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partyName.trim()) {
      toast.error("Please enter a party or customer name");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid cash amount");
      return;
    }

    try {
      setLoading(true);
      await createCashTransactionApi({
        type,
        partyName: partyName.trim(),
        amount: Number(amount),
        category,
        paymentMode,
        referenceNo,
        transactionDate,
        notes,
      });

      toast.success(`${type} cash transaction recorded successfully!`);
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to record cash transaction");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPartyName("");
    setAmount("");
    setCategory("General");
    setPaymentMode("Cash");
    setReferenceNo("");
    setNotes("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Record Cash Transaction</h2>
            <p className="text-xs text-muted-foreground">Add new Paid Cash (outflow) or Received Cash (inflow) record.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg border border-border/40">
            <button
              type="button"
              onClick={() => setType("Paid")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                type === "Paid"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpRightIcon className="size-3.5" />
              <span>Paid Cash (Outflow)</span>
            </button>

            <button
              type="button"
              onClick={() => setType("Received")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                type === "Received"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownLeftIcon className="size-3.5" />
              <span>Received Cash (Inflow)</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Party / Customer Name *</label>
            <Input
              type="text"
              placeholder="e.g. Malik Traders, Hassan Mills"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Cash Amount (Rs.) *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Transaction Date</label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Reference / Receipt No. (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. REC-10492 or Bank Slip #"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Notes & Details (Optional)</label>
            <textarea
              rows={2}
              placeholder="Add additional remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>Save {type} Cash Record</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
