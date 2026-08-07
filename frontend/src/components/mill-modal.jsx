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
  const [ntnNumber, setNtnNumber] = useState("");
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
      setNtnNumber(initialData.ntnNumber || "");
      setContractRatePerLiter(initialData.contractRatePerLiter !== undefined ? String(initialData.contractRatePerLiter) : "");
      setCreditLimit(initialData.creditLimit !== undefined ? String(initialData.creditLimit) : "500000");
      setAddress(initialData.address || "");
    } else {
      setName("");
      setCode(`MILL-${Math.floor(100 + Math.random() * 900)}`);
      setZone("Korangi Industrial Area, Karachi");
      setContactPerson("");
      setPhone("");
      setNtnNumber("");
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
        ntnNumber,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-lg text-foreground">
            {initialData ? "Edit Textile Mill Profile" : "Register New Textile Mill"}
          </h3>
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
            <ValidatedInput
              label="Mill Name"
              rule="name"
              required
              placeholder="e.g. Al-Karam Textile Mills"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onValidationChange={setNameValid}
            />
            <ValidatedInput
              label="Mill Code"
              rule="code"
              required
              placeholder="e.g. AKTM-01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onValidationChange={setCodeValid}
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Industrial Zone / City *</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
            >
              {INDUSTRIAL_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ValidatedInput
              label="Contact Person"
              rule="name"
              required
              placeholder="e.g. Tariq Mahmood"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              onValidationChange={setContactValid}
            />
            <ValidatedInput
              label="Phone Number"
              rule="phone"
              required
              placeholder="e.g. 0300-8219401"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onValidationChange={setPhoneValid}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ValidatedInput
              label="Contract Rate (Rs/L)"
              rule="amount"
              required
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
            <ValidatedInput
              label="NTN / STRN"
              rule="text"
              required={false}
              placeholder="0712394-8"
              value={ntnNumber}
              onChange={(e) => setNtnNumber(e.target.value)}
            />
          </div>

          <ValidatedInput
            label="Full Factory Address"
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
