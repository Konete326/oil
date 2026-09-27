import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ReceiptIcon,
  Trash2Icon,
  BookOpenIcon,
  ClockIcon,
  HandCoinsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PosConsolidatedJournalTab({
  items = [],
  onViewReceipt,
  onViewKhata,
  onViewDiary,
  onUpdateSale,
  onDeleteExpense,
  onDeleteAdvance,
  isAdmin = false,
}) {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
        <TableRow className="border-b border-border/80">
          <TableHead className="w-[110px] text-xs h-9">Date & Time</TableHead>
          <TableHead className="text-xs h-9">Ref / Voucher</TableHead>
          <TableHead className="text-xs h-9">Particulars / Party</TableHead>
          <TableHead className="text-center text-xs h-9">Category / Type</TableHead>
          <TableHead className="text-xs h-9">Payment Mode</TableHead>
          <TableHead className="text-right text-xs h-9">Inflow (+)</TableHead>
          <TableHead className="text-right text-xs h-9">Outflow (-)</TableHead>
          <TableHead className="text-right text-xs h-9 pe-4">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isSale = item.type === "Sale";
          const isUdhar = item.type === "Udhar Sale";
          const isExpense = item.type === "Expense";
          const isStaffAdvance = item.type === "Staff Advance";

          return (
            <TableRow
              key={`${item.type}-${item.id}`}
              className={cn(
                "hover:bg-muted/20 text-xs border-b border-border/40 transition-colors",
                isUdhar && "bg-amber-500/5 dark:bg-amber-500/10",
                isExpense && "bg-rose-500/5 dark:bg-rose-500/10",
                isStaffAdvance && "bg-purple-500/5 dark:bg-purple-500/10"
              )}
            >
              <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                {new Date(item.date).toLocaleString()}
              </TableCell>

              <TableCell className="font-mono font-bold text-foreground py-2.5">
                <span
                  className={cn(
                    isSale
                      ? "text-primary"
                      : isUdhar
                      ? "text-amber-600 dark:text-amber-400"
                      : isExpense
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-purple-600 dark:text-purple-400"
                  )}
                >
                  {item.reference}
                </span>
              </TableCell>

              <TableCell className="py-2.5 font-semibold text-foreground">
                <div>
                  <p className="truncate max-w-[220px]">{item.description}</p>
                  {item.notes && (
                    <p className="text-[10px] text-muted-foreground font-normal italic truncate max-w-[220px]">
                      {item.notes}
                    </p>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-center py-2.5">
                <span
                  className={cn(
                    "inline-block rounded px-2 py-0.5 text-[10px] font-semibold border",
                    isSale && "bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-400",
                    isUdhar && "bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-400",
                    isExpense && "bg-rose-500/15 border-rose-500/35 text-rose-600 dark:text-rose-400",
                    isStaffAdvance && "bg-purple-500/15 border-purple-500/35 text-purple-600 dark:text-purple-400"
                  )}
                >
                  {item.type}
                </span>
              </TableCell>

              <TableCell className="text-muted-foreground py-2.5 text-[11px]">
                {item.paymentMode || "Cash"}
              </TableCell>

              <TableCell className="text-right font-mono font-bold py-2.5 text-xs">
                {isSale || isUdhar ? (
                  <span
                    className={cn(
                      isSale ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    + Rs {item.amount?.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              <TableCell className="text-right font-mono font-bold py-2.5 text-xs">
                {isExpense || isStaffAdvance ? (
                  <span
                    className={cn(
                      isExpense ? "text-rose-600 dark:text-rose-400" : "text-purple-600 dark:text-purple-400"
                    )}
                  >
                    - Rs {item.amount?.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              <TableCell className="text-right py-2 pe-4">
                <div className="flex items-center justify-end gap-1.5">
                  {(isSale || isUdhar) && item.raw && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-[11px] px-2.5 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                      onClick={() => onViewReceipt?.(item.raw)}
                    >
                      <ReceiptIcon className="size-3 text-primary" />
                      <span>Receipt</span>
                    </Button>
                  )}

                  {isUdhar && onUpdateSale && item.raw && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-[11px] px-2.5 cursor-pointer border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      onClick={() => onUpdateSale(item.raw)}
                      title="Udhar Wasool Karein / Update Karein"
                    >
                      <HandCoinsIcon className="size-3 text-emerald-600" />
                      <span>Wasooli</span>
                    </Button>
                  )}

                  {isUdhar && item.raw?.customerName && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-[11px] px-2.5 cursor-pointer border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      onClick={() => onViewDiary ? onViewDiary(item.raw.customerName) : onViewKhata?.(item.raw.customerName)}
                      title={`${item.raw.customerName} ka hisab-kitab`}
                    >
                      <BookOpenIcon className="size-3" />
                      <span>حساب</span>
                    </Button>
                  )}

                  {isExpense && isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                      onClick={() => onDeleteExpense?.(item.raw)}
                      title="Delete Expense"
                    >
                      <Trash2Icon className="size-3" />
                    </Button>
                  )}

                  {isStaffAdvance && isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                      onClick={() => onDeleteAdvance?.(item.raw)}
                      title="Delete Staff Advance"
                    >
                      <Trash2Icon className="size-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
