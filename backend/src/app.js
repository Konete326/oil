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
import decantingRoutes from "./routes/decantingRoutes.js";
import millRoutes from "./routes/millRoutes.js";
import challanRoutes from "./routes/challanRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import ledgerRoutes from "./routes/ledgerRoutes.js";
import cashRoutes from "./routes/cashRoutes.js";
import salesReportRoutes from "./routes/salesReportRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import profitLossRoutes from "./routes/profitLossRoutes.js";
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      decanting: "/api/decanting",
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
app.use("/api/decanting", decantingRoutes);
app.use("/api/mills", millRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/sales-reports", salesReportRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/profit-loss", profitLossRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
