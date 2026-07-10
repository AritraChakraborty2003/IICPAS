import mongoose from "mongoose";

const SimulationConfigSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    credentials: {
      username: { type: String, default: "AIR" },
      password: { type: String, default: "IICPA@123" },
    },
    // When false, the simulation login accepts any input
    requireCredentialValidation: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent OverwriteModelError
const SimulationConfig =
  mongoose.models.SimulationConfig ||
  mongoose.model("SimulationConfig", SimulationConfigSchema);

export default SimulationConfig;
