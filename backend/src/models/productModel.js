import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subcategoryName: { type: String },
    brand: { type: String, required: true },
    grade: { type: String },
    viscosity: { type: String },
    packagingType: {
      type: String,
      enum: ["Master Drum 208L", "Small Can 1L", "Medium Can 4L", "Bucket 20L", "Bulk Liter"],
      default: "Master Drum 208L",
    },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    stockQuantity: { type: Number, default: 0 },
    unit: { type: String, default: "Liters" },
    minStockAlert: { type: Number, default: 10 },
    description: { type: String },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
