import { useState } from "react";
import { LandmarkIcon, XIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BankAccountModal({ isOpen, onClose, onAddBank }) {
  const [bankName, setBankName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bankName.trim()) return;
    onAddBank(bankName.trim());
    setBankName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <LandmarkIcon className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Add Bank Account</h3>
              <p className="text-[11px] text-muted-foreground">Register a new bank ledger account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Bank / Account Title *</label>
            <Input
              required
              autoFocus
              placeholder="e.g. Askari Bank, Faysal Bank, JS Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-7.5 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7.5 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <PlusIcon className="size-3.5" />
              <span>Add Account</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
