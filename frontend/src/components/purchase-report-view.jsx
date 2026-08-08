import { useState } from "react";
import { SearchIcon, PlusIcon, PackageCheckIcon, TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";

const PAGE_SIZE = 10;

export function PurchaseReportView({ purchases = [], totalCost = 0, loading = false, onOpenModal }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.purchaseNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalQuantity = filteredPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search vendor, product, purchase #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-xs font-medium">
            <div className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-foreground">
              Total Purchases: <strong className="font-mono text-primary">Rs. {totalCost.toLocaleString()}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-foreground">
              Stock Inflow: <strong className="font-mono text-emerald-500">{totalQuantity.toLocaleString()} Units/L</strong>
            </div>
          </div>

          <Button size="sm" onClick={onOpenModal} className="gap-1.5 cursor-pointer text-xs">
            <PlusIcon className="size-3.5" />
            <span>Record Stock Purchase</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Date</th>
                <th className="p-3">Purchase #</th>
                <th className="p-3">Supplier / Vendor Name</th>
                <th className="p-3">Product Name</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Rate / Unit</th>
                <th className="p-3 text-right">Total Cost (PKR)</th>
                <th className="p-3 pe-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading stock purchase records...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No purchase entries recorded. Click "Record Stock Purchase" to add entries.
                  </td>
                </tr>
              ) : (
                filteredPurchases.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((item) => (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 ps-4 text-muted-foreground text-[11px]">
                      {new Date(item.purchaseDate || item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono font-medium">{item.purchaseNumber}</td>
                    <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                      <TruckIcon className="size-3.5 text-muted-foreground" />
                      <span>{item.supplierName}</span>
                    </td>
                    <td className="p-3 font-medium text-foreground">{item.productName}</td>
                    <td className="p-3 text-right font-mono font-medium text-emerald-500">
                      {item.quantity.toLocaleString()} {item.unitType || "Liters"}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      Rs. {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      Rs. {item.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 pe-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {item.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          currentPage={currentPage}
          totalPages={Math.ceil(filteredPurchases.length / PAGE_SIZE) || 1}
          totalItems={filteredPurchases.length}
          pageSize={PAGE_SIZE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
