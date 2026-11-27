"use client";
// AI result preview, Review (proofing + readability), version history,
// review notes and the Present (slide) mode of the editor.
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Btn, GeneratingPanel, Badge, inputCls } from "./ui";
import { formatDateTime, countStats } from "./editorCore";
import { DEFAULT_CONTENT_FONT_FAMILY, normalizeDigitalHubContentHtml } from "../../utils/contentFontFamily";

const Rendered = ({ html, className = "" }) => (
  <div
    className={`digital-hub-content topic-content-light rounded-xl border border-slate-200 bg-white p-5 leading-relaxed text-slate-900 ${className}`}
    style={{ fontFamily: DEFAULT_CONTENT_FONT_FAMILY }}
    dangerouslySetInnerHTML={{ __html: normalizeDigitalHubContentHtml(html || "", DEFAULT_CONTENT_FONT_FAMILY) }}
  />
);

// ---------------------------------------------------------------------------
// AI result: review before anything touches the document
// ---------------------------------------------------------------------------
export function AiResultDialog({ open, title, status, elapsed, error, html, actions = [], onRegenerate, onClose, onStop, note, extra }) {
  const words = useMemo(() => countStats(html).words, [html]);
  return (
    <Modal
      open={open}
      onClose={status === "running" ? undefined : onClose}
      size="lg"
      title={title || "AI suggestion"}
      subtitle={status === "done" ? `${words} words · review it before adding it to the document` : note}
      bodyClassName="bg-slate-50 p-4 sm:p-6"
      footer={
        status === "running" ? null : (
          <>
            <Btn variant="ghost" onClick={onClose}>Discard</Btn>
            {onRegenerate && <Btn onClick={onRegenerate}>↻ Regenerate</Btn>}
            {status === "done" &&
              actions.map((a) => (
                <Btn key={a.label} variant={a.variant || "outline"} onClick={a.onClick}>
                  {a.label}
                </Btn>
              ))}
          </>
        )
      }
    >
      {status === "running" && <GeneratingPanel label={title || "Generating"} elapsed={elapsed} onCancel={onStop} />}
      {status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">The AI could not complete this request.</p>
          <p className="mt-1">{error}</p>
          {/n8n|workflow|callback|timed out/i.test(error || "") && (
            <p className="mt-2 text-red-700">
              IICPA&apos;s AI runs through the n8n workflow. It must return the result in its HTTP response (Respond to Webhook
              node) or post it to the callback URL it receives. Nothing in your document was changed.
            </p>
          )}
        </div>
      )}
      {status === "done" && <Rendered html={html} className="max-h-[60vh] overflow-y-auto" />}
      {status === "done" && extra}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Review: local statistics + AI proofreading
// ---------------------------------------------------------------------------
const TYPE_STYLE = {
  spelling: "border-red-200 bg-red-50 text-red-700",
  grammar: "border-amber-200 bg-amber-50 text-amber-700",
  punctuation: "border-sky-200 bg-sky-50 text-sky-700",
  style: "border-violet-200 bg-violet-50 text-violet-700",
};

export function ReviewDialog({ open, onClose, stats, read, ai, onRunAi, onApply, focus = "all" }) {
  const [applied, setApplied] = useState({});
  useEffect(() => {
    if (open) setApplied({});
  }, [open, ai?.review]);
  const issues = (ai?.review?.issues || []).filter((i) => focus === "all" || focus === "readability" || i.type === focus || (focus === "grammar" && i.type === "style"));

  const apply = (i, n) => {
    const ok = onApply(i);
    setApplied((s) => ({ ...s, [n]: ok ? "applied" : "missing" }));
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Review" subtitle="Statistics and readability are calculated instantly. Proofreading uses IICPA AI." bodyClassName="p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Words", stats.words],
          ["Characters", stats.characters],
          ["Reading time", `${stats.readingMinutes} min`],
          ["Readability", read ? `${read.score} · ${read.label}` : "-"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">{l}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      {read && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Readability suggestions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Flesch reading ease {read.score} ({read.label}); approx. grade level {read.grade}. Aim for 50+ for students.</li>
            <li>Average sentence length {read.avgSentenceLength} words{read.avgSentenceLength > 22 ? " - try shorter sentences." : "."}</li>
            {read.longSentences.length > 0 && <li>{read.longSentences.length} sentence(s) are longer than 25 words, e.g. “{read.longSentences[0].slice(0, 140)}…”</li>}
            {read.passiveCount > 0 && <li>{read.passiveCount} sentence(s) look passive - prefer active voice where possible.</li>}
            <li>{read.complexWordPct}% complex words (4+ syllables).</li>
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-slate-900">AI proofreading: spelling, grammar, punctuation & content</p>
          <Btn variant="ai" size="sm" onClick={onRunAi} loading={ai?.status === "running"}>
            {ai?.review ? "Run again" : "Check with AI"}
          </Btn>
        </div>
        {ai?.status === "running" && <p className="mt-2 text-sm text-slate-600">Checking… {ai.elapsed}</p>}
        {ai?.status === "error" && <p className="mt-2 text-sm text-red-700">{ai.error}</p>}
        {ai?.review && (
          <>
            {ai.review.readability?.summary && <p className="mt-3 text-sm text-slate-700"><strong>{ai.review.readability.level}</strong> {ai.review.readability.summary}</p>}
            <div className="mt-3 space-y-2">
              {issues.length === 0 && <p className="text-sm text-emerald-700">No issues found{focus !== "all" ? ` for ${focus}` : ""}. ✓</p>}
              {issues.map((i, n) => (
                <div key={n} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge className={TYPE_STYLE[i.type]}>{i.type}</Badge>
                    {applied[n] === "applied" ? (
                      <span className="text-xs font-semibold text-emerald-700">Applied ✓</span>
                    ) : applied[n] === "missing" ? (
                      <span className="text-xs text-amber-700">Text not found - fix manually</span>
                    ) : (
                      <Btn size="sm" variant="primary" onClick={() => apply(i, n)}>Apply</Btn>
                    )}
                  </div>
                  <p className="mt-2"><span className="rounded bg-red-50 px-1 text-red-700 line-through">{i.original}</span> → <span className="rounded bg-emerald-50 px-1 text-emerald-700">{i.suggestion}</span></p>
                  {i.explanation && <p className="mt-1 text-xs text-slate-500">{i.explanation}</p>}
                </div>
              ))}
            </div>
            {ai.review.suggestions?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-900">Content suggestions</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">{ai.review.suggestions.map((s, n) => <li key={n}>{s}</li>)}</ul>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Version history (kept in this browser, per document)
// ---------------------------------------------------------------------------
export function HistoryDialog({ open, onClose, entries = [], onRestore, onSaveNow, serverInfo }) {
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (open) setSelected(0);
  }, [open]);
  const cur = entries[selected];
  return (
    <Modal open={open} onClose={onClose} size="xl" title="Document history"
      subtitle="Versions are snapshotted automatically every few minutes and on save (stored in this browser)."
      footer={<><Btn onClick={onSaveNow}>Save a version now</Btn><Btn variant="primary" disabled={!cur} onClick={() => onRestore(cur)}>Restore this version</Btn></>}>
      {serverInfo && <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{serverInfo}</p>}
      {!entries.length ? (
        <p className="text-sm text-slate-500">No versions yet. Versions appear as you edit.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="max-h-[60vh] space-y-1 overflow-y-auto">
            {entries.map((e, i) => (
              <button key={e.at + i} type="button" onClick={() => setSelected(i)} className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${i === selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <p className="font-semibold text-slate-800">{formatDateTime(e.at)}</p>
                <p className="text-xs text-slate-500">{e.label} · {e.words} words</p>
              </button>
            ))}
          </div>
          {cur && <Rendered html={cur.html} className="max-h-[60vh] overflow-y-auto text-sm" />}
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Review notes / comments (kept in this browser, per document)
// ---------------------------------------------------------------------------
export function NotesDialog({ open, onClose, notes = [], onChange, selectedText = "" }) {
  const [text, setText] = useState("");
  const add = () => {
    if (!text.trim()) return;
    onChange([{ id: Date.now(), text: text.trim(), quote: selectedText.slice(0, 200), at: new Date().toISOString(), resolved: false }, ...notes]);
    setText("");
  };
  return (
    <Modal open={open} onClose={onClose} size="md" title="Review notes" subtitle="Notes for writers and reviewers. Saved in this browser; never shown to students.">
      {selectedText && <p className="mb-2 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-slate-700">“{selectedText.slice(0, 200)}”</p>}
      <textarea className={inputCls} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note about this content…" />
      <div className="mt-2 flex justify-end"><Btn variant="primary" size="sm" onClick={add}>Add note</Btn></div>
      <div className="mt-4 space-y-2">
        {notes.length === 0 && <p className="text-sm text-slate-500">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className={`rounded-lg border p-3 text-sm ${n.resolved ? "border-slate-200 bg-slate-50 text-slate-400" : "border-amber-200 bg-white"}`}>
            {n.quote && <p className="mb-1 text-xs italic">“{n.quote}”</p>}
            <p className={n.resolved ? "line-through" : ""}>{n.text}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span>{formatDateTime(n.at)}</span>
              <span className="flex gap-3">
                <button type="button" className="font-semibold text-blue-600" onClick={() => onChange(notes.map((x) => (x.id === n.id ? { ...x, resolved: !x.resolved } : x)))}>{n.resolved ? "Reopen" : "Resolve"}</button>
                <button type="button" className="font-semibold text-red-600" onClick={() => onChange(notes.filter((x) => x.id !== n.id))}>Delete</button>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Present: content split into slides at each H1/H2
// ---------------------------------------------------------------------------
const toSlides = (html, title) => {
  if (typeof window === "undefined") return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const root = div.querySelector(":scope > .ce-doc") || div;
  const slides = [{ title, html: "" }];
  [...root.childNodes].forEach((n) => {
    if (n.nodeType === 1 && /^H[12]$/.test(n.tagName)) slides.push({ title: n.textContent, html: "" });
    else slides[slides.length - 1].html += n.nodeType === 1 ? n.outerHTML : n.textContent || "";
  });
  return slides.filter((s, i) => i === 0 || s.html.replace(/<[^>]*>/g, "").trim() || s.title);
};

export function PresentMode({ open, onClose, html, title }) {
  const slides = useMemo(() => (open ? toSlides(html, title || "Untitled") : []), [open, html, title]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!open) return undefined;
    setI(0);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") setI((x) => Math.min(slides.length - 1, x + 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, slides.length, onClose]);
  if (!open) return null;
  const s = slides[i] || {};
  return (
    <div className="fixed inset-0 z-[1100] flex flex-col bg-slate-900">
      <div className="flex items-center justify-between px-6 py-3 text-sm text-slate-300">
        <span>{i + 1} / {slides.length}</span>
        <button type="button" onClick={onClose} className="rounded-md bg-white/10 px-3 py-1 hover:bg-white/20">Exit (Esc)</button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden px-4 pb-6">
        <div className="flex h-full max-h-[80vh] w-full max-w-5xl flex-col overflow-y-auto rounded-2xl bg-white p-10 shadow-2xl">
          <h1 className={`${i === 0 ? "my-auto text-center text-4xl" : "mb-6 text-3xl"} font-bold text-slate-900`}>{s.title}</h1>
          {s.html && <div className="digital-hub-content topic-content-light text-lg" dangerouslySetInnerHTML={{ __html: s.html }} />}
        </div>
      </div>
      <div className="flex justify-center gap-3 pb-6">
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-lg bg-white/10 px-5 py-2 text-white disabled:opacity-30">◀ Previous</button>
        <button type="button" disabled={i >= slides.length - 1} onClick={() => setI(i + 1)} className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-30">Next ▶</button>
      </div>
    </div>
  );
}
