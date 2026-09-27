import { useState, useEffect, useMemo } from "react";
import {
  Building2Icon,
  PlusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  SearchIcon,
  CalendarIcon,
  WalletIcon,
  Trash2Icon,
  LandmarkIcon,
  CreditCardIcon,
  FileTextIcon,
  ReceiptIcon,
  TruckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
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

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [modalParty, setModalParty] = useState("");
  const [modalAmount, setModalAmount] = useState("");
  const [modalRef, setModalRef] = useState("");
  const [modalDate, setModalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [modalNotes, setModalNotes] = useState("");
  const [modalSaving, setModalSaving] = useState(false);
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bank ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAddCustomBank = () => {
    const name = window.prompt("Enter new Bank or Account name (e.g. Askari Bank, Faysal Bank):");
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (!allBankOptions.includes(trimmed)) {
      const updated = [...customBanks, trimmed];
      setCustomBanks(updated);
      localStorage.setItem("custom_bank_accounts", JSON.stringify(updated));
      setSelectedBank(trimmed);
      toast.success(`Bank account "${trimmed}" added!`);
    } else {
      setSelectedBank(trimmed);
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
      const notes = (pur.notes || "").toLowerCase();
      const isPaid = status === "paid" || status.includes("bank");
      if (isPaid) {
        result.push({
          id: `pur-${pur._id}`,
          date: pur.date || pur.createdAt,
          tafseel: `${pur.supplierName || "Oil Supplier"} (Stock Purchase)`,
          reason: `Oil Stock Kharid - Bill #${pur.billNumber || pur.poNumber || "-"}`,
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
          reason: `Dukan Kharcha: [${exp.category || "General"}]`,
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

  const handleSaveEntry = async (type) => {
    if (!modalParty.trim() || !modalAmount || Number(modalAmount) <= 0) {
      toast.error("Please enter party name and a valid amount.");
      return;
    }

    try {
      setModalSaving(true);
      await createCashTransactionApi({
        type,
        partyName: modalParty.trim(),
        amount: Number(modalAmount),
        category: "Bank Transfer",
        paymentMode: "Bank Transfer",
        referenceNo: modalRef.trim() || `CHQ-${Date.now().toString().slice(-5)}`,
        transactionDate: modalDate,
        notes: `Bank: ${selectedBank} | ${modalNotes.trim()}`,
      });

      toast.success(
        type === "Received"
          ? `Rs ${Number(modalAmount).toLocaleString()} deposited into ${selectedBank} account successfully!`
          : `Rs ${Number(modalAmount).toLocaleString()} withdrawn from ${selectedBank} account successfully!`
      );

      setIsDepositModalOpen(false);
      setIsWithdrawModalOpen(false);
      setModalParty("");
      setModalAmount("");
      setModalRef("");
      setModalNotes("");
      loadAllData();
    } catch (err) {
      toast.error(err.message || "Failed to record transaction.");
    } finally {
      setModalSaving(false);
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
      "Tareekh (Date)": new Date(item.date).toLocaleDateString(),
      "Tafseel (Particulars)": item.tafseel,
      "Wajah / Reason": item.reason,
      "Safha / Cheque #": item.folio,
      "Naam (Debit / Nikla) PKR": item.naam || 0,
      "Jama (Credit / Aaya) PKR": item.jama || 0,
      "Baqaya (Balance) PKR": item.balance || 0,
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Building2Icon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-1.5">
                <span className="text-muted-foreground font-normal">کھاتہ بنام:</span>
                <span className="text-primary font-mono">{selectedBank}</span>
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted border border-border">
                Safha No. 120
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Account me kitne paise aaye, kab aaye, kyun aaye, aur kitne baqi hain (Complete Bank Register).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground font-semibold px-1">Bank:</span>
            <select
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.target.value);
                setCurrentPage(1);
              }}
              className="h-7 text-xs font-bold rounded-md bg-background px-2 text-foreground border border-input cursor-pointer focus:outline-none"
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
              onClick={handleAddCustomBank}
              className="h-7 text-[11px] px-2 text-primary hover:bg-primary/10 cursor-pointer"
              title="Add another bank account"
            >
              <PlusIcon className="size-3" />
              <span>Naya Bank</span>
            </Button>
          </div>

          <Button
            size="sm"
            onClick={() => setIsDepositModalOpen(true)}
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 text-xs shadow-xs cursor-pointer"
          >
            <ArrowDownLeftIcon className="size-3.5" />
            <span>+ Paisey Aaye (Jama)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="h-8 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 text-xs shadow-xs cursor-pointer"
          >
            <ArrowUpRightIcon className="size-3.5" />
            <span>- Paisey Nikle (Naam)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 gap-1.5 text-xs px-2.5 cursor-pointer"
          >
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 gap-1.5 text-xs px-2.5 cursor-pointer"
          >
            <PrinterIcon className="size-3.5 text-primary" />
            <span>Print Khata</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3 shadow-xs">
          <div className="size-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <LandmarkIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground block">
              Maujooda Baqaya (Current Balance)
            </span>
            <p
              className={cn(
                "text-lg sm:text-xl font-extrabold font-mono",
                currentBalance >= 0 ? "text-primary" : "text-rose-600"
              )}
            >
              Rs {currentBalance.toLocaleString()}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono">
              {selectedBank} me mojood raqam
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-3 shadow-xs">
          <div className="size-10 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeftIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Kul Jama (Total Inflow / Aaye)
            </span>
            <p className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              Rs {totalJama.toLocaleString()}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono">
              Aaj: Rs {todayJama.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 flex items-center gap-3 shadow-xs">
          <div className="size-10 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRightIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
              Kul Naam (Total Outflow / Nikle)
            </span>
            <p className="text-lg sm:text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              Rs {totalNaam.toLocaleString()}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono">
              Aaj: Rs {todayNaam.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 flex items-center gap-3 shadow-xs">
          <div className="size-10 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
            <FileTextIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground block">
              Kul Entries & Auto Links
            </span>
            <p className="text-lg sm:text-xl font-extrabold font-mono text-foreground">
              {ledgerEntries.length} Transactions
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              POS, Stock & Bills Auto-Linked
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-2.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          <div className="relative col-span-12 sm:col-span-6 md:col-span-5">
            <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tafseel, customer, supplier, cheque #, reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-7.5 bg-muted/30 focus:bg-background"
            />
          </div>

          <div className="col-span-12 sm:col-span-3 md:col-span-3">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs h-7.5 bg-muted/30"
              title="Start Date"
            />
          </div>

          <div className="col-span-12 sm:col-span-3 md:col-span-3">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs h-7.5 bg-muted/30"
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
                className="h-7 text-[11px] px-2 text-rose-500 hover:bg-rose-50 cursor-pointer"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-xs space-y-2">
            <LandmarkIcon className="size-10 mx-auto text-muted-foreground/40 mb-1" />
            <p className="font-semibold text-foreground text-sm">Koi Entry Record Nahi Mili</p>
            <p className="text-[11px]">
              {selectedBank} me abhi tak koi transaction record nahi hui ya search filter match nahi hua.
            </p>
            <Button
              size="sm"
              onClick={() => setIsDepositModalOpen(true)}
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white mt-2 cursor-pointer"
            >
              + Pehli Entry Jama Karein
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[calc(100vh-320px)] min-h-[300px]">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
                  <TableRow className="border-b border-border/80 text-xs">
                    <TableHead className="w-[100px] text-xs h-9">تاریخ (Date)</TableHead>
                    <TableHead className="text-xs h-9">تفصیل (Tafseel & Reason)</TableHead>
                    <TableHead className="w-[120px] text-xs h-9">صفحہ / چیک #</TableHead>
                    <TableHead className="w-[110px] text-xs h-9 text-center">Type / Zariya</TableHead>
                    <TableHead className="w-[130px] text-xs h-9 text-right text-rose-600 dark:text-rose-400">
                      نام (روپیہ)
                    </TableHead>
                    <TableHead className="w-[130px] text-xs h-9 text-right text-emerald-600 dark:text-emerald-400">
                      جمع (روپیہ)
                    </TableHead>
                    <TableHead className="w-[140px] text-xs h-9 text-right font-bold text-foreground">
                      بقایا (روپیہ)
                    </TableHead>
                    <TableHead className="w-[60px] text-xs h-9 text-right pe-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "hover:bg-muted/20 text-xs border-b border-border/40 transition-colors",
                        row.jama > 0 && "bg-emerald-500/5",
                        row.naam > 0 && "bg-rose-500/5"
                      )}
                    >
                      <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                        {new Date(row.date).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="py-2.5 font-medium text-foreground">
                        <div>
                          <p className="font-semibold text-foreground text-xs">{row.tafseel}</p>
                          <p className="text-[10.5px] text-muted-foreground font-normal">
                            {row.reason}
                          </p>
                          {row.notes && (
                            <p className="text-[9.5px] text-muted-foreground italic truncate max-w-sm">
                              {row.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono font-bold text-muted-foreground py-2.5 text-[11px]">
                        {row.folio}
                      </TableCell>

                      <TableCell className="text-center py-2.5">
                        <span
                          className={cn(
                            "inline-block rounded px-2 py-0.5 text-[9.5px] font-semibold border",
                            row.sourceType === "POS Sale"
                              ? "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400"
                              : row.sourceType === "Stock Purchase"
                              ? "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400"
                              : row.sourceType === "Expense"
                              ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                              : "bg-muted border-border text-foreground"
                          )}
                        >
                          {row.sourceType}
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400 py-2.5 text-xs">
                        {row.naam > 0 ? `Rs ${row.naam.toLocaleString()}` : "-"}
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 py-2.5 text-xs">
                        {row.jama > 0 ? `Rs ${row.jama.toLocaleString()}` : "-"}
                      </TableCell>

                      <TableCell className="text-right font-mono font-extrabold text-foreground py-2.5 text-xs">
                        Rs {row.balance.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right py-2.5 pe-4">
                        {row.isDeletable && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => setEntryToDelete(row.rawId)}
                            title="Delete Entry"
                          >
                            <Trash2Icon className="size-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEntries.length}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      {(isDepositModalOpen || isWithdrawModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center text-white",
                    isDepositModalOpen ? "bg-emerald-600" : "bg-rose-600"
                  )}
                >
                  {isDepositModalOpen ? <ArrowDownLeftIcon className="size-5" /> : <ArrowUpRightIcon className="size-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {isDepositModalOpen ? `+ Paisey Aaye (Jama) - ${selectedBank}` : `- Paisey Nikle (Naam) - ${selectedBank}`}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isDepositModalOpen ? "Bank me raqam jama / transfer record karein" : "Bank se raqam nikalwana / adaegi record karein"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDepositModalOpen(false);
                  setIsWithdrawModalOpen(false);
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEntry(isDepositModalOpen ? "Received" : "Paid");
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  {isDepositModalOpen ? "Kis Se Aaye? (Party / Customer / Source) *" : "Kis Ko Diye? (Party / Supplier / Reason) *"}
                </label>
                <Input
                  required
                  placeholder="e.g. Al-Madina Mills, Cash Deposit, Self Transfer..."
                  value={modalParty}
                  onChange={(e) => setModalParty(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Raqam (PKR) *</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50000"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    className="h-8.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Cheque / Slip / Ref #</label>
                  <Input
                    placeholder="e.g. CHQ-90182 or Slip #"
                    value={modalRef}
                    onChange={(e) => setModalRef(e.target.value)}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Tareekh (Date) *</label>
                <Input
                  type="date"
                  required
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Tafseel / Wajah / Notes</label>
                <Input
                  placeholder="e.g. Monthly rent, online bank transfer from Karachi..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDepositModalOpen(false);
                    setIsWithdrawModalOpen(false);
                  }}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={modalSaving}
                  className={cn(
                    "h-8 text-xs font-bold text-white cursor-pointer",
                    isDepositModalOpen ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  {modalSaving ? "Saving..." : isDepositModalOpen ? "Record Deposit (Jama)" : "Record Withdrawal (Naam)"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 border border-destructive/30">
                <Trash2Icon className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Delete Bank Transaction</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to delete this bank ledger entry?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEntryToDelete(null)}
                disabled={deleting}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete Entry"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
