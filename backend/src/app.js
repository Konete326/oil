import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
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

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
