import mongoose from "mongoose";

const bookingSettingsSchema = new mongoose.Schema(
  {
    singleCourseBookingPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
    groupPackageBookingPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
  },
  { timestamps: true }
);

bookingSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model("BookingSettings", bookingSettingsSchema);
