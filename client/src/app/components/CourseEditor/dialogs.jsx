"use client";
// Dialogs used by the editor ribbon (Insert / Interactive / Review tabs).
import React, { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { Modal, Btn, Field, inputCls, Spinner } from "./ui";
import {
  esc,
  isSafeUrl,
  uploadImageFile,
  uploadVideoFile,
  uploadAttachmentFile,
  IMAGE_ACCEPT,
  ATTACHMENT_ACCEPT,
  AUDIO_ACCEPT,
  buildMatcher,
  findMatches,
  replaceAllMatches,
  toEditorHtml,
} from "./editorCore";
import {
  SYMBOLS,
  imageHtml,
  videoHtml,
  audioHtml,
  downloadCardHtml,
  linkCardHtml,
  embedHtml,
  codeHtml,
} from "./blocks";

// ---------------------------------------------------------------------------
// Schema-driven form (interactive blocks, infographics, chemistry …)
// ---------------------------------------------------------------------------
export function BlockFormDialog({ open, title, fields = [], initial = {}, validate, onSubmit, onClose, submitLabel = "Insert" }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setValues(initial);
      setError("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    const cfg = { ...values };
    for (const f of fields) {
      if (f.type === "number") cfg[f.name] = Number(cfg[f.name]);
      if (f.required && !String(cfg[f.name] ?? "").trim()) return setError(`"${f.label}" is required.`);
    }
    const msg = validate?.(cfg);
    if (msg) return setError(msg);
    onSubmit(cfg);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={title}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={submit}>
            {submitLabel}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {fields.map((f) => {
          const v = values[f.name] ?? "";
          const set = (val) => setValues((s) => ({ ...s, [f.name]: val }));
          return (
            <Field key={f.name} label={f.label} required={f.required}>
              {f.type === "select" ? (
                <select className={inputCls} value={v} onChange={(e) => set(e.target.value)}>
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "textarea" || f.type === "lines" ? (
                <textarea className={`${inputCls} font-mono text-[13px]`} rows={f.rows || (f.type === "lines" ? 5 : 3)} value={v} onChange={(e) => set(e.target.value)} />
              ) : (
                <input className={inputCls} type={f.type === "number" ? "number" : "text"} min={f.min} value={v} onChange={(e) => set(e.target.value)} />
              )}
            </Field>
          );
        })}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
export function TableDialog({ open, onClose, onInsert }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [header, setHeader] = useState(true);
  const [style, setStyle] = useState("ce-table-striped");
  const [caption, setCaption] = useState("");
  const [hover, setHover] = useState(null);

  const insert = (r = rows, c = cols) => {
    const R = Math.min(50, Math.max(1, Number(r) || 1));
    const C = Math.min(12, Math.max(1, Number(c) || 1));
    const headRow = header ? `<thead><tr>${Array.from({ length: C }, (_, i) => `<th>Heading ${i + 1}</th>`).join("")}</tr></thead>` : "";
    const body = Array.from({ length: header ? R - 1 || 1 : R }, () => `<tr>${Array.from({ length: C }, () => "<td><br></td>").join("")}</tr>`).join("");
    onInsert(
      `${caption ? `<p><strong>${esc(caption)}</strong></p>` : ""}<table class="${style}" style="width:100%;border-collapse:collapse">${headRow}<tbody>${body}</tbody></table><p><br></p>`
    );
  };

  return (
    <Modal open={open} onClose={onClose} size="md" title="Insert table" footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => insert()}>Insert table</Btn></>}>
      <p className="mb-2 text-sm text-slate-600">Pick a size{hover ? `: ${hover[0]} × ${hover[1]}` : ""}</p>
      <div className="mb-5 inline-grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1.25rem)" }} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 80 }, (_, i) => {
          const r = Math.floor(i / 10) + 1;
          const c = (i % 10) + 1;
          const on = hover && r <= hover[0] && c <= hover[1];
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover([r, c])}
              onClick={() => insert(r, c)}
              className={`h-5 w-5 rounded-sm border ${on ? "border-blue-500 bg-blue-200" : "border-slate-300 bg-white"}`}
              aria-label={`${r} by ${c}`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Rows"><input className={inputCls} type="number" min={1} max={50} value={rows} onChange={(e) => setRows(e.target.value)} /></Field>
        <Field label="Columns"><input className={inputCls} type="number" min={1} max={12} value={cols} onChange={(e) => setCols(e.target.value)} /></Field>
        <Field label="Style">
          <select className={inputCls} value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="ce-table-striped">Striped</option>
            <option value="ce-table-bordered">Bordered</option>
            <option value="ce-table-minimal">Minimal</option>
            <option value="ce-table-header ce-table-striped">Coloured header</option>
            <option value="">Plain</option>
          </select>
        </Field>
        <Field label="Caption (optional)"><input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} /></Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> First row is a header
      </label>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Hyperlink / internal link
// ---------------------------------------------------------------------------
export function LinkDialog({ open, onClose, onInsert, selectedText = "", headings = [] }) {
  const [mode, setMode] = useState("web");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [newTab, setNewTab] = useState(true);
  const [anchor, setAnchor] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setText(selectedText);
      setUrl("");
      setAnchor(headings[0]?.id || "");
      setError("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (mode === "web") {
      const href = /^(https?:|mailto:|tel:)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      if (!url.trim() || (!href.startsWith("mailto:") && !href.startsWith("tel:") && !isSafeUrl(href))) return setError("Enter a valid web address.");
      onInsert({ href, text: text || href, newTab });
    } else {
      const h = headings.find((x) => x.id === anchor);
      if (!h) return setError("Choose a heading to link to.");
      onInsert({ href: `#${h.id}`, text: text || h.text, newTab: false, headingIndex: h.index });
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md" title="Insert link" footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit}>Insert link</Btn></>}>
      <div className="mb-4 inline-flex rounded-lg border border-slate-300 p-1">
        {[["web", "Web address"], ["internal", "Section in this document"]].map(([id, l]) => (
          <button key={id} type="button" onClick={() => setMode(id)} className={`rounded-md px-3 py-1 text-sm font-semibold ${mode === id ? "bg-blue-600 text-white" : "text-slate-600"}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-4">
        {mode === "web" ? (
          <Field label="URL" required><input className={inputCls} placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus /></Field>
        ) : headings.length ? (
          <Field label="Heading">
            <select className={inputCls} value={anchor} onChange={(e) => setAnchor(e.target.value)}>
              {headings.map((h) => <option key={h.id} value={h.id}>{`${"— ".repeat(h.level - 1)}${h.text}`}</option>)}
            </select>
          </Field>
        ) : (
          <p className="text-sm text-slate-500">Add headings (H1–H4) to the document to link to them.</p>
        )}
        <Field label="Text to display"><input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        {mode === "web" && (
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} /> Open in a new tab</label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Image / video / audio / file / web page / embed
// ---------------------------------------------------------------------------
const MEDIA = {
  image: { title: "Insert image", accept: IMAGE_ACCEPT, upload: true, url: true },
  video: { title: "Insert video", accept: "video/*", upload: true, url: true, urlHint: "YouTube, Vimeo or a direct .mp4 link" },
  audio: { title: "Insert audio", accept: AUDIO_ACCEPT, upload: true, url: true },
  file: { title: "Downloadable attachment", accept: ATTACHMENT_ACCEPT, upload: true, url: true },
  webpage: { title: "Link to a web page", url: true },
  embed: { title: "Embed content (iframe)", url: true, urlHint: "https:// address of the page to embed (Google Slides, forms, simulations…)" },
};

export function MediaDialog({ open, kind = "image", source: initialSource, onClose, onInsert }) {
  const cfg = MEDIA[kind] || MEDIA.image;
  const [source, setSource] = useState(cfg.upload ? "upload" : "url");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState({ alt: "", width: "100", align: "center", caption: "", name: "", description: "", title: "", height: 450 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const preview = useMemo(() => (file && kind === "image" ? URL.createObjectURL(file) : ""), [file, kind]);

  useEffect(() => {
    if (open) {
      setSource(cfg.upload && initialSource !== "url" ? "upload" : "url");
      setFile(null);
      setUrl("");
      setMeta({ alt: "", width: "100", align: "center", caption: "", name: "", description: "", title: "", height: 450 });
      setError("");
      setProgress(0);
    }
  }, [open, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setMeta((m) => ({ ...m, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    try {
      setBusy(true);
      let finalUrl = url.trim();
      let size = 0;
      let name = meta.name;
      if (source === "upload") {
        if (!file) throw new Error("Choose a file to upload.");
        if (kind === "image") finalUrl = await uploadImageFile(file);
        else if (kind === "video") finalUrl = await uploadVideoFile(file, setProgress);
        else {
          const up = await uploadAttachmentFile(file, setProgress);
          finalUrl = up.url;
          size = up.size;
          name = name || up.name;
        }
      } else if (!isSafeUrl(finalUrl)) {
        throw new Error("Enter a valid http(s) URL.");
      }
      if (kind === "embed" && !finalUrl.startsWith("https://")) throw new Error("Only https:// pages can be embedded.");
      const html = {
        image: () => imageHtml({ url: finalUrl, ...meta }),
        video: () => videoHtml(finalUrl, meta.caption),
        audio: () => audioHtml(finalUrl, meta.caption),
        file: () => downloadCardHtml({ url: finalUrl, name: name || finalUrl.split("/").pop(), size, description: meta.description }),
        webpage: () => linkCardHtml({ url: finalUrl, title: meta.title, description: meta.description }),
        embed: () => embedHtml(finalUrl, meta.height, meta.title || "Embedded content"),
      }[kind]();
      onInsert(html);
    } catch (err) {
      setError(err.message || "Could not insert.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      size="md"
      title={cfg.title}
      footer={<><Btn onClick={onClose} disabled={busy}>Cancel</Btn><Btn variant="primary" onClick={submit} loading={busy}>{source === "upload" ? "Upload & insert" : "Insert"}</Btn></>}
    >
      {cfg.upload && cfg.url && (
        <div className="mb-4 inline-flex rounded-lg border border-slate-300 p-1">
          {[["upload", "Upload"], ["url", "From URL"]].map(([id, l]) => (
            <button key={id} type="button" onClick={() => setSource(id)} className={`rounded-md px-3 py-1 text-sm font-semibold ${source === id ? "bg-blue-600 text-white" : "text-slate-600"}`}>{l}</button>
          ))}
        </div>
      )}
      <div className="space-y-4">
        {source === "upload" ? (
          <Field label="File" hint={kind === "image" ? "PNG, JPG, GIF or WEBP up to 10 MB" : kind === "video" ? "Video up to 350 MB" : "Up to 25 MB"}>
            <input type="file" accept={cfg.accept} onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
          </Field>
        ) : (
          <Field label="URL" hint={cfg.urlHint}>
            <input className={inputCls} placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
        )}
        {preview && <img src={preview} alt="" className="max-h-40 rounded-lg border" />}
        {kind === "image" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Alt text (accessibility)"><input className={inputCls} value={meta.alt} onChange={set("alt")} /></Field>
            <Field label="Caption"><input className={inputCls} value={meta.caption} onChange={set("caption")} /></Field>
            <Field label="Width">
              <select className={inputCls} value={meta.width} onChange={set("width")}>
                {["25", "33", "50", "75", "100"].map((w) => <option key={w} value={w}>{w}%</option>)}
              </select>
            </Field>
            <Field label="Alignment">
              <select className={inputCls} value={meta.align} onChange={set("align")}>
                <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
              </select>
            </Field>
          </div>
        )}
        {(kind === "video" || kind === "audio") && <Field label="Caption (optional)"><input className={inputCls} value={meta.caption} onChange={set("caption")} /></Field>}
        {kind === "file" && (
          <>
            <Field label="Display name"><input className={inputCls} value={meta.name} onChange={set("name")} placeholder="e.g. GST Practice Workbook.xlsx" /></Field>
            <Field label="Short description"><input className={inputCls} value={meta.description} onChange={set("description")} /></Field>
          </>
        )}
        {kind === "webpage" && (
          <>
            <Field label="Title"><input className={inputCls} value={meta.title} onChange={set("title")} /></Field>
            <Field label="Description"><input className={inputCls} value={meta.description} onChange={set("description")} /></Field>
          </>
        )}
        {kind === "embed" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title"><input className={inputCls} value={meta.title} onChange={set("title")} /></Field>
            <Field label="Height (px)"><input className={inputCls} type="number" min={150} value={meta.height} onChange={set("height")} /></Field>
          </div>
        )}
        {busy && progress > 0 && progress < 100 && (
          <div className="h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Equation (LaTeX -> MathML, rendered natively by browsers)
// ---------------------------------------------------------------------------
const MATH_SNIPPETS = [
  ["a/b", "\\frac{a}{b}"],
  ["√x", "\\sqrt{x}"],
  ["xⁿ", "x^{n}"],
  ["xₙ", "x_{n}"],
  ["Σ", "\\sum_{i=1}^{n} x_i"],
  ["∫", "\\int_{a}^{b} f(x)\\,dx"],
  ["%", "\\frac{x}{100}\\times 100\\%"],
  ["≤", "\\le"],
  ["≥", "\\ge"],
  ["×", "\\times"],
  ["÷", "\\div"],
  ["EMI", "EMI = \\frac{P \\times r \\times (1+r)^n}{(1+r)^n - 1}"],
  ["CI", "A = P\\left(1 + \\frac{r}{100}\\right)^{n}"],
];

export const renderMath = (latex, display) => {
  try {
    return { html: katex.renderToString(latex, { output: "mathml", displayMode: display, throwOnError: true }), error: "" };
  } catch (err) {
    return { html: "", error: err.message.replace(/^KaTeX parse error: /, "") };
  }
};

export function EquationDialog({ open, onClose, onInsert, initial }) {
  const [latex, setLatex] = useState("");
  const [display, setDisplay] = useState(false);
  const ta = useRef(null);
  useEffect(() => {
    if (open) {
      setLatex(initial?.latex || "");
      setDisplay(!!initial?.display);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const { html, error } = renderMath(latex || "\\;", display);
  const add = (s) => {
    const el = ta.current;
    const pos = el?.selectionStart ?? latex.length;
    setLatex(latex.slice(0, pos) + s + latex.slice(pos));
  };
  const submit = () => {
    if (!latex.trim() || error) return;
    const attrs = `contenteditable="false" data-latex="${esc(latex)}"`;
    onInsert(display ? `<div class="ce-math ce-math-block" ${attrs}>${html}</div><p><br></p>` : `<span class="ce-math" ${attrs}>${html}</span>&nbsp;`);
  };
  return (
    <Modal open={open} onClose={onClose} size="md" title="Insert equation" subtitle="Write LaTeX; it is converted to MathML that every modern browser displays."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit} disabled={!latex.trim() || !!error}>Insert equation</Btn></>}>
      <div className="mb-3 flex flex-wrap gap-1">
        {MATH_SNIPPETS.map(([l, s]) => (
          <button key={l} type="button" onClick={() => add(s)} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-blue-50">{l}</button>
        ))}
      </div>
      <textarea ref={ta} className={`${inputCls} font-mono`} rows={3} value={latex} onChange={(e) => setLatex(e.target.value)} placeholder="e.g. GST = \frac{Value \times Rate}{100}" autoFocus />
      <label className="mt-2 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} /> Display on its own line (centred)</label>
      <div className="mt-4 min-h-[70px] rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-lg">
        {error ? <span className="text-sm text-red-600">{error}</span> : <span dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Code block
// ---------------------------------------------------------------------------
export function CodeDialog({ open, onClose, onInsert, initialCode = "" }) {
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("");
  useEffect(() => {
    if (open) setCode(initialCode);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Insert code block"
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => code.trim() && onInsert(codeHtml(code, lang))}>Insert</Btn></>}>
      <Field label="Language">
        <select className={inputCls} value={lang} onChange={(e) => setLang(e.target.value)}>
          {["", "Excel formula", "SQL", "Python", "JavaScript", "HTML", "CSS", "JSON", "DAX", "Power Query (M)", "VBA", "Tally TDL", "Plain text"].map((l) => <option key={l} value={l}>{l || "(none)"}</option>)}
        </select>
      </Field>
      <textarea className={`${inputCls} mt-3 font-mono text-[13px]`} rows={12} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste or type code…" spellCheck={false} />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Special characters
// ---------------------------------------------------------------------------
export function SymbolDialog({ open, onClose, onInsert }) {
  return (
    <Modal open={open} onClose={onClose} size="md" title="Special characters">
      <div className="grid grid-cols-10 gap-1">
        {SYMBOLS.map((s) => (
          <button key={s} type="button" onClick={() => onInsert(s)} className="h-9 rounded border border-slate-200 text-lg hover:border-blue-400 hover:bg-blue-50" title={`Insert ${s}`}>{s}</button>
        ))}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Find & Replace
// ---------------------------------------------------------------------------
export function FindReplaceDialog({ open, onClose, getRoot, onChanged }) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [index, setIndex] = useState(-1);
  const [message, setMessage] = useState("");
  const matcher = buildMatcher(find, { matchCase, wholeWord });
  const matches = open && matcher && getRoot() ? findMatches(getRoot(), matcher) : [];

  useEffect(() => {
    setIndex(-1);
    setMessage("");
  }, [find, matchCase, wholeWord]);

  const select = (m) => {
    const range = document.createRange();
    range.setStart(m.node, m.start);
    range.setEnd(m.node, m.end);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    m.node.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const next = () => {
    if (!matches.length) return setMessage("No matches.");
    const i = (index + 1) % matches.length;
    setIndex(i);
    select(matches[i]);
    setMessage(`Match ${i + 1} of ${matches.length}`);
  };

  const replaceOne = () => {
    const m = matches[index] || matches[0];
    if (!m) return setMessage("No matches.");
    m.node.nodeValue = m.node.nodeValue.slice(0, m.start) + replace + m.node.nodeValue.slice(m.end);
    onChanged();
    setIndex(index - 1);
    setMessage("Replaced 1 match.");
  };

  const replaceAll = () => {
    if (!matcher) return;
    const n = replaceAllMatches(getRoot(), matcher, replace);
    onChanged();
    setMessage(n ? `Replaced ${n} match${n === 1 ? "" : "es"}.` : "No matches.");
  };

  return (
    <Modal open={open} onClose={onClose} size="md" title="Find & Replace"
      footer={<><Btn onClick={next}>Find next</Btn><Btn onClick={replaceOne} disabled={!matches.length}>Replace</Btn><Btn variant="primary" onClick={replaceAll} disabled={!matches.length}>Replace all</Btn></>}>
      <div className="space-y-3">
        <Field label="Find"><input className={inputCls} value={find} onChange={(e) => setFind(e.target.value)} autoFocus /></Field>
        <Field label="Replace with"><input className={inputCls} value={replace} onChange={(e) => setReplace(e.target.value)} /></Field>
        <div className="flex gap-4 text-sm text-slate-700">
          <label className="flex items-center gap-2"><input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} /> Match case</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} /> Whole words</label>
        </div>
        <p className="text-sm text-slate-500">{message || (find ? `${matches.length} match${matches.length === 1 ? "" : "es"}` : "")}</p>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// HTML source ("Format Code")
// ---------------------------------------------------------------------------
const prettyHtml = (html = "") =>
  html
    .replace(/>\s*</g, "><")
    .replace(/<(\/?)(p|h[1-6]|ul|ol|li|table|thead|tbody|tr|div|section|blockquote|figure|pre|details|summary)\b([^>]*)>/gi, (m, close, tag, rest) => (close ? `</${tag}>\n` : `\n<${tag}${rest}>`))
    .replace(/\n{2,}/g, "\n")
    .trim();

export function SourceDialog({ open, onClose, html, onApply }) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (open) setValue(prettyHtml(html));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal open={open} onClose={onClose} size="xl" title="HTML source" subtitle="Advanced: edit the underlying HTML. Scripts are removed when applied."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => onApply(value.replace(/\n/g, ""))}>Apply changes</Btn></>}>
      <textarea className={`${inputCls} h-[60vh] font-mono text-[12.5px]`} value={value} onChange={(e) => setValue(e.target.value)} spellCheck={false} />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Paste AI output (Markdown or HTML from any AI tool)
// ---------------------------------------------------------------------------
export function PasteAiDialog({ open, onClose, onInsert }) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (open) setText("");
  }, [open]);
  const html = useMemo(() => toEditorHtml(text), [text]);
  return (
    <Modal open={open} onClose={onClose} size="xl" title="Paste AI output" subtitle="Paste text from any AI tool (Markdown or HTML). It is converted to clean, formatted content."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => html && onInsert(html)} disabled={!html}>Insert</Btn></>}>
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea className={`${inputCls} h-[55vh] font-mono text-[12.5px]`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste here…" autoFocus />
        <div className="digital-hub-content topic-content-light h-[55vh] overflow-y-auto rounded-lg border border-slate-200 p-4 text-sm" dangerouslySetInnerHTML={{ __html: html || '<p style="color:#94a3b8">Preview appears here.</p>' }} />
      </div>
    </Modal>
  );
}

export { Spinner };
