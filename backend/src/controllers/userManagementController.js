import { User } from "../models/userModel.js";
import { connectDB } from "../config/db.js";
import { logActivity } from "./auditController.js";

export const getUsers = async (req, res, next) => {
  try {
    await connectDB();
    const filter = req.user && req.user.role === "admin" ? {} : { role: { $ne: "admin" } };
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    await connectDB();
    const { name, email, password, role, permissions, status } = req.body;
    if (!email || !password || !name) {
      res.status(400);
      throw new Error("Name, email, and password are required.");
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400);
      throw new Error("User with this email already exists.");
    }
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "staff",
      permissions: Array.isArray(permissions) ? permissions : ["all"],
      status: status || "Active",
    });
    await logActivity({
      user: req.user,
      action: "CREATE_USER",
      module: "User Management",
      details: `Created user ${user.name} (${user.email}) with role ${user.role}`,
    });
    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions, status: user.status },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserPermissions = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { role, permissions, status, name } = req.body;
    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error("User profile not found.");
    }
    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (Array.isArray(permissions)) user.permissions = permissions;
    if (status) user.status = status;
    await user.save();
    await logActivity({
      user: req.user,
      action: "UPDATE_USER_PERMISSIONS",
      module: "User Management",
      details: `Updated permissions and role for ${user.name} (${user.role})`,
    });
    res.status(200).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions, status: user.status },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    if (req.user && req.user._id.toString() === id.toString()) {
      res.status(400);
      throw new Error("Self-deletion is prohibited. You cannot delete your own active account.");
    }
    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error("User profile not found.");
    }
    if (user.role === "admin") {
      res.status(403);
      throw new Error("Security Restriction: Admin user accounts are protected and cannot be deleted by anyone.");
    }
    await User.findByIdAndDelete(id);
    await logActivity({
      user: req.user,
      action: "DELETE_USER",
      module: "User Management",
      details: `Deleted user ${user.name} (${user.email})`,
    });
    res.status(200).json({ success: true, message: "User account deleted successfully." });
  } catch (error) {
    next(error);
  }
};
