// AI for Course Management, mounted at /api/ai-course:
//   POST /course-details          - Create/Edit Course form auto-fill
//   POST /content                 - topic / case study / assignment / description HTML
//   POST /assist                  - editor AI tab actions
//   POST /review                  - editor Review tab
//   POST /:courseId/structure ... - course outline generation (chapters + lessons)
// Generation never saves anything; the admin reviews the result first. The
// outline is only written after confirmation via POST /:courseId/save-structure.
import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireContentAccess } from "./aiContentRoutes.js";
import Course from "../models/Content/Course.js";
import Chapter from "../models/Content/Chapter.js";
import Topic from "../models/Content/Topic.js";
import {
  buildStructurePrompt,
  buildChapterPrompt,
  buildOutlineTopicPrompt,
  buildCourseDetailsPrompt,
  buildTopicsPrompt,
  buildLessonPrompt,
  MAX_CHAPTERS,
  MAX_TOPICS,
  buildContentPrompt,
  buildAssistPrompt,
  buildReviewPrompt,
  COURSE_DETAIL_FIELDS,
  CONTENT_KINDS,
  ASSIST_ACTIONS,
} from "../services/ai/aiPrompts.js";
import { runAiJob, publicJob } from "../services/ai/n8nAiService.js";
import { normalizeOutlineChapter, normalizeOutlineTopic } from "../utils/aiText.js";
import { autoGenerateForChapters } from "../services/chapterAssessmentService.js";

const router = Router();
router.use(requireAuth, requireContentAccess);

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const stripHtml = (html = "") =>
  String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clampInt = (v, min, max, dflt) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};

// Course context = what the admin typed in the generator, falling back to the course record
const buildContext = (course, body = {}) => ({
  courseTitle: String(body.courseTitle || course?.title || "").slice(0, 300),
  courseDescription: (String(body.courseDescription || "").trim() || stripHtml(course?.description)).slice(0, 4000),
  category: String(body.category || course?.category || "").slice(0, 200),
  targetAudience: String(body.targetAudience || "").slice(0, 500),
  level: ["Beginner", "Intermediate", "Advanced"].includes(body.level) ? body.level : "Beginner",
  totalChapters: clampInt(body.totalChapters, 0, 10, 0),
  lessonsPerChapter: clampInt(body.lessonsPerChapter, 0, 10, 0),
  learningObjectives: String(body.learningObjectives || "").slice(0, 4000),
  instructions: String(body.instructions || "").slice(0, 4000),
});

const loadCourse = async (courseId, res) => {
  if (!isId(courseId)) {
    res.status(400).json({ message: "Invalid course id" });
    return null;
  }
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404).json({ message: "Course not found" });
    return null;
  }
  return course;
};

const respondWithJob = (res, job) => res.json({ success: true, job: publicJob(job) });

// Generate the complete chapter + lesson outline
router.post("/:courseId/structure", async (req, res) => {
  try {
    const course = await loadCourse(req.params.courseId, res);
    if (!course) return;
    const ctx = buildContext(course, req.body);
    if (!ctx.courseTitle) return res.status(400).json({ message: "Course title is required." });
    // Chapters already in the course: the AI only adds what is missing
    const existing = await Chapter.find({ _id: { $in: course.chapters || [] } }).select("title");
    ctx.existingChapterTitles = existing.map((c) => c.title).filter(Boolean);
    if (ctx.existingChapterTitles.length >= MAX_CHAPTERS) {
      return res.status(400).json({ message: `This course already has ${ctx.existingChapterTitles.length} chapters (maximum ${MAX_CHAPTERS}).` });
    }
    const job = await runAiJob({
      type: "structure",
      prompt: buildStructurePrompt(ctx),
      content: `${ctx.courseTitle}\n\n${ctx.courseDescription}`,
      input: { courseId: course._id, ...ctx },
      userId: req.user?._id,
      meta: { title: ctx.courseTitle },
    });
    respondWithJob(res, job);
  } catch (err) {
    console.error("AI structure error:", err);
    res.status(500).json({ message: "Failed to start structure generation" });
  }
});

