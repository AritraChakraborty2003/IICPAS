import mongoose from "mongoose";

const bulkEmailSenderAccountSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    encryptedAppPassword: {
      type: String,
      required: true,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

bulkEmailSenderAccountSchema.index({ email: 1 });

export default mongoose.model(
  "BulkEmailSenderAccount",
  bulkEmailSenderAccountSchema
);
