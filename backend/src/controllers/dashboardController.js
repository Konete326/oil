import { Invoice } from "../models/invoiceModel.js";
import { Activity } from "../models/activityModel.js";
import { Revenue } from "../models/revenueModel.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(10);
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(10);
    const revenue = await Revenue.find();

    const stats = [
      { label: "Active users", value: "847", delta: 3.1 },
      { label: "Revenue", value: "$18,290", delta: 12.4 },
      { label: "Conversion Rate", value: "3.28%", delta: -0.4 },
      { label: "New signups", value: "142", delta: 8.7 },
    ];

    res.status(200).json({
      success: true,
      data: {
        stats,
        invoices,
        activities,
        revenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const { invoiceId, customer, amount, status } = req.body;
    const invoice = await Invoice.create({ invoiceId, customer, amount, status });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};
