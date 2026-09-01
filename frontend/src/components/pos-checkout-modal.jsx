import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { CustomerVendorSelect } from "@/components/ui/customer-vendor-select";
import { XIcon, ReceiptIcon, Loader2Icon, UserIcon, TagIcon, CreditCardIcon, AlertTriangleIcon, Building2Icon } from "lucide-react";
import { toast } from "sonner";
import { fetchBankAccounts } from "@/lib/api";

export function PosCheckoutModal({
  isOpen,
  onClose,
  cartSubtotal,
  initialDiscount = 0,
  initialPaymentMode = "Cash",
  onConfirm,
  submitting,
}) {
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const [saleType, setSaleType] = useState("Retail");
  const [discountMode, setDiscountMode] = useState("fixed");
  const [discount, setDiscount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashReceived, setCashReceived] = useState("");

  const [customerValid, setCustomerValid] = useState(true);
  const [discountValid, setDiscountValid] = useState(true);
  const [cashReceivedValid, setCashReceivedValid] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts().then((res) => {
        if (res && res.data) {
          setBankAccounts(res.data);
          const def = res.data.find((a) => a.isDefault && a.isActive) || res.data[0];
          if (def) setBankAccountId(def._id);
        }
      });
      if (initialDiscount > 0) {
        setDiscount(String(initialDiscount));
        setDiscountMode("fixed");
      } else {
        setDiscount("");
      }
      if (initialPaymentMode) {
        setPaymentMode(initialPaymentMode);
      }
    }
  }, [isOpen, initialDiscount, initialPaymentMode]);

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

  const isFormValid = customerValid && discountValid && cashReceivedValid;

  const handleConfirm = () => {
    if (!isFormValid) return;
    if (paymentMode === "Cash" && cashReceivedNum > 0 && cashReceivedNum < grandTotal) {
      toast.error("Cash received is less than the Grand Total.");
      return;
    }
    const selectedBank = bankAccounts.find((b) => b._id === bankAccountId);
    const bankAccountName = selectedBank ? `${selectedBank.bankName} - ${selectedBank.accountNumber}` : "";

    onConfirm({
      customerName,
      saleType,
      discount: discountNum,
      grandTotal,
      paymentMode,
      bankAccountId: (paymentMode === "Bank Transfer" || paymentMode === "Card") ? bankAccountId : undefined,
      bankAccountName: (paymentMode === "Bank Transfer" || paymentMode === "Card") ? bankAccountName : undefined,
      cashReceived: cashReceivedNum,
      changeDue,
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <ReceiptIcon className="size-4 text-primary" />
            Complete Checkout
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-6.5" disabled={submitting}>
            <XIcon className="size-3.5" />
          </Button>
        </div>

        <div className="p-4 space-y-2.5 text-xs">
          <div className="rounded-lg bg-muted/40 border border-border p-2.5 space-y-1">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-foreground">Rs {cartSubtotal.toLocaleString()}</span>
            </div>
            {discountNum > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[11px]">
                <span>Discount{discountMode === "percent" ? ` (${discountRaw}%)` : ""}</span>
                <span className="font-mono font-semibold">- Rs {discountNum.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-primary font-bold text-sm pt-1 border-t border-border/60">
              <span>Grand Total</span>
              <span className="font-mono">Rs {grandTotal.toLocaleString()}</span>
            </div>
          </div>

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
                <option value="Card">Card POS</option>
                <option value="Bank Transfer">Bank Transfer</option>
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
                placeholder="e.g. 50"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {(paymentMode === "Bank Transfer" || paymentMode === "Card") && (
            <div className="space-y-1 p-2 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in">
              <label className="font-medium text-[11px] text-foreground flex items-center gap-1">
                <Building2Icon className="size-3 text-primary" /> Deposit Bank Account
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer font-medium"
              >
                {bankAccounts.length === 0 ? (
                  <option value="">Default Business Bank Account</option>
                ) : (
                  bankAccounts.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bankName} - {b.accountNumber} ({b.accountTitle})
                    </option>
                  ))
                )}
              </select>
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

        <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" className="flex-1 cursor-pointer text-xs" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1 gap-1.5 text-xs cursor-pointer font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
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
