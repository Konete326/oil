import { PosSale } from "../models/posSaleModel.js";
import { Challan } from "../models/challanModel.js";
import { Purchase } from "../models/purchaseModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { connectDB } from "../config/db.js";

export const getProfitLossSummary = async (req, res, next) => {
  try {
    await connectDB();
    const { period = "monthly", startDate, endDate } = req.query;
    let dateFilter = {};
    const now = new Date();

    if (period === "daily") {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (period === "weekly") {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (period === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    } else if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [posSales, challans, purchases, cashPaidOut] = await Promise.all([
      PosSale.find(dateFilter),
      Challan.find(dateFilter),
      Purchase.find(dateFilter),
      CashTransaction.find({ ...dateFilter, type: "Paid" }),
    ]);

    const posRevenue = posSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const challanRevenue = challans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const totalSalesRevenue = posRevenue + challanRevenue;

    const totalStockPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const grossProfit = totalSalesRevenue - totalStockPurchases;

    const operatingExpenses = cashPaidOut.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = grossProfit - operatingExpenses;

    const marginPercentage = totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      period,
      data: {
        totalSalesRevenue,
        posRevenue,
        challanRevenue,
        totalStockPurchases,
        grossProfit,
        operatingExpenses,
        netProfit,
        marginPercentage: Number(marginPercentage),
        totalOrdersCount: posSales.length + challans.length,
        totalPurchasesCount: purchases.length,
        totalExpensesCount: cashPaidOut.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
