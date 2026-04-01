import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  fullName: String,
  image: String,
  phone: String,
  email: { type: String, unique: true },
  password: String,
  documentPath: String,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "inactive"],
    default: "pending",
  },
  otp: String,
  otpExpiry: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
companySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Company", companySchema);
