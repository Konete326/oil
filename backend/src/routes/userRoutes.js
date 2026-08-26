import express from "express";
import { getUsers, createUser, updateUserPermissions, deleteUser } from "../controllers/userManagementController.js";
import { updateUserLanguage } from "../controllers/userLanguageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/profile/language", protect, updateUserLanguage);
router.route("/").get(protect, getUsers).post(protect, createUser);
router.route("/:id").put(protect, updateUserPermissions).delete(protect, deleteUser);

export default router;
