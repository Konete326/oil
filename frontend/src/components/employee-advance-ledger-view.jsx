import { useState, useEffect } from "react";
import {
  HandCoinsIcon,
  SearchIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  PlusIcon,
  Trash2Icon,
  CheckCircle2Icon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  UserCheckIcon,
  Building2Icon,
  CalendarIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/confirm-modal";
import { fetchEmployeeAdvanceLedgerApi, deleteEmployeeAdvanceApi } from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function EmployeeAdvanceLedgerView({ employees = [], onOpenAdvanceModal, onRefreshEmployees }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [summary, setSummary] = useState({ totalGiven: 0, totalDeducted: 0, currentBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedEmployeeId) params.employeeId = selectedEmployeeId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await fetchEmployeeAdvanceLedgerApi(params);
      if (res?.success) {
        setLedgerEntries(res.data || []);
        setSummary(res.summary || { totalGiven: 0, totalDeducted: 0, currentBalance: 0 });
      }
    } catch (err) {
      toast.error("Failed to load advance khata ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [selectedEmployeeId]);

  const handleApplyDateFilter = () => {
    loadLedger();
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setSelectedEmployeeId("");
  };

  const handleDeleteEntry = async () => {
    if (!deletingId) return;
    try {
      setDeleteLoading(true);
      const res = await deleteEmployeeAdvanceApi(deletingId);
      if (res?.success) {
        toast.success("Advance ledger entry deleted and balance restored!");
        setDeletingId(null);
        loadLedger();
        if (onRefreshEmployees) onRefreshEmployees();
      } else {
        toast.error(res?.message || "Failed to delete entry");
      }
    } catch (err) {
      toast.error("Error deleting advance entry");
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedEmpObj = employees.find((e) => e._id === selectedEmployeeId);

  const handleExportExcel = () => {
    const data = ledgerEntries.map((item, idx) => ({
      "S.No": idx + 1,
      Date: new Date(item.date).toLocaleDateString(),
      "Voucher No": item.voucherNumber,
      Employee: item.employeeName,
      Type: item.type,
      "Amount (PKR)": item.amount,
      "Running Balance (PKR)": item.runningBalance,
      "Payment Mode": item.paymentMode,
      Notes: item.notes || "-",
      "Recorded By": item.recordedBy || "Admin",
    }));
    exportTransactionsToExcel(data, `Employee_Advance_Khata_${selectedEmpObj?.name || "All_Staff"}.xlsx`);
    toast.success("Advance khata exported to Excel!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-56">
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
            >
              <option value="">-- Tamam Staff (All Employees) --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.designation}) — Khata: Rs. {(emp.advanceBalance || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs w-32 bg-background"
            />
            <span className="text-xs text-muted-foreground font-mono">se</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs w-32 bg-background"
            />
            <Button size="sm" variant="outline" onClick={handleApplyDateFilter} className="h-9 px-3 text-xs cursor-pointer">
              Filter
            </Button>
            {(selectedEmployeeId || startDate || endDate) && (
              <Button size="sm" variant="ghost" onClick={handleClearFilter} className="h-9 px-2 text-xs text-muted-foreground">
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadLedger}
            disabled={loading}
            className="gap-1.5 h-9 text-xs cursor-pointer"
          >
            <RefreshCwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="gap-1.5 h-9 text-xs cursor-pointer text-emerald-600 dark:text-emerald-400"
          >
            <FileSpreadsheetIcon className="size-3.5" />
            <span>Export Excel</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="gap-1.5 h-9 text-xs cursor-pointer"
          >
            <PrinterIcon className="size-3.5" />
            <span>Print Khata</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onOpenAdvanceModal(selectedEmployeeId)}
            className="gap-1.5 h-9 text-xs cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
          >
            <HandCoinsIcon className="size-3.5" />
            <span>Record Advance Cash</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase">
            <span>Kul Advance Diya Gaya (Total Disbursed)</span>
            <ArrowDownLeftIcon className="size-4" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            Rs. {(summary.totalGiven || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Kul Cash Advance Entries
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">
            <span>Salary Se Katoti (Recovered)</span>
            <ArrowUpRightIcon className="size-4" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-500">
            Rs. {(summary.totalDeducted || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Deducted via Monthly Payroll Vouchers
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/10 space-y-1">
          <div className="flex items-center justify-between text-primary text-xs font-semibold uppercase">
            <span>Baqaya Advance Khata (Net Balance)</span>
            <HandCoinsIcon className="size-4" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-500">
            Rs. {(summary.currentBalance || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {selectedEmpObj ? `${selectedEmpObj.name} ka baqaya advance` : "Tamam staff ka kul baqaya"}
          </p>
        </div>
      </div>

      {selectedEmpObj && (
        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              {selectedEmpObj.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">{selectedEmpObj.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {selectedEmpObj.designation} · Phone: {selectedEmpObj.phone || "N/A"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Base Salary: </span>
              <strong className="text-foreground">Rs. {selectedEmpObj.baseSalary.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Outstanding Advance: </span>
              <strong className="text-amber-500 font-bold">Rs. {(selectedEmpObj.advanceBalance || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-border bg-muted/40 font-semibold text-xs text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoinsIcon className="size-4 text-amber-500" />
            <span>Advance Khata Ledger Register</span>
          </div>
          <span className="text-muted-foreground text-[11px] font-mono">
            Total Transactions: {ledgerEntries.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="p-3 ps-4">Date</th>
                <th className="p-3">Voucher #</th>
                <th className="p-3">Employee Name</th>
                <th className="p-3">Transaction Type</th>
                <th className="p-3 text-right">Amount (PKR)</th>
                <th className="p-3 text-right">Running Balance</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3">Remarks / Reason</th>
                <th className="p-3 pe-4 text-center print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-sans">
                    Loading advance ledger transactions...
                  </td>
                </tr>
              ) : ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-sans">
                    Is employee ka koi advance transaction record nahi mila.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 ps-4 text-muted-foreground font-sans text-xs">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-bold text-foreground">{entry.voucherNumber}</td>
                    <td className="p-3 font-sans font-semibold text-foreground">{entry.employeeName}</td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-sans px-2 py-0.5 border ${
                          entry.type === "Advance Given"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {entry.type === "Advance Given" ? "+ Advance Given" : "- Salary Deduction"}
                      </Badge>
                    </td>
                    <td className={`p-3 text-right font-bold ${entry.type === "Advance Given" ? "text-amber-500" : "text-emerald-500"}`}>
                      {entry.type === "Advance Given" ? "+" : "-"} Rs. {entry.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-foreground">
                      Rs. {entry.runningBalance.toLocaleString()}
                    </td>
                    <td className="p-3 font-sans text-muted-foreground text-xs">{entry.paymentMode || "Cash"}</td>
                    <td className="p-3 font-sans text-muted-foreground text-xs max-w-xs truncate">
                      {entry.notes || "-"}
                    </td>
                    <td className="p-3 pe-4 text-center print:hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(entry._id)}
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Delete entry and adjust balance"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteEntry}
        loading={deleteLoading}
        title="Delete Advance Khata Entry"
        message="Kya aap waqai is advance entry ko delete karna chahte hain? Delete karne par employee ka advance balance khud-bakhud adjust ho jayega."
      />
    </div>
  );
}
