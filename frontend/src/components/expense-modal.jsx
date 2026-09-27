import { useState, useEffect, useMemo } from "react";
import { XIcon, PlusIcon, Loader2Icon, LandmarkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createExpenseApi } from "@/lib/api";

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online POS"];

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
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [bankReferenceNo, setBankReferenceNo] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const [titleValid, setTitleValid] = useState(false);
  const [amountValid, setAmountValid] = useState(false);

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
      if (availableBankAccounts.length > 0) {
        const firstBank = availableBankAccounts.find((a) => a.accountType !== "Tijori / Cash") || availableBankAccounts[0];
        setSelectedBankAccountId(firstBank.id);
      }
      setBankReferenceNo("");
    }
  }, [isOpen, availableBankAccounts]);

  const isBankPayment = paymentMode === "Bank Transfer" || paymentMode === "Cheque" || paymentMode === "Online POS";
  const activeBankAccount = availableBankAccounts.find((a) => a.id === selectedBankAccountId);

  const isFormValid = titleValid && amountValid && (!isBankPayment || Boolean(selectedBankAccountId));

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      const bankNote = isBankPayment && activeBankAccount
        ? `[Bank: ${activeBankAccount.bankName} - ${activeBankAccount.accountTitle} (${activeBankAccount.accountNumber})${bankReferenceNo ? ` | Ref: ${bankReferenceNo}` : ""}]`
        : "";

      await createExpenseApi({
        title: title.trim(),
        category,
        amount: Number(amount),
        paymentMode,
        voucherNumber: voucherNumber.trim() || `EXP-${Date.now().toString().slice(-6)}`,
        expenseDate: new Date().toISOString().split("T")[0],
        bankAccountId: isBankPayment ? selectedBankAccountId : undefined,
        bankName: isBankPayment ? activeBankAccount?.bankName : undefined,
        bankAccountTitle: isBankPayment ? activeBankAccount?.accountTitle : undefined,
        bankAccountNumber: isBankPayment ? activeBankAccount?.accountNumber : undefined,
        bankReferenceNo: isBankPayment ? bankReferenceNo : undefined,
        notes: bankNote,
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
    setBankReferenceNo("");
    setVoucherNumber("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Record Expense Voucher</h2>
            <p className="text-xs text-muted-foreground">Add operational business expense entry (Akhrajaat).</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
                  <span>Paid From Bank Account *</span>
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
                  placeholder="e.g. CHQ-8021 or IBFT Ref #"
                  value={bankReferenceNo}
                  onChange={(e) => setBankReferenceNo(e.target.value)}
                  className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer rounded-xl">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>Record Expense</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
