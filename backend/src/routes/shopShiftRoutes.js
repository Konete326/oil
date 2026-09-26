import express from "express";
import { getCurrentShiftStatus, closeShift, getShiftHistory } from "../controllers/shopShiftController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/status", protect, getCurrentShiftStatus);
router.post("/close", protect, closeShift);
router.get("/history", protect, getShiftHistory);

export default router;
