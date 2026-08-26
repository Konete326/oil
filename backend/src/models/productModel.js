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
      default: "Medium Can 4L",
      trim: true,
    },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    stockQuantity: { type: Number, default: 0 },
    unit: { type: String, default: "Cans", trim: true },
    minStockAlert: { type: Number, default: 10 },
    description: { type: String },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
