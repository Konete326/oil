import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import millRoutes from "./routes/millRoutes.js";
import challanRoutes from "./routes/challanRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import ledgerRoutes from "./routes/ledgerRoutes.js";
import cashRoutes from "./routes/cashRoutes.js";
import salesReportRoutes from "./routes/salesReportRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import profitLossRoutes from "./routes/profitLossRoutes.js";
import financialReportRoutes from "./routes/financialReportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import systemLogRoutes from "./routes/systemLogRoutes.js";
import dataResetRoutes from "./routes/dataResetRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: "Database unavailable. Try again." });
  }
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("dev"));

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Al Khaleej Lubricants Management System API is Running",
    status: "Active",
    timestamp: new Date(),
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      dashboard: "/api/dashboard",
      categories: "/api/categories",
      products: "/api/products",
      mills: "/api/mills",
      challans: "/api/challans",
      pos: "/api/pos/sales",
      ledger: "/api/ledger",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/mills", millRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/sales-reports", salesReportRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/profit-loss", profitLossRoutes);
app.use("/api/financial-reports", financialReportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/system-logs", systemLogRoutes);
app.use("/api/data-reset", dataResetRoutes);
app.use("/api/sync", syncRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
