// Prompt builders for every AI task in Course Management. Each prompt asks for
// a predictable output format (clean HTML or strict JSON) so results can be
// validated before they reach the editor.
import { EDUCATIONAL_TITLE_STYLE } from "./educationalStyle.js";

const HTML_RULES = `Output rules:
- Return ONLY the body content as clean HTML (no <html>, <head>, <body>, no Markdown, no code fences, no commentary before or after).
- Use <h2> and <h3> for headings, <p> for paragraphs, <ul>/<ol>/<li> for lists, <table> with <thead>/<tbody> for tabular data, <strong>/<em> for emphasis and <blockquote> for notes.
- Do not repeat the main title as a heading at the very top.
- Use Indian context (INR, Indian tax laws, GST/Income Tax/Companies Act, Indian businesses) where relevant. Do not invent section numbers, rates, dates or statistics you are unsure of; describe them generally instead.`;

const JSON_RULES = `Return ONLY valid JSON (no Markdown, no code fences, no commentary). Use double quotes for all keys and strings.`;

const list = (items) => (items || []).filter(Boolean).map((x) => `- ${x}`).join("\n");

const courseContext = (c = {}) => `Course title: ${c.courseTitle || ""}
Course category: ${c.category || ""}
Course description: ${c.courseDescription || ""}
Target audience: ${c.targetAudience || "Commerce students and working professionals in India"}
Course level: ${c.level || "Beginner"}
${c.learningObjectives ? `Course learning objectives:\n${c.learningObjectives}` : ""}
${c.instructions ? `Additional instructions from the admin:\n${c.instructions}` : ""}`;

// Title style for every AI-generated chapter and lesson
const TITLE_RULES = `Title rules (apply to every chapter and lesson title):
- Learner-friendly first: short, clear and easy to scan in a course menu - a student should instantly know what they will learn.
- SEO-friendly: include the main subject keyword a learner would search for (e.g. "Power BI", "Power Query", "DAX", "GST", "Tally") where it fits naturally - do not stuff keywords.
- 2-7 words, ideally under 50 characters. Use plain words over jargon; action/skill wording works well ("Getting Data into Power BI", "Building Interactive Dashboards").
- Professional tone suitable for an education institute. Use Title Case.
- No numbering ("Chapter 1", "Lesson 2", "Module"), no emojis, no exclamation marks, no hype or clickbait, no colons.
- Every title must be unique within the course and must not simply repeat the course name.
- Good examples: "Introduction to Power BI", "Getting Data into Power BI", "Transforming Data with Power Query", "Data Modelling", "DAX Fundamentals", "Building Interactive Reports", "Publishing and Sharing Dashboards", "GST Return Filing Step by Step".

${EDUCATIONAL_TITLE_STYLE}`;

// Practical-first teaching approach used for outlines and lessons
const PRACTICAL_APPROACH = `Teaching approach: practical first. Keep theory short and only as much as needed to do the task; most of the learning should come from hands-on steps, real examples, practice exercises and mini projects using realistic Indian business data. Progress from basics to job-ready skills, ending with real-world application.`;

const TOPIC_JSON = `{ "title": string, "description": string (1-2 short sentences), "objectives": [string, string] }`;

export const MAX_CHAPTERS = 10;
export const MAX_TOPICS = 10;
const chapterCount = (n) =>
  n > 0 ? `exactly ${Math.min(n, MAX_CHAPTERS)} chapters` : `the right number of chapters for this course - usually 6 to 9, never more than ${MAX_CHAPTERS}`;
const topicCount = (n) =>
  n > 0 ? `exactly ${Math.min(n, MAX_TOPICS)} topics` : `usually 6 to 9 topics (never more than ${MAX_TOPICS}; fewer only if the chapter is genuinely small)`;
const CHAPTER_JSON = `{ "title": string, "description": string (2-3 sentences), "objectives": [string, ...], "topics": [ ${TOPIC_JSON}, ... ] }`;

