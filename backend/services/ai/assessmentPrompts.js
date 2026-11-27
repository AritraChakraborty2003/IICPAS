// Prompt templates for chapter assessments: practical assignments, chapter
// quizzes and the AI quality review of a generated draft. Every prompt asks
// for strict JSON; responses are validated in utils/assessmentValidation.js.
import { EDUCATIONAL_TITLE_STYLE } from "./educationalStyle.js";

const JSON_RULES = `Return ONLY valid JSON (no Markdown fences, no commentary). Use double quotes for all keys and strings.`;

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
export const QUESTION_TYPES = ["foundational", "conceptual", "practical", "analytical"];

export const QUIZ_MIN_QUESTIONS = 20;
export const QUIZ_MAX_QUESTIONS = 30;

const list = (items) => (items || []).filter(Boolean).map((x) => `- ${x}`).join("\n");

// Course, chapter and topic context shared by every assessment prompt
const chapterContext = (ctx) => `Course: ${ctx.course.title}
${ctx.course.category ? `Course category: ${ctx.course.category}` : ""}
${ctx.course.level ? `Course level: ${ctx.course.level}` : ""}
${ctx.course.description ? `Course description: ${ctx.course.description}` : ""}

Chapter ${ctx.chapter.position || ""}${ctx.chapter.total ? ` of ${ctx.chapter.total}` : ""}: ${ctx.chapter.title}
${ctx.chapter.description ? `Chapter description: ${ctx.chapter.description}` : ""}
${ctx.chapter.objectives?.length ? `Chapter learning objectives:\n${list(ctx.chapter.objectives)}` : ""}

Target difficulty: ${ctx.difficulty}

TOPICS OF THIS CHAPTER (the ONLY source of scope - do not test or assign anything outside them):
${ctx.topics
  .map((t, i) => `${i + 1}. "${t.title}"${t.summary ? `\n   Summary: ${t.summary}` : ""}`)
  .join("\n")}
${ctx.instructions ? `\nAdditional instructions from the admin (follow closely):\n${ctx.instructions}` : ""}`;

const ACCURACY = `Accuracy: for taxation, accounting and regulatory content use current Indian law (see the regulatory context in your instructions). Never invent section numbers, notification numbers, rates or due dates; when a figure must be double-checked, list it in "verifyItems" with the official website.
Originality: write 100% original content with fictional businesses and people. Do not copy any coaching platform, textbook or website.`;

// ---------------------------------------------------------------------------
// Practical assignment
// ---------------------------------------------------------------------------
export const buildAssignmentPrompt = (ctx) => `You are a senior faculty member and instructional designer at IICPA Institute. Create ONE practical, industry-oriented assignment for the chapter below.

${chapterContext(ctx)}

${ctx.existingAssignmentTitles?.length ? `Assignments that already exist for this chapter (create something clearly different):\n${list(ctx.existingAssignmentTitles)}\n` : ""}
REQUIREMENTS
- The assignment must apply ALL of the chapter topics above (map each topic in "topicCoverage") and nothing outside them.
- Practical first: for accounting, taxation, GST, TDS, Excel, Tally, Power BI and similar subjects build a realistic hands-on exercise (transactions, invoices, ledgers, datasets, returns, dashboards), not theory questions.
- Set it in a fictional but realistic Indian business with figures in INR (Indian digit grouping, e.g. ₹1,25,000).
- Provide every dataset the student needs inside "datasets" (8-20 rows each where a table is needed), so the assignment can be completed without outside data.
- Match the target difficulty: Beginner = guided steps, Intermediate = less guidance and some judgement, Advanced = open-ended analysis.
- "instructorGuide" is for authorised instructors only: give the expected results, key figures and how to evaluate. Students never see it.

${EDUCATIONAL_TITLE_STYLE}

${ACCURACY}

${JSON_RULES} Text fields may use Markdown (lists, **bold**, tables) unless marked plain. Use exactly this shape:
{
  "title": string (plain, 4-12 words, professional educational title),
  "overview": string (2-4 sentences),
  "learningObjectives": [string] (3-6, each starts with an action verb),
  "scenario": { "title": string (plain), "background": string (Markdown, the business case study, 120-250 words) },
  "requiredInformation": string (Markdown: facts, assumptions, rates and policies the student must use),
  "datasets": [ { "title": string, "description": string, "columns": [string], "rows": [[string]] } ] (0-3 tables),
  "tasks": [ { "title": string (plain), "description": string (Markdown, what to do and the expected output), "topic": string (exact topic title it applies) } ] (3-7),
  "instructions": [string] (step-by-step instructions, 5-12 steps),
  "deliverables": [string] (2-5),
  "learningOutcomes": [string] (3-6),
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "estimatedTime": string (plain, e.g. "3-4 hours"),
  "assessmentCriteria": [ { "criterion": string, "description": string, "marks": number } ] (4-7 rows, marks total exactly 100),
  "topicCoverage": [ { "topic": string (exact topic title), "coveredBy": string (which task applies it) } ],
  "instructorGuide": {
    "solutionOverview": string (Markdown),
    "expectedResults": [string] (key figures / outputs a correct submission shows),
    "evaluationGuidelines": [string],
    "commonMistakes": [string]
  },
  "seo": { "seoTitle": string (max 60 chars), "metaDescription": string (140-155 chars, plain), "slug": string (lowercase-hyphens, max 6 words) },
  "verifyItems": [ { "item": string, "source": string } ]
}`;

