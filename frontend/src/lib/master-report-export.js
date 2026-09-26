import * as XLSX from "xlsx";

export function exportMasterReportToExcel(reportData, filename = "Al_Khaleej_Master_Platform_Report.xlsx") {
  if (!reportData) return;
  const { executiveSummary = {}, cashFlow = {}, expenses = {}, inventory = {}, accounts = {}, meta = {} } = reportData;

  const workbook = XLSX.utils.book_new();

  const summarySheetData = [
    { Metric: "Report Period", Value: meta.period || "N/A" },
    { Metric: "Generated Date", Value: new Date(meta.generatedAt || Date.now()).toLocaleString() },
    { Metric: "---", Value: "---" },
    { Metric: "Gross Sales Revenue (PKR)", Value: executiveSummary.grossRevenue || 0 },
    { Metric: "Cost of Goods Sold (COGS) (PKR)", Value: executiveSummary.cogs || 0 },
    { Metric: "Gross Profit (PKR)", Value: executiveSummary.grossProfit || 0 },
    { Metric: "Gross Profit Margin (%)", Value: `${executiveSummary.grossMarginPct || 0}%` },
    { Metric: "Total Operating Expenses (PKR)", Value: executiveSummary.totalExpenses || 0 },
    { Metric: "Net Profit (Khaalis Munafa) (PKR)", Value: executiveSummary.netProfit || 0 },
    { Metric: "Net Profit Margin (%)", Value: `${executiveSummary.netMarginPct || 0}%` },
    { Metric: "Total Orders Count", Value: executiveSummary.ordersCount || 0 },
    { Metric: "Total Liters Sold", Value: executiveSummary.totalLitersSold || 0 },
    { Metric: "Cash Sales (PKR)", Value: executiveSummary.cashSales || 0 },
    { Metric: "Credit / Khata Sales (PKR)", Value: executiveSummary.creditSales || 0 },
    { Metric: "---", Value: "---" },
    { Metric: "Total Cash Received Inflow (PKR)", Value: cashFlow.cashInflow || 0 },
    { Metric: "Total Cash Paid Outflow (PKR)", Value: cashFlow.cashOutflow || 0 },
    { Metric: "Net Cash Movement (PKR)", Value: cashFlow.netCashMovement || 0 },
    { Metric: "---", Value: "---" },
    { Metric: "Total Inventory Volume (Liters)", Value: inventory.totalStockLiters || 0 },
    { Metric: "Total Inventory Valuation (PKR)", Value: inventory.stockValuation || 0 },
    { Metric: "Total Customer Receivables (PKR)", Value: accounts.totalCustomerReceivables || 0 },
    { Metric: "Total Supplier Payables (PKR)", Value: accounts.totalSupplierPayables || 0 },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Executive Summary");

  if (Array.isArray(inventory.productsList) && inventory.productsList.length > 0) {
    const stockData = inventory.productsList.map((p, idx) => ({
      "S.No": idx + 1,
      "Product Name": p.name,
      "SKU": p.sku,
      "Category": p.category,
      "Stock (Liters)": p.stockLiters,
      "Cost Rate (PKR)": p.costPrice,
      "Selling Rate (PKR)": p.sellingPrice,
      "Total Valuation (PKR)": p.stockValuation,
    }));
    const stockSheet = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(workbook, stockSheet, "Stock & Inventory");
  }

  if (Array.isArray(expenses.byCategory) && expenses.byCategory.length > 0) {
    const expData = expenses.byCategory.map((e, idx) => ({
      "S.No": idx + 1,
      "Expense Category": e.category,
      "Amount (PKR)": e.amount,
      "Percentage (%)": `${e.percentage}%`,
    }));
    const expSheet = XLSX.utils.json_to_sheet(expData);
    XLSX.utils.book_append_sheet(workbook, expSheet, "Expenses Breakdown");
  }

  if (Array.isArray(accounts.topReceivables) && accounts.topReceivables.length > 0) {
    const recData = accounts.topReceivables.map((c, idx) => ({
      "S.No": idx + 1,
      "Customer Name": c.name,
      "Phone": c.phone || "-",
      "Outstanding Khata (PKR)": c.currentBalance,
    }));
    const recSheet = XLSX.utils.json_to_sheet(recData);
    XLSX.utils.book_append_sheet(workbook, recSheet, "Customer Receivables");
  }

  XLSX.writeFile(workbook, filename);
}
