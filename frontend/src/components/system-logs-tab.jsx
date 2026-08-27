import { useState, useMemo, useEffect } from "react";
import { clearSystemLogsApi, deleteSingleSystemLogApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationControl } from "@/components/pagination-control";
import { ConfirmModal } from "@/components/confirm-modal";
import { CloudLoader } from "@/components/ui/cloud-loader";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Search,
  Clock,
  CopyCheck,
  Download,
  ChevronDown,
  FileCode,
  FileText,
} from "lucide-react";

const PAGE_SIZE = 10;

export function SystemLogsTab({ logs = [], loadingLogs, loadLogs, isAdmin, setSuccessMsg }) {
  const [searchLog, setSearchLog] = useState("");
  const [logLevelFilter, setLogLevelFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredLogs = useMemo(() => {
    return (logs || []).filter((log) => {
      const matchesSearch =
        (log.title || "").toLowerCase().includes(searchLog.toLowerCase()) ||
        (log.message || "").toLowerCase().includes(searchLog.toLowerCase()) ||
        (log.stack && log.stack.toLowerCase().includes(searchLog.toLowerCase()));

      if (!matchesSearch) return false;
      if (logLevelFilter === "error") return log.level === "error";
      if (logLevelFilter === "warning") return log.level === "warning";
      return true;
    });
  }, [logs, searchLog, logLevelFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchLog, logLevelFilter]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  const handleCopyLog = (id, logText) => {
    navigator.clipboard.writeText(logText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllLogs = () => {
    if (filteredLogs.length === 0) return;
    const formatted = filteredLogs
      .map(
        (log, idx) =>
          `[LOG #${idx + 1}] [${(log.level || "ERROR").toUpperCase()}] ${log.title}\nTime: ${new Date(
            log.createdAt
          ).toLocaleString()}\nSource: ${log.source}\nMessage: ${log.message}\nStack: ${
            log.stack || "N/A"
          }\n----------------------------------------`
      )
      .join("\n\n");

    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadLogArchive = (format = "json") => {
    if (filteredLogs.length === 0) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let content = "";
    let mimeType = "application/json";
    let extension = "json";

    if (format === "txt") {
      mimeType = "text/plain";
      extension = "txt";
      content = filteredLogs
        .map(
          (log, idx) =>
            `[LOG #${idx + 1}] [${(log.level || "ERROR").toUpperCase()}] ${log.title}\nTime: ${new Date(
              log.createdAt
            ).toLocaleString()}\nSource: ${log.source}\nMessage: ${log.message}\nStack: ${
              log.stack || "N/A"
            }\n----------------------------------------`
        )
        .join("\n\n");
    } else {
      content = JSON.stringify(
        {
          appName: "Al Khaleej Lubricants",
          archiveDate: new Date().toISOString(),
          totalLogs: filteredLogs.length,
          logs: filteredLogs,
        },
        null,
        2
      );
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-archive-${timestamp}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteSingle = async () => {
    if (!isAdmin || !deletingLogId) return;
    try {
      setDeleteLoading(true);
      await deleteSingleSystemLogApi(deletingLogId);
      loadLogs();
      setSuccessMsg?.("Log record deleted.");
      setTimeout(() => setSuccessMsg?.(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingLogId(null);
      setDeleteLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!isAdmin) return;
    try {
      setDeleteLoading(true);
      await clearSystemLogsApi();
      loadLogs();
      setSuccessMsg?.("All system logs cleared successfully.");
      setTimeout(() => setSuccessMsg?.(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setShowClearLogsModal(false);
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Card className="border-border shadow-xs bg-card">
        <CardHeader className="p-3 sm:p-3.5 border-b border-border/40 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Terminal className="size-4 text-primary" />
                <span>System Diagnostics & Error Logs</span>
                <Badge variant="outline" className="text-[9px] bg-primary/10 border-primary/30 font-medium py-0">
                  Auto-prunes after 7 Days
                </Badge>
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5">
                Real-time console errors, warnings, and system exception logs.
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                className="cursor-pointer h-7 text-xs gap-1 px-2.5"
              >
                <RefreshCw className={`size-3 ${loadingLogs ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filteredLogs.length === 0}
                    className="cursor-pointer h-7 text-xs gap-1 px-2.5"
                  >
                    <Download className="size-3 text-primary" />
                    <span>Export & Tools</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-xs">
                  <DropdownMenuItem
                    onClick={handleCopyAllLogs}
                    className="cursor-pointer gap-2 py-1.5 text-xs font-medium"
                  >
                    {copiedAll ? (
                      <CopyCheck className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5 text-muted-foreground" />
                    )}
                    <span>{copiedAll ? "Copied to Clipboard!" : "Copy All Logs"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDownloadLogArchive("json")}
                    className="cursor-pointer gap-2 py-1.5 text-xs"
                  >
                    <FileCode className="size-3.5 text-primary" />
                    <span>Download JSON (.json)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDownloadLogArchive("txt")}
                    className="cursor-pointer gap-2 py-1.5 text-xs"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>Download Text (.txt)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isAdmin && logs.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowClearLogsModal(true)}
                  className="cursor-pointer h-7 text-xs gap-1 px-2.5"
                >
                  <Trash2 className="size-3" />
                  <span>Clear All</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1 overflow-x-auto">
              <Button
                variant={logLevelFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLogLevelFilter("all")}
                className="text-[11px] h-6 px-2 rounded cursor-pointer font-medium"
              >
                All ({logs.length})
              </Button>
              <Button
                variant={logLevelFilter === "error" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLogLevelFilter("error")}
                className="text-[11px] h-6 px-2 rounded cursor-pointer text-rose-500 font-medium"
              >
                Errors ({logs.filter((l) => l.level === "error").length})
              </Button>
              <Button
                variant={logLevelFilter === "warning" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLogLevelFilter("warning")}
                className="text-[11px] h-6 px-2 rounded cursor-pointer text-amber-500 font-medium"
              >
                Warnings ({logs.filter((l) => l.level === "warning").length})
              </Button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 size-3 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="pl-7.5 text-xs h-7 bg-muted/30"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 space-y-2">
          {loadingLogs ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <CloudLoader size="sm" />
              <p className="text-[11px]">Loading diagnostics logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
              <Terminal className="size-6 opacity-30 text-emerald-500" />
              <p className="text-xs font-semibold text-foreground">System Health Normal</p>
              <p className="text-[11px]">No errors or system warnings found in the active log registry.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedLogs.map((log) => {
                const fullLogString = `[${(log.level || "ERROR").toUpperCase()}] ${log.title}\nTime: ${new Date(
                  log.createdAt
                ).toLocaleString()}\nSource: ${log.source}\nMessage: ${log.message}\nStack: ${log.stack || "N/A"}`;

                const isError = log.level === "error";

                return (
                  <div
                    key={log._id}
                    className="p-2.5 rounded-lg border border-border/80 bg-muted/20 space-y-1.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant={isError ? "destructive" : "warning"}
                            className="text-[9px] uppercase font-bold px-1.5 py-0"
                          >
                            {log.level || "error"}
                          </Badge>
                          <span className="font-semibold text-xs text-foreground">{log.title}</span>
                          <span className="text-[9px] text-muted-foreground font-mono bg-muted/60 px-1 py-0.2 rounded">
                            {log.source || "frontend"}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/90 font-mono break-all leading-tight">{log.message}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCopyLog(log._id, fullLogString)}
                          title="Copy full trace"
                          className="cursor-pointer size-6"
                        >
                          {copiedId === log._id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3 text-muted-foreground" />
                          )}
                        </Button>

                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeletingLogId(log._id)}
                            title="Delete this record"
                            className="cursor-pointer size-6 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {log.stack && (
                      <div className="p-2 rounded-md bg-black/80 text-zinc-300 font-mono text-[9px] leading-relaxed overflow-x-auto max-h-20 border border-border/40">
                        <pre className="whitespace-pre-wrap break-words">{log.stack}</pre>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9.5px] text-muted-foreground pt-0.5 border-t border-border/40">
                      <div className="flex items-center gap-1">
                        <Clock className="size-2.5" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>User: {log.userName || "System"}</span>
                        <span>•</span>
                        <span>Role: {log.userRole || "Admin"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredLogs.length}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={!!deletingLogId}
        onClose={() => setDeletingLogId(null)}
        onConfirm={handleDeleteSingle}
        title="Delete System Log Record"
        description="Are you sure you want to permanently delete this individual error log entry?"
        confirmText="Delete Record"
        confirmVariant="destructive"
        loading={deleteLoading}
      />

      <ConfirmModal
        isOpen={showClearLogsModal}
        onClose={() => setShowClearLogsModal(false)}
        onConfirm={handleClearLogs}
        title="Purge All System Logs"
        description="This will permanently delete all recorded console, runtime, and network error logs from database storage. This action cannot be undone."
        confirmText="Purge All Logs"
        confirmVariant="destructive"
        loading={deleteLoading}
      />
    </>
  );
}
