import mongoose from "mongoose";

const loginAccessControlSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: [
        "employee",
        "admin",
        "student",
        "individual",
        "center",
        "company",
        "college",
        "teacher",
      ],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    updatedBy: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

loginAccessControlSchema.index({ role: 1, userId: 1 }, { unique: true });

export default mongoose.model("LoginAccessControl", loginAccessControlSchema);
