// Block library of the Advanced Course Editor.
//
// Interactive blocks (MCQ, flashcards, tabs ...) are saved as plain HTML with
// their settings in `data-ce-config`, so they can be re-opened for editing in
// the editor (double-click) and are made interactive for students by
// InteractiveRuntime (event delegation, no per-page code needed).
import { esc, uid, isSafeUrl, formatBytes } from "./editorCore";

export const encodeConfig = (cfg) => encodeURIComponent(JSON.stringify(cfg || {}));
export const decodeConfig = (s) => {
  try {
    return JSON.parse(decodeURIComponent(s || ""));
  } catch {
    return null;
  }
};

const lines = (v) =>
  (Array.isArray(v) ? v : String(v || "").split("\n")).map((x) => String(x).trim()).filter(Boolean);

const pairs = (v) =>
  lines(v)
    .map((l) => {
      const i = l.indexOf("|");
      return i === -1 ? null : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
    .filter((p) => p && p[0] && p[1]);

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Avoid returning the original order for small lists
  if (a.length > 1 && a.every((x, i) => x === arr[i])) a.push(a.shift());
  return a;
};

const wrap = (type, cfg, inner, extraClass = "") =>
  `<div class="ce-ia ce-${type} ${extraClass}" contenteditable="false" data-ce-block="${type}" data-ce-config="${encodeConfig(cfg)}">${inner}</div><p><br></p>`;

const head = (icon, label, title) =>
  `<div class="ce-ia-head"><span class="ce-ia-badge">${icon} ${esc(label)}</span>${title ? `<span class="ce-ia-title">${esc(title)}</span>` : ""}</div>`;

const LETTERS = "ABCDEFGH";

const optionList = (options, correctSet, multi) =>
  `<div class="ce-opts">${options
    .map(
      (o, i) =>
        `<button type="button" class="ce-opt" data-ce-action="${multi ? "toggle-opt" : "pick-opt"}" data-correct="${correctSet.has(i) ? 1 : 0}"><span class="ce-opt-key">${LETTERS[i]}</span><span>${esc(o)}</span></button>`
    )
    .join("")}</div>`;

/**
 * Question text format shared by Knowledge Check and AI MCQs:
 *   Q: question text
 *   - wrong option
 *   * correct option
 *   > explanation (optional)
 */
export const parseQuestionText = (text = "") => {
  const out = [];
  let cur = null;
  for (const raw of String(text).split("\n")) {
    const l = raw.trim();
    if (!l) continue;
    if (/^q[:.)]/i.test(l)) {
      cur = { question: l.replace(/^q[:.)]\s*/i, ""), options: [], answers: [], explanation: "" };
      out.push(cur);
    } else if (cur && /^[-*]\s+/.test(l)) {
      if (l.startsWith("*")) cur.answers.push(cur.options.length);
      cur.options.push(l.replace(/^[-*]\s+/, ""));
    } else if (cur && l.startsWith(">")) {
      cur.explanation = l.replace(/^>\s*/, "");
    } else if (cur && !cur.options.length) {
      cur.question += ` ${l}`;
    }
  }
  return out.filter((q) => q.question && q.options.length >= 2 && q.answers.length);
};

export const questionsToText = (questions = []) =>
  questions
    .map(
      (q) =>
        `Q: ${q.question}\n${q.options.map((o, i) => `${i === q.answer || q.answers?.includes(i) ? "*" : "-"} ${o}`).join("\n")}${
          q.explanation ? `\n> ${q.explanation}` : ""
        }`
    )
    .join("\n\n");

const feedback = (explanation) =>
  `<div class="ce-feedback" hidden><strong class="ce-feedback-verdict"></strong>${explanation ? `<span> ${esc(explanation)}</span>` : ""}</div>`;

