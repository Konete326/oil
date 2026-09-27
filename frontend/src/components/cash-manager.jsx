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
import { CashStatsSummary } from "@/components/cash-stats-summary";
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
      if (activeTab === "paid") params.type = "Paid";
      if (activeTab === "received") params.type = "Received";
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (paymentMode) params.paymentMode = paymentMode;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [txRes, partyRes] = await Promise.all([
        fetchCashTransactionsApi(params),
        fetchPartyCashSummaryApi(),
      ]);

      if (txRes?.success) setTransactions(txRes.data);
      if (partyRes?.success) setPartySummaries(partyRes.data);
    } catch {
      toast.error("Failed to load cash data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, startDate, endDate, selectedCategory, paymentMode]);

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
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalReceived = transactions
    .filter((t) => t.type === "Received")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2Icon className="size-5 text-primary" />
            <span>Bank & Cash Ledger</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage bank accounts, daily cash register, party summaries & statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleOpenModal("Paid")}
            className="h-7.5 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer text-xs font-semibold px-2.5 shadow-2xs"
          >
            <ArrowUpRightIcon className="size-3.5" />
            <span>Record Paid</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenModal("Received")}
            className="h-7.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer text-xs font-semibold px-2.5 shadow-2xs"
          >
            <ArrowDownLeftIcon className="size-3.5" />
            <span>Record Received</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "bank", label: "Bank Register" },
            { id: "all", label: "All Cash Entries" },
            { id: "paid", label: "Paid Records" },
            { id: "received", label: "Received Records" },
            { id: "party", label: "Party Reports" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams(tab.id === "bank" ? {} : { tab: tab.id });
              }}
              className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer shrink-0 ${
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
              className="h-7 items-center gap-1.5 text-xs px-2.5 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
              <span>Export Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(true)}
              className="h-7 items-center gap-1.5 text-xs px-2.5 cursor-pointer"
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
        <div className="space-y-3.5">
          <CashStatsSummary
            totalPaid={totalPaid}
            totalReceived={totalReceived}
            partyCount={partySummaries.length}
          />
          <CashPartyReport partySummaries={partySummaries} loading={loading} />
        </div>
      ) : (
        <div className="space-y-3.5">
          <CashStatsSummary
            totalPaid={totalPaid}
            totalReceived={totalReceived}
            partyCount={partySummaries.length}
          />
          <form onSubmit={handleSearchSubmit} className="bg-card p-2 rounded-xl border border-border shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center w-full">
              <div className="relative col-span-12 md:col-span-4">
                <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search party, ref no, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-8 text-xs h-7.5 bg-background"
                />
              </div>

              <div className="col-span-12 sm:col-span-6 md:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-7.5 rounded-md border border-input bg-background px-2 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Categories</option>
                  <option value="Customer Payment">Customer Payment</option>
                  <option value="Supplier Payment">Supplier Payment</option>
                  <option value="Expenses">Expenses</option>
                  <option value="Staff Salary">Staff Salary</option>
                  <option value="Petty Cash">Petty Cash</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="col-span-12 sm:col-span-6 md:col-span-2">
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full h-7.5 rounded-md border border-input bg-background px-2 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online / POS</option>
                </select>
              </div>

              <div className="col-span-12 md:col-span-3 flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 h-7.5 rounded-md border border-border w-full justify-between">
                <CalendarIcon className="size-3.5 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-xs w-full text-center"
                />
                <span className="shrink-0 text-[10px] text-muted-foreground">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-xs w-full text-center"
                />
              </div>
            </div>
          </form>

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
                        No cash transactions recorded. Click "Record Paid" or "Record Received" to create entries.
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
                        <td className="p-2.5 font-semibold text-foreground">{tx.partyName}</td>
                        <td className="p-2.5 text-muted-foreground">{tx.category}</td>
                        <td
                          className={`p-2.5 text-right font-mono font-bold text-xs ${
                            tx.type === "Paid" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {tx.type === "Paid" ? "-" : "+"}Rs {tx.amount.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-muted-foreground">{tx.paymentMode}</td>
                        <td className="p-2.5 font-mono text-[11px] text-muted-foreground">{tx.referenceNo || "-"}</td>
                        <td className="p-2.5 text-muted-foreground max-w-xs truncate">{tx.notes || "-"}</td>
                        <td className="p-2.5 pe-3.5 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(tx._id)}
                            className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2Icon className="size-3" />
                          </Button>
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
              onPageChange={(page) => setCurrentPage(page)}
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

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Cash Record"
        message="Are you sure you want to delete this cash transaction record? This action cannot be undone."
      />

      <CashPrintStatementModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
