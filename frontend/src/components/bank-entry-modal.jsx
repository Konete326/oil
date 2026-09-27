import { useState, useEffect } from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, XIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function BankEntryModal({
  isOpen,
  onClose,
  type = "Received",
  selectedBank = "HBL",
  onSave,
  loading = false,
}) {
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const isDeposit = type === "Received";

  useEffect(() => {
    if (isOpen) {
      setParty("");
      setAmount("");
      setRef("");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!party.trim() || !amount || Number(amount) <= 0) return;

    onSave({
      type,
      partyName: party.trim(),
      amount: Number(amount),
      category: "Bank Transfer",
      paymentMode: "Bank Transfer",
      referenceNo: ref.trim() || `CHQ-${Date.now().toString().slice(-5)}`,
      transactionDate: date,
      notes: `Bank: ${selectedBank} | ${notes.trim()}`,
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
                {isDeposit ? `Record Deposit (Jama) - ${selectedBank}` : `Record Withdrawal (Naam) - ${selectedBank}`}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isDeposit ? "Deposit funds into bank account" : "Withdraw or pay funds from bank account"}
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
          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              {isDeposit ? "Source / Party / Customer *" : "Payee / Supplier / Particulars *"}
            </label>
            <Input
              required
              autoFocus
              placeholder={isDeposit ? "e.g. Al-Madina Mills, Cash Deposit, Client Transfer" : "e.g. Shell Pakistan, Rent, Vendor Transfer"}
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
              <label className="font-semibold text-foreground">Cheque / Ref No.</label>
              <Input
                placeholder="e.g. CHQ-90182 or Ref #"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
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

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Description / Notes</label>
            <Input
              placeholder="e.g. Online bank transfer from Karachi branch..."
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
              <span>{isDeposit ? "Save Deposit" : "Save Withdrawal"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
