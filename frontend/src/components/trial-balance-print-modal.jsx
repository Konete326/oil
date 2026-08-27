import { createPortal } from "react-dom";
import { XIcon, PrinterIcon, SendIcon, FileSpreadsheetIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function TrialBalancePrintModal({
  isOpen,
  onClose,
  accounts = [],
  summary = {},
}) {
  if (!isOpen || typeof window === "undefined") return null;

  const totalDebit = Number(summary.totalDebit || 0);
  const totalCredit = Number(summary.totalCredit || 0);
  const isBalanced = summary.isBalanced !== undefined ? summary.isBalanced : totalDebit === totalCredit;
  const difference = Math.abs(totalDebit - totalCredit);

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    const orig = document.title;
    document.title = `Al_Khaleej_Trial_Balance_Sheet_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleExportExcel = () => {
    const excelData = accounts.map((acc, idx) => ({
      "Sr #": idx + 1,
      "Account Code": acc.code || `ACC-${1000 + idx}`,
      "Account Title / Head": acc.name || acc.title || "-",
      "Category / Classification": acc.type || acc.category || "General",
      "Debit Balance (PKR)": Number(acc.debit || 0),
      "Credit Balance (PKR)": Number(acc.credit || 0),
    }));

    exportTransactionsToExcel(
      excelData,
      `Trial_Balance_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleShareWhatsApp = () => {
    const text = `*AL KHALEEJ LUBRICANTS - TRIAL BALANCE SHEET*\n*Date:* ${currentDate}\n*Total Debits:* Rs ${totalDebit.toLocaleString()}\n*Total Credits:* Rs ${totalCredit.toLocaleString()}\n*Status:* ${isBalanced ? "BALANCED (OK)" : "DIFFERENCE: Rs " + difference.toLocaleString()}\n*Generated on:* ${new Date().toLocaleDateString()}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const modalContent = (
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 6mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-portal {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .a4-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:block print:bg-white">
        <div className="w-full flex items-center justify-between border-b border-border p-3.5 print:hidden bg-card rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <CheckCircle2Icon className="size-4 text-emerald-500" />
            <span>Trial Balance Sheet Preview (A4 Standard)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              className="gap-1.5 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <SendIcon className="size-3.5" />
              <span>Share WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
              <span>Export Excel</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs cursor-pointer bg-primary text-primary-foreground font-medium"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print A4 Statement</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center print:overflow-visible print:p-0">
          <div
            className="w-full max-w-[210mm] bg-white text-black p-6 md:p-8 rounded-xl shadow-lg border border-border/80 font-sans text-xs print:shadow-none print:border-none print:p-0 a4-sheet relative notranslate"
          dir="ltr"
          lang="en"
        >
          <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-black uppercase">
                AL KHALEEJ LUBRICANTS
              </h1>
              <p className="font-bold text-xs text-black uppercase tracking-wider pt-0.5">
                TRIAL BALANCE STATEMENT
              </p>
              <p className="text-[11px] text-gray-700 font-medium">
                Plot #44/B, Sector 15, Korangi Industrial Area, Karachi, Pakistan.
              </p>
              <p className="text-[10px] text-gray-600">
                Tel: (021) 35091244 | Korangi Industrial Area, Karachi
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                isBalanced ? "border-emerald-600 text-emerald-700 bg-emerald-50" : "border-amber-600 text-amber-700 bg-amber-50"
              }`}>
                {isBalanced ? "BALANCED" : "DIFFERENCE"}
              </span>
              <p className="text-[11px] font-mono text-gray-800 font-semibold pt-1">
                As of: {currentDate}
              </p>
            </div>
          </div>

          <div className="mb-6 overflow-hidden">
            <table className="w-full border-collapse border border-black text-[11px]">
              <thead>
                <tr className="bg-gray-100 border-b border-black font-bold uppercase text-[10px] tracking-tight">
                  <th className="border border-black p-2 w-20 text-center">
                    Code
                  </th>
                  <th className="border border-black p-2 text-left">
                    Account Name
                  </th>
                  <th className="border border-black p-2 w-28 text-center">
                    Category
                  </th>
                  <th className="border border-black p-2 w-32 text-right">
                    Debit (Rs)
                  </th>
                  <th className="border border-black p-2 w-32 text-right">
                    Credit (Rs)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 border border-black">
                      No general ledger account records found.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.code} className="border-b border-gray-200">
                      <td className="border border-gray-300 p-1.5 text-center font-mono text-gray-800">
                        {acc.code}
                      </td>
                      <td className="border border-gray-300 p-1.5 font-semibold text-black">
                        {acc.accountName}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-center text-[10px] uppercase font-medium text-gray-700">
                        {acc.category}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-right font-mono font-medium text-gray-900">
                        {acc.debit > 0
                          ? acc.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "-"}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-right font-mono font-medium text-gray-900">
                        {acc.credit > 0
                          ? acc.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}

                <tr className="border-t-2 border-black font-bold bg-gray-100 text-xs">
                  <td colSpan={3} className="border border-black p-2 text-left uppercase">
                    Total Amount
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-black">
                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-black">
                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {!isBalanced && (
                  <tr className="bg-amber-50 font-bold text-amber-900">
                    <td colSpan={3} className="border border-black p-1.5 text-left uppercase text-[10px]">
                      Difference
                    </td>
                    <td colSpan={2} className="border border-black p-1.5 text-right font-mono text-xs">
                      Rs. {difference.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-10 grid grid-cols-2 gap-12 text-xs">
            <div className="space-y-6">
              <p className="font-semibold text-[11px]">Prepared by:</p>
              <div className="pt-4 border-t border-black w-4/5">
                <p className="font-bold uppercase text-[11px]">AL KHALEEJ FINANCE</p>
                <p className="text-[10px] text-gray-700">Accountant Signature</p>
              </div>
            </div>

            <div className="space-y-6 text-right flex flex-col items-end">
              <p className="font-semibold text-[11px]">Approved by:</p>
              <div className="pt-4 border-t border-black w-4/5 text-right">
                <p className="font-bold uppercase text-[11px]">MANAGEMENT</p>
                <p className="text-[10px] text-gray-700">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-end gap-2 p-3.5 border-t border-border bg-card rounded-b-2xl print:hidden shrink-0">
        <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
          Close Preview
        </Button>
        <Button
          size="sm"
          onClick={handlePrint}
          className="cursor-pointer text-xs gap-1.5 bg-primary text-primary-foreground font-medium"
        >
          <PrinterIcon className="size-3.5" />
          <span>Print A4 Statement</span>
        </Button>
      </div>
    </div>
  </div>
);

return createPortal(modalContent, document.body);
}
