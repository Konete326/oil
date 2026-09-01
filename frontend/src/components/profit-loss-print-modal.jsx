import { createPortal } from "react-dom";
import { XIcon, PrinterIcon, FileSpreadsheetIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import printLogoImg from "@/assets/print_logo.png";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import { COMPANY_CONFIG } from "@/lib/company-config";

export function ProfitLossPrintModal({
  isOpen,
  onClose,
  data = {},
  period = "monthly",
  startDate = "",
  endDate = "",
}) {
  if (!isOpen || typeof window === "undefined") return null;

  const totalSales = Number(data.totalSalesRevenue || 0);
  const posSales = Number(data.posRevenue || 0);
  const challanSales = Number(data.challanRevenue || 0);

  const totalCOGS = Number(data.totalCOGS || data.totalStockPurchases || 0);
  const posCOGS = Number(data.posCOGS || (posSales * 0.75));
  const challanCOGS = Number(data.challanCOGS || (challanSales * 0.75));

  const grossProfit = Number(data.grossProfit || (totalSales - totalCOGS));
  const grossMarginPct = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : "0.0";

  const totalExpenses = Number(data.operatingExpenses || 0);
  const expenseCategoryMap = data.expenseCategoryMap || {};
  const expenseEntries = Object.entries(expenseCategoryMap);

  const netProfit = Number(data.netProfit || (grossProfit - totalExpenses));
  const netMarginPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0";

  const getPctOfSales = (val) => {
    if (!totalSales || totalSales === 0) return "0.0%";
    return `${((Number(val) / totalSales) * 100).toFixed(1)}%`;
  };

  const periodLabel = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString("en-GB")} to ${new Date(endDate).toLocaleDateString("en-GB")}`
    : `Ending ${new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}`;

  const handlePrint = () => {
    const orig = document.title;
    document.title = `Al_Khaleej_Profit_and_Loss_Statement_${period}_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleExportExcel = () => {
    const excelData = [
      { "Category": "SALES REVENUE", "Description": "POS Counter Sales", "Total Value (PKR)": posSales, "% of Sales": getPctOfSales(posSales) },
      { "Category": "SALES REVENUE", "Description": "Mill Delivery Challans", "Total Value (PKR)": challanSales, "% of Sales": getPctOfSales(challanSales) },
      { "Category": "SALES REVENUE", "Description": "TOTAL NET SALES", "Total Value (PKR)": totalSales, "% of Sales": "100.0%" },
      { "Category": "COST OF GOODS SOLD (COGS)", "Description": "POS Sold Products Cost", "Total Value (PKR)": posCOGS, "% of Sales": getPctOfSales(posCOGS) },
      { "Category": "COST OF GOODS SOLD (COGS)", "Description": "Mill Delivery Oil Cost", "Total Value (PKR)": challanCOGS, "% of Sales": getPctOfSales(challanCOGS) },
      { "Category": "COST OF GOODS SOLD (COGS)", "Description": "TOTAL COST OF GOODS SOLD", "Total Value (PKR)": totalCOGS, "% of Sales": getPctOfSales(totalCOGS) },
      { "Category": "GROSS PROFIT", "Description": "GROSS PROFIT (SALES - COGS)", "Total Value (PKR)": grossProfit, "% of Sales": `${grossMarginPct}%` },
      ...expenseEntries.map(([cat, amt]) => ({
        "Category": "OPERATING EXPENSES",
        "Description": cat,
        "Total Value (PKR)": amt,
        "% of Sales": getPctOfSales(amt),
      })),
      { "Category": "OPERATING EXPENSES", "Description": "TOTAL OPERATING EXPENSES", "Total Value (PKR)": totalExpenses, "% of Sales": getPctOfSales(totalExpenses) },
      { "Category": "NET PROFIT", "Description": "NET PROFIT (GROSS PROFIT - EXPENSES)", "Total Value (PKR)": netProfit, "% of Sales": `${netMarginPct}%` },
    ];
    exportTransactionsToExcel(excelData, `Profit_Loss_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          .a4-portrait-sheet {
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

      <div className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:block print:bg-white">
        <div className="w-full flex items-center justify-between border-b border-border p-3.5 print:hidden bg-card rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <CheckCircle2Icon className="size-4 text-emerald-500" />
            <span>Profit and Loss Statement (Real Financials · A4 Standard)</span>
          </div>
          <div className="flex items-center gap-2">
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
            className="w-full max-w-[210mm] bg-white text-black p-6 md:p-8 rounded-xl shadow-lg border border-border/80 font-sans text-xs print:shadow-none print:border-none print:p-0 a4-portrait-sheet relative notranslate"
            dir="ltr"
            lang="en"
          >
            <div className="flex justify-between items-start pb-2 border-b-2 border-black mb-3">
              <div className="flex items-center gap-3">
                <img src={printLogoImg} alt="Al Khaleej Logo" className="size-12 object-contain" />
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-black uppercase">
                    Statement of Profit and Loss (Income Statement)
                  </h1>
                  <p className="font-bold text-xs text-black uppercase">
                    {COMPANY_CONFIG.name}
                  </p>
                  <p className="text-[10px] text-gray-700 font-medium">
                    Accounting Period ({period.toUpperCase()}): {periodLabel}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {COMPANY_CONFIG.address} | {COMPANY_CONFIG.mobiles}
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] font-semibold text-gray-700">
                <p className="font-bold text-black uppercase">{COMPANY_CONFIG.proprietor}</p>
                <p className="text-[10px] text-gray-600">Currency: PKR (Rs.)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-3 mb-2">
              <div className="border border-emerald-300 bg-emerald-50/50 p-2 text-xs space-y-0.5 rounded-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-700">Gross Profit Margin:</span>
                  <span className="font-mono font-bold text-emerald-800">{grossMarginPct}%</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-700">Gross Profit (Sales - COGS):</span>
                  <span className="font-mono font-bold text-emerald-800">Rs. {grossProfit.toLocaleString()}</span>
                </div>
              </div>

              <div className="border border-indigo-300 bg-indigo-50/50 p-2 text-xs space-y-0.5 rounded-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-700">Net Profit Margin:</span>
                  <span className="font-mono font-bold text-indigo-800">{netMarginPct}%</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-700">Net Operating Profit:</span>
                  <span className="font-mono font-bold text-indigo-800">Rs. {netProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-6 overflow-hidden">
              <table className="w-full border-collapse border border-gray-400 text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-400 text-gray-800 font-bold text-center">
                    <th className="border border-gray-300 p-1.5 text-left w-72">Financial Account Description</th>
                    <th className="border border-gray-300 p-1.5 text-left w-32">Classification</th>
                    <th className="border border-gray-300 p-1.5 w-32 text-right">Amount (PKR)</th>
                    <th className="border border-gray-300 p-1.5 w-24 text-center">% of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="border border-gray-300 p-1.5 text-left text-black uppercase">
                      1. Sales & Operating Revenue
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-1.5 ps-4 text-gray-800">Counter POS Retail Sales</td>
                    <td className="border border-gray-300 p-1.5 text-gray-600">Retail Invoices</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono font-semibold">{posSales.toLocaleString()}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{getPctOfSales(posSales)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-1.5 ps-4 text-gray-800">Textile Mill Delivery Challans</td>
                    <td className="border border-gray-300 p-1.5 text-gray-600">Bulk Oil Deliveries</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono font-semibold">{challanSales.toLocaleString()}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{getPctOfSales(challanSales)}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="border border-gray-300 p-1.5 text-left text-black">TOTAL SALES REVENUE</td>
                    <td className="border border-gray-300 p-1.5 text-gray-600">Gross Inflow</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono text-black font-bold">Rs. {totalSales.toLocaleString()}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono font-bold">100.0%</td>
                  </tr>

                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="border border-gray-300 p-1.5 text-left text-black uppercase">
                      2. Cost of Goods Sold (COGS)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-1.5 ps-4 text-gray-800">Cost of Products Sold (POS Counter)</td>
                    <td className="border border-gray-300 p-1.5 text-gray-600">Product Cost Value</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono">{posCOGS.toLocaleString()}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{getPctOfSales(posCOGS)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-1.5 ps-4 text-gray-800">Cost of Bulk Oil Sold (Mill Challans)</td>
                    <td className="border border-gray-300 p-1.5 text-gray-600">Bulk Base Oil Cost</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono">{challanCOGS.toLocaleString()}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{getPctOfSales(challanCOGS)}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="border border-gray-300 p-1.5 text-left text-black">TOTAL COST OF GOODS SOLD</td>
                    <td className="border border-gray-300 p-1.5 text-gray-600">COGS Outflow</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono text-black font-bold">Rs. {totalCOGS.toLocaleString()}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono font-bold">{getPctOfSales(totalCOGS)}</td>
                  </tr>

                  <tr className="bg-emerald-50 font-bold border-y-2 border-black">
                    <td className="border border-gray-300 p-2 text-left text-emerald-950 uppercase">
                      GROSS PROFIT (SALES - COGS)
                    </td>
                    <td className="border border-gray-300 p-2 text-emerald-900">Gross Margin</td>
                    <td className="border border-gray-300 p-2 text-right font-mono text-emerald-950 font-extrabold text-xs">
                      Rs. {grossProfit.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-mono font-extrabold text-emerald-950">
                      {grossMarginPct}%
                    </td>
                  </tr>

                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="border border-gray-300 p-1.5 text-left text-black uppercase">
                      3. Operating & Administrative Expenses
                    </td>
                  </tr>
                  {expenseEntries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="border border-gray-300 p-2 text-center text-gray-500 italic">
                        No operational expenses or salary vouchers recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    expenseEntries.map(([cat, amt]) => (
                      <tr key={cat}>
                        <td className="border border-gray-300 p-1.5 ps-4 text-gray-800">{cat}</td>
                        <td className="border border-gray-300 p-1.5 text-gray-600">Operating Expense</td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono">{Number(amt).toLocaleString()}</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">{getPctOfSales(amt)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-gray-50 font-bold">
                    <td className="border border-gray-300 p-1.5 text-left text-black">TOTAL OPERATING EXPENSES</td>
                    <td className="border border-gray-300 p-1.5 text-gray-600">Overhead Outflow</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono text-black font-bold">Rs. {totalExpenses.toLocaleString()}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono font-bold">{getPctOfSales(totalExpenses)}</td>
                  </tr>

                  <tr className="bg-indigo-50 font-bold border-t-2 border-b-2 border-black text-black">
                    <td className="border border-gray-300 p-2.5 text-left uppercase text-xs">
                      NET OPERATING PROFIT / LOSS
                    </td>
                    <td className="border border-gray-300 p-2.5 text-indigo-900 font-semibold">Net Bottom Line</td>
                    <td className={`border border-gray-300 p-2.5 text-right font-mono text-sm font-black ${netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      Rs. {netProfit.toLocaleString()}
                    </td>
                    <td className={`border border-gray-300 p-2.5 text-center font-mono text-xs font-black ${netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {netMarginPct}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-black pt-1 font-bold text-[10px] uppercase">
                Prepared by: Accounts Department
              </div>
              <div className="border-t border-black pt-1 font-bold text-[10px] uppercase">
                Approved by: {COMPANY_CONFIG.proprietor}
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
