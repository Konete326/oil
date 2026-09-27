import { useState, useEffect, useMemo, useRef } from "react";
import { XIcon, Loader2Icon, HandCoinsIcon, LandmarkIcon, SearchIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { Input } from "@/components/ui/input";
import { recordEmployeeAdvanceApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online"];

const FALLBACK_BANK_ACCOUNTS = [
  {
    id: "acc_hbl_01",
    bankName: "HBL (Habib Bank Limited)",
    accountTitle: "Al Khaleej Lubricants (Primary Current)",
    accountNumber: "0192-8374619-01",
    accountType: "Current",
  },
  {
    id: "acc_meezan_01",
    bankName: "Meezan Bank",
    accountTitle: "Al Khaleej Sales & Collections",
    accountNumber: "0293-8475618-02",
    accountType: "Current",
  },
];

export function AdvanceModal({ isOpen, onClose, employees = [], onSuccess, defaultEmployeeId = "" }) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || "");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [bankReferenceNo, setBankReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [amountValid, setAmountValid] = useState(false);

  const employeeDropdownRef = useRef(null);

  const availableBankAccounts = useMemo(() => {
    try {
      const stored = localStorage.getItem("bank_accounts_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return FALLBACK_BANK_ACCOUNTS;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setEmployeeId(defaultEmployeeId || "");
      const defEmp = employees.find((e) => e._id === defaultEmployeeId);
      setEmployeeSearch(defEmp ? `${defEmp.name} (${defEmp.designation})` : "");
      if (availableBankAccounts.length > 0) {
        const firstBank = availableBankAccounts.find((a) => a.accountType !== "Tijori / Cash") || availableBankAccounts[0];
        setSelectedBankAccountId(firstBank.id);
      }
      setBankReferenceNo("");
    }
  }, [isOpen, defaultEmployeeId, employees, availableBankAccounts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(e.target)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.phone?.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  const selectedEmployeeObj = employees.find((e) => e._id === employeeId);
  const isBankPayment = paymentMode === "Bank Transfer" || paymentMode === "Cheque" || paymentMode === "Online";
  const activeBankAccount = availableBankAccounts.find((a) => a.id === selectedBankAccountId);

  const isFormValid = !!employeeId && amountValid && (!isBankPayment || Boolean(selectedBankAccountId));

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      const bankNote = isBankPayment && activeBankAccount
        ? `[Bank: ${activeBankAccount.bankName} - ${activeBankAccount.accountTitle} (${activeBankAccount.accountNumber})${bankReferenceNo ? ` | Ref: ${bankReferenceNo}` : ""}]`
        : "";

      const combinedNotes = [notes.trim(), bankNote].filter(Boolean).join(" ");

      await recordEmployeeAdvanceApi({
        employeeId,
        amount: Number(amount),
        paymentMode,
        date: new Date().toISOString().slice(0, 10),
        bankAccountId: isBankPayment ? selectedBankAccountId : undefined,
        bankName: isBankPayment ? activeBankAccount?.bankName : undefined,
        bankAccountTitle: isBankPayment ? activeBankAccount?.accountTitle : undefined,
        bankAccountNumber: isBankPayment ? activeBankAccount?.accountNumber : undefined,
        bankReferenceNo: isBankPayment ? bankReferenceNo : undefined,
        notes: combinedNotes,
      });

      toast.success("Advance payment recorded in staff khata!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to record staff advance");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmployeeId("");
    setEmployeeSearch("");
    setAmount("");
    setPaymentMode("Cash");
    setBankReferenceNo("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <HandCoinsIcon className="size-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Record Staff Advance</h2>
              <p className="text-xs text-muted-foreground">Issue advance cash or bank transfer to employee khata.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div ref={employeeDropdownRef} className="relative space-y-1">
            <label className="font-medium text-foreground">Search & Select Employee *</label>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Type employee name, phone, or role..."
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setIsEmployeeDropdownOpen(true);
                }}
                onFocus={() => setIsEmployeeDropdownOpen(true)}
                className="ps-8.5 pe-3 h-9 text-xs rounded-xl bg-muted/30 focus:bg-background border-border/80 shadow-2xs font-medium"
              />
            </div>

            {isEmployeeDropdownOpen && (
              <div className="absolute left-0 right-0 top-15 z-50 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-1 divide-y divide-border/40 animate-in fade-in-50 duration-100">
                {filteredEmployees.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No employees found matching "{employeeSearch}"
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <button
                      key={emp._id}
                      type="button"
                      onClick={() => {
                        setEmployeeId(emp._id);
                        setEmployeeSearch(`${emp.name} (${emp.designation})`);
                        setIsEmployeeDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer text-xs",
                        employeeId === emp._id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"
                      )}
                    >
                      <div>
                        <p className="font-semibold">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{emp.designation} {emp.phone ? `• ${emp.phone}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-amber-500 font-bold block">
                          Adv: Rs {(emp.advanceBalance || 0).toLocaleString()}
                        </span>
                        {employeeId === emp._id && <CheckIcon className="size-3 text-primary ml-auto mt-0.5" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedEmployeeObj && (
            <div className="p-3 bg-muted/40 rounded-xl border border-border/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Monthly Salary:</span>
                <span className="font-mono font-bold text-foreground">Rs. {Number(selectedEmployeeObj.baseSalary || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Outstanding Advance:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">Rs. {Number(selectedEmployeeObj.advanceBalance || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <ValidatedInput
            label="Advance Amount (PKR) *"
            rule="amount"
            required
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onValidationChange={setAmountValid}
            className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400"
          />

          <div className="space-y-1">
            <label className="font-medium text-foreground">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {isBankPayment && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="font-semibold text-[11px] text-foreground flex items-center gap-1.5">
                  <LandmarkIcon className="size-3.5 text-primary" />
                  <span>Disburse From Bank Account *</span>
                </label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                >
                  {availableBankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} — {acc.accountTitle} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[10.5px] text-muted-foreground">
                  Cheque / Tx / Reference # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-9102 or IBFT Ref #"
                  value={bankReferenceNo}
                  onChange={(e) => setBankReferenceNo(e.target.value)}
                  className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-medium text-foreground">Reason / Remarks (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. Medical emergency, urgent travel advance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <HandCoinsIcon className="size-3.5" />}
              <span>Disburse Advance</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
