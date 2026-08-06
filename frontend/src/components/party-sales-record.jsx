import { useState } from "react";
import { SearchIcon, UsersIcon, FactoryIcon, ShoppingBagIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PartySalesRecord({ partyRecords = [], loading = false }) {
  const [search, setSearch] = useState("");

  const filteredParties = partyRecords.filter((p) =>
    p.partyName.toLowerCase().includes(search.toLowerCase())
  );

  const grandTotalSales = filteredParties.reduce((sum, p) => sum + (p.totalSales || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search party sales history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="px-3 py-1.5 rounded-lg border border-border bg-primary/10 text-primary">
            Combined Party Sales: <strong>Rs. {grandTotalSales.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Party / Customer Name</th>
                <th className="p-3">Party Type</th>
                <th className="p-3 text-right">Total Sales Revenue (PKR)</th>
                <th className="p-3 text-center">Total Orders Count</th>
                <th className="p-3 pe-4 text-right">Last Purchase Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Loading party sales records...
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No party sales records found.
                  </td>
                </tr>
              ) : (
                filteredParties.map((party) => (
                  <tr key={party.partyName} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 ps-4 font-semibold text-foreground flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {party.partyName.charAt(0).toUpperCase()}
                      </div>
                      <span>{party.partyName}</span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground border border-border">
                        {party.type === "Textile Mill" ? <FactoryIcon className="size-3 text-sky-500" /> : <ShoppingBagIcon className="size-3 text-emerald-500" />}
                        {party.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-500">
                      Rs. {party.totalSales.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-mono font-medium">
                      {party.orderCount} Orders
                    </td>
                    <td className="p-3 pe-4 text-right text-muted-foreground text-[11px]">
                      {party.lastSaleDate ? new Date(party.lastSaleDate).toLocaleDateString() : "N/A"}
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
