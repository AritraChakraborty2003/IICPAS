import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ChapterSchema = new Schema({
  title: { type: String, required: true },
  topics: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
  subchapters: [{ type: Schema.Types.ObjectId, ref: "SubChapter" }], // Add sub-chapters
  order: { type: Number, default: 0 }, // For ordering chapters
  status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
  
  // SEO fields (like courses)
  seoTitle: { type: String },
  seoKeywords: { type: String },
  seoDescription: { type: String },
  
  // Meta tags for additional SEO
  metaTitle: { type: String },
  metaKeywords: { type: String },
  metaDescription: { type: String },
  publishAt: { type: Date, default: Date.now },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Chapter = model("Chapter", ChapterSchema);
export default Chapter;