// ---------------------------------------------------------------------------
// Chapter quiz (also used for top-up rounds that fill gaps after validation)
// ---------------------------------------------------------------------------
const distribution = (n) => {
  const f = Math.round(n * 0.3);
  const c = Math.round(n * 0.3);
  const p = Math.round(n * 0.25);
  return { foundational: f, conceptual: c, practical: p, analytical: Math.max(1, n - f - c - p) };
};

export const buildQuizPrompt = (ctx, { count = 24, focusTopics = [], avoidQuestions = [], topUp = false } = {}) => {
  const d = distribution(count);
  return `You are a senior examiner at IICPA Institute. ${topUp ? `Write ${count} ADDITIONAL` : `Write ${count}`} multiple-choice questions for the chapter assessment quiz of the chapter below.

${chapterContext(ctx)}

${focusTopics.length ? `Focus these questions on the following topics (they are not yet covered well):\n${list(focusTopics)}\n` : ""}
${avoidQuestions.length ? `Questions that ALREADY exist - do not repeat or paraphrase any of them:\n${list(avoidQuestions.slice(0, 80))}\n` : ""}
REQUIREMENTS
- Every question tests one of the chapter topics above; set "topic" to that topic's exact title. Spread questions evenly across all topics.
- Question types (approximate): ${d.foundational} foundational knowledge, ${d.conceptual} conceptual understanding, ${d.practical} practical application, ${d.analytical} analytical / scenario-based (a short realistic Indian business situation with INR figures, then the question). Adjust slightly to suit the subject.
- Exactly 4 options per question, exactly ONE correct option. Options must be distinct, similar in length and plausible; no "All of the above" / "None of the above"; no trick wording, double negatives or ambiguity.
- "answer" is the 0-based index of the correct option. Vary the position of the correct answer.
- "explanation": 1-3 sentences explaining why the correct option is right (and, where useful, why a tempting option is wrong).
- Mix difficulty around the target: Beginner, Intermediate, Advanced.
- Questions keep natural interrogative wording. Each question must be unique and test a different point.

${ACCURACY}

${JSON_RULES} Plain text in every field (no Markdown). Use exactly this shape:
{
  ${topUp ? "" : `"title": string (professional quiz title, e.g. "Chapter Assessment: Fundamentals of Power BI"),
  "description": string (1-2 sentences describing what the quiz assesses),
  `}"questions": [ { "question": string, "options": [string, string, string, string], "answer": number, "explanation": string, "difficulty": "Beginner" | "Intermediate" | "Advanced", "type": "foundational" | "conceptual" | "practical" | "analytical", "topic": string } ]
}`;
};

// ---------------------------------------------------------------------------
// Educational content validation (AI review of a stored draft)
// ---------------------------------------------------------------------------
export const buildValidationPrompt = (ctx, { kind, draft }) => `You are the academic quality reviewer at IICPA Institute. Review this AI-generated ${kind === "quiz" ? "chapter quiz" : "practical assignment"} before it is published to students.

${chapterContext(ctx)}

Check:
1. Relevance - everything stays within the chapter topics.
2. Accuracy - facts, laws, rates, financial / tax years and calculations are correct for India today. Flag anything outdated or uncertain.
3. ${kind === "quiz" ? "Every question has exactly one defensible correct answer; options are unambiguous; explanations are correct." : "The dataset is sufficient and consistent, tasks are achievable, marks total 100."}
4. Language - professional, clear, original; titles follow educational (non-question) style.

DRAFT (JSON):
${JSON.stringify(draft).slice(0, 30000)}

${JSON_RULES} Use exactly this shape:
{ "score": number (0-100 overall quality), "summary": string, "issues": [ { "location": string (e.g. "Question 4" or "Task 2"), "severity": "high" | "medium" | "low", "problem": string, "suggestion": string } ] }`;
