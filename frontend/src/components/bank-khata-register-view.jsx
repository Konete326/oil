import { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  SearchIcon,
  Edit2Icon,
  LandmarkIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BankKhataStats } from "@/components/bank-khata-stats";
import { BankKhataTable } from "@/components/bank-khata-table";
import { BankEntryModal } from "@/components/bank-entry-modal";
import { BankAccountModal } from "@/components/bank-account-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  fetchCashTransactionsApi,
  createCashTransactionApi,
  deleteCashTransactionApi,
  fetchPosSales,
  fetchPurchasesApi,
  fetchExpensesApi,
  fetchEmployeeAdvanceLedgerApi,
} from "@/lib/api";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const INITIAL_ACCOUNTS = [
  {
    id: "acc_hbl_01",
    bankName: "HBL (Habib Bank Limited)",
    accountTitle: "Al Khaleej Lubricants (Primary Current)",
    accountNumber: "0192-8374619-01",
    branchName: "Auto Market Branch",
    accountType: "Current",
    openingBalance: 0,
    notes: "Main account for lubricant supplier bills",
  },
  {
    id: "acc_meezan_01",
    bankName: "Meezan Bank",
    accountTitle: "Al Khaleej Sales & Collections",
    accountNumber: "0293-8475618-02",
    branchName: "Commercial Branch",
    accountType: "Current",
    openingBalance: 0,
    notes: "Customer bank payments and recoveries",
  },
  {
    id: "acc_cash_01",
    bankName: "Cash in Hand (Tijori / Counter)",
    accountTitle: "Shop Drawer Cash",
    accountNumber: "CASH-TIJORI-01",
    branchName: "Main Shop",
    accountType: "Tijori / Cash",
    openingBalance: 0,
    notes: "Physical cash in register",
  },
];

