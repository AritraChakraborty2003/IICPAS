"use client";
// AI auto-fill for the Create / Edit Course forms.
//
// - "Generate Course Details with AI" fills every applicable empty field from
//   the course name (descriptions, exam & certification, case study, SEO, meta,
//   slug, duration, category, level).
// - Fields the admin typed are never overwritten; fields AI filled earlier (and
//   the admin left untouched) are refreshed by "Generate again".
// - Each field has its own ↻ AI button for field-level regeneration.
// - After the admin pauses typing the course name, a suggestion appears; AI is
//   only called when the admin clicks (no surprise API calls).
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { runAi, errorMessage, formatElapsed } from "../../components/CourseEditor/aiClient";

const AI_FIELDS = [
  "category",
  "slug",
  "duration",
  "level",
  "description",
  "examCert",
  "caseStudy",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "metaTitle",
  "metaDescription",
  "metaKeywords",
];

const LABELS = {
  category: "Category",
  slug: "Slug",
  duration: "Duration",
  level: "Level",
  description: "Course Description",
  examCert: "Exam & Certification",
  caseStudy: "Case Study",
  seoTitle: "SEO Title",
  seoDescription: "SEO Description",
  seoKeywords: "SEO Keywords",
  metaTitle: "Meta Title",
  metaDescription: "Meta Description",
  metaKeywords: "Meta Keywords",
};

