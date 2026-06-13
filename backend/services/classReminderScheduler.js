import ClassSession from "../models/ClassManagement/ClassSession.js";
import Student from "../models/Students.js";
import { sendWhatsAppTemplateMessage } from "./whatsappService.js";

const TEMPLATE_NAME = "class_reminder";
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

let sweepRunning = false;
let schedulerStarted = false;

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

const sendReminderToStudents = async (cls) => {
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

const processReminders = async () => {
  if (sweepRunning) return;
  sweepRunning = true;

  try {
    const now = new Date();
    const in1h = new Date(now.getTime() + ONE_HOUR_MS);
    const in24h = new Date(now.getTime() + ONE_DAY_MS);
    const window = 5 * 60 * 1000; // 5-minute window to catch classes

    // 1-hour reminders: class starts between now+55min and now+65min
    const due1h = await ClassSession.find({
      type: "live",
      status: { $in: ["scheduled", "live"] },
      reminder1hSent: false,
      startAt: {
        $gte: new Date(in1h.getTime() - window),
        $lte: new Date(in1h.getTime() + window),
      },
    }).lean();

    for (const cls of due1h) {
      await ClassSession.updateOne({ _id: cls._id }, { $set: { reminder1hSent: true } });
      const sent = await sendReminderToStudents(cls);
      console.log(`[classReminder] 1h reminder for "${cls.title}": sent to ${sent} student(s)`);
    }

    // 24-hour reminders: class starts between now+23h55m and now+24h5m
    const due24h = await ClassSession.find({
      type: "live",
      status: { $in: ["scheduled", "live"] },
      reminder24hSent: false,
      startAt: {
        $gte: new Date(in24h.getTime() - window),
        $lte: new Date(in24h.getTime() + window),
      },
    }).lean();

    for (const cls of due24h) {
      await ClassSession.updateOne({ _id: cls._id }, { $set: { reminder24hSent: true } });
      const sent = await sendReminderToStudents(cls);
      console.log(`[classReminder] 24h reminder for "${cls.title}": sent to ${sent} student(s)`);
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
