import { PosSale } from "../models/posSaleModel.js";
import { Expense } from "../models/expenseModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { Product } from "../models/productModel.js";
import { Customer } from "../models/customerModel.js";
import { Supplier } from "../models/supplierModel.js";
import { ShopShift } from "../models/shopShiftModel.js";
import { parseReportDateRange, aggregateCategoryExpenses } from "../utils/masterReportHelper.js";

export const getMasterPlatformReport = async (req, res, next) => {
  try {
    const { period = "this_month", startDate, endDate } = req.query;
    const { start, end } = parseReportDateRange(period, startDate, endDate);

    const [allSales, allExpenses, cashTxs, products, customers, suppliers, recentShifts] = await Promise.all([
      PosSale.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }),
      Expense.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }),
      CashTransaction.find({ createdAt: { $gte: start, $lte: end } }),
      Product.find().sort({ name: 1 }),
      Customer.find().sort({ currentBalance: -1 }),
      Supplier.find().sort({ currentBalance: -1 }),
      ShopShift.find().sort({ closedAt: -1 }).limit(10),
    ]);

    const totalSalesRevenue = allSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalCostOfGoods = allSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const grossProfit = totalSalesRevenue - totalCostOfGoods;
    const grossMarginPct = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : 0;

    const totalLitersSold = allSales.reduce((sum, s) => {
      return sum + (s.items || []).reduce((iq, it) => iq + (Number(it.quantity) || 0), 0);
    }, 0);

    const cashSales = allSales.filter((s) => s.paymentMode === "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const creditSales = allSales.filter((s) => s.paymentMode !== "Cash").reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const expenseAggregation = aggregateCategoryExpenses(allExpenses);
    const netProfit = grossProfit - expenseAggregation.total;
    const netMarginPct = totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(1) : 0;

    const cashInflow = cashTxs.filter((c) => c.type === "Received").reduce((sum, c) => sum + (c.amount || 0), 0);
    const cashOutflow = cashTxs.filter((c) => c.type === "Paid").reduce((sum, c) => sum + (c.amount || 0), 0);

    const totalStockLiters = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const stockValuation = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.costPrice || 0)), 0);

    const totalCustomerReceivables = customers.reduce((sum, c) => sum + Math.max(c.currentBalance || 0, 0), 0);
    const totalSupplierPayables = suppliers.reduce((sum, s) => sum + Math.max(s.currentBalance || 0, 0), 0);

    res.status(200).json({
      success: true,
      meta: { period, startDate: start, endDate: end, generatedAt: new Date() },
      executiveSummary: {
        grossRevenue: totalSalesRevenue,
        cogs: totalCostOfGoods,
        grossProfit,
        grossMarginPct: Number(grossMarginPct),
        totalExpenses: expenseAggregation.total,
        netProfit,
        netMarginPct: Number(netMarginPct),
        ordersCount: allSales.length,
        totalLitersSold,
        cashSales,
        creditSales,
      },
      cashFlow: { cashInflow, cashOutflow, netCashMovement: cashInflow - cashOutflow },
      expenses: { total: expenseAggregation.total, byCategory: expenseAggregation.byCategory, recentVouchers: allExpenses.slice(0, 15) },
      inventory: {
        totalStockLiters,
        stockValuation,
        totalProductsCount: products.length,
        inStockCount: products.filter((p) => (p.stockQuantity || 0) > 0).length,
        outOfStockCount: products.filter((p) => (p.stockQuantity || 0) === 0).length,
        productsList: products.map((p) => ({
          _id: p._id,
          name: p.name,
          sku: p.sku || "N/A",
          category: p.category || "General",
          stockLiters: p.stockQuantity || 0,
          costPrice: p.costPrice || 0,
          sellingPrice: p.price || 0,
          stockValuation: (p.stockQuantity || 0) * (p.costPrice || 0),
        })),
      },
      accounts: {
        totalCustomerReceivables,
        totalSupplierPayables,
        topReceivables: customers.filter((c) => (c.currentBalance || 0) > 0).slice(0, 10),
        topPayables: suppliers.filter((s) => (s.currentBalance || 0) > 0).slice(0, 10),
      },
      shiftHistory: recentShifts,
    });
  } catch (error) {
    next(error);
  }
};