// ---------------------------------------------------------------------------
// Interactive blocks: { label, icon, group, fields, defaults, render(cfg) }
// ---------------------------------------------------------------------------
export const IA_BLOCKS = {
  mcq: {
    label: "MCQ",
    icon: "❓",
    group: "Questions",
    fields: [
      { name: "question", label: "Question", type: "textarea", required: true },
      { name: "options", label: "Options (one per line)", type: "lines", required: true },
      { name: "answer", label: "Correct option number", type: "number", min: 1, required: true },
      { name: "explanation", label: "Explanation shown after answering", type: "textarea" },
    ],
    defaults: { question: "", options: "Option A\nOption B\nOption C\nOption D", answer: 1, explanation: "" },
    validate: (c) => (lines(c.options).length < 2 ? "Add at least two options." : c.answer < 1 || c.answer > lines(c.options).length ? "Correct option number is out of range." : ""),
    render: (c) =>
      wrap(
        "mcq",
        c,
        `${head("❓", "Question")}<p class="ce-q">${esc(c.question)}</p>${optionList(lines(c.options), new Set([Number(c.answer) - 1]), false)}${feedback(c.explanation)}<button type="button" class="ce-btn-link" data-ce-action="reset">Try again</button>`,
        "ce-question"
      ),
  },
  truefalse: {
    label: "True / False",
    icon: "✔️",
    group: "Questions",
    fields: [
      { name: "statement", label: "Statement", type: "textarea", required: true },
      { name: "answer", label: "Correct answer", type: "select", options: ["True", "False"] },
      { name: "explanation", label: "Explanation", type: "textarea" },
    ],
    defaults: { statement: "", answer: "True", explanation: "" },
    render: (c) =>
      wrap(
        "truefalse",
        c,
        `${head("✔️", "True or False")}<p class="ce-q">${esc(c.statement)}</p>${optionList(["True", "False"], new Set([c.answer === "False" ? 1 : 0]), false)}${feedback(c.explanation)}<button type="button" class="ce-btn-link" data-ce-action="reset">Try again</button>`,
        "ce-question"
      ),
  },
  multiselect: {
    label: "Multi-select",
    icon: "☑️",
    group: "Questions",
    fields: [
      { name: "question", label: "Question", type: "textarea", required: true },
      { name: "options", label: "Options (one per line, start correct ones with *)", type: "lines", required: true },
      { name: "explanation", label: "Explanation", type: "textarea" },
    ],
    defaults: { question: "", options: "* Correct option\nWrong option\n* Another correct option\nWrong option", explanation: "" },
    validate: (c) => (!lines(c.options).some((o) => o.startsWith("*")) ? "Mark at least one correct option with *." : ""),
    render: (c) => {
      const raw = lines(c.options);
      const correct = new Set(raw.map((o, i) => (o.startsWith("*") ? i : -1)).filter((i) => i >= 0));
      const opts = raw.map((o) => o.replace(/^\*\s*/, ""));
      return wrap(
        "multiselect",
        c,
        `${head("☑️", "Select all that apply")}<p class="ce-q">${esc(c.question)}</p>${optionList(opts, correct, true)}<div class="ce-ia-actions"><button type="button" class="ce-btn" data-ce-action="check-multi">Check answer</button><button type="button" class="ce-btn-link" data-ce-action="reset">Reset</button></div>${feedback(c.explanation)}`,
        "ce-question"
      );
    },
  },
  quiz: {
    label: "Knowledge Check",
    icon: "📝",
    group: "Questions",
    fields: [
      { name: "title", label: "Title", type: "text" },
      {
        name: "questions",
        label: "Questions  (Q: question / - wrong option / * correct option / > explanation)",
        type: "textarea",
        rows: 12,
        required: true,
      },
    ],
    defaults: {
      title: "Check your understanding",
      questions: "Q: First question?\n- Wrong option\n* Correct option\n- Wrong option\n> Why it is correct\n\nQ: Second question?\n* Correct option\n- Wrong option",
    },
    validate: (c) => (!parseQuestionText(c.questions).length ? "Write at least one question with options and a correct answer (*)." : ""),
    render: (c) => {
      const qs = parseQuestionText(c.questions);
      const items = qs
        .map(
          (q, n) =>
            `<div class="ce-quiz-q" data-ce-multi="${q.answers.length > 1 ? 1 : 0}"><p class="ce-q"><span class="ce-q-num">${n + 1}.</span> ${esc(q.question)}</p>${optionList(q.options, new Set(q.answers), q.answers.length > 1)}${feedback(q.explanation)}</div>`
        )
        .join("");
      return wrap(
        "quiz",
        c,
        `${head("📝", "Knowledge Check", c.title)}${items}<div class="ce-ia-actions"><button type="button" class="ce-btn" data-ce-action="submit-quiz">Submit answers</button><button type="button" class="ce-btn-link" data-ce-action="reset">Retake</button><span class="ce-score" hidden></span></div>`
      );
    },
  },
  fill: {
    label: "Fill in the Blanks",
    icon: "✏️",
    group: "Practice",
    fields: [
      { name: "instructions", label: "Instructions", type: "text" },
      { name: "text", label: "Text - wrap each answer in [square brackets]; alternatives with | e.g. [GST|Goods and Services Tax]", type: "textarea", rows: 6, required: true },
    ],
    defaults: { instructions: "Fill in the blanks.", text: "The full form of GST is [Goods and Services Tax]." },
    validate: (c) => (!/\[[^\]]+\]/.test(c.text || "") ? "Put at least one answer in [square brackets]." : ""),
    render: (c) => {
      const body = esc(c.text).replace(/\[([^\]]+)\]/g, (_, ans) => {
        const size = Math.max(6, Math.min(30, ans.split("|")[0].length + 2));
        return `<input type="text" class="ce-blank" size="${size}" data-answer="${ans}" aria-label="blank" autocomplete="off">`;
      });
      return wrap(
        "fill",
        c,
        `${head("✏️", "Fill in the blanks", c.instructions)}<p class="ce-fill-text">${body.replace(/\n/g, "<br>")}</p><div class="ce-ia-actions"><button type="button" class="ce-btn" data-ce-action="check-fill">Check</button><button type="button" class="ce-btn-link" data-ce-action="show-fill">Show answers</button><button type="button" class="ce-btn-link" data-ce-action="reset">Reset</button><span class="ce-score" hidden></span></div>`
      );
    },
  },
  match: {
    label: "Match the Following",
    icon: "🔗",
    group: "Practice",
    fields: [
      { name: "instructions", label: "Instructions", type: "text" },
      { name: "pairs", label: "Pairs - one per line as  Term | Match", type: "textarea", rows: 6, required: true },
    ],
    defaults: { instructions: "Match each item with the correct answer.", pairs: "CGST | Central tax\nSGST | State tax\nIGST | Inter-state tax" },
    validate: (c) => (pairs(c.pairs).length < 2 ? "Add at least two pairs as  Term | Match." : ""),
    render: (c) => {
      const ps = pairs(c.pairs);
      const choices = shuffle(ps.map((p) => p[1]));
      const rows = ps
        .map(
          ([l, r]) =>
            `<div class="ce-match-row"><span class="ce-match-left">${esc(l)}</span><select class="ce-match-select" data-answer="${esc(r)}"><option value="">Choose…</option>${choices
              .map((x) => `<option value="${esc(x)}">${esc(x)}</option>`)
              .join("")}</select></div>`
        )
        .join("");
      return wrap(
        "match",
        c,
        `${head("🔗", "Match the following", c.instructions)}<div class="ce-match">${rows}</div><div class="ce-ia-actions"><button type="button" class="ce-btn" data-ce-action="check-match">Check</button><button type="button" class="ce-btn-link" data-ce-action="reset">Reset</button><span class="ce-score" hidden></span></div>`
      );
    },
  },
  order: {
    label: "Put in Order",
    icon: "🔢",
    group: "Practice",
    fields: [
      { name: "instructions", label: "Instructions", type: "text" },
      { name: "items", label: "Items in the CORRECT order (one per line) - students see them shuffled", type: "lines", required: true },
    ],
    defaults: { instructions: "Arrange the steps in the correct order.", items: "Step one\nStep two\nStep three\nStep four" },
    validate: (c) => (lines(c.items).length < 2 ? "Add at least two items." : ""),
    render: (c) => {
      const items = lines(c.items).map((t, i) => ({ t, i }));
      const li = shuffle(items)
        .map(
          ({ t, i }) =>
            `<li class="ce-order-item" data-pos="${i}"><span>${esc(t)}</span><span class="ce-order-ctrl"><button type="button" data-ce-action="move-up" aria-label="Move up">▲</button><button type="button" data-ce-action="move-down" aria-label="Move down">▼</button></span></li>`
        )
        .join("");
      return wrap(
        "order",
        c,
        `${head("🔢", "Put in order", c.instructions)}<ol class="ce-order">${li}</ol><div class="ce-ia-actions"><button type="button" class="ce-btn" data-ce-action="check-order">Check order</button><span class="ce-score" hidden></span></div>`
      );
    },
  },
  flip: {
    label: "Flip Cards",
    icon: "🃏",
    group: "Explore",
    fields: [{ name: "cards", label: "Cards - one per line as  Front | Back", type: "textarea", rows: 6, required: true }],
    defaults: { cards: "ITC | Input Tax Credit\nHSN | Harmonised System of Nomenclature\nRCM | Reverse Charge Mechanism" },
    validate: (c) => (!pairs(c.cards).length ? "Add at least one card as  Front | Back." : ""),
    render: (c) =>
      wrap(
        "flip",
        c,
        `${head("🃏", "Flip cards", "Click a card to flip it")}<div class="ce-flip-grid">${pairs(c.cards)
          .map(
            ([f, b]) =>
              `<button type="button" class="ce-flip-card" data-ce-action="flip"><span class="ce-flip-inner"><span class="ce-flip-front">${esc(f)}</span><span class="ce-flip-back">${esc(b)}</span></span></button>`
          )
          .join("")}</div>`
      ),
  },
  flashcards: {
    label: "Flashcards",
    icon: "🗂️",
    group: "Explore",
    fields: [
      { name: "title", label: "Deck title", type: "text" },
      { name: "cards", label: "Cards - one per line as  Question | Answer", type: "textarea", rows: 8, required: true },
    ],
    defaults: { title: "Revision flashcards", cards: "What is ITC? | Credit of GST paid on purchases\nWho pays tax under RCM? | The recipient of supply" },
    validate: (c) => (!pairs(c.cards).length ? "Add at least one card as  Question | Answer." : ""),
    render: (c) => {
      const cards = pairs(c.cards);
      return wrap(
        "flashcards",
        c,
        `${head("🗂️", "Flashcards", c.title)}<div class="ce-deck" data-index="0">${cards
          .map(
            ([f, b], i) =>
              `<div class="ce-deck-card" ${i ? "hidden" : ""}><div class="ce-deck-front">${esc(f)}</div><div class="ce-deck-back" hidden>${esc(b)}</div></div>`
          )
          .join("")}</div><div class="ce-ia-actions ce-deck-nav"><button type="button" class="ce-btn-link" data-ce-action="deck-prev">◀ Prev</button><button type="button" class="ce-btn" data-ce-action="deck-flip">Show answer</button><button type="button" class="ce-btn-link" data-ce-action="deck-next">Next ▶</button><span class="ce-deck-count">1 / ${cards.length}</span></div>`
      );
    },
  },
  accordion: {
    label: "Accordion",
    icon: "🔽",
    group: "Explore",
    fields: [{ name: "items", label: "Sections - one per line as  Heading | Content", type: "textarea", rows: 8, required: true }],
    defaults: { items: "What is GST? | GST is an indirect tax levied on the supply of goods and services.\nWho must register? | Businesses whose turnover exceeds the threshold limit." },
    validate: (c) => (!pairs(c.items).length ? "Add at least one section as  Heading | Content." : ""),
    // Native <details> works even where JavaScript is unavailable
    render: (c) =>
      `<div class="ce-accordion" data-ce-block="accordion" data-ce-config="${encodeConfig(c)}">${pairs(c.items)
        .map(([h, b]) => `<details class="ce-acc-item"><summary>${esc(h)}</summary><div class="ce-acc-body"><p>${esc(b)}</p></div></details>`)
        .join("")}</div><p><br></p>`,
  },
  tabs: {
    label: "Tabs",
    icon: "🗃️",
    group: "Explore",
    fields: [{ name: "items", label: "Tabs - one per line as  Tab title | Content", type: "textarea", rows: 8, required: true }],
    defaults: { items: "Overview | Write the overview here.\nExample | Write an example here.\nSummary | Write a summary here." },
    validate: (c) => (pairs(c.items).length < 2 ? "Add at least two tabs as  Title | Content." : ""),
    render: (c) => {
      const ps = pairs(c.items);
      const id = uid("tabs");
      return wrap(
        "tabs",
        c,
        `<div class="ce-tab-bar" role="tablist">${ps
          .map(([t], i) => `<button type="button" role="tab" class="ce-tab-btn ${i ? "" : "is-active"}" data-ce-action="tab" data-tab="${i}" aria-controls="${id}-${i}">${esc(t)}</button>`)
          .join("")}</div>${ps.map(([, b], i) => `<div class="ce-tab-panel" id="${id}-${i}" ${i ? "hidden" : ""}><p>${esc(b)}</p></div>`).join("")}`
      );
    },
  },
  reveal: {
    label: "Click to Reveal",
    icon: "👁️",
    group: "Explore",
    fields: [
      { name: "prompt", label: "Question / prompt", type: "textarea", required: true },
      { name: "answer", label: "Hidden answer", type: "textarea", required: true },
      { name: "button", label: "Button text", type: "text" },
    ],
    defaults: { prompt: "", answer: "", button: "Reveal answer" },
    render: (c) =>
      wrap(
        "reveal",
        c,
        `${head("👁️", "Think first")}<p class="ce-q">${esc(c.prompt)}</p><button type="button" class="ce-btn" data-ce-action="reveal">${esc(c.button || "Reveal answer")}</button><div class="ce-reveal-body" hidden><p>${esc(c.answer)}</p></div>`
      ),
  },
  steps: {
    label: "Step Slides",
    icon: "🎞️",
    group: "Explore",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "steps", label: "Steps - one per line as  Step title | Explanation", type: "textarea", rows: 8, required: true },
    ],
    defaults: { title: "Step by step", steps: "Step 1 | Explain the first step.\nStep 2 | Explain the second step.\nStep 3 | Explain the third step." },
    validate: (c) => (pairs(c.steps).length < 2 ? "Add at least two steps as  Title | Explanation." : ""),
    render: (c) => {
      const ps = pairs(c.steps);
      return wrap(
        "steps",
        c,
        `${head("🎞️", "Step slides", c.title)}<div class="ce-slides">${ps
          .map(([t, b], i) => `<div class="ce-slide" ${i ? "hidden" : ""}><p class="ce-slide-num">Step ${i + 1} of ${ps.length}</p><h4>${esc(t)}</h4><p>${esc(b)}</p></div>`)
          .join("")}</div><div class="ce-ia-actions"><button type="button" class="ce-btn-link" data-ce-action="slide-prev">◀ Back</button><button type="button" class="ce-btn" data-ce-action="slide-next">Next ▶</button></div>`
      );
    },
  },
  worked: {
    label: "Worked Example",
    icon: "🧮",
    group: "Explore",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "problem", label: "Problem", type: "textarea", required: true },
      { name: "steps", label: "Solution steps (one per line)", type: "lines", required: true },
      { name: "answer", label: "Final answer", type: "text" },
    ],
    defaults: { title: "Worked example", problem: "", steps: "", answer: "" },
    render: (c) =>
      wrap(
        "worked",
        c,
        `${head("🧮", "Worked example", c.title)}<p class="ce-q">${esc(c.problem)}</p><button type="button" class="ce-btn" data-ce-action="reveal">Show solution</button><div class="ce-reveal-body" hidden><ol>${lines(c.steps)
          .map((s) => `<li>${esc(s)}</li>`)
          .join("")}</ol>${c.answer ? `<p class="ce-final"><strong>Answer:</strong> ${esc(c.answer)}</p>` : ""}</div>`
      ),
  },
  mistakes: {
    label: "Common Mistakes",
    icon: "⚠️",
    group: "Explore",
    fields: [{ name: "items", label: "One per line as  Mistake | How to avoid it", type: "textarea", rows: 6, required: true }],
    defaults: { items: "Claiming ITC without a valid invoice | Always check the invoice appears in GSTR-2B before claiming." },
    validate: (c) => (!pairs(c.items).length ? "Add at least one line as  Mistake | Fix." : ""),
    render: (c) =>
      `<div class="ce-box ce-mistakes" data-ce-block="mistakes" data-ce-config="${encodeConfig(c)}"><p class="ce-box-title">⚠️ Common mistakes</p><ul>${pairs(c.items)
        .map(([m, f]) => `<li><strong>✗ ${esc(m)}</strong><br><span>✓ ${esc(f)}</span></li>`)
        .join("")}</ul></div><p><br></p>`,
  },
  exercise: {
    label: "Practical Exercise",
    icon: "🛠️",
    group: "Practice",
    fields: [
      { name: "title", label: "Exercise title", type: "text", required: true },
      { name: "task", label: "Task / scenario", type: "textarea", required: true },
      { name: "steps", label: "Steps for the student (one per line)", type: "lines" },
      { name: "solution", label: "Model answer (hidden until revealed)", type: "textarea" },
    ],
    defaults: { title: "Try it yourself", task: "", steps: "", solution: "" },
    render: (c) =>
      wrap(
        "exercise",
        c,
        `${head("🛠️", "Practical exercise", c.title)}<p>${esc(c.task)}</p>${lines(c.steps).length ? `<ol>${lines(c.steps).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}${
          c.solution ? `<button type="button" class="ce-btn" data-ce-action="reveal">Show model answer</button><div class="ce-reveal-body" hidden><p>${esc(c.solution)}</p></div>` : ""
        }`
      ),
  },
  activity: {
    label: "Embedded Activity",
    icon: "🧩",
    group: "Practice",
    fields: [
      { name: "title", label: "Activity title", type: "text", required: true },
      { name: "url", label: "Activity URL (https) - simulation, form, H5P, sheet…", type: "text", required: true },
      { name: "instructions", label: "Instructions", type: "textarea" },
      { name: "height", label: "Height (px)", type: "number", min: 200 },
    ],
    defaults: { title: "", url: "", instructions: "", height: 480 },
    validate: (c) => (!isSafeUrl(c.url) ? "Enter a valid http(s) URL." : ""),
    render: (c) =>
      wrap(
        "activity",
        c,
        `${head("🧩", "Activity", c.title)}${c.instructions ? `<p>${esc(c.instructions)}</p>` : ""}<div class="ce-embed" style="height:${Math.max(200, Number(c.height) || 480)}px"><iframe src="${esc(c.url)}" loading="lazy" allowfullscreen title="${esc(c.title)}"></iframe></div><p class="ce-small"><a href="${esc(c.url)}" target="_blank" rel="noopener">Open in a new tab ↗</a></p>`
      ),
  },
  calculator: {
    label: "Calculator",
    icon: "🧾",
    group: "Tools",
    fields: [
      { name: "kind", label: "Calculator", type: "select", options: ["GST", "EMI", "Percentage", "Simple Interest"] },
      { name: "title", label: "Title", type: "text" },
    ],
    defaults: { kind: "GST", title: "" },
    render: (c) => {
      const f = (name, label, value) =>
        `<label class="ce-calc-field"><span>${label}</span><input type="number" step="any" data-calc="${name}" value="${value}"></label>`;
      const inputs = {
        GST: f("amount", "Amount (₹)", 10000) + f("rate", "GST rate (%)", 18),
        EMI: f("principal", "Loan amount (₹)", 500000) + f("rate", "Interest (% p.a.)", 10) + f("months", "Tenure (months)", 60),
        Percentage: f("value", "Value", 250) + f("total", "Of total", 1000),
        "Simple Interest": f("principal", "Principal (₹)", 100000) + f("rate", "Rate (% p.a.)", 8) + f("years", "Years", 3),
      }[c.kind] || "";
      return wrap(
        "calculator",
        c,
        `${head("🧾", `${c.kind} calculator`, c.title)}<div class="ce-calc" data-kind="${esc(c.kind)}">${inputs}</div><div class="ce-calc-result" aria-live="polite">Enter values to calculate.</div>`
      );
    },
  },
  chart: {
    label: "Chart",
    icon: "📊",
    group: "Tools",
    fields: [
      { name: "title", label: "Chart title", type: "text" },
      { name: "data", label: "Data - one per line as  Label | Value", type: "textarea", rows: 6, required: true },
      { name: "unit", label: "Unit (e.g. ₹, %)", type: "text" },
    ],
    defaults: { title: "", data: "Q1 | 120\nQ2 | 180\nQ3 | 150\nQ4 | 220", unit: "" },
    validate: (c) => (!pairs(c.data).some(([, v]) => Number.isFinite(parseFloat(v))) ? "Add numeric values as  Label | Value." : ""),
    render: (c) => {
      const ps = pairs(c.data).map(([l, v]) => [l, parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0]);
      const max = Math.max(1, ...ps.map(([, v]) => v));
      return `<figure class="ce-chart" data-ce-block="chart" data-ce-config="${encodeConfig(c)}">${c.title ? `<figcaption>${esc(c.title)}</figcaption>` : ""}${ps
        .map(
          ([l, v]) =>
            `<div class="ce-bar-row"><span class="ce-bar-label">${esc(l)}</span><span class="ce-bar-track"><span class="ce-bar" style="width:${Math.max(2, (v / max) * 100).toFixed(1)}%"></span></span><span class="ce-bar-value">${esc(c.unit || "")}${v.toLocaleString("en-IN")}</span></div>`
        )
        .join("")}</figure><p><br></p>`;
    },
  },
  resources: {
    label: "Downloadable Resources",
    icon: "📥",
    group: "Tools",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "items", label: "Files - one per line as  File name | https://link", type: "textarea", rows: 5, required: true },
    ],
    defaults: { title: "Downloads", items: "" },
    validate: (c) => (!pairs(c.items).every(([, u]) => isSafeUrl(u)) || !pairs(c.items).length ? "Each line needs  Name | https://link." : ""),
    render: (c) =>
      `<div class="ce-box ce-resources" data-ce-block="resources" data-ce-config="${encodeConfig(c)}"><p class="ce-box-title">📥 ${esc(c.title || "Downloads")}</p><ul>${pairs(c.items)
        .map(([n, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener" download>${esc(n)}</a></li>`)
        .join("")}</ul></div><p><br></p>`,
  },
};

/** HTML for AI-generated MCQs / FAQs / flashcards */
export const aiItemsToHtml = (action, result) => {
  if (action === "mcqs" && result?.questions?.length) {
    return IA_BLOCKS.quiz.render({ title: "Check your understanding", questions: questionsToText(result.questions) });
  }
  if (action === "faqs" && result?.faqs?.length) {
    return `<h2>Frequently Asked Questions</h2>${IA_BLOCKS.accordion.render({ items: result.faqs.map((f) => `${f.question} | ${f.answer}`).join("\n") })}`;
  }
  if (action === "flashcards" && result?.cards?.length) {
    return IA_BLOCKS.flashcards.render({ title: "Revision flashcards", cards: result.cards.map((c) => `${c.front} | ${c.back}`).join("\n") });
  }
  return "";
};

// ---------------------------------------------------------------------------
// Insert-tab content blocks
// ---------------------------------------------------------------------------
export const CALLOUTS = {
  info: { label: "Information", icon: "ℹ️" },
  note: { label: "Note", icon: "📝" },
  warning: { label: "Warning", icon: "⚠️" },
  example: { label: "Example", icon: "💡" },
  tip: { label: "Practical Tip", icon: "✅" },
  important: { label: "Important", icon: "❗" },
  callout: { label: "Callout", icon: "📣" },
};

export const calloutHtml = (kind, bodyHtml = "") => {
  const c = CALLOUTS[kind] || CALLOUTS.note;
  return `<div class="ce-box ce-box-${kind}"><p class="ce-box-title">${c.icon} ${c.label}</p>${bodyHtml || "<p>Write here…</p>"}</div><p><br></p>`;
};

export const columnsHtml = (n = 2) =>
  `<div class="ce-cols ce-cols-${n}">${Array.from({ length: n }, (_, i) => `<div class="ce-col"><p>Column ${i + 1}</p></div>`).join("")}</div><p><br></p>`;

export const SHAPES = {
  box: { label: "Rounded box", html: '<div class="ce-shape ce-shape-box"><p>Text</p></div>' },
  circle: { label: "Circle", html: '<div class="ce-shape ce-shape-circle"><p>1</p></div>' },
  pill: { label: "Pill / badge", html: '<span class="ce-shape ce-shape-pill">Label</span>&nbsp;' },
  arrowRight: { label: "Arrow →", html: '<span class="ce-shape ce-shape-arrow">→</span>&nbsp;' },
  arrowDown: { label: "Arrow ↓", html: '<div class="ce-shape ce-shape-arrow ce-shape-arrow-down">↓</div>' },
  star: { label: "Star", html: '<span class="ce-shape ce-shape-star">★</span>&nbsp;' },
  banner: { label: "Banner", html: '<div class="ce-shape ce-shape-banner"><p>Banner text</p></div>' },
};

export const SYMBOLS =
  "₹ € £ ¥ $ ¢ © ® ™ § ¶ † ‡ • … ° ± × ÷ = ≠ ≈ ≤ ≥ < > ∞ √ ∑ ∏ ∫ ∂ ∆ ∇ π µ Ω α β γ δ ε θ λ σ φ ω ½ ⅓ ¼ ¾ ² ³ ¹ ⁰ ← → ↑ ↓ ↔ ⇒ ⇐ ⇔ ✓ ✗ ★ ☆ ✦ ♦ ● ○ ■ □ ▲ ▼ ◆ « » „ “ ” ‘ ’ – —".split(" ");

export const chemistryHtml = (formula = "") =>
  `<span class="ce-chem">${esc(formula)
    .replace(/([A-Za-z)\]])(\d+)/g, "$1<sub>$2</sub>")
    .replace(/\^(\d*[+-])/g, "<sup>$1</sup>")
    .replace(/-&gt;|→/g, " → ")}</span>&nbsp;`;

export const downloadCardHtml = ({ url, name, size, description }) =>
  `<div class="ce-download" contenteditable="false"><span class="ce-download-icon">📄</span><span class="ce-download-info"><strong>${esc(name || "Download")}</strong>${
    description || size ? `<small>${esc([description, size ? formatBytes(size) : ""].filter(Boolean).join(" · "))}</small>` : ""
  }</span><a class="ce-btn" href="${esc(url)}" target="_blank" rel="noopener" download>Download</a></div><p><br></p>`;

export const linkCardHtml = ({ url, title, description }) =>
  `<a class="ce-linkcard" href="${esc(url)}" target="_blank" rel="noopener"><strong>${esc(title || url)}</strong>${description ? `<span>${esc(description)}</span>` : ""}<small>${esc(
    (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return url;
      }
    })()
  )} ↗</small></a><p><br></p>`;

/** YouTube / Vimeo links become embeds; direct files become <video> */
export const videoHtml = (url, caption = "") => {
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(url);
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : "";
  if (yt || vimeo) {
    const src = yt ? `https://www.youtube.com/embed/${yt[1]}` : `https://player.vimeo.com/video/${vimeo[1]}`;
    return `<figure class="ce-video"><div class="ce-embed ce-embed-16x9"><iframe src="${src}" loading="lazy" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title="${esc(caption || "Video")}"></iframe></div>${cap}</figure><p><br></p>`;
  }
  return `<figure class="ce-video"><video controls preload="metadata" src="${esc(url)}" style="width:100%;max-width:100%"></video>${cap}</figure><p><br></p>`;
};

