import { useState, useEffect, useMemo } from "react";
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
  PlusIcon,
  LandmarkIcon,
  WalletIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CashTransactionModal } from "@/components/cash-transaction-modal";
import { BankAccountModal } from "@/components/bank-account-modal";
import { CashPrintStatementModal } from "@/components/cash-print-statement-modal";
import { CashPartyReport } from "@/components/cash-party-report";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  fetchCashTransactionsApi,
  fetchPartyCashSummaryApi,
  createCashTransactionApi,
  deleteCashTransactionApi,
  fetchPosSales,
  fetchExpensesApi,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const INITIAL_ACCOUNTS = [
  {
    id: "acc_cash_01",
    bankName: "Cash in Hand (Tijori / Counter)",
    accountTitle: "Shop Drawer Cash",
    accountNumber: "CASH-DRAWER",
    accountType: "Tijori / Cash",
    openingBalance: 0,
  },
  {
    id: "acc_hbl_01",
    bankName: "HBL (Habib Bank Limited)",
    accountTitle: "Al Khaleej Current",
    accountNumber: "0192-8374619-01",
    accountType: "Current",
    openingBalance: 0,
  },
  {
    id: "acc_meezan_01",
    bankName: "Meezan Bank",
    accountTitle: "Al Khaleej Sales",
    accountNumber: "0293-8475618-02",
    accountType: "Current",
    openingBalance: 0,
  },
];

