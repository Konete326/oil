import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CashStatsSummary } from "@/components/cash-stats-summary";
import { CashTransactionModal } from "@/components/cash-transaction-modal";
import { CashPartyReport } from "@/components/cash-party-report";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  fetchCashTransactionsApi,
  fetchPartyCashSummaryApi,
  deleteCashTransactionApi,
} from "@/lib/api";

export function CashManager() {
  const [activeTab, setActiveTab] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [partySummaries, setPartySummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState("Paid");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab === "paid") params.type = "Paid";
      if (activeTab === "received") params.type = "Received";
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [txRes, partyRes] = await Promise.all([
        fetchCashTransactionsApi(params),
        fetchPartyCashSummaryApi(),
      ]);

      if (txRes?.success) setTransactions(txRes.data);
      if (partyRes?.success) setPartySummaries(partyRes.data);
    } catch (err) {
      toast.error("Failed to load cash data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, startDate, endDate]);

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cash Transactions & Reports</h1>
          <p className="text-xs text-muted-foreground">Manage Paid Cash (outflow), Received Cash (inflow), and Party-wise ledger reports.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleOpenModal("Paid")}
            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 cursor-pointer text-xs"
          >
            <ArrowUpRightIcon className="size-3.5" />
            <span>Record Paid Cash</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenModal("Received")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 cursor-pointer text-xs"
          >
            <ArrowDownLeftIcon className="size-3.5" />
            <span>Record Received Cash</span>
          </Button>
        </div>
      </div>

      <CashStatsSummary
        totalPaid={totalPaid}
        totalReceived={totalReceived}
        partyCount={partySummaries.length}
      />

      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1">
          {[
            { id: "all", label: "All Transactions" },
            { id: "paid", label: "Paid Cash Records" },
            { id: "received", label: "Received Cash Records" },
            { id: "party", label: "Party-Wise Reports" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="hidden sm:flex items-center gap-1.5 text-xs cursor-pointer mb-1"
        >
          <PrinterIcon className="size-3.5" />
          <span>Print Report</span>
        </Button>
      </div>

      {activeTab === "party" ? (
        <CashPartyReport partySummaries={partySummaries} loading={loading} />
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search party name, category, or reference no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border">
                <CalendarIcon className="size-3.5" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-xs"
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-xs"
                />
              </div>

              <Button type="submit" variant="secondary" size="sm" className="text-xs cursor-pointer">
                <ListFilterIcon className="size-3.5 me-1" />
                Filter
              </Button>
            </div>
          </form>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 ps-4">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Party / Customer Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Reference No</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3 pe-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Loading cash transactions...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        No cash transactions recorded. Click "Record Paid Cash" or "Record Received Cash" to create entries.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 ps-4 text-muted-foreground text-[11px]">
                          {new Date(tx.transactionDate || tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              tx.type === "Paid"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            }`}
                          >
                            {tx.type === "Paid" ? <ArrowUpRightIcon className="size-3" /> : <ArrowDownLeftIcon className="size-3" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-foreground">{tx.partyName}</td>
                        <td className="p-3 text-muted-foreground">{tx.category}</td>
                        <td
                          className={`p-3 text-right font-mono font-bold ${
                            tx.type === "Paid" ? "text-amber-500" : "text-emerald-500"
                          }`}
                        >
                          {tx.type === "Paid" ? "-" : "+"}Rs. {tx.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-muted-foreground">{tx.paymentMode}</td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">{tx.referenceNo || "-"}</td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{tx.notes || "-"}</td>
                        <td className="p-3 pe-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(tx._id)}
                            className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
    </div>
  );
}
