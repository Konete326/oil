import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { WifiOff, Globe, AlertTriangle, X } from "lucide-react";

export function LanguageOfflineModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape" || e.key === "Enter") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === "undefined") return null;

  const modalContent = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <WifiOff className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              Internet Connection Required
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Language switching is only available when you are connected to the internet. Please check your network connection and try again.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Globe className="size-4 text-primary shrink-0" />
            <span>Why is internet required?</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Your selected language preferences are verified and synced with cloud account settings across all authorized devices in real time.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="cursor-pointer text-xs font-medium px-4"
          >
            Understood
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
