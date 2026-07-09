"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import dynamic from "next/dynamic";

const OptimizedJoditEditor = dynamic(
  () => import("../components/OptimizedJoditEditor"),
  { ssr: false, loading: () => <div className="p-4 text-sm text-gray-400 animate-pulse">Loading editor...</div> }
);

const API_BASE = getApiBase();

// ─── Types ────────────────────────────────────────────────────────────────────

interface Topic {
  _id: string;
  title: string;
}
interface Chapter {
  _id: string;
  title: string;
  topics: Topic[];
}
interface Course {
  _id: string;
  title: string;
  chapters: Chapter[];
}
interface BrochureChapter {
  chapterId: string;
  chapterName: string;
  topics: { topicId: string; topicName: string }[];
}
interface OverlayImage {
  _id?: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  zIndex: number;
}
interface BrochurePage {
  _id?: string;
  pageTitle: string;
  backgroundImage: string;
  backgroundColor: string;
  overlayImages: OverlayImage[];
  content: string;
  textX: number;
  textY: number;
  textColor: string;
  textBold: boolean;
  textSize: number;
  chapterId: string;
  topicId: string;
}
interface CoverPage {
  backgroundImage: string;
  backgroundColor: string;
  overlayImages: OverlayImage[];
  content: string;
  textX: number;
  textY: number;
  textColor: string;
  textBold: boolean;
  textSize: number;
}
interface Brochure {
  _id: string;
  courseId: string;
  courseName: string;
  chapters: BrochureChapter[];
  coverPage: CoverPage;
  pages: BrochurePage[];
  updatedAt: string;
}
interface GroupCourse {
  _id: string;
  groupName: string;
}
interface ManualBrochure {
  _id: string;
  courseId: string;
  courseType: "Course" | "GroupPricing";
  courseName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  updatedAt: string;
}

// Matches the multer limit on POST /brochures/manual
const MANUAL_BROCHURE_MAX_MB = 10;
const MANUAL_BROCHURE_MAX_BYTES = MANUAL_BROCHURE_MAX_MB * 1024 * 1024;
const MANUAL_BROCHURE_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const formatFileSize = (bytes: number) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultCover = (): CoverPage => ({
  backgroundImage: "",
  backgroundColor: "#1e3a5f",
  overlayImages: [],
  content: "",
  textX: 24,
  textY: 24,
  textColor: "#ffffff",
  textBold: false,
  textSize: 16,
});

const defaultPage = (overrides?: Partial<BrochurePage>): BrochurePage => ({
  pageTitle: "",
  backgroundImage: "",
  backgroundColor: "#ffffff",
  overlayImages: [],
  content: "",
  textX: 24,
  textY: 24,
  textColor: "#1a1a1a",
  textBold: false,
  textSize: 16,
  chapterId: "",
  topicId: "",
  ...overrides,
});

// ─── OverlayImage drag/resize component ───────────────────────────────────────

interface DraggableImageProps {
  img: OverlayImage;
  selected: boolean;
  onSelect: () => void;
  onChange: (updated: OverlayImage) => void;
  onDelete: () => void;
}

function DraggableImage({ img, selected, onSelect, onChange, onDelete }: DraggableImageProps) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: img.x, origY: img.y };
    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      onChange({
        ...img,
        x: dragRef.current.origX + me.clientX - dragRef.current.startX,
        y: dragRef.current.origY + me.clientY - dragRef.current.startY,
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: img.width, origH: img.height };
    const onMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      onChange({
        ...img,
        width: Math.max(40, resizeRef.current.origW + me.clientX - resizeRef.current.startX),
        height: Math.max(30, resizeRef.current.origH + me.clientY - resizeRef.current.startY),
      });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: img.x,
        top: img.y,
        width: img.width,
        height: img.height,
        opacity: img.opacity,
        zIndex: img.zIndex + 10,
        cursor: "move",
        border: selected ? "2px solid #3b82f6" : "2px solid transparent",
        boxSizing: "border-box",
      }}
      onMouseDown={handleDragMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} draggable={false} />

      {selected && (
        <>
          {/* Delete */}
          <button
            style={{ position: "absolute", top: -12, right: -12, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 13, lineHeight: "22px", textAlign: "center", zIndex: 100 }}
            onMouseDown={(e) => { e.stopPropagation(); onDelete(); }}
          >×</button>
          {/* Resize handle */}
          <div
            style={{ position: "absolute", bottom: -6, right: -6, width: 14, height: 14, background: "#3b82f6", borderRadius: 2, cursor: "se-resize", zIndex: 100 }}
            onMouseDown={handleResizeMouseDown}
          />
        </>
      )}
    </div>
  );
}

// ─── Canvas editor for one page (background + overlays + text) ────────────────

interface PageCanvasProps {
  page: BrochurePage | CoverPage;
  onUpdate: (updated: BrochurePage | CoverPage) => void;
  uploadImage: (file: File) => Promise<string>;
}

interface UploadedImage { url: string; filename: string; }

