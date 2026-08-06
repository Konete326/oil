import { Product } from "../models/productModel.js";

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate("category", "name code").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      subcategoryName,
      brand,
      grade,
      viscosity,
      packagingType,
      costPrice,
      sellingPrice,
      stockQuantity,
      unit,
      minStockAlert,
      description,
    } = req.body;

    if (!name || !sku || !category || !brand || costPrice === undefined || sellingPrice === undefined) {
      res.status(400);
      throw new Error("Name, SKU, Category, Brand, Cost Price, and Selling Price are required");
    }

    const product = await Product.create({
      name,
      sku,
      category,
      subcategoryName,
      brand,
      grade,
      viscosity,
      packagingType,
      costPrice,
      sellingPrice,
      stockQuantity: stockQuantity || 0,
      unit: unit || "Liters",
      minStockAlert: minStockAlert || 10,
      description,
    });

    const populated = await Product.findById(product._id).populate("category", "name code");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    Object.assign(product, req.body);
    await product.save();

    const populated = await Product.findById(product._id).populate("category", "name code");
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};
