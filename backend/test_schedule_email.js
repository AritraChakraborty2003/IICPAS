import mongoose from "mongoose";
import dotenv from "dotenv";
import { buildBatchCourseScheduleEmail } from "./controllers/batchManagerController.js";

// Load environment variables
dotenv.config();

async function run() {
  console.log("Running mock email template test...");

  const mockBatch = {
    code: "IICPA-BT-11"
  };

  const mockCourseSchedules = [
    {
      courseId: "68a823cb33540026985f7989",
      title: "TDS Computation Course",
      startTime: "16 May 2026, 12:18 pm",
      endTime: "20 Aug 2026, 4:30 am",
      chapters: [
        {
          chapterId: "ch1",
          title: "Introduction to TDS",
          startTime: "16 May 2026, 12:18 pm",
          endTime: "31 May 2026, 11:59 pm",
          topics: [
            {
              topicId: "t1",
              title: "What is TDS?",
              startTime: "16 May 2026, 12:18 pm",
              endTime: "20 May 2026, 11:59 pm"
            },
            {
              topicId: "t2",
              title: "TDS Sections and Rates",
              startTime: "21 May 2026, 12:00 am",
              endTime: "31 May 2026, 11:59 pm"
            }
          ]
        }
      ]
    }
  ];

  const html = buildBatchCourseScheduleEmail({
    studentName: "Super Student",
    batch: mockBatch,
    courseSchedules: mockCourseSchedules
  });

  console.log("--- Generated Email HTML ---");
  console.log(html);
  console.log("--- End of HTML ---");

  // Basic checks
  const checks = [
    { name: "Dear Super Student", pass: html.includes("Dear <strong>Super Student</strong>") },
    { name: "TDS Computation Course", pass: html.includes("TDS Computation Course") },
    { name: "Introduction to TDS", pass: html.includes("📖 Chapter: Introduction to TDS") },
    { name: "What is TDS?", pass: html.includes("📌 What is TDS?") },
    { name: "Social Facebook Link", pass: html.includes("https://www.facebook.com/profile.php?id=61581482543779") },
    { name: "Social Instagram Link", pass: html.includes("https://www.instagram.com/iicpainstitute/") },
    { name: "Social YouTube Link", pass: html.includes("https://www.youtube.com/@IICPAInstitutes") },
    { name: "Social LinkedIn Link", pass: html.includes("https://www.linkedin.com/in/iicpa-institute-24aa9b386/") },
    { name: "No Course ID", pass: !html.includes("68a823cb33540026985f7989") }
  ];

  let failed = false;
  checks.forEach(c => {
    if (c.pass) {
      console.log(`✅ Check passed: ${c.name}`);
    } else {
      console.error(`❌ Check FAILED: ${c.name}`);
      failed = true;
    }
  });

  if (failed) {
    process.exit(1);
  } else {
    console.log("🎉 All template format and content checks passed successfully!");
    process.exit(0);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
