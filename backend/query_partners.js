import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const ourPartnersSettingsSchema = new mongoose.Schema({}, { strict: false });
const OurPartnersSettings = mongoose.model("OurPartnersSettings", ourPartnersSettingsSchema, "ourpartnerssettings");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const settings = await OurPartnersSettings.findOne();
    console.log(JSON.stringify(settings, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
