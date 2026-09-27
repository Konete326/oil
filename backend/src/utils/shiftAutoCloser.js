import { ShopShift } from "../models/shopShiftModel.js";
import { SystemLog } from "../models/systemLogModel.js";
import { calculateShiftMetrics } from "./shiftMetricsHelper.js";
import { createNotificationHelper } from "../controllers/notificationController.js";

export const checkAndAutoCloseShift = async (customDateStr = null) => {
  const now = new Date();
  const currentHour = (now.getUTCHours() + 5) % 24;
  const todayStr = customDateStr || now.toISOString().split("T")[0];

  const existing = await ShopShift.findOne({ shiftDate: todayStr, isClosed: true });
  if (existing) return existing;

  const isPastClose = currentHour >= 18 || (customDateStr && customDateStr < now.toISOString().split("T")[0]);
  if (!isPastClose) return null;

  const openedAt = new Date(now);
  openedAt.setHours(5, 0, 0, 0);

  const autoClosedAt = new Date(now);
  autoClosedAt.setHours(13, 0, 0, 0);

  const metrics = await calculateShiftMetrics(todayStr, autoClosedAt);

  const shift = await ShopShift.create({
    shiftDate: todayStr,
    openedAt,
    closedAt: autoClosedAt,
    isClosed: true,
    closedBy: "System (Auto 6:00 PM)",
    closeType: "Auto",
    notes: "Automatic system shop closing at 6:00 PM.",
    ...metrics,
  });

  await SystemLog.create({
    title: "Shop Shift Auto-Closed (6:00 PM)",
    message: `Shop shift for ${todayStr} auto-closed at 6:00 PM. Sales: Rs ${shift.totalSales}, Profit: Rs ${shift.totalProfit}, Expenses: Rs ${shift.totalExpenses}.`,
    level: "info",
    source: "backend",
    userName: "System Auto-Close",
    userRole: "admin",
    metadata: { shiftId: shift._id, totalSales: shift.totalSales, totalProfit: shift.totalProfit },
  });

  await createNotificationHelper({
    title: "Shop Shift Auto-Closed at 6:00 PM",
    message: `Shop closing completed automatically. Sales: Rs ${shift.totalSales.toLocaleString()} (${shift.ordersCount} orders). New sales will be recorded for next day.`,
    type: "shift",
    userName: "System Auto-Close",
    targetRoles: ["admin", "cashier", "manager"],
    metadata: { shiftId: shift._id, totalSales: shift.totalSales },
  });

  return shift;
};

export const startShiftAutoCloseScheduler = () => {
  checkAndAutoCloseShift().catch(() => {});
  setInterval(() => {
    checkAndAutoCloseShift().catch(() => {});
  }, 60000);
};
