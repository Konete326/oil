import { User } from "../models/userModel.js";
import { connectDB } from "../config/db.js";

export const updateUserLanguage = async (req, res, next) => {
  try {
    await connectDB();
    const { preferredLanguage } = req.body;
    if (!preferredLanguage) {
      res.status(400);
      throw new Error("Preferred language is required.");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User profile not found.");
    }
    user.preferredLanguage = preferredLanguage;
    await user.save();
    res.status(200).json({
      success: true,
      preferredLanguage: user.preferredLanguage,
      message: "User language preference persisted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
