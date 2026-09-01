import { useState, useEffect } from "react";
import {
  XIcon,
  PlusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  Loader2Icon,
  Building2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createCashTransactionApi, fetchBankAccounts } from "@/lib/api";

const CATEGORY_OPTIONS = [
  "General",
  "Customer Collection",
  "POS Sale",
  "Vendor Payment",
  "Petty Cash",
  "Utility Expense",
  "Salary & Wages",
  "Transport & Freight",
  "Other Expense",
];

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online POS"];

export function CashTransactionModal({
  isOpen,
  onClose,
  initialType = "Received",
  onSuccess,
}) {
  const [type, setType] = useState(initialType);
  const [partyName, setPartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [referenceNo, setReferenceNo] = useState("");
  const [transactionDate, setTransactionDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  const [partyValid, setPartyValid] = useState(false);
  const [amountValid, setAmountValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      fetchBankAccounts().then((res) => {
        if (res && res.data) {
          setBankAccounts(res.data);
          const def =
            res.data.find((a) => a.isDefault && a.isActive) ||
            res.data.find((a) => a.isActive) ||
            res.data[0];
          if (def) setBankAccountId(def._id);
        }
      });
    }
  }, [isOpen, initialType]);

  const handlePaymentModeChange = (mode) => {
    setPaymentMode(mode);
    if (mode !== "Cash") {
      const defaultBank =
        bankAccounts.find((b) => b.isDefault && b.isActive) ||
        bankAccounts.find((b) => b.isActive) ||
        bankAccounts[0];
      if (defaultBank) {
        setBankAccountId(defaultBank._id);
      }
    }
  };

  const isFormValid = partyValid && amountValid;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      const selectedBank = bankAccounts.find((b) => b._id === bankAccountId);
      const bankAccountName = selectedBank
        ? `${selectedBank.bankName} - ${selectedBank.accountNumber}`
        : "";

      await createCashTransactionApi({
        type,
        partyName: partyName.trim(),
        amount: Number(amount),
        category,
        paymentMode,
        bankAccountId: paymentMode !== "Cash" ? bankAccountId : undefined,
        bankAccountName: paymentMode !== "Cash" ? bankAccountName : undefined,
        referenceNo,
        transactionDate,
      });

      toast.success(`${type} cash record saved successfully!`);
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to record cash transaction");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPartyName("");
    setAmount("");
    setCategory("General");
    setPaymentMode("Cash");
    setReferenceNo("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
  };

  const isReceived = type === "Received";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-1.5">
              <span>{isReceived ? "Record Cash In (Inflow)" : "Record Cash Out (Outflow)"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                  isReceived
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                }`}
              >
                {isReceived ? "Wasool (+)" : "Kharch (-)"}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isReceived
                ? "Record money received from customer, collection, or sales inflow."
                : "Record money paid to vendor, supplier, or operational outflow."}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setType("Received")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isReceived
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              <ArrowDownLeftIcon className="size-3.5" />
              <span>Cash In (Wasool)</span>
            </button>

            <button
              type="button"
              onClick={() => setType("Paid")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                !isReceived
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              <ArrowUpRightIcon className="size-3.5" />
              <span>Cash Out (Ada/Kharch)</span>
            </button>
          </div>

          <ValidatedInput
            label="Party / Customer / Source Name"
            rule="name"
            required
            placeholder="e.g. Malik Traders, Bilal Customer, Hassan Mills"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            onValidationChange={setPartyValid}
          />

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Amount (PKR)"
              rule="amount"
              required
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onValidationChange={setAmountValid}
              className="font-mono font-bold"
            />

            <div className="space-y-1">
              <label className="font-medium text-foreground">Transaction Date</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-medium cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => handlePaymentModeChange(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-medium cursor-pointer"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {paymentMode !== "Cash" && (
            <div className="space-y-1 p-2 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in">
              <label className="font-medium text-[11px] text-foreground flex items-center gap-1">
                <Building2Icon className="size-3 text-primary" />
                <span>Company Bank Account</span>
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs cursor-pointer font-medium"
              >
                {bankAccounts.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bankName} - {b.accountNumber} ({b.accountTitle})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !isFormValid}
              className={`gap-1.5 cursor-pointer font-semibold ${
                isReceived
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {loading ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PlusIcon className="size-3.5" />
              )}
              <span>Save {isReceived ? "Cash In" : "Cash Out"} Record</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
