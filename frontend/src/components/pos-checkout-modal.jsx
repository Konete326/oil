import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { CustomerVendorSelect } from "@/components/ui/customer-vendor-select";
import {
  XIcon,
  ReceiptIcon,
  Loader2Icon,
  UserIcon,
  TagIcon,
  CreditCardIcon,
  AlertTriangleIcon,
  LandmarkIcon,
} from "lucide-react";
import { toast } from "sonner";

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

export function PosCheckoutModal({
  isOpen,
  onClose,
  cartSubtotal,
  cartCostTotal = 0,
  initialDiscount = 0,
  initialPaymentMode = "Cash",
  onConfirm,
  submitting,
}) {
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const [saleType, setSaleType] = useState("Retail");
  const [discountMode, setDiscountMode] = useState("fixed");
  const [discount, setDiscount] = useState("0");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [bankReferenceNo, setBankReferenceNo] = useState("");

  const [customerValid, setCustomerValid] = useState(true);
  const [discountValid, setDiscountValid] = useState(true);
  const [cashReceivedValid, setCashReceivedValid] = useState(true);

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
      if (initialDiscount > 0) {
        setDiscount(String(initialDiscount));
        setDiscountMode("fixed");
      } else {
        setDiscount("0");
      }
      if (initialPaymentMode) {
        setPaymentMode(initialPaymentMode);
      }
      if (availableBankAccounts.length > 0) {
        const firstBank = availableBankAccounts.find((a) => a.accountType !== "Tijori / Cash") || availableBankAccounts[0];
        setSelectedBankAccountId(firstBank.id);
      }
      setBankReferenceNo("");
    }
  }, [isOpen, initialDiscount, initialPaymentMode, availableBankAccounts]);

  if (!isOpen) return null;

  const discountRaw = Number(discount) || 0;
  const discountNum = discountMode === "percent"
    ? Number(((cartSubtotal * discountRaw) / 100).toFixed(2))
    : discountRaw;
  const grandTotal = Math.max(0, Number((cartSubtotal - discountNum).toFixed(2)));
  const cashReceivedNum = Number(cashReceived) || 0;
  const changeDue = Math.max(0, Number((cashReceivedNum - grandTotal).toFixed(2)));

  const currentBal = selectedCustomerObj?.currentBalance || 0;
  const credLimit = selectedCustomerObj?.creditLimit || 0;
  const isCreditBreached = credLimit > 0 && (currentBal + (paymentMode === "Credit / Khata" ? grandTotal : 0) > credLimit);
  const isLossSale = cartCostTotal > 0 && grandTotal < cartCostTotal;

  const isFormValid = customerValid && discountValid && cashReceivedValid && !isLossSale;

  const activeBankAccount = availableBankAccounts.find((a) => a.id === selectedBankAccountId);

  const handleConfirm = () => {
    if (!isFormValid) return;
    if (isLossSale) {
      toast.error(`Loss Prevention: Grand Total (Rs ${grandTotal.toLocaleString()}) cannot be lower than Cost Price (Rs ${cartCostTotal.toLocaleString()})!`);
      return;
    }
    if (paymentMode === "Cash" && cashReceivedNum > 0 && cashReceivedNum < grandTotal) {
      toast.error("Cash received is less than the Grand Total.");
      return;
    }
    if ((paymentMode === "Bank Transfer" || paymentMode === "Card") && !selectedBankAccountId) {
      toast.error("Please select the target Bank Account.");
      return;
    }

    onConfirm({
      customerName,
      saleType,
      discount: discountNum,
      grandTotal,
      paymentMode,
      cashReceived: cashReceivedNum,
      changeDue,
      bankAccountId: activeBankAccount?.id || "",
      bankAccountTitle: activeBankAccount?.accountTitle || "",
      bankName: activeBankAccount?.bankName || "",
      bankAccountNumber: activeBankAccount?.accountNumber || "",
      bankReferenceNo: bankReferenceNo.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && e.target.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleConfirm();
        }
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="size-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Complete Checkout</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              Rs {grandTotal.toLocaleString()}
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-6.5" disabled={submitting}>
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-2.5 text-xs">

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-medium text-[11px] text-foreground flex items-center gap-1">
                <UserIcon className="size-3 text-muted-foreground" /> Customer
              </label>
              <CustomerVendorSelect
                value={customerName}
                onChange={(val) => {
                  setCustomerName(val);
                  if (selectedCustomerObj && val !== selectedCustomerObj.name) {
                    setSelectedCustomerObj(null);
                  }
                }}
                onSelectCustomer={(cust) => {
                  setCustomerName(cust.name);
                  setSelectedCustomerObj(cust);
                  if (cust.customerType === "Wholesale") setSaleType("Wholesale");
                }}
              />
              {selectedCustomerObj && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5 pt-0.5 font-mono">
                  <span>Khata: <strong className="text-foreground">Rs {selectedCustomerObj.currentBalance?.toLocaleString() || 0}</strong></span>
                  {selectedCustomerObj.creditLimit > 0 && (
                    <span>Limit: <strong className="text-foreground">Rs {selectedCustomerObj.creditLimit?.toLocaleString()}</strong></span>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[11px] text-foreground flex items-center gap-1">
                <TagIcon className="size-3 text-muted-foreground" /> Sale Type
              </label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
          </div>

          {isCreditBreached && (
            <div className="rounded-lg bg-amber-500/15 border border-amber-500/40 p-2 text-amber-500 text-xs flex items-start gap-1.5 animate-pulse">
              <AlertTriangleIcon className="size-3.5 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[10.5px]">
                <div className="font-bold flex items-center gap-1">
                  <span>⚠️ Credit Limit Exceeded</span>
                </div>
                <div className="leading-tight opacity-90">
                  Khata (Rs {currentBal.toLocaleString()}) breaches limit of Rs {credLimit.toLocaleString()}!
                </div>
              </div>
            </div>
          )}

          {isLossSale && (
            <div className="rounded-lg bg-destructive/15 border border-destructive/40 p-2 text-destructive text-xs flex items-start gap-1.5 animate-pulse">
              <AlertTriangleIcon className="size-3.5 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[10.5px]">
                <div className="font-bold">⚠️ Loss Detected (Checkout Blocked)</div>
                <div className="leading-tight">
                  Grand Total (Rs {grandTotal.toLocaleString()}) kul kharid cost (Rs {cartCostTotal.toLocaleString()}) se kam hai. Sale allow nahi hai.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-medium text-[11px] text-foreground flex items-center gap-1">
                <CreditCardIcon className="size-3 text-muted-foreground" /> Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (IBFT)</option>
                <option value="Card">Card / Digital POS</option>
                <option value="Credit / Khata">Credit / Khata</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-[11px] text-foreground">Discount ({discountMode === "fixed" ? "Rs" : "%"})</label>
                <button
                  type="button"
                  onClick={() => { setDiscountMode(discountMode === "fixed" ? "percent" : "fixed"); }}
                  className="text-[9.5px] text-primary hover:underline cursor-pointer"
                >
                  {discountMode === "fixed" ? "%" : "Rs"}
                </button>
              </div>
              <ValidatedInput
                rule="positiveNumber"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                onValidationChange={setDiscountValid}
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {(paymentMode === "Bank Transfer" || paymentMode === "Card") && (
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="font-semibold text-[11px] text-foreground flex items-center gap-1.5">
                  <LandmarkIcon className="size-3.5 text-primary" />
                  Deposit to Bank Account *
                </label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
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
                  Reference / Slip / Tx ID # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. IBFT-91028 or Slip #"
                  value={bankReferenceNo}
                  onChange={(e) => setBankReferenceNo(e.target.value)}
                  className="w-full h-7.5 rounded-md border border-input bg-background px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {paymentMode === "Cash" && (
            <div className="grid grid-cols-2 gap-2.5">
              <ValidatedInput
                label="Cash Received"
                rule="positiveNumber"
                type="number"
                placeholder="e.g. 5000"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                onValidationChange={setCashReceivedValid}
              />
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">Change Due</label>
                <div className="h-9 rounded-md border bg-muted/40 px-3 flex items-center font-mono font-bold text-emerald-500 text-xs">
                  Rs {changeDue.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <Button variant="outline" className="flex-1 cursor-pointer text-xs h-8" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1 gap-1.5 text-xs cursor-pointer font-semibold bg-emerald-600 hover:bg-emerald-700 text-white h-8"
            onClick={handleConfirm}
            disabled={submitting || !isFormValid}
          >
            {submitting ? (
              <><Loader2Icon className="size-3.5 animate-spin" /><span>Processing...</span></>
            ) : (
              <span>Complete Sale</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
