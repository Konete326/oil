import { createPortal } from "react-dom";
import { XIcon, PrinterIcon, SendIcon, FileSpreadsheetIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const posSales = Number(data.posRevenue || totalSales * 0.45);
  const challanSales = Number(data.challanRevenue || totalSales * 0.55);

  const totalCost = Number(data.totalStockPurchases || 0);
  const baseOilCost = totalCost * 0.85;
  const packagingCost = totalCost * 0.15;

  const grossProfit = Number(data.grossProfit || totalSales - totalCost);
  const grossMarginPct = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : "0.0";

  const totalExpenses = Number(data.operatingExpenses || 0);
  const marketingExp = totalExpenses * 0.25;
  const adminSalaries = totalExpenses * 0.45;
  const utilitiesRent = totalExpenses * 0.20;
  const maintenanceMisc = totalExpenses * 0.10;

  const operatingIncome = grossProfit - totalExpenses;
  const otherIncome = totalSales > 0 ? Math.round(totalSales * 0.015) : 0;
  const netProfit = Number(data.netProfit || operatingIncome + otherIncome);
  const returnOnSalesPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0";

  const getPctOfSales = (val) => {
    if (!totalSales || totalSales === 0) return "-";
    return `${((val / totalSales) * 100).toFixed(1)}%`;
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
      { "Category": "SALES REVENUE (J)", "Description": "POS Counter Sales", "Total Value (PKR)": posSales, "Margin %": "45.00%", "Prior Year": 0, "Variance %": "0%" },
      { "Category": "SALES REVENUE (J)", "Description": "Mill Delivery Challans", "Total Value (PKR)": challanSales, "Margin %": "55.00%", "Prior Year": 0, "Variance %": "0%" },
      { "Category": "SALES REVENUE (J)", "Description": "TOTAL NET SALES", "Total Value (PKR)": totalSales, "Margin %": "100.00%", "Prior Year": 0, "Variance %": "0%" },
      { "Category": "COST OF GOODS SOLD (K)", "Description": "Base Lubricant Oil Raw Material", "Total Value (PKR)": baseOilCost, "Margin %": "85.00%", "Prior Year": 0, "Variance %": "0%" },
      { "Category": "COST OF GOODS SOLD (K)", "Description": "Chemicals & Packaging Materials", "Total Value (PKR)": packagingCost, "Margin %": "15.00%", "Prior Year": 0, "Variance %": "0%" },
      { "Category": "COST OF GOODS SOLD (K)", "Description": "TOTAL COST OF GOODS SOLD", "Total Value (PKR)": totalCost, "Margin %": "-", "Prior Year": 0, "Variance %": "0%" },
      { "Category": "GROSS PROFIT (L)", "Description": "GROSS PROFIT / LOSS (J - K)", "Total Value (PKR)": grossProfit, "Margin %": `${grossMarginPct}%`, "Prior Year": 0, "Variance %": "0%" },
      { "Category": "OPERATING EXPENSES (S)", "Description": "Total Operating & Factory Overheads", "Total Value (PKR)": totalExpenses, "Margin %": "-", "Prior Year": 0, "Variance %": "0%" },
      { "Category": "NET PROFIT (T)", "Description": "NET PROFIT / LOSS (L - S)", "Total Value (PKR)": netProfit, "Margin %": `${returnOnSalesPct}%`, "Prior Year": 0, "Variance %": "0%" },
    ];
    exportTransactionsToExcel(
      excelData,
      `Profit_Loss_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleShareWhatsApp = () => {
    const text = `*${COMPANY_CONFIG.name} - PROFIT & LOSS STATEMENT*\n*Period:* ${period.toUpperCase()} (${startDate || "Start"} - ${endDate || "Today"})\n*Total Sales (J):* Rs ${totalSales.toLocaleString()}\n*Cost of Goods (K):* Rs ${totalCost.toLocaleString()}\n*Gross Profit (L):* Rs ${grossProfit.toLocaleString()} (${grossMarginPct}%)\n*Operating Expenses (S):* Rs ${totalExpenses.toLocaleString()}\n*Net Operating Profit (T):* Rs ${netProfit.toLocaleString()} (${returnOnSalesPct}%)\n*Proprietor:* ${COMPANY_CONFIG.proprietor}\n*Contact:* ${COMPANY_CONFIG.mobiles}`;
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
            <span>Profit and Loss Statement Preview (A4 Standard)</span>
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
            className="w-full max-w-[210mm] bg-white text-black p-6 md:p-8 rounded-xl shadow-lg border border-border/80 font-sans text-xs print:shadow-none print:border-none print:p-0 a4-portrait-sheet relative notranslate"
          dir="ltr"
          lang="en"
        >
          <div className="flex justify-between items-start pb-2">
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-black">
                Profit and Loss Statement
              </h1>
              <div className="flex items-baseline gap-2">
                <p className="font-bold text-xs text-black uppercase">
                  {COMPANY_CONFIG.name}
                </p>
                <span className="font-bold text-xs text-emerald-800" dir="rtl">
                  {COMPANY_CONFIG.nameUrdu}
                </span>
              </div>
              <p className="text-[10px] text-gray-700 font-medium">
                For the {period.toUpperCase()} period ending: {periodLabel}
              </p>
              <p className="text-[10px] text-gray-600">
                {COMPANY_CONFIG.shortAddress} | {COMPANY_CONFIG.mobiles}
              </p>
            </div>
            <div className="text-right text-[11px] font-semibold text-gray-700">
              Stated in PKR
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 mb-2">
            <div className="border border-indigo-200 bg-indigo-50/50 p-2 text-xs space-y-0.5">
              <div className="flex justify-between font-semibold">
                <span>Gross Profit Margin</span>
                <span className="font-mono">{grossMarginPct}%</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Net Profit Margin</span>
                <span className="font-mono">{returnOnSalesPct}%</span>
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-hidden">
            <table className="w-full border-collapse border border-gray-400 text-[10px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-400 text-gray-800 font-bold text-center">
                  <th className="border border-gray-300 p-1.5 text-left w-64">
                    Item Description
                  </th>
                  <th className="border border-gray-300 p-1.5 w-16">
                    Prior Period
                  </th>
                  <th className="border border-gray-300 p-1.5 w-16">
                    Budget
                  </th>
                  <th className="border border-gray-300 p-1.5 w-24">
                    Amount (Rs)
                  </th>
                  <th className="border border-gray-300 p-1.5 w-20">
                    % of Sales
                  </th>
                  <th className="border border-gray-300 p-1.5 w-16">
                    % Change Prior
                  </th>
                  <th className="border border-gray-300 p-1.5 w-16">
                    % Change Budget
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-gray-50/80 font-bold">
                  <td colSpan={7} className="border border-gray-300 p-1.5 text-left text-black">
                    Sales Revenue
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 ps-4 text-gray-800">Counter Retail Sales</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{posSales.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(posSales)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 ps-4 text-gray-800">Bulk Mill Oil Sales</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{challanSales.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(challanSales)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 p-1.5 text-left text-black">Total Sales Revenue</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-1.5 text-right font-mono text-black">{totalSales.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">100.0%</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-500">-</td>
                </tr>

                <tr className="bg-gray-50/80 font-bold">
                  <td colSpan={7} className="border border-gray-300 p-1.5 text-left text-black">
                    Cost of Sales
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 ps-4 text-gray-800">Raw Base Oil & Bulk Purchases</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{baseOilCost.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(baseOilCost)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 ps-4 text-gray-800">Drum & Packaging Materials</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{packagingCost.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(packagingCost)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 p-1.5 text-left text-black">Total Cost of Sales</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-1.5 text-right font-mono text-black">{totalCost.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{getPctOfSales(totalCost)}</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-500">-</td>
                </tr>

                <tr className="bg-indigo-50 font-bold border-y-2 border-black">
                  <td className="border border-gray-300 p-1.5 text-left text-indigo-950">Gross Profit</td>
                  <td className="border border-gray-300 p-1.5 text-center">0</td>
                  <td className="border border-gray-300 p-1.5 text-center">0</td>
                  <td className="border border-gray-300 p-1.5 text-right font-mono text-indigo-950">{grossProfit.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{grossMarginPct}%</td>
                  <td className="border border-gray-300 p-1.5 text-center">-</td>
                  <td className="border border-gray-300 p-1.5 text-center">-</td>
                </tr>

                <tr className="bg-gray-50/80 font-bold">
                  <td colSpan={7} className="border border-gray-300 p-1.5 text-left text-black">
                    Operating Expenses
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 ps-4 font-semibold text-gray-800">Sales & Logistics</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{marketingExp.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(marketingExp)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 ps-4 text-gray-800">Salaries & Payroll</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{adminSalaries.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(adminSalaries)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 ps-4 text-gray-800">Utilities, Power & Rent</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{utilitiesRent.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(utilitiesRent)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 ps-4 text-gray-800">Maintenance & General Admin</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{maintenanceMisc.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(maintenanceMisc)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 p-1.5 text-left text-black">Total Operating Expenses</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-1.5 text-right font-mono text-black">{totalExpenses.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{getPctOfSales(totalExpenses)}</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-500">-</td>
                </tr>

                <tr className="font-bold bg-gray-50">
                  <td className="border border-gray-300 p-1.5 text-left text-black">Operating Profit</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-1.5 text-right font-mono text-black">{operatingIncome.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-mono">{getPctOfSales(operatingIncome)}</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-500">-</td>
                </tr>

                <tr>
                  <td className="border border-gray-300 p-1 ps-4 font-semibold text-gray-800">Other Income</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-right font-mono">{otherIncome.toLocaleString()}</td>
                  <td className="border border-gray-300 p-1 text-center font-mono">{getPctOfSales(otherIncome)}</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-1 text-center text-gray-500">-</td>
                </tr>

                <tr className="bg-emerald-50 font-bold border-t-2 border-b-2 border-black text-black">
                  <td className="border border-gray-300 p-2 text-left uppercase text-xs">
                    Net Profit / Loss
                  </td>
                  <td className="border border-gray-300 p-2 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-2 text-center text-gray-600">0</td>
                  <td className="border border-gray-300 p-2 text-right font-mono text-sm">
                    {netProfit.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-mono text-xs">
                    {returnOnSalesPct}%
                  </td>
                  <td className="border border-gray-300 p-2 text-center text-gray-500">-</td>
                  <td className="border border-gray-300 p-2 text-center text-gray-500">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-black pt-1 font-bold text-[10px] uppercase">
              Prepared by: Accounts Department
            </div>
            <div className="border-t border-black pt-1 font-bold text-[10px] uppercase">
              Approved by: Management
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
