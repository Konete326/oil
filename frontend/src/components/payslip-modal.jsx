import { useState, useEffect } from "react";
import { XIcon, PlusIcon, Loader2Icon, CalculatorIcon, ReceiptIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
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
  const [loading, setLoading] = useState(false);

  const [monthYearValid, setMonthYearValid] = useState(true);
  const [salaryValid, setSalaryValid] = useState(false);
  const [bonusValid, setBonusValid] = useState(true);
  const [advDedValid, setAdvDedValid] = useState(true);
  const [othDedValid, setOthDedValid] = useState(true);

  const isFormValid = !!employeeId && monthYearValid && salaryValid && bonusValid && advDedValid && othDedValid;

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
    if (!isFormValid) return;

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

            <ValidatedInput
              label="Salary Month / Year"
              rule="text"
              required
              placeholder="e.g. August 2026"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              onValidationChange={setMonthYearValid}
            />
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
            <ValidatedInput
              label="Base Salary (PKR)"
              rule="amount"
              required
              type="number"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              onValidationChange={setSalaryValid}
              className="font-mono font-bold"
            />

            <ValidatedInput
              label="Bonus / Overtime (PKR)"
              rule="positiveNumber"
              type="number"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              onValidationChange={setBonusValid}
              className="font-mono text-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Advance Deducted (PKR)"
              rule="positiveNumber"
              type="number"
              value={advanceDeducted}
              onChange={(e) => setAdvanceDeducted(e.target.value)}
              onValidationChange={setAdvDedValid}
              className="font-mono text-amber-500"
            />

            <ValidatedInput
              label="Other Deductions (PKR)"
              rule="positiveNumber"
              type="number"
              value={otherDeductions}
              onChange={(e) => setOtherDeductions(e.target.value)}
              onValidationChange={setOthDedValid}
              className="font-mono text-destructive"
            />
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex justify-between items-center text-xs">
            <span className="font-semibold text-emerald-500">Calculated Net Payable:</span>
            <span className="font-mono text-base font-bold text-emerald-500">
              Rs. {netPaid.toLocaleString()}
            </span>
          </div>

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

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>Generate Payslip</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
