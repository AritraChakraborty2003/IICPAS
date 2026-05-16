import mongoose from "mongoose";
import dotenv from "dotenv";
import InvoiceCompanySettings from "../models/InvoiceCompanySettings.js";

dotenv.config();

const updateSettings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/iicpa");
    console.log("Connected to MongoDB");

    const settings = await InvoiceCompanySettings.getSettings();
    
    settings.email = "iicpaconnect@gmail.com";
    settings.phone = "9593330999";
    settings.supportEmail = "iicpaconnect@gmail.com";
    settings.supportPhone = "9593330999";
    
    await settings.save();
    
    console.log("Invoice company settings updated successfully:");
    console.log("Email:", settings.email);
    console.log("Phone:", settings.phone);
    console.log("Support Email:", settings.supportEmail);
    console.log("Support Phone:", settings.supportPhone);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error updating settings:", error);
    process.exit(1);
  }
};

updateSettings();
