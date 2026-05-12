import mongoose from "mongoose";

const batchSequenceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

batchSequenceSchema.index({ key: 1 }, { unique: true });

export default mongoose.model("BatchSequence", batchSequenceSchema);
