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
          { customerId: customer._id },
          { customerName: { $regex: `^${customer.name}$`, $options: "i" } },
          ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
        ],
      }).sort({ createdAt: -1 }),
      Ledger.find({
        $or: [
          { customer: customer._id },
          { clientName: { $regex: `^${customer.name}$`, $options: "i" } },
          { partyName: { $regex: `^${customer.name}$`, $options: "i" } },
        ],
      }).sort({ createdAt: -1 }),
    ]);

    const totalSpent = posSales.reduce((acc, sale) => acc + (sale.grandTotal || 0), 0);
    const totalOrders = posSales.length;

    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const mSales = posSales
        .filter((s) => {
          const sDate = new Date(s.createdAt);
          return sDate >= monthStart && sDate <= monthEnd;
        })
        .reduce((sum, s) => sum + (s.grandTotal || 0), 0);

      const mPayments = ledgerEntries
        .filter((e) => {
          const eDate = new Date(e.createdAt);
          return eDate >= monthStart && eDate <= monthEnd && (e.transactionType || "").toLowerCase().includes("credit");
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      monthlyData.push({
        month: monthKey,
        total: mSales,
        payments: mPayments,
      });
    }

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