export const audioHtml = (url, caption = "") =>
  `<figure class="ce-audio">${caption ? `<figcaption>🎧 ${esc(caption)}</figcaption>` : ""}<audio controls preload="metadata" src="${esc(url)}"></audio></figure><p><br></p>`;

export const imageHtml = ({ url, alt = "", width = "100", align = "center", caption = "" }) => {
  const style = `width:${width}%;max-width:100%;height:auto;`;
  const img = `<img src="${esc(url)}" alt="${esc(alt)}" style="${style}" class="ce-img ce-img-${align}">`;
  return caption ? `<figure class="ce-figure ce-figure-${align}">${img}<figcaption>${esc(caption)}</figcaption></figure><p><br></p>` : `<p class="ce-img-wrap ce-align-${align}">${img}</p>`;
};

export const embedHtml = (url, height = 450, title = "Embedded content") =>
  `<div class="ce-embed" style="height:${Math.max(150, Number(height) || 450)}px"><iframe src="${esc(url)}" loading="lazy" allowfullscreen title="${esc(title)}"></iframe></div><p><br></p>`;

export const codeHtml = (code = "", lang = "") =>
  `<pre class="ce-code" data-lang="${esc(lang)}"><code>${esc(code)}</code></pre><p><br></p>`;

// ---------------------------------------------------------------------------
// Design tab: infographics (inline-editable after insertion)
// ---------------------------------------------------------------------------
const itemsField = (label = "Items (one per line)", def = "") => ({ name: "items", label, type: "textarea", rows: 7, required: true, def });