// Regenerate a single chapter of the (unsaved) outline
router.post("/:courseId/chapter", async (req, res) => {
  try {
    const course = await loadCourse(req.params.courseId, res);
    if (!course) return;
    const ctx = buildContext(course, req.body);
    const job = await runAiJob({
      type: "chapter",
      prompt: buildChapterPrompt(ctx, {
        chapterNumber: clampInt(req.body.chapterNumber, 1, 100, 1),
        currentTitle: String(req.body.currentTitle || "").slice(0, 200),
        otherChapterTitles: (req.body.otherChapterTitles || []).map(String).slice(0, 40),
      }),
      content: ctx.courseTitle,
      input: { courseId: course._id },
      userId: req.user?._id,
      meta: { title: ctx.courseTitle },
    });
    respondWithJob(res, job);
  } catch (err) {
    console.error("AI chapter error:", err);
    res.status(500).json({ message: "Failed to start chapter generation" });
  }
});

// Regenerate a single lesson of the (unsaved) outline
router.post("/:courseId/outline-topic", async (req, res) => {
  try {
    const course = await loadCourse(req.params.courseId, res);
    if (!course) return;
    const ctx = buildContext(course, req.body);
    const job = await runAiJob({
      type: "outline-topic",
      prompt: buildOutlineTopicPrompt(ctx, {
        chapterTitle: String(req.body.chapterTitle || "").slice(0, 200),
        currentTitle: String(req.body.currentTitle || "").slice(0, 200),
        otherTopicTitles: (req.body.otherTopicTitles || []).map(String).slice(0, 40),
      }),
      content: ctx.courseTitle,
      input: { courseId: course._id },
      userId: req.user?._id,
      meta: { title: ctx.courseTitle },
    });
    respondWithJob(res, job);
  } catch (err) {
    console.error("AI outline topic error:", err);
    res.status(500).json({ message: "Failed to start lesson generation" });
  }
});

const overviewHtml = (topic) => {
  const parts = [];
  if (topic.description) parts.push(`<p>${escapeHtml(topic.description)}</p>`);
  if (topic.objectives?.length) {
    parts.push("<h3>Learning objectives</h3>");
    parts.push(`<ul>${topic.objectives.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>`);
  }
  return parts.join("\n") || `<p>${escapeHtml(topic.title)}</p>`;
};

// Save the reviewed outline as real chapters + topics (after admin confirmation).
// Chapters/topics whose titles already exist in the course are not duplicated.
router.post("/:courseId/save-structure", async (req, res) => {
  const createdChapterIds = [];
  const createdTopicIds = [];
  const touchedChapters = []; // existing chapters that received new topics
  try {
    const course = await loadCourse(req.params.courseId, res);
    if (!course) return;

    const chapters = (Array.isArray(req.body.chapters) ? req.body.chapters : [])
      .map(normalizeOutlineChapter)
      .filter(Boolean);
    if (!chapters.length) return res.status(400).json({ message: "There are no chapters to save." });

    const existing = await Chapter.find({ _id: { $in: course.chapters } }).populate("topics", "title");
    const byTitle = new Map(existing.map((c) => [c.title.trim().toLowerCase(), c]));
    const now = new Date();
    const summary = { chaptersCreated: 0, chaptersMerged: 0, chaptersSkipped: 0, topicsCreated: 0, topicsSkipped: 0 };

    for (const ch of chapters) {
      let chapterDoc = byTitle.get(ch.title.toLowerCase());
      let isNew = false;
      if (!chapterDoc && course.chapters.length + createdChapterIds.length >= MAX_CHAPTERS) {
        summary.chaptersSkipped += 1; // a course has at most MAX_CHAPTERS chapters
        continue;
      }
      if (!chapterDoc) {
        chapterDoc = new Chapter({
          title: ch.title,
          description: ch.description,
          learningObjectives: ch.objectives,
          order: course.chapters.length + createdChapterIds.length + 1,
          status: "Active",
          publishAt: now,
          topics: [],
        });
        isNew = true;
      } else {
        summary.chaptersMerged += 1;
      }

      const existingTopicTitles = new Set(
        (chapterDoc.topics || []).map((t) => String(t?.title || "").trim().toLowerCase())
      );
      const newTopicIds = [];
      for (const t of ch.topics) {
        const key = t.title.toLowerCase();
        if (existingTopicTitles.has(key)) {
          summary.topicsSkipped += 1;
          continue;
        }
        existingTopicTitles.add(key);
        const topicDoc = await Topic.create({ title: t.title, content: overviewHtml(t), publishAt: now });
        createdTopicIds.push(topicDoc._id);
        newTopicIds.push(topicDoc._id);
        summary.topicsCreated += 1;
      }

      if (isNew) {
        chapterDoc.topics = newTopicIds;
        await chapterDoc.save();
        createdChapterIds.push(chapterDoc._id);
        byTitle.set(ch.title.toLowerCase(), chapterDoc);
        summary.chaptersCreated += 1;
      } else if (newTopicIds.length) {
        await Chapter.updateOne({ _id: chapterDoc._id }, { $push: { topics: { $each: newTopicIds } }, $set: { updatedAt: now } });
        touchedChapters.push({ id: chapterDoc._id, topicIds: newTopicIds });
      }
    }

    if (createdChapterIds.length) {
      await Course.updateOne(
        { _id: course._id },
        { $push: { chapters: { $each: createdChapterIds } }, $set: { updatedAt: now } }
      );
    }

    // Chapters that received topics: queue their AI assignment + quiz drafts
    autoGenerateForChapters([...createdChapterIds, ...touchedChapters.map((t) => t.id)], req.user?._id);
    res.json({ success: true, summary, assessmentsQueued: summary.topicsCreated > 0 });
  } catch (err) {
    console.error("AI save structure error:", err);
    // Roll back anything this request created
    try {
      if (createdTopicIds.length) await Topic.deleteMany({ _id: { $in: createdTopicIds } });
      for (const t of touchedChapters) await Chapter.updateOne({ _id: t.id }, { $pull: { topics: { $in: t.topicIds } } });
      if (createdChapterIds.length) {
        await Chapter.deleteMany({ _id: { $in: createdChapterIds } });
        await Course.updateOne({ _id: req.params.courseId }, { $pull: { chapters: { $in: createdChapterIds } } });
      }
    } catch (rollbackErr) {
      console.error("AI save structure rollback error:", rollbackErr);
    }
    res.status(500).json({ message: "Failed to save the course structure. No changes were kept." });
  }
});

