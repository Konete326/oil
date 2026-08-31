import { useState, useEffect } from "react";
import { XIcon, Loader2Icon, HandCoinsIcon, AlertTriangleIcon, CalendarIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { Input } from "@/components/ui/input";
import { recordEmployeeAdvanceApi, fetchAllEmployeesListApi } from "@/lib/api";

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque"];

export function AdvanceModal({ isOpen, onClose, employees = [], preselectedEmployeeId = "", onSuccess }) {
  const [employeeId, setEmployeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [amountValid, setAmountValid] = useState(false);
  const [allEmployees, setAllEmployees] = useState(employees);

  useEffect(() => {
    if (isOpen) {
      if (preselectedEmployeeId) {
        setEmployeeId(preselectedEmployeeId);
      } else if (employees.length > 0 && !employeeId) {
        setEmployeeId(employees[0]._id || employees[0].id);
      }
      setDate(new Date().toISOString().split("T")[0]);

      fetchAllEmployeesListApi().then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setAllEmployees(list);
        }
      });
    }
  }, [isOpen, preselectedEmployeeId]);

  useEffect(() => {
    if (Array.isArray(employees) && employees.length > 0 && allEmployees.length === 0) {
      setAllEmployees(employees);
    }
  }, [employees]);

  if (!isOpen) return null;

  const selectedEmployeeObj = allEmployees.find((e) => (e._id || e.id) === employeeId) || employees.find((e) => (e._id || e.id) === employeeId);
  const currentAdvance = selectedEmployeeObj ? Number(selectedEmployeeObj.advanceBalance || 0) : 0;
  const baseSalary = selectedEmployeeObj ? Number(selectedEmployeeObj.baseSalary || 0) : 0;
  const enteredAmount = Number(amount) || 0;
  const newProjectedAdvance = currentAdvance + enteredAmount;
  const isExceedingSalary = baseSalary > 0 && enteredAmount > baseSalary;

  const isFormValid = !!employeeId && amountValid && enteredAmount > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || !selectedEmployeeObj) return;

    try {
      setLoading(true);
      const res = await recordEmployeeAdvanceApi({
        employeeId,
        employeeName: selectedEmployeeObj.name,
        designation: selectedEmployeeObj.designation,
        department: selectedEmployeeObj.department,
        amount: enteredAmount,
        paymentMode,
        reason: reason.trim() || "Staff Advance Cash",
        notes: reason.trim() || "Staff Advance Cash",
        date,
      });

      const voucherData = {
        voucherNumber: res?.voucherNumber || `ADV-${Date.now().toString().slice(-6)}`,
        employeeName: selectedEmployeeObj.name,
        designation: selectedEmployeeObj.designation,
        department: selectedEmployeeObj.department,
        phone: selectedEmployeeObj.phone,
        amount: enteredAmount,
        paymentMode,
        date,
        reason: reason.trim() || "Staff Advance Cash",
        notes: reason.trim() || "Staff Advance Cash",
        newAdvanceBalance: newProjectedAdvance,
      };

      toast.success(`Advance cash of Rs. ${enteredAmount.toLocaleString()} recorded!`);
      onSuccess?.({
        employeeId,
        amount: enteredAmount,
        updatedEmployee: {
          ...selectedEmployeeObj,
          advanceBalance: newProjectedAdvance,
        },
        voucher: voucherData,
      });
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
    setReason("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const employeeOptions = allEmployees.length > 0 ? allEmployees : employees;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in duration-150 my-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <HandCoinsIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Record Staff Advance Cash</h2>
              <p className="text-xs text-muted-foreground">Issue advance cash payment & update staff khata ledger.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground">Select Staff Member *</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
              required
            >
              <option value="">-- Choose Staff Member ({employeeOptions.length} Registered) --</option>
              {employeeOptions.map((emp) => {
                const eId = emp._id || emp.id;
                return (
                  <option key={eId} value={eId}>
                    {emp.name} ({emp.designation || "Staff"}) — Khata: Rs. {(emp.advanceBalance || 0).toLocaleString()}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedEmployeeObj && (
            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Monthly Base Salary</span>
                  <span className="font-mono font-bold text-emerald-500 text-sm">
                    Rs. {baseSalary.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Current Outstanding Advance</span>
                  <span className="font-mono font-bold text-amber-500 text-sm">
                    Rs. {currentAdvance.toLocaleString()}
                  </span>
                </div>
              </div>

              {enteredAmount > 0 && (
                <div className="pt-2 border-t border-border flex items-center justify-between font-mono">
                  <span className="text-muted-foreground text-[11px]">New Total Khata Balance:</span>
                  <span className="font-bold text-amber-600 text-xs">
                    Rs. {newProjectedAdvance.toLocaleString()} (+Rs. {enteredAmount.toLocaleString()})
                  </span>
                </div>
              )}

              {isExceedingSalary && (
                <div className="flex items-center gap-1.5 p-2 bg-destructive/10 text-destructive rounded-md border border-destructive/20 text-[11px]">
                  <AlertTriangleIcon className="size-3.5 shrink-0" />
                  <span>Warning: Advance amount is greater than staff member's monthly salary.</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ValidatedInput
              label="Advance Cash Given (PKR) *"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground flex items-center gap-1">
                <CalendarIcon className="size-3.5 text-muted-foreground" />
                <span>Payment Date</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground flex items-center gap-1">
                <FileTextIcon className="size-3.5 text-muted-foreground" />
                <span>Purpose / Reason</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Medical, Festival, Personal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !isFormValid}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 cursor-pointer"
            >
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <HandCoinsIcon className="size-3.5" />}
              <span>Confirm & Record Advance</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