// ---------------------------------------------------------------------------
// Course outline (chapters + lessons)
// ---------------------------------------------------------------------------
export const buildStructurePrompt = (c) => `Design the course structure for IICPA Institute: divide the course into chapters, and each chapter into topics (lessons).

${PRACTICAL_APPROACH}

${courseContext(c)}

${c.existingChapterTitles?.length ? `The course ALREADY HAS these chapters (keep them, do not repeat or rename them):
${list(c.existingChapterTitles)}
Create only the NEW chapters needed to complete the course, so the total stays at most ${MAX_CHAPTERS} chapters.` : ""}

Base the structure on the course title and description above, so it covers what the course page promises - no more, no less.
Create ${chapterCount(c.totalChapters)}, each with ${topicCount(c.lessonsPerChapter)}, in a logical order from fundamentals to practical, job-ready application. Each chapter and topic must cover something distinct - no overlap.

${TITLE_RULES}

${JSON_RULES} Use exactly this shape:
{ "chapters": [ ${CHAPTER_JSON} ] }`;

export const buildChapterPrompt = (c, { chapterNumber, currentTitle, otherChapterTitles = [] }) => `Design one chapter of an IICPA Institute course.

${PRACTICAL_APPROACH}

${courseContext(c)}

The course has these other chapters (do not duplicate them):
${list(otherChapterTitles) || "(none)"}

Write chapter ${chapterNumber}${currentTitle ? ` (currently titled "${currentTitle}" - improve or replace it)` : ""} with ${topicCount(c.lessonsPerChapter)}.

${TITLE_RULES}

${JSON_RULES} Use exactly this shape:
${CHAPTER_JSON}`;

// Topics for an existing chapter (AI Topic Generator)
export const buildTopicsPrompt = (c, { chapterTitle, chapterDescription, existingTopicTitles = [], otherChapterTitles = [], count = 0 }) => `Divide one chapter of an IICPA Institute course into topics (lessons).

${PRACTICAL_APPROACH}

${courseContext(c)}

Chapter: ${chapterTitle}
${chapterDescription ? `Chapter description: ${chapterDescription}` : ""}
Other chapters of the course (their content must NOT be repeated here):
${list(otherChapterTitles) || "(none)"}
${existingTopicTitles.length ? `This chapter ALREADY HAS these topics (do not repeat them; add only what is missing):
${list(existingTopicTitles)}` : ""}

Create ${topicCount(count)} that together teach this chapter completely, in a logical learning order. Each topic must be distinct and small enough for one 10-20 minute lesson.

${TITLE_RULES}

${JSON_RULES} Use exactly this shape:
{ "topics": [ ${TOPIC_JSON} ] }`;

export const buildOutlineTopicPrompt = (c, { chapterTitle, currentTitle, otherTopicTitles = [] }) => `Design one topic (lesson) of an IICPA Institute course.

${courseContext(c)}

Chapter: ${chapterTitle}
Other lessons in this chapter (do not duplicate them):
${list(otherTopicTitles) || "(none)"}

Write one lesson for this chapter${currentTitle ? ` (currently titled "${currentTitle}" - improve or replace it)` : ""}.

${TITLE_RULES}

${JSON_RULES} Use exactly this shape:
${TOPIC_JSON}`;