// ---------------------------------------------------------------------------
// Shared context for content generation: course, chapter and sibling topics,
// so the AI writes for the right course and does not repeat other lessons.
// ---------------------------------------------------------------------------
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const text = (v, max) => String(v ?? "").slice(0, max);

const loadItemContext = async (body = {}) => {
  let course = null;
  let chapter = null;
  if (isId(body.chapterId)) {
    chapter = await Chapter.findById(body.chapterId).select("title description learningObjectives topics");
    course = await Course.findOne({ chapters: body.chapterId }).select("title description category chapters");
  }
  if (!course && isId(body.courseId)) {
    course = await Course.findById(body.courseId).select("title description category chapters");
  }

  // Titles of the other topics in this course (current one excluded)
  let siblingTitles = [];
  if (course?.chapters?.length) {
    const chapters = await Chapter.find({ _id: { $in: course.chapters } }).select("title topics").populate("topics", "title");
    const current = String(body.title || "").trim().toLowerCase();
    siblingTitles = chapters
      .flatMap((c) => (c.topics || []).map((t) => `${c.title} > ${t.title}`))
      .filter((t) => !current || !t.toLowerCase().endsWith(`> ${current}`))
      .slice(0, 80);
  }

  return {
    courseTitle: text(body.courseTitle || course?.title || "", 300),
    courseDescription: (stripHtml(body.courseDescription) || stripHtml(course?.description)).slice(0, 2500),
    category: text(body.category || course?.category || "", 200),
    chapterTitle: text(body.chapterTitle || chapter?.title || "", 300),
    chapterDescription: text(chapter?.description || "", 1500),
    level: LEVELS.includes(body.level) ? body.level : "Beginner",
    audience: text(body.audience || "", 500),
    instructions: text(body.instructions || "", 4000),
    existingContent: stripHtml(body.existingContent).slice(0, 6000),
    siblingTitles,
    course,
    chapter,
  };
};

const jobInput = (ctx, extra = {}) => ({
  courseId: ctx.course?._id || null,
  chapterId: ctx.chapter?._id || null,
  ...extra,
});

