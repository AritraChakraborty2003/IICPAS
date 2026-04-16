export const REMINDER_JOB_STATUS = {
  QUEUED: "queued",
  SENDING: "sending",
  SENT: "sent",
  FAILED: "failed",
};

export const DEFAULT_REMINDER_LEAD_TIME_MINUTES = 30;
export const DEFAULT_REMINDER_BATCH_SIZE = 5;
export const DEFAULT_REMINDER_BATCH_DELAY_SECONDS = 1;
export const DEFAULT_REMINDER_TIME_ZONE = "Asia/Kolkata";

export const normalizeEmail = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

export const normalizeJoinLink = (value = "") => {
  const link = String(value || "").trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link)) return link;
  return `https://${link}`;
};

export const toIntegerInRange = (value, fallback, { min = 0 } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = Math.trunc(parsed);
  if (normalized < min) {
    return fallback;
  }

  return normalized;
};

const parseTimeToken = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const match = raw.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  }
  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return {
    hour,
    minute,
  };
};

export const parseTimeRangeStart = (timeRange) => {
  const startToken = String(timeRange || "")
    .split("-")[0]
    .trim();

  return parseTimeToken(startToken);
};

const getDatePartsFromValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const getTimeZoneDateParts = (date, timeZone = DEFAULT_REMINDER_TIME_ZONE) => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    const parts = formatter.formatToParts(date);
    const map = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value])
    );

    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(map.hour),
      minute: Number(map.minute),
      second: Number(map.second),
    };
  } catch {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
    };
  }
};

export const zonedDateTimeToUtc = (
  { year, month, day, hour, minute, second = 0 },
  timeZone = DEFAULT_REMINDER_TIME_ZONE
) => {
  let utcMillis = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const parts = getTimeZoneDateParts(new Date(utcMillis), timeZone);
    const candidateAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

    const diff = candidateAsUtc - Date.UTC(year, month - 1, day, hour, minute, second);
    if (diff === 0) {
      break;
    }

    utcMillis -= diff;
  }

  return new Date(utcMillis);
};

export const computeSessionStartAt = ({
  date,
  time,
  timeZone = DEFAULT_REMINDER_TIME_ZONE,
}) => {
  const dateParts = getDatePartsFromValue(date);
  const startTime = parseTimeRangeStart(time);

  if (!dateParts || !startTime) {
    return null;
  }

  return zonedDateTimeToUtc(
    {
      ...dateParts,
      hour: startTime.hour,
      minute: startTime.minute,
      second: 0,
    },
    timeZone
  );
};

export const computeReminderSendAt = ({
  date,
  time,
  leadTimeMinutes = DEFAULT_REMINDER_LEAD_TIME_MINUTES,
  timeZone = DEFAULT_REMINDER_TIME_ZONE,
}) => {
  const sessionStartAt = computeSessionStartAt({ date, time, timeZone });
  if (!sessionStartAt) {
    return null;
  }

  const leadMinutes = toIntegerInRange(
    leadTimeMinutes,
    DEFAULT_REMINDER_LEAD_TIME_MINUTES,
    { min: 1 }
  );

  return new Date(sessionStartAt.getTime() - leadMinutes * 60 * 1000);
};

const formatClockTime = (timeValue) => {
  const token = parseTimeToken(timeValue);
  if (!token) return "";

  const date = new Date(Date.UTC(2020, 0, 1, token.hour, token.minute, 0));
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
};

export const formatSessionDateLabel = (
  dateValue,
  timeZone = DEFAULT_REMINDER_TIME_ZONE
) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }
};

export const formatSessionTimeRangeLabel = (timeRange) => {
  const [startToken, endToken] = String(timeRange || "")
    .split("-")
    .map((part) => part.trim());

  const startLabel = formatClockTime(startToken);
  const endLabel = formatClockTime(endToken);

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return String(timeRange || "").trim();
};

export const formatSessionScheduleLabel = (
  { date, time },
  timeZone = DEFAULT_REMINDER_TIME_ZONE
) => {
  const dateLabel = formatSessionDateLabel(date, timeZone);
  const timeLabel = formatSessionTimeRangeLabel(time);

  return [dateLabel, timeLabel].filter(Boolean).join(" | ");
};

export const formatReminderSendAtLabel = (
  sendAt,
  timeZone = DEFAULT_REMINDER_TIME_ZONE
) => {
  const date = new Date(sendAt);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }
};
