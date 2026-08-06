import { useState, useEffect } from "react";
import { fetchPosSales } from "@/lib/api";
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
import { PaginationBar } from "@/components/ui/pagination-bar";
import { HistoryIcon, SearchIcon, ReceiptIcon, WalletIcon, ShoppingBagIcon, SparklesIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 7;

export function PosHistory() {
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [completedSale, setCompletedSale] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchPosSales();
    if (res && res.success) setSalesHistory(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSales = salesHistory.filter(
    (s) =>
      s.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(search)) ||
      s.saleType.toLowerCase().includes(search.toLowerCase()) ||
      s.paymentMode.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = salesHistory.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const retailCount = salesHistory.filter((s) => s.saleType === "Retail").length;
  const wholesaleCount = salesHistory.filter((s) => s.saleType === "Wholesale").length;

  const totalPages = Math.ceil(filteredSales.length / PAGE_SIZE);
  const paginatedSales = filteredSales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HistoryIcon className="size-6 text-primary" />
            POS Sales History & Receipts
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete transaction records for all retail and wholesale counter sales.
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search receipt no, customer, phone, mode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="ps-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <WalletIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total POS Counter Revenue</p>
            <p className="text-xl font-bold text-foreground">Rs {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500">
            <ShoppingBagIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Retail Transactions</p>
            <p className="text-xl font-bold text-foreground">{retailCount} Sales</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-500">
            <SparklesIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Wholesale Transactions</p>
            <p className="text-xl font-bold text-foreground">{wholesaleCount} Sales</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
            <p className="font-medium text-foreground text-sm">No Sales History Found</p>
            <p>Try clearing your search query.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[110px]">Receipt No.</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-center">Sale Type</TableHead>
                  <TableHead className="text-center">Items Purchased</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-right">Thermal Slip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale) => (
                  <TableRow key={sale._id} className="hover:bg-muted/20 text-xs">
                    <TableCell className="font-mono font-bold text-primary">
                      {sale.saleNumber}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ""}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${sale.saleType === "Wholesale" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"}`}>
                        {sale.saleType}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {sale.items?.length || 0} Items
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {sale.paymentMode}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      Rs {sale.grandTotal?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs cursor-pointer"
                        onClick={() => setCompletedSale(sale)}
                      >
                        <ReceiptIcon className="size-3.5 text-primary" />
                        <span>Print Slip</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
    </div>
  );
}
