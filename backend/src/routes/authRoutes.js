import express from "express";
import { loginUser, getMe, refreshToken } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.post("/refresh", protect, refreshToken);

export default router;