// ---------------------------------------------------------------------------
// Create Course form auto-fill
// ---------------------------------------------------------------------------
export const COURSE_DETAIL_FIELDS = {
  category: 'string - pick the best match from the allowed categories list (exact spelling); if none fits, suggest a short new category name',
  slug: "string - lowercase URL slug using hyphens, max 60 characters",
  duration: 'string - realistic suggested duration, e.g. "8 weeks (40 hours)"',
  level: 'string - one of "Beginner", "Intermediate", "Advanced"',
  description:
    "string of HTML - the full course page description with these <h2> sections in order: Course Overview; Course Objectives; What You Will Learn (detailed bullet list); Course Highlights; Who Should Enroll (target audience); Requirements & Prerequisites; Learning Outcomes; Benefits of the Course; Course Level & Duration. 450-800 words.",
  examCert:
    "string of HTML - Exam and Certification details: assessment pattern, passing criteria, certificate details and how the certification helps careers. 120-250 words.",
  caseStudy:
    "string of HTML - a short description of the practical case studies covered in the course (3-5 case studies, each with a title in <strong> and 1-2 sentences). 120-250 words.",
  seoTitle: "string - SEO title, max 60 characters, includes the main keyword",
  seoDescription: "string - SEO meta description, plain text, 140-160 characters, includes a call to action",
  seoKeywords: "string - 10-15 comma-separated search keywords",
  metaTitle: "string - alternative meta title, max 60 characters",
  metaDescription: "string - alternative meta description, plain text, 140-160 characters",
  metaKeywords: "string - 8-12 comma-separated long-tail keywords people search for",
};

export const buildCourseDetailsPrompt = ({ title, categories = [], category, level, instructions, existing = {}, fields }) => {
  const keys = fields?.length ? fields : Object.keys(COURSE_DETAIL_FIELDS);
  const existingLines = Object.entries(existing)
    .filter(([, v]) => String(v || "").trim())
    .map(([k, v]) => `- ${k}: ${String(v).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600)}`);
  return `You are a senior course designer and SEO copywriter for IICPA Institute, an Indian institute that trains students and professionals in accounting, taxation (GST, Income Tax, TDS), finance, business, HR, payroll and business technology tools.

Generate the course page details for the course titled: "${title}".
The content must be specific to this exact course topic, professional, student-focused and SEO-friendly - not generic filler.

Allowed categories: ${categories.length ? categories.join(", ") : "(none provided)"}
${category ? `Category chosen by the admin: ${category}` : ""}
${level ? `Course level chosen by the admin: ${level}` : ""}
${existingLines.length ? `Details the admin has already written (stay consistent with them):\n${existingLines.join("\n")}` : ""}
${instructions ? `Additional instructions from the admin:\n${instructions}` : ""}

Return a JSON object containing ONLY these keys:
${keys.map((k) => `"${k}": ${COURSE_DETAIL_FIELDS[k]}`).join("\n")}

For HTML values use only <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em> tags, with no inline styles. Use Indian context where relevant.

${JSON_RULES}`;
};