// Create / Edit Course form: generate every applicable field from the course title
router.post("/course-details", async (req, res) => {
  try {
    const title = String(req.body.title || "").trim().slice(0, 300);
    if (!title) return res.status(400).json({ message: "Enter the course name first." });
    const fields = (Array.isArray(req.body.fields) ? req.body.fields : []).filter((f) => COURSE_DETAIL_FIELDS[f]);
    const existing = {};
    for (const [k, v] of Object.entries(req.body.existing || {})) {
      if (COURSE_DETAIL_FIELDS[k] && typeof v === "string") existing[k] = v.slice(0, 3000);
    }
    const job = await runAiJob({
      type: "course-details",
      prompt: buildCourseDetailsPrompt({
        title,
        categories: (Array.isArray(req.body.categories) ? req.body.categories : []).map((c) => text(c, 120)).slice(0, 100),
        category: text(req.body.category, 120),
        level: LEVELS.includes(req.body.level) ? req.body.level : "",
        instructions: text(req.body.instructions, 3000),
        existing,
        fields,
      }),
      content: title,
      input: { title, fields },
      userId: req.user?._id,
      meta: { title },
    });
    respondWithJob(res, job);
  } catch (err) {
    console.error("AI course details error:", err);
    res.status(500).json({ message: "Failed to start course details generation" });
  }
});

// ---------------------------------------------------------------------------
// AI Topic Generator: topics for one existing chapter
// ---------------------------------------------------------------------------
const loadChapterWithCourse = async (chapterId, res) => {
  if (!isId(chapterId)) {
    res.status(400).json({ message: "Invalid chapter id" });
    return null;
  }
  const chapter = await Chapter.findById(chapterId).populate("topics", "title");
  if (!chapter) {
    res.status(404).json({ message: "Chapter not found" });
    return null;
  }
  const course = await Course.findOne({ chapters: chapter._id });
  return { chapter, course };
};

router.post("/chapter/:chapterId/topics", async (req, res) => {
  try {
    const found = await loadChapterWithCourse(req.params.chapterId, res);
    if (!found) return;
    const { chapter, course } = found;
    const existingTopicTitles = (chapter.topics || []).map((t) => t?.title).filter(Boolean);
    if (existingTopicTitles.length >= MAX_TOPICS) {
      return res.status(400).json({ message: `This chapter already has ${existingTopicTitles.length} topics (maximum ${MAX_TOPICS}).` });
    }
    const otherChapters = course
      ? await Chapter.find({ _id: { $in: course.chapters, $ne: chapter._id } }).select("title")
      : [];
    const ctx = buildContext(course, req.body);
    const job = await runAiJob({
      type: "topics",
      prompt: buildTopicsPrompt(ctx, {
        chapterTitle: chapter.title,
        chapterDescription: String(chapter.description || "").slice(0, 1500),
        existingTopicTitles,
        otherChapterTitles: otherChapters.map((c) => c.title),
        count: Math.min(clampInt(req.body.count, 0, MAX_TOPICS, 0), MAX_TOPICS - existingTopicTitles.length),
      }),
      content: chapter.title,
      input: { chapterId: chapter._id, courseId: course?._id || null },
      userId: req.user?._id,
      meta: { title: chapter.title },
    });
    respondWithJob(res, job);
  } catch (err) {
    console.error("AI topics error:", err);
    res.status(500).json({ message: "Failed to start topic generation" });
  }
});

// Save the reviewed topics into the chapter (duplicates by title are skipped)
router.post("/chapter/:chapterId/save-topics", async (req, res) => {
  const createdIds = [];
  try {
    const found = await loadChapterWithCourse(req.params.chapterId, res);
    if (!found) return;
    const { chapter } = found;
    const topics = (Array.isArray(req.body.topics) ? req.body.topics : []).map(normalizeOutlineTopic).filter(Boolean);
    if (!topics.length) return res.status(400).json({ message: "There are no topics to save." });
    const seen = new Set((chapter.topics || []).map((t) => String(t?.title || "").trim().toLowerCase()));
    const room = MAX_TOPICS - seen.size;
    let skipped = 0;
    const now = new Date();
    for (const t of topics) {
      const key = t.title.toLowerCase();
      if (seen.has(key) || createdIds.length >= room) {
        skipped += 1;
        continue;
      }
      seen.add(key);
      const doc = await Topic.create({ title: t.title, content: overviewHtml(t), publishAt: now });
      createdIds.push(doc._id);
    }
    if (createdIds.length) {
      await Chapter.updateOne({ _id: chapter._id }, { $push: { topics: { $each: createdIds } }, $set: { updatedAt: now } });
    }
    // Queue the chapter AI assignment + quiz drafts (never overwrites published / edited ones)
    if (createdIds.length) autoGenerateForChapters([chapter._id], req.user?._id);
    res.json({ success: true, summary: { topicsCreated: createdIds.length, topicsSkipped: skipped }, assessmentsQueued: createdIds.length > 0 });
  } catch (err) {
    console.error("AI save topics error:", err);
    if (createdIds.length) await Topic.deleteMany({ _id: { $in: createdIds } }).catch(() => {});
    res.status(500).json({ message: "Failed to save the topics. No changes were kept." });
  }
});

