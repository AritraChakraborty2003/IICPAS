import mongoose from "mongoose";

const jobSidebarMarqueeItemSchema = new mongoose.Schema(
  {
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const jobSidebarMarqueeSettingsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Career Tools",
    },
    subtitle: {
      type: String,
      trim: true,
      default: "Finance and accounting job essentials",
    },
    durationSeconds: {
      type: Number,
      min: 8,
      max: 60,
      default: 18,
    },
    items: {
      type: [jobSidebarMarqueeItemSchema],
      default: [
        { icon: "briefcase", label: "Openings" },
        { icon: "building", label: "Companies" },
        { icon: "calculator", label: "Accounts" },
        { icon: "fileText", label: "CV Ready" },
        { icon: "badgeCheck", label: "Verified" },
        { icon: "chart", label: "Growth" },
      ],
    },
  },
  { timestamps: true }
);

jobSidebarMarqueeSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model(
  "JobSidebarMarqueeSettings",
  jobSidebarMarqueeSettingsSchema
);
