import mongoose from "mongoose";

const ourPartnerItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const ourPartnersSettingsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Our Partners",
    },
    durationSeconds: {
      type: Number,
      min: 8,
      max: 60,
      default: 18,
    },
    items: {
      type: [ourPartnerItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

ourPartnersSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model("OurPartnersSettings", ourPartnersSettingsSchema);
