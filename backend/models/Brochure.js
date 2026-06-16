import mongoose from "mongoose";

const overlayImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 150 },
    opacity: { type: Number, default: 1 },
    zIndex: { type: Number, default: 1 },
  },
  { _id: true }
);

const brochurePageSchema = new mongoose.Schema(
  {
    pageTitle: { type: String, default: "" },
    backgroundImage: { type: String, default: "" },
    backgroundColor: { type: String, default: "#ffffff" },
    overlayImages: [overlayImageSchema],
    content: { type: String, default: "" },
    textX: { type: Number, default: 24 },
    textY: { type: Number, default: 24 },
    textColor: { type: String, default: "#1a1a1a" },
    chapterId: { type: String, default: "" },
    topicId: { type: String, default: "" },
  },
  { _id: true }
);

const brochureSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    courseName: { type: String, required: true },
    chapters: [
      {
        chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
        chapterName: { type: String },
        topics: [
          {
            topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
            topicName: { type: String },
          },
        ],
      },
    ],
    // Cover page settings
    coverPage: {
      backgroundImage: { type: String, default: "" },
      backgroundColor: { type: String, default: "#1e3a5f" },
      overlayImages: [overlayImageSchema],
      content: { type: String, default: "" },
      textX: { type: Number, default: 24 },
      textY: { type: Number, default: 24 },
      textColor: { type: String, default: "#ffffff" },
    },
    // Per-section editor pages
    pages: [brochurePageSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Brochure", brochureSchema);
