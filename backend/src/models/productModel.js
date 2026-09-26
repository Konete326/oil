import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    brand: { type: String, default: "" },
    packagingType: {
      type: String,
      default: "Liter",
      trim: true,
    },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, default: 0 },
    stockQuantity: { type: Number, default: 0 },
    unit: { type: String, default: "Liters", trim: true },
    description: { type: String },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (this.sellingPrice > 0 && this.sellingPrice < this.costPrice) {
    return next(new Error(`Loss detected: Selling rate (Rs ${this.sellingPrice}) cannot be lower than purchase rate (Rs ${this.costPrice}).`));
  }
  next();
});

export const Product = mongoose.model("Product", productSchema);
