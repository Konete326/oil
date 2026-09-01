import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PrinterIcon, XIcon, FileSpreadsheetIcon, CheckCircle2Icon } from "lucide-react";
import printLogoImg from "@/assets/print_logo.png";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import { COMPANY_CONFIG } from "@/lib/company-config";

export function CustomerPrintStatement({
  isOpen,
  onClose,
  customer,
  summary,
  posSales,
  ledgerEntries,
  data,
}) {
  if (!isOpen || typeof window === "undefined") return null;

  const currentCustomer = customer || data?.customer || { name: "Customer Khata", phone: "-", city: "Karachi", openingBalance: 0 };
  const allPosSales = Array.isArray(posSales) ? posSales : Array.isArray(data?.posSales) ? data.posSales : [];
  const allLedgerEntries = Array.isArray(ledgerEntries) ? ledgerEntries : Array.isArray(data?.ledgerEntries) ? data.ledgerEntries : [];

  const handlePrint = () => {
    const orig = document.title;
    const cust = (currentCustomer.name || "Customer").replace(/[^a-zA-Z0-9-_]/g, "_");
    document.title = `Al_Khaleej_Customer_Ledger_${cust}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const openingBal = Number(currentCustomer.openingBalance || 0);

  const extractDocNumber = (val) => {
    if (!val || val === "-") return "-";
    const num = String(val).replace(/[^0-9]/g, "");
    return num || String(val);
  };

  const getShortPaymentDesc = (mode, bankName, isCredit = true) => {
    const m = (mode || "").toLowerCase();
    if (m.includes("bank") || bankName) {
      const b = bankName ? bankName.split("-")[0].trim() : "";
      return b ? `Bank (${b})` : "Bank Transfer";
    }
    if (m.includes("cheque")) return "Cheque";
    if (m.includes("cash") || m.includes("naqad") || isCredit) return "Cash";
    return "Invoice";
  };

  const rawRows = [];

  if (allLedgerEntries && allLedgerEntries.length > 0) {
    allLedgerEntries.forEach((entry) => {
      const isDebit = entry.transactionType?.toLowerCase().includes("debit") || entry.type?.toLowerCase().includes("debit") || (entry.debit && entry.debit > 0);
      const isCredit = entry.transactionType?.toLowerCase().includes("credit") || entry.type?.toLowerCase().includes("credit") || (entry.credit && entry.credit > 0);

      const debitAmt = entry.debit !== undefined ? Number(entry.debit) : isDebit ? Number(entry.amount || 0) : 0;
      const creditAmt = entry.credit !== undefined ? Number(entry.credit) : isCredit ? Number(entry.amount || 0) : 0;

      const transType = String(entry.transactionType || entry.type || "").toLowerCase();
      const isPayment = transType.includes("payment") || !!entry.paymentMode;
      const isPurchase = transType.includes("purchase");

      let shortDesc = "Entry";
      if (isPayment) {
        const bankName = entry.bankAccountName || entry.bankAccount?.bankName || entry.bankName;
        const payMode = entry.paymentMode || (bankName ? "Bank Transfer" : "Cash");
        shortDesc = getShortPaymentDesc(payMode, bankName, true);
      } else if (isPurchase) {
        shortDesc = "Stock Purchase";
      } else if (creditAmt > 0) {
        shortDesc = getShortPaymentDesc(entry.paymentMode, entry.bankAccountName || entry.bankAccount?.bankName, true);
      } else {
        shortDesc = entry.notes || entry.description || "Invoice";
      }

      rawRows.push({
        date: new Date(entry.createdAt || entry.date || Date.now()),
        docNo: extractDocNumber(entry.referenceNumber || entry.referenceNo || entry.voucherNumber || entry._id?.slice(-6)),
        description: shortDesc,
        type: debitAmt > 0 ? "Debit" : "Credit",
        debit: debitAmt,
        credit: creditAmt,
      });
    });
  }

  if (allPosSales && allPosSales.length > 0) {
    allPosSales.forEach((sale) => {
      rawRows.push({
        date: new Date(sale.createdAt || Date.now()),
        docNo: extractDocNumber(sale.saleNumber),
        description: "POS Invoice",
        type: "Debit",
        debit: Number(sale.grandTotal || sale.totalAmount || 0),
        credit: 0,
      });

      if (sale.paymentMode?.toLowerCase().includes("cash") || sale.paymentMode?.toLowerCase().includes("paid") || sale.paymentMode?.toLowerCase().includes("bank")) {
        const payDesc = getShortPaymentDesc(sale.paymentMode, sale.bankAccountName, true);
        rawRows.push({
          date: new Date(sale.createdAt || Date.now()),
          docNo: extractDocNumber(sale.saleNumber),
          description: payDesc,
          type: "Credit",
          debit: 0,
          credit: Number(sale.grandTotal || sale.totalAmount || 0),
        });
      }
    });
  }

  rawRows.sort((a, b) => a.date - b.date);

  let runningBalance = openingBal;
  const computedRows = rawRows.map((r) => {
    runningBalance += (Number(r.debit) || 0) - (Number(r.credit) || 0);
    const safeDate = r.date instanceof Date && !isNaN(r.date.getTime()) ? r.date : new Date();
    return {
      ...r,
      date: safeDate,
      dateStr: safeDate.toLocaleDateString("en-GB"),
      ref: r.docNo || "-",
      branch: r.branch || "Main Depot",
      narration: r.description || "-",
      balance: runningBalance,
    };
  });

  const totalDebit = computedRows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const totalCredit = computedRows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const finalBalance = runningBalance;

  const handleExportExcel = () => {
    exportTransactionsToExcel({
      title: `CUSTOMER_LEDGER_${currentCustomer.name.replace(/\s+/g, "_")}`,
      subtitle: `Customer: ${currentCustomer.name} | Phone: ${currentCustomer.phone || "-"} | Address: ${currentCustomer.address || currentCustomer.zone || "-"}`,
      headers: ["Date", "Invoice No", "Description", "Debit (Rs)", "Credit (Rs)", "Balance (Rs)"],
      data: computedRows.map((r) => ({
        "Date": r.dateStr,
        "Invoice No": r.ref,
        "Description": r.narration,
        "Debit (Rs)": r.debit,
        "Credit (Rs)": r.credit,
        "Balance (Rs)": r.balance,
      })),
      totalDebit,
      totalCredit,
      closingBalance: finalBalance,
    });
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

      <div className="w-full max-w-2xl max-h-[88vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:p-0 print:block print:bg-white">
        <div className="w-full flex items-center justify-between border-b border-border p-3 print:hidden bg-card rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
            <CheckCircle2Icon className="size-4 text-emerald-500" />
            <span>Customer Statement Preview</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-1 text-[11px] h-7.5 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3 text-emerald-500" />
              <span>Excel</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1 text-[11px] h-7.5 cursor-pointer bg-primary text-primary-foreground font-medium"
            >
              <PrinterIcon className="size-3" />
              <span>Print A4</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer size-7">
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col items-center print:overflow-visible print:p-0">
          <div className="w-full max-w-[620px] bg-white text-black p-4 sm:p-6 rounded-xl shadow-lg border border-border/80 font-sans text-xs print:shadow-none print:border-none print:p-0 a4-sheet relative notranslate" dir="ltr" lang="en">
          
          <div className="border-b-2 border-black pb-3 mb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <img src={printLogoImg} alt="Al Khaleej Logo" className="size-12 object-contain" />
                <div>
                  <div className="flex items-baseline gap-2">
                    <h1 className="font-extrabold text-base tracking-tight text-black uppercase">
                      {COMPANY_CONFIG.name}
                    </h1>
                  </div>
                  <p className="text-[10px] text-gray-700 font-semibold">
                    {COMPANY_CONFIG.address}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {COMPANY_CONFIG.phoneDisplay} | {COMPANY_CONFIG.mobiles}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="font-bold text-xs uppercase underline">
                  ACCOUNT STATEMENT
                </span>
                <p className="text-[10px] text-gray-700 pt-1">
                  Date: {new Date().toLocaleDateString("en-GB")}
                </p>
                <p className="text-[9px] text-gray-600 font-sans">{COMPANY_CONFIG.email}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 mb-2 text-xs">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase font-bold text-gray-700">Customer Details:</p>
              <p className="font-bold text-sm text-black uppercase">{currentCustomer.name}</p>
              <p className="text-[11px] text-gray-700">{currentCustomer.address || "Main Industrial Depot"}, {currentCustomer.city || "Karachi"}</p>
              {currentCustomer.phone && <p className="text-[11px] text-gray-700">Phone: {currentCustomer.phone}</p>}
            </div>

            <div className="space-y-0.5 text-right font-mono">
              <p className="text-[10px] font-sans uppercase font-bold text-gray-700">Summary:</p>
              {openingBal > 0 && (
                <p className="text-[11px] text-gray-800">
                  Opening Balance: <strong>Rs {openingBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </p>
              )}
              <p className="text-[11px] text-gray-800">Total Billed: <strong>Rs {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
              <p className="text-[11px] text-gray-800">Total Paid: <strong>Rs {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
            </div>
          </div>

          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="border-b-2 border-black font-bold uppercase text-[10.5px]">
                  <th className="py-1.5 px-1.5 w-18 text-left">Date</th>
                  <th className="py-1.5 px-1.5 w-14 text-left font-mono">Inv #</th>
                  <th className="py-1.5 px-1.5 text-left">Description</th>
                  <th className="py-1.5 px-1.5 text-right w-20">Billed (Rs)</th>
                  <th className="py-1.5 px-1.5 text-right w-20">Paid (Rs)</th>
                  <th className="py-1.5 px-1.5 text-right w-22">Balance (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-sans">
                {openingBal > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-1.5 px-1.5 font-mono text-gray-700">
                      {new Date(currentCustomer.createdAt || Date.now()).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono text-gray-700">-</td>
                    <td className="py-1.5 px-1.5 font-medium text-black">Opening Bal</td>
                    <td className="py-1.5 px-1.5 text-right font-mono text-gray-700">-</td>
                    <td className="py-1.5 px-1.5 text-right font-mono text-gray-700">-</td>
                    <td className="py-1.5 px-1.5 text-right font-mono font-semibold text-black">
                      {openingBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {computedRows.length === 0 && openingBal === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500 italic">
                      No invoices or transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  computedRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-1.5 px-1.5 font-mono text-gray-800">
                        {row.date.toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-1.5 px-1.5 font-mono font-bold text-gray-900">{row.ref}</td>
                      <td className="py-1.5 px-1.5 text-black font-medium leading-tight">{row.narration}</td>
                      <td className="py-1.5 px-1.5 text-right font-mono text-gray-900">
                        {row.debit > 0
                          ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "0.00"}
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-mono text-gray-900">
                        {row.credit > 0
                          ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "0.00"}
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-mono font-semibold text-black">
                        {row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}

                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={3} className="py-1.5 px-1.5 text-left uppercase">
                    Total:
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono">
                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono">
                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-1.5 px-1.5"></td>
                </tr>

                <tr className="border-t border-black font-bold bg-gray-50">
                  <td colSpan={3} className="py-2 px-1.5 text-left uppercase text-xs">
                    Current Net Balance
                  </td>
                  <td colSpan={2}></td>
                  <td className="py-2 px-1.5 text-right font-mono text-xs text-black">
                    {finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-black pt-1 font-bold text-[10px] uppercase">
              Customer Signature
            </div>
            <div className="border-t border-black pt-1 font-bold text-[10px] uppercase">
              Authorized Signature
            </div>
          </div>

          <div className="mt-3 pt-2 text-center text-[8.5px] text-gray-500 font-mono tracking-wider border-t border-gray-200">
            Print by elitedevagency.com
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
