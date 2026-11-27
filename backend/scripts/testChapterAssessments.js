// End-to-end test of AI chapter assessments against the LOCAL database and
// the configured AI provider (Claude or n8n). Creates "[AI-TEST]" records and
// deletes them afterwards. Runs its own minimal server (no schedulers).
//
//   node scripts/testChapterAssessments.js            (real AI calls; ~5-15 min)
//   KEEP_TEST_DATA=1 node scripts/testChapterAssessments.js   (keep records for UI checks)
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";
import Course from "../models/Content/Course.js";
import Chapter from "../models/Content/Chapter.js";
import Topic from "../models/Content/Topic.js";
import Assignment from "../models/Assignment.js";
import Employee from "../models/Employee.js";
import assignmentRoutes from "../routes/assignmentRoutes.js";
import aiContentRoutes from "../routes/aiContentRoutes.js";
import aiCourseRoutes from "../routes/aiCourseRoutes.js";
import aiAssessmentRoutes from "../routes/aiAssessmentRoutes.js";

const uri = process.env.MONGODB_URI || "";
if (!/localhost|127\.0\.0\.1/.test(uri)) {
  console.error("Refusing to run: MONGODB_URI is not a local database.");
  process.exit(1);
}

const PORT = 8091;
const BASE = `http://localhost:${PORT}/api`;
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mongoose.connect(uri);
await Assignment.createIndexes(); // adds the unique chapter+kind index, never drops indexes
const app = express();
app.use(express.json({ limit: "5mb" }));
app.use("/api/assignments", assignmentRoutes);
app.use("/api/ai", aiContentRoutes);
app.use("/api/ai-course", aiCourseRoutes);
app.use("/api/ai-assessments", aiAssessmentRoutes);
const server = app.listen(PORT);

const admin = await Employee.findOne({ role: "Admin", status: "Active" });
const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || "default_jwt_secret_for_development", { expiresIn: "2h" });
const adminHttp = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
const publicHttp = axios.create({ baseURL: BASE, validateStatus: () => true });

// ---- seed ------------------------------------------------------------------
const mkTopic = (title, content) => Topic.create({ title, content: `<p>${content}</p>` });
const pbTopics = await Promise.all([
  mkTopic("Overview of Power BI", "Power BI Desktop, Service and Mobile; typical business reporting uses."),
  mkTopic("Understanding the Power BI Interface", "Report, Data and Model views, the ribbon, Fields and Visualizations panes."),
  mkTopic("Importing and Transforming Data", "Get Data from Excel/CSV, Power Query Editor, data types, removing errors and duplicates."),
  mkTopic("Creating Interactive Visualisations", "Bar, line, card, map and table visuals; formatting; cross-filtering."),
]);
// The 5th topic arrives through the AI topic generator save path (auto trigger)
const ch1 = await Chapter.create({ title: "[AI-TEST] Power BI Fundamentals", topics: pbTopics.map((t) => t._id), description: "First steps with Power BI." });
const gstTopics = await Promise.all([
  mkTopic("Introduction to Goods and Services Tax", "Concept of GST, CGST, SGST, IGST and UTGST."),
  mkTopic("Understanding Supply Under GST", "Intra-state vs inter-state supply and place of supply basics."),
  mkTopic("Input Tax Credit Fundamentals", "Eligibility and conditions for claiming ITC, blocked credits overview."),
  mkTopic("Preparation of Professional Tax Invoices", "Mandatory particulars of a GST tax invoice."),
]);
const ch2 = await Chapter.create({ title: "[AI-TEST] Fundamentals of GST", topics: gstTopics.map((t) => t._id) });
const course = await Course.create({
  category: "AI-TEST",
  title: "[AI-TEST] Practical Business Reporting and GST",
  price: 0,
  level: "Executive Level",
  chapters: [ch1._id, ch2._id],
});
const manual = await Assignment.create({
  title: "[AI-TEST] Manual assignment",
  chapterId: ch1._id,
  questionSets: [{ name: "Manual set", questions: [{ question: "Manual question one?", options: ["a", "b", "c", "d"], correctAnswer: "a", explanation: "x" }] }],
});
const manualBefore = JSON.stringify((await Assignment.findById(manual._id).lean()).questionSets);

