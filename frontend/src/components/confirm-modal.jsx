import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, LogOutIcon, Trash2Icon } from "lucide-react";

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  variant = "destructive",
  icon: CustomIcon,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || loading) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose, onConfirm]);

  if (!isOpen || typeof window === "undefined") return null;

  const IconComponent = CustomIcon || (variant === "logout" ? LogOutIcon : AlertTriangleIcon);
  const iconBg = variant === "logout" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-destructive/15 text-destructive";
  const btnVariant = variant === "logout" ? "default" : variant === "destructive" ? "destructive" : "default";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <IconComponent className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="cursor-pointer text-xs">
            {cancelText}
          </Button>
          <Button
            variant={btnVariant}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer font-medium text-xs"
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}


