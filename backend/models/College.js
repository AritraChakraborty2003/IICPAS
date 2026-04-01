import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  document: { type: String },
  image: { type: String }, // Profile image field
  status: {
    type: String,
    enum: ["not approved", "approved", "inactive"],
    default: "not approved",
  },
  otp: String,
  otpExpiry: Date,
}, {
  timestamps: true, // Add timestamps
});

export default mongoose.model("colleges", collegeSchema);
