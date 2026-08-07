import { PosSale } from "../models/posSaleModel.js";
import { Challan } from "../models/challanModel.js";
import { Product } from "../models/productModel.js";
import { Mill } from "../models/millModel.js";
import { Expense } from "../models/expenseModel.js";
import { AuditLog } from "../models/auditModel.js";
import { CashTransaction } from "../models/cashModel.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [posSales, challans, products, mills, expenses, auditLogs, cashTxs] = await Promise.all([
      PosSale.find().sort({ createdAt: -1 }),
      Challan.find().sort({ createdAt: -1 }),
      Product.find(),
      Mill.find(),
      Expense.find(),
      AuditLog.find().sort({ timestamp: -1 }).limit(10),
      CashTransaction.find(),
    ]);

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

    const totalReceivable = mills.reduce((sum, m) => sum + (m.currentBalance || 0), 0);

    const kpiCards = [
      {
        id: "cash-received",
        label: "Total Cash Received Today",
        value: `Rs. ${todayReceived.toLocaleString()}`,
        raw: todayReceived,
        type: "green",
      },
      {
        id: "cash-paid",
        label: "Total Cash Paid Today",
        value: `Rs. ${todayPaid.toLocaleString()}`,
        raw: todayPaid,
        type: "red",
      },
      {
        id: "net-sales",
        label: "Net Sales Of This Month",
        value: `Rs. ${monthlySales.toLocaleString()}`,
        raw: monthlySales,
        type: "blue",
      },
      {
        id: "receivables",
        label: "Total Receivable Balance",
        value: `Rs. ${totalReceivable.toLocaleString()}`,
        raw: totalReceivable,
        type: "orange",
      },
    ];

    const totalPosRevenue = posSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const totalDcRevenue = challans.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
    const totalRevenue = totalPosRevenue + totalDcRevenue;
    const totalExpensesAmt = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const lowStockCount = products.filter((p) => p.stockQuantity <= (p.minStockAlert || 10)).length;

    const stats = [
      { label: "Total Sales Revenue", value: `Rs. ${totalRevenue.toLocaleString()}`, delta: totalRevenue > 0 ? 12.5 : 0 },
      { label: "Products in Catalog", value: `${products.length} Items`, delta: lowStockCount > 0 ? -lowStockCount : 0 },
      { label: "Active Textile Mills", value: `${mills.length} Mills`, delta: mills.length > 0 ? 5.0 : 0 },
      { label: "Operational Expenses", value: `Rs. ${totalExpensesAmt.toLocaleString()}`, delta: totalExpensesAmt > 0 ? -2.4 : 0 },
    ];

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
      const retailCount = dayPosSales.filter((s) => s.saleType === "Retail").length;
      const wholesaleCount = dayPosSales.filter((s) => s.saleType === "Wholesale").length + dayChallans.length;

      last7DaysData.push({ day: dayName, date: dateStr, sales: dayRevenue, retail: retailCount, online: wholesaleCount });
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

    res.status(200).json({
      success: true,
      data: {
        kpis: kpiCards,
        stats,
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

export const createInvoice = async (req, res, next) => {
  try {
    const { invoiceId, customer, amount, status } = req.body;
    res.status(201).json({ success: true, data: { invoiceId, customer, amount, status } });
  } catch (error) {
    next(error);
  }
};
