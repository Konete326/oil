import { createPortal } from "react-dom";
import { XIcon, PrinterIcon, FileSpreadsheetIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import printLogoImg from "@/assets/print_logo.png";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import { COMPANY_CONFIG } from "@/lib/company-config";

export function CashPrintStatementModal({
  isOpen,
  onClose,
  transactions = [],
  partyName = "All Parties",
  startDate = "",
  endDate = "",
  cashierName = "Active Cashier",
}) {
  if (!isOpen || typeof window === "undefined") return null;

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.transactionDate || a.date || a.createdAt || Date.now()).getTime();
    const dateB = new Date(b.transactionDate || b.date || b.createdAt || Date.now()).getTime();
    return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
  });

  let running = 0;
  const computedRows = sortedTransactions.map((t) => {
    const isInflow = t.type === "Received" || t.transactionType === "Cash Received" || t.type === "cash_in";
    const amountNum = Number(t.amount || 0);
    const inflow = isInflow ? amountNum : 0;
    const outflow = !isInflow ? amountNum : 0;
    running = running + inflow - outflow;

    const parsedDate = new Date(t.transactionDate || t.date || t.createdAt || Date.now());
    const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const formattedDate = validDate.toLocaleDateString("en-GB");

    return {
      ...t,
      date: validDate,
      formattedDate,
      particulars: t.particulars || t.description || t.notes || (isInflow ? `Received from ${t.partyName || "Party"}` : `Paid to ${t.partyName || "Party"}`),
      reference: t.reference || t.voucherNumber || t.referenceNumber || t._id?.slice(-6) || "-",
      inflow,
      outflow,
      balance: running,
    };
  });

  const totalInflow = computedRows.reduce((sum, r) => sum + r.inflow, 0);
  const totalOutflow = computedRows.reduce((sum, r) => sum + r.outflow, 0);
  const finalBalance = running;

  const handlePrint = () => {
    const orig = document.title;
    const party = (partyName || "Cash_Transactions").replace(/[^a-zA-Z0-9-_]/g, "_");
    document.title = `Al_Khaleej_Cash_Ledger_${party}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleExportExcel = () => {
    const excelData = computedRows.map((r, idx) => ({
      "Sr #": idx + 1,
      Date: r.formattedDate,
      "Party / Customer": r.partyName || r.partyId?.name || "Direct Cash",
      "Voucher #": r.reference,
      Description: r.particulars,
      "Cash Inflow (Debit)": r.inflow,
      "Cash Outflow (Credit)": r.outflow,
      "Closing Balance": r.balance,
    }));
    exportTransactionsToExcel(
      excelData,
      `Cash_Subsidiary_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const currentUserStr = localStorage.getItem("user");
  const parsedUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const activeOperator = parsedUser?.name || cashierName;

  const modalContent = (
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
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

      <div className="w-full max-w-3xl max-h-[86vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:block print:bg-white">
        <div className="w-full flex items-center justify-between border-b border-border p-2.5 px-3.5 print:hidden bg-card rounded-t-2xl shrink-0">
          <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs sm:text-sm">
            <CheckCircle2Icon className="size-4 text-emerald-500" />
            <span>Cash Book Statement Preview</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-1 text-[11px] h-7 px-2 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3 text-emerald-500" />
              <span>Excel</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1 text-[11px] h-7 px-2.5 cursor-pointer bg-primary text-primary-foreground font-medium"
            >
              <PrinterIcon className="size-3" />
              <span>Print A4</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7">
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col items-center print:overflow-visible print:p-0">
          <div
            className="w-full max-w-[210mm] bg-white text-black p-4 sm:p-6 rounded-xl shadow-lg border border-border/80 font-sans text-xs print:shadow-none print:border-none print:p-0 a4-sheet relative notranslate"
            dir="ltr"
            lang="en"
          >
            <div className="flex items-center justify-between border-b border-black pb-2 mb-2">
              <div className="flex items-center gap-2.5">
                <img src={printLogoImg} alt="Logo" className="size-10 object-contain" />
                <div className="text-left leading-tight">
                  <h1 className="text-sm font-bold uppercase tracking-wider text-black">
                    CASH BOOK STATEMENT
                  </h1>
                  <p className="text-[11px] text-black font-extrabold uppercase">
                    {COMPANY_CONFIG.name}
                  </p>
                  <p className="text-[9.5px] text-gray-700 font-semibold">
                    {COMPANY_CONFIG.tagline}
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-gray-800 text-right">
                <span className="font-bold">Annex 10</span>
                <p className="text-[9px] text-gray-600 font-sans">{COMPANY_CONFIG.email}</p>
              </div>
            </div>

            <div className="border border-black mb-2.5 text-[10px] sm:text-[10.5px]">
              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="divide-y divide-black">
                  <div className="px-2 py-0.5 flex items-center justify-between">
                    <span className="font-semibold text-black">Branch / Location:</span>
                    <span className="font-bold uppercase text-black">Main Depot / POS</span>
                  </div>
                  <div className="px-2 py-0.5 flex items-center justify-between">
                    <span className="font-semibold text-black">Cashier / Operator:</span>
                    <span className="font-semibold text-black uppercase">{activeOperator}</span>
                  </div>
                  <div className="px-2 py-0.5 flex items-center justify-between">
                    <span className="font-semibold text-black">Period:</span>
                    <span className="font-mono text-black">
                      {startDate ? new Date(startDate).toLocaleDateString("en-GB") : "Start"} — {endDate ? new Date(endDate).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-black">
                  <div className="px-2 py-0.5 flex items-center justify-between">
                    <span className="font-semibold text-black">Account / Party:</span>
                    <span className="font-bold text-black uppercase truncate max-w-[150px]">{partyName}</span>
                  </div>
                  <div className="px-2 py-0.5 flex items-center justify-between">
                    <span className="font-semibold text-black">Contact:</span>
                    <span className="text-black font-mono">{COMPANY_CONFIG.phoneDisplay}</span>
                  </div>
                  <div className="px-2 py-0.5 flex items-center justify-between">
                    <span className="font-semibold text-black">Date Printed:</span>
                    <span className="font-mono text-black">{new Date().toLocaleDateString("en-GB")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[10.5px]">
                <thead>
                  <tr className="border-b border-black text-center font-bold">
                    <th rowSpan={2} className="border-r border-black p-1.5 w-18 text-center">
                      Date
                    </th>
                    <th rowSpan={2} className="border-r border-black p-1.5 text-left">
                      Description
                    </th>
                    <th rowSpan={2} className="border-r border-black p-1.5 w-18 text-center">
                      Voucher #
                    </th>
                    <th colSpan={3} className="border-b border-black p-1 text-center">
                      Amount (Rs)
                    </th>
                  </tr>
                  <tr className="border-b border-black font-bold text-center">
                    <th className="border-r border-black p-1 w-24 text-right">
                      Cash In
                    </th>
                    <th className="border-r border-black p-1 w-24 text-right">
                      Cash Out
                    </th>
                    <th className="p-1 w-24 text-right">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-sans">
                  {computedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500 border border-black italic">
                        No cash ledger records found for this period.
                      </td>
                    </tr>
                  ) : (
                    computedRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-black">
                        <td className="border-r border-black p-1 text-center font-mono text-[10px]">
                          {row.date.toLocaleDateString("en-GB")}
                        </td>
                        <td className="border-r border-black p-1 font-medium leading-tight">
                          {row.particulars}
                        </td>
                        <td className="border-r border-black p-1 text-center font-mono text-[10px]">
                          {row.reference}
                        </td>
                        <td className="border-r border-black p-1 text-right font-mono text-[10.5px]">
                          {row.inflow > 0
                            ? row.inflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : "-"}
                        </td>
                        <td className="border-r border-black p-1 text-right font-mono text-[10.5px]">
                          {row.outflow > 0
                            ? row.outflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : "-"}
                        </td>
                        <td className="p-1 text-right font-mono font-bold text-[10.5px]">
                          {row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}

                  <tr className="border-t-2 border-black font-bold bg-gray-50">
                    <td colSpan={3} className="border-r border-black p-1.5 text-right uppercase">
                      Total:
                    </td>
                    <td className="border-r border-black p-1.5 text-right font-mono text-[10.5px]">
                      {totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border-r border-black p-1.5 text-right font-mono text-[10.5px]">
                      {totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-1.5 text-right font-mono font-bold text-[10.5px]">
                      {finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between text-[10px] text-gray-700 border-t border-gray-300">
              <div>
                <span>Prepared by: <strong>{activeOperator}</strong></span>
              </div>
              <div className="flex gap-6">
                <span>Accountant Sign: ________________</span>
                <span>Manager Sign: ________________</span>
              </div>
            </div>

            <div className="mt-2.5 pt-1.5 text-center text-[8.5px] text-gray-500 font-mono tracking-wider border-t border-gray-200">
              Print by elitedevagency.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
