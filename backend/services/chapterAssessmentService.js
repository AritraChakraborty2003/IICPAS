// Chapter assessments: AI practical assignment + AI chapter quiz per chapter.
//
// Flow: chapter topics -> structured context -> AI job (existing provider via
// runAiJob) -> validation -> Assignment record with ai.draft (inactive) ->
// admin review / edit -> publish (copied into the regular Assignment fields
// the student Digital Hub already renders).
//
// Safety rules:
// - one AI assignment + one AI quiz per chapter (unique index on chapterId+ai.kind)
// - generation never changes what students see; only "publish" does
// - automatic generation never overwrites published, edited or reviewed content
// - jobs run through a small in-process queue (cost / rate-limit control)
import crypto from "crypto";
import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import Chapter from "../models/Content/Chapter.js";
import Course from "../models/Content/Course.js";
import Quiz from "../models/Content/Quiz.js";
import AiJob from "../models/AiJob.js";
import { runAiJob, expireIfStale, JOB_TIMEOUT_MS } from "./ai/n8nAiService.js";
import {
  buildAssignmentPrompt,
  buildQuizPrompt,
  buildValidationPrompt,
  DIFFICULTIES,
  QUIZ_MIN_QUESTIONS,
} from "./ai/assessmentPrompts.js";
import {
  AssessmentValidationError,
  normalizeAssignment,
  renderAssignmentHtml,
  validateQuizQuestions,
  randomizeAnswerPositions,
  quizCoverage,
  underCoveredTopics,
  normalizeQuizMeta,
  capQuestions,
  quizToQuestionSet,
  validateEditedQuiz,
  normalizeValidationReport,
} from "../utils/assessmentValidation.js";

export const KINDS = ["assignment", "quiz"];
const JOB_TYPE = { assignment: "chapter-assignment", quiz: "chapter-quiz" };
const MAX_ATTEMPTS = 3; // per generation: first try + 2 retries
const MAX_TOPUP_ROUNDS = 2; // extra quiz rounds to reach 20 valid / balanced questions
// A generation that has been "running" this long was interrupted (e.g. restart)
const STALE_MS = JOB_TIMEOUT_MS * MAX_ATTEMPTS + 10 * 60 * 1000;

export const autoGenerationEnabled = () =>
  !/^(off|false|0|no)$/i.test(String(process.env.AI_AUTO_CHAPTER_ASSESSMENTS || "on").trim());

const log = (...args) => console.log("[chapter-assessments]", ...args);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const stripHtml = (html = "") =>
  String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// In-process queue (concurrency limit = API cost / rate-limit control)
// ---------------------------------------------------------------------------
const CONCURRENCY = Math.max(1, Number(process.env.AI_ASSESSMENT_CONCURRENCY) || 2);
const queue = [];
const queuedKeys = new Set();
let active = 0;

const pump = () => {
  while (active < CONCURRENCY && queue.length) {
    const { key, fn } = queue.shift();
    active += 1;
    Promise.resolve()
      .then(fn)
      .catch((err) => console.error(`[chapter-assessments] ${key} crashed:`, err))
      .finally(() => {
        active -= 1;
        queuedKeys.delete(key);
        pump();
      });
  }
};
const enqueue = (key, fn) => {
  if (queuedKeys.has(key)) return false;
  queuedKeys.add(key);
  queue.push({ key, fn });
  pump();
  return true;
};
export const isQueued = (chapterId, kind) => queuedKeys.has(`${chapterId}:${kind}`);

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const deriveDifficulty = (course, position, total) => {
  let i = course?.level === "Professional Level" ? 1 : 0;
  if (total >= 3 && position > Math.ceil((total * 2) / 3)) i += 1;
  return DIFFICULTIES[Math.min(i, 2)];
};

export const topicsHash = (topics) =>
  crypto
    .createHash("sha1")
    .update(topics.map((t) => `${t.id}:${t.title}`).join("|"))
    .digest("hex");

