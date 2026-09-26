import { Notification } from "../models/notificationModel.js";

export const getNotifications = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });

    const role = req.user?.role || "admin";
    const filter = role === "admin" ? { createdAt: { $gte: thirtyDaysAgo } } : { targetRoles: { $in: [role] }, createdAt: { $gte: thirtyDaysAgo } };

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === "all") {
      const role = req.user?.role || "admin";
      const filter = role === "admin" ? {} : { targetRoles: { $in: [role] } };
      await Notification.updateMany({ ...filter, isRead: false }, { $set: { isRead: true } });
    } else {
      await Notification.findByIdAndUpdate(id, { $set: { isRead: true } });
    }
    res.status(200).json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403);
      throw new Error("Only administrator accounts can delete notifications.");
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};

export const clearAllNotifications = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403);
      throw new Error("Only administrator accounts can clear notifications.");
    }
    await Notification.deleteMany({});
    res.status(200).json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    next(error);
  }
};

export const createNotificationHelper = async ({
  title,
  message,
  type = "info",
  userName = "System",
  targetRoles = ["admin", "manager", "cashier", "accountant"],
  metadata = {},
}) => {
  try {
    return await Notification.create({ title, message, type, userName, targetRoles, metadata });
  } catch (err) {
    console.error("Notification creation helper error:", err.message);
  }
};
