import { useState, useEffect } from "react";
import { XIcon, Building2Icon, Loader2Icon, StarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createBankAccountApi, updateBankAccountApi } from "@/lib/api";

const POPULAR_BANKS = [
  "Meezan Bank",
  "Habib Bank Limited (HBL)",
  "Bank Alfalah",
  "MCB Bank",
  "United Bank Limited (UBL)",
  "Faysal Bank",
  "Allied Bank Limited (ABL)",
  "Askari Bank",
  "Standard Chartered Bank",
  "Bank of Punjab (BOP)",
  "JS Bank",
  "Dubai Islamic Bank",
];

export function BankAccountModal({ isOpen, onClose, accountToEdit, onSuccess }) {
  const [bankName, setBankName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const [accountTitleValid, setAccountTitleValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setBankName(accountToEdit.bankName || "");
        setAccountTitle(accountToEdit.accountTitle || "");
        setAccountNumber(accountToEdit.accountNumber === "-" ? "" : (accountToEdit.accountNumber || ""));
        setIban(accountToEdit.iban || "");
        setBranchName(accountToEdit.branchName || "");
        setBranchCode(accountToEdit.branchCode || "");
        setOpeningBalance(accountToEdit.openingBalance ? String(accountToEdit.openingBalance) : "");
        setIsDefault(Boolean(accountToEdit.isDefault));
      } else {
        setBankName("Meezan Bank");
        setAccountTitle("Al-Khaleej Lubricants");
        setAccountNumber("");
        setIban("");
        setBranchName("");
        setBranchCode("");
        setOpeningBalance("");
        setIsDefault(false);
      }
    }
  }, [isOpen, accountToEdit]);

  if (!isOpen) return null;

  const isFormValid = Boolean(bankName.trim() && (accountTitle.trim() || accountTitleValid));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bankName.trim() || !accountTitle.trim()) {
      toast.error("Bank name and account title are required.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        bankName: bankName.trim(),
        accountTitle: accountTitle.trim(),
        accountNumber: accountNumber.trim() || "-",
        iban: iban.trim().toUpperCase(),
        branchName: branchName.trim(),
        branchCode: branchCode.trim(),
        openingBalance: Number(openingBalance) || 0,
        isDefault,
      };

      if (accountToEdit && accountToEdit._id) {
        await updateBankAccountApi(accountToEdit._id, payload);
        toast.success("Bank account updated successfully!");
      } else {
        await createBankAccountApi(payload);
        toast.success("New bank account registered successfully!");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save bank account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Building2Icon className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {accountToEdit ? "Edit Company Bank Account" : "Register New Bank Account"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Company bank account for customer receipts, supplier payments, and POS settlement.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-7 cursor-pointer" disabled={loading}>
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[11px] text-foreground flex items-center gap-1">
              Select or Type Bank Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              list="pak-banks-list"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Meezan Bank, HBL, Bank Alfalah"
              className="w-full h-8.5 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
              required
            />
            <datalist id="pak-banks-list">
              {POPULAR_BANKS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[11px] text-foreground">
                Account Title <span className="text-destructive">*</span>
              </label>
              <ValidatedInput
                value={accountTitle}
                onChange={setAccountTitle}
                onValidationChange={setAccountTitleValid}
                validationType="text"
                placeholder="e.g. Al-Khaleej Lubricants"
                className="h-8.5 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[11px] text-foreground">
                Account Number (Optional)
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0102-0105829101"
                className="w-full h-8.5 rounded-lg border border-input bg-background px-3 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[11px] text-foreground flex items-center justify-between">
              <span>IBAN (Optional)</span>
              <span className="text-[10px] text-muted-foreground font-normal">24 Characters</span>
            </label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="e.g. PK36MEZN0001020105829101"
              maxLength={30}
              className="w-full h-8.5 rounded-lg border border-input bg-background px-3 text-xs font-mono uppercase focus:ring-1 focus:ring-primary focus:outline-hidden tracking-wider"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-[11px] text-foreground">Branch Name / Address (Optional)</label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Korangi Industrial Area, Karachi"
                className="w-full h-8.5 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[11px] text-foreground">Branch Code (Optional)</label>
              <input
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="e.g. 0102"
                className="w-full h-8.5 rounded-lg border border-input bg-background px-3 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </div>

          {!accountToEdit && (
            <div className="space-y-1">
              <label className="font-semibold text-[11px] text-foreground">Initial / Opening Balance (Optional)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full h-8.5 rounded-lg border border-input bg-background px-3 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>
          )}

          <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/80 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded-sm border-primary text-primary focus:ring-primary size-4 cursor-pointer"
            />
            <div className="space-y-0.2">
              <div className="font-semibold text-[11px] text-foreground flex items-center gap-1.5">
                <StarIcon className={`size-3.5 ${isDefault ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                <span>Set as Default Account for Print Statements & Invoices</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                This bank account and IBAN will automatically be printed on all customer statements and bills for direct transfer.
              </p>
            </div>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="h-8 text-xs cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="h-8 text-xs gap-1.5 cursor-pointer font-semibold">
              {loading && <Loader2Icon className="size-3.5 animate-spin" />}
              <span>{accountToEdit ? "Update Account" : "Register Account"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
