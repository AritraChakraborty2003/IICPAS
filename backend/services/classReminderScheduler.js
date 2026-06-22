import ClassSession from "../models/ClassManagement/ClassSession.js";
import LiveSession from "../models/LiveSession/LiveSession.js";
import Booking from "../models/Booking.js";
import Student from "../models/Students.js";
import { sendWhatsAppTemplateMessage } from "./whatsappService.js";
import { computeSessionStartAt } from "../utils/liveSessionReminderHelpers.js";

const TEMPLATE_NAME = "class_reminder";
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const SWEEP_WINDOW_MS = 5 * 60 * 1000; // 5-minute window either side

let sweepRunning = false;
let schedulerStarted = false;

const CONFIRMED_PAYMENT_STATUSES = new Set([
  "paid",
  "captured",
  "completed",
  "verified",
  "free",
]);
const CONFIRMED_BOOKING_STATUSES = new Set(["booked", "approved"]);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

// ── ClassSession reminders (course-based students) ──────────────────────────

const sendClassSessionReminderToStudents = async (cls) => {
  const courseIds = cls.courses || [];
  if (!courseIds.length) return 0;

  const students = await Student.find({
    course: { $in: courseIds },
    phone: { $exists: true, $ne: "" },
  }).select("name phone").lean();

  if (!students.length) return 0;

  const meetingLink = cls.meetingLink || "Link will be shared soon";
  const classDate = formatDate(cls.startAt);
  const classTime = formatTime(cls.startAt);

  let sent = 0;
  for (const student of students) {
    try {
      await sendWhatsAppTemplateMessage({
        to: student.phone,
        templateName: TEMPLATE_NAME,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: student.name || "Student" },
              { type: "text", text: cls.title },
              { type: "text", text: classDate },
              { type: "text", text: classTime },
              { type: "text", text: meetingLink },
            ],
          },
        ],
      });
      sent++;
    } catch (err) {
      console.error(`[classReminder] Failed to send to ${student.name}:`, err?.response?.data || err.message);
    }
  }
  return sent;
};

// ── LiveSession reminders (booking-based students) ───────────────────────────

const sendLiveSessionWhatsAppReminder = async (session) => {
  const bookings = await Booking.find({
    category: "live",
    liveSessionId: session._id,
    paymentStatus: { $in: Array.from(CONFIRMED_PAYMENT_STATUSES) },
    status: { $in: Array.from(CONFIRMED_BOOKING_STATUSES) },
  })
    .populate("studentId", "name phone")
    .lean();

  if (!bookings.length) return 0;

  const startAt = computeSessionStartAt({
    date: session.date,
    time: session.time,
    timeZone: session.reminderSettings?.timezone || "Asia/Kolkata",
  });

  if (!startAt || Number.isNaN(startAt.getTime())) return 0;

  const classDate = formatDate(startAt);
  const classTime = formatTime(startAt);
  const meetingLink = session.link || "Link will be shared soon";

  const seen = new Set();
  let sent = 0;

  for (const booking of bookings) {
    // Prefer whatsappNumber > booking.phone > studentId.phone
    const phone =
      booking.whatsappNumber ||
      booking.phone ||
      booking?.studentId?.phone ||
      "";

    const name =
      booking.requesterName ||
      booking?.studentId?.name ||
      "Student";

    if (!phone || seen.has(phone)) continue;
    seen.add(phone);

    try {
      await sendWhatsAppTemplateMessage({
        to: phone,
        templateName: TEMPLATE_NAME,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: session.title },
              { type: "text", text: classDate },
              { type: "text", text: classTime },
              { type: "text", text: meetingLink },
            ],
          },
        ],
      });
      sent++;
    } catch (err) {
      console.error(`[liveSessionReminder] Failed to send WhatsApp to ${name}:`, err?.response?.data || err.message);
    }
  }
  return sent;
};

// ── Main sweep ────────────────────────────────────────────────────────────────

