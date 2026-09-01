import { useState, useEffect } from "react";
import { XIcon, PlusIcon, Loader2Icon, ReceiptIcon, CheckCircle2Icon, SearchIcon, Building2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { generateSalaryVoucherApi, fetchBankAccounts } from "@/lib/api";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PayslipModal({
  isOpen,
  onClose,
  employees = [],
  preselectedEmployeeId = "",
  onSuccess,
}) {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  const [employeeId, setEmployeeId] = useState("");
  const [employeeSearchText, setEmployeeSearchText] = useState("");
  const [monthYear, setMonthYear] = useState(`${currentMonthName} ${currentYear}`);
  const [baseSalary, setBaseSalary] = useState("");
  const [bonus, setBonus] = useState("0");
  const [advanceDeducted, setAdvanceDeducted] = useState("0");
  const [otherDeductions, setOtherDeductions] = useState("0");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [bankAccountsList, setBankAccountsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [monthYearValid, setMonthYearValid] = useState(true);
  const [salaryValid, setSalaryValid] = useState(false);
  const [bonusValid, setBonusValid] = useState(true);
  const [advDedValid, setAdvDedValid] = useState(true);
  const [othDedValid, setOthDedValid] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts().then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setBankAccountsList(res.data);
          const defaultAcc = res.data.find((b) => b.isDefault || b.defaultAccount) || res.data[0];
          if (defaultAcc) setSelectedBankId(defaultAcc._id || defaultAcc.id);
        }
      }).catch(() => {});

      const activeId = preselectedEmployeeId || employeeId || (employees[0]?._id || "");
      if (activeId) {
        const emp = employees.find((e) => e._id === activeId);
        if (emp) {
          setEmployeeId(emp._id);
          setEmployeeSearchText(emp.name);
          setBaseSalary(emp.baseSalary ? String(emp.baseSalary) : "");
          const advAmt = Math.min(emp.baseSalary || 0, emp.advanceBalance || 0);
          setAdvanceDeducted(advAmt > 0 ? String(advAmt) : "0");
        }
      }
    }
  }, [isOpen, preselectedEmployeeId, employees]);

  const handleSelectEmployee = (emp) => {
    if (!emp) return;
    setEmployeeId(emp._id);
    setEmployeeSearchText(emp.name);
    setBaseSalary(emp.baseSalary ? String(emp.baseSalary) : "");
    const advAmt = Math.min(emp.baseSalary || 0, emp.advanceBalance || 0);
    setAdvanceDeducted(advAmt > 0 ? String(advAmt) : "0");
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setEmployeeSearchText(val);
    const matched = employees.find(
      (emp) =>
        emp.name.toLowerCase().trim() === val.toLowerCase().trim() ||
        `${emp.name} (${emp.designation || "Staff"})`.toLowerCase().trim() === val.toLowerCase().trim()
    );
    if (matched) {
      handleSelectEmployee(matched);
    } else {
      const partial = employees.find((emp) => emp.name.toLowerCase().includes(val.toLowerCase().trim()));
      if (partial && val.trim().length > 1) {
        setEmployeeId(partial._id);
        setBaseSalary(partial.baseSalary ? String(partial.baseSalary) : "");
        const advAmt = Math.min(partial.baseSalary || 0, partial.advanceBalance || 0);
        setAdvanceDeducted(advAmt > 0 ? String(advAmt) : "0");
      }
    }
  };

  if (!isOpen) return null;

  const baseAmt = Number(baseSalary) || 0;
  const bonusAmt = Number(bonus) || 0;
  const advDedAmt = Number(advanceDeducted) || 0;
  const othDedAmt = Number(otherDeductions) || 0;
  const netPaid = Math.max(baseAmt + bonusAmt - advDedAmt - othDedAmt, 0);

  const selectedEmployeeObj = employees.find((e) => e._id === employeeId);
  const currentAdvance = Number(selectedEmployeeObj?.advanceBalance || 0);
  const remainingAdvance = Math.max(0, currentAdvance - advDedAmt);

  const isFormValid = !!employeeId && monthYearValid && salaryValid && bonusValid && advDedValid && othDedValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      const chosenBank = bankAccountsList.find((b) => (b._id || b.id) === selectedBankId);
      const paymentDetails =
        paymentMode === "Bank Transfer" && chosenBank
          ? `Bank Transfer (${chosenBank.bankName} - ${chosenBank.accountNumber || chosenBank.accountTitle})`
          : paymentMode;

      await generateSalaryVoucherApi({
        employeeId,
        monthYear: monthYear.trim(),
        baseSalary: baseAmt,
        bonus: bonusAmt,
        advanceDeducted: advDedAmt,
        otherDeductions: othDedAmt,
        paymentMode: paymentDetails,
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
    setEmployeeSearchText("");
    setMonthYear(`${currentMonthName} ${currentYear}`);
    setBaseSalary("");
    setBonus("0");
    setAdvanceDeducted("0");
    setOtherDeductions("0");
    setPaymentMode("Cash");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 sm:p-4.5 shadow-2xl space-y-3 animate-in fade-in duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="size-7.5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0">
              <ReceiptIcon className="size-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">Monthly Payslip Voucher</h2>
              <p className="text-[10.5px] text-muted-foreground">Auto-calculates salary payout & advance deduction.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer size-7">
            <XIcon className="size-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Select Staff Member *</label>
              <div className="relative flex items-center">
                <SearchIcon className="size-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  list="staff-payslip-datalist"
                  value={employeeSearchText}
                  onChange={handleSearchInputChange}
                  placeholder="Search staff name..."
                  className="w-full h-8.5 rounded-md border border-input bg-background ps-8 pe-2.5 text-xs text-foreground font-semibold placeholder:font-normal focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
                <datalist id="staff-payslip-datalist">
                  {employees.map((emp) => (
                    <option key={emp._id} value={`${emp.name} (${emp.designation || "Staff"})`} />
                  ))}
                </datalist>
              </div>
            </div>

            <ValidatedInput
              label="Salary Month / Year"
              rule="text"
              required
              placeholder="e.g. August 2026"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              onValidationChange={setMonthYearValid}
              className="h-8.5"
            />
          </div>

          {selectedEmployeeObj && currentAdvance > 0 && (
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Advance Khata Owed:</span>
                <span className="font-mono font-bold text-amber-500">
                  Rs. {currentAdvance.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Quick Deduct:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAdvanceDeducted(String(Math.min(baseAmt, currentAdvance)))}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-semibold cursor-pointer"
                  >
                    Full (Rs. {Math.min(baseAmt, currentAdvance).toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceDeducted(String(Math.round(currentAdvance / 2)))}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border hover:text-foreground font-semibold cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceDeducted("0")}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border hover:text-foreground font-semibold cursor-pointer"
                  >
                    0
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <ValidatedInput
              label="Base Salary (PKR)"
              rule="amount"
              required
              type="number"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              onValidationChange={setSalaryValid}
              className="font-mono font-bold text-foreground h-8.5"
            />

            <ValidatedInput
              label="Bonus / Overtime (Optional)"
              rule="positiveNumber"
              required={false}
              type="number"
              placeholder="0"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              onValidationChange={setBonusValid}
              className="font-mono text-emerald-500 font-bold h-8.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <ValidatedInput
              label="Advance Deducted (Optional)"
              rule="positiveNumber"
              required={false}
              type="number"
              placeholder="0"
              value={advanceDeducted}
              onChange={(e) => setAdvanceDeducted(e.target.value)}
              onValidationChange={setAdvDedValid}
              className="font-mono text-amber-500 font-bold h-8.5"
            />

            <ValidatedInput
              label="Other Deductions (Optional)"
              rule="positiveNumber"
              required={false}
              type="number"
              placeholder="0"
              value={otherDeductions}
              onChange={(e) => setOtherDeductions(e.target.value)}
              onValidationChange={setOthDedValid}
              className="font-mono text-destructive font-bold h-8.5"
            />
          </div>

          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Net Payable:</span>
              <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                Rs. {netPaid.toLocaleString()}
              </span>
            </div>
            {currentAdvance > 0 && (
              <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-0.5 border-t border-emerald-500/20">
                <span>Remaining Advance Khata:</span>
                <span className="font-mono font-bold text-foreground">Rs. {remainingAdvance.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-semibold cursor-pointer"
              >
                <option value="Cash">Cash In Hand</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online Transfer">Online / Raast</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {(paymentMode === "Bank Transfer" || paymentMode === "Online Transfer") && (
              <div className="space-y-1">
                <label className="font-medium text-foreground text-[11px]">Choose Bank Account</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-medium cursor-pointer"
                >
                  {bankAccountsList.length === 0 ? (
                    <option value="">Default Business Bank</option>
                  ) : (
                    bankAccountsList.map((acc) => (
                      <option key={acc._id || acc.id} value={acc._id || acc.id}>
                        {acc.bankName} - {acc.accountTitle || acc.accountNumber?.slice(-4)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="cursor-pointer text-xs h-8">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
              {loading ? <Loader2Icon className="size-3 animate-spin" /> : <CheckCircle2Icon className="size-3.5" />}
              <span>Generate Payslip</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
