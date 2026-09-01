import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon, WalletIcon, Loader2Icon, Building2Icon } from "lucide-react";
import { fetchBankAccounts } from "@/lib/api";

export function PaymentModal({ isOpen, onClose, onSave, mills = [] }) {
  const [millId, setMillId] = useState("");
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedMill = mills.find((m) => m._id === millId);
  const previousBalance = Number(selectedMill?.currentBalance || 0);
  const paidAmount = Number(amount) || 0;
  const newRemainingBalance = Math.max(0, previousBalance - paidAmount);
  const isAdvance = paidAmount > previousBalance;
  const advanceAmount = isAdvance ? paidAmount - previousBalance : 0;

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts().then((res) => {
        if (res && res.data) {
          setBankAccounts(res.data);
          const def = res.data.find((a) => a.isDefault && a.isActive) || res.data[0];
          if (def) setBankAccountId(def._id);
        }
      });
      const first = Array.isArray(mills) && mills.length > 0 ? mills[0] : null;
      setMillId(first?._id || "");
      setClientName(first?.name || "");
      setAmount("");
      setPaymentMode("Cash");
      setReferenceNumber("");
      setNotes("");
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMill) {
      setClientName(selectedMill.name);
    }
  }, [millId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid payment amount greater than 0.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const selectedBank = bankAccounts.find((b) => b._id === bankAccountId);
      const bankAccountName = selectedBank ? `${selectedBank.bankName} - ${selectedBank.accountNumber}` : "";

      await onSave({
        millId: millId || undefined,
        clientName: selectedMill ? selectedMill.name : (clientName.trim() || "Walk-in Client"),
        amount: Number(amount),
        paymentMode,
        bankAccountId: paymentMode !== "Cash" ? bankAccountId : undefined,
        bankAccountName: paymentMode !== "Cash" ? bankAccountName : undefined,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record payment entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-emerald-500/5 shrink-0">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <WalletIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Receive Payment</span>
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7" disabled={loading}>
            <XIcon className="size-3.5" />
          </Button>
        </div>

        {error && (
          <div className="mx-4 mt-3 rounded-lg bg-destructive/15 p-2.5 text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {mills.length > 1 ? (
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Select Customer Account</label>
              <select
                value={millId}
                onChange={(e) => setMillId(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-xs"
              >
                {mills.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} (Balance: Rs {(m.currentBalance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          ) : selectedMill ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-muted/30">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider block">Customer Account</span>
                <span className="font-bold text-xs text-foreground">{selectedMill.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider block">Current Outstanding</span>
                <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                  Rs {previousBalance.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Party / Customer Name</label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Tariq Autos / Bilal Traders"
                className="h-8.5 text-xs bg-muted/20 focus:bg-background"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">
                Amount Received (Rs) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="any"
                required
                autoFocus
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8.5 text-xs bg-muted/20 focus:bg-background font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-xs"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / Online</option>
                <option value="Cheque">Cheque</option>
                <option value="Pay Order">Pay Order / Slip</option>
              </select>
            </div>
          </div>

          {paymentMode !== "Cash" && (
            <div className="space-y-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in">
              <label className="font-medium text-[11px] text-foreground flex items-center gap-1">
                <Building2Icon className="size-3 text-emerald-600 dark:text-emerald-400" />
                <span>Deposit into Company Bank Account</span>
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs cursor-pointer font-medium"
              >
                {bankAccounts.length === 0 ? (
                  <option value="">Default Business Bank Account</option>
                ) : (
                  bankAccounts.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bankName} - {b.accountNumber} ({b.accountTitle})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Balance Calculation</span>
              <span className="text-[10px] font-normal text-muted-foreground">Auto-Calculated</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-lg bg-background border border-border/80 shadow-2xs">
                <span className="text-[9.5px] text-muted-foreground uppercase block">Previous Balance</span>
                <span className="font-mono font-bold text-xs text-foreground">
                  Rs {previousBalance.toLocaleString()}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-background border border-emerald-500/30 shadow-2xs">
                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 uppercase block font-semibold">Payment Amount</span>
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  Rs {paidAmount.toLocaleString()}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-background border border-border/80 shadow-2xs">
                <span className="text-[9.5px] text-muted-foreground uppercase block font-medium">New Balance</span>
                <span className={`font-mono font-bold text-xs ${
                  newRemainingBalance === 0 && !isAdvance
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isAdvance
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}>
                  {isAdvance ? `Rs 0 (Advance: Rs ${advanceAmount.toLocaleString()})` : `Rs ${newRemainingBalance.toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-emerald-500/20 px-1">
              <span>Previous: <strong className="text-foreground">Rs {previousBalance.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Paid: <strong className="text-emerald-600 dark:text-emerald-400">Rs {paidAmount.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Remaining: <strong className="text-foreground">{isAdvance ? "Rs 0 (Adv)" : `Rs ${newRemainingBalance.toLocaleString()}`}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Cheque / Bank Reference (Optional)</label>
              <Input
                placeholder="e.g. HBL Slip #48201 / Online Ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-8.5 text-xs bg-muted/20 focus:bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Payment Notes (Optional)</label>
              <Input
                placeholder="e.g. Cleared full month ledger"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8.5 text-xs bg-muted/20 focus:bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="cursor-pointer text-xs h-8">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount || Number(amount) <= 0}
              className="cursor-pointer text-xs font-semibold h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <><Loader2Icon className="size-3.5 animate-spin" /><span>Recording...</span></>
              ) : (
                <span>Confirm &amp; Credit Payment</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
