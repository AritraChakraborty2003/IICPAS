import mongoose from "mongoose";
const { Schema, model } = mongoose;

const CourseSchema = new Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String },
  price: { type: Number, required: true },
  image: { type: String }, // Image URL or path
  dashboardImage: { type: String }, // Specifically sized image for Dashboard cards
  level: {
    type: String,
    enum: ["Executive Level", "Professional Level"],
  },
  discount: { type: Number, default: 0 },
  status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
  duration: { type: String, default: "" },
  position: { type: Number, default: 0 }, // Course duration (e.g., "3 months", "6 weeks")

  // --- Added fields to match your form ---
  video: { type: String }, // Video URL or ID
  description: { type: String }, // HTML from ReactQuill
  examCert: { type: String }, // HTML from ReactQuill
  caseStudy: { type: String }, // HTML from ReactQuill
  assignment: { type: String }, // HTML from Jodit Editor
  simulations: [
    {
      title: { type: String },
      description: { type: String },
      imageUrl: { type: String },
      order: { type: Number, default: 0 },
    },
  ], // Array of simulation objects

  seoTitle: { type: String },
  seoKeywords: { type: String }, // Store as comma-separated or array (if needed)
  seoDescription: { type: String }, // HTML from ReactQuill

  // Meta tags for additional SEO
  metaTitle: { type: String },
  metaKeywords: { type: String },
  metaDescription: { type: String },

  chapters: [{ type: Schema.Types.ObjectId, ref: "Chapter" }],

  // Dynamic pricing and UI configuration
  pricing: {
    recordedSession: {
      title: { type: String, default: "DIGITAL HUB RECORDED SESSION" },
      buttonText: { type: String, default: "Add Digital Hub" },
      price: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      finalPrice: { type: Number, default: 0 },
    },
    liveSession: {
      title: { type: String, default: "DIGITAL HUB LIVE SESSION" },
      buttonText: { type: String, default: "Add Digital Hub+" },
      price: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      finalPrice: { type: Number, default: 0 },
    },
    recordedSessionCenter: {
      title: { type: String, default: "DIGITAL HUB+ RECORDED SESSION+ CENTER" },
      buttonText: { type: String, default: "Add Digital Hub+ Center" },
      price: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      finalPrice: { type: Number, default: 0 },
    },
    liveSessionCenter: {
      title: { type: String, default: "DIGITAL HUB+ LIVE SESSION+ CENTER" },
      buttonText: { type: String, default: "Add Digital Hub+ Center" },
      price: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      finalPrice: { type: Number, default: 0 },
    },
  },

  // Dynamic tab configuration
  tabs: {
    syllabus: { label: { type: String, default: "Syllabus" } },
    assignment: { label: { type: String, default: "Assignment" } },
    assessment: {
      label: { type: String, default: "Assessment & Certificates" },
    },
    schedule: { label: { type: String, default: "Live Schedule +" } },
    simulator: { label: { type: String, default: "Simulator" } },
  },

  // Rating fields
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Course = model("Course", CourseSchema);
export default Course;
