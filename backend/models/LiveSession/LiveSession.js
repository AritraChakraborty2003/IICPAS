import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    instructor: { type: String, default: "" },
    instructorBio: { type: String, default: "" },
    description: { type: String, default: "" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    time: { type: String, required: true },
    date: { type: Date, required: true },
    link: { type: String, required: true },
    price: { type: Number, default: 0 },
    category: { type: String, default: "" },
    maxParticipants: { type: Number, default: 50 },
    enrolledCount: { type: Number, default: 0 },
    thumbnail: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["upcoming", "live", "completed", "active", "inactive"],
      default: "upcoming",
    },
    reminderSettings: {
      leadTimeMinutes: { type: Number, default: 30 },
      batchSize: { type: Number, default: 5 },
      batchDelaySeconds: { type: Number, default: 1 },
      timezone: { type: String, default: "Asia/Kolkata" },
      sendAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ["queued", "sending", "sent", "failed"],
      },
      sentAt: { type: Date, default: null },
      lastError: { type: String, default: "" },
      recipientCount: { type: Number, default: 0 },
    },
    duration: { type: Number, default: 120 }, // in minutes
    enrolledStudents: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    ],
  },
  { timestamps: true }
);

liveSessionSchema.index({
  "reminderSettings.status": 1,
  "reminderSettings.sendAt": 1,
});

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);
export default LiveSession;
