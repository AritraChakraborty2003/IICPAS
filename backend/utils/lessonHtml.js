// Builds lesson HTML from the structured lesson JSON produced by the AI.
// The markup matches the editor's block library (client CourseEditor/blocks.js)
// so quizzes, FAQs and exercises are interactive for students and can be
// re-edited (double-click) in the editor.
import { markdownToHtml, sanitizeHtml } from "./aiText.js";

const esc = (s = "") =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const str = (v, max = 2000) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const arr = (v, max = 20) => (Array.isArray(v) ? v : []).slice(0, max);
const md = (text = "") => sanitizeHtml(markdownToHtml(String(text || "")));
const enc = (cfg) => encodeURIComponent(JSON.stringify(cfg));
const LETTERS = "ABCDEFGH";

const iaWrap = (type, cfg, inner) =>
  `<div class="ce-ia ce-${type}" contenteditable="false" data-ce-block="${type}" data-ce-config="${enc(cfg)}">${inner}</div><p><br></p>`;
const iaHead = (icon, label, title) =>
  `<div class="ce-ia-head"><span class="ce-ia-badge">${icon} ${esc(label)}</span>${title ? `<span class="ce-ia-title">${esc(title)}</span>` : ""}</div>`;

const CALLOUTS = {
  tip: ["✅", "Practical Tip"],
  example: ["💡", "Example"],
  warning: ["⚠️", "Watch out"],
  note: ["📝", "Note"],
  important: ["❗", "Important"],
};

const callout = (kind, bodyHtml) => {
  const [icon, label] = CALLOUTS[kind] || CALLOUTS.note;
  return `<div class="ce-box ce-box-${CALLOUTS[kind] ? kind : "note"}"><p class="ce-box-title">${icon} ${label}</p>${bodyHtml}</div>`;
};

const visualHtml = (v) => {
  if (!v || typeof v !== "object") return "";
  if (v.type === "flow") {
    const steps = arr(v.steps, 6)
      .map((s) => ({ label: str(s?.label, 60), caption: str(s?.caption, 80) }))
      .filter((s) => s.label);
    if (steps.length < 2) return "";
    return `<div class="ce-info ce-info-process">${steps
      .map((s) => `<div class="ce-info-item"><p><strong>${esc(s.label)}</strong></p>${s.caption ? `<p class="ce-info-cap">${esc(s.caption)}</p>` : ""}</div>`)
      .join('<span class="ce-info-arrow">➜</span>')}</div>${v.caption ? `<p class="ce-visual-caption">${esc(str(v.caption, 200))}</p>` : ""}`;
  }
  if (v.type === "compare") {
    const card = (c, hi) =>
      c?.title || c?.text
        ? `<div class="ce-compare-card${hi ? " ce-compare-highlight" : ""}"><p class="ce-compare-title">${esc(str(c.title, 80))}</p>${md(c.text)}</div>`
        : "";
    const left = card(v.left, false);
    const right = card(v.right, true);
    if (!left || !right) return "";
    return `<div class="ce-compare">${left}${right}</div>${v.caption ? `<p class="ce-visual-caption">${esc(str(v.caption, 200))}</p>` : ""}`;
  }
  if (v.type === "callout") return callout(String(v.kind || "note").toLowerCase(), md(v.text));
  return "";
};

const quizHtml = (quiz) => {
  const qs = arr(quiz, 10)
    .map((q) => {
      const options = arr(q?.options, 6).map((o) => str(o, 300)).filter(Boolean);
      let answer = Number.isInteger(q?.answer) ? q.answer : parseInt(q?.answer, 10);
      if (!Number.isInteger(answer)) {
        const letter = /^[A-F]$/i.exec(String(q?.answer || "").trim());
        answer = letter ? letter[0].toUpperCase().charCodeAt(0) - 65 : -1;
      }
      return { question: str(q?.question, 600), options, answer, explanation: str(q?.explanation, 600) };
    })
    .filter((q) => q.question && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length);
  if (!qs.length) return "";
  const text = qs
    .map((q) => `Q: ${q.question}\n${q.options.map((o, i) => `${i === q.answer ? "*" : "-"} ${o}`).join("\n")}${q.explanation ? `\n> ${q.explanation}` : ""}`)
    .join("\n\n");
  const items = qs
    .map(
      (q, n) =>
        `<div class="ce-quiz-q" data-ce-multi="0"><p class="ce-q"><span class="ce-q-num">${n + 1}.</span> ${esc(q.question)}</p><div class="ce-opts">${q.options
          .map(
            (o, i) =>
              `<button type="button" class="ce-opt" data-ce-action="pick-opt" data-correct="${i === q.answer ? 1 : 0}"><span class="ce-opt-key">${LETTERS[i]}</span><span>${esc(o)}</span></button>`
          )
          .join("")}</div><div class="ce-feedback" hidden><strong class="ce-feedback-verdict"></strong>${q.explanation ? `<span> ${esc(q.explanation)}</span>` : ""}</div></div>`
    )
    .join("");
  const title = "Check your understanding";
  return iaWrap(
    "quiz",
    { title, questions: text },
    `${iaHead("📝", "Knowledge Check", title)}${items}<div class="ce-ia-actions"><button type="button" class="ce-btn" data-ce-action="submit-quiz">Submit answers</button><button type="button" class="ce-btn-link" data-ce-action="reset">Retake</button><span class="ce-score" hidden></span></div>`
  );
};

