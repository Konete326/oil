import { SystemLog } from "../models/systemLogModel.js";

export const getSystemLogs = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await SystemLog.deleteMany({ createdAt: { $lt: sevenDaysAgo } });

    const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(200);
    const totalCount = await SystemLog.countDocuments();

    res.status(200).json({
      success: true,
      count: totalCount,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const createSystemLog = async (req, res, next) => {
  try {
    const { title, message, stack, level, source, metadata } = req.body;
    if (!message) {
      res.status(400);
      throw new Error("Log message is required");
    }

    const log = await SystemLog.create({
      title: title || "System Log",
      message,
      stack: stack || "",
      level: level || "error",
      source: source || "frontend",
      userName: req.user?.name || "System",
      userRole: req.user?.role || "admin",
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSingleSystemLog = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403);
      throw new Error("Only administrator accounts can delete system logs.");
    }

    const log = await SystemLog.findByIdAndDelete(req.params.id);
    if (!log) {
      res.status(404);
      throw new Error("System log record not found.");
    }

    res.status(200).json({
      success: true,
      message: "System log record deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllSystemLogs = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403);
      throw new Error("Only administrator accounts can clear system logs.");
    }

    await SystemLog.deleteMany({});

    res.status(200).json({
      success: true,
      message: "All system error logs cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
