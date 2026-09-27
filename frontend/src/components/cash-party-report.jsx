import { useState } from "react";
import { SearchIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CashPartyReport({ partySummaries = [], loading = false }) {
  const [search, setSearch] = useState("");

  const filteredParties = partySummaries.filter((p) =>
    p.partyName.toLowerCase().includes(search.toLowerCase())
  );

  const grandPaid = filteredParties.reduce((sum, p) => sum + (p.totalPaid || 0), 0);
  const grandReceived = filteredParties.reduce((sum, p) => sum + (p.totalReceived || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-card p-2.5 rounded-xl border border-border shadow-2xs">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search party report..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-8 text-xs h-7.5 bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 text-[11px]">
            <ArrowUpRightIcon className="size-3" />
            <span>Total Paid: <strong className="font-mono font-bold">Rs {grandPaid.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-[11px]">
            <ArrowDownLeftIcon className="size-3" />
            <span>Total Received: <strong className="font-mono font-bold">Rs {grandReceived.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10.5px] font-semibold tracking-wider">
              <tr>
                <th className="p-2.5 ps-3.5">Party / Customer Name</th>
                <th className="p-2.5 text-right">Total Paid (Out)</th>
                <th className="p-2.5 text-right">Total Received (In)</th>
                <th className="p-2.5 text-right">Net Flow</th>
                <th className="p-2.5 text-center">Entries</th>
                <th className="p-2.5 pe-3.5 text-right">Last Entry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Loading party-wise cash reports...
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No party transactions found.
                  </td>
                </tr>
              ) : (
                filteredParties.map((party) => (
                  <tr key={party.partyName} className="hover:bg-muted/20 transition-colors">
                    <td className="p-2.5 ps-3.5 font-semibold text-foreground flex items-center gap-2">
                      <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] shrink-0 border border-primary/20">
                        {party.partyName.charAt(0).toUpperCase()}
                      </div>
                      <span>{party.partyName}</span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-medium text-rose-600 dark:text-rose-400 text-xs">
                      Rs {party.totalPaid.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                      Rs {party.totalReceived.toLocaleString()}
                    </td>
                    <td className={`p-2.5 text-right font-mono font-bold text-xs ${
                      party.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {party.netBalance >= 0 ? "+" : ""}Rs {party.netBalance.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-muted text-muted-foreground border border-border">
                        {party.paidCount} Paid / {party.receivedCount} Rec
                      </span>
                    </td>
                    <td className="p-2.5 pe-3.5 text-right text-muted-foreground text-[11px] font-mono">
                      {party.lastTransactionDate ? new Date(party.lastTransactionDate).toLocaleDateString() : "-"}
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
