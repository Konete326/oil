import express from "express";
import { getMills, createMill, updateMill, deleteMill } from "../controllers/millController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMills);
router.post("/", protect, createMill);
router.put("/:id", protect, updateMill);
router.delete("/:id", protect, deleteMill);

export default router;