export const INFOGRAPHICS = {
  step: { label: "Step", icon: "☰", fields: [itemsField("Steps - one per line as  Title | Description")], defaults: { items: "Register | Apply on the GST portal\nFile returns | File GSTR-1 and GSTR-3B\nPay tax | Pay the tax liability" } },
  process: { label: "Process", icon: "»", fields: [itemsField("Stages (one per line)")], defaults: { items: "Input\nProcess\nOutput" } },
  timeline: { label: "Timeline", icon: "〰", fields: [itemsField("Events - one per line as  Date | Event")], defaults: { items: "1 Jul 2017 | GST launched\n2018 | E-way bill introduced\n2020 | E-invoicing introduced" } },
  roadmap: { label: "Roadmap", icon: "🗺", fields: [itemsField("Milestones - one per line as  Milestone | Details")], defaults: { items: "Basics | Learn the fundamentals\nPractice | Solve practical problems\nMastery | Handle real client work" } },
  cycle: { label: "Cycle", icon: "⟳", fields: [itemsField("Stages (one per line)")], defaults: { items: "Plan\nDo\nCheck\nAct" } },
  comparison: { label: "Comparison", icon: "⇄", fields: [{ name: "left", label: "Left title", type: "text" }, { name: "right", label: "Right title", type: "text" }, itemsField("Rows - one per line as  Left point | Right point")], defaults: { left: "Old regime", right: "New regime", items: "Deductions allowed | Limited deductions\nHigher rates | Lower rates" } },
  proscons: { label: "Pros / Cons", icon: "👍", fields: [{ name: "pros", label: "Pros (one per line)", type: "textarea", rows: 4 }, { name: "cons", label: "Cons (one per line)", type: "textarea", rows: 4 }], defaults: { pros: "Advantage one\nAdvantage two", cons: "Disadvantage one\nDisadvantage two" } },
  venn: { label: "Venn", icon: "◎", fields: [{ name: "a", label: "Left circle", type: "text" }, { name: "both", label: "Overlap", type: "text" }, { name: "b", label: "Right circle", type: "text" }], defaults: { a: "Goods", both: "Composite supply", b: "Services" } },
  matrix: { label: "2×2", icon: "▦", fields: [itemsField("Four quadrants - one per line as  Title | Description")], defaults: { items: "Strengths | Internal positives\nWeaknesses | Internal negatives\nOpportunities | External positives\nThreats | External negatives" } },
  hierarchy: { label: "Hierarchy", icon: "⊤", fields: [{ name: "top", label: "Top level", type: "text" }, itemsField("Second level (one per line)")], defaults: { top: "Board of Directors", items: "CEO\nCFO\nCOO" } },
  mind: { label: "Mind map", icon: "✺", fields: [{ name: "center", label: "Central idea", type: "text" }, itemsField("Branches (one per line)")], defaults: { center: "GST", items: "CGST\nSGST\nIGST\nUTGST\nCess" } },
  pyramid: { label: "Pyramid", icon: "△", fields: [itemsField("Levels from top to bottom (one per line)")], defaults: { items: "Vision\nStrategy\nTactics\nOperations" } },
};