/** Structured context passed to every assessment prompt */
export const loadChapterContext = async (chapterId, { difficulty, instructions } = {}) => {
  const chapter = await Chapter.findById(chapterId).populate("topics", "title content");
  if (!chapter) return null;
  const course = await Course.findOne({ chapters: chapter._id }).select("title category level description chapters");
  const position = course ? course.chapters.findIndex((c) => String(c) === String(chapter._id)) + 1 : 0;
  const total = course?.chapters?.length || 0;

  const topics = (chapter.topics || [])
    .filter((t) => t && t.title)
    .map((t) => ({ id: String(t._id), title: String(t.title).trim(), summary: stripHtml(t.content).slice(0, 450) }));

  // Existing material, for duplicate prevention
  const manual = await Assignment.find({ chapterId: chapter._id, "ai.kind": { $exists: false } })
    .select("title questionSets.questions.question")
    .lean();
  const topicQuizzes = topics.length
    ? await Quiz.find({ topic: { $in: topics.map((t) => t.id) } }).select("questions.question").lean()
    : [];
  const existingQuestions = [
    ...manual.flatMap((a) => (a.questionSets || []).flatMap((qs) => (qs.questions || []).map((q) => q.question))),
    ...topicQuizzes.flatMap((q) => (q.questions || []).map((x) => x.question)),
  ].filter(Boolean);

  return {
    course: {
      id: course ? String(course._id) : null,
      title: course?.title || "",
      category: course?.category || "",
      level: course?.level || "",
      description: stripHtml(course?.description).slice(0, 1200),
    },
    chapter: {
      id: String(chapter._id),
      title: chapter.title,
      description: String(chapter.description || "").slice(0, 1200),
      objectives: (chapter.learningObjectives || []).slice(0, 10),
      position,
      total,
    },
    topics,
    difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : deriveDifficulty(course, position, total),
    instructions: String(instructions || "").slice(0, 3000),
    existingAssignmentTitles: manual.map((a) => a.title).filter(Boolean),
    existingQuestions,
    topicsHash: topicsHash(topics),
  };
};

// ---------------------------------------------------------------------------
// AI calls
// ---------------------------------------------------------------------------
const TRANSIENT = /rate limit|timed out|did not respond|temporarily|unavailable|network|could not reach|HTTP 5\d\d|HTTP 429|overloaded/i;

// Runs one AI job and waits for it to settle (n8n callback or Claude background)
const runAndWait = async ({ type, prompt, ctx, userId, recordId }) => {
  let job = await runAiJob({
    type,
    prompt,
    content: `${ctx.chapter.title}\n${ctx.topics.map((t) => t.title).join("\n")}`,
    input: { chapterId: ctx.chapter.id, courseId: ctx.course.id, assessmentId: String(recordId) },
    userId,
    meta: { title: `${ctx.chapter.title} (${type})` },
  });
  await Assignment.updateOne({ _id: recordId }, { $push: { "ai.jobIds": job._id } });
  while (job && job.status === "pending") {
    await sleep(4000);
    job = await AiJob.findById(job._id);
    if (job) await expireIfStale(job);
  }
  if (!job) throw new Error("The AI job record disappeared.");
  if (job.status === "failed") {
    const err = new Error(job.error || "AI generation failed.");
    err.transient = TRANSIENT.test(job.error || "");
    throw err;
  }
  return job.result?.data || {};
};

