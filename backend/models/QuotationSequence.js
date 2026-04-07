import mongoose from "mongoose";

const quotationSequenceSchema = new mongoose.Schema(
  {
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
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

quotationSequenceSchema.index({ prefix: 1 }, { unique: true });

export default mongoose.model("QuotationSequence", quotationSequenceSchema);
