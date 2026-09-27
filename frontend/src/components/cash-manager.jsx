import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  SearchIcon,
  PrinterIcon,
  Trash2Icon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  CalendarIcon,
  FileSpreadsheetIcon,
  Building2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CashTransactionModal } from "@/components/cash-transaction-modal";
import { CashPartyReport } from "@/components/cash-party-report";
import { CashPrintStatementModal } from "@/components/cash-print-statement-modal";
import { BankKhataRegisterView } from "@/components/bank-khata-register-view";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  fetchCashTransactionsApi,
  fetchPartyCashSummaryApi,
  deleteCashTransactionApi,
} from "@/lib/api";
import {
  exportTransactionsToExcel,
  exportPartySummaryToExcel,
} from "@/lib/cash-export-utils";

const PAGE_SIZE = 10;

export function CashManager() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get("tab");
    return t || (location.state?.tab || "bank");
  });
  const [transactions, setTransactions] = useState([]);
  const [partySummaries, setPartySummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entryTypeFilter, setEntryTypeFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState("Paid");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openModal) {
      setModalInitialType(location.state.initialType || "Received");
      setIsModalOpen(true);
    }
  }, [location.state]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (entryTypeFilter === "paid") params.type = "Paid";
      if (entryTypeFilter === "received") params.type = "Received";
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (paymentMode) params.paymentMode = paymentMode;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [txRes, partyRes] = await Promise.all([
        fetchCashTransactionsApi(params),
        fetchPartyCashSummaryApi(),
      ]);

      if (txRes?.success && Array.isArray(txRes.data)) setTransactions(txRes.data);
      if (partyRes?.success && Array.isArray(partyRes.data)) setPartySummaries(partyRes.data);
    } catch {
      toast.error("Failed to load cash records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "bank") {
      loadData();
    }
  }, [activeTab, entryTypeFilter, startDate, endDate, selectedCategory, paymentMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenModal = (type) => {
    setModalInitialType(type);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setDeleteLoading(true);
      await deleteCashTransactionApi(deletingId);
      toast.success("Cash transaction entry deleted!");
      setDeletingId(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Delete operation failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPaid = transactions
    .filter((t) => t.type === "Paid")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalReceived = transactions
    .filter((t) => t.type === "Received")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netCashFlow = totalReceived - totalPaid;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2Icon className="size-5 text-primary" />
            <span>Bank & Cash Khata</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your daily cash in-out, bank accounts, and party recovery ledgers.
          </p>
        </div>

        {activeTab === "cash" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleOpenModal("Paid")}
              className="h-8 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer text-xs font-semibold px-3 shadow-2xs"
            >
              <ArrowUpRightIcon className="size-3.5" />
              <span>Record Payment (Paid)</span>
            </Button>

            <Button
              size="sm"
              onClick={() => handleOpenModal("Received")}
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer text-xs font-semibold px-3 shadow-2xs"
            >
              <ArrowDownLeftIcon className="size-3.5" />
              <span>Record Receipt (Received)</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-1">
        <div className="flex items-center gap-1.5">
          {[
            { id: "bank", label: "Bank Register" },
            { id: "cash", label: "Daily Cash Log" },
            { id: "party", label: "Party Ledger Summary" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams(tab.id === "bank" ? {} : { tab: tab.id });
              }}
              className={`py-1.5 px-3.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== "bank" && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "party") {
                  exportPartySummaryToExcel(partySummaries);
                } else {
                  exportTransactionsToExcel(transactions);
                }
                toast.success("Excel report exported successfully!");
              }}
              className="h-7.5 items-center gap-1.5 text-xs px-2.5 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
              <span>Export Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(true)}
              className="h-7.5 items-center gap-1.5 text-xs px-2.5 cursor-pointer"
            >
              <PrinterIcon className="size-3.5 text-primary" />
              <span>Print A4</span>
            </Button>
          </div>
        )}
      </div>

      {activeTab === "bank" ? (
        <BankKhataRegisterView />
      ) : activeTab === "party" ? (
        <CashPartyReport partySummaries={partySummaries} loading={loading} />
      ) : (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Total Cash Paid Out</p>
                <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                  Rs. {totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <ArrowUpRightIcon className="size-4" />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Total Cash Received</p>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  Rs. {totalReceived.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ArrowDownLeftIcon className="size-4" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Net Cash Flow</p>
                <p className={`text-lg font-bold font-mono ${netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>
                  Rs. {netCashFlow.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Building2Icon className="size-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/80 text-xs">
              <button
                onClick={() => setEntryTypeFilter("all")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                  entryTypeFilter === "all" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Entries ({transactions.length})
              </button>
              <button
                onClick={() => setEntryTypeFilter("paid")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                  entryTypeFilter === "paid" ? "bg-background text-rose-500 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Paid (Outflow)
              </button>
              <button
                onClick={() => setEntryTypeFilter("received")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                  entryTypeFilter === "received" ? "bg-background text-emerald-500 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Received (Inflow)
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search party, ref no, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-8 text-xs h-8 bg-muted/30"
              />
            </form>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground uppercase text-[10.5px] tracking-wider">
                  <tr>
                    <th className="p-2.5 ps-3.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Party / Customer</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5">Mode</th>
                    <th className="p-2.5">Reference</th>
                    <th className="p-2.5">Notes</th>
                    <th className="p-2.5 pe-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-muted-foreground">
                        Loading cash transactions...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-muted-foreground">
                        No cash transactions recorded for this filter.
                      </td>
                    </tr>
                  ) : (
                    transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((tx) => (
                      <tr key={tx._id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-2.5 ps-3.5 text-muted-foreground text-[11px] font-mono whitespace-nowrap">
                          {new Date(tx.transactionDate || tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${
                              tx.type === "Paid"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {tx.type === "Paid" ? <ArrowUpRightIcon className="size-2.5" /> : <ArrowDownLeftIcon className="size-2.5" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold text-foreground">{tx.partyName || tx.party || "-"}</td>
                        <td className="p-2.5 text-muted-foreground">{tx.category || "General"}</td>
                        <td
                          className={`p-2.5 text-right font-mono font-bold text-xs ${
                            tx.type === "Paid" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          Rs. {(tx.amount || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-muted-foreground">{tx.paymentMode || "Cash"}</td>
                        <td className="p-2.5 text-muted-foreground font-mono text-[11px]">{tx.referenceNo || "-"}</td>
                        <td className="p-2.5 text-muted-foreground max-w-[200px] truncate">{tx.notes || "-"}</td>
                        <td className="p-2.5 pe-3.5 text-center">
                          <button
                            onClick={() => setDeletingId(tx._id)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2Icon className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={Math.ceil(transactions.length / PAGE_SIZE) || 1}
              totalItems={transactions.length}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </div>
      )}

      <CashTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalInitialType}
        onSuccess={loadData}
      />

      <CashPrintStatementModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        totalPaid={totalPaid}
        totalReceived={totalReceived}
        currentBalance={netCashFlow}
      />

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Cash Entry"
        message="Are you sure you want to delete this cash transaction? This cannot be undone."
        confirmText="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}
