import { Invoice } from "../models/invoiceModel.js";
import { Activity } from "../models/activityModel.js";
import { Revenue } from "../models/revenueModel.js";
import { Category } from "../models/categoryModel.js";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
import { Mill } from "../models/millModel.js";

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

    const millCount = await Mill.countDocuments();
    if (millCount === 0) {
      await Mill.insertMany([
        {
          name: "Al-Karam Textile Mills Ltd",
          code: "AKTM-01",
          zone: "Landhi Industrial Area, Karachi",
          contactPerson: "Tariq Mahmood",
          phone: "0300-8219401",
          ntnNumber: "0712394-8",
          contractRatePerLiter: 530,
          creditLimit: 2500000,
          currentBalance: 1250000,
          address: "HT/11, Landhi Industrial Zone, Karachi",
        },
        {
          name: "Gul Ahmed Textile Mills Ltd",
          code: "GATM-02",
          zone: "Korangi Industrial Area, Karachi",
          contactPerson: "Kamran Siddiqui",
          phone: "0321-9201844",
          ntnNumber: "0891230-1",
          contractRatePerLiter: 545,
          creditLimit: 3000000,
          currentBalance: 890000,
          address: "Plot No. 82, Main Korangi Industrial Road, Karachi",
        },
        {
          name: "Yunus Textile Mills Ltd",
          code: "YTML-03",
          zone: "SITE Industrial Area, Karachi",
          contactPerson: "Faisal Naeem",
          phone: "0333-2194811",
          ntnNumber: "1429812-4",
          contractRatePerLiter: 525,
          creditLimit: 2000000,
          currentBalance: 450000,
          address: "B-40, Estate Avenue, SITE, Karachi",
        },
      ]);
    }

    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.insertMany([
        {
          name: "Textile Processing Oils",
          code: "TEX-OIL",
          description: "Specialized oils for Karachi textile mills (Spinning, Weaving, Knitting)",
          subcategories: [
            { name: "Spindle Oil 10", code: "SPD-10", description: "Low viscosity high speed spindle oil" },
            { name: "Needle Oil 22", code: "NDL-22", description: "Knitting machine washable needle oil" },
            { name: "Coning & Weaving Oil", code: "CNG-WVG", description: "Yarn processing and coning oil" },
          ],
        },
        {
          name: "Industrial Lubricants",
          code: "IND-LUB",
          description: "Heavy machinery, hydraulic systems, and gear lubricants",
          subcategories: [
            { name: "Hydraulic Oil ISO 68", code: "HYD-68", description: "Anti-wear hydraulic fluid" },
            { name: "Gear Oil 220", code: "GER-220", description: "Heavy duty industrial gear oil" },
            { name: "Transformer Oil", code: "TRF-OIL", description: "Electrical insulating oil" },
          ],
        },
      ]);
    }

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const texCat = await Category.findOne({ code: "TEX-OIL" });
      const indCat = await Category.findOne({ code: "IND-LUB" });

      if (texCat && indCat) {
        await Product.insertMany([
          {
            name: "Super Spindle Lube 10",
            sku: "SKU-TEX-001",
            category: texCat._id,
            subcategoryName: "Spindle Oil 10",
            brand: "Shell",
            grade: "ISO VG 10",
            viscosity: "10 cSt",
            packagingType: "Master Drum 208L",
            costPrice: 420,
            sellingPrice: 550,
            stockQuantity: 25,
            unit: "Drums",
            minStockAlert: 5,
            description: "Premium high-speed spindle lubricant for textile spinning frames",
          },
          {
            name: "Hydro-Max ISO 68 Fluid",
            sku: "SKU-IND-002",
            category: indCat._id,
            subcategoryName: "Hydraulic Oil ISO 68",
            brand: "Mobil",
            grade: "ISO VG 68",
            viscosity: "68 cSt",
            packagingType: "Master Drum 208L",
            costPrice: 480,
            sellingPrice: 620,
            stockQuantity: 4,
            unit: "Drums",
            minStockAlert: 10,
            description: "Anti-wear hydraulic oil for heavy industrial machinery",
          },
        ]);
      }
    }

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
