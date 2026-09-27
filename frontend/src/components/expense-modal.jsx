import { useState } from "react";
import { XIcon, PlusIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createExpenseApi } from "@/lib/api";

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online POS"];

function detectCategory(val) {
  const t = (val || "").toLowerCase();
  if (t.includes("salary") || t.includes("tankhwah") || t.includes("wage") || t.includes("staff")) return "Salaries & Wages";
  if (t.includes("bill") || t.includes("bijli") || t.includes("electric") || t.includes("gas") || t.includes("water") || t.includes("internet")) return "Utilities";
  if (t.includes("rent") || t.includes("kiraya")) return "Rent";
  if (t.includes("petrol") || t.includes("diesel") || t.includes("freight") || t.includes("transport") || t.includes("carriage") || t.includes("mazdoori")) return "Transport & Freight";
  if (t.includes("repair") || t.includes("maintenance") || t.includes("service")) return "Maintenance & Repairs";
  if (t.includes("tea") || t.includes("chai") || t.includes("khana") || t.includes("lunch") || t.includes("petty")) return "Office Petty Cash";
  if (t.includes("tax") || t.includes("license") || t.includes("fee")) return "Official Fees & Licenses";
  return "Other";
}

export function ExpenseModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [voucherNumber, setVoucherNumber] = useState("");
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
        expenseDate: new Date().toISOString().split("T")[0],
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
    setCategory("Other");
    setAmount("");
    setPaymentMode("Cash");
    setVoucherNumber("");
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
            onChange={(e) => {
              setTitle(e.target.value);
              setCategory(detectCategory(e.target.value));
            }}
            onValidationChange={setTitleValid}
          />

          <ValidatedInput
            label="Amount (PKR)"
            rule="amount"
            required
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onValidationChange={setAmountValid}
            className="font-mono font-bold text-sm"
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
