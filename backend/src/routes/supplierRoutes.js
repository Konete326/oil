import express from "express";
import {
  getSuppliers,
  createSupplier,
  createSupplierPayment,
  getSupplierLedger,
} from "../controllers/supplierController.js";
import {
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierCrudController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getSuppliers).post(protect, createSupplier);
router.post("/payment", protect, createSupplierPayment);
router.get("/ledger/:supplierId?", protect, getSupplierLedger);
router
  .route("/:id")
  .get(protect, getSupplierById)
  .put(protect, updateSupplier)
  .delete(protect, deleteSupplier);

export default router;