const processReminders = async () => {
  if (sweepRunning) return;
  sweepRunning = true;

  try {
    const now = new Date();
    const in1h = new Date(now.getTime() + ONE_HOUR_MS);
    const in24h = new Date(now.getTime() + ONE_DAY_MS);

    // ── ClassSession: 1h reminders ──
    const classDue1h = await ClassSession.find({
      type: "live",
      status: { $in: ["scheduled", "live"] },
      reminder1hSent: false,
      startAt: {
        $gte: new Date(in1h.getTime() - SWEEP_WINDOW_MS),
        $lte: new Date(in1h.getTime() + SWEEP_WINDOW_MS),
      },
    }).lean();

    for (const cls of classDue1h) {
      await ClassSession.updateOne({ _id: cls._id }, { $set: { reminder1hSent: true } });
      const sent = await sendClassSessionReminderToStudents(cls);
      console.log(`[classReminder] 1h reminder for "${cls.title}": sent to ${sent} student(s)`);
    }

    // ── ClassSession: 24h reminders ──
    const classDue24h = await ClassSession.find({
      type: "live",
      status: { $in: ["scheduled", "live"] },
      reminder24hSent: false,
      startAt: {
        $gte: new Date(in24h.getTime() - SWEEP_WINDOW_MS),
        $lte: new Date(in24h.getTime() + SWEEP_WINDOW_MS),
      },
    }).lean();

    for (const cls of classDue24h) {
      await ClassSession.updateOne({ _id: cls._id }, { $set: { reminder24hSent: true } });
      const sent = await sendClassSessionReminderToStudents(cls);
      console.log(`[classReminder] 24h reminder for "${cls.title}": sent to ${sent} student(s)`);
    }

    // ── LiveSession: find all upcoming active sessions that haven't had reminders sent ──
    const liveSessions = await LiveSession.find({
      status: { $in: ["active", "upcoming"] },
      $or: [{ reminder1hSent: false }, { reminder24hSent: false }],
    }).lean();

    for (const session of liveSessions) {
      const startAt = computeSessionStartAt({
        date: session.date,
        time: session.time,
        timeZone: session.reminderSettings?.timezone || "Asia/Kolkata",
      });

      if (!startAt || Number.isNaN(startAt.getTime())) continue;
      if (startAt.getTime() <= now.getTime()) continue;

      const msUntilStart = startAt.getTime() - now.getTime();

      // 1h window
      if (
        !session.reminder1hSent &&
        msUntilStart >= ONE_HOUR_MS - SWEEP_WINDOW_MS &&
        msUntilStart <= ONE_HOUR_MS + SWEEP_WINDOW_MS
      ) {
        await LiveSession.updateOne({ _id: session._id }, { $set: { reminder1hSent: true } });
        const sent = await sendLiveSessionWhatsAppReminder(session);
        console.log(`[liveSessionReminder] 1h WhatsApp reminder for "${session.title}": sent to ${sent} student(s)`);
      }

      // 24h window
      if (
        !session.reminder24hSent &&
        msUntilStart >= ONE_DAY_MS - SWEEP_WINDOW_MS &&
        msUntilStart <= ONE_DAY_MS + SWEEP_WINDOW_MS
      ) {
        await LiveSession.updateOne({ _id: session._id }, { $set: { reminder24hSent: true } });
        const sent = await sendLiveSessionWhatsAppReminder(session);
        console.log(`[liveSessionReminder] 24h WhatsApp reminder for "${session.title}": sent to ${sent} student(s)`);
      }
    }
  } catch (err) {
    console.error("[classReminder] sweep error:", err.message);
  } finally {
    sweepRunning = false;
  }
};

export const startClassReminderScheduler = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;
  console.log("Class reminder scheduler started");

  void processReminders();

  const timer = setInterval(() => {
    void processReminders();
  }, 5 * 60 * 1000); // runs every 5 minutes

  if (typeof timer.unref === "function") {
    timer.unref();
  }
};
