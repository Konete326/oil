import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { logActivity } from "../controllers/auditController.js";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "al_khaleej_lubricants_jwt_secret_key_2026");
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        res.status(401);
        throw new Error("User token invalid or expired");
      }
      return next();
    } catch (error) {
      res.status(401);
      return next(new Error("Not authorized, token failed"));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error("Not authorized, no token provided"));
  }
};

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error("Not authorized, authentication required"));
    }

    if (req.user.role === "admin" || (Array.isArray(req.user.permissions) && req.user.permissions.includes("all"))) {
      return next();
    }

    if (Array.isArray(req.user.permissions) && req.user.permissions.includes(requiredPermission)) {
      return next();
    }

    await logActivity({
      user: req.user,
      userName: req.user.name,
      userRole: req.user.role,
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      module: "User Management",
      details: `Denied access to module '${requiredPermission}' on ${req.method} ${req.originalUrl || req.url}`,
    });

    res.status(403);
    return next(new Error(`Access denied: Required permission '${requiredPermission}' not granted to your account`));
  };
};
