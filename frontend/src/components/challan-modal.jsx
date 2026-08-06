import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon, TruckIcon } from "lucide-react";

export function ChallanModal({ isOpen, onClose, onSave, mills, products }) {
  const [millId, setMillId] = useState("");
  const [productId, setProductId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [dipMeasurementInches, setDipMeasurementInches] = useState("");
  const [quantityLiters, setQuantityLiters] = useState("");
  const [overrideRate, setOverrideRate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedMillObj = mills.find((m) => m._id === millId);

  useEffect(() => {
    if (isOpen) {
      setMillId(mills[0]?._id || "");
      setProductId(products[0]?._id || "");
      setVehicleNumber("");
      setDriverName("");
      setDriverPhone("");
      setDipMeasurementInches("48");
      setQuantityLiters("10000");
      setOverrideRate("");
      setNotes("");
      setError("");
    }
  }, [isOpen, mills, products]);

  useEffect(() => {
    if (selectedMillObj) {
      setOverrideRate(String(selectedMillObj.contractRatePerLiter));
    }
  }, [millId]);

  if (!isOpen) return null;

  const rateNum = Number(overrideRate) || selectedMillObj?.contractRatePerLiter || 0;
  const litersNum = Number(quantityLiters) || 0;
  const calculatedTotal = (litersNum * rateNum).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!millId || !productId || !vehicleNumber.trim() || !driverName.trim() || !dipMeasurementInches || !quantityLiters) {
      setError("Please fill all required dispatch fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({
        millId,
        productId,
        vehicleNumber: vehicleNumber.toUpperCase(),
        driverName,
        driverPhone,
        dipMeasurementInches: Number(dipMeasurementInches),
        quantityLiters: Number(quantityLiters),
        overrideRate: Number(overrideRate),
        notes,
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
      <div className="w-full max-w-xl rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <TruckIcon className="size-5 text-primary" />
              Issue Delivery Challan & Gate Pass
            </h3>
            <p className="text-xs text-muted-foreground">Record Tanker Dispatch & Mill Delivery Details</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Target Textile Mill *</label>
              <select
                value={millId}
                onChange={(e) => setMillId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
                required
              >
                <option value="" disabled>Select Textile Mill</option>
                {mills.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.zone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Product / Oil Grade *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
                required
              >
                <option value="" disabled>Select Oil Product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.brand}) — Grade: {p.grade || "N/A"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Tanker / Vehicle No *</label>
              <Input
                placeholder="e.g. TKA-4921"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Driver Name *</label>
              <Input
                placeholder="e.g. Muhammad Aslam"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Driver Phone</label>
              <Input
                placeholder="0301-8291044"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Dip Measurement (Inches) *</label>
              <Input
                type="number"
                placeholder="48"
                value={dipMeasurementInches}
                onChange={(e) => setDipMeasurementInches(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Net Quantity (Liters) *</label>
              <Input
                type="number"
                placeholder="10000"
                value={quantityLiters}
                onChange={(e) => setQuantityLiters(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Rate Per Liter (Rs) *</label>
              <Input
                type="number"
                placeholder="530"
                value={overrideRate}
                onChange={(e) => setOverrideRate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center justify-between">
            <span className="font-medium text-primary">Calculated Total Shipment Bill:</span>
            <span className="font-mono text-lg font-bold text-primary">
              Rs {Number(calculatedTotal).toLocaleString()}
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Gate Pass Notes / Bilty Ref</label>
            <Input
              placeholder="e.g. Bilty No. 49120, Shipped to Spinning Division"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer font-semibold">
              {loading ? "Issuing Gate Pass..." : "Issue Delivery Challan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
