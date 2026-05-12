"use client";

import { getApiOrigin } from "@/lib/apiBase";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Edit3,
  ExternalLink,
  PlayCircle,
  RefreshCw,
  X,
} from "lucide-react";

const API = getApiOrigin();

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatTimeRange = (timeRange = "") => {
  const [start = "", end = ""] = String(timeRange).split(" - ");

  const formatTime = (timeStr) => {
    if (!timeStr) return "";

    const [hour, minute] = timeStr.split(":").map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return timeStr;

    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);

  if (!formattedStart && !formattedEnd) return "Time not available";
  if (!formattedEnd) return formattedStart;
  return `${formattedStart} - ${formattedEnd}`;
};

const buildSessionLink = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const resolveObjectId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return "";
};

const getRelationLabel = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return (
      value.title ||
      value.name ||
      value.code ||
      value.slug ||
      value.label ||
      value._id ||
      ""
    );
  }
  return "";
};

const getRelationLabels = (value, fallback = "Unassigned") => {
  const list = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const labels = list.map(getRelationLabel).filter(Boolean);
  return labels.length ? labels : [fallback];
};

const getLabelsFromIds = (ids, options, fallback = "Unassigned") => {
  const normalizedIds = Array.isArray(ids) ? ids : ids ? [ids] : [];
  const labels = normalizedIds
    .map((id) => options.find((option) => String(option?._id) === String(id)))
    .map((option) => getRelationLabel(option))
    .filter(Boolean);

  return labels.length ? labels : [fallback];
};

const normalizeSelectionIds = (value) => {
  if (Array.isArray(value)) {
    return value.map(resolveObjectId).filter(Boolean);
  }
  const resolved = resolveObjectId(value);
  return resolved ? [resolved] : [];
};

