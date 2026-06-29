import mongoose from "mongoose";

const blogContentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ref: {
      type: String,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    date: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["published", "unpublished"],
      default: "unpublished",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("BlogContent", blogContentSchema);
