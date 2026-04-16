import mongoose from "mongoose";
const { Schema, model } = mongoose;

const TopicLessonSchema = new Schema(
  {
    kind: {
      type: String,
      required: true,
      enum: ["recorded", "live"],
    },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
    publishAt: { type: Date, default: Date.now },
    sourceType: {
      type: String,
      default: "link",
      enum: ["upload", "link", "liveSession", "legacy"],
    },
    sourceUrl: { type: String, default: "" },
    liveSessionId: {
      type: Schema.Types.ObjectId,
      ref: "LiveSession",
      default: null,
    },
  },
  { _id: true }
);

const TopicSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // Markdown content
  introVideo: { type: String, default: "" }, // Optional intro video URL
  lessons: { type: [TopicLessonSchema], default: [] },
  quiz: { type: Schema.Types.ObjectId, ref: "Quiz" }, // Reference to quiz
  publishAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Topic = model("Topic", TopicSchema);
export default Topic;
