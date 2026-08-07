import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "System Error",
    },
    message: {
      type: String,
      required: true,
    },
    stack: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      enum: ["error", "warning", "info"],
      default: "error",
    },
    source: {
      type: String,
      enum: ["frontend", "backend"],
      default: "frontend",
    },
    userName: {
      type: String,
      default: "System",
    },
    userRole: {
      type: String,
      default: "admin",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

systemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

export const SystemLog = mongoose.model("SystemLog", systemLogSchema);
