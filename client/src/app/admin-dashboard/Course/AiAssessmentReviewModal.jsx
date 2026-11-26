"use client";
// Preview / edit / validate one AI chapter assessment draft (assignment or quiz).
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FaPlus, FaTrash, FaSave, FaCheck, FaRobot } from "react-icons/fa";
import { Modal, Btn, Badge, inputCls } from "../../components/CourseEditor/ui";
import { aiHttp, errorMessage, formatDate } from "../../components/CourseEditor/aiClient";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const TYPES = [
  ["foundational", "Foundational knowledge"],
  ["conceptual", "Conceptual understanding"],
  ["practical", "Practical application"],
  ["analytical", "Analytical / scenario"],
];
const LETTERS = ["A", "B", "C", "D"];
const lines = (arr) => (arr || []).join("\n");
const toLines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
const clone = (x) => JSON.parse(JSON.stringify(x || {}));

// Readable styling for generated HTML (headings, lists, tables)
const HTML_CLS =
  "text-sm leading-relaxed text-slate-700 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1";

const Label = ({ children }) => <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{children}</span>;
const TextField = ({ label, value, onChange, rows = 0, placeholder }) => (
  <label className="block">
    <Label>{label}</Label>
    {rows ? (
      <textarea rows={rows} className={`${inputCls} text-sm`} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className={`${inputCls} py-2`} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    )}
  </label>
);

// ---------------------------------------------------------------------------
// Assignment editor
// ---------------------------------------------------------------------------
const datasetToText = (t) => [t.columns.join(" | "), ...t.rows.map((r) => r.join(" | "))].join("\n");
const textToDataset = (title, description, text) => {
  const [head, ...rest] = String(text || "").split("\n").filter((l) => l.trim());
  const columns = (head || "").split("|").map((c) => c.trim()).filter(Boolean);
  return { title, description, columns, rows: rest.map((l) => columns.map((_, i) => (l.split("|")[i] || "").trim())) };
};

