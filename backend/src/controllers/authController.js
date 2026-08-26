import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { connectDB } from "../config/db.js";
import { createNotificationHelper } from "./notificationController.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "al_khaleej_lubricants_jwt_secret_key_2026", {
    expiresIn: "365d",
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
      await createNotificationHelper({
        title: "User Session Authenticated",
        message: `${user.name} (${user.role.toUpperCase()}) logged into portal`,
        type: "login",
        userName: user.name,
        targetRoles: ["admin", "manager"],
      });

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

export const refreshToken = async (req, res, next) => {
  try {
    await connectDB();
    const user = req.user;
    if (!user) {
      res.status(401);
      throw new Error("User session invalid");
    }

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
  } catch (error) {
    next(error);
  }
};
