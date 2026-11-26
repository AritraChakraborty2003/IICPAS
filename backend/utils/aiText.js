// Helpers that turn raw AI output (from the n8n workflow) into clean HTML or
// validated JSON structures that can be stored safely.

const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const stripCodeFences = (text = "") => {
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n?```\s*$/);
  return fenced ? fenced[1].trim() : trimmed;
};

const looksLikeHtml = (text) =>
  /<(p|h[1-6]|ul|ol|li|table|div|strong|em|br|section|article|blockquote)\b[^>]*>/i.test(text);

const inlineMarkdown = (text) =>
  escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

// Small, dependency-free Markdown → HTML converter covering what LLMs emit:
// headings, paragraphs, bullet/numbered lists, tables, rules, bold/italic/links.
export const markdownToHtml = (md = "") => {
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let para = [];
  let list = null; // { tag, items }

  const flushPara = () => {
    if (para.length) out.push(`<p>${inlineMarkdown(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inlineMarkdown(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      flushList();
      const level = Math.min(Math.max(heading[1].length, 2), 4); // keep h1 for the page title
      out.push(`<h${level}>${inlineMarkdown(heading[2].replace(/#+\s*$/, ""))}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushPara();
      flushList();
      out.push("<hr />");
      continue;
    }

    // Table: header row followed by a |---|---| separator
    if (trimmed.startsWith("|") && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] || "")) {
      flushPara();
      flushList();
      const cells = (row) =>
        row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const header = cells(trimmed);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(cells(lines[i]));
        i += 1;
      }
      i -= 1;
      out.push(
        `<table><thead><tr>${header.map((h) => `<th>${inlineMarkdown(h)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inlineMarkdown(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`
      );
      continue;
    }

    const bullet = trimmed.match(/^[-*+•]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const tag = bullet ? "ul" : "ol";
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push((bullet || numbered)[1]);
      continue;
    }

    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  return out.join("\n");
};

// Remove anything executable; generated content is rendered with innerHTML.
export const sanitizeHtml = (html = "") =>
  String(html)
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"')
    .replace(/<\/?(html|head|body)\b[^>]*>/gi, "")
    .trim();

export const toCleanHtml = (raw = "") => {
  const text = stripCodeFences(raw);
  if (!text) return "";
  return sanitizeHtml(looksLikeHtml(text) ? text : markdownToHtml(text));
};

// Accepts JSON wrapped in prose or ``` fences and returns the parsed value.
export const parseJsonLoose = (raw) => {
  if (raw && typeof raw === "object") return raw;
  const text = stripCodeFences(String(raw || ""));
  try {
    return JSON.parse(text);
  } catch {
    // fall through
  }
  const start = text.search(/[[{]/);
  if (start === -1) return null;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  const end = text.lastIndexOf(close);
  if (end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

const str = (v, max = 400) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const strList = (v) =>
  (Array.isArray(v) ? v : typeof v === "string" ? v.split(/\n|;/) : [])
    .map((x) => str(typeof x === "object" ? x?.text || x?.objective || "" : x, 300))
    .filter(Boolean)
    .slice(0, 10);

export const normalizeOutlineTopic = (t) => {
  if (!t) return null;
  const title = str(typeof t === "string" ? t : t.title || t.name || t.lessonTitle || t.topicTitle, 200);
  if (!title) return null;
  return {
    title,
    description: str(t.description || t.summary || "", 1200),
    objectives: strList(t.objectives || t.learningObjectives || t.learning_objectives),
  };
};

export const normalizeOutlineChapter = (c) => {
  if (!c || typeof c !== "object") return null;
  const title = str(c.title || c.name || c.chapterTitle, 200);
  if (!title) return null;
  const rawTopics = c.topics || c.lessons || c.items || [];
  return {
    title,
    description: str(c.description || c.summary || "", 1500),
    objectives: strList(c.objectives || c.learningObjectives || c.learning_objectives),
    topics: (Array.isArray(rawTopics) ? rawTopics : []).map(normalizeOutlineTopic).filter(Boolean).slice(0, 10),
  };
};

export const normalizeStructure = (data) => {
  const root = Array.isArray(data) ? { chapters: data } : data || {};
  const chapters = root.chapters || root.course?.chapters || root.modules || [];
  return (Array.isArray(chapters) ? chapters : [])
    .map(normalizeOutlineChapter)
    .filter(Boolean)
    .slice(0, 10);
};

// ---------------------------------------------------------------------------
// Course Management AI responses
// ---------------------------------------------------------------------------
const plain = (v, max = 2000) =>
  String(v ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const COURSE_HTML_FIELDS = new Set(["description", "examCert", "caseStudy"]);
const COURSE_PLAIN_LIMITS = {
  category: 120,
  slug: 80,
  duration: 80,
  level: 30,
  seoTitle: 120,
  seoDescription: 400,
  seoKeywords: 800,
  metaTitle: 120,
  metaDescription: 400,
  metaKeywords: 800,
};

const toKeywordString = (v) => (Array.isArray(v) ? v.map((x) => plain(x, 80)).filter(Boolean).join(", ") : v);

export const slugify = (s = "") =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

// Keeps only known course fields, cleans HTML and plain-text values
export const normalizeCourseDetails = (data) => {
  const root = data?.course || data?.fields || data || {};
  if (typeof root !== "object" || Array.isArray(root)) return null;
  const out = {};
  for (const key of COURSE_HTML_FIELDS) {
    if (root[key] != null && String(root[key]).trim()) {
      const html = toCleanHtml(String(root[key]));
      if (html) out[key] = html;
    }
  }
  for (const [key, max] of Object.entries(COURSE_PLAIN_LIMITS)) {
    const raw = key.endsWith("Keywords") ? toKeywordString(root[key]) : root[key];
    const value = plain(raw, max);
    if (value) out[key] = value;
  }
  if (out.slug) out.slug = slugify(out.slug);
  if (out.level && !["Beginner", "Intermediate", "Advanced"].includes(out.level)) {
    const m = /begin|interm|advan/i.exec(out.level);
    out.level = m ? { begin: "Beginner", interm: "Intermediate", advan: "Advanced" }[m[0].toLowerCase()] : "";
    if (!out.level) delete out.level;
  }
  return Object.keys(out).length ? out : null;
};

const ISSUE_TYPES = new Set(["spelling", "grammar", "punctuation", "style"]);

export const normalizeReview = (data) => {
  if (!data || typeof data !== "object") return null;
  const issues = (Array.isArray(data.issues) ? data.issues : [])
    .map((i) => ({
      type: ISSUE_TYPES.has(String(i?.type).toLowerCase()) ? String(i.type).toLowerCase() : "style",
      original: plain(i?.original, 300),
      suggestion: plain(i?.suggestion, 300),
      explanation: plain(i?.explanation, 400),
    }))
    .filter((i) => i.original && i.original !== i.suggestion)
    .slice(0, 40);
  return {
    issues,
    readability: {
      level: plain(data.readability?.level, 80),
      summary: plain(data.readability?.summary, 800),
    },
    suggestions: (Array.isArray(data.suggestions) ? data.suggestions : []).map((s) => plain(s, 400)).filter(Boolean).slice(0, 12),
  };
};

// MCQs / FAQs / flashcards produced by the editor's AI tab
export const normalizeAssistJson = (data) => {
  if (!data || typeof data !== "object") return null;
  const root = Array.isArray(data) ? { items: data } : data;
  const questions = (root.questions || root.mcqs || [])
    .map((q) => {
      const options = (Array.isArray(q?.options) ? q.options : []).map((o) => plain(typeof o === "object" ? o?.text : o, 300)).filter(Boolean).slice(0, 6);
      let answer = Number.isInteger(q?.answer) ? q.answer : parseInt(q?.answer, 10);
      if (!Number.isInteger(answer)) {
        const letter = /^[A-F]$/i.exec(String(q?.answer || q?.correct || "").trim());
        answer = letter ? letter[0].toUpperCase().charCodeAt(0) - 65 : options.indexOf(plain(q?.answer || q?.correct, 300));
      }
      return { question: plain(q?.question, 600), options, answer, explanation: plain(q?.explanation, 600) };
    })
    .filter((q) => q.question && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length)
    .slice(0, 30);
  const faqs = (root.faqs || [])
    .map((f) => ({ question: plain(f?.question || f?.q, 400), answer: plain(f?.answer || f?.a, 1500) }))
    .filter((f) => f.question && f.answer)
    .slice(0, 30);
  const cards = (root.cards || root.flashcards || [])
    .map((c) => ({ front: plain(c?.front || c?.term || c?.question, 300), back: plain(c?.back || c?.definition || c?.answer, 800) }))
    .filter((c) => c.front && c.back)
    .slice(0, 40);
  if (!questions.length && !faqs.length && !cards.length) return null;
  return { questions, faqs, cards };
};
