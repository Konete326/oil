import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { XIcon, UserIcon, Loader2Icon, AlertTriangleIcon } from "lucide-react";
import { createCustomerApi, updateCustomerApi } from "@/lib/api";
import { toast } from "sonner";

export function CustomerModal({ isOpen, onClose, customer, onSuccess, existingCustomers = [] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customerType, setCustomerType] = useState("Retail");
  const [creditLimit, setCreditLimit] = useState("0");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [status, setStatus] = useState("Active");
  const [submitting, setSubmitting] = useState(false);
  const [nameValid, setNameValid] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setAddress(customer.address || "");
      setCustomerType(customer.customerType || "Retail");
      setCreditLimit(String(customer.creditLimit || 0));
      setOpeningBalance(String(customer.currentBalance || 0));
      setStatus(customer.status || "Active");
    } else {
      setName("");
      setPhone("");
      setAddress("");
      setCustomerType("Retail");
      setCreditLimit("0");
      setOpeningBalance("0");
      setStatus("Active");
    }
  }, [customer, isOpen]);

  useEffect(() => {
    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length >= 10 && Array.isArray(existingCustomers) && existingCustomers.length > 0) {
      const match = existingCustomers.find(
        (c) =>
          (!customer || c._id !== customer._id) &&
          (c.phone || "").replace(/\D/g, "") === rawDigits
      );
      if (match) {
        setDuplicateWarning(`Yeh phone number pehle se "${match.name}" ke paas register hai.`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [phone, customer, existingCustomers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !name.trim()) {
      toast.error("Customer Name is required.");
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

      if (customer) {
        const res = await updateCustomerApi(customer._id, payload);
        toast.success("Customer profile updated successfully!");
        onSuccess(res?.data || { ...customer, ...payload }, true);
      } else {
        const res = await createCustomerApi(payload);
        toast.success("New Customer profile created successfully!");
        onSuccess(res?.data || { ...payload, _id: `cust_${Date.now()}` }, false);
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
          <ValidatedInput
            label="Customer Full Name *"
            rule="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onValidationChange={setNameValid}
            placeholder="e.g. Tariq Autos / Bilal Traders"
          />

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ValidatedInput
                label="Phone Number (Optional)"
                rule="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
              />
              <div className="space-y-1">
                <label className="font-medium text-foreground text-[11px]">Customer Type</label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <ValidatedInput
              label={customer ? "Current Balance" : "Opening Balance (Optional)"}
              rule="number"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
            />
            <ValidatedInput
              label="Credit Limit (Optional)"
              rule="positiveNumber"
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0"
            />
          </div>

          <ValidatedInput
            label="Shop / Street Address (Optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Shop # 4, Main Market, Karachi"
          />

          {customer && (
            <div className="space-y-1 pt-1">
              <label className="font-medium text-foreground text-[11px]">Account Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Active">Active (Chalu)</option>
                <option value="Inactive">Inactive (Band)</option>
              </select>
            </div>
          )}

          <div className="pt-2.5 flex justify-end gap-2 border-t border-border">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting} className="cursor-pointer text-xs h-8">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !nameValid} className="cursor-pointer text-xs font-semibold h-8 px-4 bg-primary text-primary-foreground">
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
