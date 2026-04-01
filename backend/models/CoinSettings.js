import mongoose from "mongoose";

const coinSettingsSchema = new mongoose.Schema(
  {
    quizCompleteCoins: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    testimonialApprovedCoins: {
      type: Number,
      required: true,
      default: 3,
      min: 0,
    },
    purchaseSuccessCoins: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
    },
  },
  { timestamps: true }
);

coinSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model("CoinSettings", coinSettingsSchema);
