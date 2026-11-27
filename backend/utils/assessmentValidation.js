// Validation and normalisation of AI-generated chapter assessments.
// Nothing reaches the database unless it passes through these functions.
import { markdownToHtml, sanitizeHtml, slugify } from "./aiText.js";
import { DIFFICULTIES, QUESTION_TYPES, QUIZ_MAX_QUESTIONS } from "../services/ai/assessmentPrompts.js";
import { isQuestionStyleTitle } from "../services/ai/educationalStyle.js";

export class AssessmentValidationError extends Error {
  constructor(message, report) {
    super(message);
    this.report = report;
  }
}

const plain = (v, max = 500) =>
  String(v ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
// Markdown fields keep their line breaks
const mdText = (v, max = 8000) => String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
const plainList = (v, max = 300, limit = 15) =>
  (Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : [])
    .map((x) => plain(typeof x === "object" ? x?.text || x?.item || x?.title || "" : x, max))
    .map((x) => x.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, limit);

const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const mdHtml = (s) => sanitizeHtml(markdownToHtml(s || ""));

export const normalizeDifficulty = (v, fallback = "Beginner") => {
  const s = String(v || "").toLowerCase();
  if (/adv|hard|expert|4/.test(s)) return "Advanced";
  if (/inter|medium|moderate|2|3/.test(s)) return "Intermediate";
  if (/begin|easy|basic|found|1/.test(s)) return "Beginner";
  return DIFFICULTIES.includes(fallback) ? fallback : "Beginner";
};

const normalizeType = (v) => {
  const s = String(v || "").toLowerCase();
  if (/analy|scenario|case/.test(s)) return "analytical";
  if (/pract|appl/.test(s)) return "practical";
  if (/found|knowledge|recall|fact/.test(s)) return "foundational";
  if (/concept|understand/.test(s)) return "conceptual";
  return "conceptual";
};

// --- text similarity (duplicate detection) ---------------------------------
const STOP = new Set(
  "a an the of to in on for and or is are was be by with as at from that this which what how why when who whose whom does do did can could should would will shall may might under its it their his her following best most correct statement true".split(
    " "
  )
);
export const tokens = (s = "") =>
  new Set(
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9₹%\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !STOP.has(w))
  );
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter += 1;
  return inter / (a.size + b.size - inter);
};
export const SIMILARITY_THRESHOLD = 0.72;
export const isNearDuplicate = (a, b) => jaccard(tokens(a), tokens(b)) >= SIMILARITY_THRESHOLD;

