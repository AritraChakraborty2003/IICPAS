import mongoose from "mongoose";
const { Schema, model } = mongoose;

// One AI generation request sent to the n8n workflow. n8n either answers in
// the same HTTP response, or posts the result later to /api/ai/callback/:id.
const AiJobSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "structure", // course outline (chapters + lessons)
        "chapter", // regenerate one outline chapter
        "outline-topic", // regenerate one outline lesson
        "course-details", // Create/Edit Course form auto-fill (JSON)
        "content", // full topic / case study / assignment / description HTML
        "assist", // editor AI tab action returning HTML
        "assist-json", // editor AI tab action returning MCQs / FAQs / flashcards
        "review", // editor Review tab (spelling, grammar, readability)
        "topics", // AI Topic Generator (topics for one chapter)
        "lesson", // AI content generator: structured lesson JSON -> HTML
        // legacy values kept so older job records stay valid
        "document",
        "topic-content",
      ],
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "failed"],
      index: true,
    },
    input: { type: Schema.Types.Mixed, default: {} },
    prompt: { type: String, default: "" },
    rawOutput: { type: String, default: "" },
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const AiJob = model("AiJob", AiJobSchema);
export default AiJob;
