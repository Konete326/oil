import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "danger", "stock", "sale", "login"],
      default: "info",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userName: {
      type: String,
      default: "System",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    targetRoles: {
      type: [String],
      default: ["admin", "manager", "cashier", "accountant"],
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
