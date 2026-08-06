import { Button } from "@/components/ui/button";
import { AlertTriangleIcon } from "lucide-react";

export function ConfirmModal({ isOpen, onClose, onConfirm, title = "Confirm Deletion", message = "Are you sure you want to delete this item? This action cannot be undone.", confirmText = "Delete", loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertTriangleIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer font-medium"
          >
            {loading ? "Deleting..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
