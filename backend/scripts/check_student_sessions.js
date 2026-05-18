import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/Students.js";
import LiveSession from "../models/LiveSession/LiveSession.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    const student = await Student.findOne({ email: "superstudent@yopmail.com" });
    if (!student) {
      console.log("❌ Super Student not found!");
      await mongoose.disconnect();
      return;
    }

    console.log("\n--- STUDENT DETAILS ---");
    console.log("ID:", student._id);
    console.log("Name:", student.name);
    console.log("Email:", student.email);
    console.log("Courses in array:", student.course);
    console.log("Course overrides count:", student.courseAccessOverrides?.length);

    // List all completed live sessions in the DB
    const allSessions = await LiveSession.find({});
    console.log("\n--- ALL LIVE SESSIONS IN DB ---");
    allSessions.forEach(s => {
      console.log(`- Title: ${s.title}`);
      console.log(`  ID: ${s._id}`);
      console.log(`  Status in DB: ${s.status}`);
      console.log(`  Date: ${s.date}`);
      console.log(`  Time: ${s.time}`);
      console.log(`  Link: ${s.link}`);
      console.log(`  courseId: ${s.courseId}`);
      console.log(`  courseIds: ${s.courseIds}`);
    });

    // Evaluate getLiveSessionsForStudent logic for this student
    const purchasedCourseIdSet = new Set(
      (Array.isArray(student.course) ? student.course : []).map((id) => String(id))
    );

    if (Array.isArray(student.courseAccessOverrides)) {
      student.courseAccessOverrides.forEach((entry) => {
        if (!entry.isLocked && entry.courseId) {
          purchasedCourseIdSet.add(String(entry.courseId));
        }
      });
    }

    const enrolledLiveSessionIds = new Set(
      (Array.isArray(student.enrolledLiveSessions) ? student.enrolledLiveSessions : []).map((id) => String(id))
    );

    console.log("\n--- EVALUATING ACCESSIBILITY FOR STUDENT ---");
    allSessions.forEach(session => {
      const isDirectlyEnrolled = enrolledLiveSessionIds.has(String(session._id)) ||
        (Array.isArray(session.enrolledStudents) && session.enrolledStudents.some((id) => String(id) === String(student._id)));

      const isCourseLinkedPurchased = (session.courseId && purchasedCourseIdSet.has(String(session.courseId))) ||
        (Array.isArray(session.courseIds) && session.courseIds.some((id) => purchasedCourseIdSet.has(String(id))));

      const isEnrolled = isDirectlyEnrolled || isCourseLinkedPurchased;
      
      const now = new Date();
      const sessionDate = new Date(session.date);
      const [startTime, endTime] = session.time
        ? session.time.split(" - ")
        : ["10:00", "12:00"];

      const sessionStart = new Date(sessionDate);
      const [startHour, startMinute] = startTime.split(":").map(Number);
      sessionStart.setHours(startHour, startMinute, 0, 0);

      const sessionEnd = new Date(sessionDate);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      sessionEnd.setHours(endHour, endMinute, 0, 0);

      let dynamicStatus = session.status;
      if (session.status === "active") {
        if (now < sessionStart) dynamicStatus = "upcoming";
        else if (now >= sessionStart && now <= sessionEnd) dynamicStatus = "live";
        else if (now > sessionEnd) dynamicStatus = "completed";
      }

      console.log(`- ${session.title}:`);
      console.log(`  isDirectlyEnrolled: ${isDirectlyEnrolled}`);
      console.log(`  isCourseLinkedPurchased: ${isCourseLinkedPurchased}`);
      console.log(`  isEnrolled: ${isEnrolled}`);
      console.log(`  dynamicStatus: ${dynamicStatus}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 MongoDB disconnected");
  }
};

run();
