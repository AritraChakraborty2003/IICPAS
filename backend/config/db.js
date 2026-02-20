import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  if (process.env.SKIP_DB === "true") {
    console.warn("⚠️ SKIP_DB=true, skipping MongoDB connection (running in demo mode).");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