// ---------------------------------------------------------------------------
// Full content for a topic / case study / assignment / course description
// ---------------------------------------------------------------------------
export const CONTENT_KINDS = {
  topic: {
    label: "lesson (topic)",
    sections: `Write a concise, PRACTICAL lesson - less theory, more doing. Use these sections (as <h2> headings):
1. Overview - 2-3 sentences: what the learner will be able to do after this lesson and why it matters at work
2. Key Concepts - only the essential ideas, as short bullet points (no long paragraphs)
3. Step-by-Step Practical - the main part: numbered hands-on steps the learner follows (menus, buttons, formulas, entries), with a realistic Indian business example and figures in INR; use <h3> for each sub-task
4. Worked Example - one complete real-world example with its solution or result (use a <table> for data where useful)
5. Pro Tips & Common Mistakes - 3-5 short bullets; put the most important warning in a <blockquote>
6. Practice Exercise - a small task for the learner with the data needed, and the expected result
7. Quick Recap - 3-5 key takeaways as bullets
8. Knowledge Check - 3 multiple-choice questions as an <ol>; for each, options A-D, then "Correct answer: X" with a one-line explanation
Keep sentences short and student-friendly. Length: 700-1100 words.`,
  },
  "case-study": {
    label: "case study",
    sections: `Write a complete, realistic case study set in an Indian business with these sections (as <h2> headings):
1. Introduction
2. Business Background - company profile, industry, size, location (a fictional but realistic company)
3. Problem Statement
4. Business Scenario - what happened, in narrative form
5. Relevant Facts and Data - present key figures in a <table>
6. Key Challenges - bullet list
7. Analysis - apply the relevant concepts, laws and calculations step by step
8. Practical Application
9. Possible Solutions - compare 2-3 options, ideally in a table with pros and cons
10. Step-by-Step Approach - numbered list
11. Conclusion
12. Learning Outcomes - bullet list
13. Discussion Questions - 4-6 questions as a numbered list
Length: 1200-1800 words.`,
  },
  assignment: {
    label: "assignment",
    sections: `Write a complete practical assignment with these sections (as <h2> headings):
1. Assignment Introduction
2. Objective
3. Instructions - numbered list
4. Tasks - 3-5 clearly numbered tasks, each with what to do and expected output
5. Practical Problems - 2-4 problems with realistic data in INR (use <table> for data)
6. Questions - 5-8 short-answer / long-answer questions
7. Submission Guidelines - format, file type, naming, deadline placeholder
8. Evaluation Criteria - a <table> rubric with criteria, description and marks (total 100)
9. Expected Learning Outcomes - bullet list
10. Reference Material - relevant Indian acts, official portals or standards (no made-up URLs)
Length: 900-1500 words. Do NOT include the solutions.`,
  },
  "course-description": {
    label: "course description",
    sections: `Write the course page description with these <h2> sections: Course Overview; Course Objectives; What You Will Learn; Course Highlights; Who Should Enroll; Requirements & Prerequisites; Learning Outcomes; Benefits of the Course. 500-800 words.`,
  },
  "exam-cert": {
    label: "exam and certification details",
    sections: `Describe the assessment pattern, passing criteria, certificate details and career value of the certificate. 150-300 words.`,
  },
  "chapter-description": {
    label: "chapter description",
    sections: `Write a short chapter introduction (1-2 paragraphs) followed by "What you will learn in this chapter" as a bullet list. 150-250 words.`,
  },
};

const contentContext = (x) => `Course: ${x.courseTitle || "(not specified)"}
${x.category ? `Course category: ${x.category}` : ""}
${x.courseDescription ? `Course description: ${x.courseDescription}` : ""}
${x.chapterTitle ? `Chapter: ${x.chapterTitle}` : ""}
${x.chapterDescription ? `Chapter description: ${x.chapterDescription}` : ""}
Learning level: ${x.level || "Beginner"}
Target audience: ${x.audience || "Commerce students and working professionals in India"}
${x.siblingTitles?.length ? `Other topics already covered in this course - do NOT repeat their content, refer to them only briefly if needed:\n${list(x.siblingTitles)}` : ""}
${x.existingContent ? `Existing content of this item (improve and build on it rather than contradict it):\n${x.existingContent}` : ""}
${x.instructions ? `Additional instructions from the admin (follow closely):\n${x.instructions}` : ""}`;

export const buildContentPrompt = (kind, x) => {
  const k = CONTENT_KINDS[kind] || CONTENT_KINDS.topic;
  return `You are an expert faculty member and instructional designer at IICPA Institute, an Indian institute for accounting, taxation, finance, business and technology education.

Write the ${k.label} titled: "${x.title}".

${contentContext(x)}

${k.sections}

The content must be accurate, educational, specific to "${x.title}" and suitable for the stated level.

${HTML_RULES}`;
};

