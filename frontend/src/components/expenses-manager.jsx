import { useState, useEffect } from "react";
import {
  ReceiptIcon,
  PlusIcon,
  SearchIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  CalendarIcon,
  Trash2Icon,
  ArrowDownRightIcon,
  TagIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExpenseModal } from "@/components/expense-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationControl } from "@/components/pagination-control";
import { fetchExpensesApi, deleteExpenseApi } from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function ExpensesManager() {
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadExpensesData = async () => {
    try {
      setLoading(true);
      const params = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;

      const [res, dailyRes] = await Promise.all([
        fetchExpensesApi(params),
        fetchExpensesApi({ period: "daily" }),
      ]);

      if (res?.success) {
        setExpenses(res.data);
        setTotalAmount(res.totalAmount || 0);
      }
      if (dailyRes?.success) {
        setTodayTotal(dailyRes.totalAmount || 0);
      }
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpensesData();
  }, [period, startDate, endDate, search, selectedCategory]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setDeleteLoading(true);
      await deleteExpenseApi(deletingId);
      toast.success("Expense voucher deleted!");
      setDeletingId(null);
      loadExpensesData();
    } catch (err) {
      toast.error(err.message || "Failed to delete expense");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportExcel = () => {
    const data = expenses.map((e, idx) => ({
      "S.No": idx + 1,
      Date: new Date(e.expenseDate).toLocaleDateString(),
      "Voucher No": e.voucherNumber,
      Title: e.title,
      Category: e.category,
      "Amount (PKR)": e.amount,
      "Payment Mode": e.paymentMode,
      Notes: e.notes || "-",
    }));

    exportTransactionsToExcel(data, `Expenses_Report_${period}.xlsx`);
    toast.success("Expenses report exported to Excel!");
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Expenses Management (Akhrajaat)</h1>
          <p className="text-xs text-muted-foreground">Track daily, monthly, and category-wise business operational expenses.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5 cursor-pointer text-xs"
          >
            <PlusIcon className="size-3.5" />
            <span>Record Expense Voucher</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs cursor-pointer">
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs cursor-pointer">
            <PrinterIcon className="size-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Today's Daily Expenses</span>
          <div className="text-xl font-bold font-mono text-destructive">
            Rs. {todayTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Today's Total Outflow</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Selected Period Total Expenses</span>
          <div className="text-xl font-bold font-mono text-foreground">
            Rs. {totalAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Filter: {period.toUpperCase()}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Expense Vouchers</span>
          <div className="text-xl font-bold font-mono text-foreground">
            {expenses.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Recorded Vouchers Count</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/40 text-xs">
          {[
            { id: "daily", label: "Daily Expenses (Today)" },
            { id: "monthly", label: "Monthly Expenses (This Month)" },
            { id: "custom", label: "Date-Wise Report" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                period === btn.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          {period === "custom" && (
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
          )}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Categories</option>
            <option value="Salaries & Wages">Salaries & Wages</option>
            <option value="Utilities">Utilities</option>
            <option value="Transport & Freight">Transport & Freight</option>
            <option value="Rent">Rent</option>
            <option value="Maintenance & Repairs">Maintenance & Repairs</option>
            <option value="Office Petty Cash">Office Petty Cash</option>
            <option value="Tax & Licenses">Tax & Licenses</option>
            <option value="Other">Other</option>
          </select>

          <div className="relative w-full sm:w-48">
            <SearchIcon className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-8 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Date</th>
                <th className="p-3">Voucher No</th>
                <th className="p-3">Title / Particulars</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Amount (PKR)</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3 pe-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading expense vouchers...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 ps-4 text-muted-foreground text-[11px]">
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{exp.voucherNumber}</td>
                    <td className="p-3 font-semibold text-foreground">{exp.title}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-destructive">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground">{exp.paymentMode || "Cash"}</td>
                    <td className="p-3 pe-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(exp._id)}
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

        <PaginationControl
          page={page}
          pages={Math.ceil(expenses.length / 10) || 1}
          total={expenses.length}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadExpensesData}
      />

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Expense Voucher"
        message="Are you sure you want to delete this expense voucher? This action cannot be undone."
      />
    </div>
  );
}
