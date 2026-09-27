import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import {
  fetchPosSales,
  deletePosSaleApi,
  fetchExpensesApi,
  deleteExpenseApi,
  fetchChallans,
  fetchEmployeeAdvanceLedgerApi,
  fetchEmployeesApi,
  deleteEmployeeAdvanceApi,
} from "@/lib/api";
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
import { PosReceiptModal } from "@/components/pos-receipt-modal";
import { PosDeleteReasonModal } from "@/components/pos-delete-reason-modal";
import { ExpenseModal } from "@/components/expense-modal";
import { AdvanceModal } from "@/components/advance-modal";
import { ExpensePrintStatementModal } from "@/components/expense-print-statement-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PosUdharUpdateModal } from "@/components/pos-udhar-update-modal";
import { CustomerUdharDiaryModal } from "@/components/customer-udhar-diary-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { PosHistoryKpiCards } from "@/components/pos-history-kpi-cards";
import { PosConsolidatedJournalTab } from "@/components/pos-consolidated-journal-tab";
import {
  HistoryIcon,
  SearchIcon,
  ReceiptIcon,
  WalletIcon,
  Trash2Icon,
  PlusIcon,
  FileSpreadsheetIcon,
  ClockIcon,
  BookOpenIcon,
  CreditCardIcon,
  UsersIcon,
  HandCoinsIcon,
  CheckCircle2Icon,
  ShoppingCartIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const EXPENSE_CATEGORIES = [
  "All",
  "Salaries & Wages",
  "Utilities",
  "Transport & Freight",
  "Rent",
  "Maintenance & Repairs",
  "Office Petty Cash",
  "Official Fees & Licenses",
  "Other",
];

export function PosHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return ["sales", "expenses", "combined", "udhar"].includes(tab) ? tab : "sales";
  });

  const [udharViewMode, setUdharViewMode] = useState("bills");
  const [salesHistory, setSalesHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [staffAdvances, setStaffAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("All");

  const [completedSale, setCompletedSale] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [saleToUpdate, setSaleToUpdate] = useState(null);
  const [diaryCustomer, setDiaryCustomer] = useState(null);
  const [isDeletingSale, setIsDeletingSale] = useState(false);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPrintStatementOpen, setIsPrintStatementOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [advanceToDelete, setAdvanceToDelete] = useState(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === "admin";

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesRes, expRes, challanRes, advRes, empRes] = await Promise.all([
        fetchPosSales(),
        fetchExpensesApi({ period: "all" }),
        fetchChallans(),
        fetchEmployeeAdvanceLedgerApi({ limit: 1000 }),
        fetchEmployeesApi({ limit: 100 }),
      ]);

      const posList = (salesRes?.data || []).map((s) => ({
        ...s,
        isCredit:
          (s.paymentMode || "").toLowerCase().includes("credit") ||
          (s.paymentMode || "").toLowerCase().includes("khata"),
        source: "POS",
      }));

      const challanList = (challanRes?.data || []).map((c) => ({
        _id: c._id,
        saleNumber: c.challanNumber,
        customerName: c.millName || "Textile Mill",
        customerPhone: c.driverPhone || "",
        saleType: "Challan / Delivery",
        items: [
          {
            _id: c.product?._id || c._id,
            productName: c.productName,
            quantity: c.quantityLiters,
            unitPrice: c.ratePerLiter,
            costPrice: c.product?.costPrice || 0,
            subtotal: c.totalAmount,
          },
        ],
        subtotal: c.totalAmount,
        discount: 0,
        grandTotal: c.totalAmount,
        totalCost: (Number(c.quantityLiters) || 0) * (Number(c.product?.costPrice) || 0),
        totalProfit:
          Number(c.totalAmount) -
          (Number(c.quantityLiters) || 0) * (Number(c.product?.costPrice) || 0),
        paymentMode: "Credit / Khata",
        isCredit: true,
        isChallan: true,
        source: "Challan",
        createdAt: c.createdAt,
      }));

      const combinedSales = [...posList, ...challanList].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setSalesHistory(combinedSales);
      if (expRes?.success) setExpenses(expRes.data || []);
      if (advRes?.success && Array.isArray(advRes.data)) setStaffAdvances(advRes.data);
      if (empRes?.success && Array.isArray(empRes.data)) setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.openExpenseModal) {
      setIsExpenseModalOpen(true);
      setActiveTab("expenses");
    }
  }, [location.state]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setCurrentPage(1);
    setSearch("");
    setSearchParams(newTab === "sales" ? {} : { tab: newTab });
  };

  const handleDeleteSale = async ({ reason, notes }) => {
    if (!saleToDelete) return;
    setIsDeletingSale(true);
    try {
      const res = await deletePosSaleApi(saleToDelete._id, { reason, notes });
      if (res?.success) {
        toast.success(`POS Sale ${saleToDelete.saleNumber} deleted & inventory restored automatically`);
        setSalesHistory((prev) => prev.filter((s) => s._id !== saleToDelete._id));
        setSaleToDelete(null);
      } else {
        toast.error(res?.message || "Failed to delete sale");
      }
    } catch {
      toast.error("Error deleting POS sale");
    } finally {
      setIsDeletingSale(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      const res = await deleteExpenseApi(expenseToDelete._id);
      if (res?.success) {
        toast.success("Expense voucher deleted");
        setExpenses((prev) => prev.filter((e) => e._id !== expenseToDelete._id));
        setExpenseToDelete(null);
      } else {
        toast.error(res?.message || "Failed to delete expense");
      }
    } catch (err) {
      toast.error(err.message || "Error deleting expense");
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const handleDeleteAdvance = async () => {
    if (!advanceToDelete) return;
    try {
      const res = await deleteEmployeeAdvanceApi(advanceToDelete._id);
      if (res?.success) {
        toast.success("Staff advance deleted");
        setStaffAdvances((prev) => prev.filter((a) => a._id !== advanceToDelete._id));
        setAdvanceToDelete(null);
      } else {
        toast.error(res?.message || "Failed to delete staff advance");
      }
    } catch (err) {
      toast.error(err.message || "Error deleting advance");
    }
  };

  const handleExportExcel = () => {
    let data = [];
    let filename = "POS_Records";

    if (activeTab === "expenses") {
      filename = "Expenses_Staff_Advances";
      data = unifiedExpensesList.map((e, idx) => ({
        "S.No": idx + 1,
        Date: new Date(e.date).toLocaleDateString(),
        "Voucher No": e.voucherNumber || "-",
        Title: e.title,
        Category: e.category,
        "Amount (PKR)": e.amount,
        "Payment Mode": e.paymentMode,
        Notes: e.notes || "-",
      }));
    } else if (activeTab === "udhar") {
      filename = "Udhar_Khata_Register";
      data = filteredUdharSales.map((s, idx) => ({
        "S.No": idx + 1,
        Date: new Date(s.createdAt).toLocaleDateString(),
        "Bill No": s.saleNumber,
        Customer: s.customerName || "Walk-in Customer",
        Phone: s.customerPhone || "-",
        "Items Count": s.items?.length || 0,
        "Total Udhar (PKR)": s.grandTotal,
      }));
    } else {
      filename = "POS_Sales_History";
      data = filteredSales.map((s, idx) => ({
        "S.No": idx + 1,
        Date: new Date(s.createdAt).toLocaleString(),
        "Bill No": s.saleNumber,
        Customer: s.customerName || "Walk-in Customer",
        "Sale Type": s.saleType,
        "Payment Mode": s.paymentMode,
        "Grand Total (PKR)": s.grandTotal,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const totalRevenue = useMemo(
    () => salesHistory.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0),
    [salesHistory]
  );

  const totalCashRevenue = useMemo(
    () =>
      salesHistory
        .filter((s) => !s.isCredit)
        .reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0),
    [salesHistory]
  );

  const totalCreditRevenue = useMemo(
    () =>
      salesHistory
        .filter((s) => s.isCredit)
        .reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0),
    [salesHistory]
  );

  const creditSalesCount = useMemo(
    () => salesHistory.filter((s) => s.isCredit).length,
    [salesHistory]
  );

  const totalCOGS = useMemo(() => {
    return salesHistory.reduce((acc, s) => {
      if (s.totalCost && Number(s.totalCost) > 0) return acc + Number(s.totalCost);
      const itemCost = (s.items || []).reduce((iAcc, it) => {
        const cp = Number(it.costPrice) || 0;
        const qty = Number(it.quantity) || 1;
        return iAcc + cp * qty;
      }, 0);
      return acc + itemCost;
    }, 0);
  }, [salesHistory]);

  const grossProfit = totalRevenue - totalCOGS;

  const staffAdvancesGiven = useMemo(
    () => staffAdvances.filter((a) => a.type === "Advance Given"),
    [staffAdvances]
  );

  const totalStaffAdvances = useMemo(
    () => staffAdvancesGiven.reduce((sum, a) => sum + (Number(a.amount) || 0), 0),
    [staffAdvancesGiven]
  );

  const totalGeneralExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  const totalExpenses = totalGeneralExpenses + totalStaffAdvances;
  const netProfitOrLoss = grossProfit - totalExpenses;

  const totalCashOutflow = useMemo(() => {
    const cashExp = expenses
      .filter((e) => (e.paymentMode || "").toLowerCase().includes("cash"))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const cashAdv = staffAdvancesGiven
      .filter((a) => (a.paymentMode || "").toLowerCase().includes("cash"))
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    return cashExp + cashAdv;
  }, [expenses, staffAdvancesGiven]);

  const netCashInHand = totalCashRevenue - totalCashOutflow;

  const unifiedExpensesList = useMemo(() => {
    const exps = expenses.map((e) => ({
      _id: e._id,
      voucherNumber: e.voucherNumber || "EXP",
      date: e.expenseDate || e.createdAt,
      title: e.title,
      category: e.category || "Other",
      paymentMode: e.paymentMode || "Cash",
      amount: Number(e.amount) || 0,
      notes: e.notes,
      isStaffAdvance: false,
      raw: e,
    }));

    const advs = staffAdvancesGiven.map((a) => ({
      _id: a._id,
      voucherNumber: a.voucherNumber || "ADV",
      date: a.date || a.createdAt,
      title: `Staff Advance: ${a.employeeName}`,
      category: "Salaries & Wages",
      paymentMode: a.paymentMode || "Cash",
      amount: Number(a.amount) || 0,
      notes: a.notes,
      isStaffAdvance: true,
      raw: a,
    }));

    return [...exps, ...advs].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [expenses, staffAdvancesGiven]);

  const filteredSales = useMemo(() => {
    const q = search.toLowerCase().trim();
    return salesHistory.filter((s) => {
      const matchesSearch =
        !q ||
        (s.saleNumber && s.saleNumber.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q)) ||
        (s.saleType && s.saleType.toLowerCase().includes(q)) ||
        (s.paymentMode && s.paymentMode.toLowerCase().includes(q));

      let matchesType = true;
      if (saleTypeFilter !== "all") matchesType = s.saleType === saleTypeFilter;

      let matchesMode = true;
      if (paymentModeFilter === "cash") {
        matchesMode = !s.isCredit && (s.paymentMode || "").toLowerCase().includes("cash");
      } else if (paymentModeFilter === "credit") {
        matchesMode = s.isCredit;
      } else if (paymentModeFilter === "bank") {
        matchesMode =
          (s.paymentMode || "").toLowerCase().includes("bank") ||
          (s.paymentMode || "").toLowerCase().includes("card");
      }

      return matchesSearch && matchesType && matchesMode;
    });
  }, [salesHistory, search, saleTypeFilter, paymentModeFilter]);

  const filteredUdharSales = useMemo(() => {
    const q = search.toLowerCase().trim();
    return salesHistory
      .filter((s) => s.isCredit)
      .filter((s) => {
        if (!q) return true;
        return (
          (s.saleNumber && s.saleNumber.toLowerCase().includes(q)) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.customerPhone && s.customerPhone.includes(q)) ||
          (s.saleType && s.saleType.toLowerCase().includes(q))
        );
      });
  }, [salesHistory, search]);

  const filteredExpenses = useMemo(() => {
    const q = search.toLowerCase().trim();
    return unifiedExpensesList.filter((e) => {
      const matchesSearch =
        !q ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.voucherNumber && e.voucherNumber.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.paymentMode && e.paymentMode.toLowerCase().includes(q));

      let matchesCat = true;
      if (expenseCategoryFilter !== "All") matchesCat = e.category === expenseCategoryFilter;

      let matchesMode = true;
      if (paymentModeFilter !== "all") {
        matchesMode = (e.paymentMode || "").toLowerCase().includes(paymentModeFilter.toLowerCase());
      }

      return matchesSearch && matchesCat && matchesMode;
    });
  }, [unifiedExpensesList, search, expenseCategoryFilter, paymentModeFilter]);

  const combinedTransactions = useMemo(() => {
    const q = search.toLowerCase().trim();
    const salesMapped = salesHistory.map((s) => ({
      id: s._id,
      date: s.createdAt,
      reference: s.saleNumber,
      description: `${s.customerName || "Walk-in Customer"} (${s.saleType || "Retail"})`,
      type: s.isCredit ? "Udhar Sale" : "Sale",
      amount: Number(s.grandTotal) || 0,
      paymentMode: s.paymentMode || (s.isCredit ? "Credit / Khata" : "Cash"),
      isCredit: s.isCredit,
      raw: s,
    }));

    const expensesMapped = expenses.map((e) => ({
      id: e._id,
      date: e.expenseDate || e.createdAt,
      reference: e.voucherNumber || "EXP",
      description: `${e.title} [${e.category}]`,
      type: "Expense",
      amount: Number(e.amount) || 0,
      paymentMode: e.paymentMode || "Cash",
      isCredit: false,
      notes: e.notes,
      raw: e,
    }));

    const advancesMapped = staffAdvancesGiven.map((a) => ({
      id: a._id,
      date: a.date || a.createdAt,
      reference: a.voucherNumber || "ADV",
      description: `Staff Advance: ${a.employeeName}`,
      type: "Staff Advance",
      amount: Number(a.amount) || 0,
      paymentMode: a.paymentMode || "Cash",
      isCredit: false,
      notes: a.notes,
      raw: a,
    }));

    return [...salesMapped, ...expensesMapped, ...advancesMapped]
      .filter((item) => {
        if (!q) return true;
        return (
          item.reference.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.paymentMode.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesHistory, expenses, staffAdvancesGiven, search]);

  const customerCreditSummary = useMemo(() => {
    const map = new Map();
    salesHistory.forEach((sale) => {
      if (!sale.isCredit) return;
      const cName = sale.customerName?.trim() || "Walk-in Customer";
      const totalLtr = (sale.items || []).reduce(
        (acc, it) => acc + (Number(it.quantity) || 0),
        0
      );
      if (!map.has(cName)) {
        map.set(cName, {
          name: cName,
          phone: sale.customerPhone || "",
          billCount: 0,
          totalLiters: 0,
          totalAmount: 0,
          lastDate: sale.createdAt,
        });
      }
      const existing = map.get(cName);
      existing.billCount += 1;
      existing.totalLiters += totalLtr;
      existing.totalAmount += Number(sale.grandTotal) || 0;
      if (new Date(sale.createdAt) > new Date(existing.lastDate)) {
        existing.lastDate = sale.createdAt;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [salesHistory]);

  const filteredCustomerCreditSummary = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customerCreditSummary;
    return customerCreditSummary.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [customerCreditSummary, search]);

  const currentList =
    activeTab === "sales"
      ? filteredSales
      : activeTab === "udhar"
      ? (udharViewMode === "summary" ? filteredCustomerCreditSummary : filteredUdharSales)
      : activeTab === "expenses"
      ? filteredExpenses
      : combinedTransactions;

  const totalPages = Math.ceil(currentList.length / PAGE_SIZE) || 1;
  const paginatedItems = useMemo(() => {
    return currentList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [currentList, currentPage]);

  return (
    <div className="space-y-3 p-3 md:p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HistoryIcon className="size-5 text-primary" />
            <span>POS Sales & Transaction History</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated stock deductions, customer ledgers, and revenue records.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => navigate("/pos")}
            className="h-8.5 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3 text-xs shadow-2xs rounded-xl cursor-pointer"
          >
            <ShoppingCartIcon className="size-3.5" />
            <span>New Sale</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpenseModalOpen(true)}
            className="h-8.5 gap-1.5 border-border hover:bg-muted text-foreground text-xs px-3 rounded-xl cursor-pointer"
          >
            <PlusIcon className="size-3.5 text-rose-500" />
            <span>Expense</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdvanceModalOpen(true)}
            className="h-8.5 gap-1.5 border-border hover:bg-muted text-foreground text-xs px-3 rounded-xl cursor-pointer"
          >
            <HandCoinsIcon className="size-3.5 text-purple-500" />
            <span>Staff Advance</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8.5 gap-1.5 text-xs px-3 rounded-xl cursor-pointer border-border hover:bg-muted"
            title="Export Excel"
          >
            <FileSpreadsheetIcon className="size-3.5 text-emerald-600" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <PosHistoryKpiCards
        totalRevenue={totalRevenue}
        totalCashRevenue={totalCashRevenue}
        totalCreditRevenue={totalCreditRevenue}
        creditSalesCount={creditSalesCount}
        totalCOGS={totalCOGS}
        grossProfit={grossProfit}
        totalExpenses={totalExpenses}
        totalStaffExpenses={totalStaffAdvances}
        netProfitOrLoss={netProfitOrLoss}
        netCashInHand={netCashInHand}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/70 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange("sales")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              activeTab === "sales"
                ? "bg-card text-foreground shadow-xs font-bold border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <ReceiptIcon className="size-3.5 text-blue-500" />
            <span>Sales & Invoices</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono text-muted-foreground">
              {salesHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("udhar")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              activeTab === "udhar"
                ? "bg-card text-foreground shadow-xs font-bold border border-amber-500/40 text-amber-600 dark:text-amber-400"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <CreditCardIcon className="size-3.5 text-amber-500" />
            <span>Udhar / Credit Khata</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">
              {creditSalesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("expenses")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              activeTab === "expenses"
                ? "bg-card text-foreground shadow-xs font-bold border border-rose-500/40 text-rose-600 dark:text-rose-400"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <HandCoinsIcon className="size-3.5 text-rose-500" />
            <span>Expenses & Staff</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono">
              {unifiedExpensesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("combined")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
              activeTab === "combined"
                ? "bg-card text-foreground shadow-xs font-bold border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            <WalletIcon className="size-3.5 text-primary" />
            <span>All Journal Entries</span>
          </button>
        </div>

        {activeTab === "udhar" && (
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => {
                setUdharViewMode("bills");
                setCurrentPage(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors text-[11px]",
                udharViewMode === "bills" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Credit Bills ({creditSalesCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setUdharViewMode("summary");
                setCurrentPage(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors text-[11px]",
                udharViewMode === "summary" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Customer Accounts ({customerCreditSummary.length})
            </button>
          </div>
        )}
      </div>

      <div className="bg-card p-2.5 rounded-xl border border-border/80 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center w-full">
          <div className="relative col-span-12 md:col-span-6">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === "sales"
                  ? "Search by invoice #, customer name, phone, or payment mode..."
                  : activeTab === "udhar"
                  ? "Search udhar customer or bill..."
                  : activeTab === "expenses"
                  ? "Search expense voucher, title, staff advance, category..."
                  : "Search transaction reference, description, amount..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-8.5 bg-muted/30 focus:bg-background rounded-lg"
            />
          </div>

          {activeTab === "sales" && (
            <>
              <div className="col-span-6 md:col-span-3">
                <select
                  value={saleTypeFilter}
                  onChange={(e) => {
                    setSaleTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8.5 rounded-lg border border-input bg-background px-2 text-xs text-foreground shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Sale Types</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Challan / Delivery">Challan Delivery</option>
                </select>
              </div>

              <div className="col-span-6 md:col-span-3">
                <select
                  value={paymentModeFilter}
                  onChange={(e) => {
                    setPaymentModeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8.5 rounded-lg border border-input bg-background px-2 text-xs text-foreground shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Payment Status</option>
                  <option value="cash">Cash Paid</option>
                  <option value="credit">Udhar / Khata</option>
                  <option value="bank">Bank / Card</option>
                </select>
              </div>
            </>
          )}

          {activeTab === "expenses" && (
            <>
              <div className="col-span-6 md:col-span-3">
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => {
                    setExpenseCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8.5 rounded-lg border border-input bg-background px-2 text-xs text-foreground shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6 md:col-span-3">
                <select
                  value={paymentModeFilter}
                  onChange={(e) => {
                    setPaymentModeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8.5 rounded-lg border border-input bg-background px-2 text-xs text-foreground shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Modes</option>
                  <option value="cash">Cash</option>
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground text-sm">No Records Found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-h-[300px]">
              {activeTab === "combined" && (
                <PosConsolidatedJournalTab
                  items={paginatedItems}
                  onViewReceipt={(sale) => setCompletedSale(sale)}
                  onViewKhata={(customerName) =>
                    navigate(`/ledger?search=${encodeURIComponent(customerName)}`)
                  }
                  onViewDiary={(customerName) => setDiaryCustomer(customerName)}
                  onUpdateSale={(sale) => setSaleToUpdate(sale)}
                  onDeleteExpense={(exp) => setExpenseToDelete(exp)}
                  onDeleteAdvance={(adv) => setAdvanceToDelete(adv)}
                  isAdmin={isAdmin}
                />
              )}

              {activeTab === "sales" && (
                <Table>
                  <TableHeader className="bg-muted/70 backdrop-blur-xs">
                    <TableRow className="border-b border-border/80">
                      <TableHead className="w-[120px] text-xs h-9 font-semibold">Invoice #</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Date & Time</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Customer</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">Sale Type</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">Stock Status</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Payment</TableHead>
                      <TableHead className="text-right text-xs h-9 font-semibold">Grand Total</TableHead>
                      <TableHead className="text-right text-xs h-9 pe-4 font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((sale) => (
                      <TableRow
                        key={sale._id}
                        className={cn(
                          "hover:bg-muted/20 text-xs border-b border-border/40",
                          sale.isCredit && "bg-amber-500/5"
                        )}
                      >
                        <TableCell className="font-mono font-bold text-primary py-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{sale.saleNumber}</span>
                            {sale.source === "Challan" && (
                              <span className="rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 px-1 py-0.2 text-[9px] font-semibold">
                                Challan
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                          {new Date(sale.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground py-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{sale.customerName || "Walk-in Customer"}</span>
                            {sale.customerPhone && (
                              <span className="text-muted-foreground text-[10px]">({sale.customerPhone})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <span className="inline-block rounded-md px-2 py-0.5 text-[10px] font-medium bg-muted border border-border text-muted-foreground">
                            {sale.saleType}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2.5 text-[11px]">
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <CheckCircle2Icon className="size-3" />
                            <span>{sale.items?.length || 1} Items Deducted</span>
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-[11px]">
                          {sale.isCredit ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-400">
                              <ClockIcon className="size-3" />
                              <span>Udhar Khata</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400">
                              <span>Paid ({sale.paymentMode || "Cash"})</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold py-2.5 text-xs">
                          Rs {sale.grandTotal?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-2.5 pe-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[11px] px-2.5 rounded-lg cursor-pointer hover:border-primary hover:text-primary transition-colors"
                              onClick={() => setCompletedSale(sale)}
                            >
                              <ReceiptIcon className="size-3 text-primary" />
                              <span>Receipt</span>
                            </Button>

                            {sale.isCredit && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-[11px] px-2.5 rounded-lg cursor-pointer border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 transition-colors"
                                onClick={() => setSaleToUpdate(sale)}
                              >
                                <HandCoinsIcon className="size-3 text-emerald-600" />
                                <span>Wasooli</span>
                              </Button>
                            )}

                            {isAdmin && !sale.isChallan && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
                                onClick={() => setSaleToDelete(sale)}
                                title="Delete Sale & Restore Stock"
                              >
                                <Trash2Icon className="size-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {activeTab === "udhar" && udharViewMode === "bills" && (
                <Table>
                  <TableHeader className="bg-muted/70 backdrop-blur-xs">
                    <TableRow className="border-b border-border/80">
                      <TableHead className="w-[120px] text-xs h-9 font-semibold">Bill #</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Date</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Customer</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">Sale Type</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">Items</TableHead>
                      <TableHead className="text-right text-xs h-9 font-semibold">Pending Udhar (PKR)</TableHead>
                      <TableHead className="text-right text-xs h-9 pe-4 font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((sale) => (
                      <TableRow key={sale._id} className="hover:bg-muted/20 text-xs border-b border-border/40 bg-amber-500/5">
                        <TableCell className="font-mono font-bold text-amber-600 dark:text-amber-400 py-2.5">
                          {sale.saleNumber}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground py-2.5">
                          <button
                            type="button"
                            onClick={() => setDiaryCustomer(sale.customerName)}
                            className="font-bold text-left hover:text-primary hover:underline cursor-pointer"
                          >
                            {sale.customerName || "Walk-in Customer"}
                          </button>
                        </TableCell>
                        <TableCell className="text-center py-2.5 text-[11px]">
                          {sale.saleType}
                        </TableCell>
                        <TableCell className="text-center font-mono py-2.5 text-[11px]">
                          {sale.items?.length || 1}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-600 dark:text-amber-400 py-2.5 text-xs">
                          Rs {sale.grandTotal?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-2.5 pe-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[11px] px-2.5 rounded-lg cursor-pointer border-amber-500/40 text-amber-700 hover:bg-amber-50"
                              onClick={() => setDiaryCustomer(sale.customerName)}
                            >
                              <BookOpenIcon className="size-3 text-amber-600" />
                              <span>Diary</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[11px] px-2.5 rounded-lg cursor-pointer border-emerald-600/40 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setSaleToUpdate(sale)}
                            >
                              <HandCoinsIcon className="size-3 text-emerald-600" />
                              <span>Wasooli</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[11px] px-2.5 rounded-lg cursor-pointer"
                              onClick={() => setCompletedSale(sale)}
                            >
                              <ReceiptIcon className="size-3 text-primary" />
                              <span>Bill</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {activeTab === "udhar" && udharViewMode === "summary" && (
                <Table>
                  <TableHeader className="bg-muted/70 backdrop-blur-xs">
                    <TableRow className="border-b border-border/80">
                      <TableHead className="text-xs h-9 font-semibold">Customer / Account</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Phone</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">Total Bills</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">Total Liters</TableHead>
                      <TableHead className="text-right text-xs h-9 font-semibold">Total Udhar (PKR)</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">Last Date</TableHead>
                      <TableHead className="text-right text-xs h-9 pe-4 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((cust) => (
                      <TableRow key={cust.name} className="hover:bg-muted/20 text-xs border-b border-border/40">
                        <TableCell className="font-bold text-foreground py-2.5">
                          {cust.name}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                          {cust.phone || "-"}
                        </TableCell>
                        <TableCell className="text-center font-mono py-2.5">
                          {cust.billCount}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-foreground py-2.5">
                          {cust.totalLiters.toLocaleString()} L
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-600 dark:text-amber-400 py-2.5 text-xs">
                          Rs {cust.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-mono text-muted-foreground text-[11px] py-2.5">
                          {new Date(cust.lastDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right py-2.5 pe-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[11px] px-2.5 rounded-lg cursor-pointer border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-bold"
                              onClick={() => setDiaryCustomer(cust.name)}
                            >
                              <BookOpenIcon className="size-3 text-amber-600" />
                              <span>Udhar Diary</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[11px] px-2.5 rounded-lg cursor-pointer border-primary/40 text-primary hover:bg-primary/10"
                              onClick={() => navigate(`/ledger?search=${encodeURIComponent(cust.name)}`)}
                            >
                              <span>Khata</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {activeTab === "expenses" && (
                <Table>
                  <TableHeader className="bg-muted/70 backdrop-blur-xs">
                    <TableRow className="border-b border-border/80">
                      <TableHead className="w-[120px] text-xs h-9 font-semibold">Voucher #</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Date</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Title</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">Category</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">Payment Mode</TableHead>
                      <TableHead className="text-right text-xs h-9 font-semibold">Amount (PKR)</TableHead>
                      <TableHead className="text-right text-xs h-9 pe-4 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((exp) => (
                      <TableRow
                        key={`${exp.isStaffAdvance ? "adv" : "exp"}-${exp._id}`}
                        className={cn(
                          "hover:bg-muted/20 text-xs border-b border-border/40",
                          exp.isStaffAdvance && "bg-purple-500/5"
                        )}
                      >
                        <TableCell
                          className={cn(
                            "font-mono font-bold py-2.5",
                            exp.isStaffAdvance ? "text-purple-600 dark:text-purple-400" : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {exp.voucherNumber}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                          {new Date(exp.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <p className="font-semibold text-foreground text-xs">{exp.title}</p>
                          {exp.notes && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-xs">{exp.notes}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <span
                            className={cn(
                              "inline-block rounded-md px-2 py-0.5 text-[10px] font-medium border",
                              exp.isStaffAdvance
                                ? "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400"
                                : "bg-muted border-border"
                            )}
                          >
                            {exp.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-foreground py-2.5 text-[11px]">
                          {exp.paymentMode || "Cash"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono font-bold py-2.5 text-xs",
                            exp.isStaffAdvance ? "text-purple-600 dark:text-purple-400" : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          Rs {exp.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-2.5 pe-4">
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
                              onClick={() => {
                                if (exp.isStaffAdvance) {
                                  setAdvanceToDelete(exp.raw);
                                } else {
                                  setExpenseToDelete(exp.raw);
                                }
                              }}
                              title="Delete Record"
                            >
                              <Trash2Icon className="size-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={currentList.length}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      <PosReceiptModal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        sale={completedSale}
      />

      <PosDeleteReasonModal
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleDeleteSale}
        sale={saleToDelete}
        loading={isDeletingSale}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={loadData}
      />

      <AdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        employees={employees}
        onSuccess={loadData}
      />

      <ExpensePrintStatementModal
        isOpen={isPrintStatementOpen}
        onClose={() => setIsPrintStatementOpen(false)}
        expenses={filteredExpenses}
        totalAmount={totalExpenses}
        period="all"
      />

      <ConfirmModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense Voucher"
        message={`Are you sure you want to delete expense "${expenseToDelete?.title}" (${expenseToDelete?.voucherNumber}) of Rs ${expenseToDelete?.amount?.toLocaleString()}?`}
        loading={isDeletingExpense}
        variant="destructive"
      />

      <ConfirmModal
        isOpen={!!advanceToDelete}
        onClose={() => setAdvanceToDelete(null)}
        onConfirm={handleDeleteAdvance}
        title="Delete Staff Advance"
        message={`Are you sure you want to delete staff advance for "${advanceToDelete?.employeeName}" (${advanceToDelete?.voucherNumber}) of Rs ${advanceToDelete?.amount?.toLocaleString()}?`}
        variant="destructive"
      />

      <PosUdharUpdateModal
        isOpen={!!saleToUpdate}
        onClose={() => setSaleToUpdate(null)}
        sale={saleToUpdate}
        onSuccess={loadData}
      />

      <CustomerUdharDiaryModal
        isOpen={!!diaryCustomer}
        onClose={() => setDiaryCustomer(null)}
        customerName={diaryCustomer}
        salesHistory={salesHistory}
        onSuccess={loadData}
      />
    </div>
  );
}
