import mongoose from "mongoose";

const coinTransactionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "QUIZ_COMPLETE",
        "TESTIMONIAL_APPROVED",
        "PURCHASE_SUCCESS",
        "ADMIN_ADJUST",
      ],
    },
    coins: {
      type: Number,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CoinTransaction", coinTransactionSchema);
