import mongoose from "mongoose";

const UniversityCourseSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["UG Programs", "PG Programs", "Ph.D Programs"],
      required: true,
    },
    about: {
      type: String,
      default: "",
    },
    eligibility: [
      {
        type: String,
        trim: true,
      },
    ],
    highlights: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      default: "",
    },
    careerProspects: [
      {
        type: String,
        trim: true,
      },
    ],
    duration: {
      type: String,
      default: "",
    },
    contactSection: {
      phone: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "",
      },
      address: {
        type: String,
        default: "",
      },
      showForm: {
        type: Boolean,
        default: true,
      },
    },
    seo: {
      title: {
        type: String,
        default: "",
      },
      description: {
        type: String,
        default: "",
      },
      keywords: {
        type: String,
        default: "",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

UniversityCourseSchema.index({ category: 1 });
UniversityCourseSchema.index({ isActive: 1 });

const UniversityCourse = mongoose.model(
  "UniversityCourse",
  UniversityCourseSchema
);

export default UniversityCourse;