// --- topic mapping -----------------------------------------------------------
export const matchTopic = (name, topics = []) => {
  const n = plain(name, 300).toLowerCase().replace(/^["']|["']$/g, "");
  if (!n) return null;
  const exact = topics.find((t) => t.title.trim().toLowerCase() === n);
  if (exact) return exact;
  const contains = topics.find((t) => {
    const tl = t.title.trim().toLowerCase();
    return tl.includes(n) || n.includes(tl);
  });
  if (contains) return contains;
  let best = null;
  let bestScore = 0;
  const nt = tokens(n);
  for (const t of topics) {
    const s = jaccard(nt, tokens(t.title));
    if (s > bestScore) {
      best = t;
      bestScore = s;
    }
  }
  return bestScore >= 0.34 ? best : null;
};

// ---------------------------------------------------------------------------
// Practical assignment
// ---------------------------------------------------------------------------
const normalizeTable = (t) => {
  if (!t || typeof t !== "object") return null;
  const columns = (Array.isArray(t.columns) ? t.columns : []).map((c) => plain(c, 80)).filter(Boolean).slice(0, 12);
  if (!columns.length) return null;
  const rows = (Array.isArray(t.rows) ? t.rows : [])
    .map((r) => {
      const cells = Array.isArray(r) ? r : r && typeof r === "object" ? columns.map((c) => r[c]) : [];
      return columns.map((_, i) => plain(cells[i], 200));
    })
    .filter((r) => r.some(Boolean))
    .slice(0, 60);
  if (!rows.length) return null;
  return { title: plain(t.title, 150) || "Dataset", description: plain(t.description, 600), columns, rows };
};

/**
 * Validates an AI assignment payload against the chapter context.
 * Returns { draft, instructorGuide, report } or throws AssessmentValidationError.
 */
export const normalizeAssignment = (raw, ctx) => {
  const src = raw?.assignment || raw || {};
  const errors = [];
  const warnings = [];

  const title = plain(src.title, 200);
  if (!title) errors.push("Missing assignment title.");
  if (title && isQuestionStyleTitle(title)) warnings.push(`Title "${title}" is question-style; consider a descriptive educational title.`);

  const tasks = (Array.isArray(src.tasks) ? src.tasks : [])
    .map((t, i) => {
      if (typeof t === "string") t = { title: `Task ${i + 1}`, description: t };
      const description = mdText(t?.description || t?.instructions || t?.task, 4000);
      if (!description) return null;
      const topic = matchTopic(t?.topic, ctx.topics);
      return { title: plain(t?.title, 200) || `Task ${i + 1}`, description, topic: topic?.title || "" };
    })
    .filter(Boolean)
    .slice(0, 10);
  if (!tasks.length) errors.push("The assignment has no tasks.");

  const instructions = plainList(src.instructions || src.steps, 500, 20);
  if (instructions.length < 3) errors.push("Step-by-step instructions are missing or too short.");

  const overview = mdText(src.overview, 2000);
  if (!overview) errors.push("Missing assignment overview.");

  let criteria = (Array.isArray(src.assessmentCriteria) ? src.assessmentCriteria : [])
    .map((c) => ({
      criterion: plain(c?.criterion || c?.name, 150),
      description: plain(c?.description, 500),
      marks: Math.max(0, Number(c?.marks) || 0),
    }))
    .filter((c) => c.criterion)
    .slice(0, 10);
  const total = criteria.reduce((s, c) => s + c.marks, 0);
  if (criteria.length && total !== 100) {
    if (total > 0) {
      // Rescale proportionally, fix rounding on the largest row
      criteria = criteria.map((c) => ({ ...c, marks: Math.round((c.marks / total) * 100) }));
      const diff = 100 - criteria.reduce((s, c) => s + c.marks, 0);
      const max = criteria.reduce((m, c, i) => (c.marks > criteria[m].marks ? i : m), 0);
      criteria[max].marks += diff;
    }
    warnings.push(`Assessment criteria totalled ${total} marks and were rescaled to 100.`);
  }
  if (!criteria.length) warnings.push("No assessment criteria were provided.");

  // Topic coverage: every chapter topic should be applied somewhere
  const covered = new Set(tasks.map((t) => t.topic).filter(Boolean));
  for (const c of Array.isArray(src.topicCoverage) ? src.topicCoverage : []) {
    const t = matchTopic(c?.topic, ctx.topics);
    if (t) covered.add(t.title);
  }
  const uncovered = ctx.topics.filter((t) => !covered.has(t.title)).map((t) => t.title);
  if (uncovered.length) warnings.push(`Topics not clearly covered: ${uncovered.join("; ")}.`);

  if (errors.length) throw new AssessmentValidationError(errors.join(" "), { errors, warnings });

  const guide = src.instructorGuide || src.referenceSolution || {};
  const seo = src.seo || {};
  const draft = {
    title,
    overview,
    learningObjectives: plainList(src.learningObjectives, 300, 8),
    scenario: {
      title: plain(src.scenario?.title, 200),
      background: mdText(typeof src.scenario === "string" ? src.scenario : src.scenario?.background, 5000),
    },
    requiredInformation: mdText(src.requiredInformation, 5000),
    datasets: (Array.isArray(src.datasets) ? src.datasets : []).map(normalizeTable).filter(Boolean).slice(0, 4),
    tasks,
    instructions,
    deliverables: plainList(src.deliverables, 400, 8),
    learningOutcomes: plainList(src.learningOutcomes, 300, 8),
    difficulty: normalizeDifficulty(src.difficulty, ctx.difficulty),
    estimatedTime: plain(src.estimatedTime, 60) || "2-3 hours",
    assessmentCriteria: criteria,
    topicCoverage: ctx.topics.map((t) => ({ topic: t.title, covered: covered.has(t.title) })),
    seo: {
      seoTitle: plain(seo.seoTitle || title, 70),
      metaDescription: plain(seo.metaDescription, 170),
      slug: slugify(seo.slug || title).slice(0, 60),
    },
    verifyItems: (Array.isArray(src.verifyItems) ? src.verifyItems : [])
      .map((v) => ({ item: plain(v?.item || v, 300), source: plain(v?.source, 200) }))
      .filter((v) => v.item)
      .slice(0, 10),
  };
  const instructorGuide = {
    solutionOverview: mdText(guide.solutionOverview || guide.solution, 8000),
    expectedResults: plainList(guide.expectedResults, 500, 20),
    evaluationGuidelines: plainList(guide.evaluationGuidelines, 500, 15),
    commonMistakes: plainList(guide.commonMistakes, 400, 10),
  };
  return { draft, instructorGuide, report: { errors: [], warnings } };
};

const tableHtml = (t) =>
  `<p><strong>${escapeHtml(t.title)}</strong>${t.description ? ` - ${escapeHtml(t.description)}` : ""}</p>
<table><thead><tr>${t.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>${t.rows
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
const ul = (items, tag = "ul") =>
  items?.length ? `<${tag}>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</${tag}>` : "";

// Student-facing HTML (no instructor guide) for the Assignment `content` block
export const renderAssignmentHtml = (d) => {
  const parts = [];
  parts.push(
    `<p><strong>Difficulty:</strong> ${escapeHtml(d.difficulty)} &nbsp;|&nbsp; <strong>Estimated completion time:</strong> ${escapeHtml(d.estimatedTime)}</p>`
  );
  parts.push(`<h2>Assignment Overview</h2>${mdHtml(d.overview)}`);
  if (d.learningObjectives?.length) parts.push(`<h2>Learning Objectives</h2>${ul(d.learningObjectives)}`);
  if (d.scenario?.background)
    parts.push(`<h2>Practical Scenario${d.scenario.title ? `: ${escapeHtml(d.scenario.title)}` : ""}</h2>${mdHtml(d.scenario.background)}`);
  if (d.requiredInformation || d.datasets?.length) {
    parts.push(`<h2>Required Information and Dataset</h2>${mdHtml(d.requiredInformation)}${(d.datasets || []).map(tableHtml).join("\n")}`);
  }
  if (d.tasks?.length) {
    parts.push(
      `<h2>Tasks to Complete</h2>${d.tasks
        .map((t, i) => `<h3>Task ${i + 1}: ${escapeHtml(t.title)}</h3>${mdHtml(t.description)}`)
        .join("\n")}`
    );
  }
  if (d.instructions?.length) parts.push(`<h2>Step-by-Step Instructions</h2>${ul(d.instructions, "ol")}`);
  if (d.deliverables?.length) parts.push(`<h2>Expected Deliverables</h2>${ul(d.deliverables)}`);
  if (d.learningOutcomes?.length) parts.push(`<h2>Expected Learning Outcomes</h2>${ul(d.learningOutcomes)}`);
  if (d.assessmentCriteria?.length) {
    parts.push(
      `<h2>Assessment Criteria</h2><table><thead><tr><th>Criterion</th><th>Description</th><th>Marks</th></tr></thead><tbody>${d.assessmentCriteria
        .map((c) => `<tr><td>${escapeHtml(c.criterion)}</td><td>${escapeHtml(c.description)}</td><td>${c.marks}</td></tr>`)
        .join("")}</tbody></table>`
    );
  }
  return sanitizeHtml(parts.join("\n"));
};

// ---------------------------------------------------------------------------
// Chapter quiz
// ---------------------------------------------------------------------------
const BANNED_OPTION = /^(all|none|both) of the (above|following)|^(a|b) and (b|c)\b/i;

const answerIndex = (q, options) => {
  const a = q.answer ?? q.correctAnswer ?? q.correct ?? q.answerIndex;
  if (typeof a === "number" && Number.isInteger(a)) return a;
  const s = String(a ?? "").trim();
  if (/^[0-3]$/.test(s)) return Number(s);
  if (/^[A-Da-d]$/.test(s)) return s.toUpperCase().charCodeAt(0) - 65;
  const byText = options.findIndex((o) => o.toLowerCase() === s.toLowerCase().replace(/^[A-D][.)]\s*/i, ""));
  return byText;
};

/**
 * Validates AI quiz questions. Rejects malformed, off-topic and duplicate
 * questions (against `existing` stems and each other).
 * Returns { accepted, rejected }.
 */
export const validateQuizQuestions = (rawQuestions, ctx, existing = []) => {
  const accepted = [];
  const rejected = [];
  const seen = existing.map((s) => tokens(s));
  for (const q of Array.isArray(rawQuestions) ? rawQuestions : []) {
    const question = plain(q?.question || q?.text, 1200);
    const reject = (reason) => rejected.push({ question: question || "(empty)", reason });
    if (question.length < 12) {
      reject("Question text is missing or too short.");
      continue;
    }
    const options = (Array.isArray(q.options) ? q.options : [])
      .map((o) => plain(typeof o === "object" ? o?.text || o?.option : o, 300).replace(/^[A-D][.)]\s+/, ""))
      .filter(Boolean);
    if (options.length !== 4) {
      reject(`Expected 4 options, got ${options.length}.`);
      continue;
    }
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) {
      reject("Options are not distinct.");
      continue;
    }
    if (options.some((o) => BANNED_OPTION.test(o))) {
      reject('Uses an "all/none of the above" style option.');
      continue;
    }
    const answer = answerIndex(q, options);
    if (!(answer >= 0 && answer <= 3)) {
      reject("Correct answer is missing or does not match an option.");
      continue;
    }
    const explanation = plain(q.explanation, 1200);
    if (explanation.length < 15) {
      reject("Explanation is missing.");
      continue;
    }
    const topic = matchTopic(q.topic || q.relatedTopic, ctx.topics);
    if (!topic) {
      reject(`Not mapped to a chapter topic ("${plain(q.topic, 100)}").`);
      continue;
    }
    const tk = tokens(question);
    if (seen.some((s) => jaccard(tk, s) >= SIMILARITY_THRESHOLD)) {
      reject("Duplicate or substantially similar to another question.");
      continue;
    }
    seen.push(tk);
    accepted.push({
      question,
      options,
      answer,
      explanation,
      difficulty: normalizeDifficulty(q.difficulty, ctx.difficulty),
      type: QUESTION_TYPES.includes(q.type) ? q.type : normalizeType(q.type),
      topic: topic.title,
      topicId: topic.id,
    });
  }
  return { accepted, rejected };
};

const shuffle = (arr, rand = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Spreads correct answers evenly over positions A-D and shuffles distractors
export const randomizeAnswerPositions = (questions, rand = Math.random) => {
  const targets = shuffle(
    questions.map((_, i) => i % 4),
    rand
  );
  return questions.map((q, i) => {
    const correct = q.options[q.answer];
    const distractors = shuffle(
      q.options.filter((_, k) => k !== q.answer),
      rand
    );
    const options = [...distractors];
    options.splice(targets[i], 0, correct);
    return { ...q, options, answer: targets[i] };
  });
};

export const quizCoverage = (questions, topics) => {
  const count = (key) =>
    questions.reduce((acc, q) => {
      acc[q[key]] = (acc[q[key]] || 0) + 1;
      return acc;
    }, {});
  const byTopic = count("topic");
  return {
    total: questions.length,
    byTopic: topics.map((t) => ({ topic: t.title, count: byTopic[t.title] || 0 })),
    byType: count("type"),
    byDifficulty: count("difficulty"),
    answerPositions: count("answer"),
    missingTopics: topics.filter((t) => !byTopic[t.title]).map((t) => t.title),
  };
};

// Topics needing more questions for a balanced quiz
export const underCoveredTopics = (questions, topics, minPerTopic) => {
  const cov = quizCoverage(questions, topics);
  return cov.byTopic.filter((t) => t.count < minPerTopic).map((t) => t.topic);
};

export const normalizeQuizMeta = (raw, ctx) => {
  const title = plain(raw?.title, 200);
  return {
    title: title && !isQuestionStyleTitle(title) ? title : `Chapter Assessment: ${ctx.chapter.title}`,
    description:
      plain(raw?.description, 600) ||
      `Assess your understanding of ${ctx.topics.map((t) => t.title).join(", ")}.`.slice(0, 600),
  };
};

export const capQuestions = (questions) => questions.slice(0, QUIZ_MAX_QUESTIONS);

// Quiz draft -> Assignment.questionSets entry (existing student quiz format:
// correctAnswer is the option text)
export const quizToQuestionSet = (draft) => ({
  name: draft.title,
  description: draft.description,
  totalQuestions: draft.questions.length,
  timeLimit: draft.timeLimit || Math.max(15, Math.round(draft.questions.length * 1.25)),
  passingScore: draft.passingScore || 60,
  order: 0,
  questions: draft.questions.map((q) => ({
    question: q.question,
    context: `${q.topic} · ${q.difficulty}`,
    type: q.type,
    options: q.options,
    correctAnswer: q.options[q.answer],
    explanation: q.explanation,
  })),
});

// Admin-edited draft questions go through the same checks (no topic/duplicate
// rejection, but structural rules are enforced)
export const validateEditedQuiz = (draft, ctx) => {
  const errors = [];
  const questions = (Array.isArray(draft?.questions) ? draft.questions : []).map((q, i) => {
    const options = (Array.isArray(q.options) ? q.options : []).map((o) => plain(o, 300));
    const answer = Number(q.answer);
    if (plain(q.question).length < 5) errors.push(`Question ${i + 1}: text is missing.`);
    if (options.length !== 4 || options.some((o) => !o)) errors.push(`Question ${i + 1}: needs 4 non-empty options.`);
    else if (new Set(options.map((o) => o.toLowerCase())).size !== 4) errors.push(`Question ${i + 1}: options must be distinct.`);
    if (!(answer >= 0 && answer <= 3)) errors.push(`Question ${i + 1}: choose the correct option.`);
    const topic = matchTopic(q.topic, ctx.topics);
    return {
      question: plain(q.question, 1200),
      options,
      answer,
      explanation: plain(q.explanation, 1200),
      difficulty: normalizeDifficulty(q.difficulty, ctx.difficulty),
      type: QUESTION_TYPES.includes(q.type) ? q.type : normalizeType(q.type),
      topic: topic?.title || plain(q.topic, 200),
      topicId: topic?.id || null,
    };
  });
  return {
    errors,
    draft: {
      title: plain(draft?.title, 200) || `Chapter Assessment: ${ctx.chapter.title}`,
      description: plain(draft?.description, 600),
      passingScore: Math.min(100, Math.max(1, Number(draft?.passingScore) || 60)),
      timeLimit: Math.min(240, Math.max(5, Number(draft?.timeLimit) || Math.round(questions.length * 1.25))),
      questions,
    },
  };
};

export const normalizeValidationReport = (raw) => {
  const r = raw?.review || raw || {};
  return {
    score: Math.min(100, Math.max(0, Number(r.score) || 0)),
    summary: plain(r.summary, 1500),
    issues: (Array.isArray(r.issues) ? r.issues : [])
      .map((i) => ({
        location: plain(i?.location, 100),
        severity: ["high", "medium", "low"].includes(i?.severity) ? i.severity : "medium",
        problem: plain(i?.problem, 600),
        suggestion: plain(i?.suggestion, 600),
      }))
      .filter((i) => i.problem)
      .slice(0, 40),
    reviewedAt: new Date(),
  };
};
