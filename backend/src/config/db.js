import mongoose from "mongoose";

let cachedPromise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const opts = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferCommands: true,
  };

  cachedPromise = mongoose.connect(process.env.MONGO_URI, opts).then((m) => {
    console.log(`MongoDB Connected: ${m.connection.host}`);
    return m.connection;
  }).catch((err) => {
    cachedPromise = null;
    console.error(`MongoDB Connection Error: ${err.message}`);
    throw err;
  });

  return cachedPromise;
};
