import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  PlusIcon,
  SearchIcon,
  PrinterIcon,
  Trash2Icon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  ListFilterIcon,
  RefreshCwIcon,
  CalendarIcon,
  FileSpreadsheetIcon,
  ReceiptIcon,
  BanknoteIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CashStatsSummary } from "@/components/cash-stats-summary";
import { CashTransactionModal } from "@/components/cash-transaction-modal";
import { ExpenseModal } from "@/components/expense-modal";
import { CashPartyReport } from "@/components/cash-party-report";
import { CashPrintStatementModal } from "@/components/cash-print-statement-modal";
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
  const [activeTab, setActiveTab] = useState("all");
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
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState("Paid");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openModal) {
      if (location.state.modalType === "expense") {
        setIsExpenseModalOpen(true);
      } else {
        setModalInitialType(location.state.initialType || "Received");
        setIsModalOpen(true);
      }
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

      if (txRes?.success) setTransactions(txRes.data || []);
      if (partyRes?.success) setPartySummaries(partyRes.data || []);
    } catch (err) {
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

  const handleExportExcel = () => {
    if (activeTab === "party") {
      exportPartySummaryToExcel(partySummaries);
    } else {
      exportTransactionsToExcel(transactions);
    }
  };

  return (
    <div className="w-full space-y-4 p-3 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BanknoteIcon className="size-5.5 text-primary" />
            <span>Daily Cash Book & Expenses</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage daily cash drawer, operational expenses, customer receipts, and vendor payouts in one unified ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            size="sm"
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer text-xs h-8 px-3 font-semibold shadow-xs"
            title="Record Daily Operational Expense (Chai, Electricity Bill, Rent)"
          >
            <ReceiptIcon className="size-3.5" />
            <span>Record Expense</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenModal("Received")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer text-xs h-8 px-3 font-semibold shadow-xs"
          >
            <ArrowDownLeftIcon className="size-3.5" />
            <span>Receive Cash</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenModal("Paid")}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer text-xs h-8 px-3 font-semibold shadow-xs"
          >
            <ArrowUpRightIcon className="size-3.5" />
            <span>Pay Cash</span>
          </Button>
        </div>
      </div>

      <CashStatsSummary totalReceived={totalReceived} totalPaid={totalPaid} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Cash Book" },
            { id: "received", label: "Cash Inflow (+)" },
            { id: "paid", label: "Cash Outflow & Expenses (-)" },
            { id: "party", label: "Party-wise Summary" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap border ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs cursor-pointer h-7.5 px-2.5"
          >
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Excel Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="gap-1.5 text-xs cursor-pointer h-7.5 px-2.5"
          >
            <PrinterIcon className="size-3.5" />
            <span className="hidden sm:inline">Print Slip</span>
          </Button>
        </div>
      </div>

      {activeTab !== "party" && (
        <div className="bg-card p-3 rounded-xl border border-border space-y-3 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-center">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search party, voucher #, notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="ps-8 text-xs h-8 bg-muted/30"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Categories & Expenses</option>
              <option value="POS Sale">POS Sale Inflow</option>
              <option value="Mill Payment">Mill Payment</option>
              <option value="Customer Payment">Customer Payment</option>
              <option value="Supplier Payment">Supplier Payment</option>
              <option value="Salaries & Wages">Salaries & Wages</option>
              <option value="Utilities">Utilities & Bills</option>
              <option value="Transport & Freight">Transport & Freight</option>
              <option value="Rent">Shop Rent</option>
              <option value="Maintenance & Repairs">Maintenance & Repairs</option>
              <option value="Office Petty Cash">Office Tea / Food</option>
              <option value="Other">Other Expenses</option>
            </select>

            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Payment Modes</option>
              <option value="Cash">Cash Drawer</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Online POS">Online POS</option>
            </select>

            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-8 bg-muted/30"
                title="Start Date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-8 bg-muted/30"
                title="End Date"
              />
            </div>
          </form>
        </div>
      )}

      {activeTab === "party" ? (
        <CashPartyReport parties={partySummaries} loading={loading} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5 ps-3.5">Date & Time</th>
                  <th className="p-2.5">Party / Particulars</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 text-right">Inflow (Received)</th>
                  <th className="p-2.5 text-right">Outflow (Paid)</th>
                  <th className="p-2.5 pe-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No cash transactions or expenses recorded.
                    </td>
                  </tr>
                ) : (
                  transactions
                    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                    .map((t) => (
                      <tr key={t._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 ps-3.5 text-muted-foreground font-mono text-[10.5px]">
                          {new Date(t.date || t.createdAt).toLocaleDateString()}{" "}
                          <span className="text-[9.5px] opacity-70">
                            {new Date(t.date || t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-foreground">{t.partyName || "General Expense"}</div>
                          {t.notes && <div className="text-[10px] text-muted-foreground truncate max-w-xs">{t.notes}</div>}
                        </td>
                        <td className="p-2.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                            {t.category || "General"}
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground text-[11px] font-medium">{t.paymentMode || "Cash"}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.type === "Received" ? `+ Rs ${t.amount.toLocaleString()}` : "—"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {t.type === "Paid" ? `- Rs ${t.amount.toLocaleString()}` : "—"}
                        </td>
                        <td className="p-2.5 pe-3.5 text-center">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeletingId(t._id)}
                            className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Delete Entry"
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

          <PaginationBar
            currentPage={currentPage}
            totalPages={Math.ceil(transactions.length / PAGE_SIZE) || 1}
            totalItems={transactions.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      <CashTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalInitialType}
        onSuccess={loadData}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={loadData}
      />

      <CashPrintStatementModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        totalReceived={totalReceived}
        totalPaid={totalPaid}
      />

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Cash Entry"
        description="Are you sure you want to delete this cash entry? This will adjust the daily cash book balance."
        confirmText={deleteLoading ? "Deleting..." : "Delete Entry"}
        variant="destructive"
      />
    </div>
  );
}
