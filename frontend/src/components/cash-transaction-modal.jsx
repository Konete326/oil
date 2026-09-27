import { useState } from "react";
import { XIcon, PlusIcon, ArrowUpRightIcon, ArrowDownLeftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
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
  const [loading, setLoading] = useState(false);

  const [partyValid, setPartyValid] = useState(false);
  const [amountValid, setAmountValid] = useState(false);

  const isFormValid = partyValid && amountValid;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

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
    setTransactionDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">Record Cash Transaction</h2>
            <p className="text-[11px] text-muted-foreground">Add new Paid Cash (outflow) or Received Cash (inflow) entry.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-7 cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setType("Paid")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                type === "Paid"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpRightIcon className="size-3.5" />
              <span>Paid (Outflow)</span>
            </button>

            <button
              type="button"
              onClick={() => setType("Received")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                type === "Received"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownLeftIcon className="size-3.5" />
              <span>Received (Inflow)</span>
            </button>
          </div>

          <ValidatedInput
            label="Party / Customer Name"
            rule="name"
            required
            placeholder="e.g. Malik Traders, Hassan Mills"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            onValidationChange={setPartyValid}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <ValidatedInput
              label="Amount (PKR)"
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
              <label className="font-semibold text-foreground">Date</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ValidatedInput
            label="Reference / Receipt No. (Optional)"
            rule="text"
            required={false}
            placeholder="e.g. REC-10492 or Bank Slip #"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            className="font-mono"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="h-7.5 text-xs cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="h-7.5 gap-1.5 text-xs font-semibold cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>Save {type} Record</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