export function CashManager() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMainTab = searchParams.get("tab") === "party" ? "party" : "register";

  const [accounts, setAccounts] = useState(() => {
    try {
      const stored = localStorage.getItem("bank_accounts_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ACCOUNTS;
  });

  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [partySummaries, setPartySummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entryTypeFilter, setEntryTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState("Paid");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

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
      const [txRes, posRes, expRes, partyRes] = await Promise.all([
        fetchCashTransactionsApi({ limit: 1000 }).catch(() => null),
        fetchPosSales().catch(() => null),
        fetchExpensesApi({ period: "all" }).catch(() => null),
        fetchPartyCashSummaryApi().catch(() => null),
      ]);

      const rawCash = txRes?.success && Array.isArray(txRes.data) ? txRes.data : [];
      const rawSales = posRes?.success && Array.isArray(posRes.data) ? posRes.data : [];
      const rawExpenses = expRes?.success && Array.isArray(expRes.data) ? expRes.data : [];
      if (partyRes?.success && Array.isArray(partyRes.data)) {
        setPartySummaries(partyRes.data);
      }

      const list = [];
      const seen = new Set();

      rawCash.forEach((tx) => {
        const key = tx._id ? String(tx._id) : `${tx.partyName}-${tx.amount}-${tx.transactionDate}`;
        if (seen.has(key)) return;
        seen.add(key);

        const mode = (tx.paymentMode || "").toLowerCase();
        let accName = "Cash Drawer";
        if (tx.accountId) {
          const matched = accounts.find((a) => a.id === tx.accountId);
          if (matched) accName = matched.accountTitle;
        } else if (mode.includes("bank") || mode.includes("transfer") || mode.includes("cheque")) {
          accName = "Bank Transfer";
        }

        list.push({
          id: tx._id || key,
          date: tx.transactionDate || tx.createdAt || new Date().toISOString(),
          account: accName,
          type: tx.type === "Received" ? "Received" : "Paid",
          party: tx.partyName || tx.party || "Direct Entry",
          category: tx.category || "General",
          reference: tx.referenceNo || "-",
          notes: tx.notes || "",
          debit: tx.type === "Paid" ? Number(tx.amount) || 0 : 0,
          credit: tx.type === "Received" ? Number(tx.amount) || 0 : 0,
          isManual: true,
        });
      });

      rawSales.forEach((sale) => {
        if (!sale || sale.isCredit) return;
        const key = `sale-${sale._id || sale.saleNumber}`;
        if (seen.has(key)) return;
        seen.add(key);

        const mode = (sale.paymentMode || "").toLowerCase();
        const isBank = mode.includes("bank") || mode.includes("online") || mode.includes("cheque");
        const amount = Number(sale.grandTotal) || Number(sale.cashReceived) || 0;
        if (amount <= 0) return;

        list.push({
          id: key,
          date: sale.createdAt || new Date().toISOString(),
          account: isBank ? "Bank Sales" : "Cash Drawer",
          type: "Received",
          party: sale.customerName || "Counter POS Customer",
          category: "Sales Revenue",
          reference: sale.saleNumber || "BILL",
          notes: "POS Counter Sale Collection",
          debit: 0,
          credit: amount,
          isManual: false,
        });
      });

      rawExpenses.forEach((exp) => {
        if (!exp) return;
        const key = `exp-${exp._id || exp.voucherNumber}`;
        if (seen.has(key)) return;
        seen.add(key);

        const amount = Number(exp.amount) || 0;
        if (amount <= 0) return;

        list.push({
          id: key,
          date: exp.date || exp.createdAt || new Date().toISOString(),
          account: (exp.paymentMethod || "").toLowerCase().includes("bank") ? "Bank" : "Cash Drawer",
          type: "Paid",
          party: exp.title || exp.category || "Shop Expense",
          category: exp.category || "Expenses",
          reference: exp.voucherNumber || "EXP",
          notes: exp.description || exp.notes || "",
          debit: amount,
          credit: 0,
          isManual: false,
        });
      });

      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(list);
    } catch {
      toast.error("Failed to load cash register records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accounts]);

  const handleSaveAccount = (accountData) => {
    let updated;
    const exists = accounts.some((a) => a.id === accountData.id);
    if (exists) {
      updated = accounts.map((a) => (a.id === accountData.id ? accountData : a));
      toast.success(`Account "${accountData.accountTitle}" updated successfully!`);
    } else {
      updated = [...accounts, accountData];
      toast.success(`Account "${accountData.accountTitle}" added successfully!`);
    }
    setAccounts(updated);
    localStorage.setItem("bank_accounts_v2", JSON.stringify(updated));
    setEditingAccount(null);
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedAccountId !== "all") {
        const acc = accounts.find((a) => a.id === selectedAccountId);
        if (acc) {
          const accTitle = (acc.accountTitle || "").toLowerCase();
          const accBank = (acc.bankName || "").toLowerCase();
          const tAcc = (t.account || "").toLowerCase();
          const isTijori = acc.accountType === "Tijori / Cash" || accBank.includes("cash") || accBank.includes("tijori");

          if (isTijori && !tAcc.includes("cash drawer")) return false;
          if (!isTijori && !tAcc.includes(accTitle) && !tAcc.includes("bank")) return false;
        }
      }

      if (entryTypeFilter === "paid" && t.type !== "Paid") return false;
      if (entryTypeFilter === "received" && t.type !== "Received") return false;

      if (startDate) {
        const itemDate = new Date(t.date).toISOString().split("T")[0];
        if (itemDate < startDate) return false;
      }
      if (endDate) {
        const itemDate = new Date(t.date).toISOString().split("T")[0];
        if (itemDate > endDate) return false;
      }

      const q = search.toLowerCase().trim();
      if (q) {
        const match =
          (t.party || "").toLowerCase().includes(q) ||
          (t.reference || "").toLowerCase().includes(q) ||
          (t.account || "").toLowerCase().includes(q) ||
          (t.category || "").toLowerCase().includes(q) ||
          (t.notes || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [transactions, selectedAccountId, entryTypeFilter, startDate, endDate, search, accounts]);

  const chronologicalEntries = useMemo(() => {
    const asc = [...filteredTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    const withBal = asc.map((item) => {
      running = running + (Number(item.credit) || 0) - (Number(item.debit) || 0);
      return {
        ...item,
        runningBalance: running,
      };
    });
    return withBal.reverse();
  }, [filteredTransactions]);

  const totalReceived = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
  }, [filteredTransactions]);

  const totalPaid = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
  }, [filteredTransactions]);

  const netBalance = totalReceived - totalPaid;

  const handleExportExcel = () => {
    const data = chronologicalEntries.map((item, idx) => ({
      "Sr #": idx + 1,
      Date: new Date(item.date).toLocaleString(),
      Account: item.account,
      Type: item.type,
      "Party / Particulars": item.party,
      Category: item.category,
      Reference: item.reference,
      "Paid Out (PKR)": item.debit || 0,
      "Received In (PKR)": item.credit || 0,
      "Balance (PKR)": item.runningBalance || 0,
      Notes: item.notes || "-",
    }));

    exportTransactionsToExcel(data, `Cash_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Cash register exported to Excel!");
  };

  return (
    <div className="w-full space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2Icon className="size-5 text-primary" />
            <span>Bank &amp; Cash Register</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time unified register for shop drawer cash and bank transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => {
              setModalInitialType("Paid");
              setIsModalOpen(true);
            }}
            className="h-8 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer text-xs font-semibold px-3 shadow-2xs"
          >
            <ArrowUpRightIcon className="size-3.5" />
            <span>Cash Out (Paid)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setModalInitialType("Received");
              setIsModalOpen(true);
            }}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer text-xs font-semibold px-3 shadow-2xs"
          >
            <ArrowDownLeftIcon className="size-3.5" />
            <span>Cash In (Received)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingAccount(null);
              setIsAccountModalOpen(true);
            }}
            className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer"
          >
            <PlusIcon className="size-3.5 text-primary" />
            <span>Add Bank</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer"
          >
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer"
          >
            <PrinterIcon className="size-3.5 text-primary" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSearchParams({})}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              activeMainTab === "register"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Building2Icon className="size-3.5" />
            <span>Cash &amp; Bank Register</span>
          </button>
          <button
            onClick={() => setSearchParams({ tab: "party" })}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              activeMainTab === "party"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <UsersIcon className="size-3.5" />
            <span>Party Reports ({partySummaries.length})</span>
          </button>
        </div>

        {activeMainTab === "register" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => {
                setSelectedAccountId("all");
                setCurrentPage(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap",
                selectedAccountId === "all"
                  ? "bg-muted text-foreground font-bold border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Accounts
            </button>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setSelectedAccountId(acc.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer whitespace-nowrap",
                  selectedAccountId === acc.id
                    ? "bg-muted text-foreground font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {acc.accountTitle}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeMainTab === "party" ? (
        <CashPartyReport partySummaries={partySummaries} loading={loading} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Total Cash In (Received)</p>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  Rs. {totalReceived.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">All Inflows &amp; Collections</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ArrowDownLeftIcon className="size-4" />
              </div>
            </div>

            <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Total Cash Out (Paid)</p>
                <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  Rs. {totalPaid.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">All Payments &amp; Expenses</p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <ArrowUpRightIcon className="size-4" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Net Available Balance</p>
                <p className={cn("text-xl font-bold font-mono", netBalance >= 0 ? "text-primary" : "text-destructive")}>
                  Rs. {netBalance.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">Inflow minus Outflow</p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <WalletIcon className="size-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/80 text-xs">
              <button
                onClick={() => setEntryTypeFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors cursor-pointer font-medium",
                  entryTypeFilter === "all" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({filteredTransactions.length})
              </button>
              <button
                onClick={() => setEntryTypeFilter("received")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors cursor-pointer font-medium",
                  entryTypeFilter === "received" ? "bg-background text-emerald-500 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Received (In)
              </button>
              <button
                onClick={() => setEntryTypeFilter("paid")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors cursor-pointer font-medium",
                  entryTypeFilter === "paid" ? "bg-background text-rose-500 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Paid (Out)
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:max-w-md">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search party, ref, account, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-8 text-xs h-8 bg-muted/30"
                />
              </div>

              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 h-8 rounded-lg border border-border">
                <CalendarIcon className="size-3.5 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-xs w-28"
                />
                <span>-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-xs w-28"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground uppercase text-[10.5px] tracking-wider">
                  <tr>
                    <th className="p-2.5 ps-3.5 w-10">#</th>
                    <th className="p-2.5">Date &amp; Time</th>
                    <th className="p-2.5">Account / Channel</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Party / Particulars</th>
                    <th className="p-2.5">Ref #</th>
                    <th className="p-2.5 text-right text-rose-600 dark:text-rose-400">Cash Out (Paid)</th>
                    <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">Cash In (Received)</th>
                    <th className="p-2.5 text-right font-mono">Running Balance</th>
                    <th className="p-2.5 pe-3.5 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading register transactions...
                      </td>
                    </tr>
                  ) : chronologicalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        No transactions found for the selected filter. Click "Cash In" or "Cash Out" to add entries.
                      </td>
                    </tr>
                  ) : (
                    chronologicalEntries
                      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                      .map((tx, idx) => (
                        <tr key={tx.id || idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-2.5 ps-3.5 text-muted-foreground text-[11px] font-mono">
                            {(currentPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="p-2.5 text-muted-foreground text-[11px] font-mono whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="p-2.5 font-medium text-foreground">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted/70 text-foreground border border-border">
                              {tx.account}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border",
                                tx.type === "Paid"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              )}
                            >
                              {tx.type === "Paid" ? (
                                <ArrowUpRightIcon className="size-2.5" />
                              ) : (
                                <ArrowDownLeftIcon className="size-2.5" />
                              )}
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-2.5 font-semibold text-foreground max-w-[220px] truncate">
                            <div>{tx.party}</div>
                            {tx.notes && <div className="text-[10px] font-normal text-muted-foreground truncate">{tx.notes}</div>}
                          </td>
                          <td className="p-2.5 text-muted-foreground font-mono text-[11px]">
                            {tx.reference || "-"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-medium text-rose-600 dark:text-rose-400">
                            {tx.debit > 0 ? `Rs. ${tx.debit.toLocaleString()}` : "—"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            {tx.credit > 0 ? `Rs. ${tx.credit.toLocaleString()}` : "—"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-foreground">
                            Rs. {Number(tx.runningBalance || 0).toLocaleString()}
                          </td>
                          <td className="p-2.5 pe-3.5 text-center">
                            {tx.isManual && (
                              <button
                                onClick={() => setDeletingId(tx.id)}
                                className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                                title="Delete entry"
                              >
                                <Trash2Icon className="size-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={Math.ceil(chronologicalEntries.length / PAGE_SIZE) || 1}
              totalItems={chronologicalEntries.length}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </>
      )}

      <CashTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalInitialType}
        onSuccess={loadData}
      />

      <BankAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSaveAccount={handleSaveAccount}
        editingAccount={editingAccount}
      />

      <CashPrintStatementModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={chronologicalEntries}
        totalPaid={totalPaid}
        totalReceived={totalReceived}
        currentBalance={netBalance}
      />

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Cash Entry"
        message="Are you sure you want to delete this transaction entry? This cannot be undone."
        confirmText="Delete Entry"
        loading={deleteLoading}
      />
    </div>
  );
}