function AssignmentEditor({ draft, setDraft, topics }) {
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const guide = draft.instructorGuide || {};
  const setGuide = (patch) => set({ instructorGuide: { ...guide, ...patch } });
  const marks = (draft.assessmentCriteria || []).reduce((s, c) => s + (Number(c.marks) || 0), 0);
  return (
    <div className="space-y-4">
      <TextField label="Assignment title" value={draft.title} onChange={(v) => set({ title: v })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <Label>Difficulty</Label>
          <select className={`${inputCls} py-2`} value={draft.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
            {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <TextField label="Estimated completion time" value={draft.estimatedTime} onChange={(v) => set({ estimatedTime: v })} />
      </div>
      <TextField label="Assignment overview" rows={3} value={draft.overview} onChange={(v) => set({ overview: v })} />
      <TextField label="Learning objectives (one per line)" rows={4} value={lines(draft.learningObjectives)} onChange={(v) => set({ learningObjectives: toLines(v) })} />
      <TextField label="Scenario / case study title" value={draft.scenario?.title} onChange={(v) => set({ scenario: { ...draft.scenario, title: v } })} />
      <TextField label="Scenario background (Markdown)" rows={6} value={draft.scenario?.background} onChange={(v) => set({ scenario: { ...draft.scenario, background: v } })} />
      <TextField label="Required information (Markdown)" rows={4} value={draft.requiredInformation} onChange={(v) => set({ requiredInformation: v })} />

      <div>
        <Label>Datasets (first line = columns, separate cells with |)</Label>
        {(draft.datasets || []).map((t, i) => (
          <div key={i} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex gap-2">
              <input className={`${inputCls} py-1.5`} value={t.title} onChange={(e) => set({ datasets: draft.datasets.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
              <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => set({ datasets: draft.datasets.filter((_, k) => k !== i) })}><FaTrash /></Btn>
            </div>
            <textarea
              rows={Math.min(14, t.rows.length + 2)}
              className={`${inputCls} font-mono text-xs`}
              defaultValue={datasetToText(t)}
              onBlur={(e) => set({ datasets: draft.datasets.map((x, k) => (k === i ? textToDataset(x.title, x.description, e.target.value) : x)) })}
            />
          </div>
        ))}
        <Btn size="sm" onClick={() => set({ datasets: [...(draft.datasets || []), { title: "Dataset", description: "", columns: ["Column 1", "Column 2"], rows: [["", ""]] }] })}>
          <FaPlus /> Add dataset
        </Btn>
      </div>

      <div>
        <Label>Tasks to complete</Label>
        {(draft.tasks || []).map((t, i) => (
          <div key={i} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex gap-2">
              <input className={`${inputCls} py-1.5`} value={t.title} onChange={(e) => set({ tasks: draft.tasks.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
              <select className={`${inputCls} max-w-[240px] py-1.5`} value={t.topic || ""} onChange={(e) => set({ tasks: draft.tasks.map((x, k) => (k === i ? { ...x, topic: e.target.value } : x)) })}>
                <option value="">Topic…</option>
                {topics.map((tp) => <option key={tp._id} value={tp.title}>{tp.title}</option>)}
              </select>
              <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => set({ tasks: draft.tasks.filter((_, k) => k !== i) })}><FaTrash /></Btn>
            </div>
            <textarea rows={4} className={`${inputCls} text-sm`} value={t.description} onChange={(e) => set({ tasks: draft.tasks.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)) })} />
          </div>
        ))}
        <Btn size="sm" onClick={() => set({ tasks: [...(draft.tasks || []), { title: "New task", description: "", topic: "" }] })}><FaPlus /> Add task</Btn>
      </div>

      <TextField label="Step-by-step instructions (one per line)" rows={6} value={lines(draft.instructions)} onChange={(v) => set({ instructions: toLines(v) })} />
      <TextField label="Expected deliverables (one per line)" rows={3} value={lines(draft.deliverables)} onChange={(v) => set({ deliverables: toLines(v) })} />
      <TextField label="Expected learning outcomes (one per line)" rows={3} value={lines(draft.learningOutcomes)} onChange={(v) => set({ learningOutcomes: toLines(v) })} />

      <div>
        <Label>Assessment criteria ({marks} / 100 marks)</Label>
        {(draft.assessmentCriteria || []).map((c, i) => (
          <div key={i} className="mb-2 grid grid-cols-[1fr_2fr_80px_auto] gap-2">
            <input className={`${inputCls} py-1.5`} value={c.criterion} onChange={(e) => set({ assessmentCriteria: draft.assessmentCriteria.map((x, k) => (k === i ? { ...x, criterion: e.target.value } : x)) })} />
            <input className={`${inputCls} py-1.5`} value={c.description} onChange={(e) => set({ assessmentCriteria: draft.assessmentCriteria.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)) })} />
            <input type="number" className={`${inputCls} py-1.5`} value={c.marks} onChange={(e) => set({ assessmentCriteria: draft.assessmentCriteria.map((x, k) => (k === i ? { ...x, marks: Number(e.target.value) } : x)) })} />
            <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => set({ assessmentCriteria: draft.assessmentCriteria.filter((_, k) => k !== i) })}><FaTrash /></Btn>
          </div>
        ))}
        <Btn size="sm" onClick={() => set({ assessmentCriteria: [...(draft.assessmentCriteria || []), { criterion: "", description: "", marks: 0 }] })}><FaPlus /> Add criterion</Btn>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="mb-2 text-sm font-bold text-amber-900">Instructor guide (never shown to students)</p>
        <div className="space-y-3">
          <TextField label="Reference solution (Markdown)" rows={6} value={guide.solutionOverview} onChange={(v) => setGuide({ solutionOverview: v })} />
          <TextField label="Expected results (one per line)" rows={3} value={lines(guide.expectedResults)} onChange={(v) => setGuide({ expectedResults: toLines(v) })} />
          <TextField label="Evaluation guidelines (one per line)" rows={3} value={lines(guide.evaluationGuidelines)} onChange={(v) => setGuide({ evaluationGuidelines: toLines(v) })} />
          <TextField label="Common mistakes (one per line)" rows={3} value={lines(guide.commonMistakes)} onChange={(v) => setGuide({ commonMistakes: toLines(v) })} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz editor
// ---------------------------------------------------------------------------
function QuizEditor({ draft, setDraft, topics }) {
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setQ = (i, patch) => set({ questions: draft.questions.map((q, k) => (k === i ? { ...q, ...patch } : q)) });
  return (
    <div className="space-y-4">
      <TextField label="Quiz title" value={draft.title} onChange={(v) => set({ title: v })} />
      <TextField label="Description" rows={2} value={draft.description} onChange={(v) => set({ description: v })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Passing score (%)" value={draft.passingScore} onChange={(v) => set({ passingScore: Number(v) || "" })} />
        <TextField label="Suggested time (minutes)" value={draft.timeLimit} onChange={(v) => set({ timeLimit: Number(v) || "" })} />
      </div>
      {draft.questions.map((q, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700">Q{i + 1}</span>
            <select className={`${inputCls} max-w-[150px] py-1`} value={q.difficulty} onChange={(e) => setQ(i, { difficulty: e.target.value })}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select className={`${inputCls} max-w-[210px] py-1`} value={q.type} onChange={(e) => setQ(i, { type: e.target.value })}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className={`${inputCls} min-w-0 flex-1 py-1`} value={q.topic} onChange={(e) => setQ(i, { topic: e.target.value })}>
              {!topics.some((t) => t.title === q.topic) && <option value={q.topic}>{q.topic || "Topic…"}</option>}
              {topics.map((t) => <option key={t._id} value={t.title}>{t.title}</option>)}
            </select>
            <Btn size="sm" variant="ghost" className="text-red-600" title="Delete question" onClick={() => set({ questions: draft.questions.filter((_, k) => k !== i) })}><FaTrash /></Btn>
          </div>
          <textarea rows={2} className={`${inputCls} text-sm font-medium`} value={q.question} onChange={(e) => setQ(i, { question: e.target.value })} />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {q.options.map((o, k) => (
              <label key={k} className={`flex items-center gap-2 rounded-lg border px-2 py-1 ${Number(q.answer) === k ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
                <input type="radio" name={`ans-${i}`} checked={Number(q.answer) === k} onChange={() => setQ(i, { answer: k })} title="Correct answer" />
                <span className="text-xs font-bold text-slate-500">{LETTERS[k]}</span>
                <input className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none" value={o} onChange={(e) => setQ(i, { options: q.options.map((x, m) => (m === k ? e.target.value : x)) })} />
              </label>
            ))}
          </div>
          <textarea rows={2} className={`${inputCls} mt-2 text-xs`} placeholder="Explanation" value={q.explanation} onChange={(e) => setQ(i, { explanation: e.target.value })} />
        </div>
      ))}
      <Btn
        size="sm"
        onClick={() =>
          set({ questions: [...draft.questions, { question: "", options: ["", "", "", ""], answer: 0, explanation: "", difficulty: "Beginner", type: "conceptual", topic: topics[0]?.title || "" }] })
        }
      >
        <FaPlus /> Add question
      </Btn>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview + validation
// ---------------------------------------------------------------------------
function QuizPreview({ draft }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{draft.description}</p>
      <p className="text-xs text-slate-500">
        {draft.questions.length} questions · pass {draft.passingScore}% · {draft.timeLimit} min. Students see the answers and explanations only after submitting.
      </p>
      {draft.questions.map((q, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="font-medium text-slate-900">{i + 1}. {q.question}</p>
          <ul className="mt-2 space-y-1">
            {q.options.map((o, k) => (
              <li key={k} className={`rounded-md px-2 py-1 text-sm ${k === Number(q.answer) ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-700"}`}>
                {LETTERS[k]}. {o} {k === Number(q.answer) && "✓"}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-600"><strong>Explanation:</strong> {q.explanation}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge className="border-slate-200 bg-slate-50 text-slate-600">{q.difficulty}</Badge>
            <Badge className="border-slate-200 bg-slate-50 text-slate-600">{(TYPES.find(([v]) => v === q.type) || [, q.type])[1]}</Badge>
            <Badge className="border-blue-200 bg-blue-50 normal-case text-blue-700">{q.topic}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function ValidationView({ item, onAiReview, reviewing }) {
  const v = item.validation || {};
  const r = v.aiReview;
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-semibold text-slate-900">Automatic checks</p>
        {v.warnings?.length ? (
          <ul className="mt-1 list-disc pl-5 text-amber-800">{v.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        ) : (
          <p className="mt-1 text-emerald-700">No issues found by the automatic checks.</p>
        )}
      </div>
      {v.coverage && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Questions per topic</p>
            {v.coverage.byTopic.map((t) => (
              <p key={t.topic} className={`flex justify-between gap-2 text-xs ${t.count ? "" : "text-red-600"}`}><span className="truncate">{t.topic}</span><span>{t.count}</span></p>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Question types</p>
            {Object.entries(v.coverage.byType || {}).map(([k, n]) => <p key={k} className="flex justify-between text-xs"><span>{k}</span><span>{n}</span></p>)}
            <p className="mt-2 text-xs font-bold uppercase text-slate-500">Difficulty</p>
            {Object.entries(v.coverage.byDifficulty || {}).map(([k, n]) => <p key={k} className="flex justify-between text-xs"><span>{k}</span><span>{n}</span></p>)}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Correct answer position</p>
            {LETTERS.map((l, i) => <p key={l} className="flex justify-between text-xs"><span>{l}</span><span>{v.coverage.answerPositions?.[i] || 0}</span></p>)}
          </div>
        </div>
      )}
      {!!v.rejected?.length && (
        <details className="rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-semibold text-slate-700">{v.rejected.length} AI question(s) rejected by validation</summary>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">{v.rejected.map((x, i) => <li key={i}><strong>{x.reason}</strong> — {x.question}</li>)}</ul>
        </details>
      )}
      {!!item.draft?.verifyItems?.length && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="font-semibold text-amber-900">Verify before publishing</p>
          <ul className="mt-1 list-disc pl-5 text-xs text-amber-900">{item.draft.verifyItems.map((x, i) => <li key={i}>{x.item}{x.source ? ` (${x.source})` : ""}</li>)}</ul>
        </div>
      )}
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-violet-900">AI quality review (accuracy, relevance, ambiguity)</p>
          <Btn size="sm" variant="ai" loading={reviewing || r?.running} onClick={onAiReview}><FaRobot /> {r && !r.running ? "Run again" : "Run AI review"}</Btn>
        </div>
        {r?.running && <p className="mt-2 text-xs text-violet-700">Reviewing… this can take a minute.</p>}
        {r?.error && <p className="mt-2 text-xs text-red-700">{r.error}</p>}
        {r && !r.running && !r.error && (
          <div className="mt-2">
            <p className="text-xs text-slate-700"><strong>Score {r.score}/100.</strong> {r.summary} <span className="text-slate-400">({formatDate(r.reviewedAt)})</span></p>
            <ul className="mt-2 space-y-1">
              {(r.issues || []).map((x, i) => (
                <li key={i} className="rounded-md bg-white p-2 text-xs">
                  <Badge className={x.severity === "high" ? "border-red-200 bg-red-50 text-red-700" : x.severity === "medium" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{x.severity}</Badge>{" "}
                  <strong>{x.location}:</strong> {x.problem} <em className="text-slate-500">→ {x.suggestion}</em>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiAssessmentReviewModal({ item, topics, canEdit, onClose, onChanged, onPublish }) {
  const [tab, setTab] = useState("preview");
  const [draft, setDraft] = useState(() => clone(item.draft));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const isQuiz = item.kind === "quiz";

  // Keep in sync with polling unless the admin is editing
  useEffect(() => {
    if (!dirty) setDraft(clone(item.draft));
  }, [item.draft, dirty]);

  const setDraftDirty = (fn) => {
    setDirty(true);
    setDraft(fn);
  };

  const save = async () => {
    setSaving(true);
    try {
      await aiHttp.put(`/ai-assessments/${item._id}/draft`, { draft });
      setDirty(false);
      await onChanged?.();
      Swal.fire({ toast: true, position: "top-end", timer: 2500, showConfirmButton: false, icon: "success", title: "Draft saved (Under Review)" });
      return true;
    } catch (err) {
      Swal.fire("Could not save", errorMessage(err), "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const aiReview = async () => {
    if (dirty && !(await save())) return;
    setReviewing(true);
    try {
      await aiHttp.post(`/ai-assessments/${item._id}/review`);
      await onChanged?.();
    } catch (err) {
      Swal.fire("AI review not started", errorMessage(err), "error");
    } finally {
      setReviewing(false);
    }
  };

  const close = async () => {
    if (dirty && !(await Swal.fire({ title: "Discard unsaved edits?", icon: "warning", showCancelButton: true, confirmButtonText: "Discard" })).isConfirmed) return;
    onClose();
  };

  const tabs = useMemo(() => [["preview", "Preview"], ...(canEdit ? [["edit", "Edit"]] : []), ["validation", "Validation"]], [canEdit]);

  const footer = (
    <>
      <Btn variant="ghost" className="mr-auto" onClick={close}>Close</Btn>
      {canEdit && (
        <Btn onClick={save} loading={saving} disabled={!dirty}>
          <FaSave /> Save draft
        </Btn>
      )}
      {canEdit && (
        <Btn
          variant="success"
          disabled={saving}
          onClick={async () => {
            if (dirty && !(await save())) return;
            onPublish(item);
          }}
        >
          <FaCheck /> {item.isLive ? "Publish this draft" : "Approve & Publish"}
        </Btn>
      )}
    </>
  );

  return (
    <Modal
      open
      onClose={close}
      size="xl"
      title={draft.title || (isQuiz ? "Chapter quiz" : "Practical assignment")}
      subtitle={`${isQuiz ? "Chapter Assessment Quiz" : "Practical Assignment"} · ${item.status === "review" ? "Under Review" : item.status}${item.isLive ? " · a version is live for students" : ""}`}
      footer={footer}
      bodyClassName="p-0 bg-slate-50"
    >
      <div className="sticky top-0 z-10 flex gap-1 border-b border-slate-200 bg-white px-4">
        {tabs.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === k ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {l}
            {k === "validation" && item.validation?.warnings?.length ? ` (${item.validation.warnings.length})` : ""}
          </button>
        ))}
        {dirty && <span className="ml-auto self-center text-xs font-semibold text-orange-600">Unsaved changes</span>}
      </div>
      <div className="p-5">
        {tab === "preview" &&
          (isQuiz ? (
            <QuizPreview draft={draft} />
          ) : (
            <div className="space-y-4">
              {dirty && <p className="rounded-md bg-orange-50 p-2 text-xs text-orange-700">Preview shows the last saved draft. Save to refresh it.</p>}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-bold text-slate-900">{item.draft?.title}</h2>
                <div className={HTML_CLS} dangerouslySetInnerHTML={{ __html: item.previewHtml || "" }} />
              </div>
              {item.draft?.instructorGuide && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">
                  <p className="font-bold text-amber-900">Instructor guide (hidden from students)</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-800">{item.draft.instructorGuide.solutionOverview}</p>
                  {[["Expected results", "expectedResults"], ["Evaluation guidelines", "evaluationGuidelines"], ["Common mistakes", "commonMistakes"]].map(([l, k]) =>
                    item.draft.instructorGuide[k]?.length ? (
                      <div key={k} className="mt-2">
                        <p className="font-semibold text-amber-900">{l}</p>
                        <ul className="list-disc pl-5">{item.draft.instructorGuide[k].map((x, i) => <li key={i}>{x}</li>)}</ul>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          ))}
        {tab === "edit" &&
          (isQuiz ? <QuizEditor draft={draft} setDraft={setDraftDirty} topics={topics} /> : <AssignmentEditor draft={draft} setDraft={setDraftDirty} topics={topics} />)}
        {tab === "validation" && <ValidationView item={item} onAiReview={aiReview} reviewing={reviewing} />}
      </div>
    </Modal>
  );
}
