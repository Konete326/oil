import { useState } from "react";
import { SearchIcon, ArrowUpRightIcon, ArrowDownLeftIcon, UserCheckIcon, FileSpreadsheetIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CashPartyReport({ partySummaries = [], loading = false }) {
  const [search, setSearch] = useState("");

  const filteredParties = partySummaries.filter((p) =>
    p.partyName.toLowerCase().includes(search.toLowerCase())
  );

  const grandPaid = filteredParties.reduce((sum, p) => sum + (p.totalPaid || 0), 0);
  const grandReceived = filteredParties.reduce((sum, p) => sum + (p.totalReceived || 0), 0);
  const grandNet = grandReceived - grandPaid;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search party report..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
            <ArrowUpRightIcon className="size-3.5" />
            <span>Party Paid Total: <strong>Rs. {grandPaid.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <ArrowDownLeftIcon className="size-3.5" />
            <span>Party Received Total: <strong>Rs. {grandReceived.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Party / Customer Name</th>
                <th className="p-3 text-right">Party-wise Paid Cash</th>
                <th className="p-3 text-right">Party-wise Received Cash</th>
                <th className="p-3 text-right">Net Cash Flow</th>
                <th className="p-3 text-center">Transactions Count</th>
                <th className="p-3 pe-4 text-right">Last Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading party-wise cash reports...
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No party transactions found.
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
                    <td className="p-3 text-right font-mono font-medium text-amber-500">
                      Rs. {party.totalPaid.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-emerald-500">
                      Rs. {party.totalReceived.toLocaleString()}
                    </td>
                    <td className={`p-3 text-right font-mono font-semibold ${
                      party.netBalance >= 0 ? "text-emerald-500" : "text-destructive"
                    }`}>
                      {party.netBalance >= 0 ? "+" : ""}Rs. {party.netBalance.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                        {party.paidCount} Paid / {party.receivedCount} Rec
                      </span>
                    </td>
                    <td className="p-3 pe-4 text-right text-muted-foreground text-[11px]">
                      {party.lastTransactionDate ? new Date(party.lastTransactionDate).toLocaleDateString() : "N/A"}
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
