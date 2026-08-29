import { PosSale } from "../models/posSaleModel.js";
import { Challan } from "../models/challanModel.js";
import { connectDB } from "../config/db.js";

export const getSalesReport = async (req, res, next) => {
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

    const [posSales, challans] = await Promise.all([
      PosSale.find(dateFilter).sort({ createdAt: -1 }),
      Challan.find(dateFilter).sort({ createdAt: -1 }),
    ]);

    const posTotal = posSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const challanTotal = challans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const totalSalesRevenue = posTotal + challanTotal;

    res.status(200).json({
      success: true,
      period,
      summary: {
        totalSalesRevenue,
        posSalesTotal: posTotal,
        challanSalesTotal: challanTotal,
        totalSalesCount: posSales.length + challans.length,
      },
      data: { posSales, challans },
    });
  } catch (error) {
    next(error);
  }
};

export const getPartySalesRecord = async (req, res, next) => {
  try {
    await connectDB();
    const [posSales, challans] = await Promise.all([PosSale.find(), Challan.find()]);
    const partyMap = {};

    posSales.forEach((sale) => {
      const party = sale.customerName || "Walk-in Customer";
      if (!partyMap[party]) {
        partyMap[party] = { partyName: party, type: "POS Customer", totalSales: 0, orderCount: 0, lastSaleDate: sale.createdAt };
      }
      partyMap[party].totalSales += sale.grandTotal || 0;
      partyMap[party].orderCount += 1;
      if (new Date(sale.createdAt) > new Date(partyMap[party].lastSaleDate)) {
        partyMap[party].lastSaleDate = sale.createdAt;
      }
    });

    challans.forEach((ch) => {
      const party = ch.millName || "Textile Mill";
      if (!partyMap[party]) {
        partyMap[party] = { partyName: party, type: "Textile Mill", totalSales: 0, orderCount: 0, lastSaleDate: ch.createdAt };
      }
      partyMap[party].totalSales += ch.totalAmount || 0;
      partyMap[party].orderCount += 1;
      if (new Date(ch.createdAt) > new Date(partyMap[party].lastSaleDate)) {
        partyMap[party].lastSaleDate = ch.createdAt;
      }
    });

    const partyRecords = Object.values(partyMap).sort((a, b) => b.totalSales - a.totalSales);
    res.status(200).json({ success: true, count: partyRecords.length, data: partyRecords });
  } catch (error) {
    next(error);
  }
};
