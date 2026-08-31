import { useState, useEffect, useMemo } from "react";
import { fetchPosSales, deletePosSaleApi } from "@/lib/api";
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
import { SalesPurchaseReconciliationModal } from "@/components/sales-purchase-reconciliation-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  HistoryIcon,
  SearchIcon,
  ReceiptIcon,
  WalletIcon,
  ShoppingBagIcon,
  Trash2Icon,
  FileSpreadsheetIcon,
  PrinterIcon,
  BanknoteIcon,
  CreditCardIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

const PAGE_SIZE = 4;

export function PosHistory() {
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [completedSale, setCompletedSale] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === "admin";

  const loadData = async () => {
    setLoading(true);
    const res = await fetchPosSales();
    if (res && res.success) setSalesHistory(res.data || []);
    setLoading(false);
  };

  const handleDeleteSale = async ({ reason, notes }) => {
    if (!saleToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deletePosSaleApi(saleToDelete._id, { reason, notes });
      if (res && res.success) {
        toast.success(`POS Sale ${saleToDelete.saleNumber} deleted & inventory restored`);
        setSalesHistory((prev) => prev.filter((s) => s._id !== saleToDelete._id));
        setSaleToDelete(null);
      } else {
        toast.error(res?.message || "Failed to delete sale");
      }
    } catch {
      toast.error("Error deleting POS sale");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const counts = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      all: salesHistory.length,
      today: salesHistory.filter((s) => new Date(s.createdAt) >= startOfDay).length,
      cash: salesHistory.filter((s) => s.paymentMode === "Cash").length,
      credit: salesHistory.filter((s) => s.paymentMode === "Credit / Khata").length,
      wholesale: salesHistory.filter((s) => s.saleType === "Wholesale").length,
      week: salesHistory.filter((s) => new Date(s.createdAt) >= sevenDaysAgo).length,
      month: salesHistory.filter((s) => new Date(s.createdAt) >= startOfMonth).length,
    };
  }, [salesHistory]);

  const filteredSales = useMemo(() => {
    const q = search.toLowerCase().trim();
    const now = new Date();

    return salesHistory.filter((s) => {
      const saleDate = new Date(s.createdAt);

      if (activeChip === "today") {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (saleDate < startOfDay) return false;
      } else if (activeChip === "cash") {
        if (s.paymentMode !== "Cash") return false;
      } else if (activeChip === "credit") {
        if (s.paymentMode !== "Credit / Khata") return false;
      } else if (activeChip === "wholesale") {
        if (s.saleType !== "Wholesale") return false;
      } else if (activeChip === "week") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (saleDate < sevenDaysAgo) return false;
      } else if (activeChip === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (saleDate < startOfMonth) return false;
      } else if (startDate || endDate) {
        if (startDate && saleDate < new Date(startDate)) return false;
        if (endDate) {
          const endD = new Date(endDate);
          endD.setHours(23, 59, 59, 999);
          if (saleDate > endD) return false;
        }
      }

      if (!q) return true;

      return (
        (s.saleNumber && s.saleNumber.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q)) ||
        (s.saleType && s.saleType.toLowerCase().includes(q)) ||
        (s.paymentMode && s.paymentMode.toLowerCase().includes(q)) ||
        (s.items && s.items.some((i) => i.productName && i.productName.toLowerCase().includes(q)))
      );
    });
  }, [salesHistory, search, activeChip, startDate, endDate]);

  const totalRevenue = useMemo(() => filteredSales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0), [filteredSales]);
  const cashSalesTotal = useMemo(() => filteredSales.filter((s) => s.paymentMode === "Cash").reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0), [filteredSales]);
  const creditSalesTotal = useMemo(() => filteredSales.filter((s) => s.paymentMode === "Credit / Khata").reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0), [filteredSales]);
  const totalUnitsSold = useMemo(() => filteredSales.reduce((sum, s) => sum + (s.items?.reduce((itemSum, item) => itemSum + (Number(item.quantity) || 1), 0) || 0), 0), [filteredSales]);

  const totalPages = Math.ceil(filteredSales.length / PAGE_SIZE) || 1;
  const paginatedSales = useMemo(() => {
    return filteredSales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredSales, currentPage]);

  const handleExportExcel = () => {
    const exportList = filteredSales.map((s, idx) => ({
      "Sr #": idx + 1,
      "Receipt No": s.saleNumber,
      Date: new Date(s.createdAt).toLocaleDateString("en-GB"),
      Time: new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      Customer: s.customerName || "Walk-in Customer",
      Phone: s.customerPhone || "-",
      "Sale Type": s.saleType || "Retail",
      Items: s.items?.map((i) => `${i.productName} (${i.quantity}x)`).join(", ") || "-",
      "Payment Mode": s.paymentMode || "Cash",
      "Subtotal (PKR)": s.subtotal || 0,
      "Discount (PKR)": s.discount || 0,
      "Grand Total (PKR)": s.grandTotal || 0,
      "Cashier": s.cashierName || "Cashier",
    }));
    exportTransactionsToExcel(exportList, `POS_Sales_History_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("POS sales report exported to Excel!");
  };

  const quickFilterTabs = [
    { id: "all", label: "All Sales", count: counts.all },
    { id: "today", label: "Today's Sales", count: counts.today },
    { id: "cash", label: "Cash Sales", count: counts.cash },
    { id: "credit", label: "Khata / Credit", count: counts.credit },
    { id: "wholesale", label: "Wholesale", count: counts.wholesale },
    { id: "week", label: "Last 7 Days", count: counts.week },
    { id: "month", label: "This Month", count: counts.month },
  ];

  return (
    <div className="space-y-4 p-3 md:p-5 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HistoryIcon className="size-5.5 text-primary" />
            <span>POS Sales History &amp; Receipts</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete counter transactions, sales reconciliation, and printable slips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs cursor-pointer h-8"
          >
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsReconcileModalOpen(true)}
            className="gap-1.5 text-xs cursor-pointer bg-primary text-primary-foreground font-medium h-8"
          >
            <PrinterIcon className="size-3.5" />
            <span>Print Sales Report</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/80 bg-card p-3 flex items-center gap-3 shadow-xs">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <WalletIcon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">Total Revenue</p>
            <p className="text-base sm:text-lg font-bold text-foreground font-mono">Rs {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-3 shadow-xs">
          <div className="size-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <BanknoteIcon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">Cash Received</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">Rs {cashSalesTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-3 shadow-xs">
          <div className="size-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <CreditCardIcon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">Khata / Credit Sales</p>
            <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">Rs {creditSalesTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 flex items-center gap-3 shadow-xs">
          <div className="size-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-500 shrink-0">
            <ShoppingBagIcon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">Invoices &amp; Cans Sold</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{filteredSales.length} Bills | {totalUnitsSold} Cans</p>
          </div>
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border/80 shadow-xs space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 min-w-0">
          {quickFilterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveChip(tab.id);
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeChip === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeChip === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-border/50">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search receipt no, customer name, phone, item name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-8 bg-muted/30 focus:bg-background"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-muted-foreground text-[11px] hidden sm:inline">Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveChip("custom");
                setCurrentPage(1);
              }}
              className="bg-card text-foreground px-2 py-1 rounded-md border border-border text-xs outline-none h-8"
            />
            <span className="text-muted-foreground text-[10px]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveChip("custom");
                setCurrentPage(1);
              }}
              className="bg-card text-foreground px-2 py-1 rounded-md border border-border text-xs outline-none h-8"
            />
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
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground text-xs">No POS Sales History Found</p>
            <p className="text-[11px]">Try selecting a different filter chip or adjusting the date range.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
                  <TableRow className="border-b border-border/80">
                    <TableHead className="w-[120px] text-xs h-9">Receipt No.</TableHead>
                    <TableHead className="w-[140px] text-xs h-9">Date &amp; Time</TableHead>
                    <TableHead className="text-xs h-9">Customer &amp; Items Sold</TableHead>
                    <TableHead className="w-[120px] text-xs h-9">Payment Mode</TableHead>
                    <TableHead className="w-[130px] text-right text-xs h-9">Grand Total</TableHead>
                    <TableHead className="w-[130px] text-right text-xs h-9 pe-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale._id} className="hover:bg-muted/20 text-xs border-b border-border/40">
                      <TableCell className="font-mono font-bold text-primary py-2.5">
                        {sale.saleNumber}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                        <div>{new Date(sale.createdAt).toLocaleDateString("en-GB")}</div>
                        <div className="text-[10px] text-muted-foreground/70">{new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </TableCell>
                      <TableCell className="py-2.5 max-w-[340px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">
                            {sale.customerName || "Walk-in Customer"}
                          </span>
                          {sale.customerPhone && (
                            <span className="text-[10.5px] text-muted-foreground font-mono font-normal">({sale.customerPhone})</span>
                          )}
                          <span
                            className={`inline-block rounded px-1.5 py-0.2 text-[9.5px] font-semibold shrink-0 ${
                              sale.saleType === "Wholesale"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {sale.saleType || "Retail"}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-muted-foreground truncate mt-0.5 font-medium">
                          {sale.items?.map((i) => `${i.productName} (${i.quantity}x)`).join(", ") || "No item details"}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-2.5 text-[11px]">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                          sale.paymentMode === "Credit / Khata"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {sale.paymentMode}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground py-2.5 text-xs">
                        Rs {sale.grandTotal?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right py-2.5 pe-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs px-2.5 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                            onClick={() => setCompletedSale(sale)}
                          >
                            <ReceiptIcon className="size-3 text-primary" />
                            <span>Slip</span>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                              onClick={() => setSaleToDelete(sale)}
                              title="Delete Sale &amp; Restore Stock (Super Admin Only)"
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSales.length}
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
        loading={isDeleting}
      />

      <SalesPurchaseReconciliationModal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        reportType="sales"
        sales={filteredSales}
        period={activeChip}
      />
    </div>
  );
}
