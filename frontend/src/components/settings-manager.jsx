import { useState, useEffect, useCallback } from "react";
import { fetchSystemLogsApi, eraseAllDataApi, eraseModuleDataApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AdminPasswordModal } from "@/components/admin-password-modal";
import { SystemLogsTab } from "@/components/system-logs-tab";
import { DataMaintenanceTab } from "@/components/data-maintenance-tab";
import {
  Settings,
  Terminal,
  Database,
  Clock,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export function SettingsManager({ user }) {
  const [activeTab, setActiveTab] = useState("logs");
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="size-6 text-primary" />
            System Settings & Diagnostics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time error logs, system diagnostics, and administrative data maintenance.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="size-4" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Terminal className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Logged Diagnostics</p>
            <p className="text-xl font-bold text-foreground">{logs.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">System Health</p>
            <p className="text-base font-bold text-foreground">Active & Monitored</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-500">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Log Retention</p>
            <p className="text-base font-bold text-foreground">7 Days Retention</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
            <Database className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Data Security</p>
            <p className="text-base font-bold text-foreground">Admin Controlled</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
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
    </div>
  );
}
