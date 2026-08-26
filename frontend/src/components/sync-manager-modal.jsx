import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useSync } from "@/context/sync-context";
import {
  CloudIcon,
  CloudOffIcon,
  RefreshCwIcon,
  DatabaseIcon,
  WifiIcon,
  WifiOffIcon,
  CheckCircle2Icon,
  ClockIcon,
  XIcon,
  HardDriveDownloadIcon,
  AlertCircleIcon,
} from "lucide-react";

export function SyncManagerModal({ isOpen, onClose }) {
  const {
    isOnline,
    pendingCount,
    pendingItems,
    isSyncing,
    isHydrating,
    networkSpeed,
    lastSyncTime,
    triggerManualSync,
    hydrateAllData,
  } = useSync();

  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === "undefined") return null;

  const handleManualSync = async () => {
    setActionMessage("Syncing queued operations to cloud...");
    const res = await triggerManualSync();
    if (res && res.success) {
      setActionMessage("All local operations successfully synced to cloud!");
    } else {
      setActionMessage(res?.message || "Sync failed. Check network.");
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleFullHydration = async () => {
    setActionMessage("Downloading latest cloud data into local storage...");
    const success = await hydrateAllData();
    if (success) {
      setActionMessage("Local database successfully refreshed with cloud data!");
    } else {
      setActionMessage("Hydration failed. Check network connection.");
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Not yet synced";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh] sm:max-h-[75vh] my-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-xl flex items-center justify-center ${
                isOnline ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-destructive/15 text-destructive"
              }`}
            >
              {isOnline ? <CloudIcon className="size-4" /> : <CloudOffIcon className="size-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                Offline & Cloud Sync Hub
              </h3>
              <p className="text-[10px] text-muted-foreground">Local Storage & Cloud Database Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium text-[11px]">
                {isOnline ? <WifiIcon className="size-3 text-emerald-500" /> : <WifiOffIcon className="size-3 text-destructive" />}
                Network State
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block size-2 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                  }`}
                />
                <span className="font-semibold text-xs capitalize text-foreground">
                  {isOnline ? `Online (${networkSpeed})` : "Offline Mode"}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium text-[11px]">
                <ClockIcon className="size-3 text-primary" />
                Last Synced
              </span>
              <div className="font-semibold text-xs text-foreground">{formattedLastSync}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DatabaseIcon className="size-3.5 text-primary" />
                <span className="font-semibold text-xs text-foreground">Pending Offline Queue</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                  pendingCount > 0
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {pendingCount} item{pendingCount === 1 ? "" : "s"}
              </span>
            </div>

            {pendingItems.length === 0 ? (
              <div className="py-2.5 text-center text-muted-foreground flex flex-col items-center justify-center gap-1">
                <CheckCircle2Icon className="size-5 text-emerald-500" />
                <span className="font-medium text-xs text-foreground">Everything is 100% Up to Date</span>
                <span className="text-[10px]">All local transactions are saved on cloud.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-1.5 rounded-lg bg-card border border-border/60 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-muted text-foreground uppercase">
                        {item.type}
                      </span>
                      <span className="text-muted-foreground capitalize truncate text-[11px]">{item.action}</span>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {actionMessage && (
            <div className="p-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary flex items-center gap-2 animate-in fade-in duration-150 text-xs">
              <AlertCircleIcon className="size-3.5 shrink-0" />
              <span className="font-medium text-[11px]">{actionMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border/80 bg-muted/20 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullHydration}
            disabled={!isOnline || isHydrating || isSyncing}
            className="cursor-pointer text-xs gap-1.5 h-8"
          >
            <HardDriveDownloadIcon className={`size-3.5 ${isHydrating ? "animate-spin" : ""}`} />
            <span>{isHydrating ? "Hydrating..." : "Pull Cloud Data"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer text-xs h-8">
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing || isHydrating}
              className="cursor-pointer text-xs gap-1.5 bg-primary text-primary-foreground font-medium h-8"
            >
              <RefreshCwIcon className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
