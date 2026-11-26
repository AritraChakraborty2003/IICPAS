"use client";
// Topic workspace: the whole course structure in a left sidebar and the topic
// editor on the right. Admins switch topics, add / delete / reorder topics and
// chapters without leaving the editor. Unsaved changes are confirmed first.
import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { getApiBase } from "@/lib/apiBase";
import { useAuth } from "@/contexts/AuthContext";
import AddOrEditTopicForm from "./AddOrEditTopicForm";

const API_BASE = getApiBase();

const StatusDot = ({ status }) =>
  status === "draft" ? (
    <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Draft</span>
  ) : (
    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Published" />
  );

export default function TopicWorkspace({ courseId, courseName, chapter: initialChapter, topic: initialTopic, onExit }) {
  const { hasPermission } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [current, setCurrent] = useState({ chapter: initialChapter, topic: initialTopic || null, key: initialTopic?._id || `new-${Date.now()}` });
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dirtyRef = useRef(false);
  const setDirty = useCallback((d) => {
    dirtyRef.current = d;
  }, []);

  const canAdd = hasPermission?.("course", "add") ?? true;
  const canDelete = hasPermission?.("course", "delete") ?? true;
  const canUpdate = hasPermission?.("course", "update") ?? true;

  const loadTree = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/chapters/course/${courseId}`);
      setChapters(res.data?.chapters || []);
    } catch {
      setChapters([]);
    } finally {
      setLoadingTree(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Warn before closing the tab with unsaved work
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const confirmLeave = async () => {
    if (!dirtyRef.current) return true;
    const r = await Swal.fire({
      title: "Unsaved changes",
      text: "This topic has changes that are not saved. Leave without saving?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Leave without saving",
      cancelButtonText: "Stay here",
    });
    return r.isConfirmed;
  };

  const openTopic = async (chapter, topicId) => {
    if (current.topic?._id === topicId) return;
    if (!(await confirmLeave())) return;
    setLoadingTopic(true);
    try {
      const res = await axios.get(`${API_BASE}/topics/${topicId}`);
      dirtyRef.current = false;
      setCurrent({ chapter, topic: res.data, key: `${topicId}-${Date.now()}` });
    } catch {
      Swal.fire("Error", "Could not load this topic.", "error");
    } finally {
      setLoadingTopic(false);
    }
  };

  const newTopic = async (chapter) => {
    if (!(await confirmLeave())) return;
    dirtyRef.current = false;
    setCurrent({ chapter, topic: null, key: `new-${Date.now()}` });
  };

  const addChapter = async () => {
    const { value: title } = await Swal.fire({
      title: "New chapter",
      input: "text",
      inputPlaceholder: "Chapter title",
      showCancelButton: true,
      confirmButtonText: "Add chapter",
      inputValidator: (v) => (!v?.trim() ? "Enter a chapter title" : undefined),
    });
    if (!title) return;
    try {
      await axios.post(`${API_BASE}/chapters/by-course/${courseId}`, {
        title: title.trim(),
        order: chapters.length + 1,
        status: "Active",
        publishAt: new Date().toISOString(),
      });
      await loadTree();
    } catch {
      Swal.fire("Error", "Failed to add chapter.", "error");
    }
  };

  const deleteTopic = async (chapter, t) => {
    const r = await Swal.fire({
      title: `Delete “${t.title}”?`,
      text: "The topic and its content will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
    });
    if (!r.isConfirmed) return;
    try {
      await axios.delete(`${API_BASE}/topics/${t._id}`);
      if (current.topic?._id === t._id) {
        dirtyRef.current = false;
        setCurrent({ chapter, topic: null, key: `new-${Date.now()}` });
      }
      await loadTree();
    } catch {
      Swal.fire("Error", "Failed to delete topic.", "error");
    }
  };

  const moveTopic = async (chapter, index, delta) => {
    const ids = chapter.topics.map((t) => t._id);
    const j = index + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setChapters((cs) => cs.map((c) => (c._id === chapter._id ? { ...c, topics: ids.map((id) => c.topics.find((t) => t._id === id)) } : c)));
    try {
      await axios.put(`${API_BASE}/chapters/${chapter._id}/topics/reorder`, { topicIds: ids });
    } catch {
      Swal.fire("Error", "Failed to save the new order.", "error");
      loadTree();
    }
  };

  const moveChapter = async (index, delta) => {
    const j = index + delta;
    if (j < 0 || j >= chapters.length) return;
    const next = [...chapters];
    [next[index], next[j]] = [next[j], next[index]];
    setChapters(next);
    try {
      await axios.put(`${API_BASE}/chapters/reorder/${courseId}`, { orderedIds: next.map((c) => c._id) });
    } catch {
      Swal.fire("Error", "Failed to save the chapter order.", "error");
      loadTree();
    }
  };

  // After save: refresh the tree and keep editing the same (or newly created) topic
  const handleSaved = async (info = {}) => {
    dirtyRef.current = false;
    await loadTree();
    const id = info.topicId || current.topic?._id;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/topics/${id}`);
      setCurrent((c) => ({ ...c, topic: res.data, key: `${id}-${Date.now()}` }));
    } catch {
      /* keep the current view */
    }
  };

  const exit = async () => {
    if (await confirmLeave()) onExit?.();
  };

  const iconBtn = "rounded p-0.5 text-[11px] text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30";

  return (
    <div className="flex min-h-[calc(100vh-120px)] gap-3">
      {/* Sidebar: course content navigation */}
      {sidebarOpen ? (
        <aside className="sticky top-2 flex max-h-[calc(100vh-40px)] w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-3">
            <button type="button" onClick={exit} className="mb-2 text-xs font-semibold text-blue-700 hover:underline">
              ← Back to topics
            </button>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Course content</p>
                <p className="truncate font-bold text-slate-900" title={courseName}>{courseName}</p>
              </div>
              <button type="button" onClick={() => setSidebarOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" title="Hide sidebar">
                ⇤
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 text-sm">
            {loadingTree && <p className="p-3 text-slate-500">Loading…</p>}
            {!loadingTree && !chapters.length && <p className="p-3 text-slate-500">No chapters yet.</p>}
            {chapters.map((ch, ci) => {
              const open = !collapsed[ch._id];
              return (
                <div key={ch._id} className="mb-1">
                  <div className="group flex items-center gap-1 rounded-lg px-1.5 py-1.5 hover:bg-slate-50">
                    <button type="button" onClick={() => setCollapsed((c) => ({ ...c, [ch._id]: open }))} className="w-4 text-slate-400">
                      {open ? "▾" : "▸"}
                    </button>
                    <span className="min-w-0 flex-1 truncate font-semibold text-slate-800" title={ch.title}>
                      {ci + 1}. {ch.title}
                    </span>
                    {canUpdate && (
                      <span className="hidden gap-0.5 group-hover:flex">
                        <button type="button" className={iconBtn} disabled={ci === 0} onClick={() => moveChapter(ci, -1)} title="Move chapter up">▲</button>
                        <button type="button" className={iconBtn} disabled={ci === chapters.length - 1} onClick={() => moveChapter(ci, 1)} title="Move chapter down">▼</button>
                      </span>
                    )}
                    {canAdd && (
                      <button type="button" className="rounded px-1 text-base font-bold text-blue-600 hover:bg-blue-50" onClick={() => newTopic(ch)} title="Add topic to this chapter">
                        +
                      </button>
                    )}
                  </div>
                  {open && (
                    <ul className="ml-5 border-l border-slate-200 pl-1">
                      {(ch.topics || []).map((t, ti) => {
                        const active = current.topic?._id === t._id;
                        return (
                          <li key={t._id} className={`group flex items-center gap-1 rounded-md px-2 py-1.5 ${active ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}>
                            <button type="button" onClick={() => openTopic(ch, t._id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                              {!active && <StatusDot status={t.publishStatus} />}
                              <span className="truncate" title={t.title}>
                                {ti + 1}. {t.title}
                              </span>
                            </button>
                            <span className={`hidden shrink-0 gap-0.5 group-hover:flex ${active ? "text-white" : ""}`}>
                              {canUpdate && (
                                <>
                                  <button type="button" className={iconBtn} disabled={ti === 0} onClick={() => moveTopic(ch, ti, -1)} title="Move up">▲</button>
                                  <button type="button" className={iconBtn} disabled={ti === ch.topics.length - 1} onClick={() => moveTopic(ch, ti, 1)} title="Move down">▼</button>
                                </>
                              )}
                              {canDelete && (
                                <button type="button" className={`${iconBtn} hover:!text-red-600`} onClick={() => deleteTopic(ch, t)} title="Delete topic">✕</button>
                              )}
                            </span>
                          </li>
                        );
                      })}
                      {!current.topic && current.chapter?._id === ch._id && (
                        <li className="rounded-md bg-blue-600 px-2 py-1.5 text-white">＋ New topic</li>
                      )}
                      {canAdd && (
                        <li>
                          <button type="button" onClick={() => newTopic(ch)} className="w-full rounded-md px-2 py-1 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50">
                            + Add topic
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          {canAdd && (
            <div className="border-t border-slate-200 p-2">
              <button type="button" onClick={addChapter} className="w-full rounded-lg border border-dashed border-blue-300 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                + Add chapter
              </button>
            </div>
          )}
        </aside>
      ) : (
        <button type="button" onClick={() => setSidebarOpen(true)} className="sticky top-2 h-fit rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-blue-700 shadow-sm" title="Show course content">
          ☰
        </button>
      )}

      {/* Editor */}
      <div className="relative min-w-0 flex-1">
        {loadingTopic && (
          <div className="absolute inset-0 z-40 flex items-start justify-center bg-white/60 pt-32 text-sm font-semibold text-slate-600">Loading topic…</div>
        )}
        {current.chapter && (
          <AddOrEditTopicForm
            key={current.key}
            chapterId={current.chapter._id}
            chapterName={current.chapter.title}
            courseId={courseId}
            courseName={courseName}
            topic={current.topic}
            onDirtyChange={setDirty}
            onCancel={exit}
            onSaved={handleSaved}
          />
        )}
      </div>
    </div>
  );
}