function PageCanvas({ page, onUpdate, uploadImage }: PageCanvasProps) {
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [library, setLibrary] = useState<UploadedImage[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const libInputRef = useRef<HTMLInputElement>(null);
  const textEditRef = useRef<HTMLDivElement>(null);

  // Returns true if the contentEditable text box has a non-collapsed selection
  const hasTextSelection = () => {
    const sel = window.getSelection();
    return !!sel && !sel.isCollapsed && textEditRef.current?.contains(sel.anchorNode);
  };

  const applyTextColor = (color: string) => {
    if (hasTextSelection()) {
      // Apply color only to selected text via execCommand
      document.execCommand("foreColor", false, color);
      // Commit updated innerHTML
      if (textEditRef.current) {
        onUpdate({ ...page, content: textEditRef.current.innerHTML } as BrochurePage | CoverPage);
      }
    } else {
      // No selection — change the default color for the whole text block
      onUpdate({ ...page, textColor: color } as BrochurePage | CoverPage);
    }
  };

  const applyBold = () => {
    if (hasTextSelection()) {
      document.execCommand("bold", false);
      if (textEditRef.current) {
        onUpdate({ ...page, content: textEditRef.current.innerHTML } as BrochurePage | CoverPage);
      }
    } else {
      onUpdate({ ...page, textBold: !page.textBold } as BrochurePage | CoverPage);
    }
  };

  // execCommand fontSize uses 1-7 scale; we map px sizes to that scale
  const PX_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72];
  // execCommand fontSize values 1-7 map roughly to: 10,13,16,18,24,32,48px
  // Instead we wrap selected text in a <span style="font-size:Xpx"> manually
  const applySelectionFontSize = (delta: number) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !textEditRef.current?.contains(sel.anchorNode)) {
      // No selection — adjust global textSize
      const cur = page.textSize ?? 16;
      const idx = PX_SIZES.indexOf(cur);
      const next = idx === -1
        ? PX_SIZES.find((s) => (delta > 0 ? s > cur : s < cur)) ?? cur
        : PX_SIZES[Math.max(0, Math.min(PX_SIZES.length - 1, idx + delta))];
      onUpdate({ ...page, textSize: next } as BrochurePage | CoverPage);
      return;
    }
    // Wrap selected text in a span with new font size
    const range = sel.getRangeAt(0);
    // Detect current font size of the anchor node
    const anchorEl = sel.anchorNode?.parentElement;
    const curPx = anchorEl ? parseInt(window.getComputedStyle(anchorEl).fontSize) : (page.textSize ?? 16);
    const idx = PX_SIZES.findIndex((s) => s >= curPx);
    const nextPx = PX_SIZES[Math.max(0, Math.min(PX_SIZES.length - 1, (idx === -1 ? PX_SIZES.length - 1 : idx) + delta))];
    const span = document.createElement("span");
    span.style.fontSize = `${nextPx}px`;
    try {
      range.surroundContents(span);
    } catch {
      // surroundContents fails for multi-element selections; use extractContents
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    // Restore selection
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
    onUpdate({ ...page, content: textEditRef.current.innerHTML } as BrochurePage | CoverPage);
  };

  const fetchLibrary = async () => {
    setLibraryLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/brochures/images`);
      setLibrary(res.data?.data ?? []);
    } catch { /* ignore */ } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => { fetchLibrary(); }, []);

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10 MB.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setLibrary((prev) => [{ url, filename: file.name }, ...prev]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || "Upload failed.";
      setUploadError(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const setAsBg = (url: string) => onUpdate({ ...page, backgroundImage: url } as BrochurePage | CoverPage);

  const insertAsOverlay = (url: string) => {
    const newImg: OverlayImage = { url, x: 40, y: 40, width: 200, height: 150, opacity: 1, zIndex: page.overlayImages.length + 1 };
    onUpdate({ ...page, overlayImages: [...page.overlayImages, newImg] } as BrochurePage | CoverPage);
    setSelectedOverlay(page.overlayImages.length);
  };

  // Read file as base64 data URL — works instantly, no server needed
  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleTextDragMouseDown = (e: React.MouseEvent) => {
    // Don't preventDefault — let the browser focus contentEditable normally.
    // Only begin dragging after the mouse moves ≥4px (distinguishes click from drag).
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const origX = page.textX ?? 24, origY = page.textY ?? 24;
    let dragging = false;

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX, dy = me.clientY - startY;
      if (!dragging && Math.sqrt(dx * dx + dy * dy) < 4) return;
      if (!dragging) { dragging = true; setSelectedOverlay(null); }
      me.preventDefault();
      onUpdate({
        ...page,
        textX: Math.max(0, origX + dx),
        textY: Math.max(0, origY + dy),
      } as BrochurePage | CoverPage);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const updateOverlay = (idx: number, updated: OverlayImage) => {
    const overlayImages = [...page.overlayImages];
    overlayImages[idx] = updated;
    onUpdate({ ...page, overlayImages } as BrochurePage | CoverPage);
  };

  const deleteOverlay = (idx: number) => {
    const overlayImages = page.overlayImages.filter((_, i) => i !== idx);
    onUpdate({ ...page, overlayImages } as BrochurePage | CoverPage);
    setSelectedOverlay(null);
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Use base64 for instant preview; also upload to server for persistence
      const dataUrl = await readAsDataURL(file);
      onUpdate({ ...page, backgroundImage: dataUrl } as BrochurePage | CoverPage);
      // Upload in background and swap the background URL; use callback form to avoid stale page ref
      uploadImage(file).then((serverUrl) => {
        onUpdate({ ...page, backgroundImage: serverUrl } as BrochurePage | CoverPage);
      }).catch(() => { /* keep base64 if upload fails — stripped on save */ });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleOverlayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await readAsDataURL(file);
      const newImg: OverlayImage = { url: dataUrl, x: 40, y: 40, width: 200, height: 150, opacity: 1, zIndex: page.overlayImages.length + 1 };
      const newIdx = page.overlayImages.length;
      onUpdate({ ...page, overlayImages: [...page.overlayImages, newImg] } as BrochurePage | CoverPage);
      setSelectedOverlay(newIdx);
      // Upload in background; swap URL at the captured index via the updateOverlay callback
      const capturedIdx = newIdx;
      const capturedImg = newImg;
      uploadImage(file).then((serverUrl) => {
        updateOverlay(capturedIdx, { ...capturedImg, url: serverUrl });
      }).catch(() => { /* keep base64 until next save attempt */ });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeBg = () => onUpdate({ ...page, backgroundImage: "" } as BrochurePage | CoverPage);

  const deleteLibraryImage = async (filename: string) => {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/brochures/images/${encodeURIComponent(filename)}`);
      setLibrary((prev) => prev.filter((img) => img.filename !== filename));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar — text/color controls only */}
      <div className="flex flex-wrap gap-2 items-center">
        {page.backgroundImage && (
          <button onClick={removeBg} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
            Remove Background
          </button>
        )}
        <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
        <input ref={overlayInputRef} type="file" accept="image/*" className="hidden" onChange={handleOverlayUpload} />
        <input ref={libInputRef} type="file" accept="image/*" className="hidden" onChange={handleLibraryUpload} />
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Bold toggle */}
          <button
            title="Bold text"
            onMouseDown={(e) => { e.preventDefault(); applyBold(); }}
            className={`px-2.5 py-1 text-xs font-bold rounded border transition ${page.textBold ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
          >
            B
          </button>
          {/* Font size: decrease / label / increase — works on selection or whole block */}
          <button
            title="Decrease font size"
            onMouseDown={(e) => { e.preventDefault(); applySelectionFontSize(-1); }}
            className="px-2 py-1 text-xs font-bold rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-100 transition"
          >
            A−
          </button>
          <span className="text-xs text-gray-500 min-w-[28px] text-center select-none">{page.textSize ?? 16}</span>
          <button
            title="Increase font size"
            onMouseDown={(e) => { e.preventDefault(); applySelectionFontSize(1); }}
            className="px-2 py-1 text-xs font-bold rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-100 transition"
          >
            A+
          </button>
          {/* Text color label + palette */}
          <label className="text-xs text-gray-500">Text</label>
          {[
            { color: "#ffffff", title: "White" },
            { color: "#000000", title: "Black" },
            { color: "#ef4444", title: "Red" },
            { color: "#3b82f6", title: "Blue" },
            { color: "#22c55e", title: "Green" },
            { color: "#f59e0b", title: "Amber" },
            { color: "#a855f7", title: "Purple" },
            { color: "#f97316", title: "Orange" },
          ].map(({ color, title }) => (
            <button
              key={color}
              title={title}
              onMouseDown={(e) => { e.preventDefault(); applyTextColor(color); }}
              className="w-5 h-5 rounded-full border-2 transition hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: (page.textColor ?? "#1a1a1a") === color ? "#6366f1" : "#d1d5db",
              }}
            />
          ))}
          <input
            type="color"
            value={page.textColor ?? "#1a1a1a"}
            onChange={(e) => applyTextColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border border-gray-300"
            title="Custom text color"
          />
          <label className="text-xs text-gray-500 ml-1">BG</label>
          <input
            type="color"
            value={page.backgroundColor}
            onChange={(e) => onUpdate({ ...page, backgroundColor: e.target.value } as BrochurePage | CoverPage)}
            className="w-6 h-6 rounded cursor-pointer border border-gray-300"
            title="Background color"
          />
        </div>
      </div>

      {/* ── Upload Images Panel (always visible) ── */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Upload Images</span>
          <button
            onClick={fetchLibrary}
            className="text-xs text-blue-600 hover:underline"
          >
            Refresh Files
          </button>
        </div>

        {/* Upload buttons */}
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-100">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => { setUploadError(null); libInputRef.current?.click(); }}
              disabled={uploading}
              className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {uploading ? "Uploading..." : "Upload Single Image"}
            </button>
            <span className="text-[11px] text-gray-400">Max 10 MB · JPG, PNG, WebP, GIF</span>
          </div>
          {uploadError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5">{uploadError}</p>
          )}
        </div>

        {/* Previously uploaded images */}
        <div className="px-4 py-3">
          {libraryLoading ? (
            <p className="text-xs text-gray-400 text-center py-6">Loading...</p>
          ) : library.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No images uploaded yet. Upload one above.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2 font-medium">Previously Uploaded Images:</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {library.map((img, i) => (
                  <div key={i} className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.filename} className="w-14 h-10 object-cover rounded border border-gray-200 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-700 truncate">{img.filename}</p>
                      <p className="text-[10px] text-gray-400 truncate" title={img.url}>{img.url}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => copyUrl(img.url)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                      >
                        {copiedUrl === img.url ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={() => setAsBg(img.url)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                      >
                        Set BG
                      </button>
                      <button
                        onClick={() => insertAsOverlay(img.url)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                      >
                        Insert
                      </button>
                      <button
                        onClick={() => deleteLibraryImage(img.filename)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Canvas — background + overlay images + text content rendered on top */}
      <div
        className="relative rounded-lg border border-gray-300"
        style={{
          width: "100%",
          minHeight: 420,
          backgroundColor: page.backgroundColor,
          backgroundImage: page.backgroundImage ? `url(${page.backgroundImage})` : "none",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        onClick={() => setSelectedOverlay(null)}
      >
        {/* Overlay images (draggable) */}
        {page.overlayImages.map((img, idx) => (
          <DraggableImage
            key={idx}
            img={img}
            selected={selectedOverlay === idx}
            onSelect={() => setSelectedOverlay(idx)}
            onChange={(updated) => updateOverlay(idx, updated)}
            onDelete={() => deleteOverlay(idx)}
          />
        ))}

        {/* Text content — drag to reposition, click to edit inline */}
        {(page.content !== undefined) && (
          <div
            className="absolute"
            style={{
              zIndex: 5,
              left: page.textX ?? 24,
              top: page.textY ?? 24,
              maxWidth: "calc(100% - 48px)",
              minWidth: 80,
              minHeight: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              .brochure-text-editable { outline: none; }
              .brochure-text-editable:focus { outline: 2px dashed rgba(99,102,241,0.7); outline-offset: 4px; border-radius: 3px; }
              .brochure-text-editable * { }
              .brochure-text-editable p { margin: 0 0 4px 0; }
            `}</style>
            <div
              className="brochure-text-editable"
              contentEditable
              suppressContentEditableWarning
              ref={textEditRef}
              onMouseDown={(e) => {
                // only drag if not already focused (i.e. not in edit mode)
                if (document.activeElement !== e.currentTarget) {
                  handleTextDragMouseDown(e);
                }
              }}
              onFocus={() => setSelectedOverlay(null)}
              onBlur={(e) => {
                // commit innerHTML back as content
                onUpdate({ ...page, content: e.currentTarget.innerHTML } as BrochurePage | CoverPage);
              }}
              dangerouslySetInnerHTML={{ __html: page.content }}
              style={{
                cursor: "text",
                color: page.textColor ?? "#1a1a1a",
                fontWeight: page.textBold ? "bold" : "normal",
                fontSize: page.textSize ?? 16,
                padding: "8px 12px",
                borderRadius: 4,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            />
            {/* Drag handle strip at top so user can still reposition while editing is possible */}
            <div
              style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, cursor: "move", zIndex: 10 }}
              onMouseDown={handleTextDragMouseDown}
              title="Drag to reposition"
            />
          </div>
        )}

        {/* Empty state hint — only when no background, no overlays, and text box is unfocused empty */}
        {page.overlayImages.length === 0 && !page.backgroundImage && !page.content && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none select-none" style={{ zIndex: 1 }}>
            Click text area to type · Upload a background · Add images
          </div>
        )}

        {/* Selected overlay controls */}
        {selectedOverlay !== null && page.overlayImages[selectedOverlay] && (
          <div
            className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg shadow p-2 flex gap-3 items-center"
            style={{ zIndex: 60 }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <label className="text-xs text-gray-600">Opacity</label>
            <input
              type="range" min={0.1} max={1} step={0.05}
              value={page.overlayImages[selectedOverlay].opacity}
              onChange={(e) => updateOverlay(selectedOverlay, { ...page.overlayImages[selectedOverlay], opacity: parseFloat(e.target.value) })}
              className="w-24"
            />
            <label className="text-xs text-gray-600">Layer</label>
            <input
              type="number" min={1} max={20}
              value={page.overlayImages[selectedOverlay].zIndex}
              onChange={(e) => updateOverlay(selectedOverlay, { ...page.overlayImages[selectedOverlay], zIndex: parseInt(e.target.value) })}
              className="w-14 border border-gray-300 rounded px-1 text-xs"
            />
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Stable content editor ────────────────────────────────────────────────────
// Truly uncontrolled: value is only passed on mount (controlled by `key`).
// During typing, NO state updates happen — zero re-renders, perfectly smooth.
// Commits to parent only on blur so the canvas preview refreshes then.

interface ContentEditorProps {
  initialValue: string;
  onCommit: (val: string) => void;
  pageKey: string;
}

function ContentEditor({ initialValue, onCommit, pageKey }: ContentEditorProps) {
  return (
    // key={pageKey} remounts the whole subtree when switching pages,
    // which gives Jodit a fresh initialValue without ever pushing value updates.
    <div key={pageKey} className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
        ✏️ Edit Content — click away to update preview on canvas
      </div>
      <OptimizedJoditEditor
        key={pageKey}
        value={initialValue}
        onChange={() => { /* intentionally empty — no state updates during typing */ }}
        onBlur={onCommit}
        placeholder="Type here — text will appear on top of the background image..."
        height={220}
        uploadApi={`${API_BASE}/brochures/upload-image`}
      />
    </div>
  );
}

// ─── Main BrochureTab ─────────────────────────────────────────────────────────

export default function BrochureTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [coverPage, setCoverPage] = useState<CoverPage>(defaultCover());
  const [pages, setPages] = useState<BrochurePage[]>([]);
  const [activePage, setActivePage] = useState<"cover" | number>("cover");
  const [saving, setSaving] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copyModal, setCopyModal] = useState<{ brochure: Brochure } | null>(null);
  const [copyTargetCourseId, setCopyTargetCourseId] = useState("");
  const [copying, setCopying] = useState(false);
  const [chapterModal, setChapterModal] = useState<{ pageIdx: number } | null>(null);
  const [chapterFrom, setChapterFrom] = useState(1);
  const [chapterTo, setChapterTo] = useState(1);

  // Manual Upload tab state
  const [activeTab, setActiveTab] = useState<"builder" | "manual">("builder");
  const [groupCourses, setGroupCourses] = useState<GroupCourse[]>([]);
  const [manualBrochures, setManualBrochures] = useState<ManualBrochure[]>([]);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualCourseKey, setManualCourseKey] = useState("");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualUploading, setManualUploading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
    fetchBrochures();
    fetchGroupCourses();
    fetchManualBrochures();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/courses`);
      const data = res.data?.data ?? res.data;
      setCourses(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const fetchBrochures = async () => {
    try {
      const res = await axios.get(`${API_BASE}/brochures`);
      setBrochures(res.data?.data ?? []);
    } catch { /* ignore */ }
  };

  const fetchGroupCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/group-pricing`);
      const data = res.data?.data ?? res.data;
      setGroupCourses(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const fetchManualBrochures = async () => {
    try {
      const res = await axios.get(`${API_BASE}/brochures/manual`);
      setManualBrochures(res.data?.data ?? []);
    } catch { /* ignore */ }
  };

  const openManualModal = (preselectKey?: string) => {
    setManualCourseKey(preselectKey ?? "");
    setManualFile(null);
    setManualError(null);
    setManualModalOpen(true);
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setManualError(null);
    if (!file) { setManualFile(null); return; }
    if (!MANUAL_BROCHURE_MIMES.includes(file.type)) {
      setManualError("Only PDF, DOC, or DOCX files are allowed.");
      setManualFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > MANUAL_BROCHURE_MAX_BYTES) {
      setManualError(`File too large (${formatFileSize(file.size)}). Maximum size is ${MANUAL_BROCHURE_MAX_MB} MB.`);
      setManualFile(null);
      e.target.value = "";
      return;
    }
    setManualFile(file);
  };

  const handleManualUpload = async () => {
    if (!manualCourseKey || !manualFile) return;
    const [kind, id] = manualCourseKey.split(":");
    const isGroup = kind === "group";
    const courseName = isGroup
      ? groupCourses.find((g) => g._id === id)?.groupName
      : courses.find((c) => c._id === id)?.title;
    if (!courseName) return;

    setManualUploading(true);
    setManualError(null);
    try {
      const formData = new FormData();
      formData.append("file", manualFile);
      formData.append("courseId", id);
      formData.append("courseName", courseName);
      formData.append("courseType", isGroup ? "GroupPricing" : "Course");
      await axios.post(`${API_BASE}/brochures/manual`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setManualModalOpen(false);
      setMessage({ type: "success", text: `Brochure uploaded for "${courseName}" successfully!` });
      fetchManualBrochures();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } }; message?: string };
      const msg =
        axiosErr?.response?.status === 413
          ? `File too large. Maximum size is ${MANUAL_BROCHURE_MAX_MB} MB.`
          : axiosErr?.response?.data?.error || axiosErr?.message || "Upload failed.";
      setManualError(msg);
    } finally {
      setManualUploading(false);
    }
  };

  const handleManualDelete = async (b: ManualBrochure) => {
    if (!confirm(`Delete the uploaded brochure for "${b.courseName}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/brochures/manual/${b._id}`);
      setManualBrochures((prev) => prev.filter((m) => m._id !== b._id));
    } catch {
      setMessage({ type: "error", text: "Failed to delete brochure." });
    }
  };

  // Compress image to stay under ~900 KB before uploading (handles nginx 1MB limit)
  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve) => {
      const MAX_PX = 1920;   // max dimension
      const QUALITY = 0.82;  // JPEG quality
      const TARGET_BYTES = 900 * 1024; // stop compressing below this

      if (file.size <= TARGET_BYTES) { resolve(file); return; }

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          const ratio = Math.min(MAX_PX / width, MAX_PX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));
            else resolve(file);
          },
          "image/jpeg",
          QUALITY
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("image", compressed);
    const res = await axios.post(`${API_BASE}/brochures/upload-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.imageUrl as string;
  }, []);

  const handleCourseSelect = async (courseId: string) => {
    if (!courseId) {
      setSelectedCourse(null);
      setCoverPage(defaultCover());
      setPages([]);
      setActivePage("cover");
      return;
    }
    setLoadingCourse(true);
    try {
      const res = await axios.get(`${API_BASE}/courses/${courseId}`);
      const course: Course = res.data?.data ?? res.data;
      setSelectedCourse(course);

      const existing = brochures.find((b) => b.courseId === courseId);
      if (existing) {
        setCoverPage(existing.coverPage ?? defaultCover());
        setPages(existing.pages ?? []);
      } else {
        setCoverPage(defaultCover());
        setPages([]);
      }
      setActivePage("cover");
    } catch {
      setMessage({ type: "error", text: "Failed to load course details." });
    } finally {
      setLoadingCourse(false);
    }
  };

  const addBlankPage = () => {
    setPages((prev) => {
      const next = [...prev, defaultPage({ pageTitle: `Page ${prev.length + 1}` })];
      setActivePage(next.length - 1);
      return next;
    });
  };

  const deletePage = (idx: number) => {
    setPages((prev) => prev.filter((_, i) => i !== idx));
    setActivePage("cover");
  };

  const updatePage = (idx: number, updated: BrochurePage) => {
    setPages((prev) => prev.map((p, i) => (i === idx ? updated : p)));
  };

  const stripBase64 = <T extends { backgroundImage: string; overlayImages: OverlayImage[] }>(p: T): T => ({
    ...p,
    backgroundImage: p.backgroundImage?.startsWith("data:") ? "" : p.backgroundImage,
    overlayImages: p.overlayImages.map((img) => ({
      ...img,
      url: img.url?.startsWith("data:") ? "" : img.url,
    })),
  });

  const handleSave = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    setMessage(null);
    try {
      const chapters: BrochureChapter[] = (selectedCourse.chapters ?? []).map((ch) => ({
        chapterId: ch._id,
        chapterName: ch.title,
        topics: (ch.topics ?? []).map((t) => ({ topicId: t._id, topicName: t.title })),
      }));

      await axios.post(`${API_BASE}/brochures`, {
        courseId: selectedCourse._id,
        courseName: selectedCourse.title,
        chapters,
        coverPage: stripBase64(coverPage),
        pages: pages.map(stripBase64),
      });

      setMessage({ type: "success", text: "Brochure saved successfully!" });
      fetchBrochures();
    } catch {
      setMessage({ type: "error", text: "Failed to save brochure." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brochure?")) return;
    try {
      await axios.delete(`${API_BASE}/brochures/${id}`);
      setBrochures((prev) => prev.filter((b) => b._id !== id));
    } catch {
      setMessage({ type: "error", text: "Failed to delete brochure." });
    }
  };

  const handleLoadBrochure = (brochure: Brochure) => {
    handleCourseSelect(brochure.courseId);
  };

  const openCopyModal = (brochure: Brochure) => {
    setCopyTargetCourseId("");
    setCopyModal({ brochure });
  };

  const handleCopy = async () => {
    if (!copyModal || !copyTargetCourseId) return;
    const targetCourse = courses.find((c) => c._id === copyTargetCourseId);
    if (!targetCourse) return;
    setCopying(true);
    try {
      const src = copyModal.brochure;
      const chapters: BrochureChapter[] = (targetCourse.chapters ?? []).map((ch) => ({
        chapterId: ch._id,
        chapterName: ch.title,
        topics: (ch.topics ?? []).map((t) => ({ topicId: t._id, topicName: t.title })),
      }));
      await axios.post(`${API_BASE}/brochures`, {
        courseId: targetCourse._id,
        courseName: targetCourse.title,
        chapters,
        coverPage: src.coverPage,
        pages: src.pages,
      });
      setMessage({ type: "success", text: `Brochure copied to "${targetCourse.title}" successfully!` });
      fetchBrochures();
      setCopyModal(null);
    } catch {
      setMessage({ type: "error", text: "Failed to copy brochure." });
    } finally {
      setCopying(false);
    }
  };

  const openChapterModal = (pageIdx: number) => {
    const total = selectedCourse?.chapters?.length ?? 1;
    setChapterFrom(1);
    setChapterTo(Math.min(5, total));
    setChapterModal({ pageIdx });
  };

  const insertChapters = () => {
    if (!chapterModal || !selectedCourse) return;
    const chapters = selectedCourse.chapters ?? [];
    const from = Math.max(1, chapterFrom);
    const to = Math.min(chapters.length, chapterTo);
    const selected = chapters.slice(from - 1, to);

    const html = selected.map((ch) => {
      const topicList = (ch.topics ?? []).length > 0
        ? `<ul style="margin:4px 0 8px 16px; padding:0;">${ch.topics.map((t) => `<li style="margin:2px 0;">${t.title}</li>`).join("")}</ul>`
        : "";
      return `<p style="margin:0 0 2px 0;"><strong>${ch.title}</strong></p>${topicList}`;
    }).join("");

    updatePage(chapterModal.pageIdx, {
      ...pages[chapterModal.pageIdx],
      content: (pages[chapterModal.pageIdx].content || "") + html,
      pageTitle: pages[chapterModal.pageIdx].pageTitle || `Chapters ${from}–${to}`,
    });
    setChapterModal(null);
  };

  const pageList = [
    { label: "Cover Page", key: "cover" as const },
    ...pages.map((p, i) => ({ label: p.pageTitle || `Page ${i + 1}`, key: i as number })),
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Manage Brochures</h2>

      {message && (
        <div className={`px-4 py-3 rounded text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
          {message.text}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: "builder" as const, label: "Brochure Builder" },
          { key: "manual" as const, label: "Manual Upload" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "builder" && (<>
      {/* ── Course selector + editor in one block ── */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
          {selectedCourse ? (
            <>
              <button
                onClick={() => handleCourseSelect("")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <span className="text-sm font-semibold text-gray-700 truncate max-w-xs">{selectedCourse.title}</span>
              <button
                onClick={addBlankPage}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition ml-auto"
              >
                + Blank Page
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Save Brochure"}
              </button>
            </>
          ) : (
            <select
              className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleCourseSelect(e.target.value)}
              value=""
            >
              <option value="">-- Select a course to build brochure --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          )}
        </div>

        {loadingCourse && (
          <p className="px-6 py-4 text-sm text-gray-500 animate-pulse">Loading course...</p>
        )}

        {selectedCourse && !loadingCourse && (
          <div className="flex min-h-[640px]">
            {/* Sidebar */}
            <aside className="w-52 border-r border-gray-100 bg-gray-50 flex-shrink-0 overflow-y-auto">
              <div className="p-3 space-y-1">
                {pageList.map((item) => (
                  <button
                    key={item.key.toString()}
                    onClick={() => setActivePage(item.key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition ${
                      activePage === item.key
                        ? "bg-blue-600 text-white font-medium"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={addBlankPage}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
                >
                  + Add blank page
                </button>
              </div>
            </aside>

            {/* Editor area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {activePage === "cover" ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Cover Page</h4>
                  <PageCanvas
                    page={coverPage}
                    onUpdate={(u) => setCoverPage(u as CoverPage)}
                    uploadImage={uploadImage}
                  />
                  <ContentEditor
                    pageKey="cover"
                    initialValue={coverPage.content}
                    onCommit={(val) => setCoverPage((prev) => ({ ...prev, content: val }))}
                  />
                </div>
              ) : (
                typeof activePage === "number" && pages[activePage] && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="text"
                        value={pages[activePage].pageTitle}
                        onChange={(e) => updatePage(activePage, { ...pages[activePage], pageTitle: e.target.value })}
                        placeholder="Page title..."
                        className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button
                        onClick={() => openChapterModal(activePage)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10" />
                        </svg>
                        Load Chapters &amp; Topics
                      </button>
                      <button
                        onClick={() => deletePage(activePage)}
                        className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        Delete Page
                      </button>
                    </div>
                    <PageCanvas
                      page={pages[activePage]}
                      onUpdate={(u) => updatePage(activePage, u as BrochurePage)}
                      uploadImage={uploadImage}
                    />
                    <ContentEditor
                      pageKey={`page-${activePage}`}
                      initialValue={pages[activePage].content}
                      onCommit={(val) => updatePage(activePage, { ...pages[activePage], content: val })}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {!selectedCourse && !loadingCourse && (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">
            Select a course above to start building its brochure
          </div>
        )}
      </div>

      {/* ── Saved Brochures Table ── */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Saved Brochures</h3>
        {brochures.length === 0 ? (
          <p className="text-sm text-gray-400">No brochures saved yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Course</th>
                  <th className="pb-2 pr-4">Chapters</th>
                  <th className="pb-2 pr-4">Pages</th>
                  <th className="pb-2 pr-4">Last Updated</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brochures.map((b) => (
                  <tr key={b._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-800">{b.courseName}</td>
                    <td className="py-3 pr-4 text-gray-600">{b.chapters.length} chapter(s)</td>
                    <td className="py-3 pr-4 text-gray-600">{(b.pages ?? []).length} page(s)</td>
                    <td className="py-3 pr-4 text-gray-500">{new Date(b.updatedAt).toLocaleDateString()}</td>
                    <td className="py-3 flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleLoadBrochure(b)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openCopyModal(b)}
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 transition"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>)}

      {activeTab === "manual" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Manually Uploaded Brochures</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Upload a ready-made brochure document (PDF, DOC, DOCX · max {MANUAL_BROCHURE_MAX_MB} MB) for a single course or a group course.
              </p>
            </div>
            <button
              onClick={() => openManualModal()}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Brochure
            </button>
          </div>

          {manualBrochures.length === 0 ? (
            <div className="py-14 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
              No brochures uploaded yet. Click "Add Brochure" to upload one for a course.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Course</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">File</th>
                    <th className="pb-2 pr-4">Size</th>
                    <th className="pb-2 pr-4">Last Updated</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manualBrochures.map((b) => (
                    <tr key={b._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-800">{b.courseName}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${b.courseType === "GroupPricing" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"}`}>
                          {b.courseType === "GroupPricing" ? "Group Course" : "Single Course"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-[220px] truncate" title={b.fileName}>{b.fileName}</td>
                      <td className="py-3 pr-4 text-gray-600">{formatFileSize(b.fileSize)}</td>
                      <td className="py-3 pr-4 text-gray-500">{new Date(b.updatedAt).toLocaleDateString()}</td>
                      <td className="py-3 flex gap-2 flex-wrap">
                        <a
                          href={b.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200 transition"
                        >
                          View
                        </a>
                        <button
                          onClick={() => openManualModal(`${b.courseType === "GroupPricing" ? "group" : "course"}:${b.courseId}`)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => handleManualDelete(b)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Manual Upload Modal ── */}
      {manualModalOpen && (() => {
        const withBrochure = new Set(manualBrochures.map((b) => `${b.courseType === "GroupPricing" ? "group" : "course"}:${b.courseId}`));
        const replacing = manualCourseKey && withBrochure.has(manualCourseKey);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Upload Brochure</h3>
                <button onClick={() => setManualModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-medium">Course</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={manualCourseKey}
                  onChange={(e) => { setManualCourseKey(e.target.value); setManualError(null); }}
                >
                  <option value="">-- Select a course --</option>
                  {courses.length > 0 && (
                    <optgroup label="Single Courses">
                      {courses.map((c) => (
                        <option key={c._id} value={`course:${c._id}`}>
                          {c.title}{withBrochure.has(`course:${c._id}`) ? " (has brochure)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {groupCourses.length > 0 && (
                    <optgroup label="Group Courses">
                      {groupCourses.map((g) => (
                        <option key={g._id} value={`group:${g._id}`}>
                          {g.groupName}{withBrochure.has(`group:${g._id}`) ? " (has brochure)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {replacing && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                    This course already has an uploaded brochure — uploading a new file will replace it.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 font-medium">Brochure Document</label>
                <input
                  ref={manualFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleManualFileChange}
                  className="w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-medium hover:file:bg-blue-100 file:cursor-pointer border border-gray-300 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-gray-400">PDF, DOC, or DOCX · Maximum {MANUAL_BROCHURE_MAX_MB} MB</p>
                {manualFile && (
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 truncate">
                    {manualFile.name} · {formatFileSize(manualFile.size)}
                  </p>
                )}
              </div>

              {manualError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{manualError}</p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualUpload}
                  disabled={!manualCourseKey || !manualFile || manualUploading}
                  className="px-5 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                >
                  {manualUploading ? "Uploading..." : replacing ? "Replace Brochure" : "Upload Brochure"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Load Chapters & Topics Modal ── */}
      {chapterModal && selectedCourse && (() => {
        const total = selectedCourse.chapters?.length ?? 0;
        const chapters = selectedCourse.chapters ?? [];
        const from = Math.max(1, chapterFrom);
        const to = Math.min(total, chapterTo);
        const preview = chapters.slice(from - 1, to);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800">Load Chapters &amp; Topics</h3>
                <button onClick={() => setChapterModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>

              {/* Range picker */}
              <div className="px-6 py-4 border-b border-gray-100 space-y-3">
                <p className="text-xs text-gray-500">
                  Course has <span className="font-semibold text-gray-700">{total}</span> chapter{total !== 1 ? "s" : ""}. Select the range to insert into this page.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-500 font-medium">From chapter</label>
                    <input
                      type="number" min={1} max={total}
                      value={chapterFrom}
                      onChange={(e) => setChapterFrom(Math.min(Number(e.target.value), chapterTo))}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <span className="text-gray-400 mt-5">—</span>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-500 font-medium">To chapter</label>
                    <input
                      type="number" min={chapterFrom} max={total}
                      value={chapterTo}
                      onChange={(e) => setChapterTo(Math.max(Number(e.target.value), chapterFrom))}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                </div>
                {/* Quick range buttons */}
                <div className="flex gap-2 flex-wrap">
                  {total > 0 && Array.from({ length: Math.ceil(total / 5) }, (_, i) => {
                    const f = i * 5 + 1, t = Math.min(f + 4, total);
                    return (
                      <button key={i} onClick={() => { setChapterFrom(f); setChapterTo(t); }}
                        className="px-2.5 py-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded hover:bg-violet-100 transition"
                      >
                        {f}–{t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Preview ({preview.length} chapter{preview.length !== 1 ? "s" : ""})</p>
                {preview.length === 0 ? (
                  <p className="text-sm text-gray-400">No chapters in selected range.</p>
                ) : preview.map((ch, i) => (
                  <div key={ch._id} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-gray-800">{from + i}. {ch.title}</p>
                    {ch.topics?.length > 0 && (
                      <ul className="mt-1 space-y-0.5 pl-4 list-disc">
                        {ch.topics.map((t) => (
                          <li key={t._id} className="text-xs text-gray-600">{t.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setChapterModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={insertChapters}
                  disabled={preview.length === 0}
                  className="px-5 py-2 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition font-medium"
                >
                  Insert into Editor
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Copy Brochure Modal ── */}
      {copyModal && (() => {
        const usedCourseIds = new Set(brochures.map((b) => b.courseId));
        const availableCourses = courses.filter(
          (c) => c._id !== copyModal.brochure.courseId && !usedCourseIds.has(c._id)
        );
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Copy Brochure</h3>
                <button onClick={() => setCopyModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <p className="text-sm text-gray-500">
                Copying design from <span className="font-medium text-gray-700">"{copyModal.brochure.courseName}"</span> to a new course.
              </p>
              {availableCourses.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  All courses already have a brochure. Delete an existing brochure first to copy here.
                </p>
              ) : (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={copyTargetCourseId}
                  onChange={(e) => setCopyTargetCourseId(e.target.value)}
                >
                  <option value="">-- Select destination course --</option>
                  {availableCourses.map((c) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              )}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setCopyModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                {availableCourses.length > 0 && (
                  <button
                    onClick={handleCopy}
                    disabled={!copyTargetCourseId || copying}
                    className="px-5 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition font-medium"
                  >
                    {copying ? "Copying..." : "Copy Brochure"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
