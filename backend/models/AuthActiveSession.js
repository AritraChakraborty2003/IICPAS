import mongoose from "mongoose";

const authActiveSessionSchema = new mongoose.Schema(
  {
    sessionKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "employee",
        "student",
        "individual",
        "center",
        "company",
        "college",
        "teacher",
        "admin",
      ],
      required: true,
      index: true,
    },
    actorModel: {
      type: String,
      required: true,
      trim: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    loginAt: {
      type: Date,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    logoutAt: {
      type: Date,
      default: null,
    },
    sessionExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

authActiveSessionSchema.index({ isOnline: 1, role: 1, lastSeenAt: -1 });
authActiveSessionSchema.index({ sessionExpiresAt: 1 });

export default mongoose.model("AuthActiveSession", authActiveSessionSchema);
