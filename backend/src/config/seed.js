import { Invoice } from "../models/invoiceModel.js";
import { Activity } from "../models/activityModel.js";
import { Revenue } from "../models/revenueModel.js";
import { User } from "../models/userModel.js";

export const seedDatabase = async () => {
  try {
    const adminUser = await User.findOne({ email: "admin@gmail.com" });
    if (!adminUser) {
      await User.create({
        name: "Admin User",
        email: "admin@gmail.com",
        password: "admin123",
        role: "admin",
      });
    }

    await Invoice.deleteMany({ customer: { $in: ["Northwind Labs", "Blue River Co.", "Oak Street Studio", "Harbor Freight LLC"] } });
    await Activity.deleteMany({ title: { $in: ["Invoice #1045 marked paid", "Jordan joined the team", "Weekly summary exported", "Dashboard v2 shipped to prod"] } });
    await Revenue.deleteMany({ day: { $in: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] } });
  } catch (error) {
    console.error("Database seed error:", error.message);
  }
};