const status = async (chapterId) => (await adminHttp.get(`/ai-assessments/chapter/${chapterId}`)).data;
const waitDone = async (chapterId, label) => {
  const start = Date.now();
  for (;;) {
    const s = await status(chapterId);
    const states = ["assignment", "quiz"].map((k) => s[k]?.status);
    if (states.every((x) => ["generated", "failed", "review", "published"].includes(x))) return s;
    if (Date.now() - start > 20 * 60 * 1000) return s;
    process.stdout.write(`  ${label}: ${states.join(" / ")} (${Math.round((Date.now() - start) / 1000)}s)\r`);
    await sleep(10000);
  }
};

let exitCode = 0;
try {
  // 1. Existing AI topic save path still works + triggers automatic generation
  const save = await adminHttp.post(`/ai-course/chapter/${ch1._id}/save-topics`, {
    topics: [{ title: "Introduction to Dashboard Development", description: "Slicers, filters, layout principles and publishing a dashboard.", objectives: [] }],
  });
  check("existing save-topics endpoint works", save.status === 200 && save.data.summary.topicsCreated === 1);
  check("save-topics reports assessments queued", save.data.assessmentsQueued === true);
  const dashTopic = await Topic.findOne({ title: "Introduction to Dashboard Development", _id: { $in: (await Chapter.findById(ch1._id)).topics } });
  pbTopics.push(dashTopic);

  // 2. Manual generation for the GST chapter + idempotency
  const gen = await adminHttp.post(`/ai-assessments/chapter/${ch2._id}/generate`, { kinds: ["assignment", "quiz"] });
  check("manual generate starts both kinds", gen.status === 200 && gen.data.results.every((r) => r.started), JSON.stringify(gen.data.results?.map((r) => r.reason)));
  const again = await adminHttp.post(`/ai-assessments/chapter/${ch2._id}/generate`, { kinds: ["assignment", "quiz"] });
  check("repeated generate is idempotent", again.data.results.every((r) => !r.started && r.reason === "already running"));
  const empty = await Chapter.create({ title: "[AI-TEST] Empty", topics: [] });
  const noTopics = await adminHttp.post(`/ai-assessments/chapter/${empty._id}/generate`, {});
  check("chapter without topics is refused", noTopics.status === 400);
  await Chapter.deleteOne({ _id: empty._id });

  const unauth = await publicHttp.get(`/ai-assessments/chapter/${ch2._id}`);
  check("admin endpoints require login", unauth.status === 401);

  // Students cannot see drafts while generating
  const studentDraft = await publicHttp.get(`/assignments/chapter/${ch2._id}`);
  check("drafts hidden from students", studentDraft.data.data.length === 0);

  console.log("Waiting for AI generation (this calls the real AI provider)...");
  const s1 = await waitDone(ch1._id, "Power BI");
  const s2 = await waitDone(ch2._id, "GST");
  console.log("");

  for (const [label, s, topics] of [
    ["Power BI", s1, pbTopics],
    ["GST", s2, gstTopics],
  ]) {
    const titles = new Set(topics.map((t) => t.title));
    const a = s.assignment;
    const q = s.quiz;
    check(`${label}: assignment generated`, a?.status === "generated", a?.error);
    check(`${label}: quiz generated`, q?.status === "generated", q?.error);
    if (a?.draft) {
      const d = a.draft;
      check(`${label}: assignment has all sections`, d.title && d.overview && d.tasks.length && d.instructions.length >= 3 && d.deliverables.length && d.assessmentCriteria.length && d.difficulty && d.estimatedTime, d.title);
      check(`${label}: assignment marks total 100`, d.assessmentCriteria.reduce((x, c) => x + c.marks, 0) === 100);
      check(`${label}: assignment has instructor guide`, !!(d.instructorGuide?.solutionOverview || d.instructorGuide?.expectedResults?.length));
      check(`${label}: assignment tasks map to chapter topics`, d.tasks.every((t) => !t.topic || titles.has(t.topic)));
      console.log(`      warnings: ${(a.validation?.warnings || []).join(" | ") || "none"}`);
    }
    if (q?.draft) {
      const qs = q.draft.questions;
      check(`${label}: quiz has >= 20 questions`, qs.length >= 20, `${qs.length}`);
      check(`${label}: every question has 4 distinct options + 1 valid answer`, qs.every((x) => x.options.length === 4 && new Set(x.options).size === 4 && x.answer >= 0 && x.answer <= 3));
      check(`${label}: every question has an explanation, difficulty and type`, qs.every((x) => x.explanation && x.difficulty && x.type));
      check(`${label}: every question maps to a chapter topic`, qs.every((x) => titles.has(x.topic)));
      check(`${label}: all topics covered`, q.validation.coverage.missingTopics.length === 0, JSON.stringify(q.validation.coverage.byTopic.map((t) => t.count)));
      const pos = q.validation.coverage.answerPositions;
      check(`${label}: answer positions spread`, Object.keys(pos).length === 4, JSON.stringify(pos));
      console.log(`      types: ${JSON.stringify(q.validation.coverage.byType)}  rejected: ${q.validation.rejected.length}`);
    }
  }

  // 3. Edit, publish, student view, server grading
  const quiz = s2.quiz;
  if (quiz?.draft) {
    const pubA = await adminHttp.post(`/ai-assessments/${s2.assignment._id}/publish`);
    check("assignment published", pubA.status === 200 && pubA.data.item.isLive);
    const edited = { ...quiz.draft, questions: quiz.draft.questions.map((x, i) => (i === 0 ? { ...x, question: `${x.question} (edited)` } : x)) };
    const put = await adminHttp.put(`/ai-assessments/${quiz._id}/draft`, { draft: edited });
    check("draft edit saved and marked Under Review", put.status === 200 && put.data.item.status === "review");
    const bad = await adminHttp.put(`/ai-assessments/${quiz._id}/draft`, { draft: { ...edited, questions: [{ question: "x?", options: ["a"], answer: 5 }] } });
    check("invalid draft edit rejected", bad.status === 400);
    const autoAgain = await adminHttp.post(`/ai-course/chapter/${ch2._id}/save-topics`, { topics: [{ title: "Composition Scheme Overview", description: "", objectives: [] }] });
    await sleep(1500);
    const afterAuto = await status(ch2._id);
    check("auto generation does not overwrite edited draft", autoAgain.status === 200 && afterAuto.quiz.status === "review" && afterAuto.quiz.draft.questions[0].question.endsWith("(edited)"));
    check("auto generation does not touch published assignment", afterAuto.assignment.status === "published");

    const pub = await adminHttp.post(`/ai-assessments/${quiz._id}/publish`);
    check("quiz published", pub.status === 200 && pub.data.item.isLive);
    const student = (await publicHttp.get(`/assignments/chapter/${ch2._id}`)).data.data;
    const sq = student.find((x) => String(x._id) === String(quiz._id));
    const sa = student.find((x) => String(x._id) === String(s2.assignment._id));
    check("students see published assignment and quiz (quiz last)", sa && sq && student.indexOf(sq) > student.indexOf(sa));
    check("student quiz has no answer key / explanations", sq.questionSets[0].serverGraded && sq.questionSets[0].questions.every((x) => !("correctAnswer" in x) && !("explanation" in x)));
    check("student payload has no draft / instructor guide", !("ai" in sa) && !("instructorGuide" in sa));
    check("student assignment content rendered", /Assignment Overview/.test(sa.content[0].richTextContent) && !/instructorGuide/.test(JSON.stringify(sa)));
    const staff = (await adminHttp.get(`/assignments/chapter/${ch2._id}`)).data.data.find((x) => String(x._id) === String(quiz._id));
    check("staff still receive answer key (editor compatibility)", !!staff.questionSets[0].questions[0].correctAnswer);

    const setId = sq.questionSets[0]._id;
    const incomplete = await publicHttp.post(`/assignments/${quiz._id}/question-sets/${setId}/check`, { answers: { 0: sq.questionSets[0].questions[0].options[0] } });
    check("check refuses incomplete submission", incomplete.status === 400);
    const correctAnswers = Object.fromEntries(staff.questionSets[0].questions.map((x, i) => [i, x.correctAnswer]));
    const graded = await publicHttp.post(`/assignments/${quiz._id}/question-sets/${setId}/check`, { answers: correctAnswers });
    check("server grading scores a perfect attempt", graded.data.correct === graded.data.total && graded.data.results[0].explanation);
    const wrong = Object.fromEntries(staff.questionSets[0].questions.map((x, i) => [i, x.correctAnswer === sq.questionSets[0].questions[i].options[0] ? sq.questionSets[0].questions[i].options[1] : sq.questionSets[0].questions[i].options[0]]));
    const graded0 = await publicHttp.post(`/assignments/${quiz._id}/question-sets/${setId}/check`, { answers: wrong });
    check("server grading scores a wrong attempt as 0", graded0.data.correct === 0);

    const guide = await adminHttp.get(`/ai-assessments/${s2.assignment._id}/instructor-guide`);
    check("instructor guide available to staff", guide.status === 200 && !!guide.data.instructorGuide);

    // Regular editor (PUT /assignments/:id) still works on AI records and is tracked
    const put2 = await adminHttp.put(`/assignments/${s2.assignment._id}`, { title: `${pubA.data.item.title} (live edit)` });
    const after = await status(ch2._id);
    check("regular assignment editor works and live edit is tracked", put2.status === 200 && after.assignment.liveEditedSincePublish);
    check("draft survives regular editor save", !!after.assignment.draft?.instructorGuide);

    // AI quality review
    const rv = await adminHttp.post(`/ai-assessments/${s2.assignment._id}/review`);
    check("AI review started", rv.status === 200 && rv.data.started);
    for (let i = 0; i < 60; i += 1) {
      await sleep(10000);
      const r = (await status(ch2._id)).assignment.validation?.aiReview;
      if (r && !r.running) {
        check("AI review stored", r.error ? false : Array.isArray(r.issues), r.error || `score ${r.score}, ${r.issues.length} issues`);
        break;
      }
    }
  }

  // 4. Manual content untouched
  const manualAfter = JSON.stringify((await Assignment.findById(manual._id).lean()).questionSets);
  check("existing manual assignment unchanged", manualBefore === manualAfter);
  check("one AI record per kind per chapter", (await Assignment.countDocuments({ chapterId: ch2._id, "ai.kind": "quiz" })) === 1);
} catch (err) {
  console.error(err);
  exitCode = 1;
} finally {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) exitCode = 1;
  if (!process.env.KEEP_TEST_DATA) {
    const chapterIds = [ch1._id, ch2._id];
    const chs = await Chapter.find({ _id: { $in: chapterIds } });
    await Topic.deleteMany({ _id: { $in: chs.flatMap((c) => c.topics) } });
    await Assignment.deleteMany({ chapterId: { $in: chapterIds } });
    await Chapter.deleteMany({ _id: { $in: chapterIds } });
    await Course.deleteOne({ _id: course._id });
    console.log("Test data removed.");
  } else {
    console.log(`Test data kept. Course id: ${course._id}`);
  }
  server.close();
  await mongoose.disconnect();
  process.exit(exitCode);
}
