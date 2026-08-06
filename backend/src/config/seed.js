import { Invoice } from "../models/invoiceModel.js";
import { Activity } from "../models/activityModel.js";
import { Revenue } from "../models/revenueModel.js";
import { Category } from "../models/categoryModel.js";
import { Product } from "../models/productModel.js";

export const seedDatabase = async () => {
  try {
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
        {
          name: "Automotive Oils",
          code: "AUTO-OIL",
          description: "Commercial vehicle and engine lubricants",
          subcategories: [
            { name: "Diesel Engine Oil 15W-40", code: "DEO-15W40", description: "Heavy duty diesel engine oil" },
            { name: "Motorcycle Oil 20W-50", code: "MCO-20W50", description: "4T Motorcycle engine oil" },
          ],
        },
        {
          name: "Base Oils",
          code: "BASE-OIL",
          description: "Raw unblended base stock oils",
          subcategories: [
            { name: "Virgin Base Oil SN 150", code: "SN-150", description: "High grade solvent neutral base oil" },
            { name: "Recycled Base Oil Grade A", code: "RBO-A", description: "Refined recycled base stock" },
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
