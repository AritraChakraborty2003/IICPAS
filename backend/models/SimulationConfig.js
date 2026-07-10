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
      username: { type: String, default: "" },
      password: { type: String, default: "" },
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
