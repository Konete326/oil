import { Customer } from "../models/customerModel.js";
import { PosSale } from "../models/posSaleModel.js";
import { Ledger } from "../models/ledgerModel.js";
import { connectDB } from "../config/db.js";

export const getCustomerById = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      res.status(404);
      throw new Error("Customer not found.");
    }

    const [posSales, ledgerEntries] = await Promise.all([
      PosSale.find({
        $or: [
          { customerName: { $regex: `^${customer.name}$`, $options: "i" } },
          { customerPhone: customer.phone },
        ],
      }).sort({ createdAt: -1 }),
      Ledger.find({ partyName: { $regex: `^${customer.name}$`, $options: "i" } }).sort({ createdAt: -1 }),
    ]);

    const totalSpent = posSales.reduce((acc, sale) => acc + (sale.grandTotal || 0), 0);
    const totalOrders = posSales.length;

    const monthlySalesMap = {};
    posSales.forEach((sale) => {
      const monthYear = new Date(sale.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthlySalesMap[monthYear] = (monthlySalesMap[monthYear] || 0) + (sale.grandTotal || 0);
    });

    const monthlyData = Object.keys(monthlySalesMap).map((key) => ({
      month: key,
      total: monthlySalesMap[key],
    }));

    res.status(200).json({
      success: true,
      data: {
        customer,
        summary: {
          totalSpent,
          totalOrders,
          currentBalance: customer.currentBalance,
          creditLimit: customer.creditLimit,
        },
        monthlyData,
        posSales,
        ledgerEntries,
      },
    });
  } catch (error) {
    next(error);
  }
};