const faqHtml = (faqs) => {
  const items = arr(faqs, 8)
    .map((f) => [str(f?.question, 300), str(f?.answer, 1200)])
    .filter(([q, a]) => q && a);
  if (!items.length) return "";
  const cfg = { items: items.map(([q, a]) => `${q.replace(/\|/g, "/")} | ${a.replace(/\|/g, "/")}`).join("\n") };
  return `<h2>Frequently Asked Questions</h2><div class="ce-accordion" data-ce-block="accordion" data-ce-config="${enc(cfg)}">${items
    .map(([q, a]) => `<details class="ce-acc-item"><summary>${esc(q)}</summary><div class="ce-acc-body"><p>${esc(a)}</p></div></details>`)
    .join("")}</div><p><br></p>`;
};

const practiceHtml = (p) => {
  if (!p || typeof p !== "object" || !str(p.task)) return "";
  const cfg = {
    title: str(p.title, 120) || "Try it yourself",
    task: str(p.task, 2000),
    steps: arr(p.steps, 10).map((s) => str(s, 300)).filter(Boolean).join("\n"),
    solution: str(p.solution, 3000),
  };
  const steps = cfg.steps ? `<ol>${cfg.steps.split("\n").map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : "";
  const solution = cfg.solution
    ? `<button type="button" class="ce-btn" data-ce-action="reveal">Show model answer</button><div class="ce-reveal-body" hidden><p>${esc(cfg.solution)}</p></div>`
    : "";
  return iaWrap("exercise", cfg, `${iaHead("🛠️", "Practical exercise", cfg.title)}<p>${esc(cfg.task)}</p>${steps}${solution}`);
};

const cleanSeo = (seo = {}) => ({
  seoTitle: str(seo.seoTitle || seo.title, 70),
  metaDescription: str(seo.metaDescription || seo.description, 170),
  slug: str(seo.slug, 80)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, ""),
  focusKeyword: str(seo.focusKeyword, 80),
  secondaryKeywords: arr(seo.secondaryKeywords, 8).map((k) => str(k, 60)).filter(Boolean),
});

/** Lesson JSON -> { html, title, seo, verifyItems, imageAltTexts, internalLinks } or null */
export const buildLessonFromJson = (data) => {
  const root = data?.lesson || data;
  if (!root || typeof root !== "object") return null;
  const sections = arr(root.sections, 10).filter((s) => str(s?.heading) || str(s?.body));
  if (!sections.length && !str(root.intro)) return null;

  const parts = [];
  if (str(root.intro)) parts.push(md(root.intro));

  const objectives = arr(root.learningObjectives, 8).map((o) => str(o, 300)).filter(Boolean);
  if (objectives.length) {
    parts.push(
      `<div class="ce-box ce-box-info ce-objectives"><p class="ce-box-title">🎯 Learning objectives</p><ul>${objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></div>`
    );
  }

  sections.forEach((s, i) => {
    const heading = str(s.heading, 160).replace(/^\d+[.)]\s*/, "");
    if (heading) parts.push(`<h2>${i + 1}. ${esc(heading)}</h2>`);
    if (str(s.body)) parts.push(md(s.body));
    const v = visualHtml(s.visual);
    if (v) parts.push(v);
  });

  const practice = practiceHtml(root.practice);
  if (practice) parts.push(`<h2>Practice Exercise</h2>${practice}`);

  const takeaways = arr(root.keyTakeaways, 8).map((t) => str(t, 300)).filter(Boolean);
  if (takeaways.length) {
    parts.push(`<h2>Key Takeaways</h2><ul>${takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`);
  }

  const quiz = quizHtml(root.quiz);
  if (quiz) parts.push(`<h2>Quick Knowledge Check</h2>${quiz}`);

  const faqs = faqHtml(root.faqs);
  if (faqs) parts.push(faqs);

  const html = parts.join("\n").trim();
  if (!html) return null;

  return {
    html,
    title: str(root.title, 160),
    seo: cleanSeo(root.seo || {}),
    verifyItems: arr(root.verifyItems, 20)
      .map((v) => (typeof v === "string" ? { item: str(v, 300), source: "" } : { item: str(v?.item, 300), source: str(v?.source, 200) }))
      .filter((v) => v.item),
    imageAltTexts: arr(root.imageAltTexts, 10).map((a) => str(typeof a === "string" ? a : a?.altText || a?.text, 200)).filter(Boolean),
    internalLinks: arr(root.internalLinks, 10)
      .map((l) => (typeof l === "string" ? { title: str(l, 160), reason: "" } : { title: str(l?.title || l?.topic, 160), reason: str(l?.reason, 200) }))
      .filter((l) => l.title),
  };
};
