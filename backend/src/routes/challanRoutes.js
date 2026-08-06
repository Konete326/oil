import express from "express";
import { getChallans, createChallan, updateChallanStatus } from "../controllers/challanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getChallans);
router.post("/", protect, createChallan);
router.put("/:id/status", protect, updateChallanStatus);

export default router;
