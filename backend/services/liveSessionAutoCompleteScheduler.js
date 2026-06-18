import LiveSession from "../models/LiveSession/LiveSession.js";

/**
 * Background job: marks expired live sessions as "completed" in the database.
 *
 * A session is "expired" when the current time has passed its computed end time
 * (date + end time from the time range string, e.g. "11:00 AM - 12:30 PM").
 * We only process sessions that are not already completed or inactive.
 */

let sweepRunning = false;
let schedulerStarted = false;

const parseTimeString = (timeStr) => {
  // Handles both "HH:MM" (24h) and "HH:MM AM/PM" (12h) formats
  const amPmMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hour = parseInt(amPmMatch[1], 10);
    const minute = parseInt(amPmMatch[2], 10);
    const period = amPmMatch[3].toUpperCase();
    if (period === "AM" && hour === 12) hour = 0;
    if (period === "PM" && hour !== 12) hour += 12;
    return { hour, minute };
  }
  const parts = timeStr.trim().split(":");
  return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1], 10) };
};

export const processExpiredLiveSessions = async () => {
  if (sweepRunning) return;
  sweepRunning = true;

  try {
    const now = new Date();

    // Fetch all non-terminal sessions that might have expired
    const sessions = await LiveSession.find({
      status: { $in: ["active", "upcoming", "live"] },
    }).select("_id date time");

    const expiredIds = [];

    for (const session of sessions) {
      if (!session.date || !session.time) continue;

      const parts = session.time.split(" - ");
      if (parts.length < 2) continue;

      const endTimePart = parts[1];
      const { hour, minute } = parseTimeString(endTimePart);

      const sessionEnd = new Date(session.date);
      sessionEnd.setHours(hour, minute, 0, 0);

      if (now > sessionEnd) {
        expiredIds.push(session._id);
      }
    }

    if (expiredIds.length === 0) return;

    const result = await LiveSession.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { status: "completed" } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[liveSessionAutoComplete] Marked ${result.modifiedCount} expired live session(s) as completed`
      );
    }
  } catch (error) {
    console.error("[liveSessionAutoComplete] sweep failed:", error.message);
  } finally {
    sweepRunning = false;
  }
};

export const startLiveSessionAutoCompleteScheduler = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;
  console.log("Live session auto-complete scheduler started");

  void processExpiredLiveSessions();

  const timer = setInterval(() => {
    void processExpiredLiveSessions();
  }, 60 * 1000);

  if (typeof timer.unref === "function") {
    timer.unref();
  }
};
