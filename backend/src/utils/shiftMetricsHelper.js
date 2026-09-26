import { PosSale } from "../models/posSaleModel.js";
import { Expense } from "../models/expenseModel.js";
import { CashTransaction } from "../models/cashModel.js";

export const calculateShiftMetrics = async (todayStr, closedAt = null) => {
  const [allSales, allExpenses, cashTxs] = await Promise.all([
    PosSale.find().sort({ createdAt: -1 }),
    Expense.find(),
    CashTransaction.find(),
  ]);

  const sales = allSales.filter((s) => {
    const sDate = new Date(s.createdAt);
    const dateStr = sDate.toISOString().split("T")[0];
    if (s.shiftDate) {
      if (s.shiftDate !== todayStr || s.isNextDayShift) return false;
    } else {
      if (dateStr !== todayStr) return false;
    }
    if (closedAt && sDate > new Date(closedAt)) return false;
    return true;
  });

  const expenses = allExpenses.filter((e) => {
    const eDate = new Date(e.expenseDate || e.createdAt);
    if (eDate.toISOString().split("T")[0] !== todayStr) return false;
    if (closedAt && eDate > new Date(closedAt)) return false;
    return true;
  });

  const totalSales = sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalCost = sales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
  const cashSales = sales.filter((s) => s.paymentMode === "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const creditSales = sales.filter((s) => s.paymentMode !== "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netDayMargin = totalProfit - totalExpenses;

  const totalLitersSold = sales.reduce((sum, s) => {
    return sum + (s.items || []).reduce((iq, it) => iq + (Number(it.quantity) || 0), 0);
  }, 0);

  const todayCashIn = cashTxs
    .filter((c) => c.type === "Received" && new Date(c.transactionDate || c.createdAt).toISOString().split("T")[0] === todayStr)
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const todayCashOut = cashTxs
    .filter((c) => c.type === "Paid" && new Date(c.transactionDate || c.createdAt).toISOString().split("T")[0] === todayStr)
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const netCashInDrawer = cashSales + todayCashIn - todayCashOut - totalExpenses;

  return {
    totalSales,
    totalCost,
    totalProfit,
    totalExpenses,
    netDayMargin,
    totalLitersSold,
    cashSales,
    creditSales,
    ordersCount: sales.length,
    netCashInDrawer,
  };
};
