import mongoose from "mongoose";

const batchManagerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
      unique: true,
    },
    mode: {
      type: String,
      required: true,
      enum: ["online", "offline"],
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    courseLocks: {
      type: [
        {
          courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
          },
          start_time: {
            type: Date,
            default: null,
          },
          end_time: {
            type: Date,
            default: null,
          },
        },
      ],
      default: [],
    },
    assignedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

batchManagerSchema.index({ code: 1 }, { unique: true, sparse: true });
batchManagerSchema.index({ mode: 1, createdAt: 1 });

batchManagerSchema.statics.getBatches = async function () {
  return this.find({}).sort({ createdAt: -1 });
};

export default mongoose.model("BatchManager", batchManagerSchema);
