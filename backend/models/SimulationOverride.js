import mongoose from "mongoose";

// Per-insert credential override created from the course editor's Quick
// Inserts. Unlike SimulationConfig, the slug is NOT unique — the same
// simulation can carry different credentials in different courses. The
// inserted simulation URL references a record by id via ?simCfg=<id>,
// and it takes precedence over the slug-level SimulationConfig.
const SimulationOverrideSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
    },
    credentialFields: [
      {
        _id: false,
        label: { type: String, required: true, trim: true },
        value: { type: String, default: "" },
      },
    ],
    bannerText: {
      type: String,
      default: "",
    },
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

const SimulationOverride =
  mongoose.models.SimulationOverride ||
  mongoose.model("SimulationOverride", SimulationOverrideSchema);

export default SimulationOverride;
