import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon, TruckIcon, Loader2Icon, AlertTriangleIcon } from "lucide-react";
import { createSupplierApi } from "@/lib/api";
import { toast } from "sonner";

export function SupplierModal({ isOpen, onClose, supplier, onSuccess, onSaved, existingSuppliers = [] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || "");
      setPhone(supplier.phone || "");
      setAddress(supplier.address || "");
      setOpeningBalance(supplier.currentBalance ? String(supplier.currentBalance) : "");
    } else {
      setName("");
      setPhone("");
      setAddress("");
      setOpeningBalance("");
    }
  }, [supplier, isOpen]);

  useEffect(() => {
    if (!Array.isArray(existingSuppliers) || existingSuppliers.length === 0) {
      setDuplicateWarning(null);
      return;
    }

    const trimmedName = name.trim().toLowerCase();
    if (trimmedName) {
      const nameMatch = existingSuppliers.find(
        (s) =>
          (!supplier || (s._id !== supplier._id && s.id !== supplier.id)) &&
          (s.name || "").trim().toLowerCase() === trimmedName
      );
      if (nameMatch) {
        setDuplicateWarning(`A supplier with the name "${nameMatch.name}" already exists.`);
        return;
      }
    }

    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length >= 10) {
      const phoneMatch = existingSuppliers.find(
        (s) =>
          (!supplier || (s._id !== supplier._id && s.id !== supplier.id)) &&
          (s.phone || "").replace(/\D/g, "") === rawDigits
      );
      if (phoneMatch) {
        setDuplicateWarning(`This phone number is already registered with "${phoneMatch.name}".`);
        return;
      }
    }

    setDuplicateWarning(null);
  }, [name, phone, supplier, existingSuppliers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !name.trim() || duplicateWarning) {
      if (duplicateWarning) toast.error(duplicateWarning);
      else toast.error("Supplier Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        openingBalance: Number(openingBalance) || 0,
        currentBalance: Number(openingBalance) || 0,
      };

      const notifySaved = onSaved || onSuccess;
      const res = await createSupplierApi(payload);
      const savedData = res?.data || { ...payload, _id: `sup_${Date.now()}` };
      toast.success("New supplier profile created successfully!");
      if (typeof notifySaved === "function") notifySaved(savedData);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 shrink-0">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <TruckIcon className="size-4 text-primary" />
            <span>Add New Supplier / Refinery</span>
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7" disabled={submitting}>
            <XIcon className="size-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">
              Supplier / Refinery Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. National Refinery / Byco Oil Ltd"
              className="h-8.5 text-xs bg-muted/20 focus:bg-background"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Phone Number (Optional)</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+ -]/g, ""))}
                onKeyDown={(e) => {
                  if (!/[0-9+\- ]/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="0300-1234567"
                className="h-8.5 text-xs bg-muted/20 focus:bg-background font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Opening Balance (Optional)</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="e.g. 50000"
                className="h-8.5 text-xs bg-muted/20 focus:bg-background font-mono"
              />
            </div>
          </div>

          {duplicateWarning && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1.5 animate-in fade-in duration-150 font-medium">
              <AlertTriangleIcon className="size-3.5 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Office / Refinery Address (Optional)</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Plot 12, Korangi Industrial Area, Karachi"
              className="h-8.5 text-xs bg-muted/20 focus:bg-background"
            />
          </div>

          <div className="pt-2.5 flex justify-end gap-2 border-t border-border">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting} className="cursor-pointer text-xs h-8">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !!duplicateWarning}
              className="cursor-pointer text-xs font-semibold h-8 px-4 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2Icon className="size-3.5 animate-spin" /><span>Saving...</span></>
              ) : (
                <span>Create Supplier Profile</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
