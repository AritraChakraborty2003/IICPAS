"use client";
// Makes interactive course blocks (MCQs, quizzes, flashcards, tabs, calculators…)
// work wherever course HTML is rendered - Digital Hub, previews, any page -
// through document-level event delegation. Mounted once in the root layout.
// Blocks inside the editing canvas are left alone so authoring is unaffected.
import { useEffect } from "react";
import "./courseContent.css";

const inEditor = (el) => !!el.closest(".jodit-wysiwyg, [contenteditable='true']");

const norm = (s = "") => String(s).trim().toLowerCase().replace(/\s+/g, " ");

const setFeedback = (scope, ok, text) => {
  const fb = scope.querySelector(":scope > .ce-feedback, .ce-feedback");
  if (!fb) return;
  fb.hidden = false;
  fb.classList.toggle("is-correct", ok);
  fb.classList.toggle("is-wrong", !ok);
  const verdict = fb.querySelector(".ce-feedback-verdict");
  if (verdict) verdict.textContent = text || (ok ? "Correct!" : "Not quite.");
};

const setScore = (block, text) => {
  const s = block.querySelector(".ce-score");
  if (s) {
    s.hidden = false;
    s.textContent = text;
  }
};

const markOptions = (scope) => {
  const opts = [...scope.querySelectorAll(".ce-opt")];
  let ok = true;
  opts.forEach((o) => {
    const correct = o.dataset.correct === "1";
    const chosen = o.classList.contains("is-selected");
    if (correct !== chosen) ok = false;
    o.classList.toggle("is-correct", correct);
    o.classList.toggle("is-wrong", chosen && !correct);
    o.disabled = true;
  });
  return ok;
};

const resetBlock = (block) => {
  block.querySelectorAll(".ce-opt").forEach((o) => {
    o.classList.remove("is-selected", "is-correct", "is-wrong");
    o.disabled = false;
  });
  block.querySelectorAll(".ce-feedback, .ce-score").forEach((f) => {
    f.hidden = true;
    f.classList.remove("is-correct", "is-wrong");
  });
  block.querySelectorAll("input.ce-blank").forEach((i) => {
    i.value = "";
    i.classList.remove("is-correct", "is-wrong");
  });
  block.querySelectorAll("select.ce-match-select").forEach((s) => {
    s.value = "";
    s.classList.remove("is-correct", "is-wrong");
  });
  block.querySelectorAll("[data-done]").forEach((n) => delete n.dataset.done);
  delete block.dataset.done;
};

const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-");

const calculate = (calc) => {
  const v = (name) => parseFloat(calc.querySelector(`[data-calc="${name}"]`)?.value);
  const out = calc.parentElement?.querySelector(".ce-calc-result");
  if (!out) return;
  let text = "Enter values to calculate.";
  switch (calc.dataset.kind) {
    case "GST": {
      const tax = (v("amount") * v("rate")) / 100;
      text = `GST: ₹${fmt(tax)} (CGST ₹${fmt(tax / 2)} + SGST ₹${fmt(tax / 2)}) · Total: ₹${fmt(v("amount") + tax)}`;
      break;
    }
    case "EMI": {
      const r = v("rate") / 1200;
      const n = v("months");
      const p = v("principal");
      const emi = r ? (p * r * (1 + r) ** n) / ((1 + r) ** n - 1) : p / n;
      text = `EMI: ₹${fmt(emi)} per month · Total interest: ₹${fmt(emi * n - p)} · Total payable: ₹${fmt(emi * n)}`;
      break;
    }
    case "Percentage":
      text = `${fmt(v("value"))} is ${fmt((v("value") / v("total")) * 100)}% of ${fmt(v("total"))}`;
      break;
    case "Simple Interest": {
      const si = (v("principal") * v("rate") * v("years")) / 100;
      text = `Interest: ₹${fmt(si)} · Amount: ₹${fmt(v("principal") + si)}`;
      break;
    }
    default:
  }
  out.textContent = text.includes("NaN") ? "Enter valid numbers." : text;
};

const showDeckCard = (block, index) => {
  const deck = block.querySelector(".ce-deck");
  const cards = [...block.querySelectorAll(".ce-deck-card")];
  if (!deck || !cards.length) return;
  const i = (index + cards.length) % cards.length;
  deck.dataset.index = String(i);
  cards.forEach((c, n) => {
    c.hidden = n !== i;
    c.querySelector(".ce-deck-back").hidden = true;
  });
  const count = block.querySelector(".ce-deck-count");
  if (count) count.textContent = `${i + 1} / ${cards.length}`;
  const flipBtn = block.querySelector('[data-ce-action="deck-flip"]');
  if (flipBtn) flipBtn.textContent = "Show answer";
};

const showSlide = (block, delta) => {
  const slides = [...block.querySelectorAll(".ce-slide")];
  const cur = slides.findIndex((s) => !s.hidden);
  const next = Math.min(slides.length - 1, Math.max(0, cur + delta));
  slides.forEach((s, i) => (s.hidden = i !== next));
};

