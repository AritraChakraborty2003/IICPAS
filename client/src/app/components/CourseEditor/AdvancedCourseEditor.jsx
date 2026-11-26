"use client";
/**
 * AdvancedCourseEditor - the single rich-content editor used across Course
 * Management (course description, topics, case studies, assignments …).
 *
 * Ribbon tabs: Home | Insert | Design | Interactive | AI | Review
 * Canvas: Jodit (already used by IICPA), with its own toolbar hidden; every
 * ribbon control drives Jodit's API, so output stays plain HTML that the
 * Student Portal already renders.
 *
 * Props
 *  value / onChange(html) / onBlur(html)   controlled-ish HTML value
 *  onReady(jodit)                          raw Jodit instance (legacy integrations)
 *  aiContext { kind, title, courseId, chapterId, courseTitle, chapterTitle, level }
 *  docKey                                  key for local version history / notes
 *  tabs                                    subset of tab ids (default: all six)
 *  minHeight, placeholder, previewTitle, previewMeta, sidebar (left panel node)
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";
import { MdUndo, MdRedo, MdVisibility, MdFullscreen, MdFullscreenExit } from "react-icons/md";
import "./courseContent.css";
import HomeToolbar from "./toolbars/HomeToolbar";
import InsertToolbar from "./toolbars/InsertToolbar";
import DesignToolbar from "./toolbars/DesignToolbar";
import InteractiveToolbar from "./toolbars/InteractiveToolbar";
import AiToolbar from "./toolbars/AiToolbar";
import ReviewToolbar from "./toolbars/ReviewToolbar";
import {
  BlockFormDialog,
  TableDialog,
  LinkDialog,
  MediaDialog,
  EquationDialog,
  CodeDialog,
  SymbolDialog,
  FindReplaceDialog,
  SourceDialog,
  PasteAiDialog,
} from "./dialogs";
import { AiResultDialog, ReviewDialog, HistoryDialog, NotesDialog, PresentMode } from "./aiDialogs";
import StudentPreviewModal from "./StudentPreviewModal";
import { IA_BLOCKS, INFOGRAPHICS, TEMPLATES, decodeConfig, renderInfographic, aiItemsToHtml } from "./blocks";
import { runAi, errorMessage, formatElapsed } from "./aiClient";
import {
  esc,
  countStats,
  readability,
  htmlToText,
  replaceFirstText,
  readHistory,
  pushHistory,
  readNotes,
  writeNotes,
  sanitizeHtml,
  toEditorHtml,
} from "./editorCore";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">Loading editor…</div>,
});

export const EDITOR_TABS = [
  ["home", "Home"],
  ["insert", "Insert"],
  ["design", "Design"],
  ["interactive", "Interactive"],
  ["ai", "AI"],
  ["review", "Review"],
];

const BLOCK_SEL = "p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,td,th,figure,.ce-box,.ce-ia,.ce-info,.ce-col";
const STYLE_TARGET_SEL = ".ce-ia,.ce-box,.ce-info,.ce-accordion,.ce-chart,table,figure,blockquote,.ce-cols,.ce-shape";
const REPLACE_ACTIONS = new Set(["rewrite", "grammar", "professional", "simplify", "expand", "summarize", "tone", "translate", "headings", "bullets", "seo"]);

const toast = (title, icon = "success") =>
  Swal.fire({ toast: true, position: "top-end", timer: 2600, showConfirmButton: false, icon, title });
const confirmBox = async (title, text, confirmButtonText = "Yes, continue") =>
  (await Swal.fire({ title, text, icon: "warning", showCancelButton: true, confirmButtonText })).isConfirmed;

const slugId = (s = "") =>
  `sec-${String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || Math.random().toString(36).slice(2, 7)}`;

const fragmentFrom = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t.content;
};

const AdvancedCourseEditor = forwardRef(function AdvancedCourseEditor(
  {
    value = "",
    onChange,
    onBlur,
    onReady,
    aiContext,
    docKey,
    tabs,
    minHeight = 480,
    placeholder = "Start writing, or use the AI tab to generate content…",
    previewTitle,
    previewMeta,
    livePreview,
    onAiResult,
    sidebar,
    className = "",
  },
  ref
) {
  const joditRef = useRef(null);
  const rangeRef = useRef(null);
  const lastEmitted = useRef(value || "");
  const initialValue = useRef(value || "");
  const propsRef = useRef({});
  const apiRef = useRef(null);
  propsRef.current = { onChange, onBlur, onReady, aiContext, docKey, livePreview, onAiResult };

  const visibleTabs = useMemo(() => EDITOR_TABS.filter(([id]) => !tabs || tabs.includes(id)), [tabs]);
  const [tab, setTab] = useState(visibleTabs[0]?.[0] || "home");
  const [dialog, setDialog] = useState(null); // { name, props }
  const [formatState, setFormatState] = useState({});
  const [stats, setStats] = useState(() => countStats(value));
  const [docSettings, setDocSettings] = useState({});
  const [fullscreen, setFullscreen] = useState(false);
  const [spellcheck, setSpellcheck] = useState(true);
  const [painterActive, setPainterActive] = useState(false);
  const painterRef = useRef(null);
  const [ai, setAi] = useState(null); // AI result dialog state
  const aiStopRef = useRef(false);
  const lastAiRef = useRef(null);
  const [review, setReview] = useState(null); // { status, elapsed, error, review }
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const root = () => joditRef.current?.editor || null;
  const html = () => joditRef.current?.value || "";

  // ---------------------------------------------------------------------
  // Selection handling - ribbon controls steal focus, so remember the range
  // ---------------------------------------------------------------------
  const readDocSettings = useCallback(() => {
    const w = joditRef.current?.editor?.querySelector(":scope > .ce-doc");
    setDocSettings(
      w
        ? {
            theme: w.dataset.ceTheme,
            width: w.dataset.ceWidth,
            headings: w.dataset.ceHeadings,
            page: w.dataset.cePage,
            padding: w.style.padding,
            background: w.style.background,
          }
        : {}
    );
  }, []);

  const updateFormatState = useCallback(() => {
    const r = rangeRef.current;
    const el = r ? (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement) : null;
    const q = (c) => {
      try {
        return document.queryCommandState(c);
      } catch {
        return false;
      }
    };
    const block = el?.closest?.("p,h1,h2,h3,h4,h5,h6,li,td,th,div,blockquote");
    const align = block ? getComputedStyle(block).textAlign : "";
    setFormatState({
      bold: q("bold"),
      italic: q("italic"),
      underline: q("underline"),
      strike: q("strikeThrough"),
      sup: q("superscript"),
      sub: q("subscript"),
      ul: !!el?.closest?.("ul"),
      ol: !!el?.closest?.("ol"),
      align: align === "start" ? "left" : align,
      inTable: !!el?.closest?.("td,th"),
    });
  }, []);

  const saveRange = useCallback(() => {
    const j = joditRef.current;
    if (!j) return;
    const sel = j.ew.getSelection();
    if (!sel || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    if (j.editor.contains(r.commonAncestorContainer)) {
      rangeRef.current = r.cloneRange();
      updateFormatState();
    }
  }, [updateFormatState]);

  const restore = useCallback(() => {
    const j = joditRef.current;
    if (!j) return false;
    const r = rangeRef.current;
    if (r && j.editor.contains(r.startContainer)) {
      j.s.selectRange(r);
    } else {
      j.editor.focus({ preventScroll: true });
      const end = document.createRange();
      end.selectNodeContents(j.editor);
      end.collapse(false);
      j.s.selectRange(end);
    }
    return true;
  }, []);

  const statsTimer = useRef(null);
  const afterChange = useCallback(() => {
    const j = joditRef.current;
    if (!j) return;
    j.synchronizeValues?.();
    const v = j.value;
    if (v !== lastEmitted.current) {
      lastEmitted.current = v;
      propsRef.current.onChange?.(v);
    }
    clearTimeout(statsTimer.current);
    statsTimer.current = setTimeout(() => {
      setStats(countStats(v));
      readDocSettings();
    }, 300);
  }, [readDocSettings]);

  // ---------------------------------------------------------------------
  // Jodit setup (config and editorRef must be stable - they re-create Jodit)
  // ---------------------------------------------------------------------
  const config = useMemo(
    () => ({
      readonly: false,
      toolbar: false,
      statusbar: false,
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      minHeight,
      height: "auto",
      placeholder,
      spellcheck: true,
      language: "en",
      editorClassName: "lucida-sans-content ce-canvas",
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_clear_html",
      toolbarInlineForSelection: false,
      useSearch: false,
      saveModeInStorage: false,
      uploader: { insertImageAsBase64URI: true, imagesExtensions: ["jpg", "jpeg", "png", "gif", "webp"] },
      disablePlugins: ["add-new-line", "powered-by-jodit", "stat", "xpath"],
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleEditorRef = useCallback(
    (j) => {
      if (!j || joditRef.current === j) return;
      joditRef.current = j;
      const el = j.editor;
      const onMouseUp = () => {
        saveRange();
        const p = painterRef.current;
        if (p) {
          const sel = j.ew.getSelection();
          if (sel && !sel.isCollapsed) {
            j.s.commitStyle({ attributes: { style: p } });
            painterRef.current = null;
            setPainterActive(false);
            afterChange();
          }
        }
      };
      const onDblClick = (e) => {
        const math = e.target.closest?.(".ce-math[data-latex]");
        if (math) {
          setDialog({ name: "equation", props: { initial: { latex: math.dataset.latex, display: math.classList.contains("ce-math-block") }, target: math } });
          return;
        }
        const blockEl = e.target.closest?.("[data-ce-block]");
        if (blockEl && IA_BLOCKS[blockEl.dataset.ceBlock]) {
          e.preventDefault();
          // eslint-disable-next-line no-use-before-define
          apiRef.current?.openBlock(blockEl.dataset.ceBlock, blockEl);
        }
      };
      const onClick = (e) => {
        if (e.target.tagName === "IMG") {
          const r = document.createRange();
          r.selectNode(e.target);
          rangeRef.current = r;
        }
      };
      el.addEventListener("mouseup", onMouseUp);
      el.addEventListener("keyup", saveRange);
      el.addEventListener("dblclick", onDblClick);
      el.addEventListener("click", onClick);
      j.e.on("beforeDestruct", () => {
        el.removeEventListener("mouseup", onMouseUp);
        el.removeEventListener("keyup", saveRange);
        el.removeEventListener("dblclick", onDblClick);
        el.removeEventListener("click", onClick);
      });
      readDocSettings();
      propsRef.current.onReady?.(j);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    const onSel = () => saveRange();
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [saveRange]);

  // External value changes (topic switch, AI apply, Word import) - typing
  // never round-trips through here, so the caret is never reset.
  useEffect(() => {
    const j = joditRef.current;
    const v = value || "";
    if (v === lastEmitted.current) return;
    lastEmitted.current = v;
    if (j && j.value !== v) {
      j.value = v;
      setStats(countStats(v));
      readDocSettings();
    } else if (!j) {
      initialValue.current = v;
    }
  }, [value, readDocSettings]);

  const handleChange = useCallback(
    (v) => {
      if (v === lastEmitted.current) return;
      lastEmitted.current = v;
      propsRef.current.onChange?.(v);
      clearTimeout(statsTimer.current);
      statsTimer.current = setTimeout(() => setStats(countStats(v)), 400);
    },
    []
  );
  const handleBlur = useCallback((v) => propsRef.current.onBlur?.(v), []);

  // ---------------------------------------------------------------------
  // Local history + notes
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!docKey) return undefined;
    setHistory(readHistory(docKey));
    setNotes(readNotes(docKey));
    const first = setTimeout(() => setHistory(pushHistory(docKey, html() || value, "Opened")), 1500);
    const timer = setInterval(() => setHistory(pushHistory(docKey, html(), "Auto-saved")), 3 * 60 * 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [docKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------
  // Editing primitives used by the toolbars
  // ---------------------------------------------------------------------
  const currentElement = () => {
    const r = rangeRef.current;
    if (!r || !root()?.contains(r.startContainer)) return null;
    return r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
  };

  const selectedBlocks = () => {
    const r = rangeRef.current;
    const rt = root();
    if (!r || !rt) return [];
    const all = [...rt.querySelectorAll(BLOCK_SEL)].filter((el) => {
      try {
        return r.intersectsNode(el);
      } catch {
        return false;
      }
    });
    const innermost = all.filter((el) => !all.some((o) => o !== el && el.contains(o)));
    if (innermost.length) return innermost;
    const cur = currentElement()?.closest(BLOCK_SEL);
    return cur ? [cur] : [];
  };

  const insertHTML = (h) => {
    if (!restore()) return;
    joditRef.current.s.insertHTML(h);
    afterChange();
  };

  const replaceElement = (el, h) => {
    const frag = fragmentFrom(h.replace(/<p><br><\/p>$/, ""));
    el.replaceWith(frag);
    afterChange();
  };

  const runForm = (opts) => setDialog({ name: "form", props: opts });

  // Preview on the real Student Portal (Digital Hub) when the item exists there;
  // the current, unsaved editor content is handed over through localStorage and
  // only shown to this admin. Otherwise fall back to the in-page preview.
  const openStudentPreview = () => {
    propsRef.current.onBlur?.(html());
    const lp = propsRef.current.livePreview;
    if (lp?.courseId && lp?.chapterId && lp?.topicId && typeof window !== "undefined") {
      try {
        localStorage.setItem(`iicpa-admin-preview:${lp.topicId}`, JSON.stringify({ html: html(), at: Date.now() }));
        localStorage.setItem(
          "digitalHub:lastSelection",
          JSON.stringify({ courseKey: String(lp.courseId), chapterId: String(lp.chapterId), topicId: String(lp.topicId) })
        );
      } catch {
        /* storage blocked - the page still opens with the saved content */
      }
      window.open(`/digital-hub/demo/${lp.courseId}/${lp.chapterId}?adminPreview=1`, "_blank");
      return;
    }
    setPreviewOpen(true);
  };

  const api = {
    formatState,
    docSettings,
    painterActive,
    spellcheck,
    aiContext,
    exec: (cmd, arg) => {
      if (!restore()) return;
      joditRef.current.execCommand(cmd, false, arg);
      afterChange();
      setTimeout(saveRange, 0);
    },
    insertHTML,
    insertText: (t) => insertHTML(esc(t)),
    selectionText: () => {
      const r = rangeRef.current;
      return r && root()?.contains(r.startContainer) ? r.toString() : "";
    },
    selectionHtml: () => {
      const r = rangeRef.current;
      if (!r || r.collapsed || !root()?.contains(r.startContainer)) return "";
      const div = document.createElement("div");
      div.appendChild(r.cloneContents());
      return div.innerHTML;
    },
    formatBlock: (tag) => api.exec("formatblock", tag),
    setLineHeight: (v) => api.exec("applyLineHeight", v),
    setParagraphSpacing: (v) => {
      const blocks = selectedBlocks();
      if (!blocks.length) return toast("Place the cursor in a paragraph first.", "info");
      blocks.forEach((b) => (b.style.marginBottom = v));
      afterChange();
    },
    stepFontSize: (delta) => {
      const el = currentElement();
      const size = el ? parseFloat(getComputedStyle(el).fontSize) || 16 : 16;
      api.exec("fontsize", `${Math.max(8, Math.min(72, Math.round(size + delta)))}px`);
    },
    clearFormat: () => {
      if (!restore()) return;
      const j = joditRef.current;
      j.execCommand("removeFormat");
      const r = rangeRef.current;
      if (r && !r.collapsed) {
        root()
          .querySelectorAll("span[style],font")
          .forEach((n) => {
            try {
              if (r.intersectsNode(n)) n.replaceWith(...n.childNodes);
            } catch {
              /* ignore */
            }
          });
      }
      afterChange();
    },
    unlink: () => {
      const a = currentElement()?.closest("a");
      if (a) a.replaceWith(...a.childNodes);
      else if (restore()) document.execCommand("unlink");
      afterChange();
    },
    startPainter: () => {
      if (painterRef.current) {
        painterRef.current = null;
        setPainterActive(false);
        return;
      }
      const el = currentElement();
      if (!el) return toast("Click inside formatted text first.", "info");
      const cs = getComputedStyle(el);
      const style = {
        fontWeight: cs.fontWeight,
        fontStyle: cs.fontStyle,
        textDecoration: cs.textDecorationLine === "none" ? "" : cs.textDecorationLine,
        color: cs.color,
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
      };
      if (cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) style.backgroundColor = cs.backgroundColor;
      painterRef.current = style;
      setPainterActive(true);
      toast("Format copied - now select the text to apply it to.", "info");
    },
    tableOp: (op) => {
      const cell = currentElement()?.closest("td,th");
      if (!cell) return toast("Place the cursor inside a table first.", "info");
      const row = cell.parentElement;
      const table = cell.closest("table");
      const idx = cell.cellIndex;
      const newCell = (r) => {
        const c = document.createElement(r.parentElement.tagName === "THEAD" ? "th" : "td");
        c.innerHTML = "<br>";
        return c;
      };
      const newRow = () => {
        const tr = document.createElement("tr");
        for (let i = 0; i < row.cells.length; i += 1) {
          const c = document.createElement("td");
          c.innerHTML = "<br>";
          tr.appendChild(c);
        }
        return tr;
      };
      switch (op) {
        case "rowAbove":
          if (row.parentElement.tagName === "THEAD") return toast("Add rows below the header.", "info");
          row.before(newRow());
          break;
        case "rowBelow":
          if (row.parentElement.tagName === "THEAD") {
            const body = table.tBodies[0] || table.createTBody();
            body.prepend(newRow());
          } else row.after(newRow());
          break;
        case "colLeft":
        case "colRight":
          [...table.rows].forEach((r) => {
            const ref = r.cells[idx];
            const c = newCell(r);
            if (!ref) r.appendChild(c);
            else if (op === "colLeft") ref.before(c);
            else ref.after(c);
          });
          break;
        case "deleteRow":
          row.remove();
          if (!table.rows.length) table.remove();
          break;
        case "deleteCol":
          [...table.rows].forEach((r) => r.cells[idx]?.remove());
          if (!table.rows[0]?.cells.length) table.remove();
          break;
        case "toggleHeader":
          if (table.tHead) {
            const head = table.tHead;
            const body = table.tBodies[0] || table.createTBody();
            [...head.rows].reverse().forEach((r) => {
              const tr = document.createElement("tr");
              [...r.cells].forEach((c) => {
                const td = document.createElement("td");
                td.innerHTML = c.innerHTML;
                tr.appendChild(td);
              });
              body.prepend(tr);
            });
            head.remove();
          } else {
            const first = table.rows[0];
            const head = table.createTHead();
            const tr = document.createElement("tr");
            [...first.cells].forEach((c) => {
              const th = document.createElement("th");
              th.innerHTML = c.innerHTML;
              tr.appendChild(th);
            });
            head.appendChild(tr);
            first.remove();
          }
          break;
        case "deleteTable":
          table.remove();
          break;
        default:
      }
      afterChange();
    },
    styleBlock: (kind, v) => {
      const el = currentElement();
      const target = el?.closest(STYLE_TARGET_SEL) || el?.closest(BLOCK_SEL);
      if (!target || !root().contains(target)) return toast("Click inside the block you want to style.", "info");
      if (kind === "box") {
        target.classList.forEach((c) => c.startsWith("ce-style-") && target.classList.remove(c));
        if (v !== "none") target.classList.add(`ce-style-${v}`);
      } else if (kind === "anim") {
        target.classList.forEach((c) => c.startsWith("ce-anim-") && target.classList.remove(c));
        if (v !== "none") target.classList.add(`ce-anim-${v}`);
      } else if (kind === "border") {
        target.style.border = v === "none" ? "" : v;
        if (v !== "none" && !target.style.padding) target.style.padding = "0.75rem 1rem";
        if (v !== "none") target.style.borderRadius = "10px";
      } else if (kind === "background") {
        target.style.backgroundColor = v;
        if (!target.style.padding) target.style.padding = "0.75rem 1rem";
        target.style.borderRadius = "10px";
      }
      afterChange();
    },
    imageStyle: (prop, v) => {
      const r = rangeRef.current;
      const el = currentElement();
      const img =
        (r && r.startContainer.nodeType === 1 && r.startContainer.childNodes[r.startOffset]?.tagName === "IMG" && r.startContainer.childNodes[r.startOffset]) ||
        el?.closest("figure,p")?.querySelector("img") ||
        (el?.tagName === "IMG" ? el : null);
      if (!img) return toast("Click an image first.", "info");
      if (prop === "width") {
        img.style.width = `${v}%`;
        img.style.height = "auto";
        img.removeAttribute("width");
        img.removeAttribute("height");
      } else {
        img.classList.remove("ce-float-left", "ce-float-right", "ce-img-block-center");
        if (v === "left") img.classList.add("ce-float-left");
        if (v === "right") img.classList.add("ce-float-right");
        if (v === "center") img.classList.add("ce-img-block-center");
      }
      afterChange();
    },
    tableStyle: (cls) => {
      const current = currentElement()?.closest("table");
      const tables = current ? [current] : [...(root()?.querySelectorAll("table") || [])];
      if (!tables.length) return toast("There are no tables in the document.", "info");
      tables.forEach((t) => {
        t.classList.forEach((c) => c.startsWith("ce-table-") && t.classList.remove(c));
        cls.split(" ").filter(Boolean).forEach((c) => t.classList.add(c));
      });
      afterChange();
      if (!current) toast(`Style applied to all ${tables.length} table(s).`);
    },
    ensureDocWrapper: () => {
      const rt = root();
      let w = rt.querySelector(":scope > .ce-doc");
      if (!w) {
        w = document.createElement("div");
        w.className = "ce-doc";
        while (rt.firstChild) w.appendChild(rt.firstChild);
        if (!w.childNodes.length) w.innerHTML = "<p><br></p>";
        rt.appendChild(w);
      }
      return w;
    },
    setDocSetting: (key, v) => {
      if (!root()) return;
      const w = api.ensureDocWrapper();
      const data = { theme: "ceTheme", width: "ceWidth", headings: "ceHeadings", page: "cePage" };
      if (data[key]) {
        if (!v || v === "full" || v === "plain" || v === "auto") delete w.dataset[data[key]];
        else w.dataset[data[key]] = v;
      } else if (key === "padding") w.style.padding = v === "0" ? "" : v;
      else if (key === "background") w.style.background = v;
      afterChange();
      readDocSettings();
    },
    resetDocSettings: () => {
      const w = root()?.querySelector(":scope > .ce-doc");
      if (!w) return toast("No document design applied.", "info");
      w.replaceWith(...w.childNodes);
      afterChange();
      readDocSettings();
    },
    headerFooter: (kind, remove) => {
      if (!root()) return;
      const w = api.ensureDocWrapper();
      const cls = `ce-doc-${kind}`;
      let el = w.querySelector(`:scope > .${cls}`);
      if (remove) {
        el?.remove();
      } else if (!el) {
        el = document.createElement("div");
        el.className = cls;
        el.innerHTML = kind === "header" ? `<p>${esc(aiContext?.courseTitle || "IICPA Institute")}${aiContext?.title ? ` · ${esc(aiContext.title)}` : ""}</p>` : "<p>© IICPA Institute · For enrolled students only</p>";
        if (kind === "header") w.prepend(el);
        else w.append(el);
      }
      el?.scrollIntoView({ block: "nearest" });
      afterChange();
    },
    insertTemplate: async (key) => {
      const t = TEMPLATES[key];
      if (!t) return;
      if (!htmlToText(html()).trim()) {
        joditRef.current.value = t.html;
        afterChange();
      } else if (await confirmBox("Insert template?", "The template will be inserted at the cursor. Your existing content is kept.")) {
        insertHTML(t.html);
      }
    },
    cleanUp: () => {
      const rt = root();
      if (!rt) return;
      let changes = 0;
      rt.querySelectorAll("font, o\\:p").forEach((n) => {
        n.replaceWith(...n.childNodes);
        changes += 1;
      });
      rt.querySelectorAll("[class]").forEach((n) => {
        const keep = [...n.classList].filter((c) => !/^Mso/i.test(c));
        if (keep.length !== n.classList.length) {
          n.className = keep.join(" ");
          changes += 1;
        }
      });
      rt.querySelectorAll("[style]").forEach((n) => {
        const s = n.getAttribute("style");
        const cleaned = s.split(";").filter((d) => d.trim() && !/^\s*mso-/i.test(d)).join(";");
        if (cleaned !== s) {
          if (cleaned.trim()) n.setAttribute("style", cleaned);
          else n.removeAttribute("style");
          changes += 1;
        }
      });
      rt.querySelectorAll("span:not([class]):not([style])").forEach((n) => {
        n.replaceWith(...n.childNodes);
        changes += 1;
      });
      const isEmpty = (n) => n.tagName === "P" && !n.textContent.replace(/ /g, "").trim() && !n.querySelector("img,iframe,video,audio,input,math");
      rt.querySelectorAll("p").forEach((p) => {
        if (isEmpty(p) && p.previousElementSibling && isEmpty(p.previousElementSibling)) {
          p.remove();
          changes += 1;
        }
      });
      afterChange();
      toast(changes ? `Cleaned up ${changes} item(s).` : "Nothing to clean up.");
    },
    open: (name, props = {}) => {
      if (name === "link") {
        const headings = [...(root()?.querySelectorAll("h1,h2,h3,h4") || [])].map((h, index) => ({
          id: h.id || slugId(h.textContent),
          text: h.textContent.trim(),
          level: Number(h.tagName[1]),
          index,
        }));
        props = { ...props, headings, selectedText: api.selectionText() };
      }
      if (name === "notes") props = { ...props, selectedText: api.selectionText() };
      if (name === "review" && props.autoRun) setTimeout(() => api.ai.review(), 0); // eslint-disable-line no-use-before-define
      setDialog({ name, props });
    },
    close: () => setDialog(null),
    form: runForm,
    notify: (msg, icon = "info") => toast(msg, icon),
    openBlock: (type, existing) => {
      const b = IA_BLOCKS[type];
      if (!b) return;
      const cfg = existing ? decodeConfig(existing.dataset.ceConfig) : null;
      runForm({
        title: `${existing ? "Edit" : "Insert"} ${b.label}`,
        fields: b.fields,
        initial: { ...b.defaults, ...(cfg || {}) },
        validate: b.validate,
        submitLabel: existing ? "Update" : "Insert",
        onSubmit: (c) => {
          setDialog(null);
          if (existing && root()?.contains(existing)) replaceElement(existing, b.render(c));
          else insertHTML(b.render(c));
        },
      });
    },
    openInfographic: (type) => {
      const g = INFOGRAPHICS[type];
      const sel = api.selectionText();
      runForm({
        title: `${g.label} infographic`,
        fields: g.fields,
        initial: { ...g.defaults, ...(sel && g.fields.some((f) => f.name === "items") ? { items: sel } : {}) },
        onSubmit: (c) => {
          setDialog(null);
          insertHTML(renderInfographic(type, c));
        },
      });
    },
    toggleSpellcheck: () => {
      const next = !spellcheck;
      setSpellcheck(next);
      root()?.setAttribute("spellcheck", String(next));
    },
    preview: () => openStudentPreview(),
  };

  // ---------------------------------------------------------------------
  // AI (always through IICPA's AI service; results are previewed first)
  // ---------------------------------------------------------------------
  const ctxBody = () => {
    const c = propsRef.current.aiContext || {};
    return {
      courseId: c.courseId,
      chapterId: c.chapterId,
      courseTitle: c.courseTitle,
      chapterTitle: c.chapterTitle,
      courseDescription: c.courseDescription,
      category: c.category,
      level: c.level,
      audience: c.audience,
    };
  };

  const startAi = async ({ title, url, body, toHtml, buildActions, regenerate }) => {
    aiStopRef.current = false;
    setAi({ open: true, title, status: "running", elapsed: "0:00" });
    try {
      const { result } = await runAi(url, body, {
        onTick: (_job, ms) => setAi((s) => (s ? { ...s, elapsed: formatElapsed(ms) } : s)),
        shouldStop: () => aiStopRef.current,
      });
      const out = sanitizeHtml(toHtml(result));
      if (!out) throw new Error("The AI returned an empty result. Try again.");
      setAi({ open: true, title, status: "done", html: out, actions: buildActions(out, result), regenerate, meta: result });
    } catch (err) {
      if (aiStopRef.current) return setAi(null);
      setAi({ open: true, title, status: "error", error: errorMessage(err), regenerate });
    }
  };

  const insertAfterSelectionBlock = (h, range) => {
    const node = range?.endContainer;
    const el = node && (node.nodeType === 1 ? node : node.parentElement);
    const block = el?.closest(BLOCK_SEL);
    if (block && root()?.contains(block) && block !== root()) {
      const anchor = block.closest("li")?.closest("ul,ol") || block;
      anchor.after(fragmentFrom(h));
      afterChange();
    } else insertHTML(h);
  };

  api.ai = {
    last: lastAiRef.current,
    run: (action, extra = {}) => {
      const selectionHtmlStr = api.selectionHtml();
      const selectionTextStr = api.selectionText().trim();
      const range = rangeRef.current?.cloneRange();
      const c = propsRef.current.aiContext || {};
      const label = { mcqs: "MCQs", faqs: "FAQs", flashcards: "Flashcards" }[action] || action.replace(/-/g, " ");
      lastAiRef.current = { action, extra };
      const doRun = () =>
        startAi({
          title: `AI · ${label.charAt(0).toUpperCase()}${label.slice(1)}`,
          url: "/ai-course/assist",
          body: {
            action,
            text: selectionHtmlStr || selectionTextStr,
            documentText: htmlToText(html()).slice(0, 8000),
            documentTitle: c.title || "",
            ...ctxBody(),
            ...extra,
          },
          toHtml: (result) => (result?.html ? result.html : aiItemsToHtml(action, result)),
          regenerate: doRun,
          buildActions: (out) => {
            const hasSel = !!selectionTextStr;
            const replace = {
              label: "Replace selection",
              variant: "primary",
              onClick: () => {
                rangeRef.current = range;
                // Keep inline replacements inline when the AI wrapped them in a single <p>
                const single = /^<p>([\s\S]*)<\/p>$/i.exec(out.trim());
                insertHTML(single && !/<p[\s>]/i.test(single[1]) ? single[1] : out);
                setAi(null);
                toast("Selection replaced.");
              },
            };
            const below = {
              label: hasSel ? "Insert below selection" : "Insert at cursor",
              variant: hasSel && REPLACE_ACTIONS.has(action) ? "outline" : "primary",
              onClick: () => {
                if (hasSel) insertAfterSelectionBlock(out, range);
                else {
                  rangeRef.current = range;
                  insertHTML(out);
                }
                setAi(null);
                toast("Content inserted.");
              },
            };
            return hasSel && REPLACE_ACTIONS.has(action) ? [below, replace] : [below];
          },
        });
      doRun();
    },
    repeat: () => lastAiRef.current && api.ai.run(lastAiRef.current.action, lastAiRef.current.extra),
    full: async () => {
      const c = propsRef.current.aiContext || {};
      if (!c.kind) return;
      if (!String(c.title || "").trim()) return toast("Enter a title first - AI writes the content from it.", "warning");
      const { value: instructions, isConfirmed } = await Swal.fire({
        title: `Generate with AI`,
        html: `<p style="font-size:14px;margin:0 0 8px">AI will write the complete content for <b>${esc(c.title)}</b> using the course and chapter context. You will review it before anything changes.</p>`,
        input: "textarea",
        inputPlaceholder: "Optional extra instructions (focus areas, examples to include, length…)",
        showCancelButton: true,
        confirmButtonText: "Generate",
      });
      if (!isConfirmed) return;
      const range = rangeRef.current?.cloneRange();
      const doRun = () =>
        startAi({
          title: `AI · Generate ${c.title}`,
          url: "/ai-course/content",
          body: { kind: c.kind, title: c.title, instructions, existingContent: html(), ...ctxBody() },
          toHtml: (result) => result?.html || "",
          regenerate: doRun,
          buildActions: (out, result) => {
            // Lets the parent form pick up SEO fields / items to verify
            const applied = () => propsRef.current.onAiResult?.(result);
            const empty = !htmlToText(html()).trim();
            const replaceAll = {
              label: empty ? "Insert into document" : "Replace entire document",
              variant: empty ? "primary" : "danger",
              onClick: async () => {
                if (!empty && !(await confirmBox("Replace the entire document?", "Your current content will be replaced. You can restore it from Review › History."))) return;
                if (docKey) setHistory(pushHistory(docKey, html(), "Before AI replace"));
                joditRef.current.value = out;
                afterChange();
                applied();
                setAi(null);
                toast("Content added. Review and edit it before saving.");
              },
            };
            if (empty) return [replaceAll];
            return [
              replaceAll,
              {
                label: "Append to end",
                variant: "primary",
                onClick: () => {
                  joditRef.current.value = `${html()}${out}`;
                  afterChange();
                  applied();
                  setAi(null);
                  toast("Content appended.");
                },
              },
              {
                label: "Insert at cursor",
                onClick: () => {
                  rangeRef.current = range;
                  insertHTML(out);
                  applied();
                  setAi(null);
                },
              },
            ];
          },
        });
      doRun();
    },
    review: async () => {
      setReview({ status: "running", elapsed: "0:00" });
      try {
        const { result } = await runAi(
          "/ai-course/review",
          { text: html(), documentTitle: propsRef.current.aiContext?.title || "", level: propsRef.current.aiContext?.level },
          { onTick: (_j, ms) => setReview((s) => ({ ...s, elapsed: formatElapsed(ms) })) }
        );
        setReview({ status: "done", review: result.review });
      } catch (err) {
        setReview({ status: "error", error: errorMessage(err) });
      }
    },
  };

  // ---------------------------------------------------------------------
  // Imperative API for parent forms (apiRef lets long-lived DOM handlers use the latest api)
  // ---------------------------------------------------------------------
  apiRef.current = api;
  useImperativeHandle(ref, () => ({
    getJodit: () => joditRef.current,
    getHtml: html,
    setHtml: (h) => {
      if (!joditRef.current) return;
      joditRef.current.value = h || "";
      afterChange();
    },
    insertHTML: (h) => insertHTML(h),
    insertImage: (url) => insertHTML(`<img src="${esc(url)}" alt="" style="max-width:100%;height:auto">`),
    snapshot: (label) => docKey && setHistory(pushHistory(docKey, html(), label)),
    generateWithAi: () => api.ai.full(),
    openPreview: () => openStudentPreview(),
  }));

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  const d = dialog || {};
  const close = () => setDialog(null);
  const Toolbar = { home: HomeToolbar, insert: InsertToolbar, design: DesignToolbar, interactive: InteractiveToolbar, ai: AiToolbar, review: ReviewToolbar }[tab];
  const read = d.name === "review" ? readability(html()) : null;

  return (
    <div
      className={`ce-editor flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white ${
        fullscreen ? "fixed inset-0 z-[1040] rounded-none" : ""
      } ${className}`}
    >
      {/* Ribbon */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-2">
          <div className="flex overflow-x-auto" role="tablist">
            {visibleTabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setTab(id)}
                className={`relative whitespace-nowrap px-4 py-2.5 text-[14.5px] font-semibold transition ${
                  tab === id ? "rounded-t-lg bg-white text-blue-700 shadow-[0_-1px_0_#e2e8f0]" : "text-slate-700 hover:text-blue-700"
                }`}
              >
                {label}
                {tab === id && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded bg-blue-600" />}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[12.5px] text-slate-500">
            <span className="hidden whitespace-nowrap sm:inline">
              {stats.words} words · ~{stats.readingMinutes} min to complete
            </span>
            <button type="button" title="Undo (Ctrl+Z)" onMouseDown={(e) => e.preventDefault()} onClick={() => api.exec("undo")} className="rounded p-1.5 text-lg text-slate-600 hover:bg-slate-200"><MdUndo /></button>
            <button type="button" title="Redo (Ctrl+Y)" onMouseDown={(e) => e.preventDefault()} onClick={() => api.exec("redo")} className="rounded p-1.5 text-lg text-slate-600 hover:bg-slate-200"><MdRedo /></button>
            <button type="button" title="Student view preview" onMouseDown={(e) => e.preventDefault()} onClick={api.preview} className="rounded p-1.5 text-lg text-slate-600 hover:bg-slate-200"><MdVisibility /></button>
            <button type="button" title={fullscreen ? "Exit full screen" : "Full screen"} onMouseDown={(e) => e.preventDefault()} onClick={() => setFullscreen((f) => !f)} className="rounded p-1.5 text-lg text-slate-600 hover:bg-slate-200">
              {fullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
            </button>
          </div>
        </div>
        <div className="flex min-h-[92px] items-stretch overflow-x-auto px-1 py-1.5">{Toolbar && <Toolbar api={api} />}</div>
      </div>

      {/* Canvas */}
      <div className={`flex min-h-0 flex-1 ${fullscreen ? "overflow-hidden" : ""}`}>
        {sidebar}
        <div className={`min-w-0 flex-1 bg-slate-50 p-2 sm:p-5 ${fullscreen ? "overflow-y-auto" : ""}`}>
          <div className="ce-canvas-host mx-auto max-w-[1100px] rounded-lg border border-slate-200 bg-white shadow-sm">
            <JoditEditor value={initialValue.current} config={config} editorRef={handleEditorRef} onChange={handleChange} onBlur={handleBlur} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {d.name === "form" && <BlockFormDialog open {...d.props} onClose={close} />}
      <TableDialog open={d.name === "table"} onClose={close} onInsert={(h) => { close(); insertHTML(h); }} />
      <LinkDialog
        open={d.name === "link"}
        {...(d.name === "link" ? d.props : {})}
        onClose={close}
        onInsert={({ href, text, newTab, headingIndex }) => {
          close();
          if (headingIndex !== undefined) {
            const h = root()?.querySelectorAll("h1,h2,h3,h4")[headingIndex];
            if (h && !h.id) h.id = href.slice(1);
          }
          insertHTML(`<a href="${esc(href)}"${newTab ? ' target="_blank" rel="noopener"' : ""}>${esc(text)}</a>`);
        }}
      />
      <MediaDialog open={d.name === "media"} kind={d.props?.kind} source={d.props?.source} onClose={close} onInsert={(h) => { close(); insertHTML(h); }} />
      <EquationDialog
        open={d.name === "equation"}
        initial={d.props?.initial}
        onClose={close}
        onInsert={(h) => {
          const target = d.props?.target;
          close();
          if (target && root()?.contains(target)) replaceElement(target, h.replace(/&nbsp;$/, ""));
          else insertHTML(h);
        }}
      />
      <CodeDialog open={d.name === "code"} initialCode={d.props?.initialCode} onClose={close} onInsert={(h) => { close(); insertHTML(h); }} />
      <SymbolDialog open={d.name === "symbol"} onClose={close} onInsert={(s) => { close(); api.insertText(s); }} />
      <FindReplaceDialog open={d.name === "find"} onClose={close} getRoot={root} onChanged={afterChange} />
      <SourceDialog
        open={d.name === "source"}
        html={d.name === "source" ? html() : ""}
        onClose={close}
        onApply={(h) => {
          close();
          if (docKey) setHistory(pushHistory(docKey, html(), "Before source edit"));
          joditRef.current.value = sanitizeHtml(h);
          afterChange();
        }}
      />
      <PasteAiDialog open={d.name === "pasteAi"} onClose={close} onInsert={(h) => { close(); insertHTML(toEditorHtml(h)); }} />
      <ReviewDialog
        open={d.name === "review"}
        focus={d.props?.focus}
        onClose={close}
        stats={stats}
        read={read}
        ai={review}
        onRunAi={api.ai.review}
        onApply={(issue) => {
          const ok = root() ? replaceFirstText(root(), issue.original, issue.suggestion) : false;
          if (ok) afterChange();
          return ok;
        }}
      />
      <HistoryDialog
        open={d.name === "history"}
        onClose={close}
        entries={history}
        serverInfo={docKey ? null : "History is available once the document has been saved."}
        onSaveNow={() => docKey && setHistory(pushHistory(docKey, html(), "Saved manually"))}
        onRestore={async (entry) => {
          if (!(await confirmBox("Restore this version?", "The current content will be replaced (it is kept in history)."))) return;
          if (docKey) setHistory(pushHistory(docKey, html(), "Before restore"));
          joditRef.current.value = entry.html;
          afterChange();
          close();
          toast("Version restored.");
        }}
      />
      <NotesDialog
        open={d.name === "notes"}
        onClose={close}
        notes={notes}
        selectedText={d.props?.selectedText}
        onChange={(n) => {
          setNotes(n);
          if (docKey) writeNotes(docKey, n);
        }}
      />
      <PresentMode open={d.name === "present"} onClose={close} html={d.name === "present" ? html() : ""} title={previewTitle || aiContext?.title} />
      {ai?.open && (
        <AiResultDialog
          open
          title={ai.title}
          status={ai.status}
          elapsed={ai.elapsed}
          error={ai.error}
          html={ai.html}
          actions={ai.actions}
          onRegenerate={ai.regenerate}
          onStop={() => {
            aiStopRef.current = true;
          }}
          onClose={() => setAi(null)}
          note="Waiting for IICPA AI…"
          extra={
            ai.meta?.verifyItems?.length || ai.meta?.seo?.seoTitle ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {ai.meta?.verifyItems?.length > 0 && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">⚠️ Verify before publishing</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {ai.meta.verifyItems.map((v, i) => (
                        <li key={i}>
                          {v.item}
                          {v.source ? <span className="text-amber-700"> - check {v.source}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {ai.meta?.seo?.seoTitle && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">🔎 SEO (saved with the topic)</p>
                    <p className="mt-1 text-[#1a0dab]">{ai.meta.seo.seoTitle}</p>
                    <p className="text-xs text-emerald-700">/{ai.meta.seo.slug}</p>
                    <p className="text-xs text-slate-600">{ai.meta.seo.metaDescription}</p>
                    <p className="mt-1 text-xs"><strong>Focus:</strong> {ai.meta.seo.focusKeyword}{ai.meta.seo.secondaryKeywords?.length ? ` · ${ai.meta.seo.secondaryKeywords.join(", ")}` : ""}</p>
                  </div>
                )}
              </div>
            ) : null
          }
        />
      )}
      <StudentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle || aiContext?.title}
        html={previewOpen ? html() : ""}
        meta={previewMeta || {}}
      />
    </div>
  );
});

export default AdvancedCourseEditor;
