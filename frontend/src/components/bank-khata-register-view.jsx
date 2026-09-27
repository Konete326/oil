import { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  SearchIcon,
  CalendarIcon,
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

const PAGE_SIZE = 12;

const DEFAULT_BANKS = [
  "HBL",
  "Meezan Bank",
  "Bank Alfalah",
  "MCB Bank",
  "Allied Bank (ABL)",
  "UBL",
  "Cash in Hand (Tijori)",
];

export function BankKhataRegisterView() {
  const [selectedBank, setSelectedBank] = useState("HBL");
  const [customBanks, setCustomBanks] = useState(() => {
    try {
      const stored = localStorage.getItem("custom_bank_accounts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
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
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [entrySaving, setEntrySaving] = useState(false);

  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const allBankOptions = useMemo(() => {
    return Array.from(new Set([...DEFAULT_BANKS, ...customBanks]));
  }, [customBanks]);

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

  const handleAddBank = (bankName) => {
    if (!allBankOptions.includes(bankName)) {
      const updated = [...customBanks, bankName];
      setCustomBanks(updated);
      localStorage.setItem("custom_bank_accounts", JSON.stringify(updated));
      setSelectedBank(bankName);
      toast.success(`Bank account "${bankName}" added!`);
    } else {
      setSelectedBank(bankName);
    }
  };

  const ledgerEntries = useMemo(() => {
    const isCashAccount = selectedBank.toLowerCase().includes("cash") || selectedBank.toLowerCase().includes("tijori");
    const currentBankKey = selectedBank.toLowerCase();

    const result = [];

    cashTxList.forEach((tx) => {
      const mode = (tx.paymentMode || "").toLowerCase();
      const notes = (tx.notes || "").toLowerCase();
      const party = (tx.partyName || "").toLowerCase();

      const matchesBank =
        isCashAccount
          ? mode === "cash"
          : mode.includes("bank") ||
            mode.includes("cheque") ||
            notes.includes(currentBankKey) ||
            party.includes(currentBankKey);

      if (matchesBank) {
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
      const isBankSale =
        !isCashAccount &&
        (mode.includes("bank") || mode.includes("card") || mode.includes("online") || mode.includes("cheque"));
      const isCashSale = isCashAccount && mode.includes("cash") && !sale.isCredit;

      if (isBankSale || isCashSale) {
        result.push({
          id: `sale-${sale._id}`,
          date: sale.createdAt,
          tafseel: `${sale.customerName || "Walk-in Customer"} (Counter Sale)`,
          reason: `POS Bill #${sale.saleNumber} - Farokht Maal`,
          folio: sale.saleNumber,
          jama: Number(sale.grandTotal) || 0,
          naam: 0,
          notes: `Payment Mode: ${sale.paymentMode}`,
          sourceType: "POS Sale",
          isDeletable: false,
        });
      }
    });

    purchasesList.forEach((pur) => {
      const status = (pur.paymentStatus || "").toLowerCase();
      const isPaid = status === "paid" || status.includes("bank");
      if (isPaid) {
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
  }, [selectedBank, cashTxList, salesList, purchasesList, expensesList, advancesList]);

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
          ? `Rs ${payload.amount.toLocaleString()} deposited into ${selectedBank} account!`
          : `Rs ${payload.amount.toLocaleString()} withdrawn from ${selectedBank} account!`
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
      toast.success("Bank transaction deleted successfully!");
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
    XLSX.utils.book_append_sheet(workbook, worksheet, `Khata_${selectedBank}`);
    XLSX.writeFile(workbook, `Bank_Khata_${selectedBank}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Bank register exported to Excel successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-lg border border-border shadow-2xs">
            <span className="text-xs text-muted-foreground font-medium">Account:</span>
            <select
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.target.value);
                setCurrentPage(1);
              }}
              className="h-6.5 text-xs font-semibold rounded bg-background px-1.5 text-foreground border border-input cursor-pointer focus:outline-none"
            >
              {allBankOptions.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddBankModalOpen(true)}
              className="h-6.5 text-[11px] px-1.5 text-primary hover:bg-primary/10 cursor-pointer gap-1"
            >
              <PlusIcon className="size-3" />
              <span>New</span>
            </Button>
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
        selectedBank={selectedBank}
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
              className="ps-8 text-xs h-7.5 bg-background focus:bg-background"
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
        selectedBank={selectedBank}
      />

      <BankEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        type={entryModalType}
        selectedBank={selectedBank}
        onSave={handleSaveEntry}
        loading={entrySaving}
      />

      <BankAccountModal
        isOpen={isAddBankModalOpen}
        onClose={() => setIsAddBankModalOpen(false)}
        onAddBank={handleAddBank}
      />

      <ConfirmModal
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Bank Entry"
        message="Are you sure you want to delete this manual bank entry? This action cannot be undone."
      />
    </div>
  );
}
