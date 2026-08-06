import { useState, useEffect } from "react";
import { XIcon, PlusIcon, Loader2Icon, PackageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [notes, setNotes] = useState("");
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);

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
    if (!supplierName.trim()) {
      toast.error("Please enter a supplier or vendor name");
      return;
    }
    if (!productName.trim()) {
      toast.error("Please enter or select a product name");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid stock quantity");
      return;
    }
    if (!unitPrice || Number(unitPrice) <= 0) {
      toast.error("Please enter a valid rate per liter/unit");
      return;
    }

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
        notes,
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
    setNotes("");
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
          <div className="space-y-1">
            <label className="font-medium text-foreground">Supplier / Vendor Name *</label>
            <Input
              type="text"
              placeholder="e.g. Parco Refinery, National Oil Corp"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="text-xs"
              required
            />
          </div>

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

            <div className="space-y-1">
              <label className="font-medium text-foreground">Product Name *</label>
              <Input
                type="text"
                placeholder="Product title"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Quantity *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Unit Type</label>
              <Input
                type="text"
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Rate / Unit (Rs.) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between font-mono text-xs">
            <span className="text-muted-foreground font-sans">Total Bill Amount:</span>
            <span className="font-bold text-sm text-foreground">Rs. {calculatedTotal.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Invoice / Bill Ref No</label>
              <Input
                type="text"
                placeholder="e.g. INV-9042"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Notes & Remarks</label>
            <textarea
              rows={2}
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>Save Purchase Entry</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
