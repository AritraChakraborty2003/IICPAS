import Booking from "../models/Booking.js";
import LiveSession from "../models/LiveSession/LiveSession.js";
import { sendLiveSessionReminderEmail } from "../utils/liveSessionEmailService.js";
import {
  computeSessionStartAt,
  DEFAULT_REMINDER_BATCH_DELAY_SECONDS,
  DEFAULT_REMINDER_BATCH_SIZE,
  DEFAULT_REMINDER_TIME_ZONE,
  normalizeEmail,
  REMINDER_JOB_STATUS,
  toIntegerInRange,
} from "../utils/liveSessionReminderHelpers.js";

const CONFIRMED_PAYMENT_STATUSES = new Set([
  "paid",
  "captured",
  "completed",
  "verified",
  "free",
]);

const CONFIRMED_BOOKING_STATUSES = new Set(["booked", "approved"]);

let reminderSweepRunning = false;
let reminderSchedulerStarted = false;

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getConfirmedRecipients = async (sessionId) => {
  const bookings = await Booking.find({
    category: "live",
    liveSessionId: sessionId,
    paymentStatus: { $in: Array.from(CONFIRMED_PAYMENT_STATUSES) },
    status: { $in: Array.from(CONFIRMED_BOOKING_STATUSES) },
  })
    .populate("studentId", "name email")
    .sort({ createdAt: 1 })
    .lean();

  const recipients = [];
  const seenEmails = new Set();

  for (const booking of bookings) {
    const rawEmail =
      booking?.studentId?.email || booking?.by || booking?.studentEmail || "";
    const email = normalizeEmail(rawEmail);
    if (!email || !email.includes("@") || seenEmails.has(email)) {
      continue;
    }

    seenEmails.add(email);
    recipients.push({
      email,
      name: booking?.studentId?.name || booking?.requesterName || "Student",
    });
  }

  return recipients;
};

const markReminderFailed = async (sessionId, errorMessage) => {
  await LiveSession.updateOne(
    { _id: sessionId },
    {
      $set: {
        "reminderSettings.status": REMINDER_JOB_STATUS.FAILED,
        "reminderSettings.lastError": String(errorMessage || "Reminder failed"),
      },
    }
  );
};

const markReminderSent = async (sessionId, recipientCount) => {
  await LiveSession.updateOne(
    { _id: sessionId },
    {
      $set: {
        "reminderSettings.status": REMINDER_JOB_STATUS.SENT,
        "reminderSettings.sentAt": new Date(),
        "reminderSettings.lastError": "",
        "reminderSettings.recipientCount": recipientCount,
      },
    }
  );
};

const processReminderSession = async (session) => {
  const reminderSettings = session?.reminderSettings || {};
  const timezone = String(
    reminderSettings.timezone || DEFAULT_REMINDER_TIME_ZONE
  ).trim() || DEFAULT_REMINDER_TIME_ZONE;
  const sessionStatus = String(session?.status || "").toLowerCase();
  const sessionStartAt = computeSessionStartAt({
    date: session?.date,
    time: session?.time,
    timeZone: timezone,
  });

  if (!sessionStartAt || Number.isNaN(sessionStartAt.getTime())) {
    await markReminderFailed(session?._id, "Unable to resolve live session date/time");
    return;
  }

  if (sessionStatus === "inactive") {
    await markReminderFailed(session?._id, "Live session is inactive");
    return;
  }

  if (!["active", "upcoming"].includes(sessionStatus)) {
    await markReminderFailed(session?._id, "Live session is not eligible for reminders");
    return;
  }

  if (sessionStartAt.getTime() <= Date.now()) {
    await markReminderFailed(session?._id, "Live session start time has already passed");
    return;
  }

  const recipients = await getConfirmedRecipients(session._id);

  await LiveSession.updateOne(
    { _id: session._id, "reminderSettings.status": REMINDER_JOB_STATUS.SENDING },
    {
      $set: {
        "reminderSettings.recipientCount": recipients.length,
      },
    }
  );

  if (recipients.length === 0) {
    await markReminderSent(session._id, 0);
    return;
  }

  const batchSize = Math.max(
    1,
    toIntegerInRange(
      reminderSettings.batchSize,
      DEFAULT_REMINDER_BATCH_SIZE,
      { min: 1 }
    )
  );
  const batchDelaySeconds = Math.max(
    0,
    toIntegerInRange(
      reminderSettings.batchDelaySeconds,
      DEFAULT_REMINDER_BATCH_DELAY_SECONDS,
      { min: 0 }
    )
  );

  for (let index = 0; index < recipients.length; index += batchSize) {
    const batch = recipients.slice(index, index + batchSize);
    const results = await Promise.allSettled(
      batch.map((recipient) =>
        sendLiveSessionReminderEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          session,
        })
      )
    );

    const rejected = results.find((result) => result.status === "rejected");
    if (rejected) {
      throw new Error(
        rejected.reason?.message || "Failed to send live session reminder"
      );
    }

    if (index + batchSize < recipients.length && batchDelaySeconds > 0) {
      await delay(batchDelaySeconds * 1000);
    }
  }

  await markReminderSent(session._id, recipients.length);
};

const claimNextDueReminder = async () => {
  const now = new Date();

  return LiveSession.findOneAndUpdate(
    {
      "reminderSettings.status": REMINDER_JOB_STATUS.QUEUED,
      "reminderSettings.sendAt": { $lte: now },
    },
    {
      $set: {
        "reminderSettings.status": REMINDER_JOB_STATUS.SENDING,
        "reminderSettings.lastError": "",
      },
    },
    {
      sort: { "reminderSettings.sendAt": 1, updatedAt: 1 },
      new: true,
    }
  );
};

export const processDueLiveSessionReminders = async () => {
  if (reminderSweepRunning) {
    return;
  }

  reminderSweepRunning = true;

  try {
    while (true) {
      const session = await claimNextDueReminder();
      if (!session) {
        break;
      }

      try {
        await processReminderSession(session);
      } catch (error) {
        await markReminderFailed(
          session?._id,
          error?.message || "Failed to send reminder emails"
        );
      }
    }
  } finally {
    reminderSweepRunning = false;
  }
};

export const startLiveSessionReminderScheduler = () => {
  if (reminderSchedulerStarted) {
    return;
  }

  reminderSchedulerStarted = true;
  console.log("Live session reminder scheduler started");

  void processDueLiveSessionReminders();

  const timer = setInterval(() => {
    void processDueLiveSessionReminders();
  }, 60 * 1000);

  if (typeof timer.unref === "function") {
    timer.unref();
  }
};
