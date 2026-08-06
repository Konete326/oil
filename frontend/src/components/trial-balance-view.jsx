import { useState } from "react";
import { ScaleIcon, CheckCircle2Icon, AlertCircleIcon, FileSpreadsheetIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function TrialBalanceView({ accounts = [], summary = {}, loading = false }) {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ScaleIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Trial Balance Sheet (Khatey Ka Tawazun)</h3>
            <p className="text-xs text-muted-foreground">Comprehensive summary balancing all ledger accounts.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
            summary.isBalanced
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
          }`}>
            {summary.isBalanced ? <CheckCircle2Icon className="size-3.5" /> : <AlertCircleIcon className="size-3.5" />}
            <span>{summary.isBalanced ? "Accounts Balanced" : "Balance Difference Present"}</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs cursor-pointer">
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs cursor-pointer">
            <PrinterIcon className="size-3.5" />
            <span>Print Sheet</span>
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
    </div>
  );
}