export function BankKhataRegisterView() {
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

  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    return accounts[0]?.id || "acc_hbl_01";
  });

  const [loading, setLoading] = useState(true);
  const [cashTxList, setCashTxList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [purchasesList, setPurchasesList] = useState([]);
  const [expensesList, setExpensesList] = useState([]);
  const [advancesList, setAdvancesList] = useState([]);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState("Received");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [entrySaving, setEntrySaving] = useState(false);

  const [entryToDelete, setEntryToDelete] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const activeAccount = useMemo(() => {
    return accounts.find((acc) => acc.id === selectedAccountId) || accounts[0] || INITIAL_ACCOUNTS[0];
  }, [accounts, selectedAccountId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cashRes, posRes, purRes, expRes, advRes] = await Promise.all([
        fetchCashTransactionsApi({ limit: 1000 }),
        fetchPosSales(),
        fetchPurchasesApi(),
        fetchExpensesApi({ period: "all" }),
        fetchEmployeeAdvanceLedgerApi({ limit: 1000 }),
      ]);

      if (cashRes?.success && Array.isArray(cashRes.data)) setCashTxList(cashRes.data);
      if (posRes?.success && Array.isArray(posRes.data)) setSalesList(posRes.data);
      if (purRes?.success && Array.isArray(purRes.data)) setPurchasesList(purRes.data);
      if (expRes?.success && Array.isArray(expRes.data)) setExpensesList(expRes.data);
      if (advRes?.success && Array.isArray(advRes.data)) setAdvancesList(advRes.data);
    } catch {
      toast.error("Failed to load bank ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveAccount = (accountData) => {
    let updated;
    const exists = accounts.some((a) => a.id === accountData.id);
    if (exists) {
      updated = accounts.map((a) => (a.id === accountData.id ? accountData : a));
      toast.success(`Account "${accountData.accountTitle}" updated successfully!`);
    } else {
      updated = [...accounts, accountData];
      setSelectedAccountId(accountData.id);
      toast.success(`Account "${accountData.accountTitle}" added successfully!`);
    }
    setAccounts(updated);
    localStorage.setItem("bank_accounts_v2", JSON.stringify(updated));
    setEditingAccount(null);
  };

  const handleDeleteAccountConfirm = () => {
    if (!accountToDelete) return;
    const updated = accounts.filter((a) => a.id !== accountToDelete.id);
    setAccounts(updated);
    localStorage.setItem("bank_accounts_v2", JSON.stringify(updated));
    if (selectedAccountId === accountToDelete.id) {
      setSelectedAccountId(updated[0]?.id || "acc_hbl_01");
    }
    toast.success(`Account "${accountToDelete.accountTitle}" removed`);
    setAccountToDelete(null);
  };

  const computeLedgerForAccount = (acc) => {
    if (!acc) return [];
    const isCashAccount =
      acc.accountType === "Tijori / Cash" ||
      acc.bankName.toLowerCase().includes("cash") ||
      acc.bankName.toLowerCase().includes("tijori");

    const accTitleKey = (acc.accountTitle || "").toLowerCase();
    const accNumKey = (acc.accountNumber || "").toLowerCase();
    const accBankKey = (acc.bankName || "").toLowerCase().split(" ")[0];

    const result = [];

    if (acc.openingBalance && acc.openingBalance > 0) {
      result.push({
        id: `open-${acc.id}`,
        date: "2024-01-01",
        tafseel: "Opening Balance",
        reason: "Initial Account Balance Setup",
        folio: "OPEN-01",
        jama: acc.openingBalance,
        naam: 0,
        notes: "Account Opening Balance",
        sourceType: "Initial",
        rawId: null,
        isDeletable: false,
      });
    }

    cashTxList.forEach((tx) => {
      const mode = (tx.paymentMode || "").toLowerCase();
      const notes = (tx.notes || "").toLowerCase();
      const party = (tx.partyName || "").toLowerCase();

      let matches = false;
      if (tx.accountId) {
        matches = tx.accountId === acc.id;
      } else if (isCashAccount) {
        matches = mode === "cash" && !notes.includes("bank");
      } else {
        matches =
          notes.includes(accNumKey) ||
          notes.includes(accTitleKey) ||
          notes.includes(accBankKey) ||
          party.includes(accBankKey) ||
          mode.includes("bank") ||
          mode.includes("cheque");
      }

      if (matches) {
        result.push({
          id: `cash-${tx._id}`,
          date: tx.transactionDate || tx.createdAt,
          tafseel: tx.partyName,
          reason: tx.category || "Direct Entry",
          folio: tx.referenceNo || "-",
          jama: tx.type === "Received" ? Number(tx.amount) || 0 : 0,
          naam: tx.type === "Paid" ? Number(tx.amount) || 0 : 0,
          notes: tx.notes || "",
          sourceType: "Manual Entry",
          rawId: tx._id,
          isDeletable: true,
        });
      }
    });

    salesList.forEach((sale) => {
      const mode = (sale.paymentMode || "").toLowerCase();
      let matches = false;

      if (sale.bankAccountId) {
        matches = sale.bankAccountId === acc.id;
      } else if (isCashAccount) {
        matches = mode.includes("cash") && !sale.isCredit;
      } else {
        const isBankSale =
          mode.includes("bank") || mode.includes("card") || mode.includes("online") || mode.includes("cheque");
        const defaultBank = accounts.find((a) => a.accountType !== "Tijori / Cash");
        matches = isBankSale && (acc.id === defaultBank?.id || acc.id === accounts[0]?.id);
      }

      if (matches) {
        const refNote = sale.bankReferenceNo ? `Ref: ${sale.bankReferenceNo} | ` : "";
        const bankTitleNote = sale.bankAccountTitle ? `[${sale.bankAccountTitle}] ` : "";
        result.push({
          id: `sale-${sale._id}`,
          date: sale.createdAt,
          tafseel: `${sale.customerName || "Walk-in Customer"} (POS Sale)`,
          reason: `POS Bill #${sale.saleNumber}`,
          folio: sale.saleNumber,
          jama: Number(sale.grandTotal) || 0,
          naam: 0,
          notes: `${bankTitleNote}${refNote}Mode: ${sale.paymentMode}`,
          sourceType: "POS Sale",
          isDeletable: false,
        });
      }
    });

    purchasesList.forEach((pur) => {
      const status = (pur.paymentStatus || "").toLowerCase();
      const isPaid = status === "paid" || status.includes("bank");
      if (isPaid && !isCashAccount) {
        result.push({
          id: `pur-${pur._id}`,
          date: pur.date || pur.createdAt,
          tafseel: `${pur.supplierName || "Oil Supplier"} (Stock Purchase)`,
          reason: `Stock Purchase - Bill #${pur.billNumber || pur.poNumber || "-"}`,
          folio: pur.billNumber || pur.poNumber || "-",
          jama: 0,
          naam: Number(pur.totalCost || pur.totalAmount) || 0,
          notes: `Liters: ${pur.totalLiters || 0} L`,
          sourceType: "Stock Purchase",
          isDeletable: false,
        });
      }
    });

    expensesList.forEach((exp) => {
      const mode = (exp.paymentMode || "").toLowerCase();
      const matches = isCashAccount ? mode.includes("cash") : mode.includes("bank") || mode.includes("cheque");
      if (matches) {
        result.push({
          id: `exp-${exp._id}`,
          date: exp.expenseDate || exp.createdAt,
          tafseel: exp.title,
          reason: `Shop Expense: [${exp.category || "General"}]`,
          folio: exp.voucherNumber || "-",
          jama: 0,
          naam: Number(exp.amount) || 0,
          notes: exp.notes || "",
          sourceType: "Expense",
          isDeletable: false,
        });
      }
    });

    advancesList.forEach((adv) => {
      if (adv.type === "Advance Given") {
        const mode = (adv.paymentMode || "").toLowerCase();
        const matches = isCashAccount ? mode.includes("cash") : mode.includes("bank") || mode.includes("cheque");
        if (matches) {
          result.push({
            id: `adv-${adv._id}`,
            date: adv.date || adv.createdAt,
            tafseel: `Staff: ${adv.employeeName}`,
            reason: "Staff Advance Cash Disbursed",
            folio: adv.voucherNumber || "-",
            jama: 0,
            naam: Number(adv.amount) || 0,
            notes: adv.notes || "",
            sourceType: "Staff Advance",
            isDeletable: false,
          });
        }
      }
    });

    result.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    return result.map((entry) => {
      runningBalance = runningBalance + entry.jama - entry.naam;
      return {
        ...entry,
        balance: runningBalance,
      };
    });
  };

  const accountBalances = useMemo(() => {
    const map = {};
    accounts.forEach((acc) => {
      const entries = computeLedgerForAccount(acc);
      const j = entries.reduce((s, e) => s + (e.jama || 0), 0);
      const n = entries.reduce((s, e) => s + (e.naam || 0), 0);
      map[acc.id] = j - n;
    });
    return map;
  }, [accounts, cashTxList, salesList, purchasesList, expensesList, advancesList]);

  const ledgerEntries = useMemo(() => {
    return computeLedgerForAccount(activeAccount);
  }, [activeAccount, cashTxList, salesList, purchasesList, expensesList, advancesList]);

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ledgerEntries
      .slice()
      .reverse()
      .filter((item) => {
        if (startDate && new Date(item.date) < new Date(startDate)) return false;
        if (endDate && new Date(item.date) > new Date(endDate + "T23:59:59")) return false;
        if (!q) return true;
        return (
          item.tafseel.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q) ||
          item.folio.toLowerCase().includes(q) ||
          item.notes.toLowerCase().includes(q)
        );
      });
  }, [ledgerEntries, search, startDate, endDate]);

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE) || 1;
  const paginatedEntries = useMemo(() => {
    return filteredEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredEntries, currentPage]);

  const totalJama = useMemo(() => {
    return ledgerEntries.reduce((acc, it) => acc + (it.jama || 0), 0);
  }, [ledgerEntries]);

  const totalNaam = useMemo(() => {
    return ledgerEntries.reduce((acc, it) => acc + (it.naam || 0), 0);
  }, [ledgerEntries]);

  const currentBalance = totalJama - totalNaam;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayJama = useMemo(() => {
    return ledgerEntries
      .filter((it) => (it.date ? new Date(it.date).toISOString().split("T")[0] === todayStr : false))
      .reduce((acc, it) => acc + (it.jama || 0), 0);
  }, [ledgerEntries, todayStr]);

  const todayNaam = useMemo(() => {
    return ledgerEntries
      .filter((it) => (it.date ? new Date(it.date).toISOString().split("T")[0] === todayStr : false))
      .reduce((acc, it) => acc + (it.naam || 0), 0);
  }, [ledgerEntries, todayStr]);

  const handleSaveEntry = async (payload) => {
    try {
      setEntrySaving(true);
      await createCashTransactionApi(payload);
      toast.success(
        payload.type === "Received"
          ? `Rs ${payload.amount.toLocaleString()} deposited into ${activeAccount.accountTitle}!`
          : `Rs ${payload.amount.toLocaleString()} withdrawn from ${activeAccount.accountTitle}!`
      );
      setIsEntryModalOpen(false);
      loadAllData();
    } catch (err) {
      toast.error(err.message || "Failed to record transaction.");
    } finally {
      setEntrySaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      setDeleting(true);
      await deleteCashTransactionApi(entryToDelete);
      toast.success("Transaction deleted successfully!");
      setEntryToDelete(null);
      loadAllData();
    } catch (err) {
      toast.error(err.message || "Failed to delete transaction.");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredEntries.map((item, idx) => ({
      "S.No": idx + 1,
      Date: new Date(item.date).toLocaleDateString(),
      Particulars: item.tafseel,
      Reason: item.reason,
      "Ref / Cheque #": item.folio,
      "Debit (Out) PKR": item.naam || 0,
      "Credit (In) PKR": item.jama || 0,
      "Balance PKR": item.balance || 0,
      Notes: item.notes || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Khata_${activeAccount.bankName.slice(0, 15)}`);
    XLSX.writeFile(
      workbook,
      `Khata_${activeAccount.accountTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success("Bank register exported to Excel successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3.5">
      <div className="bg-card p-2.5 rounded-xl border border-border shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <LandmarkIcon className="size-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Bank & Cash Accounts:</span>
            <span className="text-[11px] text-muted-foreground">Select an account to view its ledger and live balance</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingAccount(null);
              setIsAccountModalOpen(true);
            }}
            className="h-7 text-xs px-2.5 gap-1.5 text-primary cursor-pointer hover:bg-primary/10"
          >
            <PlusIcon className="size-3.5" />
            <span>Add Bank Account</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {accounts.map((acc) => {
            const isSelected = acc.id === selectedAccountId;
            const bal = accountBalances[acc.id] ?? 0;
            return (
              <div
                key={acc.id}
                onClick={() => {
                  setSelectedAccountId(acc.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 relative group",
                  isSelected
                    ? "bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/30"
                    : "bg-background hover:bg-muted/40 border-border/80"
                )}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground truncate">{acc.accountTitle}</span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-muted font-semibold text-muted-foreground">
                      {acc.accountType}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {acc.bankName} • {acc.accountNumber}
                  </p>
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-muted-foreground">Balance:</span>
                    <span
                      className={cn(
                        "text-xs font-mono font-bold",
                        bal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      Rs {bal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAccount(acc);
                      setIsAccountModalOpen(true);
                    }}
                    title="Edit Account Details"
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Edit2Icon className="size-3" />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAccountToDelete(acc);
                      }}
                      title="Delete Account"
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2Icon className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-0.5">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <LandmarkIcon className="size-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>{activeAccount.accountTitle}</span>
              <span className="text-xs font-mono font-normal text-muted-foreground">
                ({activeAccount.accountNumber})
              </span>
            </h2>
            <p className="text-[10.5px] text-muted-foreground">
              {activeAccount.bankName} {activeAccount.branchName ? `• ${activeAccount.branchName}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => {
              setEntryModalType("Received");
              setIsEntryModalOpen(true);
            }}
            className="h-7.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 text-xs cursor-pointer shadow-2xs"
          >
            <ArrowDownLeftIcon className="size-3.5" />
            <span>+ Deposit (Jama)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEntryModalType("Paid");
              setIsEntryModalOpen(true);
            }}
            className="h-7.5 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium px-2.5 text-xs cursor-pointer shadow-2xs"
          >
            <ArrowUpRightIcon className="size-3.5" />
            <span>- Withdraw (Naam)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-7.5 gap-1 text-xs px-2.5 cursor-pointer"
          >
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-7.5 gap-1 text-xs px-2.5 cursor-pointer"
          >
            <PrinterIcon className="size-3.5 text-primary" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      <BankKhataStats
        currentBalance={currentBalance}
        totalJama={totalJama}
        todayJama={todayJama}
        totalNaam={totalNaam}
        todayNaam={todayNaam}
        entriesCount={ledgerEntries.length}
        activeAccount={activeAccount}
      />

      <div className="rounded-xl border border-border bg-card p-2 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          <div className="relative col-span-12 sm:col-span-6 md:col-span-6">
            <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search particulars, ref/cheque #, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-7.5 bg-background"
            />
          </div>

          <div className="col-span-12 sm:col-span-3 md:col-span-2.5">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs h-7.5 bg-background"
              title="Start Date"
            />
          </div>

          <div className="col-span-12 sm:col-span-3 md:col-span-2.5">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs h-7.5 bg-background"
              title="End Date"
            />
          </div>

          <div className="col-span-12 md:col-span-1 text-right">
            {(search || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
                className="h-7 text-[11px] px-2 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <BankKhataTable
        loading={loading}
        entries={filteredEntries}
        paginatedEntries={paginatedEntries}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => setCurrentPage(page)}
        onDeleteEntry={(rawId) => setEntryToDelete(rawId)}
        onOpenDeposit={() => {
          setEntryModalType("Received");
          setIsEntryModalOpen(true);
        }}
        selectedBank={activeAccount.accountTitle}
      />

      <BankEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        type={entryModalType}
        activeAccount={activeAccount}
        onSave={handleSaveEntry}
        loading={entrySaving}
      />

      <BankAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSaveAccount={handleSaveAccount}
        editingAccount={editingAccount}
      />

      <ConfirmModal
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Bank Entry"
        message="Are you sure you want to delete this manual bank entry? This action cannot be undone."
      />

      <ConfirmModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteAccountConfirm}
        title="Delete Account"
        message={`Are you sure you want to delete "${accountToDelete?.accountTitle}"?`}
      />
    </div>
  );
}
