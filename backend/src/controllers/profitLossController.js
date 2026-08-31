import { PosSale } from "../models/posSaleModel.js";
import { Challan } from "../models/challanModel.js";
import { Purchase } from "../models/purchaseModel.js";
import { Expense } from "../models/expenseModel.js";
import { SalaryVoucher } from "../models/salaryVoucherModel.js";
import { Product } from "../models/productModel.js";
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

    const [posSales, challans, purchases, expenses, salaryVouchers, products] = await Promise.all([
      PosSale.find(dateFilter).lean(),
      Challan.find(dateFilter).lean(),
      Purchase.find(dateFilter).lean(),
      Expense.find(dateFilter).lean(),
      SalaryVoucher.find(dateFilter).lean(),
      Product.find().lean(),
    ]);

    const productCostMap = {};
    products.forEach((p) => {
      productCostMap[p._id.toString()] = Number(p.costPrice) || (Number(p.sellingPrice) * 0.75) || 0;
      if (p.name) productCostMap[p.name.toLowerCase().trim()] = Number(p.costPrice) || (Number(p.sellingPrice) * 0.75) || 0;
    });

    const posRevenue = posSales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
    const challanRevenue = challans.reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0);
    const totalSalesRevenue = posRevenue + challanRevenue;

    let posCOGS = 0;
    posSales.forEach((s) => {
      if (Array.isArray(s.items)) {
        s.items.forEach((itm) => {
          const qty = Number(itm.quantity) || 1;
          const cost = (itm.product && productCostMap[itm.product.toString()]) ||
                       (itm.productName && productCostMap[itm.productName.toLowerCase().trim()]) ||
                       (Number(itm.unitPrice || itm.price || 0) * 0.75);
          posCOGS += qty * cost;
        });
      }
    });

    let challanCOGS = 0;
    challans.forEach((c) => {
      const liters = Number(c.quantityLiters) || 0;
      const cost = (c.product && productCostMap[c.product.toString()]) ||
                   (c.productName && productCostMap[c.productName.toLowerCase().trim()]) ||
                   (Number(c.ratePerLiter || 0) * 0.75);
      challanCOGS += liters * cost;
    });

    const totalCOGS = Number((posCOGS + challanCOGS).toFixed(2));
    const grossProfit = Number((totalSalesRevenue - totalCOGS).toFixed(2));
    const grossMarginPercentage = totalSalesRevenue > 0 ? Number(((grossProfit / totalSalesRevenue) * 100).toFixed(2)) : 0;

    const expenseCategoryMap = {};
    let totalGeneralExpenses = 0;
    expenses.forEach((e) => {
      const cat = e.category || "General";
      const amt = Number(e.amount) || 0;
      expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + amt;
      totalGeneralExpenses += amt;
    });

    const totalStaffSalaries = salaryVouchers.reduce((sum, v) => sum + (Number(v.netSalaryPaid || v.baseSalary) || 0), 0);
    if (totalStaffSalaries > 0) {
      expenseCategoryMap["Staff Salaries"] = (expenseCategoryMap["Staff Salaries"] || 0) + totalStaffSalaries;
    }

    const operatingExpenses = Number((totalGeneralExpenses + totalStaffSalaries).toFixed(2));
    const netProfit = Number((grossProfit - operatingExpenses).toFixed(2));
    const marginPercentage = totalSalesRevenue > 0 ? Number(((netProfit / totalSalesRevenue) * 100).toFixed(2)) : 0;
    const totalStockPurchases = purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);

    res.status(200).json({
      success: true,
      period,
      data: {
        totalSalesRevenue,
        posRevenue,
        challanRevenue,
        totalCOGS,
        posCOGS,
        challanCOGS,
        totalStockPurchases,
        grossProfit,
        grossMarginPercentage,
        operatingExpenses,
        totalGeneralExpenses,
        totalStaffSalaries,
        expenseCategoryMap,
        netProfit,
        marginPercentage,
        totalOrdersCount: posSales.length + challans.length,
        totalPurchasesCount: purchases.length,
        totalExpensesCount: expenses.length + salaryVouchers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
