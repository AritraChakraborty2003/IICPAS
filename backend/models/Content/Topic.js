import mongoose from "mongoose";
const { Schema, model } = mongoose;

const TopicSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // Markdown content
  quiz: { type: Schema.Types.ObjectId, ref: "Quiz" }, // Reference to quiz
  publishAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Topic = model("Topic", TopicSchema);
export default Topic;
