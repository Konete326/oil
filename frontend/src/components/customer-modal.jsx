import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { XIcon, UserIcon, PhoneIcon, MailIcon, MapPinIcon, BuildingIcon, CreditCardIcon, Loader2Icon } from "lucide-react";
import { createCustomerApi, updateCustomerApi } from "@/lib/api";
import { toast } from "sonner";

export function CustomerModal({ isOpen, onClose, customer, onSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [customerType, setCustomerType] = useState("Retail");
  const [creditLimit, setCreditLimit] = useState("0");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [nameValid, setNameValid] = useState(true);

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setCity(customer.city || "Karachi");
      setCustomerType(customer.customerType || "Retail");
      setCreditLimit(String(customer.creditLimit || 0));
      setOpeningBalance(String(customer.currentBalance || 0));
      setStatus(customer.status || "Active");
      setNotes(customer.notes || "");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setCity("Karachi");
      setCustomerType("Retail");
      setCreditLimit("0");
      setOpeningBalance("0");
      setStatus("Active");
      setNotes("");
    }
  }, [customer, isOpen]);

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
        phone,
        email,
        address,
        city,
        customerType,
        creditLimit: Number(creditLimit) || 0,
        currentBalance: Number(openingBalance) || 0,
        status,
        notes,
      };

      if (customer) {
        await updateCustomerApi(customer._id, payload);
        toast.success("Customer profile updated successfully!");
      } else {
        await createCustomerApi(payload);
        toast.success("New Customer profile created successfully!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <UserIcon className="size-4 text-primary" />
            {customer ? "Edit Customer Profile" : "Add New Customer"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7" disabled={submitting}>
            <XIcon className="size-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Customer Full Name"
              rule="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onValidationChange={setNameValid}
              placeholder="e.g. Tariq Petroleum Services"
            />
            <div className="space-y-1">
              <label className="font-medium text-foreground">Customer Type</label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs cursor-pointer"
              >
                <option value="Retail">Retail Customer</option>
                <option value="Wholesale">Wholesale Distributor</option>
                <option value="Corporate">Corporate / Fleet Account</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Phone Number (Optional)"
              rule="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0300-1234567"
            />
            <ValidatedInput
              label="Email Address (Optional)"
              rule="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <ValidatedInput
                label="Street Address (Optional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot #, Industrial Area..."
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs cursor-pointer"
              >
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Multan">Multan</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Quetta">Quetta</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ValidatedInput
              label="Credit Limit (Optional)"
              rule="positiveNumber"
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0"
            />
            <ValidatedInput
              label={customer ? "Current Balance" : "Opening Balance (Optional)"}
              rule="number"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
            />
            <div className="space-y-1">
              <label className="font-medium text-foreground">Account Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Notes / Remarks (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special agreement or credit terms..."
              className="w-full rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting} className="cursor-pointer text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !nameValid} className="cursor-pointer text-xs font-semibold">
              {submitting ? (
                <><Loader2Icon className="size-3.5 animate-spin" /><span>Saving...</span></>
              ) : (
                <span>{customer ? "Save Changes" : "Create Profile"}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
