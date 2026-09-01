import { useState } from "react";
import { ScaleIcon, CheckCircle2Icon, AlertCircleIcon, FileSpreadsheetIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrialBalancePrintModal } from "@/components/trial-balance-print-modal";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function TrialBalanceView({ accounts = [], summary = {}, loading = false }) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleExportExcel = () => {
    const data = accounts.map((a) => ({
      "Account Code": a.code,
      "Account Title": a.accountName,
      Category: a.category,
      "Debit (PKR)": a.debit,
      "Credit (PKR)": a.credit,
    }));

    data.push({
      "Account Code": "TOTAL",
      "Account Title": "Grand Total Balance",
      Category: summary.isBalanced ? "BALANCED" : "UNBALANCED",
      "Debit (PKR)": summary.totalDebit || 0,
      "Credit (PKR)": summary.totalCredit || 0,
    });

    exportTransactionsToExcel(data, "Trial_Balance_Sheet.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ScaleIcon className="size-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Trial Balance Sheet</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
            summary.isBalanced
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}>
            {summary.isBalanced ? <CheckCircle2Icon className="size-3.5" /> : <AlertCircleIcon className="size-3.5" />}
            <span>{summary.isBalanced ? "Accounts Balanced" : "Difference Present"}</span>
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleExportExcel}
            className="size-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            title="Export to Excel"
          >
            <FileSpreadsheetIcon className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="size-8 text-primary hover:bg-primary/10 cursor-pointer"
            title="Print Trial Balance"
          >
            <PrinterIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Account Code</th>
                <th className="p-3">Account Title / Description</th>
                <th className="p-3">Classification</th>
                <th className="p-3 text-right">Debit Balance (PKR)</th>
                <th className="p-3 pe-4 text-right">Credit Balance (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Generating trial balance sheet...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No account records available.
                  </td>
                </tr>
              ) : (
                <>
                  {accounts.map((acc) => (
                    <tr key={acc.code} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 ps-4 font-mono text-muted-foreground">{acc.code}</td>
                      <td className="p-3 font-semibold text-foreground">{acc.accountName}</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          {acc.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-emerald-500">
                        {acc.debit > 0 ? `Rs. ${acc.debit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3 pe-4 text-right font-mono font-medium text-amber-500">
                        {acc.credit > 0 ? `Rs. ${acc.credit.toLocaleString()}` : "-"}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-muted/40 font-bold border-t-2 border-border text-sm">
                    <td colSpan={3} className="p-3 ps-4 text-foreground uppercase tracking-wider text-xs">
                      Grand Total Trial Balance
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-500">
                      Rs. {(summary.totalDebit || 0).toLocaleString()}
                    </td>
                    <td className="p-3 pe-4 text-right font-mono text-amber-500">
                      Rs. {(summary.totalCredit || 0).toLocaleString()}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TrialBalancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        accounts={accounts}
        summary={summary}
      />
    </div>
  );
}
