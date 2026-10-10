import { useState, useEffect } from "react";
import { updateLedgerEntryApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon, SaveIcon, AlertCircleIcon, CalendarIcon } from "lucide-react";

export function EditLedgerEntryModal({ isOpen, onClose, entry, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && entry) {
      setAmount(entry.amount || "");
      setTransactionType(entry.transactionType || "");
      setPaymentMode(entry.paymentMode || "Cash");
      setNotes(entry.notes || "");
      if (entry.createdAt) {
        // Adjust for timezone to display correctly in datetime-local
        const d = new Date(entry.createdAt);
        const tzOffset = d.getTimezoneOffset() * 60000; 
        const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, 16);
        setDate(localISOTime);
      }
      setError("");
    }
  }, [isOpen, entry]);

  if (!isOpen || !entry) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await updateLedgerEntryApi(entry._id, {
        amount: Number(amount),
        transactionType,
        paymentMode,
        notes,
        createdAt: new Date(date).toISOString(),
      });
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update ledger entry.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h3 className="font-bold text-foreground">Edit Ledger Entry</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
              <AlertCircleIcon className="size-4" />
              {error}
            </div>
          )}

          <div className="space-y-3 text-base">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1">
                Transaction Type
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-base"
              >
                <option value="Credit (Payment Received)">Credit (Payment Received)</option>
                <option value="Debit (Invoice/Challan)">Debit (Invoice/Challan)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1">
                Amount (Rs)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1">
                Date & Time
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9 font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-base"
              >
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online POS">Online POS</option>
                <option value="Credit / Khata">Credit / Khata</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1">
                Description / Particulars
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Description of entry..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? <span className="animate-spin text-lg leading-none">⟳</span> : <SaveIcon className="size-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