// Retries transient failures and invalid output (with backoff)
const withRetries = async (recordId, fn) => {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await Assignment.updateOne({ _id: recordId }, { $set: { "ai.attempts": attempt, "ai.status": "generating" } });
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      log(`attempt ${attempt} failed for ${recordId}: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) await sleep((err.transient ? 30000 : 5000) * attempt);
    }
  }
  throw lastErr;
};

const generateAssignmentDraft = async (record, ctx, userId) =>
  withRetries(record._id, async () => {
    const data = await runAndWait({ type: JOB_TYPE.assignment, prompt: buildAssignmentPrompt(ctx), ctx, userId, recordId: record._id });
    const { draft, instructorGuide, report } = normalizeAssignment(data, ctx);
    return { draft: { ...draft, instructorGuide }, validation: { ...report, checkedAt: new Date() } };
  });

const generateQuizDraft = async (record, ctx, userId) =>
  withRetries(record._id, async () => {
    const data = await runAndWait({ type: JOB_TYPE.quiz, prompt: buildQuizPrompt(ctx, { count: 24 }), ctx, userId, recordId: record._id });
    const meta = normalizeQuizMeta(data, ctx);
    const first = validateQuizQuestions(data.questions, ctx, ctx.existingQuestions);
    let accepted = first.accepted;
    const rejected = [...first.rejected];
    const minPerTopic = Math.max(1, Math.min(2, Math.floor(QUIZ_MIN_QUESTIONS / Math.max(1, ctx.topics.length))));

    // Top-up rounds: fill the gap to 20 and cover under-represented topics
    for (let round = 1; round <= MAX_TOPUP_ROUNDS; round += 1) {
      const needed = QUIZ_MIN_QUESTIONS - accepted.length;
      const focus = underCoveredTopics(accepted, ctx.topics, minPerTopic);
      if (needed <= 0 && !focus.length) break;
      const count = Math.min(15, Math.max(needed + 3, focus.length * 2));
      log(`quiz ${record._id}: top-up round ${round} (${count} more, focus: ${focus.length} topics)`);
      const more = await runAndWait({
        type: JOB_TYPE.quiz,
        prompt: buildQuizPrompt(ctx, { count, focusTopics: focus, avoidQuestions: accepted.map((q) => q.question), topUp: true }),
        ctx,
        userId,
        recordId: record._id,
      });
      const next = validateQuizQuestions(more.questions, ctx, [...ctx.existingQuestions, ...accepted.map((q) => q.question)]);
      accepted = accepted.concat(next.accepted);
      rejected.push(...next.rejected);
    }

    if (accepted.length < QUIZ_MIN_QUESTIONS) {
      throw new AssessmentValidationError(
        `Only ${accepted.length} valid questions were generated (minimum ${QUIZ_MIN_QUESTIONS}).`,
        { rejected: rejected.slice(0, 30) }
      );
    }
    const questions = randomizeAnswerPositions(capQuestions(accepted));
    const coverage = quizCoverage(questions, ctx.topics);
    const warnings = coverage.missingTopics.length ? [`No questions for: ${coverage.missingTopics.join("; ")}.`] : [];
    return {
      draft: { ...meta, passingScore: 60, timeLimit: Math.max(15, Math.round(questions.length * 1.25)), questions },
      validation: { errors: [], warnings, coverage, rejected: rejected.slice(0, 30), checkedAt: new Date() },
    };
  });

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------
const placeholderTitle = (kind, chapterTitle) =>
  kind === "quiz" ? `Chapter Assessment: ${chapterTitle}` : `Practical Assignment: ${chapterTitle}`;

const findOrCreateRecord = async (chapter, kind, userId) => {
  const existing = await Assignment.findOne({ chapterId: chapter._id, "ai.kind": kind });
  if (existing) return existing;
  try {
    return await Assignment.create({
      title: placeholderTitle(kind, chapter.title),
      description: "",
      chapterId: chapter._id,
      order: kind === "quiz" ? 1000 : 900, // after manual assignments; quiz last
      isActive: false,
      ai: { kind, status: "pending", createdBy: userId || null },
    });
  } catch (err) {
    if (err?.code === 11000) return Assignment.findOne({ chapterId: chapter._id, "ai.kind": kind });
    throw err;
  }
};

const isRunning = (rec) =>
  ["pending", "generating"].includes(rec?.ai?.status) &&
  rec.ai.startedAt &&
  Date.now() - new Date(rec.ai.startedAt).getTime() < STALE_MS;

// Why automatic generation must leave a record alone (null = may generate)
const autoSkipReason = (rec, ctx) => {
  if (!rec?.ai) return null;
  if (isRunning(rec)) return "already running";
  if (rec.isActive || rec.ai.status === "published") return "published";
  if (rec.ai.status === "review" || rec.ai.draftEditedAt) return "edited by an admin";
  if (rec.ai.status === "generated" && rec.ai.topicsHash === ctx.topicsHash) return "up to date";
  if (rec.ai.status === "failed" && rec.ai.topicsHash === ctx.topicsHash) return "failed for these topics (retry manually)";
  return null;
};

/**
 * Queue generation of the chapter's assignment and/or quiz.
 * Returns [{ kind, started, reason, id }].
 */
export const startChapterGeneration = async (
  chapterId,
  { kinds = KINDS, trigger = "manual", userId = null, difficulty, instructions } = {}
) => {
  if (!isId(chapterId)) throw Object.assign(new Error("Invalid chapter id"), { status: 400 });
  const ctx = await loadChapterContext(chapterId, { difficulty, instructions });
  if (!ctx) throw Object.assign(new Error("Chapter not found"), { status: 404 });
  if (!ctx.topics.length) {
    throw Object.assign(new Error("This chapter has no topics yet. Add or generate topics first."), { status: 400 });
  }
  const chapter = { _id: ctx.chapter.id, title: ctx.chapter.title };
  const results = [];

  for (const kind of kinds.filter((k) => KINDS.includes(k))) {
    const rec = await findOrCreateRecord(chapter, kind, userId);
    const fresh = rec.ai.status === "pending" && !rec.ai.startedAt;
    if (!fresh) {
      const reason = trigger === "auto" ? autoSkipReason(rec, ctx) : isRunning(rec) ? "already running" : null;
      if (reason) {
        results.push({ kind, started: false, reason, id: rec._id });
        continue;
      }
    }
    // Atomic claim: only one request can move the record into "pending"
    const claimed = await Assignment.findOneAndUpdate(
      {
        _id: rec._id,
        $or: [
          { "ai.status": { $nin: ["pending", "generating"] } },
          { "ai.startedAt": { $exists: false } },
          { "ai.startedAt": null },
          { "ai.startedAt": { $lt: new Date(Date.now() - STALE_MS) } },
        ],
      },
      {
        $set: {
          "ai.status": "pending",
          "ai.trigger": trigger,
          "ai.error": "",
          "ai.attempts": 0,
          "ai.startedAt": new Date(),
          "ai.difficulty": ctx.difficulty,
          "ai.instructions": ctx.instructions,
        },
      },
      { new: true }
    );
    if (!claimed) {
      results.push({ kind, started: false, reason: "already running", id: rec._id });
      continue;
    }
    const key = `${ctx.chapter.id}:${kind}`;
    enqueue(key, () => runGeneration(claimed._id, kind, { difficulty: ctx.difficulty, instructions: ctx.instructions, userId }));
    results.push({ kind, started: true, id: rec._id });
  }
  return results;
};

const runGeneration = async (recordId, kind, { difficulty, instructions, userId }) => {
  const rec = await Assignment.findById(recordId);
  if (!rec?.ai) return;
  // Reload context at run time (topics may have changed while queued)
  const ctx = await loadChapterContext(rec.chapterId, { difficulty, instructions });
  if (!ctx || !ctx.topics.length) {
    await Assignment.updateOne({ _id: recordId }, { $set: { "ai.status": "failed", "ai.error": "The chapter has no topics." } });
    return;
  }
  log(`generating ${kind} for chapter "${ctx.chapter.title}" (${ctx.topics.length} topics, ${ctx.difficulty})`);
  try {
    const { draft, validation } =
      kind === "quiz" ? await generateQuizDraft(rec, ctx, userId) : await generateAssignmentDraft(rec, ctx, userId);
    await Assignment.updateOne(
      { _id: recordId },
      {
        $set: {
          "ai.status": "generated",
          "ai.draft": draft,
          "ai.validation": validation,
          "ai.error": "",
          "ai.generatedAt": new Date(),
          "ai.draftEditedAt": null,
          "ai.topicIds": ctx.topics.map((t) => t.id),
          "ai.topicsHash": ctx.topicsHash,
        },
      }
    );
    log(`${kind} ready for chapter "${ctx.chapter.title}"`);
  } catch (err) {
    log(`${kind} failed for chapter "${ctx.chapter.title}": ${err.message}`);
    await Assignment.updateOne(
      { _id: recordId },
      {
        $set: {
          "ai.status": "failed",
          "ai.error": err.message || "Generation failed.",
          "ai.topicsHash": ctx.topicsHash,
          ...(err.report ? { "ai.validation": { ...err.report, checkedAt: new Date() } } : {}),
        },
      }
    );
  }
};

/** Fire-and-forget hook used after topics are saved (AI topic generator / outline). */
export const autoGenerateForChapters = (chapterIds = [], userId = null) => {
  if (!autoGenerationEnabled()) return;
  const unique = [...new Set(chapterIds.map(String))].filter(isId);
  (async () => {
    for (const id of unique) {
      try {
        const res = await startChapterGeneration(id, { trigger: "auto", userId });
        log(`auto for ${id}:`, res.map((r) => `${r.kind}=${r.started ? "queued" : r.reason}`).join(", "));
      } catch (err) {
        log(`auto generation skipped for ${id}: ${err.message}`);
      }
    }
  })();
};

// ---------------------------------------------------------------------------
// Admin views and actions
// ---------------------------------------------------------------------------
const adminView = (rec) => {
  if (!rec) return null;
  const ai = rec.ai || {};
  let status = ai.status;
  // Marks interrupted runs (server restart) as failed for display + retry
  if (["pending", "generating"].includes(status) && ai.startedAt && !isRunning(rec)) status = "failed";
  return {
    _id: rec._id,
    kind: ai.kind,
    title: rec.title,
    status,
    isLive: !!rec.isActive,
    trigger: ai.trigger,
    attempts: ai.attempts,
    error: status === "failed" && !ai.error ? "Generation was interrupted. Please retry." : ai.error,
    difficulty: ai.difficulty,
    instructions: ai.instructions,
    startedAt: ai.startedAt,
    generatedAt: ai.generatedAt,
    draftEditedAt: ai.draftEditedAt,
    publishedAt: ai.publishedAt,
    liveEditedAt: ai.liveEditedAt,
    liveEditedSincePublish: !!(ai.liveEditedAt && ai.publishedAt && ai.liveEditedAt > ai.publishedAt),
    hasDraft: !!ai.draft,
    validation: ai.validation || null,
    draft: ai.draft || null,
    // Exactly what students will see after publishing (assignment only)
    previewHtml: ai.kind === "assignment" && ai.draft ? renderAssignmentHtml(ai.draft) : null,
    queued: isQueued(String(rec.chapterId), ai.kind),
  };
};

export const getChapterAssessments = async (chapterId) => {
  if (!isId(chapterId)) throw Object.assign(new Error("Invalid chapter id"), { status: 400 });
  const chapter = await Chapter.findById(chapterId).populate("topics", "title");
  if (!chapter) throw Object.assign(new Error("Chapter not found"), { status: 404 });
  const records = await Assignment.find({ chapterId, "ai.kind": { $exists: true } }).select("+ai.draft");
  const byKind = Object.fromEntries(KINDS.map((k) => [k, adminView(records.find((r) => r.ai?.kind === k))]));
  const currentHash = topicsHash((chapter.topics || []).map((t) => ({ id: String(t._id), title: String(t.title).trim() })));
  for (const k of KINDS) {
    const rec = records.find((r) => r.ai?.kind === k);
    if (byKind[k] && rec?.ai?.topicsHash) byKind[k].topicsChanged = rec.ai.topicsHash !== currentHash;
  }
  return {
    chapter: {
      _id: chapter._id,
      title: chapter.title,
      topicCount: (chapter.topics || []).length,
      topics: (chapter.topics || []).map((t) => ({ _id: t._id, title: t.title })),
    },
    autoGeneration: autoGenerationEnabled(),
    ...byKind,
  };
};

const loadRecord = async (id) => {
  if (!isId(id)) throw Object.assign(new Error("Invalid id"), { status: 400 });
  const rec = await Assignment.findOne({ _id: id, "ai.kind": { $exists: true } }).select("+ai.draft +instructorGuide");
  if (!rec) throw Object.assign(new Error("AI assessment not found"), { status: 404 });
  return rec;
};

/** Admin edits of the draft (validated with the same rules) */
export const updateDraft = async (id, draft) => {
  const rec = await loadRecord(id);
  if (isRunning(rec)) throw Object.assign(new Error("Generation is still running."), { status: 409 });
  const ctx = await loadChapterContext(rec.chapterId);
  let next;
  let validation;
  if (rec.ai.kind === "quiz") {
    const res = validateEditedQuiz(draft, ctx);
    if (res.errors.length) throw Object.assign(new Error(res.errors.slice(0, 5).join(" ")), { status: 400, details: res.errors });
    next = res.draft;
    validation = { ...(rec.ai.validation || {}), coverage: quizCoverage(next.questions, ctx.topics), checkedAt: new Date() };
  } else {
    try {
      const res = normalizeAssignment(draft, ctx);
      next = { ...res.draft, instructorGuide: res.instructorGuide };
      validation = { ...res.report, checkedAt: new Date() };
    } catch (err) {
      throw Object.assign(new Error(err.message), { status: 400 });
    }
  }
  rec.ai.draft = next;
  rec.ai.validation = { ...validation, aiReview: rec.ai.validation?.aiReview };
  rec.ai.status = "review";
  rec.ai.draftEditedAt = new Date();
  rec.markModified("ai");
  await rec.save();
  return adminView(rec);
};

/** Approve and publish: copies the draft into the fields students see */
export const publishAssessment = async (id) => {
  const rec = await loadRecord(id);
  const d = rec.ai.draft;
  if (!d) throw Object.assign(new Error("There is no generated content to publish."), { status: 400 });
  if (isRunning(rec)) throw Object.assign(new Error("Generation is still running."), { status: 409 });

  if (rec.ai.kind === "quiz") {
    if ((d.questions || []).length < QUIZ_MIN_QUESTIONS) {
      throw Object.assign(new Error(`A chapter quiz needs at least ${QUIZ_MIN_QUESTIONS} questions.`), { status: 400 });
    }
    const qs = quizToQuestionSet(d);
    rec.title = d.title;
    rec.description = d.description;
    rec.content = [
      {
        type: "rich",
        order: 0,
        richTextContent: `<p>${String(d.description || "").replace(/</g, "&lt;")}</p><p><strong>Questions:</strong> ${qs.totalQuestions} &nbsp;|&nbsp; <strong>Suggested time:</strong> ${qs.timeLimit} minutes &nbsp;|&nbsp; <strong>Passing score:</strong> ${qs.passingScore}%</p><p>Answers and explanations are shown after you submit the quiz.</p>`,
      },
    ];
    rec.tasks = [];
    rec.questionSets = [qs];
  } else {
    rec.title = d.title;
    rec.description = String(d.overview || "").replace(/[*_#`>|]/g, "").slice(0, 1000);
    rec.content = [{ type: "rich", order: 0, richTextContent: renderAssignmentHtml(d) }];
    rec.tasks = [];
    rec.instructorGuide = d.instructorGuide || null;
    rec.seo = d.seo || {};
  }
  rec.isActive = true;
  rec.ai.status = "published";
  rec.ai.publishedAt = new Date();
  rec.markModified("ai");
  await rec.save();
  return adminView(rec);
};

