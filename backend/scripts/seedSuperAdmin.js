// Create or reset the superadmin account used to operate the admin panel.
//
// Usage:
//   node scripts/seedSuperAdmin.js
//     -> admin@iicpa.in / admin@123
//   node scripts/seedSuperAdmin.js --email=other@iicpa.in --password='Other@123' --name="Super Admin"
//
// Re-running is safe: an existing account with that email gets its password
// reset, its role set to superadmin, and its login access re-activated.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const Admin = (await import("../models/Admin.js")).default;
const LoginAccessControl = (await import("../models/LoginAccessControl.js")).default;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  })
);

const email = (args.email || "admin@iicpa.in").trim().toLowerCase();
const password = args.password || "admin@123";
const name = args.name || "Super Admin";

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set (check backend/.env)");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

try {
  const hashedPassword = await bcrypt.hash(password, 10);
  let admin = await Admin.findOne({ email });
  const created = !admin;

  if (admin) {
    admin.password = hashedPassword;
    admin.role = "superadmin";
    admin.updatedAt = new Date();
  } else {
    admin = new Admin({ name, email, password: hashedPassword, role: "superadmin" });
  }
  await admin.save();

  await LoginAccessControl.updateOne(
    { role: "admin", userId: admin._id },
    { $set: { isActive: true, updatedBy: "seedSuperAdmin" } },
    { upsert: true }
  );

  console.log(created ? "✅ Superadmin created" : "✅ Existing account reset to superadmin");
  console.log("Email:   ", admin.email);
  console.log("Password:", password);
  console.log("Role:    ", admin.role);
} catch (err) {
  console.error("❌ Error seeding superadmin:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
