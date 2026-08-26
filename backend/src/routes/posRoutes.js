import express from "express";
import { getPosSales, createPosSale, deletePosSale } from "../controllers/posController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/sales", protect, getPosSales);
router.post("/sales", protect, createPosSale);
router.delete("/sales/:id", protect, deletePosSale);

export default router;
