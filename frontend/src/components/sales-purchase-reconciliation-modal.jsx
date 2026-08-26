import { useState } from "react";
import { createPortal } from "react-dom";
import { XIcon, PrinterIcon, SendIcon, FileSpreadsheetIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function SalesPurchaseReconciliationModal({
  isOpen,
  onClose,
  reportType = "purchases",
  purchases = [],
  sales = [],
  period = "CURRENT PERIOD",
}) {
  const [activeType, setActiveType] = useState(reportType);

  if (!isOpen || typeof window === "undefined") return null;

  const currentMonthName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }).toUpperCase();

  const purchaseRows = (purchases || []).map((p) => ({
    month: new Date(p.purchaseDate || p.createdAt || Date.now()).toLocaleDateString("en-GB"),
    tin: p.purchaseNumber || "010-534-770-000",
    name: p.supplierName || p.supplier || "Supplier",
    regName: p.registeredName || p.supplierName || "Al Khaleej Lubricants",
    address: p.address || "Korangi Industrial Area, Karachi",
    nature: "PURCHASE",
    grossTaxable: Number(p.grossAmount || p.totalAmount || 0),
    exempt: 0,
    zeroRated: 0,
    taxAmount: Number(p.taxAmount || 0),
    totalGross: Number(p.totalAmount || 0),
  }));

  const salesRows = (sales || []).map((s) => ({
    month: new Date(s.saleDate || s.createdAt || Date.now()).toLocaleDateString("en-GB"),
    tin: s.saleNumber || "010-534-770-001",
    name: s.customerName || s.millName || "Client",
    regName: s.customerName || "Commercial Client",
    address: s.address || "Karachi, Pakistan",
    nature: s.saleType || "RETAIL SALE",
    grossTaxable: Number(s.subtotal || s.grandTotal || 0),
    exempt: 0,
    zeroRated: 0,
    taxAmount: Number(s.taxAmount || 0),
    totalGross: Number(s.grandTotal || s.totalAmount || 0),
  }));

  const displayRows = activeType === "purchases" ? purchaseRows : salesRows;

  const grandGrossTaxable = displayRows.reduce((sum, r) => sum + r.grossTaxable, 0);
  const grandTax = displayRows.reduce((sum, r) => sum + r.taxAmount, 0);
  const grandTotal = displayRows.reduce((sum, r) => sum + r.totalGross, 0);

  const handlePrint = () => {
    const orig = document.title;
    document.title = `Al_Khaleej_${activeType.toUpperCase()}_Reconciliation_Report_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleExportExcel = () => {
    const data = displayRows.map((r, idx) => ({
      "Sr #": idx + 1,
      Month: r.month,
      "TIN / NTN": r.tin,
      "Name of Registered Person": r.name,
      "Registered Name": r.regName,
      Address: r.address,
      Nature: r.nature,
      "Gross Taxable (PKR)": r.grossTaxable,
      "Exempt (PKR)": r.exempt,
      "Zero Rated (PKR)": r.zeroRated,
      "Tax Amount (PKR)": r.taxAmount,
      "Total Amount (PKR)": r.totalGross,
    }));
    exportTransactionsToExcel(data, `${activeType.toUpperCase()}_Reconciliation_Report.xlsx`);
  };

  const handleShareWhatsApp = () => {
    const text = `*AL KHALEEJ LUBRICANTS - ${activeType.toUpperCase()} RECONCILIATION REPORT*\n*Period:* ${currentMonthName}\n*Total Records:* ${displayRows.length}\n*Grand Total:* Rs ${grandTotal.toLocaleString()}\n*Date:* ${new Date().toLocaleDateString()}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const modalContent = (
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
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
          .a4-landscape-sheet {
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

      <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:block print:bg-white">
        <div className="w-full flex items-center justify-between border-b border-border p-3.5 print:hidden bg-card rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/40 text-xs">
              <button
                onClick={() => setActiveType("purchases")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeType === "purchases"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Purchase Reconciliation
              </button>
              <button
                onClick={() => setActiveType("sales")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeType === "sales"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sales Reconciliation
              </button>
            </div>
            <span className="text-muted-foreground text-xs font-mono">
              ({displayRows.length} Records)
            </span>
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
              <span>Print A4 Document</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center print:overflow-visible print:p-0">
          <div
            className="w-full max-w-[287mm] bg-white text-black p-6 md:p-8 rounded-xl shadow-lg border border-border/80 font-sans text-[10px] print:shadow-none print:border-none print:p-0 a4-landscape-sheet relative notranslate"
          dir="ltr"
          lang="en"
        >
          <div className="pb-4 space-y-1">
            <h1 className="font-extrabold text-xs uppercase tracking-tight text-black">
              {activeType.toUpperCase()} TRANSACTION
            </h1>
            <p className="font-bold text-[11px] uppercase underline text-black">
              RECONCILIATION OF LISTING FOR ENFORCEMENT
            </p>
            <p className="font-bold text-[10px] uppercase text-black pt-0.5">
              FOR THE MONTH OF : <span className="underline">{currentMonthName}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 mb-1 text-[10px] leading-tight font-sans">
            <div className="space-y-0.5">
              <div className="flex">
                <span className="w-36 font-bold uppercase">TIN / NTN :</span>
                <span className="font-mono font-bold">010-534-770-000</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">OWNER'S NAME :</span>
                <span className="font-bold uppercase">AL KHALEEJ LUBRICANTS</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">OWNER'S TRADE NAME :</span>
                <span className="font-bold uppercase">AL KHALEEJ LUBRICANTS</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">OWNER'S ADDRESS :</span>
                <span>Plot #44/B, Sector 15, Korangi Industrial Area, Karachi, Pakistan</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <table className="w-full border-collapse border-2 border-black text-[9px]">
              <thead>
                <tr className="border-b-2 border-black text-center font-bold uppercase tracking-tight">
                  <th className="border border-black p-1.5 w-16">
                    TAXABLE<br /><br />MONTH<br />(1)
                  </th>
                  <th className="border border-black p-1.5 w-24">
                    TAXPAYER<br /><br />IDENTIFICATION<br />NUMBER<br />(2)
                  </th>
                  <th className="border border-black p-1.5 w-36">
                    REGISTERED NAME (IF THE<br />{activeType === "purchases" ? "SUPPLIER" : "CUSTOMER"} IS CORPORATION)<br /><br />(3)
                  </th>
                  <th className="border border-black p-1.5 w-32">
                    NAME OF {activeType === "purchases" ? "SUPPLIER" : "CUSTOMER"} (IF Sole<br />Proprietor)<br />(Last Name, First Name)<br />(4)
                  </th>
                  <th className="border border-black p-1.5 w-36">
                    {activeType === "purchases" ? "SUPPLIER'S" : "CUSTOMER'S"} ADDRESS<br /><br /><br />(5)
                  </th>
                  <th className="border border-black p-1.5 w-40 bg-yellow-300 text-black">
                    PARTICULAR<br /><br /><br />(6)
                  </th>
                  <th className="border border-black p-1.5 w-24">
                    AMOUNT OF<br /><br />GROSS {activeType === "purchases" ? "PURCHASE" : "SALE"}<br />(Excluded Input Vat)<br />(7)
                  </th>
                  <th className="border border-black p-1.5 w-20">
                    AMOUNT OF<br /><br />EXEMPT<br />{activeType === "purchases" ? "PURCHASE" : "SALE"}<br />(8)
                  </th>
                  <th className="border border-black p-1.5 w-20">
                    AMOUNT OF<br /><br />ZERO-RATED<br />{activeType === "purchases" ? "PURCHASE" : "SALE"}<br />(9)
                  </th>
                  <th className="border border-black p-1.5 w-24">
                    AMOUNT OF<br /><br />TAXABLE {activeType === "purchases" ? "PURCHASE" : "SALE"}<br />(Total PKR)<br />(10)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500 border border-black text-[11px]">
                      No {activeType} reconciliation entries recorded for this period.
                    </td>
                  </tr>
                ) : (
                  displayRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border border-black p-1 text-center font-mono">
                        {row.month}
                      </td>
                      <td className="border border-black p-1 text-center font-mono font-medium">
                        {row.tin}
                      </td>
                      <td className="border border-black p-1 font-bold uppercase leading-tight">
                        {row.corpName}
                      </td>
                      <td className="border border-black p-1 text-center text-gray-800">
                        {row.proprietor}
                      </td>
                      <td className="border border-black p-1 text-gray-800 leading-tight">
                        {row.address}
                      </td>
                      <td className="border border-black p-1 font-semibold leading-tight bg-yellow-50/50">
                        {row.particular}
                      </td>
                      <td className="border border-black p-1 text-right font-mono">
                        {row.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-black p-1 text-right font-mono text-gray-700">
                        -
                      </td>
                      <td className="border border-black p-1 text-right font-mono text-gray-700">
                        -
                      </td>
                      <td className="border border-black p-1 text-right font-mono font-bold">
                        {row.taxableTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}

                <tr className="border-t-2 border-black font-bold bg-gray-50">
                  <td colSpan={6} className="border border-black p-1.5 text-left uppercase">
                    Grand Total :
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono">
                    {totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono">
                    -
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono">
                    -
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono font-bold text-[10px]">
                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-[10px] font-bold uppercase text-black">
            END OF REPORT
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
          <span>Print A4 Document</span>
        </Button>
      </div>
    </div>
  </div>
);

return createPortal(modalContent, document.body);
}
