import { useState, useEffect } from "react";
import { SearchIcon, RefreshCwIcon, UserCheckIcon, ShieldCheckIcon, ClockIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { fetchAuditLogsApi } from "@/lib/api";

const PAGE_SIZE = 10;

export function AuditTrailManager() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedModule, setSelectedModule] = useState("");

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedModule) params.module = selectedModule;

      const res = await fetchAuditLogsApi(params);
      if (res?.success) setLogs(res.data || []);
    } catch (err) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [search, selectedModule]);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE) || 1;

  return (
    <div className="w-full space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-5 text-primary" />
              <span>Activity Audit Trail</span>
            </h1>
            <Badge variant="outline" className="text-[9px] bg-primary/10 border-primary/30 font-medium py-0">
              Auto-prunes after 30 Days
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Immutable audit logs tracking system logins, user permissions, transactions, and security actions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAuditLogs}
          className="gap-1.5 cursor-pointer text-xs h-7.5 px-3 self-start sm:self-auto"
        >
          <RefreshCwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </Button>
      </div>

      <div className="bg-card p-2.5 rounded-xl border border-border/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center w-full">
          <div className="relative col-span-12 md:col-span-9">
            <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search user, action, remarks..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-7.5 w-full bg-muted/30"
            />
          </div>

          <div className="col-span-12 md:col-span-3">
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-7.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring font-medium"
            >
              <option value="">All Modules</option>
              <option value="User Management">User Management</option>
              <option value="Cash">Cash Register</option>
              <option value="Sales">POS Sales</option>
              <option value="Ledger">Khatas & Ledgers</option>
              <option value="Products">Inventory & Stock</option>
              <option value="System">System & Security</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2.5 ps-3.5">Timestamp</th>
                <th className="p-2.5">User & Role</th>
                <th className="p-2.5">Action Performed</th>
                <th className="p-2.5">Module</th>
                <th className="p-2.5 pe-3.5">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground text-xs">
                    Loading activity audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground text-xs">
                    No activity logs recorded in the past 30 days.
                  </td>
                </tr>
              ) : (
                logs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((log) => (
                  <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 ps-3.5 text-muted-foreground font-mono text-[10.5px]">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="size-3 text-muted-foreground/70" />
                        <span>{new Date(log.timestamp || log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-2.5 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <UserCheckIcon className="size-3 text-primary shrink-0" />
                        <span>{log.userName}</span>
                        <span className="text-[9.5px] text-muted-foreground uppercase font-mono">({log.userRole})</span>
                      </div>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-primary text-[11px]">{log.action}</td>
                    <td className="p-2.5">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-muted text-muted-foreground border border-border">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-2.5 pe-3.5 text-muted-foreground font-mono text-[10.5px] max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={logs.length}
          pageSize={PAGE_SIZE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
