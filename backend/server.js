import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { seedDatabase } from "./src/config/seed.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  seedDatabase();
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
