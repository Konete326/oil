import express from "express";
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setDefaultBankAccount,
} from "../controllers/bankAccountController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getBankAccounts).post(createBankAccount);
router.route("/:id").put(updateBankAccount).delete(deleteBankAccount);
router.route("/:id/default").patch(setDefaultBankAccount);

export default router;
