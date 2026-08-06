import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import decantingRoutes from "./routes/decantingRoutes.js";
import millRoutes from "./routes/millRoutes.js";
import challanRoutes from "./routes/challanRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "EliteDev Oil Management System API is Running",
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

app.use(notFound);
app.use(errorHandler);

export default app;
