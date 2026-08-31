import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { XIcon, TruckIcon } from "lucide-react";

export function ChallanModal({ isOpen, onClose, onSave, mills = [], products = [] }) {
  const [millId, setMillId] = useState("");
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [dipMeasurementInches, setDipMeasurementInches] = useState("");
  const [quantityLiters, setQuantityLiters] = useState("");
  const [overrideRate, setOverrideRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedMillObj = mills.find((m) => m._id === millId);

  useEffect(() => {
    if (isOpen) {
      const defaultMill = mills[0];
      const defaultProduct = products[0];
      setMillId(defaultMill?._id || "");
      setProductId(defaultProduct?._id || "");
      setProductName(defaultProduct ? `${defaultProduct.name} (${defaultProduct.brand || "Standard"})` : "Bulk Mineral Lubricant Oil");
      setVehicleNumber("");
      setDriverName("");
      setDriverPhone("");
      setDipMeasurementInches("");
      setQuantityLiters("1000");
      setOverrideRate(defaultMill?.contractRatePerLiter ? String(defaultMill.contractRatePerLiter) : "530");
      setError("");
    }
  }, [isOpen, mills, products]);

  const handleMillChange = (newMillId) => {
    setMillId(newMillId);
    const target = mills.find((m) => m._id === newMillId);
    if (target && target.contractRatePerLiter) {
      setOverrideRate(String(target.contractRatePerLiter));
    }
  };

  const handleProductNameChange = (value) => {
    setProductName(value);
    const matched = products.find(
      (p) =>
        p.name?.toLowerCase() === value.toLowerCase() ||
        `${p.name} (${p.brand || "Standard"})`.toLowerCase() === value.toLowerCase()
    );
    if (matched) {
      setProductId(matched._id);
    } else {
      setProductId("");
    }
  };

  if (!isOpen) return null;

  const rateNum = Number(overrideRate) || Number(selectedMillObj?.contractRatePerLiter) || 0;
  const litersNum = Number(quantityLiters) || 0;
  const calculatedTotal = (litersNum * rateNum).toFixed(2);

  const isFormValid = !!millId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError("");
    try {
      await onSave({
        millId,
        productId: productId || undefined,
        productName: productName.trim() || "Bulk Mineral Lubricant Oil",
        vehicleNumber: vehicleNumber.trim() ? vehicleNumber.toUpperCase().trim() : "N/A",
        driverName: driverName.trim() || "Standard Delivery",
        driverPhone: driverPhone.trim() || "",
        dipMeasurementInches: Number(dipMeasurementInches) || 0,
        quantityLiters: litersNum > 0 ? litersNum : 1000,
        overrideRate: rateNum > 0 ? rateNum : 530,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to issue Delivery Challan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 my-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <TruckIcon className="size-5 text-primary" />
            <div>
              <h3 className="font-bold text-base text-foreground leading-none">
                Issue Delivery Challan &amp; Gate Pass
              </h3>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                Bulk oil tanker dispatch &amp; instant invoice generation
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer size-7">
            <XIcon className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-[11px]">Target Textile Mill *</label>
                {selectedMillObj?.contractRatePerLiter > 0 && (
                  <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Contract: Rs {Number(selectedMillObj.contractRatePerLiter).toLocaleString()}/L
                  </span>
                )}
              </div>
              <select
                value={millId}
                onChange={(e) => handleMillChange(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                <option value="" disabled>Select Textile Mill</option>
                {mills.map((m) => (
                  <option key={m._id} value={m._id}>
                    [{m.code}] {m.name} ({m.zone || "Karachi"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Product / Oil Grade (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  list="challan-products-datalist"
                  placeholder="Select or type custom product name..."
                  value={productName}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs shadow-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <datalist id="challan-products-datalist">
                  {products.map((p) => (
                    <option key={p._id} value={`${p.name} (${p.brand || "Standard"})`}>
                      {p.category?.name || "Lubricants"} — Stock: {p.stockQuantity || 0} L
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Tanker / Vehicle No (Optional)</label>
              <input
                type="text"
                placeholder="e.g. TKA-4921"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs shadow-xs font-mono uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Driver Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Muhammad Aslam"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs shadow-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Driver Phone (Optional)</label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs shadow-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Dip Measurement (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 48 (Inches)"
                value={dipMeasurementInches}
                onChange={(e) => setDipMeasurementInches(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs shadow-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Quantity (Liters) (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={quantityLiters}
                onChange={(e) => setQuantityLiters(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs shadow-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                min="1"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Rate per Liter (Rs) (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 530"
                value={overrideRate}
                onChange={(e) => setOverrideRate(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs shadow-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                min="0"
              />
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border border-border/80 flex justify-between items-center text-xs">
            <div>
              <span className="text-muted-foreground font-medium block text-[11px]">Total Calculated Challan Bill:</span>
              <span className="text-[10.5px] text-muted-foreground font-mono">
                {litersNum.toLocaleString()} Liters × Rs {rateNum.toLocaleString()} / L
              </span>
            </div>
            <span className="font-mono font-bold text-base text-primary">
              Rs {Number(calculatedTotal).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="cursor-pointer">
              {loading ? "Generating..." : "Issue Delivery Challan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
