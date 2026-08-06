import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.post("/:id/subcategories", addSubcategory);
router.delete("/:id/subcategories/:subId", deleteSubcategory);

export default router;
