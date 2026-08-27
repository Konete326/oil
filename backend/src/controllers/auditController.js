import { AuditLog } from "../models/auditModel.js";
import { connectDB } from "../config/db.js";

export const logActivity = async ({ user, userName, userRole, action, module, details }) => {
  try {
    await connectDB();
    await AuditLog.create({
      user: user ? user._id : undefined,
      userName: userName || (user ? user.name : "System"),
      userRole: userRole || (user ? user.role : "admin"),
      action,
      module,
      details: details || "",
    });
  } catch (err) {
    console.warn("Audit log error:", err.message);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    await connectDB();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await AuditLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });

    const { module, search } = req.query;
    let query = { createdAt: { $gte: thirtyDaysAgo } };

    if (module) query.module = module;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }

    const logs = await AuditLog.find(query).sort({ timestamp: -1, createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};
