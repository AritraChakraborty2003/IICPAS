// Create or update an /admin login (Employee collection, role "Admin") and make
// sure it can actually sign in: status Active, full permissions, and any
// "inactive" override from Master Login Access removed.
//
// Usage:
//   node scripts/upsertAdminEmployee.js --email=new@x.com --password='Secret' [--name="Full Name"] [--old-email=old@x.com]
//
//   --old-email  rename an existing employee to --email (keeps its history/id).
//                If it is not found, the script falls back to --email.
//   Quote the password with SINGLE quotes so the shell leaves `$` and `#` alone.
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const Employee = (await import("../models/Employee.js")).default;
const LoginAccessControl = (await import("../models/LoginAccessControl.js")).default;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  })
);

const email = args.email?.trim().toLowerCase();
const oldEmail = args["old-email"]?.trim().toLowerCase();
const { password, name } = args;

if (!email || !password) {
  console.error(
    "Usage: node scripts/upsertAdminEmployee.js --email=new@x.com --password='Secret' [--name=\"Full Name\"] [--old-email=old@x.com]"
  );
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

// Every module defined on the schema, with every action enabled.
const fullPermissions = Object.fromEntries(
  Object.keys(Employee.schema.obj.permissions).map((module) => [
    module,
    { add: true, read: true, update: true, delete: true, active: true },
  ])
);

const findByEmail = (value) =>
  Employee.findOne({
    email: { $regex: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });

await mongoose.connect(process.env.MONGODB_URI);

try {
  let emp = null;
  let action = "updated";

  if (oldEmail && oldEmail !== email) {
    emp = await findByEmail(oldEmail);
    if (emp) {
      const clash = await findByEmail(email);
      if (clash && String(clash._id) !== String(emp._id)) {
        throw new Error(
          `${email} already exists as a separate employee. Re-run without --old-email to update that one instead.`
        );
      }
      action = `renamed from ${emp.email}`;
    } else {
      console.log(`ℹ️  ${oldEmail} not found, using ${email} instead`);
    }
  }

  if (!emp) emp = await findByEmail(email);

  if (!emp) {
    emp = new Employee({ email, name: name || email.split("@")[0], role: "Admin" });
    action = "created";
  }

  emp.email = email;
  emp.password = password; // plain text on purpose: the pre-save hook hashes it
  if (name) emp.name = name;
  emp.role = "Admin";
  emp.status = "Active";
  emp.permissions = fullPermissions;
  await emp.save();

  // Master Login Access can block a login even when status is Active.
  const cleared = await LoginAccessControl.deleteMany({ role: "employee", userId: emp._id });

  const ok = await emp.comparePassword(password);

  console.log(`✅ Admin ${action}`);
  console.log("   Email:  ", emp.email);
  console.log("   Name:   ", emp.name);
  console.log("   Role:   ", emp.role, "| Status:", emp.status);
  console.log("   Access overrides removed:", cleared.deletedCount);
  console.log("   Password check:", ok ? "OK" : "FAILED");
  if (!ok) process.exitCode = 1;
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
