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
  HardDriveIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { getOfflineStorageEstimate, cleanupOldOfflineCache } from "@/lib/offline-db";
import { toast } from "sonner";

export function SyncManagerModal({ isOpen, onClose }) {
  const {
    isOnline,
    pendingCount,
    pendingItems,
    isSyncing,
    isHydrating,
    networkSpeed,
    networkDetails,
    lastSyncTime,
    triggerManualSync,
    hydrateAllData,
  } = useSync();

  const [actionMessage, setActionMessage] = useState(null);
  const [storageInfo, setStorageInfo] = useState({ usedMB: "0.00", quotaMB: "500", percent: 1 });
  const [isCleaning, setIsCleaning] = useState(false);

  const loadStorageStats = async () => {
    const stats = await getOfflineStorageEstimate();
    if (stats) setStorageInfo(stats);
  };

  useEffect(() => {
    if (isOpen) {
      loadStorageStats();
    }
  }, [isOpen, pendingCount, isSyncing]);

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
      await loadStorageStats();
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
      await loadStorageStats();
    } else {
      setActionMessage("Hydration failed. Check network connection.");
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleCleanCache = async () => {
    setIsCleaning(true);
    try {
      const res = await cleanupOldOfflineCache(30);
      await loadStorageStats();
      toast.success(
        res.cleanedCount > 0
          ? `Auto-cleanup complete: Removed ${res.cleanedCount} old cache records`
          : "Offline cache is already optimized & clean"
      );
    } catch {
      toast.error("Failed to clean offline cache");
    } finally {
      setIsCleaning(false);
    }
  };

  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Not yet synced";

  const getProgressColor = (pct) => {
    if (pct >= 90) return "bg-rose-500";
    if (pct >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh] sm:max-h-[80vh] my-auto">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-xl flex items-center justify-center ${
                isOnline ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-destructive/15 text-destructive"
              }`}
            >
              {isOnline ? <CloudIcon className="size-4" /> : <CloudOffIcon className="size-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                Offline & Cloud Sync Hub
              </h3>
              <p className="text-[10px] text-muted-foreground">Encrypted Local Storage & Real-time Cloud Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>

        <div className="p-3.5 space-y-2.5 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl border border-border/80 bg-muted/20 space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1 font-medium text-[10.5px]">
                {isOnline ? <WifiIcon className="size-3 text-emerald-500" /> : <WifiOffIcon className="size-3 text-destructive" />}
                Network State
              </span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className={`inline-block size-2 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                  }`}
                />
                <span className="font-semibold text-xs text-foreground font-mono">
                  {isOnline ? (networkDetails?.label || `Online (${networkSpeed})`) : "Offline Mode"}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl border border-border/80 bg-muted/20 space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1 font-medium text-[10.5px]">
                <ClockIcon className="size-3 text-primary" />
                Last Cloud Sync
              </span>
              <div className="font-semibold text-xs text-foreground pt-0.5">{formattedLastSync}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-border/80 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HardDriveIcon className="size-3.5 text-primary" />
                <span className="font-semibold text-xs text-foreground">Offline Storage & Cache Usage</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-foreground">
                {storageInfo.usedMB} MB / {storageInfo.quotaMB} MB
              </span>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/60">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(storageInfo.percent)}`}
                  style={{ width: `${storageInfo.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9.5px] text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1">
                  <ShieldCheckIcon className="size-3 text-emerald-500" />
                  <span>30-Day Auto-Cleanup Active</span>
                </span>
                <span className="font-mono font-semibold">{storageInfo.percent}% Used</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">Prune synced cache &gt;30 days</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanCache}
                disabled={isCleaning}
                className="h-6 gap-1 text-[10px] px-2 cursor-pointer border-dashed"
              >
                <SparklesIcon className={`size-2.5 text-primary ${isCleaning ? "animate-spin" : ""}`} />
                <span>{isCleaning ? "Cleaning..." : "Auto-Clean Cache"}</span>
              </Button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DatabaseIcon className="size-3.5 text-primary" />
                <span className="font-semibold text-xs text-foreground">Pending Offline Queue</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[9.5px] ${
                  pendingCount > 0
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {pendingCount} item{pendingCount === 1 ? "" : "s"}
              </span>
            </div>

            {pendingItems.length === 0 ? (
              <div className="py-2 text-center text-muted-foreground flex flex-col items-center justify-center gap-0.5">
                <CheckCircle2Icon className="size-4 text-emerald-500" />
                <span className="font-medium text-xs text-foreground">100% Synced with Cloud</span>
                <span className="text-[10px]">All offline counter transactions are safely backed up.</span>
              </div>
            ) : (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-1.5 rounded-lg bg-card border border-border/60 flex items-center justify-between text-[10.5px]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-muted text-foreground uppercase">
                        {item.type}
                      </span>
                      <span className="text-muted-foreground capitalize truncate text-[10.5px]">{item.action}</span>
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
            <div className="p-2 rounded-xl border border-primary/30 bg-primary/10 text-primary flex items-center gap-2 animate-in fade-in duration-150 text-xs">
              <AlertCircleIcon className="size-3.5 shrink-0" />
              <span className="font-medium text-[10.5px]">{actionMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 px-3.5 py-2.5 border-t border-border/80 bg-muted/20 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullHydration}
            disabled={!isOnline || isHydrating || isSyncing}
            className="cursor-pointer text-xs gap-1 h-7.5 px-2.5"
          >
            <HardDriveDownloadIcon className={`size-3 text-primary ${isHydrating ? "animate-spin" : ""}`} />
            <span>{isHydrating ? "Hydrating..." : "Pull Cloud Data"}</span>
          </Button>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer text-xs h-7.5 px-2.5">
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing || isHydrating}
              className="cursor-pointer text-xs gap-1 bg-primary text-primary-foreground font-medium h-7.5 px-3"
            >
              <RefreshCwIcon className={`size-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
