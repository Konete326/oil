import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { connectDB } from "../config/db.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "al_khaleej_lubricants_jwt_secret_key_2026", {
    expiresIn: "30d",
  });
};

export const loginUser = async (req, res, next) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide both email and password");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    await connectDB();
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};
