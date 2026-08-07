import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockIcon, ShieldAlertIcon, Loader2Icon } from "lucide-react";

export function AdminPasswordModal({ isOpen, onClose, onConfirm, title, message, actionLabel = "Confirm Erasure" }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your administrator password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onConfirm(password);
      setPassword("");
      onClose();
    } catch (err) {
      setError(err.message || "Invalid admin password. Action aborted.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-destructive/10 text-destructive shrink-0 mt-0.5">
            <ShieldAlertIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">{title || "Security Verification Required"}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {message || "This is a sensitive administrative action. Enter your account password to confirm."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <LockIcon className="size-3.5 text-muted-foreground" />
              Administrator Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="text-xs h-9 bg-background/80"
              autoFocus
            />
            {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleModalClose}
              disabled={loading}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={loading}
              className="text-xs cursor-pointer gap-1.5"
            >
              {loading && <Loader2Icon className="size-3.5 animate-spin" />}
              {actionLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
