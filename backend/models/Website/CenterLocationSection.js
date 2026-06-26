import mongoose from "mongoose";

const centerLocationSectionSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      required: true,
      default: "Find Your Nearest Center",
    },
    titlePart1: {
      type: String,
      required: true,
      default: "Search & Book",
    },
    titleHighlight1: {
      type: String,
      required: true,
      default: "Courses",
    },
    titlePart2: {
      type: String,
      required: true,
      default: "at",
    },
    titleHighlight2: {
      type: String,
      required: true,
      default: "IICPA Centers",
    },
    description: {
      type: String,
      required: true,
      default: "Find the nearest IICPA center, explore available courses, and book your preferred training program with just a few clicks.",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CenterLocationSection = mongoose.model("CenterLocationSection", centerLocationSectionSchema);
export default CenterLocationSection;
