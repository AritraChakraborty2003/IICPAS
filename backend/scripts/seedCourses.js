// Seed sample courses (with chapter titles for the syllabus) into the database
// in MONGODB_URI. Categories must match models/Content/Category.js names, so
// run scripts/seedCourseCategories.js first.
//
// Safe to re-run: courses are matched by slug and updated in place; their
// chapters are replaced with the list below. Nothing else is deleted.
//
// Images are paths served by the Next.js client (client/public/images), so
// they work locally without any uploads.
//
// Usage:
//   node scripts/seedCourses.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const Course = (await import("../models/Content/Course.js")).default;
const Chapter = (await import("../models/Content/Chapter.js")).default;
const Category = (await import("../models/Content/Category.js")).default;

const slugify = (s) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Recorded / live / +center tiers, derived from the base price.
const tier = (price, discountPct) => ({
  price,
  discount: discountPct,
  finalPrice: Math.round(price * (1 - discountPct / 100)),
});
const buildPricing = (base) => ({
  recordedSession: tier(base, 10),
  liveSession: tier(Math.round(base * 1.4), 10),
  recordedSessionCenter: tier(Math.round(base * 1.8), 10),
  liveSessionCenter: tier(Math.round(base * 2.2), 10),
});

const courses = [
  {
    title: "Basic Accounting and Tally Certification Course",
    category: "Accounting",
    level: "Executive Level",
    price: 15000,
    duration: "3 months",
    image: "/images/tally.webp",
    summary:
      "Learn double-entry book-keeping, journals, ledgers and final accounts, then apply them in TallyPrime with real business transactions.",
    chapters: [
      "Fundamentals of Accounting",
      "Journal, Ledger and Trial Balance",
      "Final Accounts and Adjustments",
      "TallyPrime: Company Setup and Masters",
      "Vouchers, Inventory and Reports in Tally",
      "GST in Tally",
    ],
  },
  {
    title: "Advanced Accounting and Finalisation Course",
    category: "Accounting",
    level: "Professional Level",
    price: 22000,
    duration: "4 months",
    image: "/images/accounting.webp",
    summary:
      "Finalise accounts end to end: closing entries, depreciation, provisions, bank and ledger reconciliations, and preparing financial statements.",
    chapters: [
      "Accounting Standards Overview",
      "Depreciation, Provisions and Accruals",
      "Bank and Ledger Reconciliation",
      "Preparing Financial Statements",
      "Year-End Closing Checklist",
    ],
  },
  {
    title: "Income Tax and TDS Certification Course",
    category: "Taxation",
    level: "Professional Level",
    price: 12000,
    duration: "2 months",
    image: "/images/a3.jpeg",
    summary:
      "Compute taxable income under all heads, file ITRs, and handle TDS deduction, payment and quarterly returns.",
    chapters: [
      "Basics of Income Tax and Residential Status",
      "Income Under Various Heads",
      "Deductions and Tax Computation",
      "ITR Filing Walkthrough",
      "TDS: Deduction, Payment and Returns",
    ],
  },
  {
    title: "GST Practitioner Certification Course",
    category: "GST",
    level: "Professional Level",
    price: 10000,
    duration: "2 months",
    image: "/images/course.png",
    summary:
      "Master GST registration, invoicing, input tax credit, GSTR-1/3B filing, reconciliation and e-invoicing with simulations.",
    chapters: [
      "GST Concepts and Registration",
      "Supply, Invoicing and E-Way Bill",
      "Input Tax Credit",
      "GSTR-1 and GSTR-3B Filing",
      "GSTR-2B Reconciliation",
      "E-Invoicing",
    ],
  },
  {
    title: "Financial Analysis and Reporting Course",
    category: "Finance",
    level: "Professional Level",
    price: 18000,
    duration: "3 months",
    image: "/images/a4.jpg",
    summary:
      "Read and analyse financial statements, build ratios and cash-flow analysis, and present management reports.",
    chapters: [
      "Understanding Financial Statements",
      "Ratio Analysis",
      "Cash Flow and Fund Flow",
      "Budgeting and Forecasting",
      "Management Reporting",
    ],
  },
  {
    title: "Payroll and HR Certification Course",
    category: "HR",
    level: "Executive Level",
    price: 3500,
    duration: "1 month",
    image: "/images/a1.jpeg",
    summary:
      "Process payroll and statutory compliance — PF, ESI, PT and TDS on salary — along with core HR documentation.",
    chapters: [
      "Salary Structure and Payroll Basics",
      "PF and ESI Compliance",
      "Professional Tax and TDS on Salary",
      "Payroll Processing in Practice",
    ],
  },
  {
    title: "Excel Certification Course",
    category: "Excel & MIS",
    level: "Executive Level",
    price: 2000,
    duration: "1 month",
    image: "/images/img1.jpg",
    summary:
      "From formulas to pivot tables, lookups and dashboards — Excel skills used daily in accounts and finance.",
    chapters: [
      "Excel Essentials and Formatting",
      "Formulas and Functions",
      "VLOOKUP, XLOOKUP and INDEX-MATCH",
      "Pivot Tables and Charts",
      "MIS Dashboards",
    ],
  },
  {
    title: "Internal Audit and Compliance Course",
    category: "Audit & Compliance",
    level: "Professional Level",
    price: 14000,
    duration: "2 months",
    image: "/images/a2.avif",
    summary:
      "Plan and execute internal audits, test controls, and manage ROC and statutory compliance calendars.",
    chapters: [
      "Audit Concepts and Planning",
      "Internal Controls and Testing",
      "Audit Documentation and Reporting",
      "ROC and Company Law Compliance",
    ],
  },
];

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set (check backend/.env)");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log("DB:", `${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

try {
  const knownCategories = new Set((await Category.find({}, "category")).map((c) => c.category));

  for (const [index, c] of courses.entries()) {
    if (!knownCategories.has(c.category)) {
      console.warn(`⚠️  category "${c.category}" not found — run scripts/seedCourseCategories.js first`);
    }

    const slug = slugify(c.title);
    let course = await Course.findOne({ slug });
    const isNew = !course;

    // Replace this course's chapters with the seed list.
    if (course?.chapters?.length) {
      await Chapter.deleteMany({ _id: { $in: course.chapters } });
    }
    const chapterDocs = await Chapter.insertMany(
      c.chapters.map((title, order) => ({ title, order, status: "Active" }))
    );

    const fields = {
      title: c.title,
      slug,
      category: c.category,
      level: c.level,
      price: c.price,
      discount: 10,
      duration: c.duration,
      status: "Active",
      position: index + 1,
      image: c.image,
      dashboardImage: c.image,
      description: `<p>${c.summary}</p>`,
      examCert:
        "<p>Complete the course assessments to receive an IICPA certificate of completion.</p>",
      seoTitle: c.title,
      seoKeywords: `${c.category}, ${c.title}, IICPA`,
      seoDescription: c.summary,
      metaTitle: `${c.title} | IICPA Institute`,
      metaKeywords: `${c.category}, certification course, IICPA`,
      metaDescription: c.summary,
      chapters: chapterDocs.map((d) => d._id),
      pricing: buildPricing(c.price),
      updatedAt: new Date(),
    };

    if (isNew) {
      course = await Course.create({ ...fields, createdAt: new Date(Date.now() + index) });
    } else {
      course.set(fields);
      await course.save();
    }
    console.log(`${isNew ? "✅ created" : "↻ updated"}  [${c.category}] ${c.title} (${chapterDocs.length} chapters)`);
  }

  console.log(`Total courses now: ${await Course.countDocuments()}`);
} catch (err) {
  console.error("❌ Error seeding courses:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
