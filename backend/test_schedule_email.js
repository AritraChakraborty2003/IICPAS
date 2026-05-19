import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { buildBatchCourseScheduleEmail } from "./controllers/batchManagerController.js";
import { emailConfig } from "./config/emailConfig.js";

// Load env variables
dotenv.config();

// Connect to MongoDB
const connectDb = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB database.");
    } catch (err) {
      console.warn("Could not connect to MongoDB database. Running with mock/fallback data.", err.message);
    }
  } else {
    console.log("No MONGODB_URI in env. Running with fallback data.");
  }
};

const run = async () => {
  await connectDb();

  const recipientEmail = process.argv[2] || "superstudent@yopmail.com";
  console.log(`Preparing to send test batch schedule email to: ${recipientEmail}`);

  // Construct dummy/test batch and schedule data
  const dummyBatch = {
    code: "IICPA-BT-11",
  };

  const dummyCourseSchedules = [
    {
      title: "TDS Computation Course",
      startTime: "16 May 2026, 12:18 pm",
      endTime: "20 Aug 2026, 4:30 am",
      chapters: [
        {
          title: "TDS Computation",
          startTime: "18 May 2026, 3:30 am",
          endTime: "31 Jul 2026, 12:30 pm",
          topics: [
            {
              title: "Overview",
              startTime: "18 May 2026, 6:30 am",
              endTime: "31 Jul 2026, 12:30 pm",
            },
            {
              title: "TDS on Salary",
              startTime: "19 May 2026, 9:00 am",
              endTime: "31 Jul 2026, 12:30 pm",
            }
          ]
        }
      ]
    }
  ];

  const html = buildBatchCourseScheduleEmail({
    studentName: "Super Student",
    batch: dummyBatch,
    courseSchedules: dummyCourseSchedules,
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || emailConfig.auth.user,
      pass: process.env.EMAIL_PASS || emailConfig.auth.pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"IICPA Institute" <${process.env.EMAIL_USER || emailConfig.auth.user}>`,
      to: recipientEmail,
      subject: `Batch Schedule Updated: ${dummyBatch.code}`,
      html,
    });
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

run();
