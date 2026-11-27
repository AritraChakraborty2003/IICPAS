"use client";
// AI chapter assessments for one chapter: a practical assignment and a chapter
// assessment quiz (20+ questions), generated from the chapter's topics.
// Generated content stays a draft (hidden from students) until "Approve & Publish".
import React, { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { FaMagic, FaSyncAlt, FaEye, FaCheck, FaRedo, FaEyeSlash, FaClipboardCheck } from "react-icons/fa";
import { Btn, Badge, inputCls } from "../../components/CourseEditor/ui";
import { aiHttp, errorMessage, formatDate } from "../../components/CourseEditor/aiClient";
import AiAssessmentReviewModal from "./AiAssessmentReviewModal";

const STATUS = {
  none: { label: "Not generated", cls: "border-slate-200 bg-slate-50 text-slate-600" },
  pending: { label: "Pending", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  generating: { label: "Generating", cls: "border-violet-200 bg-violet-50 text-violet-700" },
  generated: { label: "Generated", cls: "border-blue-200 bg-blue-50 text-blue-700" },
  review: { label: "Under Review", cls: "border-orange-200 bg-orange-50 text-orange-700" },
  published: { label: "Published", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  failed: { label: "Failed", cls: "border-red-200 bg-red-50 text-red-700" },
};
const KIND_LABEL = { assignment: "Practical Assignment", quiz: "Chapter Assessment Quiz" };
const RUNNING = ["pending", "generating"];

export const confirmAction = async (title, text, confirmButtonText = "Continue") =>
  (await Swal.fire({ title, text, icon: "question", showCancelButton: true, confirmButtonText })).isConfirmed;

export default function ChapterAiAssessmentsPanel({ chapterId, canEdit = true, refreshKey = 0, onPublished }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [instructions, setInstructions] = useState("");
  const [reviewKind, setReviewKind] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await aiHttp.get(`/ai-assessments/chapter/${chapterId}`);
      setData(res);
      setError("");
      return res;
    } catch (err) {
      setError(errorMessage(err, "Could not load AI assessments."));
      return null;
    }
  }, [chapterId]);

  // Poll while something is generating (also picks up automatic generation)
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      const res = await load();
      if (stopped) return;
      const running = res && ["assignment", "quiz"].some((k) => RUNNING.includes(res[k]?.status) || res[k]?.validation?.aiReview?.running);
      timer.current = setTimeout(tick, running ? 5000 : 30000);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer.current);
    };
  }, [load, refreshKey]);

  const generate = async (kinds, { confirmText } = {}) => {
    if (confirmText && !(await confirmAction("Regenerate with AI?", confirmText, "Regenerate"))) return;
    setBusy(kinds.join(","));
    try {
      const { data: res } = await aiHttp.post(`/ai-assessments/chapter/${chapterId}/generate`, {
        kinds,
        difficulty: difficulty || undefined,
        instructions,
      });
      setData(res);
      const skipped = (res.results || []).filter((r) => !r.started);
      if (skipped.length) {
        Swal.fire({ toast: true, position: "top-end", timer: 3500, showConfirmButton: false, icon: "info", title: skipped.map((r) => `${KIND_LABEL[r.kind]}: ${r.reason}`).join(" · ") });
      }
      clearTimeout(timer.current);
      timer.current = setTimeout(load, 4000);
    } catch (err) {
      Swal.fire("Generation not started", errorMessage(err), "error");
    } finally {
      setBusy("");
    }
  };

  const publish = async (item) => {
    const warn = item.liveEditedSincePublish
      ? "The published copy was edited in the Assignment editor after it was published. Publishing this draft replaces those edits."
      : item.kind === "quiz"
      ? `Publish "${item.draft?.title}" (${item.draft?.questions?.length} questions) to students?`
      : `Publish "${item.draft?.title}" to students?`;
    if (!(await confirmAction("Approve and publish?", warn, "Publish"))) return false;
    setBusy(`publish:${item.kind}`);
    try {
      await aiHttp.post(`/ai-assessments/${item._id}/publish`);
      await load();
      onPublished?.();
      Swal.fire({ toast: true, position: "top-end", timer: 3000, showConfirmButton: false, icon: "success", title: "Published to students" });
      return true;
    } catch (err) {
      Swal.fire("Publish failed", errorMessage(err), "error");
      return false;
    } finally {
      setBusy("");
    }
  };

  const unpublish = async (item) => {
    if (!(await confirmAction("Hide from students?", "Students will no longer see this item. Their past completion is kept.", "Unpublish"))) return;
    setBusy(`unpublish:${item.kind}`);
    try {
      await aiHttp.post(`/ai-assessments/${item._id}/unpublish`);
      await load();
      onPublished?.();
    } catch (err) {
      Swal.fire("Unpublish failed", errorMessage(err), "error");
    } finally {
      setBusy("");
    }
  };

  if (!data) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        {error || "Loading AI assessments…"}
      </div>
    );
  }

  const topicCount = data.chapter?.topicCount || 0;
  const anyRunning = ["assignment", "quiz"].some((k) => RUNNING.includes(data[k]?.status));

  const card = (kind) => {
    const item = data[kind];
    const status = item?.status || "none";
    const s = STATUS[status] || STATUS.none;
    const running = RUNNING.includes(status);
    const hasDraft = !!item?.draft;
    const summary =
      kind === "quiz"
        ? hasDraft
          ? `${item.draft.questions.length} questions · ${Object.entries(item.validation?.coverage?.byDifficulty || {}).map(([k, v]) => `${v} ${k}`).join(", ")}`
          : "20+ MCQs with explanations, balanced across topics"
        : hasDraft
        ? `${item.draft.difficulty} · ${item.draft.estimatedTime} · ${item.draft.tasks.length} tasks`
        : "Scenario, dataset, tasks, deliverables, rubric and instructor guide";
    return (
      <div key={kind} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{KIND_LABEL[kind]}</p>
            <p className="mt-1 truncate font-semibold text-slate-900" title={hasDraft ? item.draft.title : item?.title}>
              {hasDraft ? item.draft.title : item?.title || "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{summary}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge className={s.cls}>{running ? <span className="animate-pulse">{s.label}…</span> : s.label}</Badge>
            {item?.isLive && status !== "published" && <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Live</Badge>}
          </div>
        </div>

        {status === "failed" && item?.error && <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{item.error}</p>}
        {item?.topicsChanged && !running && (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">The chapter topics changed since this was generated. Regenerate to include them.</p>
        )}
        {!!item?.validation?.warnings?.length && hasDraft && (
          <p className="mt-2 text-xs text-amber-700">⚠ {item.validation.warnings.length} validation note(s) - open Preview to review.</p>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          {item?.generatedAt ? `Generated ${formatDate(item.generatedAt)}` : ""}
          {item?.publishedAt ? ` · Published ${formatDate(item.publishedAt)}` : ""}
          {item?.trigger === "auto" && item?.generatedAt ? " · automatic" : ""}
        </p>

        {canEdit && (
          <div className="mt-3 flex flex-wrap gap-2">
            {!item || (!hasDraft && !running) ? (
              <Btn size="sm" variant="ai" loading={busy === kind} disabled={!topicCount || running} onClick={() => generate([kind])}>
                {status === "failed" ? <><FaRedo /> Retry</> : <><FaMagic /> Generate {kind === "quiz" ? "Quiz" : "Assignment"} with AI</>}
              </Btn>
            ) : (
              <>
                <Btn size="sm" disabled={!hasDraft || running} onClick={() => setReviewKind(kind)}>
                  <FaEye /> Preview &amp; Edit
                </Btn>
                {hasDraft && !running && status !== "published" && (
                  <Btn size="sm" variant="success" loading={busy === `publish:${kind}`} onClick={() => publish(item)}>
                    <FaCheck /> Approve &amp; Publish
                  </Btn>
                )}
                <Btn
                  size="sm"
                  variant="ghost"
                  loading={busy === kind}
                  disabled={running || !topicCount}
                  onClick={() =>
                    generate([kind], {
                      confirmText:
                        status === "failed"
                          ? undefined
                          : item.isLive
                          ? "A new draft is generated. The published version stays visible to students until you publish the new draft."
                          : status === "review"
                          ? "Your edits to this draft will be replaced by newly generated content."
                          : "The current draft will be replaced.",
                    })
                  }
                >
                  {status === "failed" ? <><FaRedo /> Retry</> : <><FaSyncAlt /> Regenerate</>}
                </Btn>
                {item.isLive && (
                  <Btn size="sm" variant="ghost" className="text-red-600" loading={busy === `unpublish:${kind}`} onClick={() => unpublish(item)}>
                    <FaEyeSlash /> Unpublish
                  </Btn>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/60 to-blue-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FaClipboardCheck className="text-violet-600" /> AI Chapter Assessments
          </h3>
          <p className="text-xs text-slate-500">
            Generated from this chapter&apos;s {topicCount} topic(s). Drafts are hidden from students until you approve and publish them.
            {data.autoGeneration ? " Runs automatically after AI topics are saved." : ""}
          </p>
        </div>
        {canEdit && (
          <Btn
            variant="ai"
            loading={busy === "assignment,quiz"}
            disabled={!topicCount || anyRunning}
            onClick={() =>
              generate(["assignment", "quiz"], {
                confirmText: data.assignment?.draft || data.quiz?.draft ? "Existing drafts are replaced. Published versions stay visible until you publish the new drafts." : undefined,
              })
            }
          >
            <FaMagic /> Generate All Chapter Content
          </Btn>
        )}
      </div>

      {canEdit && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[200px_1fr]">
          <select className={`${inputCls} py-2`} value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Difficulty">
            <option value="">Difficulty: automatic</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <input
            className={`${inputCls} py-2`}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions for AI (optional), e.g. use a Surat textile trader; include TallyPrime vouchers"
          />
        </div>
      )}

      {!topicCount && <p className="mt-3 text-sm text-amber-700">Add or generate topics for this chapter first.</p>}

      <div className="mt-3 grid gap-3 md:grid-cols-2">{["assignment", "quiz"].map(card)}</div>

      {reviewKind && data[reviewKind] && (
        <AiAssessmentReviewModal
          item={data[reviewKind]}
          topics={data.chapter?.topics || []}
          canEdit={canEdit}
          onClose={() => setReviewKind(null)}
          onChanged={load}
          onPublish={async (item) => {
            const ok = await publish(item);
            if (ok) setReviewKind(null);
          }}
        />
      )}
    </div>
  );
}
