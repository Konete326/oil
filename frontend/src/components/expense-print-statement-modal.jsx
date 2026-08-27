import { createPortal } from "react-dom";
import { XIcon, PrinterIcon, SendIcon, FileSpreadsheetIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function ExpensePrintStatementModal({
  isOpen,
  onClose,
  expenses = [],
  totalAmount = 0,
  period = "monthly",
  startDate = "",
  endDate = "",
}) {
  if (!isOpen || typeof window === "undefined") return null;

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(a.expenseDate || a.createdAt) - new Date(b.expenseDate || b.createdAt)
  );

  const grandTotal = totalAmount || sortedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const categoryTotals = sortedExpenses.reduce((acc, e) => {
    const cat = e.category || "General";
    acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  const categoryList = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const periodLabel =
    period === "daily"
      ? "Daily Statement"
      : period === "monthly"
      ? "Monthly Statement"
      : period === "custom" && (startDate || endDate)
      ? `${startDate || "Start"} to ${endDate || "End"}`
      : "All Expenses Statement";

  const handlePrint = () => {
    const orig = document.title;
    document.title = `Al_Khaleej_Expenses_Statement_${period}_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleExportExcel = () => {
    const excelData = sortedExpenses.map((exp, idx) => ({
      "Sr #": idx + 1,
      Date: new Date(exp.expenseDate || exp.createdAt || Date.now()).toLocaleDateString("en-GB"),
      "Voucher #": exp.voucherNumber || exp.referenceNo || exp._id?.slice(-6) || "-",
      "Expense Title": exp.title || exp.name || "-",
      "Expense Category": exp.category || "General",
      "Payment Mode": exp.paymentMode || "Cash",
      "Amount (PKR)": Number(exp.amount || 0),
    }));

    exportTransactionsToExcel(
      excelData,
      `Expenses_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleShareWhatsApp = () => {
    const text = `*AL KHALEEJ LUBRICANTS - EXPENSES STATEMENT*\n*Period:* ${period.toUpperCase()} (${startDate || "Start"} - ${endDate || "Today"})\n*Total Expenses:* Rs ${grandTotal.toLocaleString()}\n*Total Vouchers:* ${sortedExpenses.length}\n*Generated on:* ${new Date().toLocaleDateString()}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const currentUserStr = localStorage.getItem("user");
  const parsedUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const activeOperator = parsedUser?.name || "Accounts Officer";

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
            <span>Operational Expenses Statement Preview (A4 Standard)</span>
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
            <div className="flex justify-between items-start border-b border-black pb-3 mb-3">
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-black uppercase">
                  AL KHALEEJ LUBRICANTS
                </h1>
                <p className="font-bold text-xs text-black uppercase tracking-wider pt-0.5">
                  EXPENSES STATEMENT
                </p>
                <p className="text-[11px] text-gray-700 font-medium">
                  Plot #44/B, Sector 15, Korangi Industrial Area, Karachi, Pakistan.
                </p>
                <p className="text-[10px] text-gray-600">
                  Tel: (021) 35091244 | Korangi Industrial Area, Karachi
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="border border-black p-2 bg-gray-50 text-right">
                  <span className="text-[10px] font-bold text-gray-600 uppercase block">Total Expenses:</span>
                  <span className="text-sm font-bold font-mono text-black">
                    Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[10px] text-gray-700 font-semibold pt-0.5">
                  {periodLabel}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[10px] font-bold uppercase text-gray-800 pb-1">
                Category Breakdown
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                {categoryList.map(([cat, amt]) => (
                  <div key={cat} className="border border-black p-1.5 bg-gray-50/50 flex justify-between items-center">
                    <span className="font-semibold text-gray-800">{cat}:</span>
                    <span className="font-mono font-bold text-black">Rs. {amt.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 overflow-hidden">
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-bold uppercase tracking-tight text-center">
                    <th className="border border-black p-1.5 w-16">
                      Date
                    </th>
                    <th className="border border-black p-1.5 w-24">
                      Voucher #
                    </th>
                    <th className="border border-black p-1.5 text-left">
                      Description
                    </th>
                    <th className="border border-black p-1.5 w-28 text-center">
                      Category
                    </th>
                    <th className="border border-black p-1.5 w-20 text-center">
                      Payment Method
                    </th>
                    <th className="border border-black p-1.5 w-28 text-right">
                      Amount (Rs)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 border border-black">
                        No expense records recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map((e, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="border border-gray-300 p-1 text-center font-mono text-gray-800">
                          {new Date(e.expenseDate || e.createdAt).toLocaleDateString("en-GB")}
                        </td>
                        <td className="border border-gray-300 p-1 text-center font-mono font-medium text-black">
                          {e.voucherNumber || "-"}
                        </td>
                        <td className="border border-gray-300 p-1 font-semibold text-black leading-tight">
                          {e.title}
                        </td>
                        <td className="border border-gray-300 p-1 text-center text-[9px] uppercase font-medium text-gray-700">
                          {e.category}
                        </td>
                        <td className="border border-gray-300 p-1 text-center text-[9px] font-mono text-gray-700">
                          {e.paymentMode || "Cash"}
                        </td>
                        <td className="border border-gray-300 p-1 text-right font-mono font-bold text-gray-900">
                          {Number(e.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}

                  <tr className="border-t-2 border-black font-bold bg-gray-100 text-xs">
                    <td colSpan={5} className="border border-black p-2 text-left uppercase">
                      Total Expenses:
                    </td>
                    <td className="border border-black p-2 text-right font-mono text-black">
                      {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px]">
              <div className="space-y-6">
                <div className="pt-3 border-t border-black">
                  <p className="font-bold uppercase">{activeOperator}</p>
                  <p className="text-gray-700">Prepared By</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="pt-3 border-t border-black">
                  <p className="font-bold uppercase">MANAGEMENT</p>
                  <p className="text-gray-700">Approved By</p>
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
