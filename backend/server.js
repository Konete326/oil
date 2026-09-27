import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { seedDatabase } from "./src/config/seed.js";
import { startShiftAutoCloseScheduler } from "./src/utils/shiftAutoCloser.js";

const PORT = process.env.PORT || 5000;

connectDB().then((conn) => {
  if (conn) {
    seedDatabase();
    startShiftAutoCloseScheduler();
  }
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
