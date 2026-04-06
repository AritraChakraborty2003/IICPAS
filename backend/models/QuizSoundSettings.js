import mongoose from "mongoose";

const quizSoundSettingsSchema = new mongoose.Schema(
  {
    correctAnswerSound: {
      type: String,
      required: true,
      default: "/sounds/success.mp3",
    },
    wrongAnswerSound: {
      type: String,
      required: true,
      default: "/sounds/error.mp3",
    },
  },
  {
    timestamps: true,
  }
);

quizSoundSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model("QuizSoundSettings", quizSoundSettingsSchema);
