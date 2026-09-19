import mongoose from "mongoose";

const certificateSignatureSettingsSchema = new mongoose.Schema(
  {
    lokeshSign: {
      type: String,
      default: "",
    },
    lokeshTitle: {
      type: String,
      default: "LOKESH GUPTA",
    },
    lokeshSubTitle: {
      type: String,
      default: "FOUNDER & DIRECTOR",
    },
    poonamSign: {
      type: String,
      default: "",
    },
    poonamTitle: {
      type: String,
      default: "POONAM GUPTA",
    },
    poonamSubTitle: {
      type: String,
      default: "CO-FOUNDER & ACADEMIC HEAD",
    },
  },
  { timestamps: true }
);

certificateSignatureSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model(
  "CertificateSignatureSettings",
  certificateSignatureSettingsSchema
);
