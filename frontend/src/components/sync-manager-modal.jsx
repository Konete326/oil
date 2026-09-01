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
      setActionMessage("All local operations synced!");
      await loadStorageStats();
    } else {
      setActionMessage(res?.message || "Sync failed. Check network.");
    }
    setTimeout(() => setActionMessage(null), 2500);
  };

  const handleFullHydration = async () => {
    setActionMessage("Refreshing local database...");
    const success = await hydrateAllData();
    if (success) {
      setActionMessage("Local database refreshed!");
      await loadStorageStats();
    } else {
      setActionMessage("Hydration failed. Check network.");
    }
    setTimeout(() => setActionMessage(null), 2500);
  };

  const handleCleanCache = async () => {
    setIsCleaning(true);
    try {
      const res = await cleanupOldOfflineCache(30);
      await loadStorageStats();
      toast.success(
        res.cleanedCount > 0
          ? `Cleaned ${res.cleanedCount} old cache records`
          : "Cache is already clean"
      );
    } catch {
      toast.error("Failed to clean cache");
    } finally {
      setIsCleaning(false);
    }
  };

  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Not yet";

  const liveSpeedDisplay = isOnline
    ? (networkDetails?.speedText || networkDetails?.label || "Online")
    : "Offline";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col my-auto">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded-lg flex items-center justify-center ${
                isOnline ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-destructive/15 text-destructive"
              }`}
            >
              {isOnline ? <CloudIcon className="size-3.5" /> : <CloudOffIcon className="size-3.5" />}
            </div>
            <div>
              <h3 className="font-semibold text-xs text-foreground">Sync &amp; Network Hub</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>

        <div className="p-3 space-y-2 text-xs overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl border border-border/80 bg-muted/20 flex flex-col justify-between">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                {isOnline ? <WifiIcon className="size-3 text-emerald-500" /> : <WifiOffIcon className="size-3 text-destructive" />}
                Net Speed
              </span>
              <div className="flex items-center gap-1.5 pt-1">
                <span
                  className={`size-1.5 rounded-full shrink-0 ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                  }`}
                />
                <span className="font-mono font-bold text-xs text-foreground truncate">
                  {liveSpeedDisplay}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl border border-border/80 bg-muted/20 flex flex-col justify-between">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                <ClockIcon className="size-3 text-primary" />
                Last Sync
              </span>
              <div className="font-mono font-semibold text-xs text-foreground pt-1 truncate">
                {formattedLastSync}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HardDriveIcon className="size-3 text-primary" />
                <span className="font-medium text-[11px] text-foreground">Offline Storage</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {storageInfo.usedMB} / {storageInfo.quotaMB} MB
              </span>
            </div>

            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border/40">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.max(1, storageInfo.percent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[9.5px] text-muted-foreground font-mono">{storageInfo.percent}% Used</span>
              <button
                type="button"
                onClick={handleCleanCache}
                disabled={isCleaning}
                className="text-[9.5px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <SparklesIcon className="size-2.5" />
                <span>{isCleaning ? "Cleaning..." : "Clean Cache"}</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-border bg-muted/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DatabaseIcon className="size-3 text-primary" />
                <span className="font-medium text-[11px] text-foreground">Offline Queue</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold ${
                  pendingCount > 0
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {pendingCount}
              </span>
            </div>

            {pendingItems.length === 0 ? (
              <div className="py-1.5 text-center text-muted-foreground flex items-center justify-center gap-1 text-[10.5px]">
                <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                <span>100% Synced with Cloud</span>
              </div>
            ) : (
              <div className="space-y-1 max-h-20 overflow-y-auto pr-0.5">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-1 rounded-md bg-card border border-border/50 flex items-center justify-between text-[10px]"
                  >
                    <span className="font-mono text-muted-foreground uppercase text-[9px]">{item.type}</span>
                    <span className="text-foreground capitalize">{item.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {actionMessage && (
            <div className="p-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary flex items-center gap-1.5 text-[10.5px]">
              <AlertCircleIcon className="size-3 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 px-3 py-2 border-t border-border/80 bg-muted/20 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullHydration}
            disabled={!isOnline || isHydrating || isSyncing}
            className="cursor-pointer text-[11px] gap-1 h-7 px-2"
          >
            <HardDriveDownloadIcon className={`size-3 text-primary ${isHydrating ? "animate-spin" : ""}`} />
            <span>{isHydrating ? "Pulling..." : "Pull Cloud Data"}</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer text-[11px] h-7 px-2">
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing || isHydrating}
              className="cursor-pointer text-[11px] gap-1 bg-primary text-primary-foreground font-medium h-7 px-2.5"
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
