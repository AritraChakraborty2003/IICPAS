// Create or update several "super student" accounts that can log in and see
// every course: all courses enrolled, each course unlocked for 10 years, and
// digitalHubAccessOverride on (unlocks every chapter in the Digital Hub).
//
// Student login sends an OTP to the account's email, so every email must be an
// inbox someone can open. The default @yopmail.com addresses are public
// inboxes: read the OTP at https://yopmail.com/?<name>.
//
// Usage:
//   node scripts/seedSuperStudents.js --count=5
//     -> superstudent1@yopmail.com ... superstudent5@yopmail.com
//   node scripts/seedSuperStudents.js --count=3 --start=10 --prefix=demo --password='Demo@1234'
//     -> demo10@yopmail.com ... demo12@yopmail.com
//   node scripts/seedSuperStudents.js --emails=a@yopmail.com,b@yopmail.com
//
// Options:
//   --count     how many numbered accounts to create (default 5, ignored with --emails)
//   --start     first number in the sequence (default 1)
//   --prefix    email name before the number (default "superstudent")
//   --domain    email domain (default "yopmail.com")
//   --emails    comma-separated exact emails instead of a numbered sequence
//   --password  password for every account (default "superstudent@1234").
//               Quote it with SINGLE quotes so the shell leaves `$` and `#` alone.
//   --dry-run   show what would change without writing anything
//
// Re-running is safe: existing accounts get their password reset and access
// refreshed (newly added courses included); their name and phone are kept.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const Student = (await import("../models/Students.js")).default;
const Course = (await import("../models/Content/Course.js")).default;
const LoginAccessControl = (await import("../models/LoginAccessControl.js")).default;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.length ? rest.join("=") : true];
  })
);

const password = typeof args.password === "string" ? args.password : "superstudent@1234";
const dryRun = Boolean(args["dry-run"]);

const buildEmails = () => {
  if (typeof args.emails === "string") {
    return [...new Set(args.emails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean))];
  }
  const count = Number.parseInt(args.count ?? "5", 10);
  const start = Number.parseInt(args.start ?? "1", 10);
  const prefix = typeof args.prefix === "string" ? args.prefix : "superstudent";
  const domain = typeof args.domain === "string" ? args.domain : "yopmail.com";
  if (!Number.isInteger(count) || count < 1 || count > 500 || !Number.isInteger(start) || start < 0) {
    console.error("❌ --count must be 1-500 and --start must be 0 or more");
    process.exit(1);
  }
  return Array.from({ length: count }, (_, i) => `${prefix}${start + i}@${domain}`.toLowerCase());
};

const emails = buildEmails();
const invalid = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
if (!emails.length || invalid.length) {
  console.error("❌ Invalid or missing emails:", invalid.join(", ") || "(none given)");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

// Each new account gets its own phone so phone-number login never matches the
// wrong student. Skips numbers already used by anyone.
const nextFreePhone = async (used) => {
  for (let n = 1; n < 100000; n += 1) {
    const phone = `90000${String(n).padStart(5, "0")}`;
    if (used.has(phone)) continue;
    used.add(phone);
    if (!(await Student.exists({ phone }))) return phone;
  }
  throw new Error("No free placeholder phone number left");
};

await mongoose.connect(process.env.MONGODB_URI);

try {
  const courses = await Course.find({}, "_id");
  if (!courses.length) throw new Error("No courses found. Nothing to grant.");
  const allCourseIds = courses.map((c) => c._id);

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 10);
  const hashedPassword = await bcrypt.hash(password, 10);
  const usedPhones = new Set();
  const results = [];

  for (const [i, email] of emails.entries()) {
    let student = await Student.findOne({ email });
    const action = student ? "updated" : "created";

    if (!student) {
      student = new Student({
        name: `Super Student ${typeof args.emails === "string" ? i + 1 : email.match(/(\d+)@/)?.[1] ?? i + 1}`,
        email,
        phone: await nextFreePhone(usedPhones),
        password: hashedPassword,
        location: "N/A",
      });
    }

    student.password = hashedPassword;
    student.status = "active";
    student.course = allCourseIds;
    student.enrolledRecordedSessions = allCourseIds;
    student.enrolledRecordedSessionsCenter = allCourseIds;
    student.courseAccessOverrides = allCourseIds.map((courseId) => ({
      courseId,
      isLocked: false,
      purchasedAt: now,
      expiresAt,
      updatedAt: now,
    }));
    student.digitalHubAccessOverride = true;

    let cleared = 0;
    if (!dryRun) {
      await student.save();
      // Master Login Access can block a login even when status is active.
      cleared = (await LoginAccessControl.deleteMany({ role: "student", userId: student._id }))
        .deletedCount;
    }

    results.push({ action, email, phone: student.phone, name: student.name, cleared });
  }

  console.log(`${dryRun ? "🔎 DRY RUN, nothing saved" : "✅ Done"}: ${results.length} super student(s), ${allCourseIds.length} courses each\n`);
  console.table(
    results.map((r) => ({
      Action: r.action,
      Email: r.email,
      Password: password,
      Phone: r.phone,
      Name: r.name,
      "Access overrides removed": r.cleared,
    }))
  );
  console.log("\nLogin sends an OTP to the email. For @yopmail.com, open https://yopmail.com/?<name-before-@>");
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
