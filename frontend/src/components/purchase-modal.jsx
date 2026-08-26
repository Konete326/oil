import { useState, useEffect } from "react";
import { XIcon, PlusIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createPurchaseApi, fetchProducts } from "@/lib/api";

export function PurchaseModal({ isOpen, onClose, onSuccess }) {
  const [supplierName, setSupplierName] = useState("");
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitType, setUnitType] = useState("Liters");
  const [unitPrice, setUnitPrice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [supplierValid, setSupplierValid] = useState(false);
  const [productValid, setProductValid] = useState(false);
  const [quantityValid, setQuantityValid] = useState(false);
  const [unitPriceValid, setUnitPriceValid] = useState(false);

  const isFormValid = supplierValid && productValid && quantityValid && unitPriceValid;

  useEffect(() => {
    if (isOpen) {
      fetchProducts().then((res) => {
        if (res?.success) setProductsList(res.data);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProductSelect = (e) => {
    const pId = e.target.value;
    setProductId(pId);
    const prod = productsList.find((p) => p._id === pId);
    if (prod) {
      setProductName(prod.name);
      setUnitType(prod.unitType || "Liters");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      await createPurchaseApi({
        supplierName: supplierName.trim(),
        productId,
        productName: productName.trim(),
        quantity: Number(quantity),
        unitType,
        unitPrice: Number(unitPrice),
        paymentStatus,
        invoiceNumber,
      });

      toast.success("Stock purchase recorded successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to record purchase");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSupplierName("");
    setProductId("");
    setProductName("");
    setQuantity("");
    setUnitPrice("");
    setInvoiceNumber("");
  };

  const calculatedTotal = Number(quantity || 0) * Number(unitPrice || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Record Stock Purchase (Khareedari)</h2>
            <p className="text-xs text-muted-foreground">Add oil stock / raw inventory purchase from supplier.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <ValidatedInput
            label="Supplier / Vendor Name"
            rule="name"
            required
            placeholder="e.g. Parco Refinery, National Oil Corp"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            onValidationChange={setSupplierValid}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Select Product (Existing)</label>
              <select
                value={productId}
                onChange={handleProductSelect}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Custom / New Product</option>
                {productsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <ValidatedInput
              label="Product Name"
              rule="name"
              required
              placeholder="Product title"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onValidationChange={setProductValid}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ValidatedInput
              label="Quantity"
              rule="amount"
              required
              type="number"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onValidationChange={setQuantityValid}
              className="font-mono"
            />

            <ValidatedInput
              label="Unit Type"
              rule="text"
              required={false}
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
            />

            <ValidatedInput
              label="Rate / Unit (Rs.)"
              rule="amount"
              required
              type="number"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              onValidationChange={setUnitPriceValid}
              className="font-mono"
            />
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border flex justify-between items-center text-xs">
            <span className="font-medium text-muted-foreground">Calculated Net Total:</span>
            <span className="font-mono font-bold text-sm text-primary">Rs. {calculatedTotal.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Paid">Paid (Cash / Bank)</option>
                <option value="Credit">Credit (Khata)</option>
                <option value="Partial">Partial Payment</option>
              </select>
            </div>

            <ValidatedInput
              label="Supplier Invoice / Bill No."
              rule="text"
              required={false}
              placeholder="e.g. INV-90412"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>Save Purchase Entry</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
