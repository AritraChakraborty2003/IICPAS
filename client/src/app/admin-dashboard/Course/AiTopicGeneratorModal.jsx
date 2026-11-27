"use client";
// AI Topic Generator: divides one chapter into topics (usually 6-9, max 10)
// using the course + chapter context. Starts automatically when opened; the
// admin reviews / edits / reorders, and topics are only created on Save.
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { FaArrowUp, FaArrowDown, FaTrash, FaPlus, FaSyncAlt, FaMagic, FaSave } from "react-icons/fa";
import { Modal, Btn, GeneratingPanel, inputCls } from "../../components/CourseEditor/ui";
import { aiHttp, runAi, errorMessage, formatElapsed } from "../../components/CourseEditor/aiClient";

const MAX_TOPICS = 10;
let keySeq = 0;
const toEditable = (t = {}) => ({
  key: `t${(keySeq += 1)}`,
  title: t.title || "",
  description: t.description || "",
  objectives: (t.objectives || []).join("\n"),
});
const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default function AiTopicGeneratorModal({ open, onClose, chapterId, chapterName, existingTopicTitles = [], onSaved }) {
  const [step, setStep] = useState("generating"); // generating | review | error
  const [topics, setTopics] = useState([]);
  const [count, setCount] = useState("0");
  const [instructions, setInstructions] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const stopRef = useRef(false);
  const room = Math.max(0, MAX_TOPICS - existingTopicTitles.length);

  const generate = async () => {
    stopRef.current = false;
    setStep("generating");
    setElapsed(0);
    setError("");
    try {
      const { result } = await runAi(
        `/ai-course/chapter/${chapterId}/topics`,
        { count: Number(count), instructions },
        { onTick: (_j, ms) => setElapsed(ms), shouldStop: () => stopRef.current }
      );
      setTopics((result.topics || []).slice(0, room).map(toEditable));
      setStep("review");
    } catch (err) {
      if (stopRef.current) {
        setStep(topics.length ? "review" : "error");
        setError("Generation stopped.");
        return;
      }
      setError(errorMessage(err));
      setStep("error");
    }
  };

  // Start right away when opened
  useEffect(() => {
    if (!open) return undefined;
    setTopics([]);
    if (room > 0) generate();
    else {
      setError(`This chapter already has ${existingTopicTitles.length} topics (maximum ${MAX_TOPICS}).`);
      setStep("error");
    }
    return () => {
      stopRef.current = true;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (key, patch) => setTopics((ts) => ts.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  const save = async () => {
    const list = topics.filter((t) => t.title.trim());
    if (!list.length) return Swal.fire("Nothing to save", "Add at least one topic.", "info");
    setSaving(true);
    try {
      const { data } = await aiHttp.post(`/ai-course/chapter/${chapterId}/save-topics`, {
        topics: list.map((t) => ({
          title: t.title.trim(),
          description: t.description,
          objectives: t.objectives.split("\n").map((x) => x.trim()).filter(Boolean),
        })),
      });
      const s = data.summary || {};
      Swal.fire({
        toast: true,
        position: "top-end",
        timer: 3500,
        showConfirmButton: false,
        icon: "success",
        title: `${s.topicsCreated} topic(s) created${s.topicsSkipped ? `, ${s.topicsSkipped} skipped` : ""}`,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      Swal.fire("Save failed", errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const footer =
    step === "generating" ? null : (
      <>
        <Btn variant="ghost" className="mr-auto" onClick={onClose}>Cancel</Btn>
        {room > 0 && (
          <Btn onClick={generate} disabled={saving}>
            {step === "review" ? <><FaSyncAlt /> Regenerate topics</> : <><FaMagic /> Generate topics</>}
          </Btn>
        )}
        {step === "review" && (
          <Btn variant="success" onClick={save} loading={saving}>
            <FaSave /> Save {topics.filter((t) => t.title.trim()).length} topics
          </Btn>
        )}
      </>
    );

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="lg"
      title="AI Topic Generator"
      subtitle={`${chapterName} · topics are created only after you save`}
      footer={footer}
      bodyClassName="p-6 bg-slate-50"
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-[220px_1fr]">
        <label className="text-sm font-semibold text-slate-700">
          Topics
          <select className={`${inputCls} mt-1`} value={count} onChange={(e) => setCount(e.target.value)} disabled={step === "generating"}>
            <option value="0">Auto - AI decides (usually 6-9)</option>
            {Array.from({ length: room }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Instructions for AI (optional)
          <input
            className={`${inputCls} mt-1`}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. focus on TallyPrime practice, include one revision topic"
            disabled={step === "generating"}
          />
        </label>
      </div>

      {existingTopicTitles.length > 0 && (
        <p className="mb-3 text-xs text-slate-500">
          This chapter already has {existingTopicTitles.length} topic(s); AI adds only what is missing (max {MAX_TOPICS} in total).
        </p>
      )}

      {step === "generating" && (
        <GeneratingPanel label="Dividing the chapter into topics" elapsed={formatElapsed(elapsed)} onCancel={() => (stopRef.current = true)} />
      )}

      {step === "error" && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      {step === "review" && (
        <div className="space-y-2">
          {topics.map((t, i) => (
            <div key={t.key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-16 text-xs font-bold uppercase text-blue-700">Topic {existingTopicTitles.length + i + 1}</span>
                <input
                  className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm font-semibold outline-none focus:border-blue-500"
                  value={t.title}
                  onChange={(e) => update(t.key, { title: e.target.value })}
                  placeholder="Topic title"
                />
                <Btn size="sm" variant="ghost" disabled={i === 0} title="Move up" onClick={() => setTopics((ts) => move(ts, i, i - 1))}><FaArrowUp /></Btn>
                <Btn size="sm" variant="ghost" disabled={i === topics.length - 1} title="Move down" onClick={() => setTopics((ts) => move(ts, i, i + 1))}><FaArrowDown /></Btn>
                <Btn size="sm" variant="ghost" className="text-red-600" title="Remove" onClick={() => setTopics((ts) => ts.filter((x) => x.key !== t.key))}><FaTrash /></Btn>
              </div>
              <textarea
                rows={2}
                className={`${inputCls} mt-2 text-xs`}
                value={t.description}
                onChange={(e) => update(t.key, { description: e.target.value })}
                placeholder="Short description"
              />
            </div>
          ))}
          <Btn size="sm" disabled={topics.length >= room} onClick={() => setTopics((ts) => [...ts, toEditable()])}>
            <FaPlus /> Add topic
          </Btn>
          <p className="pt-2 text-xs text-slate-500">
            Each topic is created with a short overview. Open a topic and click “Generate with AI” to write the full lesson content.
          </p>
        </div>
      )}
    </Modal>
  );
}
