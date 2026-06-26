import mongoose from "mongoose";

const joinLiveSectionSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      required: true,
      default: "🎓 Join Live",
    },
    title: {
      type: String,
      required: true,
      default: "Join Our Live Class, \\nStart Your Online",
    },
    titleHighlight: {
      type: String,
      required: true,
      default: "Journey",
    },
    description: {
      type: String,
      required: true,
      default: "Experience interactive learning with our expert instructors in real-time sessions",
    },
    liveTagText: {
      type: String,
      required: true,
      default: "LIVE · 01:30:56",
    },
    buttonText: {
      type: String,
      required: true,
      default: "Join Live Class Now",
    },
    image: {
      url: {
        type: String,
        default: "/images/live-class.jpg",
      },
      alt: {
        type: String,
        default: "Live Class Session",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const JoinLiveSection = mongoose.model("JoinLiveSection", joinLiveSectionSchema);
export default JoinLiveSection;
