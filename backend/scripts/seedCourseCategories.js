// Seed course categories (models/Content/Category.js) into the database in
// MONGODB_URI. Safe to re-run: existing categories (matched by name,
// case-insensitive) get their description/status refreshed; nothing is deleted.
//
// Usage:
//   node scripts/seedCourseCategories.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const Category = (await import("../models/Content/Category.js")).default;

const categories = [
  {
    category: "Accounting",
    description:
      "Practical accounting from basics to finalisation of accounts, including Tally and book-keeping.",
  },
  {
    category: "Taxation",
    description:
      "Income tax, TDS and return filing with hands-on practice on real-world cases.",
  },
  {
    category: "GST",
    description:
      "GST registration, invoicing, returns (GSTR-1, GSTR-3B), reconciliation and e-invoicing.",
  },
  {
    category: "Finance",
    description:
      "Financial analysis, reporting, budgeting and corporate finance skills for finance roles.",
  },
  {
    category: "HR",
    description:
      "Payroll, statutory compliance (PF, ESI, PT) and core HR operations.",
  },
  {
    category: "Excel & MIS",
    description:
      "Advanced Excel, dashboards and MIS reporting for accounts and finance professionals.",
  },
  {
    category: "Audit & Compliance",
    description:
      "Internal audit, statutory compliance and ROC/company law fundamentals.",
  },
];

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set (check backend/.env)");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log("DB:", `${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

try {
  for (const item of categories) {
    const escaped = item.category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Category.findOne({ category: { $regex: new RegExp(`^${escaped}$`, "i") } });
    if (existing) {
      existing.description = item.description;
      existing.status = "Active";
      await existing.save();
      console.log(`↻ updated  ${existing.category}`);
    } else {
      await Category.create({ ...item, status: "Active" });
      console.log(`✅ created  ${item.category}`);
    }
  }
  console.log(`Total categories now: ${await Category.countDocuments()}`);
} catch (err) {
  console.error("❌ Error seeding categories:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
