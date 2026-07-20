import mongoose from "mongoose";

const courseDisplaySettingsSchema = new mongoose.Schema(
  {
    showIndividualCourses: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

courseDisplaySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model("CourseDisplaySettings", courseDisplaySettingsSchema);
