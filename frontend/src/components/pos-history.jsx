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
import { PaginationBar } from "@/components/ui/pagination-bar";
import { HistoryIcon, SearchIcon, ReceiptIcon, WalletIcon, ShoppingBagIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PAGE_SIZE = 5;

export function PosHistory() {
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [completedSale, setCompletedSale] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      if (paymentModeFilter !== "all") matchesMode = (s.paymentMode || "").toLowerCase().includes(paymentModeFilter.toLowerCase());

      return matchesSearch && matchesType && matchesMode;
    });
  }, [salesHistory, search, saleTypeFilter, paymentModeFilter]);

  const totalRevenue = useMemo(() => salesHistory.reduce((sum, s) => sum + (s.grandTotal || 0), 0), [salesHistory]);
  const retailCount = useMemo(() => salesHistory.filter((s) => s.saleType === "Retail").length, [salesHistory]);
  const wholesaleCount = useMemo(() => salesHistory.filter((s) => s.saleType === "Wholesale").length, [salesHistory]);

  const totalPages = Math.ceil(filteredSales.length / PAGE_SIZE) || 1;
  const paginatedSales = useMemo(() => {
    return filteredSales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredSales, currentPage]);

  return (
    <div className="space-y-3 p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HistoryIcon className="size-5 text-primary" />
            <span>POS Sales History & Receipts</span>
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Complete transaction records for all retail and wholesale counter sales.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <WalletIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Total Counter Revenue</p>
            <p className="text-base sm:text-lg font-bold text-foreground font-mono">Rs {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
            <ShoppingBagIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Retail Transactions</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{retailCount} Sales</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-purple-500/15 flex items-center justify-center text-purple-500 shrink-0">
            <SparklesIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Wholesale Transactions</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{wholesaleCount} Sales</p>
          </div>
        </div>
      </div>

      <div className="bg-card p-2.5 rounded-xl border border-border/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center w-full">
          <div className="relative col-span-12 md:col-span-6">
            <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search receipt no, customer name, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-7.5 bg-muted/30 focus:bg-background"
            />
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <select
              value={saleTypeFilter}
              onChange={(e) => {
                setSaleTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-7.5 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Sale Types</option>
              <option value="Retail">Retail Sales</option>
              <option value="Wholesale">Wholesale Sales</option>
            </select>
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <select
              value={paymentModeFilter}
              onChange={(e) => {
                setPaymentModeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-7.5 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Payment Modes</option>
              <option value="cash">Cash Payment</option>
              <option value="bank">Bank Transfer / Card</option>
              <option value="credit">Credit / Account</option>
            </select>
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
            <p className="font-semibold text-foreground text-xs">No Sales History Found</p>
            <p className="text-[11px]">Try clearing your search query.</p>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-270px)] min-h-[260px] overflow-y-auto overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
                  <TableRow className="border-b border-border/80">
                    <TableHead className="w-[110px] text-xs h-9">Receipt No.</TableHead>
                    <TableHead className="text-xs h-9">Date & Time</TableHead>
                    <TableHead className="text-xs h-9">Customer Name</TableHead>
                    <TableHead className="text-center text-xs h-9">Sale Type</TableHead>
                    <TableHead className="text-center text-xs h-9">Items</TableHead>
                    <TableHead className="text-xs h-9">Payment Mode</TableHead>
                    <TableHead className="text-right text-xs h-9">Grand Total</TableHead>
                    <TableHead className="text-right text-xs h-9 pe-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale._id} className="hover:bg-muted/20 text-xs border-b border-border/40">
                      <TableCell className="font-mono font-bold text-primary py-2">
                        {sale.saleNumber}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-[11px] py-2">
                        {new Date(sale.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground py-2">
                        {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ""}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[9.5px] font-semibold ${
                            sale.saleType === "Wholesale"
                              ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          }`}
                        >
                          {sale.saleType}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono py-2 text-[11px]">
                        {sale.items?.length || 0} Items
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-2 text-[11px]">
                        {sale.paymentMode}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground py-2 text-xs">
                        Rs {sale.grandTotal?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right py-2 pe-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6.5 gap-1 text-[11px] px-2 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                            onClick={() => setCompletedSale(sale)}
                          >
                            <ReceiptIcon className="size-3 text-primary" />
                            <span>View & Print A4</span>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                              onClick={() => setSaleToDelete(sale)}
                              title="Delete Sale & Restore Stock (Super Admin Only)"
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
    </div>
  );
}
