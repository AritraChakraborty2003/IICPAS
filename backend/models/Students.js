import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String }, // profile image path
    mode: { type: String }, // Digital Hub+Virtual or Digital Hub+Center
    location: { type: String },
    center: { type: String },

    receipts: [
      {
        id: String,
        file: String, // path to PDF receipt
      },
    ],

    course: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    cart: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        sessionType: {
          type: String,
          enum: ["recorded", "live"],
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    enrolledLiveSessions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession" },
    ],
    enrolledRecordedSessions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    ],
    enrolledLiveSessionsCenter: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    ],
    enrolledRecordedSessionsCenter: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    ],

    enrolledLiveSessions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession" },
    ],
    enrolledRecordedSessions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    ],

    otp: { type: String },
    otpExpiry: { type: Date },
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    coinBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", StudentSchema);
export default Student;
