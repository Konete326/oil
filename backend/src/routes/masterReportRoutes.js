import express from "express";
import { getMasterPlatformReport } from "../controllers/masterReportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, getMasterPlatformReport);

export default router;
