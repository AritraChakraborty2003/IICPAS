import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";

dotenv.config();

const TARGET_EMAIL = "superstudent@yopmail.com";
const DEFAULT_PASSWORD = "superstudent@123";

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

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    if (!student) {
      student = new Student({
        name: "Super Student",
        email: TARGET_EMAIL,
        phone: "9999999999",
        password: hashedPassword,
        location: "N/A",
      });
    } else {
      student.name = "Super Student";
      student.phone = "9999999999";
      student.location = "N/A";
      student.password = hashedPassword;
    }

    // Set far-future expiration (10 years) so they never expire
    const tenYearsFromNow = new Date();
    tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

    const overrides = allCourseIds.map((courseId) => ({
      courseId,
      isLocked: false,
      purchasedAt: new Date(),
      expiresAt: tenYearsFromNow,
      updatedAt: new Date(),
    }));

    // Grant full recorded purchase/access scope for all courses.
    student.course = allCourseIds;
    student.enrolledRecordedSessions = allCourseIds;
    student.enrolledRecordedSessionsCenter = allCourseIds;
    student.courseAccessOverrides = overrides;
    student.digitalHubAccessOverride = true;

    await student.save();

    console.log("Super student seeding completed successfully.");
    console.log(`Student ID: ${student._id}`);
    console.log(`Email: ${student.email}`);
    console.log(`Total courses assigned: ${allCourseIds.length}`);
    console.log(`Password set to: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error("Failed to seed super student:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedSuperStudentAllCourses();