// ---------------------------------------------------------------------------
// Full lesson content (AI content generator in the topic editor) - JSON
// that the backend turns into interactive lesson HTML (see utils/lessonHtml.js)
// ---------------------------------------------------------------------------
export const buildLessonPrompt = (x) => `Write the complete lesson for the topic: "${x.title}".

${contentContext(x)}

STYLE (follow closely)
- Practical and to the point, like a well-designed online training lesson: a short intro, a learning-objectives box, then 4-6 numbered sections. Less theory, more doing.
- Each section teaches one idea with a realistic Indian example, step-by-step instructions where relevant (menus, buttons, formulas, entries), and short paragraphs or lists. Use a Markdown table where data helps.
- Give 2-3 sections a visual: a "flow" (a process or chain, 3-5 steps, each with a short caption) or a "compare" (two side-by-side cards, e.g. old vs new, wrong vs right, manual vs automated). Use "callout" for an important tip, example or warning.
- Keep it concise: about 700-1,000 words in total (all sections, practice, quiz and FAQs together). Prefer short bullet points over paragraphs. Cover only this topic - no repetition of other topics of the course.

Return JSON exactly in this shape:
{
  "title": string,
  "intro": string (Markdown, 2-4 sentences; focus keyword in the first 100 words; bold the key term),
  "learningObjectives": [string, ...] (3-5, each starting with an action verb),
  "sections": [
    {
      "heading": string (no number - numbering is added automatically),
      "body": string (Markdown; you may use ### sub-headings, lists and tables),
      "visual": null
        | { "type": "flow", "steps": [ { "label": string, "caption": string } ], "caption": string }
        | { "type": "compare", "left": { "title": string, "text": string }, "right": { "title": string, "text": string }, "caption": string }
        | { "type": "callout", "kind": "tip" | "example" | "warning" | "note", "text": string }
    }
  ] (4-5 sections),
  "practice": { "title": string, "task": string, "steps": [string, ...], "solution": string },
  "keyTakeaways": [string, ...] (3-5),
  "quiz": [ { "question": string, "options": [string, string, string, string], "answer": number (0-based index of the correct option), "explanation": string } ] (exactly 3),
  "faqs": [ { "question": string, "answer": string (plain text, 1-3 sentences) } ] (3-5),
  "seo": { "seoTitle": string, "metaDescription": string, "slug": string, "focusKeyword": string, "secondaryKeywords": [string, ...] },
  "imageAltTexts": [string, ...] (2-4 suggestions),
  "internalLinks": [ { "title": string (a related IICPA topic), "reason": string } ] (2-4),
  "verifyItems": [ { "item": string (a rate, limit, due date or provision to double-check), "source": string (official website) } ]
}`;

