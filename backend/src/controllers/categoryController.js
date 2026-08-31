import { Category } from "../models/categoryModel.js";
import { connectDB } from "../config/db.js";

export const getCategories = async (req, res, next) => {
  try {
    await connectDB();
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    await connectDB();
    const { name, code } = req.body;
    if (!name || !code) {
      res.status(400);
      throw new Error("Category Name and Code are required");
    }
    const category = await Category.create({ name, code, subcategories: [] });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    await connectDB();
    const { name, code, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    category.name = name || category.name;
    category.code = code || category.code;
    category.isActive = isActive !== undefined ? isActive : category.isActive;
    await category.save();
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await connectDB();
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    await category.deleteOne();
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const addSubcategory = async (req, res, next) => {
  try {
    await connectDB();
    const { name, code } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    category.subcategories.push({ name, code });
    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteSubcategory = async (req, res, next) => {
  try {
    await connectDB();
    const { id, subId } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    category.subcategories = category.subcategories.filter((sub) => sub._id.toString() !== subId);
    await category.save();
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};
