import { useState } from "react";
import { SearchIcon, ShoppingCartIcon, FactoryIcon, CalendarIcon, ArrowUpRightIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SalesReportView({ period = "monthly", setPeriod, salesData = { posSales: [], challans: [] }, summary = {}, loading = false }) {
  const [search, setSearch] = useState("");

  const allSalesList = [
    ...(salesData.posSales || []).map((s) => ({
      _id: s._id,
      type: "POS Counter",
      refNo: s.saleNumber,
      partyName: s.customerName || "Walk-in Customer",
      amount: s.grandTotal,
      mode: s.paymentMode,
      date: s.createdAt,
      status: "Completed",
    })),
    ...(salesData.challans || []).map((c) => ({
      _id: c._id,
      type: "Delivery Challan",
      refNo: c.challanNumber,
      partyName: c.millName,
      amount: c.totalAmount,
      mode: c.paymentStatus || "Billed",
      date: c.createdAt,
      status: c.gatePassStatus || "Dispatched",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredSales = allSalesList.filter(
    (s) =>
      s.partyName.toLowerCase().includes(search.toLowerCase()) ||
      s.refNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/40">
          {[
            { id: "daily", label: "Daily Sales" },
            { id: "weekly", label: "Weekly Sales" },
            { id: "monthly", label: "Monthly Sales" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                period === btn.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search sale record..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Sales Revenue ({period.toUpperCase()})</span>
            <ArrowUpRightIcon className="size-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            Rs. {(summary.totalSalesRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">{summary.totalSalesCount || 0} Total Completed Orders</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">POS Retail & Wholesale</span>
            <ShoppingCartIcon className="size-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-500">
            Rs. {(summary.posSalesTotal || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">{salesData.posSales?.length || 0} Counter Receipts</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Textile Mill DC Sales</span>
            <FactoryIcon className="size-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-500">
            Rs. {(summary.challanSalesTotal || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">{salesData.challans?.length || 0} Delivery Challans</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Date</th>
                <th className="p-3">Sale Channel</th>
                <th className="p-3">Ref / Invoice No</th>
                <th className="p-3">Customer / Mill Name</th>
                <th className="p-3 text-right">Amount (PKR)</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3 pe-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No sales records found for this period.
                  </td>
                </tr>
              ) : (
                filteredSales.map((item) => (
                  <tr key={`${item.type}-${item._id}`} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 ps-4 text-muted-foreground text-[11px]">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-semibold">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                          item.type === "POS Counter"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium">{item.refNo}</td>
                    <td className="p-3 font-medium text-foreground">{item.partyName}</td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      Rs. {item.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground">{item.mode}</td>
                    <td className="p-3 pe-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
