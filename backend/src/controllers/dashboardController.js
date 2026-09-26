import { PosSale } from "../models/posSaleModel.js";
import { Product } from "../models/productModel.js";
import { Customer } from "../models/customerModel.js";
import { Expense } from "../models/expenseModel.js";
import { AuditLog } from "../models/auditModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { ShopShift } from "../models/shopShiftModel.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const now = new Date();
    const currentHour = (now.getUTCHours() + 5) % 24;
    const todayStr = now.toISOString().split("T")[0];
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [posSales, products, customers, expenses, auditLogs, cashTxs, closedShift] = await Promise.all([
      PosSale.find().sort({ createdAt: -1 }),
      Product.find(),
      Customer.find(),
      Expense.find(),
      AuditLog.find().sort({ timestamp: -1 }).limit(10),
      CashTransaction.find(),
      ShopShift.findOne({ shiftDate: todayStr, isClosed: true }),
    ]);

    const isShiftActive = !closedShift && currentHour >= 10 && currentHour < 18;
    const shiftLabel = closedShift
      ? `Shift Closed (${closedShift.closeType} at ${new Date(closedShift.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
      : isShiftActive ? "Active Shift (10 AM - 6 PM)" : "Shift Closed (Next Shift 10 AM)";

    const todayPos = posSales.filter((s) => {
      const sDate = new Date(s.createdAt);
      if (s.isNextDayShift) return false;
      if (s.shiftDate ? s.shiftDate !== todayStr : sDate.toISOString().split("T")[0] !== todayStr) return false;
      if (closedShift && sDate > new Date(closedShift.closedAt)) return false;
      const sHour = (sDate.getUTCHours() + 5) % 24;
      return sHour >= 10 && sHour < 18;
    });

    const activeTodaySales = isShiftActive ? todayPos.reduce((sum, s) => sum + (s.grandTotal || 0), 0) : 0;
    const activeTodayOrders = isShiftActive ? todayPos.length : 0;
    const todayCashSales = isShiftActive ? todayPos.filter((s) => s.paymentMode === "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0) : 0;
    const todayCreditSales = isShiftActive ? activeTodaySales - todayCashSales : 0;

    const totalStockLiters = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const stockValuation = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.costPrice || 0)), 0);
    const inStockCount = products.filter((p) => (p.stockQuantity || 0) > 0).length;
    const outOfStockCount = products.filter((p) => (p.stockQuantity || 0) === 0).length;

    const totalCustomerReceivable = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
    const pendingCustomersCount = customers.filter((c) => (c.currentBalance || 0) > 0).length;

    const todayReceived = cashTxs.filter((c) => c.type === "Received" && new Date(c.transactionDate || c.createdAt).toISOString().split("T")[0] === todayStr).reduce((sum, c) => sum + (c.amount || 0), 0);
    const todayPaid = cashTxs.filter((c) => c.type === "Paid" && new Date(c.transactionDate || c.createdAt).toISOString().split("T")[0] === todayStr).reduce((sum, c) => sum + (c.amount || 0), 0);
    const monthlySales = posSales.filter((s) => new Date(s.createdAt) >= firstDayOfMonth).reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const daySales = posSales.filter((s) => new Date(s.createdAt).toISOString().split("T")[0] === dateStr);
      const dayRevenue = daySales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
      last7DaysData.push({ day: days[d.getDay()], date: dateStr, sales: dayRevenue, retail: daySales.length, online: 0 });
    }

    const invoices = posSales.slice(0, 10).map((s) => ({
      _id: s._id,
      invoiceId: s.saleNumber,
      customer: s.customerName,
      amount: `Rs. ${s.grandTotal.toLocaleString()}`,
      status: s.paymentMode === "Credit / Khata" ? "Pending" : "Paid",
      createdAt: s.createdAt,
    }));

    const activities = auditLogs.map((log) => ({
      _id: log._id,
      title: `${log.userName} (${log.userRole}): ${log.action} - ${log.details || log.module}`,
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      iconType: log.module === "pos" ? "card" : log.module === "users" ? "user" : "file",
    }));

    const totalRevenue = posSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const totalExpensesAmt = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        heroCards: {
          todaySales: { total: activeTodaySales, formatted: `Rs. ${activeTodaySales.toLocaleString()}`, ordersCount: activeTodayOrders, cash: todayCashSales, credit: todayCreditSales, isShiftActive, shiftLabel, isClosed: Boolean(closedShift), closedShift },
          stockSummary: { valuation: stockValuation, formattedValuation: `Rs. ${stockValuation.toLocaleString()}`, totalUnits: totalStockLiters, totalProducts: products.length, inStock: inStockCount, lowStock: 0, outOfStock: outOfStockCount },
          receivablesSummary: { totalReceivable: totalCustomerReceivable, formattedTotal: `Rs. ${totalCustomerReceivable.toLocaleString()}`, customerReceivable: totalCustomerReceivable, millReceivable: 0, pendingParties: pendingCustomersCount },
        },
        kpis: [
          { id: "cash-received", label: "Total Cash Received Today", value: `Rs. ${todayReceived.toLocaleString()}`, type: "green" },
          { id: "cash-paid", label: "Total Cash Paid Today", value: `Rs. ${todayPaid.toLocaleString()}`, type: "red" },
          { id: "net-sales", label: "Net Sales Of This Month", value: `Rs. ${monthlySales.toLocaleString()}`, type: "blue" },
          { id: "receivables", label: "Total Customer Receivables", value: `Rs. ${totalCustomerReceivable.toLocaleString()}`, type: "orange" },
        ],
        stats: [
          { label: "Total Sales Revenue", value: `Rs. ${totalRevenue.toLocaleString()}`, delta: totalRevenue > 0 ? 12.5 : 0 },
          { label: "Products in Catalog", value: `${products.length} Items`, delta: 0 },
          { label: "Active Customers", value: `${customers.length} Accounts`, delta: 0 },
          { label: "Operational Expenses", value: `Rs. ${totalExpensesAmt.toLocaleString()}`, delta: totalExpensesAmt > 0 ? -2.4 : 0 },
        ],
        invoices,
        activities,
        revenue: last7DaysData,
        channelSales: last7DaysData,
      },
    });
  } catch (error) {
    next(error);
  }
};
