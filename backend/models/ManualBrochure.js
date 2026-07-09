import mongoose from "mongoose";

const manualBrochureSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "courseType",
    },
    // Single courses reference "Course"; group packages reference "GroupPricing"
    courseType: {
      type: String,
      enum: ["Course", "GroupPricing"],
      default: "Course",
    },
    courseName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    storedFilename: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One manual brochure per course/group
manualBrochureSchema.index({ courseId: 1 }, { unique: true });

export default mongoose.model("ManualBrochure", manualBrochureSchema);
