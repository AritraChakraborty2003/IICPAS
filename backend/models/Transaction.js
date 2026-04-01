import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  sessionType: {
    type: String,
    enum: ["recorded", "live"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  utrNumber: {
    type: String,
    default: "",
  },
  paymentScreenshot: {
    type: String, // File path to uploaded screenshot
    default: "",
  },
  paymentMethod: {
    type: String,
    enum: ["manual", "razorpay"],
    default: "manual",
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
  billingAddress: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  shippingAddress: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  sameAsBilling: {
    type: Boolean,
    default: true,
  },
  bundleItems: {
    type: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        sessionType: {
          type: String,
          enum: ["recorded", "live"],
        },
        quantity: {
          type: Number,
          default: 1,
        },
        title: {
          type: String,
          default: "",
        },
        unitPrice: {
          type: Number,
          default: 0,
        },
      },
    ],
    default: [],
  },
  additionalNotes: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  adminNotes: {
    type: String,
    default: "",
  },
  approvedBy: {
    type: String,
    default: null,
  },
  receiptSent: {
    type: Boolean,
    default: false,
  },
  receiptSentAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
TransactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;
