import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentType: {
      type: String,
      enum: ["booking", "balance"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const courseBookingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    studentEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    itemType: {
      type: String,
      enum: ["single_course", "group_package"],
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    groupPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupPricing",
      default: null,
    },
    itemTitle: {
      type: String,
      required: true,
      trim: true,
    },
    sessionType: {
      type: String,
      enum: ["recorded", "live", null],
      default: null,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    bookingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["prebooked", "partially_paid", "fully_paid", "cancelled"],
      default: "prebooked",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
    invoiceSent: {
      type: Boolean,
      default: false,
    },
    invoiceSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

courseBookingSchema.index(
  { studentId: 1, itemType: 1, courseId: 1, groupPackageId: 1, sessionType: 1 },
  { name: "booking_student_item_idx" }
);

export default mongoose.model("CourseBooking", courseBookingSchema);
