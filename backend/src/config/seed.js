import { Invoice } from "../models/invoiceModel.js";
import { Activity } from "../models/activityModel.js";
import { Revenue } from "../models/revenueModel.js";

export const seedDatabase = async () => {
  try {
    const invoiceCount = await Invoice.countDocuments();
    if (invoiceCount === 0) {
      await Invoice.insertMany([
        { invoiceId: "1045", customer: "Northwind Labs", amount: "$2,400.00", status: "Paid" },
        { invoiceId: "1044", customer: "Blue River Co.", amount: "$890.00", status: "Pending" },
        { invoiceId: "1043", customer: "Oak Street Studio", amount: "$5,120.00", status: "Paid" },
        { invoiceId: "1042", customer: "Harbor Freight LLC", amount: "$310.50", status: "Overdue" },
      ]);
    }

    const activityCount = await Activity.countDocuments();
    if (activityCount === 0) {
      await Activity.insertMany([
        { title: "Invoice #1045 marked paid", time: "About 2 hours ago", iconType: "card" },
        { title: "Jordan joined the team", time: "This morning", iconType: "user" },
        { title: "Weekly summary exported", time: "Yesterday", iconType: "file" },
        { title: "Dashboard v2 shipped to prod", time: "2 days ago", iconType: "rocket" },
      ]);
    }

    const revenueCount = await Revenue.countDocuments();
    if (revenueCount === 0) {
      await Revenue.insertMany([
        { day: "Mon", sales: 3200 },
        { day: "Tue", sales: 3001 },
        { day: "Wed", sales: 3780 },
        { day: "Thu", sales: 4100 },
        { day: "Fri", sales: 4520 },
        { day: "Sat", sales: 4004 },
        { day: "Sun", sales: 5340 },
      ]);
    }
  } catch (error) {
    console.error("Database seed error:", error.message);
  }
};
