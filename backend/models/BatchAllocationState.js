import mongoose from "mongoose";

const batchAllocationStateSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      required: true,
      enum: ["online", "offline"],
      unique: true,
      index: true,
    },
    activeBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchManager",
      default: null,
    },
    activeBatchCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    lastAllocatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

batchAllocationStateSchema.index({ mode: 1 }, { unique: true });

export default mongoose.model("BatchAllocationState", batchAllocationStateSchema);
