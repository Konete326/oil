import express from "express";
import {
  getSystemLogs,
  createSystemLog,
  deleteSingleSystemLog,
  clearAllSystemLogs,
} from "../controllers/systemLogController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getSystemLogs);
router.post("/", createSystemLog);
router.delete("/clear-all", clearAllSystemLogs);
router.delete("/:id", deleteSingleSystemLog);

export default router;
