import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    subcategories: [subcategorySchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
