import { useState, useEffect } from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, XIcon, Loader2Icon, LandmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TRANSACTION_CATEGORIES = [
  "Oil Supplier Payment",
  "Customer Payment",
  "Shop Expense",
  "Cash Deposit / Tijori Transfer",
  "Staff Salary / Advance",
  "Bank Charges",
  "Inter-Account Transfer",
  "Other / General",
];

export function BankEntryModal({
  isOpen,
  onClose,
  type = "Received",
  activeAccount = null,
  onSave,
  loading = false,
}) {
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [category, setCategory] = useState("Oil Supplier Payment");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const isDeposit = type === "Received";

  useEffect(() => {
    if (isOpen) {
      setParty("");
      setAmount("");
      setRef("");
      setCategory(isDeposit ? "Customer Payment" : "Oil Supplier Payment");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [isOpen, isDeposit]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!party.trim() || !amount || Number(amount) <= 0) return;

    const accountIdentifier = activeAccount
      ? `${activeAccount.bankName} - ${activeAccount.accountTitle} (${activeAccount.accountNumber})`
      : "Default Bank";

    onSave({
      type,
      partyName: party.trim(),
      amount: Number(amount),
      category,
      paymentMode: "Bank Transfer",
      referenceNo: ref.trim() || `CHQ-${Date.now().toString().slice(-5)}`,
      transactionDate: date,
      notes: `[A/C: ${accountIdentifier}] ${notes.trim()}`,
      accountId: activeAccount?.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center text-white",
                isDeposit ? "bg-emerald-600" : "bg-rose-600"
              )}
            >
              {isDeposit ? <ArrowDownLeftIcon className="size-4" /> : <ArrowUpRightIcon className="size-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {isDeposit ? "Record Deposit (Jama / Inflow)" : "Record Withdrawal (Naam / Outflow)"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {activeAccount?.bankName} — {activeAccount?.accountTitle} ({activeAccount?.accountNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="p-2 rounded-lg bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <LandmarkIcon className="size-4 text-primary" />
              <div>
                <span className="font-bold text-foreground block">{activeAccount?.bankName}</span>
                <span className="text-[10.5px] text-muted-foreground">
                  Title: {activeAccount?.accountTitle} | A/C: {activeAccount?.accountNumber}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              {activeAccount?.accountType || "Current"}
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              {isDeposit ? "Received From (Customer / Client / Source) *" : "Paid To (Supplier / Payee / Particulars) *"}
            </label>
            <Input
              required
              autoFocus
              placeholder={isDeposit ? "e.g. Malik Auto Workshop, Cash Deposit" : "e.g. Shell Lubricants Distributor, Caltex Oil"}
              value={party}
              onChange={(e) => setParty(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Amount (PKR) *</label>
              <Input
                type="number"
                min="1"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Cheque / Slip / Ref #</label>
              <Input
                placeholder="e.g. CHQ-90182 or IBFT-1029"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {TRANSACTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Date *</label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Particulars / Details / Notes</label>
            <Input
              placeholder="e.g. 200L Drum supply invoice #4829 payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="h-7.5 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className={cn(
                "h-7.5 text-xs font-semibold text-white cursor-pointer gap-1.5",
                isDeposit ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              )}
            >
              {loading && <Loader2Icon className="size-3 animate-spin" />}
              <span>{isDeposit ? "Record Deposit" : "Record Withdrawal"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
