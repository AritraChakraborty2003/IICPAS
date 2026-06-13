import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * ClassSession
 *
 * A brand-new model for the admin "Class Management" feature.
 * A class is created as a LIVE class scheduled against a Course / Chapter / Topic
 * with a date, time and duration. Once the scheduled window (date + time + duration)
 * has elapsed, a background scheduler auto-converts the class type to "recorded"
 * and exposes the recording (recordingUrl) to students.
 *
 * This is intentionally independent from the legacy LiveSession model.
 */
const classSessionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    instructor: { type: String, default: "" },

    // Relations to the course content hierarchy (multi-select)
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    chapters: [{ type: Schema.Types.ObjectId, ref: "Chapter" }],
    topics: [{ type: Schema.Types.ObjectId, ref: "Topic" }],

    // Class type: starts as "live", auto-converts to "recorded" when finished
    type: {
      type: String,
      enum: ["live", "recorded"],
      default: "live",
    },

    // Schedule
    date: { type: Date, required: true }, // calendar day of the class
    time: { type: String, required: true }, // "HH:mm" 24h start time
    durationMinutes: { type: Number, required: true, default: 60 },

    // Computed absolute start/end timestamps (in UTC) for scheduling logic
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },

    timezone: { type: String, default: "Asia/Kolkata" },

    // Live meeting link (used while the class is live)
    meetingLink: { type: String, default: "" },

    // Recording URL (shown after auto-conversion to recorded)
    recordingUrl: { type: String, default: "" },

    thumbnail: { type: String, default: "" },
    price: { type: Number, default: 0 },
    maxParticipants: { type: Number, default: 100 },

    // Lifecycle status, independent of type
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
    },

    // Marks that the auto-convert job already processed this class
    autoConverted: { type: Boolean, default: false },
    convertedAt: { type: Date, default: null },

    // Reminder tracking
    reminder24hSent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index used by the auto-convert scheduler sweep
classSessionSchema.index({ type: 1, endAt: 1, autoConverted: 1 });

const ClassSession = model("ClassSession", classSessionSchema);
export default ClassSession;
