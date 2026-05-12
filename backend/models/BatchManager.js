import mongoose from "mongoose";

const batchManagerSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      required: true,
      enum: ["online", "offline"],
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

batchManagerSchema.statics.getBatches = async function () {
  return this.find({}).sort({ createdAt: -1 });
};

export default mongoose.model("BatchManager", batchManagerSchema);
