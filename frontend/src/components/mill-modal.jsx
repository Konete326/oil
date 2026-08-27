import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { XIcon } from "lucide-react";

const INDUSTRIAL_ZONES = [
  "Korangi Industrial Area, Karachi",
  "SITE Industrial Area, Karachi",
  "Landhi Industrial Zone, Karachi",
  "Federal B Area Industrial Zone, Karachi",
  "Port Qasim Industrial Area, Karachi",
  "Nooriabad Industrial Zone",
];

export function MillModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [zone, setZone] = useState("Korangi Industrial Area, Karachi");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [contractRatePerLiter, setContractRatePerLiter] = useState("");
  const [creditLimit, setCreditLimit] = useState("500000");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nameValid, setNameValid] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  const [contactValid, setContactValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [rateValid, setRateValid] = useState(false);

  const isFormValid = nameValid && codeValid && contactValid && phoneValid && rateValid;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCode(initialData.code || "");
      setZone(initialData.zone || "Korangi Industrial Area, Karachi");
      setContactPerson(initialData.contactPerson || "");
      setPhone(initialData.phone || "");
      setContractRatePerLiter(initialData.contractRatePerLiter !== undefined ? String(initialData.contractRatePerLiter) : "");
      setCreditLimit(initialData.creditLimit !== undefined ? String(initialData.creditLimit) : "500000");
      setAddress(initialData.address || "");
    } else {
      setName("");
      setCode(`MILL-${Math.floor(100 + Math.random() * 900)}`);
      setZone("Korangi Industrial Area, Karachi");
      setContactPerson("");
      setPhone("");
      setContractRatePerLiter("");
      setCreditLimit("500000");
      setAddress("");
    }
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    try {
      await onSave({
        name,
        code: code.toUpperCase(),
        zone,
        contactPerson,
        phone,
        contractRatePerLiter: Number(contractRatePerLiter),
        creditLimit: Number(creditLimit) || 500000,
        address,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save Textile Mill profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
          <h2 className="text-base font-bold text-foreground">
            {initialData ? "Edit Textile Mill / Client" : "Register New Textile Mill"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Mill Name"
              rule="nonEmpty"
              placeholder="e.g. Al-Karam Textile Mills"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onValidationChange={setNameValid}
            />
            <ValidatedInput
              label="Mill Code"
              rule="nonEmpty"
              placeholder="MILL-001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onValidationChange={setCodeValid}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Industrial Zone / Area</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {INDUSTRIAL_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <ValidatedInput
              label="Contact Person (Manager)"
              rule="nonEmpty"
              placeholder="e.g. Tariq Mehmood"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              onValidationChange={setContactValid}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ValidatedInput
              label="Phone Number"
              rule="phone"
              placeholder="0300-1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onValidationChange={setPhoneValid}
            />
            <ValidatedInput
              label="Contract Rate/Ltr (Rs)"
              rule="positiveNumber"
              type="number"
              placeholder="530"
              value={contractRatePerLiter}
              onChange={(e) => setContractRatePerLiter(e.target.value)}
              onValidationChange={setRateValid}
            />
            <ValidatedInput
              label="Credit Limit (Rs)"
              rule="positiveNumber"
              type="number"
              placeholder="500000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
            />
          </div>

          <ValidatedInput
            label="Full Factory Address (Optional)"
            rule="text"
            required={false}
            placeholder="e.g. Plot HT/11, Landhi Industrial Area, Karachi"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isFormValid} className="cursor-pointer">
              {loading ? "Saving..." : initialData ? "Update Profile" : "Register Mill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
