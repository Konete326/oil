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
      AuditLog.find().sort({ timestamp: -1 }).limit(8),
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
    const totalStockUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const lowStockProducts = products.filter((p) => p.stockQuantity <= (p.minStockAlert || 5));
    const inStockCount = products.filter((p) => p.stockQuantity > (p.minStockAlert || 5)).length;

    const totalMarketReceivable = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0) + mills.reduce((sum, m) => sum + (m.currentBalance || 0), 0);

    const todayReceived = cashTxs
      .filter((c) => c.type === "Received" && new Date(c.transactionDate || c.createdAt).toISOString().split("T")[0] === todayStr)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const todayPaid = cashTxs
      .filter((c) => c.type === "Paid" && new Date(c.transactionDate || c.createdAt).toISOString().split("T")[0] === todayStr)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const todayNetGalla = todayReceived - todayPaid;

    const monthlySales = posSales.filter((s) => new Date(s.createdAt) >= firstDayOfMonth).reduce((sum, s) => sum + (s.grandTotal || 0), 0) +
      challans.filter((c) => new Date(c.createdAt) >= firstDayOfMonth).reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayPosSales = posSales.filter((s) => new Date(s.createdAt).toISOString().split("T")[0] === dateStr);
      const dayChallans = challans.filter((c) => new Date(c.createdAt).toISOString().split("T")[0] === dateStr);
      const dayRevenue = dayPosSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0) + dayChallans.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
      last7DaysData.push({ day: days[d.getDay()], date: dateStr, sales: dayRevenue, retail: dayPosSales.length, online: dayChallans.length });
    }

    const invoices = [
      ...posSales.map((s) => ({ _id: s._id, invoiceId: s.saleNumber, customer: s.customerName, amount: `Rs. ${s.grandTotal.toLocaleString()}`, status: s.paymentMode === "Credit / Khata" ? "Pending" : "Paid", createdAt: s.createdAt })),
      ...challans.map((c) => ({ _id: c._id, invoiceId: c.challanNumber, customer: c.millName, amount: `Rs. ${c.totalAmount.toLocaleString()}`, status: c.paymentStatus === "Billed to Ledger" ? "Paid" : "Pending", createdAt: c.createdAt })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

    res.status(200).json({
      success: true,
      data: {
        heroCards: {
          todaySales: { total: todaySalesTotal, formatted: `Rs. ${todaySalesTotal.toLocaleString()}`, ordersCount: todayPos.length + todayChallanList.length, cash: todayCashSales, credit: todayCreditSales },
          stockSummary: { valuation: stockValuation, formattedValuation: `Rs. ${stockValuation.toLocaleString()}`, totalUnits: totalStockUnits, totalProducts: products.length, inStock: inStockCount, lowStock: lowStockProducts.length },
          receivablesSummary: { totalReceivable: totalMarketReceivable, formattedTotal: `Rs. ${totalMarketReceivable.toLocaleString()}` },
        },
        gallaStatus: {
          todayCashIn: todayReceived,
          formattedTodayIn: `Rs. ${todayReceived.toLocaleString()}`,
          todayCashOut: todayPaid,
          formattedTodayOut: `Rs. ${todayPaid.toLocaleString()}`,
          todayNetGalla,
          formattedNetGalla: `Rs. ${todayNetGalla.toLocaleString()}`,
        },
        lowStockItems: lowStockProducts.slice(0, 8).map(p => ({ _id: p._id, name: p.name, quantity: p.stockQuantity, unit: p.packagingType || p.unit || "Cans", minAlert: p.minStockAlert || 5 })),
        monthlySales: `Rs. ${monthlySales.toLocaleString()}`,
        invoices,
        revenue: last7DaysData,
      },
    });
  } catch (error) {
    next(error);
  }
};
