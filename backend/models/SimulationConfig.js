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
    // Flexible per-simulation credential fields, e.g.
    // [{ label: "Username", value: "AIR" }, { label: "Password", value: "..." }]
    // or [{ label: "Establishment ID", value: "APHYD..." }]
    credentialFields: [
      {
        _id: false,
        label: { type: String, required: true, trim: true },
        value: { type: String, default: "" },
      },
    ],
    // Legacy shape kept for records created before credentialFields existed
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
