import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";

dotenv.config();

const TARGET_EMAIL = "superstudent@yopmail.com";
const DEFAULT_PASSWORD = "superstudent123";
const shouldResetPassword = process.argv.includes("--reset-password");

const seedSuperStudentAllCourses = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in environment variables.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const courses = await Course.find({}, "_id title slug");
    if (!courses.length) {
      console.error("No courses found. Aborting without mutating student data.");
      process.exitCode = 1;
      return;
    }

    const allCourseIds = courses.map((course) => course._id);

    let student = await Student.findOne({ email: TARGET_EMAIL });
    const isNewStudent = !student;
    let passwordUpdated = false;

    if (!student) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      student = new Student({
        name: "Super Student",
        email: TARGET_EMAIL,
        phone: "9999999999",
        password: hashedPassword,
        location: "N/A",
      });
    } else {
      if (!student.name) student.name = "Super Student";
      if (!student.phone) student.phone = "9999999999";
      if (!student.location) student.location = "N/A";
    }

    if (shouldResetPassword) {
      student.password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      passwordUpdated = true;
    }

    // Grant full recorded purchase/access scope for all courses.
    student.course = allCourseIds;
    student.enrolledRecordedSessions = allCourseIds;

    await student.save();

    console.log("Super student seeding completed.");
    console.log(`Student ID: ${student._id}`);
    console.log(`Email: ${student.email}`);
    console.log(`Total courses assigned: ${allCourseIds.length}`);

    if (isNewStudent || passwordUpdated) {
      console.log(`Password: ${DEFAULT_PASSWORD}`);
      console.log("Password was set/reset in this run.");
    } else {
      console.log(
        "Password unchanged. Use --reset-password if you want to reset it."
      );
    }
  } catch (error) {
    console.error("Failed to seed super student:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedSuperStudentAllCourses();
