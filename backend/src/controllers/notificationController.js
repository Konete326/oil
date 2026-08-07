import { Notification } from "../models/notificationModel.js";
import { Product } from "../models/productModel.js";

export const checkLowStockAlerts = async () => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$stockQuantity", "$minStockAlert"] },
    });
    for (const prod of lowStockProducts) {
      const existing = await Notification.findOne({
        type: "stock",
        "metadata.productId": prod._id,
        createdAt: { $gte: new Date(Date.now() - 12 * 3600 * 1000) },
      });
      if (!existing) {
        await Notification.create({
          title: "Low Stock Warning",
          message: `${prod.name} (SKU: ${prod.sku}) low stock: ${prod.stockQuantity} ${prod.unit} remaining (Limit: ${prod.minStockAlert}).`,
          type: "stock",
          userName: "System",
          targetRoles: ["admin", "manager", "cashier"],
          metadata: { productId: prod._id, currentStock: prod.stockQuantity },
        });
      }
    }
  } catch (err) {
    console.error("Low stock check error:", err.message);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    await checkLowStockAlerts();
    const role = req.user?.role || "admin";
    const filter = role === "admin" ? {} : { targetRoles: { $in: [role] } };

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
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

    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
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
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
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
    res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
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
    return await Notification.create({
      title,
      message,
      type,
      userName,
      targetRoles,
      metadata,
    });
  } catch (err) {
    console.error("Notification creation helper error:", err.message);
  }
};
