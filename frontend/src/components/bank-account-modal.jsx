import { useState, useEffect } from "react";
import { LandmarkIcon, XIcon, PlusIcon, Edit3Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const POPULAR_BANKS = [
  "HBL (Habib Bank Limited)",
  "Meezan Bank",
  "Bank Alfalah",
  "MCB Bank",
  "Allied Bank (ABL)",
  "United Bank Limited (UBL)",
  "Askari Bank",
  "Faysal Bank",
  "Bank of Punjab (BOP)",
  "JS Bank",
  "Standard Chartered",
  "Soneri Bank",
  "BankIslami",
  "Dubai Islamic Bank",
  "Cash in Hand (Tijori / Counter)",
  "Other Bank / Custom",
];

export function BankAccountModal({ isOpen, onClose, onSaveAccount, editingAccount = null }) {
  const [bankName, setBankName] = useState("HBL (Habib Bank Limited)");
  const [customBankName, setCustomBankName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountType, setAccountType] = useState("Current");
  const [openingBalance, setOpeningBalance] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingAccount) {
        if (POPULAR_BANKS.includes(editingAccount.bankName)) {
          setBankName(editingAccount.bankName);
          setCustomBankName("");
        } else {
          setBankName("Other Bank / Custom");
          setCustomBankName(editingAccount.bankName || "");
        }
        setAccountTitle(editingAccount.accountTitle || "");
        setAccountNumber(editingAccount.accountNumber || "");
        setBranchName(editingAccount.branchName || "");
        setAccountType(editingAccount.accountType || "Current");
        setOpeningBalance(editingAccount.openingBalance ? String(editingAccount.openingBalance) : "");
        setNotes(editingAccount.notes || "");
      } else {
        setBankName("HBL (Habib Bank Limited)");
        setCustomBankName("");
        setAccountTitle("");
        setAccountNumber("");
        setBranchName("");
        setAccountType("Current");
        setOpeningBalance("");
        setNotes("");
      }
    }
  }, [isOpen, editingAccount]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accountTitle.trim()) return;

    const resolvedBank = bankName === "Other Bank / Custom" ? customBankName.trim() || "Custom Bank" : bankName;

    const accountData = {
      id: editingAccount?.id || `acc_${Date.now()}`,
      bankName: resolvedBank,
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim() || "-",
      branchName: branchName.trim() || "-",
      accountType,
      openingBalance: Number(openingBalance) || 0,
      notes: notes.trim(),
    };

    onSaveAccount(accountData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <LandmarkIcon className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {editingAccount ? "Edit Bank Account Details" : "Add New Bank / Cash Account"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Bank title, account number & branch information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Select Bank *</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {POPULAR_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          {bankName === "Other Bank / Custom" && (
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Bank Name *</label>
              <Input
                required
                placeholder="e.g. Soneri Bank, First Women Bank"
                value={customBankName}
                onChange={(e) => setCustomBankName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Account Title *</label>
            <Input
              required
              autoFocus
              placeholder="e.g. Al Khaleej Lubricants (Main Current)"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Account / IBAN Number *</label>
              <Input
                required
                placeholder="e.g. 0123-4567890-01"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Current">Current Account</option>
                <option value="Savings">Savings / Profit</option>
                <option value="Tijori / Cash">Cash in Hand / Tijori</option>
                <option value="Digital Wallet">JazzCash / EasyPaisa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Branch Name / Code</label>
              <Input
                placeholder="e.g. Circular Road #0421"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Opening Balance (PKR)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Additional Notes</label>
            <Input
              placeholder="e.g. Primary account for Shell & Caltex lubricant purchases"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-7.5 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7.5 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {editingAccount ? <Edit3Icon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
              <span>{editingAccount ? "Update Account" : "Save Account"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
