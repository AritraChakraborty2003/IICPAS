"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";
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

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultCover = (): CoverPage => ({
  backgroundImage: "",
  backgroundColor: "#1e3a5f",
  overlayImages: [],
  content: "",
  textX: 24,
  textY: 24,
  textColor: "#ffffff",
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

function PageCanvas({ page, onUpdate, uploadImage }: PageCanvasProps) {
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const textDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Read file as base64 data URL — works instantly, no server needed
  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleTextDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedOverlay(null);
    textDragRef.current = { startX: e.clientX, startY: e.clientY, origX: page.textX ?? 24, origY: page.textY ?? 24 };
    const onMove = (me: MouseEvent) => {
      if (!textDragRef.current) return;
      onUpdate({
        ...page,
        textX: Math.max(0, textDragRef.current.origX + me.clientX - textDragRef.current.startX),
        textY: Math.max(0, textDragRef.current.origY + me.clientY - textDragRef.current.startY),
      } as BrochurePage | CoverPage);
    };
    const onUp = () => {
      textDragRef.current = null;
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
      // Upload in background and swap URL once done
      uploadImage(file).then((serverUrl) => {
        onUpdate({ ...page, backgroundImage: serverUrl } as BrochurePage | CoverPage);
      }).catch(() => { /* keep base64 if upload fails */ });
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
      // Upload in background and swap URL
      uploadImage(file).then((serverUrl) => {
        onUpdate({
          ...page,
          overlayImages: [...page.overlayImages, { ...newImg, url: serverUrl }],
        } as BrochurePage | CoverPage);
      }).catch(() => { /* keep base64 */ });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeBg = () => onUpdate({ ...page, backgroundImage: "" } as BrochurePage | CoverPage);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => bgInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {uploading ? "Uploading..." : page.backgroundImage ? "Change Background" : "Upload Background Image"}
        </button>
        {page.backgroundImage && (
          <button onClick={removeBg} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
            Remove Background
          </button>
        )}
        <button
          onClick={() => overlayInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          + Add Image
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-gray-500">Text</label>
          <button
            title="White text"
            onClick={() => onUpdate({ ...page, textColor: "#ffffff" } as BrochurePage | CoverPage)}
            className="w-6 h-6 rounded border-2 border-gray-300 bg-white hover:border-gray-500 transition"
          />
          <button
            title="Black text"
            onClick={() => onUpdate({ ...page, textColor: "#000000" } as BrochurePage | CoverPage)}
            className="w-6 h-6 rounded border-2 border-gray-300 bg-black hover:border-gray-500 transition"
          />
          <input
            type="color"
            value={page.textColor ?? "#1a1a1a"}
            onChange={(e) => onUpdate({ ...page, textColor: e.target.value } as BrochurePage | CoverPage)}
            className="w-7 h-7 rounded cursor-pointer border border-gray-300"
            title="Custom text color"
          />
          <label className="text-xs text-gray-500 ml-1">BG</label>
          <input
            type="color"
            value={page.backgroundColor}
            onChange={(e) => onUpdate({ ...page, backgroundColor: e.target.value } as BrochurePage | CoverPage)}
            className="w-7 h-7 rounded cursor-pointer border border-gray-300"
            title="Background color"
          />
        </div>
        <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
        <input ref={overlayInputRef} type="file" accept="image/*" className="hidden" onChange={handleOverlayUpload} />
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

        {/* Text content rendered ON TOP of the background — drag to reposition */}
        {page.content && (
          <div
            className="absolute overflow-auto"
            style={{
              zIndex: 5,
              left: page.textX ?? 24,
              top: page.textY ?? 24,
              maxWidth: "calc(100% - 48px)",
              cursor: "move",
              color: page.textColor ?? "#1a1a1a",
              padding: "8px 12px",
              borderRadius: 4,
            }}
            onMouseDown={handleTextDragMouseDown}
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}

        {/* Empty state hint */}
        {page.overlayImages.length === 0 && !page.backgroundImage && !page.content && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none select-none">
            Upload a background, add images, or write content below
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

// ─── Stable content editor — isolated so typing never re-mounts the editor ───
// Holds its own local draft so parent re-renders never interrupt typing.
// Commits to parent only on blur.

interface ContentEditorProps {
  initialValue: string;
  onCommit: (val: string) => void;
  pageKey: string; // changes when page switches, forcing a fresh mount
}

function ContentEditor({ initialValue, onCommit, pageKey }: ContentEditorProps) {
  const [draft, setDraft] = React.useState(initialValue);

  // When switching pages (pageKey changes) sync initialValue into draft
  React.useEffect(() => {
    setDraft(initialValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  return (
    <div key={pageKey} className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
        ✏️ Edit Content — text renders on background above
      </div>
      <OptimizedJoditEditor
        value={draft}
        onChange={setDraft}
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

  useEffect(() => {
    fetchCourses();
    fetchBrochures();
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

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await axios.post(`${API_BASE}/brochures/upload-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const raw: string = res.data.imageUrl;
    const uploadsPath = raw.replace(/^https?:\/\/[^/]+/, "");
    return `${getApiOrigin()}${uploadsPath}`;
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
        coverPage,
        pages,
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

      {/* ── Course selector + editor in one block ── */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
          <select
            className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleCourseSelect(e.target.value)}
            value={selectedCourse?._id ?? ""}
          >
            <option value="">-- Select a course to build brochure --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>

          {selectedCourse && (
            <>
              <button
                onClick={addBlankPage}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                + Blank Page
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition ml-auto"
              >
                {saving ? "Saving..." : "Save Brochure"}
              </button>
            </>
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
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={pages[activePage].pageTitle}
                        onChange={(e) => updatePage(activePage, { ...pages[activePage], pageTitle: e.target.value })}
                        placeholder="Page title..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
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
                    <td className="py-3 flex gap-2">
                      <button
                        onClick={() => handleLoadBrochure(b)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition"
                      >
                        Edit
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
    </div>
  );
}
