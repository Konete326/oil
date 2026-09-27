import { LandmarkIcon, ArrowDownLeftIcon, ArrowUpRightIcon, FileTextIcon, CreditCardIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BankKhataStats({
  currentBalance = 0,
  totalJama = 0,
  todayJama = 0,
  totalNaam = 0,
  todayNaam = 0,
  entriesCount = 0,
  activeAccount = null,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-2.5 px-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="min-w-0 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Current Balance (Baqaya)
          </span>
          <p
            className={cn(
              "text-base sm:text-lg font-bold font-mono tracking-tight",
              currentBalance >= 0 ? "text-primary" : "text-rose-500"
            )}
          >
            Rs {currentBalance.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
            <CreditCardIcon className="size-3 text-primary shrink-0" />
            <span className="font-mono font-medium truncate">
              {activeAccount?.accountNumber || "A/C"}
            </span>
            {activeAccount?.branchName && activeAccount.branchName !== "-" && (
              <span className="truncate">({activeAccount.branchName})</span>
            )}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
          <LandmarkIcon className="size-4" />
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-2.5 px-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="min-w-0 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Total Inflow (Jama)
          </span>
          <p className="text-base sm:text-lg font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            Rs {totalJama.toLocaleString()}
          </p>
          <span className="text-[10px] text-muted-foreground block">
            Today: Rs {todayJama.toLocaleString()}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <ArrowDownLeftIcon className="size-4" />
        </div>
      </div>

      <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-2.5 px-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="min-w-0 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            Total Outflow (Naam)
          </span>
          <p className="text-base sm:text-lg font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
            Rs {totalNaam.toLocaleString()}
          </p>
          <span className="text-[10px] text-muted-foreground block">
            Today: Rs {todayNaam.toLocaleString()}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
          <ArrowUpRightIcon className="size-4" />
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-2.5 px-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="min-w-0 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Ledger Records
          </span>
          <p className="text-base sm:text-lg font-bold font-mono tracking-tight text-foreground">
            {entriesCount} Transactions
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            {activeAccount?.accountType || "Active Ledger"}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-muted text-muted-foreground border border-border shrink-0">
          <FileTextIcon className="size-4" />
        </div>
      </div>
    </div>
  );
}
