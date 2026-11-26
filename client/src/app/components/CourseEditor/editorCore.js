"use client";
// Shared helpers for the Advanced Course Editor: escaping, uploads, text
// statistics, readability, Markdown conversion and DOM text search.
import axios from "axios";
import { getApiBase } from "@/lib/apiBase";

export const STATIC_CDN_BASE = process.env.NEXT_PUBLIC_STATIC_CDN_BASE || "https://cdn.iicpa.in";

export const esc = (s = "") =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const uid = (p = "ce") => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const isSafeUrl = (url = "") => {
  try {
    const u = new URL(String(url).trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

export const formatBytes = (n = 0) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

// ---------------------------------------------------------------------------
// Uploads (same services the existing course editors use)
// ---------------------------------------------------------------------------
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
export const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.gif,.webp";
export const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip";
export const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.ogg,.aac";

const adminHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function uploadImageFile(file) {
  if (!file) throw new Error("Choose an image first.");
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Only PNG, JPG, GIF or WEBP images are allowed.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be smaller than 10 MB.");
  const fd = new FormData();
  fd.append("image", file);
  const res = await axios.post(`${STATIC_CDN_BASE}/upload/image`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const url = res.data?.data?.cdnUrl || res.data?.cdnUrl || res.data?.imageUrl || "";
  if (!url) throw new Error("The upload service did not return an image URL.");
  return url;
}

export async function uploadVideoFile(file, onProgress) {
  if (!file) throw new Error("Choose a video first.");
  if (!file.type.startsWith("video/")) throw new Error("Only video files are allowed.");
  if (file.size > 350 * 1024 * 1024) throw new Error("Video must be smaller than 350 MB.");
  const fd = new FormData();
  fd.append("video", file);
  const res = await axios.post(`${STATIC_CDN_BASE}/upload/video`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  });
  const url = res.data?.data?.cdnUrl || res.data?.videoUrl || res.data?.data?.videoUrl || "";
  if (!url) throw new Error("The upload service did not return a video URL.");
  return url;
}

// Documents and audio go to the IICPA backend (/api/upload/attachment)
export async function uploadAttachmentFile(file, onProgress) {
  if (!file) throw new Error("Choose a file first.");
  if (file.size > 25 * 1024 * 1024) throw new Error("File must be smaller than 25 MB.");
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await axios.post(`${getApiBase()}/upload/attachment`, fd, {
      headers: { ...adminHeaders(), "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    });
    return { url: res.data.url, name: res.data.originalName || file.name, size: res.data.size || file.size };
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "Upload failed.");
  }
}

// ---------------------------------------------------------------------------
// Text statistics & readability
// ---------------------------------------------------------------------------
export const htmlToText = (html = "") => {
  if (typeof window === "undefined") return String(html).replace(/<[^>]*>/g, " ");
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("script,style").forEach((n) => n.remove());
  // Block elements should separate words
  div.querySelectorAll("p,div,li,h1,h2,h3,h4,h5,h6,tr,br,td,th").forEach((n) => n.append(" "));
  return (div.textContent || "").replace(/ /g, " ");
};

export const countStats = (html = "") => {
  const text = htmlToText(html).replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
  return {
    words,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    readingMinutes: Math.max(1, Math.ceil(words / 200)),
  };
};

const syllables = (word) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
};

export const readability = (html = "") => {
  const text = htmlToText(html).replace(/\s+/g, " ").trim();
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/).map((s) => s.trim()).filter((s) => s.split(" ").length > 2);
  const words = text.split(" ").filter((w) => /[a-z]/i.test(w));
  if (!words.length || !sentences.length) return null;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const wps = words.length / sentences.length;
  const spw = syl / words.length;
  const score = Math.round(206.835 - 1.015 * wps - 84.6 * spw);
  const grade = Math.max(1, Math.round(0.39 * wps + 11.8 * spw - 15.59));
  const label =
    score >= 70 ? "Easy" : score >= 60 ? "Plain English" : score >= 50 ? "Fairly difficult" : score >= 30 ? "Difficult" : "Very difficult";
  const longSentences = sentences.filter((s) => s.split(" ").length > 25);
  const passive = sentences.filter((s) => /\b(is|are|was|were|be|been|being)\s+\w+(ed|en)\b/i.test(s));
  const complexWords = words.filter((w) => syllables(w) >= 4).length;
  return {
    score: Math.max(0, Math.min(100, score)),
    grade,
    label,
    sentences: sentences.length,
    avgSentenceLength: Math.round(wps * 10) / 10,
    longSentences,
    passiveCount: passive.length,
    complexWordPct: Math.round((complexWords / words.length) * 100),
  };
};

// ---------------------------------------------------------------------------
// Markdown -> HTML (for "Paste AI Output")
// ---------------------------------------------------------------------------
const inlineMd = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

export const looksLikeHtml = (t = "") => /<(p|h[1-6]|ul|ol|li|table|div|strong|em|br|blockquote)\b/i.test(t);

export const markdownToHtml = (md = "") => {
  const lines = String(md).replace(/\r/g, "").split("\n");
  const out = [];
  let list = null;
  let para = [];
  let table = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${inlineMd(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inlineMd(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  const flushTable = () => {
    if (table.length) {
      const rows = table.filter((r) => !/^\|?\s*:?-{2,}/.test(r)).map((r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      const [head, ...body] = rows;
      out.push(
        `<table><thead><tr>${head.map((c) => `<th>${inlineMd(c)}</th>`).join("")}</tr></thead><tbody>${body
          .map((r) => `<tr>${r.map((c) => `<td>${inlineMd(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`
      );
    }
    table = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (/^\|.*\|$/.test(t)) {
      flushPara();
      flushList();
      table.push(t);
      continue;
    }
    flushTable();
    if (!t) {
      flushPara();
      flushList();
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(t);
    if (h) {
      flushPara();
      flushList();
      const level = Math.min(4, Math.max(2, h[1].length));
      out.push(`<h${level}>${inlineMd(h[2])}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(t)) {
      flushPara();
      flushList();
      out.push("<hr>");
      continue;
    }
    if (/^>\s?/.test(t)) {
      flushPara();
      flushList();
      out.push(`<blockquote><p>${inlineMd(t.replace(/^>\s?/, ""))}</p></blockquote>`);
      continue;
    }
    const ul = /^[-*+•]\s+(.*)$/.exec(t);
    const ol = /^\d+[.)]\s+(.*)$/.exec(t);
    if (ul || ol) {
      flushPara();
      const tag = ul ? "ul" : "ol";
      if (!list || list.tag !== tag) {
        flushList();
        list = { tag, items: [] };
      }
      list.items.push((ul || ol)[1]);
      continue;
    }
    flushList();
    para.push(t);
  }
  flushPara();
  flushList();
  flushTable();
  return out.join("\n");
};

// Strip anything executable from pasted / AI-produced HTML
export const sanitizeHtml = (html = "") =>
  String(html)
    .replace(/<\s*(script|style|object|embed|form|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|object|embed|form|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"')
    .replace(/```[a-z]*\n?/gi, "")
    .trim();

export const toEditorHtml = (raw = "") => sanitizeHtml(looksLikeHtml(raw) ? raw : markdownToHtml(raw));

// ---------------------------------------------------------------------------
// Text search inside a DOM root (Find & Replace, applying review fixes)
// ---------------------------------------------------------------------------
const textNodes = (root) => {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest("[contenteditable='false']") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildMatcher = (query, { matchCase = false, wholeWord = false } = {}) => {
  if (!query) return null;
  const body = wholeWord ? `\\b${escapeRegex(query)}\\b` : escapeRegex(query);
  return new RegExp(body, matchCase ? "g" : "gi");
};

/** Every match as { node, start, end } (matches never span text nodes) */
export const findMatches = (root, matcher) => {
  if (!root || !matcher) return [];
  const out = [];
  for (const node of textNodes(root)) {
    matcher.lastIndex = 0;
    let m;
    while ((m = matcher.exec(node.nodeValue))) {
      out.push({ node, start: m.index, end: m.index + m[0].length });
      if (!m[0].length) matcher.lastIndex += 1;
    }
  }
  return out;
};

export const replaceAllMatches = (root, matcher, replacement) => {
  let count = 0;
  for (const node of textNodes(root)) {
    matcher.lastIndex = 0;
    const next = node.nodeValue.replace(matcher, () => {
      count += 1;
      return replacement;
    });
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  return count;
};

/** Replace the first exact occurrence of `original` (used by AI review fixes) */
export const replaceFirstText = (root, original, replacement) => {
  const matcher = buildMatcher(original, { matchCase: true });
  const [hit] = findMatches(root, matcher);
  if (!hit) return false;
  const v = hit.node.nodeValue;
  hit.node.nodeValue = v.slice(0, hit.start) + replacement + v.slice(hit.end);
  return true;
};

// ---------------------------------------------------------------------------
// Local version history (per document, in this browser)
// ---------------------------------------------------------------------------
const HISTORY_LIMIT = 25;
const historyKey = (docKey) => `iicpa-editor-history:${docKey}`;

export const readHistory = (docKey) => {
  if (!docKey) return [];
  try {
    return JSON.parse(localStorage.getItem(historyKey(docKey)) || "[]");
  } catch {
    return [];
  }
};

export const pushHistory = (docKey, html, label = "Auto-saved") => {
  if (!docKey || !html) return readHistory(docKey);
  const list = readHistory(docKey);
  if (list[0]?.html === html) return list;
  const entry = { at: new Date().toISOString(), label, html, words: countStats(html).words };
  const next = [entry, ...list].slice(0, HISTORY_LIMIT);
  try {
    localStorage.setItem(historyKey(docKey), JSON.stringify(next));
  } catch {
    // Storage full - keep the newest few only
    try {
      localStorage.setItem(historyKey(docKey), JSON.stringify(next.slice(0, 5)));
    } catch {
      /* ignore */
    }
  }
  return next;
};

const notesKey = (docKey) => `iicpa-editor-notes:${docKey}`;
export const readNotes = (docKey) => {
  if (!docKey) return [];
  try {
    return JSON.parse(localStorage.getItem(notesKey(docKey)) || "[]");
  } catch {
    return [];
  }
};
export const writeNotes = (docKey, notes) => {
  try {
    localStorage.setItem(notesKey(docKey), JSON.stringify(notes));
  } catch {
    /* ignore */
  }
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(d);
};
