import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { XIcon, SparklesIcon, FactoryIcon, UserCheckIcon, PlusCircleIcon } from "lucide-react";
import { fetchCustomers } from "@/lib/api";

const INDUSTRIAL_ZONES = [
  "Korangi Industrial Area, Karachi",
  "SITE Industrial Area, Karachi",
  "Landhi Industrial Zone, Karachi",
  "Federal B Area Industrial Zone, Karachi",
  "Port Qasim Industrial Area, Karachi",
  "Nooriabad Industrial Zone",
  "Hub Industrial Area, Balochistan",
  "Other / Outside Karachi",
];

const DEFAULT_CONTACT_ROLES = [
  "Factory Manager",
  "Procurement Officer",
  "Accounts Manager",
  "General Manager (GM)",
  "Store Incharge",
  "Maintenance Engineer",
  "Owner / Director",
];

const generateUniqueCode = (millName = "") => {
  if (millName.trim()) {
    const letters = millName
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 4);
    if (letters.length >= 2) {
      return `${letters}-${Math.floor(100 + Math.random() * 900)}`;
    }
  }
  return `MILL-${Math.floor(100 + Math.random() * 900)}`;
};

export function MillModal({ isOpen, onClose, onSave, editingMill, initialData, mills = [], customers = [] }) {
  const currentMill = editingMill || initialData;
  const [customerList, setCustomerList] = useState(customers);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCustomMill, setIsCustomMill] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [zone, setZone] = useState(INDUSTRIAL_ZONES[0]);
  const [contactPerson, setContactPerson] = useState("");
  const [isCustomPerson, setIsCustomPerson] = useState(false);
  const [phone, setPhone] = useState("");
  const [contractRatePerLiter, setContractRatePerLiter] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCustomers({ limit: 1000 }).then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setCustomerList(res.data);
        } else if (Array.isArray(res)) {
          setCustomerList(res);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (customers && customers.length > 0) {
      setCustomerList(customers);
    }
  }, [customers]);

  useEffect(() => {
    if (currentMill) {
      setName(currentMill.name || "");
      setCode(currentMill.code || "");
      setZone(currentMill.zone || INDUSTRIAL_ZONES[0]);
      setContactPerson(currentMill.contactPerson === "-" ? "" : (currentMill.contactPerson || ""));
      setPhone(currentMill.phone === "-" ? "" : (currentMill.phone || ""));
      setContractRatePerLiter(currentMill.contractRatePerLiter !== undefined ? String(currentMill.contractRatePerLiter) : "");
      setCreditLimit(currentMill.creditLimit ? String(currentMill.creditLimit) : "");
      setAddress(currentMill.address || "");
      setIsCustomMill(true);
      setIsCustomPerson(true);
    } else if (isOpen) {
      const newCode = `MILL-${Math.floor(100 + (mills.length + 1) * 10 + Math.random() * 9)}`;
      setName("");
      setCode(newCode);
      setZone(INDUSTRIAL_ZONES[0]);
      setContactPerson(DEFAULT_CONTACT_ROLES[0]);
      setPhone("");
      setContractRatePerLiter("");
      setCreditLimit("");
      setAddress("");
      setSelectedCustomerId("");
      setIsCustomMill(false);
      setIsCustomPerson(false);
    }
    setError("");
  }, [currentMill, isOpen, mills.length]);

  const handleCustomerSelect = (id) => {
    setSelectedCustomerId(id);
    if (id === "custom") {
      setIsCustomMill(true);
      setName("");
      return;
    }
    setIsCustomMill(false);
    const matched = customerList.find((c) => c._id === id);
    if (matched) {
      setName(matched.name || "");
      if (matched.phone && matched.phone !== "-") setPhone(matched.phone);
      if (matched.address && matched.address !== "-") setAddress(matched.address);
      if (matched.city) {
        const foundZone = INDUSTRIAL_ZONES.find((z) => z.toLowerCase().includes(matched.city.toLowerCase()));
        if (foundZone) setZone(foundZone);
      }
      if (!currentMill) {
        setCode(generateUniqueCode(matched.name));
      }
    }
  };

  const handlePersonSelect = (val) => {
    if (val === "custom") {
      setIsCustomPerson(true);
      setContactPerson("");
    } else {
      setIsCustomPerson(false);
      setContactPerson(val);
    }
  };

  const handleNameChange = (val) => {
    setName(val);
    if (!currentMill && (!code || code.startsWith("MILL-"))) {
      setCode(generateUniqueCode(val));
    }
  };

  const handleAutoGenerateCode = (e) => {
    e.preventDefault();
    setCode(generateUniqueCode(name));
  };

  if (!isOpen) return null;

  const isFormValid = name.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    try {
      const finalCode = (code.trim() || generateUniqueCode(name)).toUpperCase();
      await onSave({
        name: name.trim(),
        code: finalCode,
        zone,
        contactPerson: contactPerson.trim() || "-",
        phone: phone.trim() || "-",
        contractRatePerLiter: Number(contractRatePerLiter) || 0,
        creditLimit: Number(creditLimit) || 500000,
        address: address.trim() || "",
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
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <FactoryIcon className="size-4.5 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {currentMill ? "Edit Textile Mill Profile" : "Register New Textile Mill"}
            </h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer size-7">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive font-medium text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-[11px]">Textile Mill / Customer *</label>
                {!isCustomMill ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMill(true);
                      setSelectedCustomerId("custom");
                    }}
                    className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    + Type Custom
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMill(false);
                      setSelectedCustomerId("");
                    }}
                    className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    ← Select From List
                  </button>
                )}
              </div>

              {!isCustomMill ? (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  <option value="" disabled>-- Select Customer / Mill --</option>
                  {customerList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.city ? `(${c.city})` : ""}
                    </option>
                  ))}
                  <option value="custom">+ Type Custom Mill Name...</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Artistic Milliners Unit 2"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                  autoFocus
                />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-muted-foreground text-[11px]">Mill Code (Optional)</label>
                <button
                  type="button"
                  onClick={handleAutoGenerateCode}
                  className="text-[10.5px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <SparklesIcon className="size-3" />
                  <span>Auto Code</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="MILL-001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold text-primary uppercase focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Industrial Zone / Area</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {INDUSTRIAL_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-muted-foreground text-[11px]">Contact Person (Optional)</label>
                {!isCustomPerson ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomPerson(true)}
                    className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    + Custom Person
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPerson(false);
                      setContactPerson(DEFAULT_CONTACT_ROLES[0]);
                    }}
                    className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    ← Select Role
                  </button>
                )}
              </div>

              {!isCustomPerson ? (
                <select
                  value={contactPerson}
                  onChange={(e) => handlePersonSelect(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {DEFAULT_CONTACT_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                  <option value="custom">+ Type Custom Person Name...</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Tariq Mehmood / GM Operations"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Phone (Optional)</label>
              <input
                type="tel"
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+ -]/g, ""))}
                onKeyDown={(e) => {
                  if (!/[0-9+\- ]/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                  }
                }}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Contract Rate / Ltr (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 530"
                value={contractRatePerLiter}
                onChange={(e) => setContractRatePerLiter(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                min="0"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[11px]">Credit Limit (Rs) (Optional)</label>
              <input
                type="number"
                placeholder="500000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-muted-foreground text-[11px]">Factory Address (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Plot HT/11, Landhi Industrial Area, Karachi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-8.5 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="cursor-pointer">
              {loading ? "Saving..." : currentMill ? "Update Profile" : "Register Mill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
