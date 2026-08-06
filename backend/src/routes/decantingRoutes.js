import express from "express";
import { getDecantingLogs, createDecanting } from "../controllers/decantingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDecantingLogs);
router.post("/", protect, createDecanting);

export default router;
