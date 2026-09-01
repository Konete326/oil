import { useState, useEffect } from "react";
import {
  SearchIcon,
  BookOpenIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  CalendarIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchDetailedPartyLedgerApi, fetchMills, fetchSuppliersApi } from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { COMPANY_CONFIG } from "@/lib/company-config";

const PAGE_SIZE = 4;

export function PartyLedgerReportView() {
  const [partyType, setPartyType] = useState("Customer");
  const [partyName, setPartyName] = useState("");
  const [partiesList, setPartiesList] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    async function loadParties() {
      try {
        if (partyType === "Customer") {
          const res = await fetchMills();
          const items = res?.data || res || [];
          const names = items.map((m) => m.name).filter(Boolean);
          setPartiesList(names);
          if (names.length > 0) setPartyName(names[0]);
        } else {
          const res = await fetchSuppliersApi();
          const items = res?.data || res || [];
          const names = items.map((s) => s.name).filter(Boolean);
          setPartiesList(names);
          if (names.length > 0) setPartyName(names[0]);
        }
      } catch (err) {
        console.error("Error loading parties list", err);
      }
    }
    loadParties();
  }, [partyType]);

  const handleDateFilterChange = (type) => {
    setDateFilter(type);
    const now = new Date();
    if (type === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  useEffect(() => {
    if (!partyName) return;

    let isMounted = true;
    async function fetchLedger() {
      setLoading(true);
      try {
        const res = await fetchDetailedPartyLedgerApi({
          partyName,
          partyType,
          startDate,
          endDate,
        });
        if (!isMounted) return;
        const entries = res?.data || res?.ledger || res || [];
        setLedgerData(Array.isArray(entries) ? entries : []);
        setPage(1);
      } catch (err) {
        if (isMounted) toast.error("Failed to load party ledger data");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLedger();
    return () => {
      isMounted = false;
    };
  }, [partyName, partyType, startDate, endDate]);

  let runningBalance = 0;
  const processedRows = ledgerData.map((row) => {
    const isDebit =
      row.type === "debit" ||
      row.transactionType?.toLowerCase().includes("debit") ||
      (row.debit && row.debit > 0);
    const debit = isDebit ? Number(row.amount || row.debit || 0) : 0;
    const credit = !isDebit ? Number(row.amount || row.credit || 0) : 0;
    runningBalance += debit - credit;

    return {
      ...row,
      dateFormatted: new Date(row.createdAt || row.date || Date.now()).toLocaleDateString("en-GB"),
      docNo:
        row.referenceNo ||
        row.voucherNumber ||
        row.saleNumber ||
        row.purchaseNumber ||
        row._id?.slice(-6) ||
        "-",
      debit,
      credit,
      balance: runningBalance,
    };
  });

  const totalDebit = processedRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = processedRows.reduce((sum, r) => sum + r.credit, 0);
  const closingBalance = runningBalance;

  const handleExportExcel = () => {
    if (processedRows.length === 0) {
      toast.error("No ledger rows to export");
      return;
    }

    const data = processedRows.map((r, idx) => ({
      "Sr #": idx + 1,
      Date: r.dateFormatted,
      "Document #": r.docNo,
      "Description / Particulars": r.description || r.notes || "-",
      "Debit (PKR)": r.debit,
      "Credit (PKR)": r.credit,
      "Running Balance (PKR)": r.balance,
    }));

    exportTransactionsToExcel(data, `${partyName}_Detailed_Ledger.xlsx`);
    toast.success("Party ledger exported to Excel!");
  };

  const paginatedRows = processedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border/60 text-xs">
            <button
              onClick={() => setPartyType("Customer")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                partyType === "Customer"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer / Mill
            </button>
            <button
              onClick={() => setPartyType("Supplier")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                partyType === "Supplier"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Supplier / Refinery
            </button>
          </div>

          <div className="relative flex items-center min-w-[220px]">
            <SearchIcon className="size-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              list="party-datalist"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder={`Search or type ${partyType}...`}
              className="h-9 w-full rounded-md border border-input bg-background ps-8 pe-3 text-xs text-foreground font-semibold placeholder:font-normal focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
            <datalist id="party-datalist">
              {partiesList.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {loading && (
              <Loader2Icon className="size-3.5 animate-spin text-primary absolute right-2.5 shrink-0" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border/60">
            <button
              onClick={() => handleDateFilterChange("today")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                dateFilter === "today"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateFilterChange("month")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                dateFilter === "month"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleDateFilterChange("all")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                dateFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Time
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleExportExcel}
              className="size-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              title="Export to Excel"
            >
              <FileSpreadsheetIcon className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setIsPrintModalOpen(true)}
              className="size-8 text-primary hover:bg-primary/10 cursor-pointer"
              title="Print Statement"
            >
              <PrinterIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Debits</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            Rs. {totalDebit.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Billed / Payments Paid</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Credits</span>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            Rs. {totalCredit.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Payments Received / Purchases</p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Closing Running Balance</span>
          <div className="text-xl font-bold font-mono text-primary">
            Rs. {closingBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Current Net Balance</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-border bg-muted/30 font-semibold text-xs text-foreground flex items-center justify-between">
          <span className="truncate">{partyName} — Detailed Khata Ledger</span>
          <span className="text-muted-foreground font-mono text-[11px] shrink-0">
            {processedRows.length} Total Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2.5 ps-3.5">Date</th>
                <th className="p-2.5">Particulars / Transaction Type</th>
                <th className="p-2.5 text-right">Debit (PKR)</th>
                <th className="p-2.5 text-right">Credit (PKR)</th>
                <th className="p-2.5 text-right">Running Balance (PKR)</th>
                <th className="p-2.5">Payment Mode</th>
                <th className="p-2.5 pe-3.5">Ref No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Loader2Icon className="size-5 animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading party transactions...</span>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                    No ledger entries found for {partyName}.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 ps-3.5 font-mono text-muted-foreground text-[11px]">
                      {row.dateFormatted}
                    </td>
                    <td className="p-2.5 font-medium text-foreground">
                      {row.description || row.transactionType || "Ledger Entry"}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-foreground">
                      Rs. {row.balance.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-muted-foreground text-[11px]">
                      {row.paymentMode || "Cash"}
                    </td>
                    <td className="p-2.5 pe-3.5 font-mono text-muted-foreground text-[10.5px]">
                      {row.docNo}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={page}
          totalPages={Math.ceil(processedRows.length / PAGE_SIZE) || 1}
          totalItems={processedRows.length}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      <CustomerPrintStatement
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        customer={{ name: partyName }}
        transactions={ledgerData}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