const plain = (v) =>
  String(v ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const fieldText = (form, name) => (name === "category" ? form.category?.value || "" : plain(form[name]));

export default function useCourseAiAssist({ form, setForm, categoryOptions = [], levelOptions = null }) {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [busyField, setBusyField] = useState("");
  const [elapsed, setElapsed] = useState("");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState("");
  const [suggest, setSuggest] = useState(false);
  const aiValues = useRef({}); // field -> plain text AI last wrote
  const stopRef = useRef(false);
  const lastTitle = useRef("");
  const formRef = useRef(form);
  formRef.current = form;

  const title = String(form?.title || "").trim();
  const supportsLevel = Array.isArray(levelOptions);

  // Suggest generation once the admin pauses typing a new course name
  useEffect(() => {
    if (!title || title.length < 3 || title === lastTitle.current) return undefined;
    const t = setTimeout(() => setSuggest(true), 1200);
    return () => clearTimeout(t);
  }, [title]);

  const isManual = (name) => {
    const cur = fieldText(form, name);
    return !!cur && cur !== aiValues.current[name];
  };

  const matchCategory = (value) => {
    const v = String(value || "").trim().toLowerCase();
    return categoryOptions.find((o) => o.value.toLowerCase() === v || o.label.toLowerCase() === v) || null;
  };

  const matchLevel = (value) => {
    if (!supportsLevel) return null;
    const v = String(value || "").trim().toLowerCase();
    const opt = levelOptions.find((l) => String(l.value).toLowerCase() === v || String(l.label).toLowerCase() === v);
    return opt ? opt.value : null;
  };

  // Decide against the latest form (the admin may keep typing while AI runs),
  // then apply only the changed fields.
  const apply = (fields, { only, force } = {}) => {
    const filled = [];
    const kept = [];
    const notes = [];
    const changes = {};
    const latest = formRef.current || {};
    for (const name of only || AI_FIELDS) {
      if (fields[name] === undefined) continue;
      const current = fieldText(latest, name);
      if (!force && current && current !== aiValues.current[name]) {
        kept.push(LABELS[name]);
        continue;
      }
      if (name === "category") {
        const opt = matchCategory(fields.category);
        if (!opt) {
          notes.push(`Suggested category “${fields.category}” is not in the category list - add it under Course Category or choose one.`);
          continue;
        }
        changes.category = opt;
        aiValues.current.category = opt.value;
      } else if (name === "level") {
        const lvl = matchLevel(fields.level);
        if (!lvl) continue;
        changes.level = lvl;
        aiValues.current.level = plain(lvl);
      } else {
        changes[name] = fields[name];
        aiValues.current[name] = plain(fields[name]);
      }
      filled.push(LABELS[name]);
    }
    if (Object.keys(changes).length) setForm((prev) => ({ ...prev, ...changes }));
    return { filled, kept, notes };
  };

  const request = (fields) =>
    runAi(
      "/ai-course/course-details",
      {
        title,
        fields,
        categories: categoryOptions.map((o) => o.value),
        category: form.category?.value || "",
        level: supportsLevel ? form.level : "",
        instructions,
        existing: Object.fromEntries(AI_FIELDS.filter((f) => isManual(f)).map((f) => [f, fieldText(form, f)])),
      },
      {
        onTick: (_j, ms) => setElapsed(formatElapsed(ms)),
        shouldStop: () => stopRef.current,
      }
    );

  const generateAll = async () => {
    if (!title) return Swal.fire("Course name needed", "Enter the course name first - AI generates everything else from it.", "info");
    lastTitle.current = title;
    setSuggest(false);
    stopRef.current = false;
    setStatus("running");
    setError("");
    setSummary(null);
    setElapsed("0:00");
    try {
      const wanted = AI_FIELDS.filter((f) => (f !== "level" || supportsLevel) && !isManual(f));
      if (!wanted.length) {
        setStatus("done");
        setSummary({ filled: [], kept: AI_FIELDS.map((f) => LABELS[f]), notes: ["All fields already have content you wrote. Use the ↻ AI button on a field to regenerate it."] });
        return;
      }
      const { result } = await request(wanted);
      // React state updates are batched; compute the summary from the result itself
      const s = apply(result.fields || {}, { only: wanted });
      setSummary(s);
      setStatus("done");
    } catch (err) {
      if (stopRef.current) return setStatus("idle");
      setError(errorMessage(err));
      setStatus("error");
    }
  };

  const regenerateField = async (name) => {
    if (!title) return Swal.fire("Course name needed", "Enter the course name first.", "info");
    if (isManual(name)) {
      const ok = await Swal.fire({
        title: `Regenerate ${LABELS[name]}?`,
        text: "This field has content you wrote. It will be replaced by a new AI version.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Replace it",
      });
      if (!ok.isConfirmed) return;
    }
    stopRef.current = false;
    setBusyField(name);
    try {
      const { result } = await request([name]);
      const s = apply(result.fields || {}, { only: [name], force: true });
      if (!s.filled.length) {
        Swal.fire({ toast: true, position: "top-end", timer: 3500, showConfirmButton: false, icon: "info", title: s.notes[0] || `AI did not return ${LABELS[name]}.` });
      } else {
        Swal.fire({ toast: true, position: "top-end", timer: 2200, showConfirmButton: false, icon: "success", title: `${LABELS[name]} regenerated` });
      }
    } catch (err) {
      Swal.fire("AI could not regenerate this field", errorMessage(err), "error");
    } finally {
      setBusyField("");
    }
  };

  const fieldButton = (name) => (
    <button
      type="button"
      onClick={() => regenerateField(name)}
      disabled={!!busyField || status === "running"}
      title={`Regenerate ${LABELS[name]} with AI`}
      className="ml-2 inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
    >
      {busyField === name ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" /> : "↻"} AI
    </button>
  );

  const panel = (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">✨ AI Course Assistant</p>
          <p className="text-xs text-slate-600">
            Enter the course name and AI fills the descriptions, exam &amp; certification, case study, SEO and meta fields. Fields you have
            written are never overwritten.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "running" ? (
            <>
              <span className="text-xs text-slate-600">Generating… {elapsed}</span>
              <button type="button" onClick={() => (stopRef.current = true)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white">
                Stop
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={generateAll}
              disabled={!title}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-violet-700 hover:to-blue-700 disabled:opacity-50"
            >
              {status === "done" ? "↻ Generate again" : "✨ Generate Course Details with AI"}
            </button>
          )}
        </div>
      </div>
      <input
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Optional: extra instructions for AI (e.g. focus on CA students, include Excel, 3-month course)"
        className="mt-3 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
      />
      {suggest && status === "idle" && title && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          <span>
            Generate the course details for <strong>“{title}”</strong> now?
          </span>
          <button type="button" onClick={generateAll} className="rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
            Yes, generate
          </button>
          <button type="button" onClick={() => setSuggest(false)} className="text-xs text-slate-500">
            Not now
          </button>
        </div>
      )}
      {status === "error" && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {status === "done" && summary && (
        <div className="mt-3 space-y-1 rounded-lg bg-white px-3 py-2 text-xs text-slate-700">
          {summary.filled.length > 0 && <p>✅ Filled: {summary.filled.join(", ")}. Review and edit them below before saving.</p>}
          {summary.kept.length > 0 && <p>✋ Kept your content in: {summary.kept.join(", ")}.</p>}
          {summary.notes.map((n) => (
            <p key={n}>ℹ️ {n}</p>
          ))}
        </div>
      )}
    </div>
  );

  return { panel, fieldButton, generating: status === "running" || !!busyField };
}
