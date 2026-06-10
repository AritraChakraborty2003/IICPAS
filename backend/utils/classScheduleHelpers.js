/**
 * Helpers for the Class Management feature.
 * Computes absolute UTC start/end timestamps from a calendar date,
 * an "HH:mm" time string and a duration, honoring a fixed timezone offset.
 *
 * Note: India (Asia/Kolkata) is the default and is a fixed UTC+5:30 offset
 * with no DST, so a simple offset calculation is correct here.
 */

const TZ_OFFSET_MINUTES = {
  "Asia/Kolkata": 5 * 60 + 30,
  UTC: 0,
};

const getOffsetMinutes = (timezone) =>
  TZ_OFFSET_MINUTES[timezone] ?? TZ_OFFSET_MINUTES["Asia/Kolkata"];

/**
 * Build the absolute start/end Date objects (UTC) for a class.
 * @param {Date|string} date - calendar date (only Y/M/D used)
 * @param {string} time - "HH:mm" local start time
 * @param {number} durationMinutes
 * @param {string} timezone
 */
export const computeClassWindow = (date, time, durationMinutes, timezone) => {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) {
    throw new Error("Invalid class date");
  }

  const [hStr = "0", mStr = "0"] = String(time || "0:0").split(":");
  const hours = Number.parseInt(hStr, 10) || 0;
  const minutes = Number.parseInt(mStr, 10) || 0;

  // Build the local wall-clock instant in UTC, then subtract the tz offset
  // so the stored UTC instant corresponds to that local time.
  const offsetMinutes = getOffsetMinutes(timezone);

  const utcMillis = Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );

  const startAt = new Date(utcMillis - offsetMinutes * 60 * 1000);
  const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : 60;
  const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

  return { startAt, endAt };
};

/**
 * Derive the live lifecycle status (scheduled / live / completed)
 * from the current time. Does not mutate anything.
 */
export const deriveLiveStatus = (startAt, endAt, now = new Date()) => {
  if (now < new Date(startAt)) return "scheduled";
  if (now >= new Date(endAt)) return "completed";
  return "live";
};
