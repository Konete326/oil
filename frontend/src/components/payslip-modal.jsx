import { useState, useEffect } from "react";
import { XIcon, PlusIcon, Loader2Icon, CalculatorIcon, ReceiptIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateSalaryVoucherApi } from "@/lib/api";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PayslipModal({ isOpen, onClose, employees = [], onSuccess }) {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  const [employeeId, setEmployeeId] = useState("");
  const [monthYear, setMonthYear] = useState(`${currentMonthName} ${currentYear}`);
  const [baseSalary, setBaseSalary] = useState("");
  const [bonus, setBonus] = useState("0");
  const [advanceDeducted, setAdvanceDeducted] = useState("0");
  const [otherDeductions, setOtherDeductions] = useState("0");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeId) {
      const emp = employees.find((e) => e._id === employeeId);
      if (emp) {
        setBaseSalary(String(emp.baseSalary || 0));
        setAdvanceDeducted(String(Math.min(emp.baseSalary || 0, emp.advanceBalance || 0)));
      }
    }
  }, [employeeId, employees]);

  if (!isOpen) return null;

  const baseAmt = Number(baseSalary) || 0;
  const bonusAmt = Number(bonus) || 0;
  const advDedAmt = Number(advanceDeducted) || 0;
  const othDedAmt = Number(otherDeductions) || 0;
  const netPaid = Math.max(baseAmt + bonusAmt - advDedAmt - othDedAmt, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error("Please select an employee");
      return;
    }
    if (!monthYear.trim()) {
      toast.error("Please enter the salary month/year");
      return;
    }

    try {
      setLoading(true);
      await generateSalaryVoucherApi({
        employeeId,
        monthYear: monthYear.trim(),
        baseSalary: baseAmt,
        bonus: bonusAmt,
        advanceDeducted: advDedAmt,
        otherDeductions: othDedAmt,
        paymentMode,
        notes: notes.trim(),
      });

      toast.success("Monthly payslip voucher generated successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to generate payslip");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmployeeId("");
    setMonthYear(`${currentMonthName} ${currentYear}`);
    setBaseSalary("");
    setBonus("0");
    setAdvanceDeducted("0");
    setOtherDeductions("0");
    setPaymentMode("Cash");
    setNotes("");
  };

  const selectedEmployeeObj = employees.find((e) => e._id === employeeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Generate Monthly Payslip Voucher</h2>
            <p className="text-xs text-muted-foreground">Calculate net salary payout and process advance deductions.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
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
                    {emp.name} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Salary Month / Year *</label>
              <Input
                type="text"
                placeholder="e.g. August 2026"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="text-xs font-semibold"
                required
              />
            </div>
          </div>

          {selectedEmployeeObj && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding Advance Balance:</span>
                <span className="font-mono font-bold text-amber-500">
                  Rs. {selectedEmployeeObj.advanceBalance?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Base Salary (PKR) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="text-xs font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Bonus / Overtime (PKR)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="text-xs font-mono text-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Advance Deducted (PKR)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={advanceDeducted}
                onChange={(e) => setAdvanceDeducted(e.target.value)}
                className="text-xs font-mono text-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Other Deductions (Absents / Fine)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(e.target.value)}
                className="text-xs font-mono text-red-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
            <span className="font-semibold text-xs text-foreground">Calculated Net Salary Paid:</span>
            <span className="font-mono text-lg font-bold text-primary">Rs. {netPaid.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Notes / Remarks</label>
              <Input
                type="text"
                placeholder="Optional remarks"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <ReceiptIcon className="size-3.5" />}
              <span>Process Salary Payout</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
