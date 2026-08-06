import * as XLSX from "xlsx";

export function exportTransactionsToExcel(transactions = [], filename = "Cash_Transactions_Report.xlsx") {
  const data = transactions.map((t, idx) => ({
    "S.No": idx + 1,
    "Date": new Date(t.transactionDate || t.createdAt).toLocaleDateString(),
    "Type": t.type,
    "Party Name": t.partyName,
    "Category": t.category || "General",
    "Amount (PKR)": t.amount,
    "Payment Mode": t.paymentMode || "Cash",
    "Reference No": t.referenceNo || "-",
    "Notes": t.notes || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cash Transactions");
  XLSX.writeFile(workbook, filename);
}

export function exportPartySummaryToExcel(partySummaries = [], filename = "Party_Wise_Cash_Report.xlsx") {
  const data = partySummaries.map((p, idx) => ({
    "S.No": idx + 1,
    "Party Name": p.partyName,
    "Total Paid Cash (PKR)": p.totalPaid,
    "Total Received Cash (PKR)": p.totalReceived,
    "Net Cash Flow (PKR)": p.netBalance,
    "Paid Transactions": p.paidCount,
    "Received Transactions": p.receivedCount,
    "Last Transaction Date": p.lastTransactionDate ? new Date(p.lastTransactionDate).toLocaleDateString() : "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Party Cash Summary");
  XLSX.writeFile(workbook, filename);
}
