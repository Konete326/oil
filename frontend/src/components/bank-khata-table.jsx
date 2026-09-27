import { Trash2Icon, LandmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

export function BankKhataTable({
  loading,
  entries,
  paginatedEntries,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onDeleteEntry,
  onOpenDeposit,
  selectedBank,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-xs">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-xs space-y-2 shadow-xs">
        <LandmarkIcon className="size-8 mx-auto text-muted-foreground/40 mb-1" />
        <p className="font-semibold text-foreground text-sm">No Entries Found</p>
        <p className="text-[11px] text-muted-foreground">
          No transactions found for {selectedBank} or current filters.
        </p>
        <Button
          size="sm"
          onClick={onOpenDeposit}
          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white mt-1 cursor-pointer"
        >
          + Record First Deposit
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto max-h-[calc(100vh-320px)] min-h-[280px]">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs z-10 border-b border-border text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="p-2.5 ps-3.5 w-[90px]">Date</th>
              <th className="p-2.5">Description & Particulars</th>
              <th className="p-2.5 w-[110px]">Ref / Folio</th>
              <th className="p-2.5 w-[100px] text-center">Source</th>
              <th className="p-2.5 w-[115px] text-right text-rose-600 dark:text-rose-400">Debit (Out)</th>
              <th className="p-2.5 w-[115px] text-right text-emerald-600 dark:text-emerald-400">Credit (In)</th>
              <th className="p-2.5 w-[125px] text-right font-bold text-foreground">Balance</th>
              <th className="p-2.5 pe-3.5 w-[50px] text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginatedEntries.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  row.jama > 0 && "bg-emerald-500/[0.02]",
                  row.naam > 0 && "bg-rose-500/[0.02]"
                )}
              >
                <td className="p-2.5 ps-3.5 font-mono text-muted-foreground text-[11px] whitespace-nowrap">
                  {new Date(row.date).toLocaleDateString()}
                </td>

                <td className="p-2.5">
                  <div>
                    <span className="font-semibold text-foreground text-xs">{row.tafseel}</span>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{row.reason}</p>
                    {row.notes && (
                      <p className="text-[9.5px] text-muted-foreground/80 italic line-clamp-1">
                        {row.notes}
                      </p>
                    )}
                  </div>
                </td>

                <td className="p-2.5 font-mono font-medium text-muted-foreground text-[11px]">
                  {row.folio}
                </td>

                <td className="p-2.5 text-center">
                  <span
                    className={cn(
                      "inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold border",
                      row.sourceType === "POS Sale"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                        : row.sourceType === "Stock Purchase"
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                        : row.sourceType === "Expense"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                        : "bg-muted border-border text-foreground"
                    )}
                  >
                    {row.sourceType}
                  </span>
                </td>

                <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                  {row.naam > 0 ? `Rs ${row.naam.toLocaleString()}` : "-"}
                </td>

                <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  {row.jama > 0 ? `Rs ${row.jama.toLocaleString()}` : "-"}
                </td>

                <td className="p-2.5 text-right font-mono font-bold text-foreground text-xs">
                  Rs {row.balance.toLocaleString()}
                </td>

                <td className="p-2.5 pe-3.5 text-center">
                  {row.isDeletable ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={() => onDeleteEntry(row.rawId)}
                      title="Delete Entry"
                    >
                      <Trash2Icon className="size-3" />
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={entries.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