export const renderInfographic = (type, c) => {
  const it = lines(c.items);
  const ps = pairs(c.items);
  const twoPart = (l) => {
    const i = l.indexOf("|");
    return i === -1 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  };
  const box = (cls, inner) => `<div class="ce-info ce-info-${cls}">${inner}</div><p><br></p>`;
  switch (type) {
    case "step":
      return box("step", it.map((l, i) => { const [t, d] = twoPart(l); return `<div class="ce-info-item"><span class="ce-info-num">${i + 1}</span><div><p><strong>${esc(t)}</strong></p>${d ? `<p>${esc(d)}</p>` : ""}</div></div>`; }).join(""));
    case "process":
      return box("process", it.map((l) => `<div class="ce-info-item"><p>${esc(l)}</p></div>`).join('<span class="ce-info-arrow">➜</span>'));
    case "timeline":
      return box("timeline", it.map((l) => { const [t, d] = twoPart(l); return `<div class="ce-info-item"><span class="ce-info-dot"></span><p class="ce-info-date">${esc(t)}</p><p>${esc(d)}</p></div>`; }).join(""));
    case "roadmap":
      return box("roadmap", it.map((l, i) => { const [t, d] = twoPart(l); return `<div class="ce-info-item"><span class="ce-info-num">${i + 1}</span><p><strong>${esc(t)}</strong></p><p>${esc(d)}</p></div>`; }).join(""));
    case "cycle":
      return box("cycle", `${it.map((l, i) => `<div class="ce-info-item" style="--i:${i};--n:${it.length}"><p>${esc(l)}</p></div>`).join("")}<span class="ce-info-cycle-center">⟳</span>`);
    case "comparison":
      return box("comparison", `<table><thead><tr><th>${esc(c.left)}</th><th>${esc(c.right)}</th></tr></thead><tbody>${ps.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody></table>`);
    case "proscons":
      return box("proscons", `<div class="ce-info-pros"><p><strong>👍 Pros</strong></p><ul>${lines(c.pros).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="ce-info-cons"><p><strong>👎 Cons</strong></p><ul>${lines(c.cons).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`);
    case "venn":
      return box("venn", `<div class="ce-venn-a"><p>${esc(c.a)}</p></div><div class="ce-venn-both"><p>${esc(c.both)}</p></div><div class="ce-venn-b"><p>${esc(c.b)}</p></div>`);
    case "matrix":
      return box("matrix", it.slice(0, 4).map((l) => { const [t, d] = twoPart(l); return `<div class="ce-info-item"><p><strong>${esc(t)}</strong></p><p>${esc(d)}</p></div>`; }).join(""));
    case "hierarchy":
      return box("hierarchy", `<div class="ce-info-top"><p><strong>${esc(c.top)}</strong></p></div><div class="ce-info-children">${it.map((l) => `<div class="ce-info-item"><p>${esc(l)}</p></div>`).join("")}</div>`);
    case "mind":
      return box("mind", `<div class="ce-info-center"><p><strong>${esc(c.center)}</strong></p></div><div class="ce-info-children">${it.map((l) => `<div class="ce-info-item"><p>${esc(l)}</p></div>`).join("")}</div>`);
    case "pyramid":
      return box("pyramid", it.map((l, i) => `<div class="ce-info-item" style="width:${Math.round(40 + (60 * (i + 1)) / it.length)}%"><p>${esc(l)}</p></div>`).join(""));
    default:
      return "";
  }
};

