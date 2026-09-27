import { Product } from "../models/productModel.js";

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
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
      packagingType,
      costPrice,
      sellingPrice,
      stockQuantity,
      unit,
      description,
      imageUrl,
    } = req.body;

    if (!name || costPrice === undefined) {
      res.status(400);
      throw new Error("Name and Cost Price are required");
    }
    if (Number(sellingPrice) > 0 && Number(sellingPrice) < Number(costPrice)) {
      res.status(400);
      throw new Error(`Loss detected: Selling rate (Rs ${sellingPrice}) cannot be lower than purchase rate (Rs ${costPrice}).`);
    }

    let finalSku = sku ? String(sku).trim().toUpperCase() : "";
    if (!finalSku) {
      const count = await Product.countDocuments();
      let candidate = `LUB-${count + 1001}`;
      while (await Product.exists({ sku: candidate })) {
        candidate = `LUB-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      finalSku = candidate;
    }

    const existingProduct = await Product.findOne({ sku: finalSku });
    if (existingProduct) {
      let cand = `LUB-${Math.floor(1000 + Math.random() * 9000)}`;
      while (await Product.exists({ sku: cand })) {
        cand = `LUB-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      finalSku = cand;
    }

    const product = await Product.create({
      name,
      sku: finalSku,
      packagingType: packagingType || "Liter",
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      unit: unit || "Liters",
      description,
      imageUrl: imageUrl || "",
    });

    res.status(201).json({ success: true, data: product });
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

    delete req.body.brand;
    delete req.body.category;
    delete req.body.subcategoryName;
    delete req.body.viscosity;
    delete req.body.minStockAlert;

    const finalCost = req.body.costPrice !== undefined ? Number(req.body.costPrice) : product.costPrice;
    const finalSelling = req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : product.sellingPrice;
    if (finalSelling > 0 && finalSelling < finalCost) {
      res.status(400);
      throw new Error(`Loss detected: Selling rate (Rs ${finalSelling}) cannot be lower than purchase rate (Rs ${finalCost}).`);
    }

    Object.assign(product, req.body);
    await product.save();

    res.status(200).json({ success: true, data: product });
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
