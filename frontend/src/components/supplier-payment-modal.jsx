import { useState, useEffect, useMemo } from "react";
import { XIcon, Loader2Icon, Building2Icon, WalletIcon, ArrowRightIcon, CheckCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createSupplierPaymentApi, fetchBankAccounts } from "@/lib/api";

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online POS"];

export function SupplierPaymentModal({ isOpen, onClose, suppliers = [], defaultSupplierId = "", onSuccess }) {
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amountValid, setAmountValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSupplierId(defaultSupplierId || (suppliers.length > 0 ? suppliers[0]._id : ""));
      setAmount("");
      setPaymentMode("Cash");
      setAmountValid(false);

      fetchBankAccounts().then((res) => {
        if (res && res.data && res.data.length > 0) {
          setBankAccounts(res.data);
          const def = res.data.find((a) => a.isDefault && a.isActive) || res.data.find((a) => a.isActive) || res.data[0];
          if (def) setBankAccountId(def._id);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  const handlePaymentModeChange = (newMode) => {
    setPaymentMode(newMode);
    if (newMode !== "Cash" && bankAccounts.length > 0) {
      const def = bankAccounts.find((b) => b.isDefault && b.isActive) || bankAccounts.find((b) => b.isActive) || bankAccounts[0];
      if (def && (!bankAccountId || !bankAccounts.some((b) => b._id === bankAccountId))) {
        setBankAccountId(def._id);
      }
    }
  };

  const selectedSupplierObj = useMemo(() => {
    return suppliers.find((s) => s._id === supplierId) || (suppliers.length > 0 ? suppliers[0] : null);
  }, [suppliers, supplierId]);

  const prevBalance = Number(selectedSupplierObj?.currentBalance || 0);
  const paymentNum = Number(amount) || 0;
  const newBalance = Math.max(0, prevBalance - paymentNum);
  const isAdvance = paymentNum > prevBalance;
  const advanceAmount = isAdvance ? paymentNum - prevBalance : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountValid || paymentNum <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    try {
      setLoading(true);
      const targetSupplierId = supplierId || selectedSupplierObj?._id;
      const targetSupplierName = selectedSupplierObj?.name || "Supplier";
      const selectedBank = bankAccounts.find((b) => b._id === bankAccountId);
      const bankAccountName = selectedBank ? `${selectedBank.bankName} - ${selectedBank.accountNumber}` : "";

      await createSupplierPaymentApi({
        supplierId: targetSupplierId,
        supplierName: targetSupplierName,
        amount: paymentNum,
        paymentMode,
        bankAccountId: paymentMode !== "Cash" ? bankAccountId : undefined,
        bankAccountName: paymentMode !== "Cash" ? bankAccountName : undefined,
        referenceNumber: "",
        notes: `Payment paid to ${targetSupplierName}`,
      });

      toast.success(`Payment of Rs. ${paymentNum.toLocaleString()} recorded for ${targetSupplierName}!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to record supplier payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 shrink-0">
          <div className="flex items-center gap-2">
            <WalletIcon className="size-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Record Supplier Payment</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7" disabled={loading}>
            <XIcon className="size-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Select Supplier / Refinery</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {suppliers.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name} (Owed: Rs. {(sup.currentBalance || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-background border border-border/60 shadow-2xs">
                <span className="text-[9.5px] text-muted-foreground block font-medium uppercase tracking-wider">Previous Balance</span>
                <span className="text-xs font-mono font-bold text-foreground block pt-0.5">Rs. {prevBalance.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shadow-2xs">
                <span className="text-[9.5px] text-primary block font-medium uppercase tracking-wider">Paying Now</span>
                <span className="text-xs font-mono font-bold text-primary block pt-0.5">Rs. {paymentNum.toLocaleString()}</span>
              </div>
              <div className={`p-2 rounded-lg border shadow-2xs ${
                newBalance === 0 && paymentNum > 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-background border-border/60 text-foreground"
              }`}>
                <span className="text-[9.5px] text-muted-foreground block font-medium uppercase tracking-wider">New Balance</span>
                <span className="text-xs font-mono font-bold block pt-0.5">Rs. {newBalance.toLocaleString()}</span>
              </div>
            </div>

            {isAdvance && (
              <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
                <CheckCircleIcon className="size-3 shrink-0" />
                <span>Full balance cleared with Rs. {advanceAmount.toLocaleString()} advance credit.</span>
              </div>
            )}
          </div>

          <ValidatedInput
            label="Payment Amount (PKR) *"
            rule="amount"
            required
            type="number"
            placeholder="e.g. 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onValidationChange={setAmountValid}
            className="font-mono text-xs h-8.5"
            autoFocus
          />

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => handlePaymentModeChange(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {paymentMode !== "Cash" && (
            <div className="space-y-1.5 p-2.5 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in">
              <label className="font-medium text-[11px] text-foreground flex items-center gap-1.5">
                <Building2Icon className="size-3 text-primary" />
                <span>Paid from Company Bank Account</span>
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2 text-xs cursor-pointer font-medium shadow-xs"
              >
                {bankAccounts.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bankName} - {b.accountNumber} ({b.accountTitle})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="cursor-pointer text-xs h-8">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !amountValid || paymentNum <= 0}
              className="cursor-pointer text-xs font-semibold h-8 px-4 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2Icon className="size-3.5 animate-spin" /><span>Saving...</span></>
              ) : (
                <span>Confirm Payment</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
