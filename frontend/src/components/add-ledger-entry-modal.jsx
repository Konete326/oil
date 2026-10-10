import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addLedgerEntryApi } from "@/lib/api";
import { XIcon, PlusIcon, FileTextIcon, CreditCardIcon, HashIcon } from "lucide-react";

export function AddLedgerEntryModal({ open, onOpenChange, millId, customerId, clientName, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    transactionType: "Debit",
    amount: "",
    paymentMode: "Cash",
    referenceNumber: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        millId,
        customerId,
        clientName,
        createdAt: new Date(formData.date).toISOString(),
        transactionType: formData.transactionType,
        amount: Number(formData.amount),
        paymentMode: formData.paymentMode,
        referenceNumber: formData.referenceNumber,
        notes: formData.notes
      };

      await addLedgerEntryApi(payload);
      toast.success("Khata entry added successfully");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Failed to add entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-card border shadow-xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <PlusIcon className="size-4" />
            </div>
            <h2 className="text-base font-bold text-foreground">Add Khata Entry</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="size-8 rounded-full">
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <FileTextIcon className="size-3.5 text-muted-foreground" />
                  Date
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-10 text-base"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <FileTextIcon className="size-3.5 text-muted-foreground" />
                  Type
                </label>
                <select
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <HashIcon className="size-3.5 text-muted-foreground" />
                Amount (Rs)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="h-10 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CreditCardIcon className="size-3.5 text-muted-foreground" />
                  Payment Mode
                </label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <HashIcon className="size-3.5 text-muted-foreground" />
                  Ref Number
                </label>
                <Input
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="Optional"
                  className="h-10 text-base"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <FileTextIcon className="size-3.5 text-muted-foreground" />
                Notes / Details
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter details about this entry..."
                rows={3}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Entry"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
