import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { CustomerVendorSelect } from "@/components/ui/customer-vendor-select";
import { XIcon, ReceiptIcon, Loader2Icon, UserIcon, TagIcon, BadgePercentIcon, CreditCardIcon, BanknoteIcon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";

export function PosCheckoutModal({ isOpen, onClose, cartSubtotal, onConfirm, submitting }) {
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const [saleType, setSaleType] = useState("Retail");
  const [discountMode, setDiscountMode] = useState("fixed");
  const [discount, setDiscount] = useState("0");
  const [taxPercent, setTaxPercent] = useState("0");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");

  const [customerValid, setCustomerValid] = useState(true);
  const [discountValid, setDiscountValid] = useState(true);
  const [taxValid, setTaxValid] = useState(true);
  const [cashReceivedValid, setCashReceivedValid] = useState(true);

  if (!isOpen) return null;

  const discountRaw = Number(discount) || 0;
  const discountNum = discountMode === "percent"
    ? Number(((cartSubtotal * discountRaw) / 100).toFixed(2))
    : discountRaw;
  const taxPctNum = Number(taxPercent) || 0;
  const taxAmount = Number(((cartSubtotal - discountNum) * (taxPctNum / 100)).toFixed(2));
  const grandTotal = Math.max(0, Number((cartSubtotal - discountNum + (taxAmount > 0 ? taxAmount : 0)).toFixed(2)));
  const cashReceivedNum = Number(cashReceived) || 0;
  const changeDue = Math.max(0, Number((cashReceivedNum - grandTotal).toFixed(2)));

  const currentBal = selectedCustomerObj?.currentBalance || 0;
  const credLimit = selectedCustomerObj?.creditLimit || 0;
  const isCreditBreached = credLimit > 0 && (currentBal + (paymentMode === "Credit / Khata" ? grandTotal : 0) > credLimit);

  const isFormValid = customerValid && discountValid && taxValid && cashReceivedValid;

  const handleConfirm = () => {
    if (!isFormValid) return;
    if (paymentMode === "Cash" && cashReceivedNum > 0 && cashReceivedNum < grandTotal) {
      toast.error("Cash received is less than the Grand Total.");
      return;
    }
    onConfirm({ customerName, saleType, discount: discountNum, taxAmount, grandTotal, paymentMode, cashReceived: cashReceivedNum, changeDue });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <ReceiptIcon className="size-4 text-primary" />
            Complete Checkout
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7" disabled={submitting}>
            <XIcon className="size-3.5" />
          </Button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-foreground">Rs {cartSubtotal.toLocaleString()}</span>
            </div>
            {discountNum > 0 && (
              <div className="flex justify-between text-amber-500">
                <span>Discount{discountMode === "percent" ? ` (${discountRaw}%)` : ""}</span>
                <span className="font-mono font-semibold">- Rs {discountNum.toLocaleString()}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>GST ({taxPctNum}%)</span>
                <span className="font-mono font-semibold">+ Rs {taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-primary font-bold text-sm pt-1 border-t border-border/60">
              <span>Grand Total</span>
              <span className="font-mono">Rs {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground flex items-center gap-1">
                <UserIcon className="size-3 text-muted-foreground" /> Select Customer
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
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground flex items-center gap-1">
                <TagIcon className="size-3 text-muted-foreground" /> Sale Type
              </label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
          </div>

          {isCreditBreached && (
            <div className="rounded-lg bg-amber-500/15 border border-amber-500/40 p-2.5 text-amber-500 text-xs flex items-start gap-2 animate-pulse">
              <AlertTriangleIcon className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  <span>⚠️ Credit Limit Breach Alert</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-black font-bold font-mono">
                    EXCEEDED
                  </span>
                </div>
                <div className="text-[11px] leading-tight opacity-90">
                  Customer Khata Balance (Rs {currentBal.toLocaleString()}) + sale will breach sanctioned limit of Rs {credLimit.toLocaleString()}!
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <ValidatedInput
                label={`Discount (${discountMode === "fixed" ? "Rs" : "%"})`}
                rule="positiveNumber"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                onValidationChange={setDiscountValid}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => { setDiscountMode(discountMode === "fixed" ? "percent" : "fixed"); setDiscount("0"); }}
                className="text-[10px] text-primary hover:underline cursor-pointer"
              >
                Switch to {discountMode === "fixed" ? "Percentage (%)" : "Fixed (Rs)"}
              </button>
            </div>
            <ValidatedInput
              label="Tax GST (%)"
              rule="positiveNumber"
              type="number"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              onValidationChange={setTaxValid}
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground flex items-center gap-1">
              <CreditCardIcon className="size-3 text-muted-foreground" /> Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card POS</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit / Khata">Credit / Khata</option>
            </select>
          </div>

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
