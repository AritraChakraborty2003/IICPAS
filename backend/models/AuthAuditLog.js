import mongoose from "mongoose";

const authAuditLogSchema = new mongoose.Schema(
  {
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
    eventType: {
      type: String,
      enum: ["LOGIN", "LOGOUT"],
      required: true,
      index: true,
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

authAuditLogSchema.index({ occurredAt: -1 });
authAuditLogSchema.index({ role: 1, occurredAt: -1 });
authAuditLogSchema.index({ actorId: 1, occurredAt: -1 });

export default mongoose.model("AuthAuditLog", authAuditLogSchema);
