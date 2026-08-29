import { PosSale } from "../models/posSaleModel.js";
import { Challan } from "../models/challanModel.js";
import { Product } from "../models/productModel.js";
import { Mill } from "../models/millModel.js";
import { Customer } from "../models/customerModel.js";
import { Expense } from "../models/expenseModel.js";
import { AuditLog } from "../models/auditModel.js";
import { CashTransaction } from "../models/cashModel.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [posSales, challans, products, mills, customers, expenses, auditLogs, cashTxs] = await Promise.all([
      PosSale.find().sort({ createdAt: -1 }),
      Challan.find().sort({ createdAt: -1 }),
      Product.find(),
      Mill.find(),
      Customer.find(),
      Expense.find(),
      AuditLog.find().sort({ timestamp: -1 }).limit(10),
      CashTransaction.find(),
    ]);

    const todayPos = posSales.filter((s) => new Date(s.createdAt).toISOString().split("T")[0] === todayStr);
    const todayChallanList = challans.filter((c) => new Date(c.createdAt).toISOString().split("T")[0] === todayStr);
    const todayPosTotal = todayPos.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const todayChallanTotal = todayChallanList.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const todaySalesTotal = todayPosTotal + todayChallanTotal;
    const todayCashSales = todayPos.filter((s) => s.paymentMode === "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const todayCreditSales = todaySalesTotal - todayCashSales;

    const stockValuation = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.costPrice || p.sellingPrice || 0)), 0);
    const stockSellingValuation = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.sellingPrice || 0)), 0);
    const totalStockUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const inStockCount = products.filter((p) => p.stockQuantity > (p.minStockAlert || 5)).length;
    const lowStockCount = products.filter((p) => p.stockQuantity <= (p.minStockAlert || 5) && p.stockQuantity > 0).length;
    const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

    const customerReceivable = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
    const millReceivable = mills.reduce((sum, m) => sum + (m.currentBalance || 0), 0);
    const totalMarketReceivable = customerReceivable + millReceivable;
    const pendingPartiesCount = customers.filter((c) => (c.currentBalance || 0) > 0).length + mills.filter((m) => (m.currentBalance || 0) > 0).length;

    const todayReceived = cashTxs
      .filter((c) => c.type === "Received" && new Date(c.transactionDate || c.createdAt).toISOString().split("T")[0] === todayStr)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const todayPaid = cashTxs
      .filter((c) => c.type === "Paid" && new Date(c.transactionDate || c.createdAt).toISOString().split("T")[0] === todayStr)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const monthlySales = posSales
      .filter((s) => new Date(s.createdAt) >= firstDayOfMonth)
      .reduce((sum, s) => sum + (s.grandTotal || 0), 0) +
      challans
      .filter((c) => new Date(c.createdAt) >= firstDayOfMonth)
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split("T")[0];
      const dayPosSales = posSales.filter((s) => new Date(s.createdAt).toISOString().split("T")[0] === dateStr);
      const dayChallans = challans.filter((c) => new Date(c.createdAt).toISOString().split("T")[0] === dateStr);
      const dayRevenue = dayPosSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0) + dayChallans.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
      last7DaysData.push({ day: dayName, date: dateStr, sales: dayRevenue, retail: dayPosSales.length, online: dayChallans.length });
    }

    const invoices = [
      ...posSales.map((s) => ({ _id: s._id, invoiceId: s.saleNumber, customer: s.customerName, amount: `Rs. ${s.grandTotal.toLocaleString()}`, status: s.paymentMode === "Credit / Khata" ? "Pending" : "Paid", createdAt: s.createdAt })),
      ...challans.map((c) => ({ _id: c._id, invoiceId: c.challanNumber, customer: c.millName, amount: `Rs. ${c.totalAmount.toLocaleString()}`, status: c.paymentStatus === "Billed to Ledger" ? "Paid" : "Pending", createdAt: c.createdAt })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    const activities = auditLogs.map((log) => ({
      _id: log._id,
      title: `${log.userName} (${log.userRole}): ${log.action} - ${log.details || log.module}`,
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      iconType: log.module === "pos" ? "card" : log.module === "users" ? "user" : "file",
    }));

    const totalRevenue = posSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0) + challans.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
    const totalExpensesAmt = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        heroCards: {
          todaySales: { total: todaySalesTotal, formatted: `Rs. ${todaySalesTotal.toLocaleString()}`, ordersCount: todayPos.length + todayChallanList.length, cash: todayCashSales, credit: todayCreditSales },
          stockSummary: { valuation: stockValuation, sellingValuation: stockSellingValuation, formattedValuation: `Rs. ${stockValuation.toLocaleString()}`, totalUnits: totalStockUnits, totalProducts: products.length, inStock: inStockCount, lowStock: lowStockCount, outOfStock: outOfStockCount },
          receivablesSummary: { totalReceivable: totalMarketReceivable, formattedTotal: `Rs. ${totalMarketReceivable.toLocaleString()}`, customerReceivable, millReceivable, pendingParties: pendingPartiesCount },
        },
        kpis: [
          { id: "cash-received", label: "Total Cash Received Today", value: `Rs. ${todayReceived.toLocaleString()}`, type: "green" },
          { id: "cash-paid", label: "Total Cash Paid Today", value: `Rs. ${todayPaid.toLocaleString()}`, type: "red" },
          { id: "net-sales", label: "Net Sales Of This Month", value: `Rs. ${monthlySales.toLocaleString()}`, type: "blue" },
          { id: "receivables", label: "Total Receivable Balance", value: `Rs. ${totalMarketReceivable.toLocaleString()}`, type: "orange" },
        ],
        stats: [
          { label: "Total Sales Revenue", value: `Rs. ${totalRevenue.toLocaleString()}`, delta: totalRevenue > 0 ? 12.5 : 0 },
          { label: "Products in Catalog", value: `${products.length} Items`, delta: lowStockCount > 0 ? -lowStockCount : 0 },
          { label: "Active Textile Mills", value: `${mills.length} Mills`, delta: mills.length > 0 ? 5.0 : 0 },
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
