import { ShopShift } from "../models/shopShiftModel.js";
import { SystemLog } from "../models/systemLogModel.js";
import { calculateShiftMetrics } from "../utils/shiftMetricsHelper.js";
import { checkAndAutoCloseShift } from "../utils/shiftAutoCloser.js";

export const getCurrentShiftStatus = async (req, res, next) => {
  try {
    const now = new Date();
    const currentHour = (now.getUTCHours() + 5) % 24;
    const todayStr = now.toISOString().split("T")[0];
    let closedShift = await checkAndAutoCloseShift(todayStr);
    if (!closedShift) {
      closedShift = await ShopShift.findOne({ shiftDate: todayStr, isClosed: true });
    }
    const isShiftActive = !closedShift && currentHour >= 10 && currentHour < 18;
    const metrics = closedShift
      ? {
          totalSales: closedShift.totalSales,
          totalCost: closedShift.totalCost,
          totalProfit: closedShift.totalProfit,
          totalExpenses: closedShift.totalExpenses,
          netDayMargin: closedShift.netDayMargin,
          totalLitersSold: closedShift.totalLitersSold,
          cashSales: closedShift.cashSales,
          creditSales: closedShift.creditSales,
          ordersCount: closedShift.ordersCount,
          netCashInDrawer: closedShift.cashSales - closedShift.totalExpenses,
          totalStockRemainingLiters: closedShift.totalStockRemainingLiters || 0,
          totalStockValuation: closedShift.totalStockValuation || 0,
        }
      : await calculateShiftMetrics(todayStr);

    res.status(200).json({
      success: true,
      data: {
        todayStr,
        currentHour,
        isShiftActive,
        isClosed: Boolean(closedShift),
        closedShift,
        timings: { open: "10:00 AM", close: "06:00 PM" },
        metrics,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const closeShift = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const existing = await ShopShift.findOne({ shiftDate: todayStr, isClosed: true });
    if (existing) {
      return res.status(200).json({ success: true, data: existing, message: "Shift is already closed." });
    }

    const metrics = await calculateShiftMetrics(todayStr, now);
    const openedAt = new Date(now);
    openedAt.setHours(5, 0, 0, 0);

    const shift = await ShopShift.create({
      shiftDate: todayStr,
      openedAt,
      closedAt: now,
      isClosed: true,
      closedBy: req.user?.name || "Admin Cashier",
      closeType: req.body?.closeType || "Manual",
      notes: req.body?.notes || "",
      ...metrics,
    });

    await SystemLog.create({
      title: "Shop Shift Closed",
      message: `Shop closed (${shift.closeType}) by ${shift.closedBy}. Sales: Rs ${shift.totalSales}, Profit: Rs ${shift.totalProfit}, Expenses: Rs ${shift.totalExpenses}.`,
      level: "info",
      source: "backend",
      userName: req.user?.name || "Admin",
      userRole: req.user?.role || "admin",
      metadata: { shiftId: shift._id, totalSales: shift.totalSales, totalProfit: shift.totalProfit },
    });

    res.status(201).json({ success: true, data: shift, message: "Shop shift closed successfully" });
  } catch (error) {
    next(error);
  }
};

export const getShiftHistory = async (req, res, next) => {
  try {
    const history = await ShopShift.find().sort({ closedAt: -1 }).limit(30);
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};
