import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    instructor: { type: String, default: "" },
    instructorBio: { type: String, default: "" },
    description: { type: String, default: "" },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    chapterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchManager",
      default: null,
    },
    batchCode: { type: String, default: null, trim: true },
    time: { type: String, required: true },
    date: { type: Date, required: true },
    link: { type: String, required: true },
    passcode: { type: String, default: "" },
    price: { type: Number, default: 0 },
    category: { type: String, default: "" },
    maxParticipants: { type: Number, default: 50 },
    enrolledCount: { type: Number, default: 0 },
    thumbnail: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    landingPage: {
      heroImage: { type: String, default: "" },
      mobileHeroImage: { type: String, default: "" },
      headline: { type: String, default: "" },
      subheadline: { type: String, default: "" },
      bodyContent: { type: String, default: "" },
      authorImage: { type: String, default: "" },
      authorName: { type: String, default: "" },
      authorCode: { type: String, default: "" },
      authorText: { type: String, default: "" },
      authorLayout: {
        type: String,
        enum: ["stack", "two-per-line"],
        default: "stack",
      },
      authorProfiles: [
        {
          image: { type: String, default: "" },
          name: { type: String, default: "" },
          code: { type: String, default: "" },
          text: { type: String, default: "" },
        },
      ],
      ctaText: { type: String, default: "" },
      formHeading: { type: String, default: "" },
      formDescription: { type: String, default: "" },
      formLabel: { type: String, default: "" },
      thankYouText: { type: String, default: "" },
    },
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

    // WhatsApp reminder tracking (separate from email reminderSettings)
    reminder24hSent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

liveSessionSchema.index({
  "reminderSettings.status": 1,
  "reminderSettings.sendAt": 1,
});

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);
export default LiveSession;