export const unpublishAssessment = async (id) => {
  const rec = await loadRecord(id);
  rec.isActive = false;
  rec.ai.status = rec.ai.draft ? "review" : "pending";
  rec.markModified("ai");
  await rec.save();
  return adminView(rec);
};

// ai.validation may be null, so merge in JS instead of a dotted $set
const setAiReview = async (id, aiReview) => {
  const doc = await Assignment.findById(id).select("ai.validation").lean();
  await Assignment.updateOne({ _id: id }, { $set: { "ai.validation": { ...(doc?.ai?.validation || {}), aiReview } } });
};

/** AI quality review of the current draft (stored in ai.validation.aiReview) */
export const startAiReview = async (id, userId) => {
  const rec = await loadRecord(id);
  if (!rec.ai.draft) throw Object.assign(new Error("Generate the content first."), { status: 400 });
  const key = `${rec.chapterId}:${rec.ai.kind}:review`;
  const started = enqueue(key, async () => {
    try {
      const ctx = await loadChapterContext(rec.chapterId);
      const { instructorGuide, ...draft } = rec.ai.draft; // eslint-disable-line no-unused-vars
      const data = await runAndWait({
        type: "assessment-validate",
        prompt: buildValidationPrompt(ctx, { kind: rec.ai.kind, draft }),
        ctx,
        userId,
        recordId: rec._id,
      });
      await setAiReview(rec._id, normalizeValidationReport(data));
    } catch (err) {
      await setAiReview(rec._id, { error: err.message, reviewedAt: new Date() });
    }
  });
  if (started) await setAiReview(rec._id, { running: true, startedAt: new Date() });
  return { started };
};

/** Student check of a server-graded question set (AI quiz) */
export const gradeQuestionSet = (assignment, questionSetId, answers = {}) => {
  const qs = (assignment.questionSets || []).find((q) => String(q._id) === String(questionSetId));
  if (!qs) return null;
  const results = qs.questions.map((q, i) => {
    const selected = answers[i] ?? answers[String(i)] ?? null;
    return {
      index: i,
      selected,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      isCorrect: selected != null && selected === q.correctAnswer,
    };
  });
  return { total: results.length, correct: results.filter((r) => r.isCorrect).length, results };
};