const ACTIONS = {
  "pick-opt": (btn, block) => {
    const quizQ = btn.closest(".ce-quiz-q");
    if (quizQ) {
      if (quizQ.dataset.done) return;
      quizQ.querySelectorAll(".ce-opt").forEach((o) => o.classList.toggle("is-selected", o === btn));
      return;
    }
    if (block.dataset.done) return;
    btn.classList.add("is-selected");
    const ok = markOptions(block);
    block.dataset.done = "1";
    setFeedback(block, ok);
  },
  "toggle-opt": (btn) => {
    const scope = btn.closest(".ce-quiz-q") || btn.closest(".ce-ia");
    if (scope?.dataset.done) return;
    btn.classList.toggle("is-selected");
  },
  "check-multi": (btn, block) => {
    if (block.dataset.done) return;
    const ok = markOptions(block);
    block.dataset.done = "1";
    setFeedback(block, ok, ok ? "Correct!" : "Not quite - the correct options are highlighted.");
  },
  "submit-quiz": (btn, block) => {
    if (block.dataset.done) return;
    const qs = [...block.querySelectorAll(".ce-quiz-q")];
    let score = 0;
    qs.forEach((q) => {
      const ok = markOptions(q);
      if (ok) score += 1;
      q.dataset.done = "1";
      setFeedback(q, ok);
    });
    block.dataset.done = "1";
    setScore(block, `You scored ${score} / ${qs.length}`);
  },
  reset: (btn, block) => resetBlock(block),
  "check-fill": (btn, block) => {
    const inputs = [...block.querySelectorAll("input.ce-blank")];
    let score = 0;
    inputs.forEach((i) => {
      const ok = (i.dataset.answer || "").split("|").map(norm).includes(norm(i.value));
      if (ok) score += 1;
      i.classList.toggle("is-correct", ok);
      i.classList.toggle("is-wrong", !ok);
    });
    setScore(block, `${score} / ${inputs.length} correct`);
  },
  "show-fill": (btn, block) =>
    block.querySelectorAll("input.ce-blank").forEach((i) => {
      i.value = (i.dataset.answer || "").split("|")[0];
      i.classList.remove("is-wrong");
    }),
  "check-match": (btn, block) => {
    const sels = [...block.querySelectorAll("select.ce-match-select")];
    let score = 0;
    sels.forEach((s) => {
      const ok = norm(s.value) === norm(s.dataset.answer);
      if (ok) score += 1;
      s.classList.toggle("is-correct", ok);
      s.classList.toggle("is-wrong", !ok);
    });
    setScore(block, `${score} / ${sels.length} correct`);
  },
  "move-up": (btn) => {
    const li = btn.closest("li");
    if (li?.previousElementSibling) li.parentNode.insertBefore(li, li.previousElementSibling);
  },
  "move-down": (btn) => {
    const li = btn.closest("li");
    if (li?.nextElementSibling) li.parentNode.insertBefore(li.nextElementSibling, li);
  },
  "check-order": (btn, block) => {
    const items = [...block.querySelectorAll(".ce-order-item")];
    let score = 0;
    items.forEach((li, i) => {
      const ok = Number(li.dataset.pos) === i;
      if (ok) score += 1;
      li.classList.toggle("is-correct", ok);
      li.classList.toggle("is-wrong", !ok);
    });
    setScore(block, score === items.length ? "Perfect order!" : `${score} / ${items.length} in the right place`);
  },
  flip: (btn) => btn.classList.toggle("is-flipped"),
  "deck-next": (btn, block) => showDeckCard(block, Number(block.querySelector(".ce-deck")?.dataset.index || 0) + 1),
  "deck-prev": (btn, block) => showDeckCard(block, Number(block.querySelector(".ce-deck")?.dataset.index || 0) - 1),
  "deck-flip": (btn, block) => {
    const card = [...block.querySelectorAll(".ce-deck-card")].find((c) => !c.hidden);
    const back = card?.querySelector(".ce-deck-back");
    if (!back) return;
    back.hidden = !back.hidden;
    btn.textContent = back.hidden ? "Show answer" : "Hide answer";
  },
  tab: (btn, block) => {
    const i = Number(btn.dataset.tab);
    block.querySelectorAll(".ce-tab-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    block.querySelectorAll(".ce-tab-panel").forEach((p, n) => (p.hidden = n !== i));
  },
  reveal: (btn) => {
    const body = btn.nextElementSibling?.classList.contains("ce-reveal-body") ? btn.nextElementSibling : btn.parentElement?.querySelector(".ce-reveal-body");
    if (!body) return;
    body.hidden = !body.hidden;
    btn.classList.toggle("is-open", !body.hidden);
  },
  "slide-next": (btn, block) => showSlide(block, 1),
  "slide-prev": (btn, block) => showSlide(block, -1),
};

export function handleInteractiveClick(e) {
  const btn = e.target.closest?.("[data-ce-action]");
  if (!btn || inEditor(btn)) return;
  const block = btn.closest(".ce-ia");
  const fn = ACTIONS[btn.dataset.ceAction];
  if (!block || !fn) return;
  e.preventDefault();
  fn(btn, block);
}

export function handleInteractiveInput(e) {
  const input = e.target.closest?.("[data-calc]");
  if (!input || inEditor(input)) return;
  const calc = input.closest(".ce-calc");
  if (calc) calculate(calc);
}

export default function InteractiveRuntime() {
  useEffect(() => {
    document.addEventListener("click", handleInteractiveClick);
    document.addEventListener("input", handleInteractiveInput);
    return () => {
      document.removeEventListener("click", handleInteractiveClick);
      document.removeEventListener("input", handleInteractiveInput);
    };
  }, []);
  return null;
}
