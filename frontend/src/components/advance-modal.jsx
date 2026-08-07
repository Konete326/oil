import { useState } from "react";
import { XIcon, Loader2Icon, HandCoinsIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { recordEmployeeAdvanceApi } from "@/lib/api";

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque"];

export function AdvanceModal({ isOpen, onClose, employees = [], onSuccess }) {
  const [employeeId, setEmployeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [amountValid, setAmountValid] = useState(false);

  const isFormValid = !!employeeId && amountValid;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      await recordEmployeeAdvanceApi({
        employeeId,
        amount: Number(amount),
        paymentMode,
        notes: notes.trim(),
      });

      toast.success("Advance cash payment recorded successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to record advance cash");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmployeeId("");
    setAmount("");
    setPaymentMode("Cash");
    setNotes("");
  };

  const selectedEmployeeObj = employees.find((e) => e._id === employeeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Record Advance Cash Payment</h2>
            <p className="text-xs text-muted-foreground">Issue advance cash to employee (Advance Khata).</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground">Select Employee *</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.designation}) — Outstanding Advance: Rs. {emp.advanceBalance?.toLocaleString() || 0}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployeeObj && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Base Salary:</span>
                <span className="font-mono font-bold text-foreground">Rs. {selectedEmployeeObj.baseSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Outstanding Advance:</span>
                <span className="font-mono font-bold text-amber-500">Rs. {selectedEmployeeObj.advanceBalance.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Advance Cash Given (PKR)"
              rule="amount"
              required
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onValidationChange={setAmountValid}
              className="font-mono font-bold text-amber-500"
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
          </div>

          <ValidatedInput
            label="Notes & Particulars"
            rule="text"
            required={false}
            placeholder="e.g. Emergency medical advance..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <HandCoinsIcon className="size-3.5" />}
              <span>Record Advance Payment</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
