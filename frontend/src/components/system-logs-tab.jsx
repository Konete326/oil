import { useState, useMemo, useEffect } from "react";
import { clearSystemLogsApi, deleteSingleSystemLogApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationControl } from "@/components/pagination-control";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Search,
  Clock,
  ShieldAlert,
  CopyCheck,
  Download,
} from "lucide-react";

const PAGE_SIZE = 10;

export function SystemLogsTab({ logs, loadingLogs, loadLogs, isAdmin, setSuccessMsg }) {
  const [searchLog, setSearchLog] = useState("");
  const [logLevelFilter, setLogLevelFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);


  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.title.toLowerCase().includes(searchLog.toLowerCase()) ||
        log.message.toLowerCase().includes(searchLog.toLowerCase()) ||
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
          `[LOG #${idx + 1}] [${log.level.toUpperCase()}] ${log.title}\nTime: ${new Date(
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
            `[LOG #${idx + 1}] [${log.level.toUpperCase()}] ${log.title}\nTime: ${new Date(
              log.createdAt
            ).toLocaleString()}\nSource: ${log.source}\nMessage: ${log.message}\nStack: ${
              log.stack || "N/A"
            }\n----------------------------------------`
        )
        .join("\n\n");
    } else {
      content = JSON.stringify(filteredLogs, null, 2);
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

  const handleDeleteSingleLog = async () => {
    if (!isAdmin || !deletingLogId) return;
    try {
      setDeleteLoading(true);
      await deleteSingleSystemLogApi(deletingLogId);
      loadLogs();
      setSuccessMsg("Log record deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
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
      setSuccessMsg("All system logs cleared successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
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
        <CardHeader className="p-4 border-b border-border/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                System Diagnostics & Error Logs
                <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30">
                  Auto-prunes after 7 Days
                </Badge>
              </CardTitle>
              <CardDescription className="text-[11px] mt-0.5">
                Real-time console errors, warnings, and system exception logs.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAllLogs}
                disabled={filteredLogs.length === 0}
                className="cursor-pointer h-8 text-xs gap-1.5"
              >
                {copiedAll ? <CopyCheck className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                <span>{copiedAll ? "Copied All" : "Copy All Logs"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadLogArchive("json")}
                disabled={filteredLogs.length === 0}
                className="cursor-pointer h-8 text-xs gap-1.5"
                title="Download logs as JSON bundle"
              >
                <Download className="size-3.5 text-primary" />
                <span>Download Archive (.JSON)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadLogArchive("txt")}
                disabled={filteredLogs.length === 0}
                className="cursor-pointer h-8 text-xs gap-1.5"
                title="Download logs as formatted TXT file"
              >
                <Download className="size-3.5 text-muted-foreground" />
                <span>Download (.TXT)</span>
              </Button>

              <Button variant="outline" size="sm" onClick={loadLogs} className="cursor-pointer h-8 text-xs gap-1.5">
                <RefreshCw className={`size-3.5 ${loadingLogs ? "animate-spin" : ""}`} /> Refresh
              </Button>

              {isAdmin && logs.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setShowClearLogsModal(true)} className="cursor-pointer h-8 text-xs gap-1.5">
                  <Trash2 className="size-3.5" /> Clear All Logs
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 overflow-x-auto">
              <Button
                variant={logLevelFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLogLevelFilter("all")}
                className="text-xs h-7 px-2.5 rounded cursor-pointer font-medium"
              >
                All ({logs.length})
              </Button>
              <Button
                variant={logLevelFilter === "error" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLogLevelFilter("error")}
                className="text-xs h-7 px-2.5 rounded cursor-pointer text-rose-500 font-medium"
              >
                Errors ({logs.filter((l) => l.level === "error").length})
              </Button>
              <Button
                variant={logLevelFilter === "warning" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLogLevelFilter("warning")}
                className="text-xs h-7 px-2.5 rounded cursor-pointer text-amber-500 font-medium"
              >
                Warnings ({logs.filter((l) => l.level === "warning").length})
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search error messages or stack..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="pl-8 text-xs h-8 bg-muted/30"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3 min-h-[300px]">
          {loadingLogs ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-xs gap-2">
              <RefreshCw className="size-4 animate-spin text-primary" /> Loading diagnostic logs...
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs gap-2 border border-dashed rounded-xl p-6">
              <Terminal className="size-8 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No Diagnostic Logs Recorded</p>
              <p className="text-[11px]">System is operating smoothly with 0 exception events.</p>
            </div>
          ) : (
            paginatedLogs.map((log) => {
              const fullLogString = `[${log.level.toUpperCase()}] ${log.title}\nTime: ${new Date(log.createdAt).toLocaleString()}\nSource: ${log.source}\nMessage: ${log.message}\nStack: ${log.stack || "N/A"}`;
              return (
                <div
                  key={log._id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                    log.level === "error"
                      ? "border-rose-500/30 bg-rose-950/10"
                      : "border-amber-500/30 bg-amber-950/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          log.level === "error"
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/30 text-[10px]"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]"
                        }
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-semibold text-foreground">{log.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                        {log.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopyLog(log._id, fullLogString)}
                        className="cursor-pointer text-muted-foreground hover:text-foreground h-7 w-7"
                        title="Copy Log Details"
                      >
                        {copiedId === log._id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                      </Button>
                      {isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeletingLogId(log._id)}
                          className="cursor-pointer text-muted-foreground hover:text-destructive h-7 w-7"
                          title="Delete Log (Admin Only)"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : (
                        <div title="Only Admin can delete logs">
                          <ShieldAlert className="size-3.5 text-muted-foreground/30 opacity-40" />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-mono bg-muted/60 p-2.5 rounded border border-border/60 break-all leading-relaxed text-foreground/90">
                    {log.message}
                  </p>

                  {log.stack && (
                    <details className="text-[11px] text-muted-foreground font-mono bg-background p-2 rounded border border-border/50">
                      <summary className="cursor-pointer text-xs font-sans text-muted-foreground hover:text-foreground font-medium">
                        View Stack Trace
                      </summary>
                      <pre className="mt-2 text-[10px] overflow-x-auto whitespace-pre-wrap text-muted-foreground/90">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </CardContent>

        <PaginationControl
          page={currentPage}
          pages={totalPages}
          total={filteredLogs.length}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>

      <ConfirmModal
        isOpen={!!deletingLogId}
        onClose={() => setDeletingLogId(null)}
        onConfirm={handleDeleteSingleLog}
        loading={deleteLoading}
        title="Delete Log Record"
        message="Are you sure you want to delete this log entry?"
        confirmText="Delete Log"
      />

      <ConfirmModal
        isOpen={showClearLogsModal}
        onClose={() => setShowClearLogsModal(false)}
        onConfirm={handleClearLogs}
        loading={deleteLoading}
        title="Clear All Diagnostic Logs"
        message="Are you sure you want to clear all system diagnostic logs? This operation cannot be undone."
        confirmText="Clear All Logs"
      />
    </>
  );
}
