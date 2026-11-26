"use client";
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  FaMagic, FaArrowUp, FaArrowDown, FaTrash, FaPlus, FaSyncAlt, FaChevronDown, FaChevronRight, FaArrowLeft, FaSave,
} from "react-icons/fa";
import { Modal, Btn, Field, Badge, GeneratingPanel, Spinner, inputCls } from "../../components/CourseEditor/ui";
import { aiHttp, runAi, errorMessage, htmlToText, formatElapsed } from "../../components/CourseEditor/aiClient";
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

let keySeq = 0;
const nextKey = () => `k${++keySeq}`;

const toEditableTopic = (t = {}) => ({
  key: nextKey(),
  title: t.title || "",
  description: t.description || "",
  objectives: (t.objectives || []).join("\n"),
});
const toEditableChapter = (c = {}) => ({
  key: nextKey(),
  title: c.title || "",
  description: c.description || "",
  objectives: (c.objectives || []).join("\n"),
  topics: (c.topics || []).map(toEditableTopic),
  open: true,
});
const lines = (s) => String(s || "").split("\n").map((x) => x.replace(/^[-•*\d.)\s]+/, "").trim()).filter(Boolean);

const move = (arr, from, to) => {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

/**
 * AI Course Structure Generator. Generates chapters + lessons (topics) for an
 * existing course, lets the admin review/edit everything, and only writes to
 * the course after confirmation.
 */
export default function AiCourseStructureModal({ open, onClose, courseId, courseName, existingChapterTitles = [], onSaved }) {
  const [step, setStep] = useState("inputs");
  const [inputs, setInputs] = useState({
    courseTitle: courseName || "",
    courseDescription: "",
    category: "",
    targetAudience: "",
    level: "Beginner",
    totalChapters: "0",
    lessonsPerChapter: "0",
    learningObjectives: "",
    instructions: "",
  });
  const [chapters, setChapters] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [courseLoaded, setCourseLoaded] = useState(false);
  const autoStartRef = useRef(false);
  const stopRef = useRef(false);

  const existing = new Set(existingChapterTitles.map((t) => String(t).trim().toLowerCase()));
  const setInput = (k, v) => setInputs((s) => ({ ...s, [k]: v }));

  // Pre-fill from the existing course
  useEffect(() => {
    if (!open || !courseId) return;
    setStep("inputs");
    setChapters([]);
    setLoadingCourse(true);
    setCourseLoaded(false);
    autoStartRef.current = true; // generate as soon as the course details are loaded
    aiHttp
      .get(`/courses/${courseId}`)
      .then(({ data }) => {
        const c = data?.course || data?.data || data;
        setInputs((s) => ({
          ...s,
          courseTitle: c?.title || courseName || "",
          courseDescription: htmlToText(c?.description || "").replace(/\s+/g, " ").trim().slice(0, 3000),
          category: c?.category || "",
        }));
      })
      .catch(() => {})
      .finally(() => {
        setLoadingCourse(false);
        setCourseLoaded(true);
      });
    return () => {
      stopRef.current = true;
    };
  }, [open, courseId, courseName]);

  const payload = () => ({ ...inputs, totalChapters: Number(inputs.totalChapters), lessonsPerChapter: Number(inputs.lessonsPerChapter) });

  const generateAll = async () => {
    if (!inputs.courseTitle.trim()) return Swal.fire("Course title required", "Please enter the course title.", "warning");
    if (step === "review" && chapters.length) {
      const ok = await Swal.fire({
        title: "Regenerate the entire structure?",
        text: "All chapters and lessons below, including your edits, will be replaced.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Regenerate",
      });
      if (!ok.isConfirmed) return;
    }
    const prevStep = step;
    setStep("generating");
    setElapsed(0);
    stopRef.current = false;
    try {
      const { result } = await runAi(`/ai-course/${courseId}/structure`, payload(), {
        onTick: (_, ms) => setElapsed(ms),
        shouldStop: () => stopRef.current,
      });
      setChapters(result.chapters.map(toEditableChapter));
      setStep("review");
    } catch (err) {
      setStep(prevStep === "review" && chapters.length ? "review" : "inputs");
      if (err.message !== "Cancelled") Swal.fire("Generation failed", errorMessage(err), "error");
    }
  };

  // Opening the generator starts generation straight away from the course details
  useEffect(() => {
    if (open && courseLoaded && autoStartRef.current && step === "inputs") {
      autoStartRef.current = false;
      generateAll();
    }
  }, [open, courseLoaded, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const regenChapter = async (index) => {
    const ch = chapters[index];
    setBusy((b) => ({ ...b, [ch.key]: true }));
    try {
      const { result } = await runAi(`/ai-course/${courseId}/chapter`, {
        ...payload(),
        chapterNumber: index + 1,
        currentTitle: ch.title,
        otherChapterTitles: chapters.filter((_, i) => i !== index).map((c) => c.title),
      });
      setChapters((cs) => cs.map((c) => (c.key === ch.key ? { ...toEditableChapter(result.chapter), key: ch.key } : c)));
    } catch (err) {
      Swal.fire("Could not regenerate chapter", errorMessage(err), "error");
    } finally {
      setBusy((b) => ({ ...b, [ch.key]: false }));
    }
  };

  const regenTopic = async (ci, ti) => {
    const ch = chapters[ci];
    const tp = ch.topics[ti];
    setBusy((b) => ({ ...b, [tp.key]: true }));
    try {
      const { result } = await runAi(`/ai-course/${courseId}/outline-topic`, {
        ...payload(),
        chapterTitle: ch.title,
        currentTitle: tp.title,
        otherTopicTitles: ch.topics.filter((_, i) => i !== ti).map((t) => t.title),
      });
      updateTopic(ch.key, tp.key, { ...toEditableTopic(result.topic), key: tp.key });
    } catch (err) {
      Swal.fire("Could not regenerate lesson", errorMessage(err), "error");
    } finally {
      setBusy((b) => ({ ...b, [tp.key]: false }));
    }
  };

  const updateChapter = (key, patch) => setChapters((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const updateTopic = (chKey, tKey, patch) =>
    setChapters((cs) => cs.map((c) => (c.key === chKey ? { ...c, topics: c.topics.map((t) => (t.key === tKey ? { ...t, ...patch } : t)) } : c)));
  const removeChapter = async (key) => {
    const ch = chapters.find((c) => c.key === key);
    if (ch.topics.length) {
      const ok = await Swal.fire({ title: `Delete "${ch.title || "this chapter"}"?`, text: `Its ${ch.topics.length} lesson(s) will be removed from the outline.`, icon: "warning", showCancelButton: true, confirmButtonText: "Delete" });
      if (!ok.isConfirmed) return;
    }
    setChapters((cs) => cs.filter((c) => c.key !== key));
  };

  const save = async () => {
    const missing = chapters.some((c) => !c.title.trim() || c.topics.some((t) => !t.title.trim()));
    if (missing) return Swal.fire("Missing titles", "Every chapter and lesson needs a title.", "warning");
    if (!chapters.length) return Swal.fire("Nothing to save", "Add at least one chapter.", "info");
    const lessonCount = chapters.reduce((n, c) => n + c.topics.length, 0);
    const ok = await Swal.fire({
      title: "Save this structure to the course?",
      html: `<p>${chapters.length} chapter(s) and ${lessonCount} lesson(s) will be added to <b>${(inputs.courseTitle || courseName || "").replace(/</g, "&lt;")}</b>.</p>
             <p style="margin-top:8px;font-size:13px;color:#64748b">Chapters with the same title as an existing chapter are merged and duplicate lesson titles are skipped.
             Each lesson is created with an overview; open a lesson and use <b>Generate lesson content with AI</b> to write the full content.
             New chapters are visible to enrolled students, just like chapters added manually.</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save structure",
    });
    if (!ok.isConfirmed) return;
    setSaving(true);
    try {
      const { data } = await aiHttp.post(`/ai-course/${courseId}/save-structure`, {
        chapters: chapters.map((c) => ({
          title: c.title.trim(),
          description: c.description,
          objectives: lines(c.objectives),
          topics: c.topics.map((t) => ({ title: t.title.trim(), description: t.description, objectives: lines(t.objectives) })),
        })),
      });
      const s = data.summary;
      await Swal.fire(
        "Structure saved",
        `${s.chaptersCreated} chapter(s) created${s.chaptersMerged ? `, ${s.chaptersMerged} merged into existing chapters` : ""}; ${s.topicsCreated} lesson(s) created${s.topicsSkipped ? `, ${s.topicsSkipped} duplicate(s) skipped` : ""}.`,
        "success"
      );
      onSaved?.();
      onClose();
    } catch (err) {
      Swal.fire("Save failed", errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const anyBusy = Object.values(busy).some(Boolean);

  const footer =
    step === "review" ? (
      <>
        <Btn variant="ghost" className="mr-auto" onClick={() => setStep("inputs")}><FaArrowLeft /> Edit inputs</Btn>
        <Btn onClick={generateAll} disabled={saving || anyBusy}><FaSyncAlt /> Regenerate entire structure</Btn>
        <Btn variant="success" onClick={save} loading={saving} disabled={anyBusy}><FaSave /> Save generated structure</Btn>
      </>
    ) : step === "inputs" ? (
      <>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        {chapters.length > 0 && <Btn onClick={() => setStep("review")}>Back to review</Btn>}
        <Btn variant="ai" onClick={generateAll} disabled={loadingCourse}><FaMagic /> Generate chapters with AI</Btn>
      </>
    ) : null;

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="xl"
      title="AI Chapter Generator"
      subtitle={`${inputs.courseTitle || courseName || ""} · chapters and lessons are only saved after you confirm`}
      footer={footer}
      bodyClassName="p-6 bg-slate-50"
    >
      {step === "inputs" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {loadingCourse && <p className="md:col-span-2 flex items-center gap-2 text-sm text-slate-500"><Spinner className="h-4 w-4" /> Loading course details…</p>}
          <Field label="Course Title" required>
            <input className={inputCls} value={inputs.courseTitle} onChange={(e) => setInput("courseTitle", e.target.value)} />
          </Field>
          <Field label="Course Category">
            <input className={inputCls} value={inputs.category} onChange={(e) => setInput("category", e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Course Description" hint="Fetched from the course. Edit to guide the AI.">
              <textarea className={`${inputCls} min-h-[90px]`} value={inputs.courseDescription} onChange={(e) => setInput("courseDescription", e.target.value)} />
            </Field>
          </div>
          <Field label="Target Audience">
            <input className={inputCls} value={inputs.targetAudience} onChange={(e) => setInput("targetAudience", e.target.value)} placeholder="e.g. B.Com graduates and accounts executives" />
          </Field>
          <Field label="Course Level">
            <select className={inputCls} value={inputs.level} onChange={(e) => setInput("level", e.target.value)}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Chapters" hint="Maximum 10. Existing chapters are kept; AI only adds what is missing.">
            <select className={inputCls} value={inputs.totalChapters} onChange={(e) => setInput("totalChapters", e.target.value)}>
              <option value="0">Auto - AI decides (usually 6-9)</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Topics per chapter" hint="Maximum 10">
            <select className={inputCls} value={inputs.lessonsPerChapter} onChange={(e) => setInput("lessonsPerChapter", e.target.value)}>
              <option value="0">Auto - AI decides (usually 6-9)</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Learning Objectives" hint="One per line">
            <textarea className={`${inputCls} min-h-[90px]`} value={inputs.learningObjectives} onChange={(e) => setInput("learningObjectives", e.target.value)} placeholder={"File GST returns independently\nReconcile ITC with GSTR-2B"} />
          </Field>
          <Field label="Additional Instructions">
            <textarea className={`${inputCls} min-h-[90px]`} value={inputs.instructions} onChange={(e) => setInput("instructions", e.target.value)} placeholder="e.g. Include practical Tally examples and one revision chapter at the end." />
          </Field>
        </div>
      )}

      {step === "generating" && (
        <GeneratingPanel label="Reading the course and dividing it into chapters and topics" elapsed={formatElapsed(elapsed)} onCancel={() => (stopRef.current = true)} />
      )}

      {step === "review" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Review and edit the outline. Use the arrows to reorder, <FaSyncAlt className="inline" /> to regenerate a single chapter or lesson.
          </p>
          {chapters.map((ch, ci) => (
            <div key={ch.key} className={`rounded-xl border bg-white shadow-sm ${busy[ch.key] ? "opacity-60" : ""} border-slate-200`}>
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
                <button className="text-slate-500" onClick={() => updateChapter(ch.key, { open: !ch.open })} aria-label="Toggle chapter">
                  {ch.open ? <FaChevronDown /> : <FaChevronRight />}
                </button>
                <span className="text-xs font-bold uppercase text-blue-700">Chapter {ci + 1}</span>
                <input
                  className="min-w-[200px] flex-1 rounded-md border border-transparent px-2 py-1 text-base font-semibold text-slate-900 hover:border-slate-200 focus:border-blue-500 outline-none"
                  value={ch.title}
                  placeholder="Chapter title"
                  onChange={(e) => updateChapter(ch.key, { title: e.target.value })}
                />
                {existing.has(ch.title.trim().toLowerCase()) && <Badge className="border-amber-200 bg-amber-50 text-amber-700">Exists · lessons will be merged</Badge>}
                <span className="text-xs text-slate-400">{ch.topics.length} topics</span>
                <div className="ml-auto flex gap-1">
                  <Btn size="sm" variant="ghost" title="Move up" disabled={ci === 0} onClick={() => setChapters((cs) => move(cs, ci, ci - 1))}><FaArrowUp /></Btn>
                  <Btn size="sm" variant="ghost" title="Move down" disabled={ci === chapters.length - 1} onClick={() => setChapters((cs) => move(cs, ci, ci + 1))}><FaArrowDown /></Btn>
                  <Btn size="sm" variant="ghost" title="Regenerate chapter" loading={busy[ch.key]} onClick={() => regenChapter(ci)}>{!busy[ch.key] && <FaSyncAlt />}</Btn>
                  <Btn size="sm" variant="ghost" title="Delete chapter" className="text-red-600" onClick={() => removeChapter(ch.key)}><FaTrash /></Btn>
                </div>
              </div>
              {ch.open && (
                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <textarea className={`${inputCls} min-h-[70px]`} placeholder="Chapter description" value={ch.description} onChange={(e) => updateChapter(ch.key, { description: e.target.value })} />
                    <textarea className={`${inputCls} min-h-[70px]`} placeholder="Chapter learning objectives (one per line)" value={ch.objectives} onChange={(e) => updateChapter(ch.key, { objectives: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    {ch.topics.map((t, ti) => (
                      <div key={t.key} className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${busy[t.key] ? "opacity-60" : ""}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">Topic {ti + 1}</span>
                          <input
                            className="min-w-[180px] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium focus:border-blue-500 outline-none"
                            value={t.title}
                            placeholder="Lesson title"
                            onChange={(e) => updateTopic(ch.key, t.key, { title: e.target.value })}
                          />
                          <Btn size="sm" variant="ghost" disabled={ti === 0} title="Move up" onClick={() => updateChapter(ch.key, { topics: move(ch.topics, ti, ti - 1) })}><FaArrowUp /></Btn>
                          <Btn size="sm" variant="ghost" disabled={ti === ch.topics.length - 1} title="Move down" onClick={() => updateChapter(ch.key, { topics: move(ch.topics, ti, ti + 1) })}><FaArrowDown /></Btn>
                          <Btn size="sm" variant="ghost" title="Regenerate lesson" loading={busy[t.key]} onClick={() => regenTopic(ci, ti)}>{!busy[t.key] && <FaSyncAlt />}</Btn>
                          <Btn size="sm" variant="ghost" title="Delete lesson" className="text-red-600" onClick={() => updateChapter(ch.key, { topics: ch.topics.filter((x) => x.key !== t.key) })}><FaTrash /></Btn>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                          <textarea rows={2} className={`${inputCls} text-xs`} placeholder="Lesson description" value={t.description} onChange={(e) => updateTopic(ch.key, t.key, { description: e.target.value })} />
                          <textarea rows={2} className={`${inputCls} text-xs`} placeholder="Lesson learning objectives (one per line)" value={t.objectives} onChange={(e) => updateTopic(ch.key, t.key, { objectives: e.target.value })} />
                        </div>
                      </div>
                    ))}
                    <Btn size="sm" disabled={ch.topics.length >= 10} onClick={() => updateChapter(ch.key, { topics: [...ch.topics, toEditableTopic()] })}><FaPlus /> Add topic</Btn>
                  </div>
                </div>
              )}
            </div>
          ))}
          <Btn disabled={chapters.length + existingChapterTitles.length >= 10} onClick={() => setChapters((cs) => [...cs, toEditableChapter()])}><FaPlus /> Add chapter</Btn>
        </div>
      )}
    </Modal>
  );
}