// ---------------------------------------------------------------------------
// Professional document templates
// ---------------------------------------------------------------------------
export const TEMPLATES = {
  lesson: {
    label: "Lesson",
    html: `<h2>Introduction</h2><p>Why this topic matters…</p><h2>Learning Objectives</h2><ul><li>Explain…</li><li>Apply…</li><li>Calculate…</li></ul><h2>Concept Explanation</h2><p>…</p>${calloutHtml("example", "<p>Worked example…</p>")}<h2>Real-World Application</h2><p>…</p>${calloutHtml("important", "<p>Important note…</p>")}<h2>Key Takeaways</h2><ul><li>…</li></ul><h2>Summary</h2><p>…</p>`,
  },
  caseStudy: {
    label: "Case study",
    html: `<h2>Business Background</h2><p>…</p><h2>Problem Statement</h2><p>…</p><h2>Relevant Facts and Data</h2><table><thead><tr><th>Particulars</th><th>Amount (₹)</th></tr></thead><tbody><tr><td>…</td><td>…</td></tr></tbody></table><h2>Analysis</h2><p>…</p><h2>Possible Solutions</h2><p>…</p><h2>Conclusion</h2><p>…</p><h2>Discussion Questions</h2><ol><li>…</li></ol>`,
  },
  assignment: {
    label: "Assignment",
    html: `<h2>Objective</h2><p>…</p><h2>Instructions</h2><ol><li>…</li></ol><h2>Tasks</h2><ol><li>…</li></ol><h2>Submission Guidelines</h2><ul><li>…</li></ul><h2>Evaluation Criteria</h2><table><thead><tr><th>Criteria</th><th>Description</th><th>Marks</th></tr></thead><tbody><tr><td>…</td><td>…</td><td>…</td></tr></tbody></table>`,
  },
  notes: {
    label: "Study notes",
    html: `<h2>Key Concepts</h2><ul><li><strong>Term</strong> – definition</li></ul><h2>Important Provisions</h2><p>…</p>${calloutHtml("tip", "<p>Exam tip…</p>")}<h2>Quick Revision</h2><ul><li>…</li></ul>`,
  },
};
