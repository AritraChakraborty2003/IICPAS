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

    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    for (const session of sessions) {
      if (!session.date) continue;

      const parts = (session.time || "").split(" - ");
      const startPart = parts[0] || "00:00";
      const endPart = parts[1] || null;

      // Build IST start timestamp
      const startParsed = parseTimeString(startPart);
      const startInIST = new Date(session.date.getTime() + IST_OFFSET_MS);
      startInIST.setUTCHours(startParsed.hour, startParsed.minute, 0, 0);
      const sessionStart = new Date(startInIST.getTime() - IST_OFFSET_MS);

      let sessionEnd;
      if (endPart) {
        const { hour, minute } = parseTimeString(endPart);
        const dateInIST = new Date(session.date.getTime() + IST_OFFSET_MS);
        dateInIST.setUTCHours(hour, minute, 0, 0);
        sessionEnd = new Date(dateInIST.getTime() - IST_OFFSET_MS);
        // If end <= start the class crosses midnight — push end to next day
        if (sessionEnd <= sessionStart) {
          sessionEnd = new Date(sessionEnd.getTime() + 24 * 60 * 60 * 1000);
        }
      } else {
        // No end time: expire 2 hours after start
        sessionEnd = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);
      }

      // Also expire if the session date itself is more than 24h in the past
      // (catches sessions with bad end times like AM instead of PM)
      const dayAfterStart = new Date(sessionStart.getTime() + 24 * 60 * 60 * 1000);
      const isExpired = now > sessionEnd || now > dayAfterStart;

      if (isExpired) {
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
