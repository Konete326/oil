import { useState, useEffect } from "react";
import { HistoryIcon, SearchIcon, FilterIcon, RefreshCwIcon, UserCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAuditLogsApi } from "@/lib/api";

export function AuditTrailManager() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("");

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedModule) params.module = selectedModule;

      const res = await fetchAuditLogsApi(params);
      if (res?.success) setLogs(res.data);
    } catch (err) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [search, selectedModule]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity Audit Trail</h1>
          <p className="text-xs text-muted-foreground">Immutable audit logs for user actions, permissions, cash transactions, and accounting updates.</p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAuditLogs} className="gap-1.5 cursor-pointer text-xs">
          <RefreshCwIcon className="size-3.5" />
          <span>Refresh Logs</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search action, user, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Modules</option>
            <option value="User Management">User Management</option>
            <option value="Cash">Cash Transactions</option>
            <option value="Sales">Sales & Purchases</option>
            <option value="Ledger">Customer/Supplier Ledger</option>
            <option value="System">System</option>
          </select>

          <span className="text-muted-foreground">
            Logs Count: <strong className="font-mono text-foreground">{logs.length}</strong>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Action Performed</th>
                <th className="p-3">Module</th>
                <th className="p-3 pe-4">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Loading activity audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 ps-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <UserCheckIcon className="size-3.5 text-primary" />
                        <span>{log.userName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">({log.userRole})</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-primary">{log.action}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-3 pe-4 text-muted-foreground font-mono text-[11px]">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
