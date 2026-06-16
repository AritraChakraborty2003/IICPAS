import mongoose from "mongoose";

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
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Brochure", brochureSchema);
