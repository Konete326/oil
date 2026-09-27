import { PosSale } from "../models/posSaleModel.js";
import { Product } from "../models/productModel.js";
import { Customer } from "../models/customerModel.js";
import { Expense } from "../models/expenseModel.js";
import { AuditLog } from "../models/auditModel.js";
import { ShopShift } from "../models/shopShiftModel.js";
import { checkAndAutoCloseShift } from "../utils/shiftAutoCloser.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const { period = "today", startDate, endDate } = req.query;
    const now = new Date();
    const currentHour = (now.getUTCHours() + 5) % 24;
    const todayStr = now.toISOString().split("T")[0];
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let closedShift = await checkAndAutoCloseShift(todayStr);
    if (!closedShift) closedShift = await ShopShift.findOne({ shiftDate: todayStr, isClosed: true });

    const [posSales, products, customers, expenses, auditLogs] = await Promise.all([
      PosSale.find().sort({ createdAt: -1 }),
      Product.find(),
      Customer.find(),
      Expense.find(),
      AuditLog.find().sort({ timestamp: -1 }).limit(10),
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

    let displaySales = closedShift ? closedShift.totalSales : todayPos.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    let displayOrders = closedShift ? closedShift.ordersCount : todayPos.length;
    let displayCash = closedShift ? closedShift.cashSales : todayPos.filter((s) => s.paymentMode === "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    let displayCredit = closedShift ? closedShift.creditSales : Math.max(0, displaySales - displayCash);
    let periodTitle = closedShift ? "Shop Closed (Shift Ended)" : "Today's Sales (10 AM - 6 PM)";
    let periodSubtitle = shiftLabel;

    if (period === "monthly") {
      const mSales = posSales.filter((s) => new Date(s.createdAt) >= firstDayOfMonth);
      displaySales = mSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
      displayOrders = mSales.length;
      displayCash = mSales.filter((s) => s.paymentMode === "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0);
      displayCredit = Math.max(0, displaySales - displayCash);
      periodTitle = `This Month's Sales (${now.toLocaleString("default", { month: "long" })})`;
      periodSubtitle = `${displayOrders} orders recorded this month`;
    } else if (period === "custom" && startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();
      const cSales = posSales.filter((s) => { const d = new Date(s.createdAt); return d >= start && d <= end; });
      displaySales = cSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
      displayOrders = cSales.length;
      displayCash = cSales.filter((s) => s.paymentMode === "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0);
      displayCredit = Math.max(0, displaySales - displayCash);
      periodTitle = "Custom Period Sales";
      periodSubtitle = `${startDate} — ${endDate || "Present"}`;
    }

    const totalStockLiters = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const stockValuation = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.costPrice || 0)), 0);
    const inStockCount = products.filter((p) => (p.stockQuantity || 0) > 0).length, outOfStockCount = products.filter((p) => (p.stockQuantity || 0) === 0).length;
    const totalCustomerReceivable = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0), pendingCustomersCount = customers.filter((c) => (c.currentBalance || 0) > 0).length;
    const monthlySales = posSales.filter((s) => new Date(s.createdAt) >= firstDayOfMonth).reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7DaysData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split("T")[0];
      const dSales = posSales.filter((s) => new Date(s.createdAt).toISOString().split("T")[0] === ds);
      return { day: days[d.getDay()], date: ds, sales: dSales.reduce((a, s) => a + (s.grandTotal || 0), 0), retail: dSales.length, online: 0 };
    });

    const invoices = posSales.slice(0, 10).map((s) => ({ _id: s._id, invoiceId: s.saleNumber, customer: s.customerName, amount: `Rs. ${s.grandTotal.toLocaleString()}`, status: s.paymentMode === "Credit / Khata" ? "Pending" : "Paid", createdAt: s.createdAt }));
    const activities = auditLogs.map((l) => ({ _id: l._id, title: `${l.userName} (${l.userRole}): ${l.action} - ${l.details || l.module}`, time: new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), iconType: l.module === "pos" ? "card" : "user" }));
    const totalRevenue = posSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const totalExpensesAmt = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        heroCards: {
          todaySales: { total: activeTodaySales, formatted: `Rs. ${activeTodaySales.toLocaleString()}`, ordersCount: activeTodayOrders, cash: todayCashSales, credit: todayCreditSales, isShiftActive: period === "today" ? isShiftActive : false, shiftLabel: periodSubtitle, periodTitle, isClosed: period === "today" ? Boolean(closedShift) : false, closedShift: period === "today" ? closedShift : null, period },
          stockSummary: { valuation: stockValuation, formattedValuation: `Rs. ${stockValuation.toLocaleString()}`, totalUnits: totalStockLiters, totalProducts: products.length, inStock: inStockCount, lowStock: 0, outOfStock: outOfStockCount },
          receivablesSummary: { totalReceivable: totalCustomerReceivable, formattedTotal: `Rs. ${totalCustomerReceivable.toLocaleString()}`, customerReceivable: totalCustomerReceivable, millReceivable: 0, pendingParties: pendingCustomersCount },
        },
        kpis: [
          { id: "stock-liters", label: "Total Stock in Hand", value: `${totalStockLiters.toLocaleString()} L`, subtext: `${inStockCount} Products in Stock`, type: "green" },
          { id: "stock-val", label: "Total Stock Valuation", value: `Rs. ${stockValuation.toLocaleString()}`, subtext: "Inventory Asset Value", type: "blue" },
          { id: "net-sales", label: "Net Sales Of This Month", value: `Rs. ${monthlySales.toLocaleString()}`, subtext: "Monthly POS Volume", type: "purple" },
          { id: "receivables", label: "Customer Receivables", value: `Rs. ${totalCustomerReceivable.toLocaleString()}`, subtext: `${pendingCustomersCount} Pending Accounts`, type: "orange" },
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
