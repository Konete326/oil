import { useState } from "react";
import { XIcon, PlusIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createExpenseApi } from "@/lib/api";

const EXPENSE_CATEGORIES = [
  "Salaries & Wages",
  "Utilities",
  "Transport & Freight",
  "Rent",
  "Maintenance & Repairs",
  "Office Petty Cash",
  "Tax & Licenses",
  "Other",
];

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online POS"];

export function ExpenseModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Salaries & Wages");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [voucherNumber, setVoucherNumber] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [titleValid, setTitleValid] = useState(false);
  const [amountValid, setAmountValid] = useState(false);

  const isFormValid = titleValid && amountValid;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      await createExpenseApi({
        title: title.trim(),
        category,
        amount: Number(amount),
        paymentMode,
        voucherNumber: voucherNumber.trim() || `EXP-${Date.now().toString().slice(-6)}`,
        expenseDate,
        notes: notes.trim(),
      });

      toast.success("Expense voucher recorded successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to record expense");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Salaries & Wages");
    setAmount("");
    setPaymentMode("Cash");
    setVoucherNumber("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Record Expense Voucher</h2>
            <p className="text-xs text-muted-foreground">Add operational business expense entry (Akhrajaat).</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <ValidatedInput
            label="Expense Title / Particulars"
            rule="name"
            required
            placeholder="e.g. Shop Electricity Bill or Office Tea/Lunch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onValidationChange={setTitleValid}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <ValidatedInput
              label="Amount (PKR)"
              rule="amount"
              required
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onValidationChange={setAmountValid}
              className="font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div className="space-y-1">
              <label className="font-medium text-foreground">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <ValidatedInput
            label="Voucher / Slip Reference No."
            rule="text"
            required={false}
            placeholder="Auto-generated if left blank"
            value={voucherNumber}
            onChange={(e) => setVoucherNumber(e.target.value)}
            className="font-mono"
          />

          <ValidatedInput
            label="Notes & Remarks"
            rule="text"
            required={false}
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>Record Expense</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