// Full content for a topic, case study, assignment or description.
// Returns HTML for the admin to review - nothing is saved here.
router.post("/content", async (req, res) => {
  try {
    const kind = String(req.body.kind || "topic");
    if (!CONTENT_KINDS[kind]) return res.status(400).json({ message: "Unknown content type." });
    const title = String(req.body.title || "").trim().slice(0, 300);
    if (!title) return res.status(400).json({ message: "Enter a title first." });
    const ctx = await loadItemContext(req.body);
    const isLesson = kind === "topic";
    const job = await runAiJob({
      type: isLesson ? "lesson" : "content",
      prompt: isLesson ? buildLessonPrompt({ ...ctx, title }) : buildContentPrompt(kind, { ...ctx, title }),
      content: ctx.existingContent || title,
      input: jobInput(ctx, { kind, title }),
      userId: req.user?._id,
      meta: { title },
    });
    respondWithJob(res, job);
  } catch (err) {
    console.error("AI content error:", err);
    res.status(500).json({ message: "Failed to start content generation" });
  }
});

// Editor AI tab: rewrite / improve / expand selected text, or generate new
// material (examples, tables, MCQs, FAQs...) from the selection or title.
router.post("/assist", async (req, res) => {
  try {
    const action = String(req.body.action || "");
    const def = ASSIST_ACTIONS[action];
    if (!def) return res.status(400).json({ message: "Unknown AI action." });
    const selection = stripHtml(req.body.text).slice(0, 12000);
    const docTitle = String(req.body.documentTitle || "").trim().slice(0, 300);
    if (def.needsText && !selection) {
      return res.status(400).json({ message: `Select some text in the editor to use "${def.label}".` });
    }
    if (!selection && !docTitle) {
      return res.status(400).json({ message: "Select some text or give the document a title first." });
    }
    const ctx = await loadItemContext({ ...req.body, title: docTitle, existingContent: "" });
    const job = await runAiJob({
      type: def.json ? "assist-json" : "assist",
      prompt: buildAssistPrompt(action, {
        ...ctx,
        text: selection,
        documentTitle: docTitle,
        documentText: stripHtml(req.body.documentText).slice(0, selection ? 4000 : 6000),
        tone: text(req.body.tone, 60),
        language: text(req.body.language, 60),
        count: clampInt(req.body.count, 1, 20, 0) || undefined,
      }),
      content: selection || docTitle,
      input: jobInput(ctx, { action }),
      userId: req.user?._id,
      meta: { title: docTitle || def.label },
    });
    respondWithJob(res, job);
  } catch (err) {
    console.error("AI assist error:", err);
    res.status(500).json({ message: "Failed to start the AI action" });
  }
});

// Editor Review tab: spelling, grammar, punctuation, readability and suggestions
router.post("/review", async (req, res) => {
  try {
    const content = stripHtml(req.body.text).slice(0, 15000);
    if (content.length < 20) return res.status(400).json({ message: "Write some content before running a review." });
    const job = await runAiJob({
      type: "review",
      prompt: buildReviewPrompt({
        text: content,
        documentTitle: text(req.body.documentTitle, 300),
        level: LEVELS.includes(req.body.level) ? req.body.level : "",
      }),
      content,
      input: {},
      userId: req.user?._id,
      meta: { title: text(req.body.documentTitle, 200) || "review" },
    });
    respondWithJob(res, job);
  } catch (err) {
    console.error("AI review error:", err);
    res.status(500).json({ message: "Failed to start the review" });
  }
});

export default router;
