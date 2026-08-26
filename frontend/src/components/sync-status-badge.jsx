import { useState } from "react";
import { useSync } from "@/context/sync-context";
import { Button } from "@/components/ui/button";
import { SyncManagerModal } from "@/components/sync-manager-modal";
import { CloudIcon, CloudOffIcon, RefreshCwIcon } from "lucide-react";

export function SyncStatusBadge() {
  const { isOnline, pendingCount, isSyncing, isHydrating } = useSync();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isWorking = isSyncing || isHydrating;

  let statusColor = "text-emerald-500";
  let statusTitle = "System Online - Sync Active";

  if (!isOnline) {
    statusColor = "text-destructive";
    statusTitle = "System Offline - Operations Queued Locally";
  } else if (isWorking) {
    statusColor = "text-primary";
    statusTitle = isHydrating ? "Hydrating Local Database..." : "Syncing Pending Operations...";
  } else if (pendingCount > 0) {
    statusColor = "text-amber-500";
    statusTitle = `${pendingCount} Operations Pending Sync (Click to manage)`;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer relative size-9 p-0 rounded-lg border-border/80 bg-background/50 hover:bg-muted/80 transition-all flex items-center justify-center shrink-0"
        title={statusTitle}
        aria-label={statusTitle}
      >
        {isWorking ? (
          <RefreshCwIcon className="size-4 text-primary animate-spin" />
        ) : isOnline ? (
          <CloudIcon className={`size-4 ${statusColor}`} />
        ) : (
          <CloudOffIcon className="size-4 text-destructive" />
        )}

        {pendingCount > 0 && !isWorking && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}

        {isOnline && pendingCount === 0 && !isWorking && (
          <span className="absolute bottom-1 right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
      </Button>

      <SyncManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
