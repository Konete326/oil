import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon, UserIcon, Loader2Icon, AlertTriangleIcon } from "lucide-react";
import { createCustomerApi, updateCustomerApi } from "@/lib/api";
import { toast } from "sonner";

export function CustomerModal({ isOpen, onClose, customer, onSuccess, onSaved, existingCustomers = [] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customerType, setCustomerType] = useState("Retail");
  const [creditLimit, setCreditLimit] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [status, setStatus] = useState("Active");
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setAddress(customer.address || "");
      setCustomerType(customer.customerType || "Retail");
      setCreditLimit(customer.creditLimit ? String(customer.creditLimit) : "");
      setOpeningBalance(customer.currentBalance ? String(customer.currentBalance) : "");
      setStatus(customer.status || "Active");
    } else {
      setName("");
      setPhone("");
      setAddress("");
      setCustomerType("Retail");
      setCreditLimit("");
      setOpeningBalance("");
      setStatus("Active");
    }
  }, [customer, isOpen]);

  useEffect(() => {
    if (!Array.isArray(existingCustomers) || existingCustomers.length === 0) {
      setDuplicateWarning(null);
      return;
    }

    const trimmedName = name.trim().toLowerCase();
    if (trimmedName) {
      const nameMatch = existingCustomers.find(
        (c) =>
          (!customer || (c._id !== customer._id && c.id !== customer.id)) &&
          (c.name || "").trim().toLowerCase() === trimmedName
      );
      if (nameMatch) {
        setDuplicateWarning(`A customer with the name "${nameMatch.name}" already exists.`);
        return;
      }
    }

    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length >= 10) {
      const phoneMatch = existingCustomers.find(
        (c) =>
          (!customer || (c._id !== customer._id && c.id !== customer.id)) &&
          (c.phone || "").replace(/\D/g, "") === rawDigits
      );
      if (phoneMatch) {
        setDuplicateWarning(`This phone number is already registered with "${phoneMatch.name}".`);
        return;
      }
    }

    setDuplicateWarning(null);
  }, [name, phone, customer, existingCustomers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !name.trim() || duplicateWarning) {
      if (duplicateWarning) toast.error(duplicateWarning);
      else toast.error("Customer Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: "",
        address: address.trim(),
        city: "Karachi",
        customerType,
        creditLimit: Number(creditLimit) || 0,
        currentBalance: Number(openingBalance) || 0,
        status: customer ? status : "Active",
        notes: "",
      };

      const notifySaved = onSaved || onSuccess;
      if (customer) {
        const res = await updateCustomerApi(customer._id, payload);
        const savedData = res?.data || { ...customer, ...payload };
        toast.success("Customer profile updated successfully!");
        if (typeof notifySaved === "function") notifySaved(savedData, true);
      } else {
        const res = await createCustomerApi(payload);
        const savedData = res?.data || { ...payload, _id: `cust_${Date.now()}` };
        toast.success("New Customer profile created successfully!");
        if (typeof notifySaved === "function") notifySaved(savedData, false);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 shrink-0">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <UserIcon className="size-4 text-primary" />
            {customer ? "Edit Customer Profile" : "Add New Customer"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7" disabled={submitting}>
            <XIcon className="size-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">
              Customer Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tariq Autos / Bilal Traders"
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
              <label className="font-medium text-foreground text-[11px]">Customer Type (Optional)</label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="Retail">Retail Customer</option>
                <option value="Wholesale">Wholesale Party</option>
                <option value="Corporate">Corporate / Fleet</option>
              </select>
            </div>
          </div>

          {duplicateWarning && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1.5 animate-in fade-in duration-150 font-medium">
              <AlertTriangleIcon className="size-3.5 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">
                {customer ? "Current Balance (Optional)" : "Opening Balance (Optional)"}
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="e.g. 5000"
                className="h-8.5 text-xs bg-muted/20 focus:bg-background font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Credit Limit (Optional)</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="e.g. 100000"
                className="h-8.5 text-xs bg-muted/20 focus:bg-background font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Shop / Street Address (Optional)</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop # 4, Main Market, Karachi"
              className="h-8.5 text-xs bg-muted/20 focus:bg-background"
            />
          </div>

          {customer && (
            <div className="space-y-1 pt-0.5">
              <label className="font-medium text-foreground text-[11px]">Account Status (Optional)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

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
                <span>{customer ? "Save Changes" : "Create Customer"}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