// ---------------------------------------------------------------------------
// Editor AI tab actions (work on the selected text or the whole document)
// ---------------------------------------------------------------------------
export const ASSIST_ACTIONS = {
  generate: { label: "Generate Content", json: false, needsText: false, task: "Write new, detailed educational content for the heading/title given below. If text is selected, treat it as the heading or brief to expand into a full section." },
  continue: { label: "Continue Writing", json: false, needsText: true, task: "Continue writing from where the given text ends. Return ONLY the new continuation (2-4 paragraphs or an appropriate section), not the original text." },
  rewrite: { label: "Rewrite", json: false, needsText: true, task: "Rewrite the given text with fresh wording while keeping the meaning, facts and structure." },
  grammar: { label: "Improve Grammar", json: false, needsText: true, task: "Correct spelling, grammar and punctuation in the given text. Keep wording, meaning and formatting otherwise unchanged." },
  professional: { label: "Make Professional", json: false, needsText: true, task: "Rewrite the given text in a polished, professional tone suitable for a professional education institute." },
  simplify: { label: "Simplify Language", json: false, needsText: true, task: "Rewrite the given text in simple, student-friendly language with short sentences, explaining any jargon." },
  expand: { label: "Expand Content", json: false, needsText: true, task: "Expand the given text with more explanation, detail and an example, keeping its structure." },
  summarize: { label: "Summarize", json: false, needsText: true, task: "Summarize the given text into a short paragraph followed by 3-6 key bullet points." },
  tone: { label: "Change Tone", json: false, needsText: true, task: "Rewrite the given text in the requested tone, keeping the meaning and facts." },
  headings: { label: "Generate Headings", json: false, needsText: true, task: "Restructure the given text by adding clear <h2>/<h3> headings and splitting it into logical sections. Keep all the original information." },
  bullets: { label: "Generate Bullet Points", json: false, needsText: true, task: "Convert the given text into well-organised bullet points (use nested lists where helpful)." },
  examples: { label: "Generate Examples", json: false, needsText: false, task: "Write 2-3 practical worked examples (with figures in INR and step-by-step solutions) that illustrate the given text/topic." },
  "case-study": { label: "Generate Case Study", json: false, needsText: false, task: "Write a short practical case study (background, problem, data table, analysis, solution, 3 discussion questions) based on the given text/topic." },
  objectives: { label: "Generate Learning Objectives", json: false, needsText: false, task: 'Write an <h3>Learning Objectives</h3> heading followed by 4-6 measurable learning objectives (starting with action verbs such as "Explain", "Calculate", "Apply") for the given text/topic.' },
  table: { label: "Generate Table", json: false, needsText: false, task: "Present the key information of the given text/topic as a well-structured HTML <table> with a <thead> header row (add a one-line <p> caption before it)." },
  translate: { label: "Translate", json: false, needsText: true, task: "Translate the given text into the requested language. Keep HTML structure, numbers and technical/legal terms (e.g. GST, ITC, TDS) accurate." },
  seo: { label: "SEO Optimize", json: false, needsText: true, task: "Improve the given text for search engines: clear headings, natural use of the main keywords, short paragraphs and a concluding summary. Do not keyword-stuff and keep all facts." },
  mcqs: {
    label: "Generate MCQs",
    json: true,
    needsText: false,
    task: `Write multiple-choice questions that test understanding of the given text/topic. Return JSON exactly in this shape:
{ "questions": [ { "question": string, "options": [string, string, string, string], "answer": number (0-based index of the correct option), "explanation": string } ] }`,
  },
  faqs: {
    label: "Generate FAQs",
    json: true,
    needsText: false,
    task: `Write frequently asked questions (with clear, accurate answers of 2-4 sentences) about the given text/topic. Return JSON exactly in this shape:
{ "faqs": [ { "question": string, "answer": string } ] }`,
  },
  flashcards: {
    label: "Generate Flashcards",
    json: true,
    needsText: false,
    task: `Write revision flashcards (term or question on the front, concise answer on the back) for the given text/topic. Return JSON exactly in this shape:
{ "cards": [ { "front": string, "back": string } ] }`,
  },
};

export const buildAssistPrompt = (action, x) => {
  const a = ASSIST_ACTIONS[action];
  const count = x.count ? `Number of items to write: ${x.count}.` : "";
  return `You are an expert editor and faculty member at IICPA Institute (Indian accounting, taxation, finance, business and technology education).

Task: ${a.task}
${action === "tone" ? `Requested tone: ${x.tone || "Professional"}` : ""}
${action === "translate" ? `Target language: ${x.language || "Hindi"}` : ""}
${count}

Context:
${contentContext(x)}
${x.documentTitle ? `Document title: ${x.documentTitle}` : ""}
${x.documentText ? `Surrounding document (for context only, do not rewrite it):\n${x.documentText}` : ""}

${x.text ? `Given text:\n"""\n${x.text}\n"""` : `Given topic: ${x.documentTitle || x.title || x.courseTitle}`}

${a.json ? JSON_RULES : HTML_RULES}`;
};

// ---------------------------------------------------------------------------
// Review tab: spelling, grammar, punctuation, readability, content suggestions
// ---------------------------------------------------------------------------
export const buildReviewPrompt = (x) => `You are a meticulous copy editor and instructional designer at IICPA Institute.

Review the educational content below for spelling, grammar, punctuation, clarity, readability and content quality.
${x.documentTitle ? `Title: ${x.documentTitle}` : ""}
${x.level ? `Learning level: ${x.level}` : ""}

Content:
"""
${x.text}
"""

Report at most 25 issues. "original" must be copied EXACTLY from the content (a short phrase, not a whole paragraph) so it can be found and replaced automatically.

${JSON_RULES} Use exactly this shape:
{
  "issues": [ { "type": "spelling" | "grammar" | "punctuation" | "style", "original": string, "suggestion": string, "explanation": string } ],
  "readability": { "level": string, "summary": string },
  "suggestions": [ string ]
}`;