export default function RecordedSessionAdmin() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [editingSession, setEditingSession] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    courseIds: [],
    chapterIds: [],
    batchId: "",
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Admin session not found. Please log in again.");
        return;
      }

      const res = await fetch(`${API}/api/live-sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to fetch recorded sessions");
      }

      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Recorded session fetch failed:", err);
      setError(err?.message || "Failed to fetch recorded sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const res = await fetch(`${API}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data?.courses)
        ? data.courses
        : Array.isArray(data)
          ? data
          : [];
      setCourses(list);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const res = await fetch(`${API}/api/batch-manager`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data?.batches) ? data.batches : [];
      setBatches(list);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchChaptersForCourses = async (courseIds = []) => {
    const normalizedCourseIds = Array.from(
      new Set(normalizeSelectionIds(courseIds))
    );

    if (!normalizedCourseIds.length) {
      setChapters([]);
      return [];
    }

    try {
      setLoadingChapters(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return [];

      const responses = await Promise.all(
        normalizedCourseIds.map(async (courseId) => {
          const res = await fetch(`${API}/api/chapters/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            return [];
          }

          const data = await res.json();
          return Array.isArray(data?.chapters) ? data.chapters : [];
        })
      );

      const mergedChapters = [];
      const seenIds = new Set();

      responses.flat().forEach((chapter) => {
        const chapterId = resolveObjectId(chapter);
        if (!chapterId || seenIds.has(chapterId)) return;
        seenIds.add(chapterId);
        mergedChapters.push(chapter);
      });

      mergedChapters.sort((left, right) => {
        const leftOrder = Number(left?.order ?? 0);
        const rightOrder = Number(right?.order ?? 0);
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return String(left?.title || "").localeCompare(String(right?.title || ""));
      });

      setChapters(mergedChapters);
      return mergedChapters;
    } catch (err) {
      console.error("Failed to fetch chapters:", err);
      setChapters([]);
      return [];
    } finally {
      setLoadingChapters(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchCourses();
    fetchBatches();
  }, []);

  const completedSessions = useMemo(() => {
    return sessions
      .filter((session) => String(session?.status || "").toLowerCase() === "completed")
      .sort((left, right) => {
        const leftTime = new Date(left?.date || 0).getTime();
        const rightTime = new Date(right?.date || 0).getTime();
        return rightTime - leftTime;
      });
  }, [sessions]);

  const openEditModal = async (session) => {
    setError("");
    const nextCourseIds = normalizeSelectionIds(
      Array.isArray(session?.courseIds) && session.courseIds.length
        ? session.courseIds
        : session?.courseId
    );
    const nextChapterIds = normalizeSelectionIds(
      Array.isArray(session?.chapterIds) && session.chapterIds.length
        ? session.chapterIds
        : session?.chapterId
    );
    const nextBatchId = resolveObjectId(session?.batchId);

    setEditingSession(session);
    setForm({
      courseIds: nextCourseIds,
      chapterIds: nextChapterIds,
      batchId: nextBatchId,
    });
    setEditOpen(true);
    const loadedChapters = await fetchChaptersForCourses(nextCourseIds);
    const loadedChapterIds = new Set(
      loadedChapters.map((chapter) => resolveObjectId(chapter))
    );
    setForm((current) => ({
      ...current,
      chapterIds: current.chapterIds.filter((chapterId) =>
        loadedChapterIds.has(String(chapterId))
      ),
    }));
  };

  const closeEditModal = () => {
    setError("");
    setEditOpen(false);
    setEditingSession(null);
    setForm({
      courseIds: [],
      chapterIds: [],
      batchId: "",
    });
    setChapters([]);
  };

  const handleCourseChange = async (courseIds) => {
    const nextCourseIds = Array.from(new Set(courseIds.filter(Boolean)));
    const loadedChapters = await fetchChaptersForCourses(nextCourseIds);
    const loadedChapterIds = new Set(
      loadedChapters.map((chapter) => resolveObjectId(chapter))
    );

    setForm((current) => ({
      ...current,
      courseIds: nextCourseIds,
      chapterIds: current.chapterIds.filter((chapterId) =>
        loadedChapterIds.has(String(chapterId))
      ),
    }));
  };

  const toggleCourse = async (courseId) => {
    const nextCourseIds = form.courseIds.includes(courseId)
      ? form.courseIds.filter((id) => id !== courseId)
      : [...form.courseIds, courseId];

    await handleCourseChange(nextCourseIds);
  };

  const handleChapterChange = (chapterIds) => {
    setForm((current) => ({
      ...current,
      chapterIds: Array.from(new Set(chapterIds.filter(Boolean))),
    }));
  };

  const toggleChapter = (chapterId) => {
    const nextChapterIds = form.chapterIds.includes(chapterId)
      ? form.chapterIds.filter((id) => id !== chapterId)
      : [...form.chapterIds, chapterId];

    handleChapterChange(nextChapterIds);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!editingSession?._id) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("Admin session not found. Please log in again.");
      }

      const payload = {
        courseIds: form.courseIds || [],
        chapterIds: form.chapterIds || [],
        courseId: form.courseIds?.[0] || "",
        chapterId: form.chapterIds?.[0] || "",
        batchId: form.batchId || "",
      };

      const res = await fetch(`${API}/api/live-sessions/${editingSession._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update recorded session");
      }

      await fetchSessions();
      closeEditModal();
    } catch (err) {
      setError(err?.message || "Failed to update recorded session");
    } finally {
      setSaving(false);
    }
  };

  const sessionBatchLabel = (session) =>
    session?.batchCode || session?.batchId?.code || "Not assigned";

  const sessionCourseLabels = (session) =>
    getRelationLabels(
      Array.isArray(session?.courseIds) && session.courseIds.length
        ? session.courseIds
        : session?.courseId,
      "Unassigned"
    );

  const sessionChapterLabels = (session) =>
    getRelationLabels(
      Array.isArray(session?.chapterIds) && session.chapterIds.length
        ? session.chapterIds
        : session?.chapterId,
      "Unassigned"
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            <PlayCircle className="h-3.5 w-3.5" />
            Recorded Sessions
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Completed Live Sessions</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Sessions move here automatically once their live date and time are over. Use Edit to change the associated course, chapter, or batch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Total Completed
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-900">
              {completedSessions.length}
            </div>
          </div>
          <button
            onClick={fetchSessions}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          Loading recorded sessions...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          {error}
        </div>
      ) : completedSessions.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-semibold text-slate-900">No completed sessions yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Completed live sessions will appear here automatically once their scheduled time is over.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Courses</th>
                  <th className="px-6 py-4">Chapters</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Completed Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.map((session, index) => {
                  const sessionLink = buildSessionLink(session?.link);

                  return (
                    <tr
                      key={session._id}
                      className={`border-t border-slate-200 text-sm text-slate-700 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      }`}
                    >
                      <td className="px-6 py-5 align-top">
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top font-semibold text-slate-900">
                        {session?.title || "Untitled session"}
                      </td>
                      <td className="px-6 py-5 align-top">
                        {session?.instructor || "Not specified"}
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-wrap gap-2">
                          {sessionCourseLabels(session).map((label) => (
                            <span
                              key={`${session._id}-course-${label}`}
                              className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-wrap gap-2">
                          {sessionChapterLabels(session).map((label) => (
                            <span
                              key={`${session._id}-chapter-${label}`}
                              className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                          {sessionBatchLabel(session)}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-emerald-700" />
                          <span>{formatDate(session?.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-emerald-700" />
                          <span>{formatTimeRange(session?.time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(session)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>
                          {sessionLink ? (
                            <a
                              href={sessionLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Open Link
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400">
                              Missing
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editOpen && editingSession ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Edit Recorded Session
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {editingSession?.title || "Untitled session"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the course, chapter, and batch association for this completed session.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 px-6 py-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Courses
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="max-h-56 overflow-y-auto p-3">
                      {loadingCourses ? (
                        <div className="px-2 py-3 text-sm text-slate-500">
                          Loading courses...
                        </div>
                      ) : courses.length ? (
                        <div className="space-y-2">
                          {courses.map((course) => {
                            const courseId = resolveObjectId(course);
                            const checked = form.courseIds.includes(courseId);

                            return (
                              <label
                                key={courseId}
                                className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCourse(courseId)}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">
                                  {course.title || course.name || course.slug || course._id}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-2 py-3 text-sm text-slate-500">
                          No courses available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Chapters
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="max-h-56 overflow-y-auto p-3">
                      {!form.courseIds.length ? (
                        <div className="px-2 py-3 text-sm text-slate-500">
                          Choose one or more courses first
                        </div>
                      ) : loadingChapters ? (
                        <div className="px-2 py-3 text-sm text-slate-500">
                          Loading chapters...
                        </div>
                      ) : chapters.length ? (
                        <div className="space-y-2">
                          {chapters.map((chapter) => {
                            const chapterId = resolveObjectId(chapter);
                            const checked = form.chapterIds.includes(chapterId);

                            return (
                              <label
                                key={chapterId}
                                className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleChapter(chapterId)}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">
                                  {chapter.title || chapter.name || chapter._id}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-2 py-3 text-sm text-slate-500">
                          No chapters found for the selected courses
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Batch
                  </label>
                  <select
                    value={form.batchId}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        batchId: e.target.value,
                      }))
                    }
                    disabled={loadingBatches}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 focus:border-emerald-400"
                  >
                    <option value="">
                      {loadingBatches ? "Loading batches..." : "Not assigned"}
                    </option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.code || batch.batchCode || batch._id} -{" "}
                        {String(batch.mode || "").toUpperCase()} -{" "}
                        {Number(batch.assignedCount || 0)}/{Number(batch.size || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
