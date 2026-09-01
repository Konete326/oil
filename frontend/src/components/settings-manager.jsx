import { useState, useEffect, useCallback } from "react";
import { fetchSystemLogsApi, eraseAllDataApi, eraseModuleDataApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AdminPasswordModal } from "@/components/admin-password-modal";
import { SystemLogsTab } from "@/components/system-logs-tab";
import { DataMaintenanceTab } from "@/components/data-maintenance-tab";
import { AuditTrailManager } from "@/components/audit-trail-manager";
import { LanguageSelector } from "@/components/language-selector";
import { BankAccountsTab } from "@/components/bank-accounts-tab";
import { ConfirmModal } from "@/components/confirm-modal";
import { useSync } from "@/context/sync-context";
import {
  Settings,
  Terminal,
  Database,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Landmark,
} from "lucide-react";

export function SettingsManager({ user }) {
  const [activeTab, setActiveTab] = useState("language");
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  const { isOnline, pendingCount, isSyncing, syncProgress, lastSyncTime, triggerManualSync } = useSync();

  const [securityModal, setSecurityModal] = useState({
    isOpen: false,
    type: null,
    moduleKey: null,
    title: "",
    message: "",
  });

  const isAdmin = user?.role === "admin";

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    const res = await fetchSystemLogsApi();
    if (res && res.success) {
      setLogs(res.data || []);
    }
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  const triggerEraseAllModal = () => {
    setSecurityModal({
      isOpen: true,
      type: "all",
      moduleKey: null,
      title: "Wipe All Application Data",
      message: "WARNING: This will permanently hard-delete all products, sales, ledgers, transactions, and vouchers from the database. Admin user credentials will remain intact.",
    });
  };

  const triggerEraseModuleModal = (moduleKey, moduleName) => {
    setSecurityModal({
      isOpen: true,
      type: "module",
      moduleKey,
      title: `Erase ${moduleName} Data`,
      message: `WARNING: This will permanently hard-delete all data associated with ${moduleName} from the database.`,
    });
  };

  const handleConfirmPasswordReset = async (password) => {
    if (securityModal.type === "all") {
      const res = await eraseAllDataApi(password);
      setSuccessMsg(res.message || "Full system data reset complete.");
    } else if (securityModal.type === "module") {
      const res = await eraseModuleDataApi(password, securityModal.moduleKey);
      setSuccessMsg(res.message || "Module data erased successfully.");
    }
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleExecuteSync = async () => {
    setShowSyncConfirm(false);
    const res = await triggerManualSync();
    if (res.success) {
      setSuccessMsg("Manual cloud sync completed successfully.");
    } else {
      setSuccessMsg(res.message || "Sync failed.");
    }
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="size-6 text-primary" />
            System Settings & Diagnostics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage system configurations, offline storage engine, activity audit trails, and administrative tools.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="size-4" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-border/60 pb-2 overflow-x-auto min-w-0">
        <Button
          variant={activeTab === "language" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("language")}
          className="text-xs cursor-pointer h-8 gap-2 font-medium"
        >
          <Globe className="size-3.5" /> Language & Translation
        </Button>
        <Button
          variant={activeTab === "bank-accounts" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("bank-accounts")}
          className="text-xs cursor-pointer h-8 gap-2 font-medium"
        >
          <Landmark className="size-3.5 text-primary" /> Company Bank Accounts
        </Button>
        <Button
          variant={activeTab === "sync" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("sync")}
          className="text-xs cursor-pointer h-8 gap-2 font-medium"
        >
          <RefreshCw className="size-3.5" /> Offline Storage & Sync
        </Button>
        {isAdmin && (
          <Button
            variant={activeTab === "audit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("audit")}
            className="text-xs cursor-pointer h-8 gap-2 font-medium"
          >
            <ShieldCheck className="size-3.5 text-primary" /> Activity Audit Trail
          </Button>
        )}
        <Button
          variant={activeTab === "logs" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("logs")}
          className="text-xs cursor-pointer h-8 gap-2 font-medium"
        >
          <Terminal className="size-3.5" /> System Console Logs
        </Button>
        <Button
          variant={activeTab === "maintenance" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("maintenance")}
          className="text-xs cursor-pointer h-8 gap-2 font-medium"
        >
          <Database className="size-3.5" /> Data Maintenance & Erase
        </Button>
      </div>

      {activeTab === "language" && (
        <LanguageSelector variant="full-settings" />
      )}

      {activeTab === "bank-accounts" && (
        <BankAccountsTab />
      )}

      {activeTab === "sync" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <HardDrive className="size-5 text-primary" />
                  IndexedDB Local Offline Engine & Sync Status
                </h3>
                <p className="text-xs text-muted-foreground">
                  Transactions created offline are automatically stored in browser storage and uploaded as soon as connection is re-established.
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                disabled={!isOnline || isSyncing}
                onClick={() => setShowSyncConfirm(true)}
                className="gap-2 text-xs cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync Cloud Data Now"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Connection State</span>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isOnline ? (
                    <span className="text-emerald-500 flex items-center gap-1.5">
                      <Wifi className="size-4" /> Online (Auto-Sync Ready)
                    </span>
                  ) : (
                    <span className="text-rose-500 flex items-center gap-1.5">
                      <WifiOff className="size-4" /> Offline (Local Queue Active)
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Pending Unsynced Queue</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">
                    {pendingCount} Item{pendingCount === 1 ? "" : "s"}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                      pendingCount > 0
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-emerald-500/15 text-emerald-600"
                    }`}
                  >
                    {pendingCount > 0 ? "Pending Batch" : "Fully Synchronized"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Last Sync Timestamp</span>
                <div className="font-bold text-sm text-foreground">
                  {lastSyncTime || "Continuous Auto-Sync"}
                </div>
              </div>
            </div>

            {isSyncing && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="size-4 animate-spin" />
                    Synchronizing offline records to cloud database...
                  </span>
                  <span>{syncProgress.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${syncProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <AuditTrailManager />
      )}

      {activeTab === "logs" && (
        <SystemLogsTab
          logs={logs}
          loadingLogs={loadingLogs}
          loadLogs={loadLogs}
          isAdmin={isAdmin}
          setSuccessMsg={setSuccessMsg}
        />
      )}

      {activeTab === "maintenance" && (
        <DataMaintenanceTab
          isAdmin={isAdmin}
          triggerEraseAllModal={triggerEraseAllModal}
          triggerEraseModuleModal={triggerEraseModuleModal}
        />
      )}

      <AdminPasswordModal
        isOpen={securityModal.isOpen}
        onClose={() => setSecurityModal({ isOpen: false, type: null, moduleKey: null, title: "", message: "" })}
        onConfirm={handleConfirmPasswordReset}
        title={securityModal.title}
        message={securityModal.message}
        actionLabel="Confirm Erasure"
      />

      <ConfirmModal
        isOpen={showSyncConfirm}
        onClose={() => setShowSyncConfirm(false)}
        onConfirm={handleExecuteSync}
        title="Confirm Manual Cloud Sync"
        message={`Are you sure you want to upload all ${pendingCount} pending offline records to the central server database?`}
        confirmText="Sync Now"
        variant="info"
        icon={RefreshCw}
      />
    </div>
  );
}
