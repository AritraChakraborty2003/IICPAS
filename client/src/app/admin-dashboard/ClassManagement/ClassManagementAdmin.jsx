"use client";

import { getApiOrigin } from "@/lib/apiBase";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  PlayCircle,
  Plus,
  RefreshCw,
  Trash2,
  Video,
  X,
} from "lucide-react";

const API = getApiOrigin();

const calculateEndTime = (timeStr, durationMin) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m + (Number(durationMin) || 0), 0, 0);
  return date.toTimeString().slice(0, 5);
};

const calculateDuration = (startTimeStr, endTimeStr) => {
  if (!startTimeStr || !endTimeStr) return 0;
  const [sh, sm] = startTimeStr.split(":").map(Number);
  const [eh, em] = endTimeStr.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
};


// Auto-closes after 10s so it acts as a quick clip preview rather than a full player.
function ClipPreviewModal({ url, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(onClose, 10000);
    videoRef.current?.play?.().catch(() => {});
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-black shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          title="Close"
        >
          <X size={18} />
        </button>
        <video
          ref={videoRef}
          src={url}
          controls
          autoPlay
          className="max-h-[70vh] w-full"
        />
        <a
          href={url}
          download
          className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-white"
        >
          Download
        </a>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  description: "",
  instructor: "",
  courses: [],
  chapters: [],
  topics: [],
  batch: "",
  date: "",
  time: "",
  durationMinutes: 60,
  endTime: "",
  meetingLink: "",
  passcode: "",
  recordingUrl: "",
  price: 0,
  maxParticipants: 100,
};

const idOf = (v) => String(v?._id || v || "");

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
};

const TypeBadge = ({ type }) => {
  const isLive = type === "live";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        isLive ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"
      }`}
    >
      {isLive ? (
        <PlayCircle className="h-3.5 w-3.5" />
      ) : (
        <Video className="h-3.5 w-3.5" />
      )}
      {isLive ? "Live" : "Recorded"}
    </span>
  );
};

// Reusable multi-select checkbox group
const CheckboxGroup = ({ label, options, selected, onToggle, disabled, emptyText }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div
      className={`max-h-36 space-y-1 overflow-y-auto rounded-lg border border-gray-300 p-2 ${
        disabled ? "bg-gray-100" : "bg-white"
      }`}
    >
      {options.length === 0 ? (
        <p className="px-1 py-2 text-xs text-gray-400">{emptyText}</p>
      ) : (
        options.map((opt) => {
          const id = idOf(opt);
          const checked = selected.includes(id);
          return (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">{opt.title}</span>
            </label>
          );
        })
      )}
    </div>
  </div>
);

export default function ClassManagementAdmin() {
  const { user, hasPermission, isPrivilegedAdmin } = useAuth();
  const isAdmin = isPrivilegedAdmin
    ? isPrivilegedAdmin(user)
    : user?.role === "Admin" || user?.role === "superadmin";

  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [chapters, setChapters] = useState([]); // combined pool for selected courses
  const [topics, setTopics] = useState([]); // combined pool for selected chapters

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const handleCopyPasscode = () => {
    if (!form.passcode) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(form.passcode);
      setCopiedPasscode(true);
      setTimeout(() => setCopiedPasscode(false), 2000);
    }
  };

  const handlePreviewClip = async () => {
    if (!form.meetingLink || previewLoading) return;
    setPreviewError("");
    setPreviewLoading(true);

    const pollStatus = async () => {
      try {
        const res = await fetch(
          `${API}/api/zoom-clips/dynamic-status?link=${encodeURIComponent(form.meetingLink)}`
        );
        const data = await res.json();
        if (data.status === "ready") {
          setPreviewLoading(false);
          setPreviewUrl(data.url);
        } else if (data.status === "error") {
          setPreviewLoading(false);
          setPreviewError(data.error || "Failed to load clip");
        } else {
          setTimeout(pollStatus, 1000);
        }
      } catch (err) {
        setPreviewLoading(false);
        setPreviewError("Error checking clip status");
      }
    };

    try {
      const res = await fetch(`${API}/api/zoom-clips/dynamic-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: form.meetingLink }),
      });
      if (!res.ok && res.status !== 202) throw new Error("Failed to start clip download");
      pollStatus();
    } catch (err) {
      setPreviewLoading(false);
      setPreviewError(err?.message || "Error starting clip download");
    }
  };

  const authHeaders = useCallback(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/api/classes`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/courses`, { headers: authHeaders() });
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
    }
  }, [authHeaders]);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/batch-manager`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setBatches(Array.isArray(data?.batches) ? data.batches : []);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    }
  }, [authHeaders]);

  // Fetch & merge chapters for a set of course ids
  const fetchChaptersFor = useCallback(
    async (courseIds) => {
      if (!courseIds.length) {
        setChapters([]);
        return [];
      }
      try {
        const results = await Promise.all(
          courseIds.map(async (cid) => {
            const res = await fetch(`${API}/api/chapters/course/${cid}`, {
              headers: authHeaders(),
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data?.chapters) ? data.chapters : [];
          })
        );
        const merged = [];
        const seen = new Set();
        results.flat().forEach((ch) => {
          const id = idOf(ch);
          if (id && !seen.has(id)) {
            seen.add(id);
            merged.push(ch);
          }
        });
        setChapters(merged);
        return merged;
      } catch {
        setChapters([]);
        return [];
      }
    },
    [authHeaders]
  );

  // Fetch & merge topics for a set of chapter ids
  const fetchTopicsFor = useCallback(
    async (chapterIds) => {
      if (!chapterIds.length) {
        setTopics([]);
        return [];
      }
      try {
        const results = await Promise.all(
          chapterIds.map(async (chid) => {
            const res = await fetch(`${API}/api/topics/by-chapter/${chid}`, {
              headers: authHeaders(),
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
          })
        );
        const merged = [];
        const seen = new Set();
        results.flat().forEach((t) => {
          const id = idOf(t);
          if (id && !seen.has(id)) {
            seen.add(id);
            merged.push(t);
          }
        });
        setTopics(merged);
        return merged;
      } catch {
        setTopics([]);
        return [];
      }
    },
    [authHeaders]
  );

  useEffect(() => {
    fetchClasses();
    fetchCourses();
    fetchBatches();
  }, [fetchClasses, fetchCourses, fetchBatches]);

  const filteredClasses = useMemo(() => {
    if (filterType === "all") return classes;
    return classes.filter((c) => c.type === filterType);
  }, [classes, filterType]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setChapters([]);
    setTopics([]);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = async (cls) => {
    const courseIds = (cls.courses || []).map(idOf);
    const chapterIds = (cls.chapters || []).map(idOf);
    const topicIds = (cls.topics || []).map(idOf);

    setForm({
      title: cls.title || "",
      description: cls.description || "",
      instructor: cls.instructor || "",
      courses: courseIds,
      chapters: chapterIds,
      topics: topicIds,
      batch: idOf(cls.batch),
      date: cls.date ? new Date(cls.date).toISOString().slice(0, 10) : "",
      time: cls.time || "",
      endTime: cls.endTime || calculateEndTime(cls.time || "00:00", cls.durationMinutes || 60),
      durationMinutes: cls.durationMinutes || 60,
      meetingLink: cls.meetingLink || "",
      passcode: cls.passcode || "",
      recordingUrl: cls.recordingUrl || "",
      price: cls.price || 0,
      maxParticipants: cls.maxParticipants || 100,
    });
    setEditingId(cls._id);
    setShowModal(true);
    const chs = await fetchChaptersFor(courseIds);
    await fetchTopicsFor(chapterIds.length ? chapterIds : chs.map(idOf));
  };

  // Toggle a course; re-derive chapter pool and prune now-invalid selections
  const toggleCourse = async (cid) => {
    const next = form.courses.includes(cid)
      ? form.courses.filter((x) => x !== cid)
      : [...form.courses, cid];
    setForm((f) => ({ ...f, courses: next }));
    const chs = await fetchChaptersFor(next);
    const validChapterIds = new Set(chs.map(idOf));
    setForm((f) => {
      const keptChapters = f.chapters.filter((c) => validChapterIds.has(c));
      return { ...f, chapters: keptChapters };
    });
  };

  const toggleChapter = async (chid) => {
    const next = form.chapters.includes(chid)
      ? form.chapters.filter((x) => x !== chid)
      : [...form.chapters, chid];
    setForm((f) => ({ ...f, chapters: next }));
    const tps = await fetchTopicsFor(next);
    const validTopicIds = new Set(tps.map(idOf));
    setForm((f) => ({
      ...f,
      topics: f.topics.filter((t) => validTopicIds.has(t)),
    }));
  };

  const toggleTopic = (tid) => {
    setForm((f) => ({
      ...f,
      topics: f.topics.includes(tid)
        ? f.topics.filter((x) => x !== tid)
        : [...f.topics, tid],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || form.courses.length === 0 || !form.date || !form.time) {
      setError("Title, at least one course, date and time are required");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        batch: form.batch || null,
        durationMinutes: Number(form.durationMinutes) || 60,
        price: 0,
        maxParticipants: Number(form.maxParticipants) || 100,
      };

      const url = editingId
        ? `${API}/api/classes/${editingId}`
        : `${API}/api/classes`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save class");
      }
      setShowModal(false);
      resetForm();
      fetchClasses();
    } catch (err) {
      setError(err?.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this class? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/classes/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete class");
      fetchClasses();
    } catch (err) {
      setError(err?.message || "Failed to delete class");
    }
  };

  const handleConvert = async (id) => {
    if (!window.confirm("Convert this live class to a recorded class now?"))
      return;
    try {
      const res = await fetch(`${API}/api/classes/${id}/convert`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to convert class");
      fetchClasses();
    } catch (err) {
      setError(err?.message || "Failed to convert class");
    }
  };

  const joinTitles = (arr) =>
    (arr || [])
      .map((x) => x?.title)
      .filter(Boolean)
      .join(", ");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Class Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule live classes that auto-convert to recorded after they end.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchClasses}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {hasPermission("class-management", "add") && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Create Class
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {[
          { id: "all", label: "All" },
          { id: "live", label: "Live" },
          { id: "recorded", label: "Recorded" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filterType === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Courses / Chapters / Topics
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Schedule
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : filteredClasses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No classes found. Create one to get started.
                </td>
              </tr>
            ) : (
              filteredClasses.map((cls) => (
                <tr key={cls._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{cls.title}</div>
                    {cls.instructor && (
                      <div className="text-xs text-gray-500">
                        {cls.instructor}
                      </div>
                    )}
                    {cls.batch?.code && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {cls.batch.code}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>{joinTitles(cls.courses) || "—"}</div>
                    {(cls.chapters?.length || cls.topics?.length) ? (
                      <div className="text-xs text-gray-400">
                        {[joinTitles(cls.chapters), joinTitles(cls.topics)]
                          .filter(Boolean)
                          .join(" › ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {formatDate(cls.date)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock3 className="h-3 w-3" />
                      {cls.time} · {cls.durationMinutes}m
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={cls.type} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {cls.type === "live" && hasPermission("class-management", "update") && (
                        <button
                          onClick={() => handleConvert(cls._id)}
                          title="Convert to recorded now"
                          className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Video className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission("class-management", "update") && (
                        <button
                          onClick={() => openEdit(cls)}
                          title="Edit"
                          className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission("class-management", "delete") && (
                        <button
                          onClick={() => handleDelete(cls._id)}
                          title="Delete"
                          className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-900">
                {editingId ? "Edit Class" : "Create Class"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <CheckboxGroup
                  label="Courses *"
                  options={courses}
                  selected={form.courses}
                  onToggle={toggleCourse}
                  emptyText="No courses available"
                />
                <CheckboxGroup
                  label="Chapters"
                  options={chapters}
                  selected={form.chapters}
                  onToggle={toggleChapter}
                  disabled={form.courses.length === 0}
                  emptyText={
                    form.courses.length === 0
                      ? "Select a course first"
                      : "No chapters"
                  }
                />
                <CheckboxGroup
                  label="Topics"
                  options={topics}
                  selected={form.topics}
                  onToggle={toggleTopic}
                  disabled={form.chapters.length === 0}
                  emptyText={
                    form.chapters.length === 0
                      ? "Select a chapter first"
                      : "No topics"
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      setForm((f) => ({
                        ...f,
                        time: newTime,
                        endTime: calculateEndTime(newTime, f.durationMinutes)
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={form.endTime || ""}
                    onChange={(e) => {
                      const newEndTime = e.target.value;
                      const newDuration = calculateDuration(form.time, newEndTime);
                      setForm((f) => ({
                        ...f,
                        endTime: newEndTime,
                        durationMinutes: newDuration,
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Duration (min) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.durationMinutes}
                    onChange={(e) => {
                      const newDuration = e.target.value;
                      setForm((f) => ({
                        ...f,
                        durationMinutes: newDuration,
                        endTime: calculateEndTime(f.time, newDuration)
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Instructor
                  </label>
                  <input
                    type="text"
                    value={form.instructor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, instructor: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Batch
                  </label>
                  <select
                    value={form.batch}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, batch: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">No batch</option>
                    {batches.map((b) => (
                      <option key={idOf(b)} value={idOf(b)}>
                        {b.code || "Untitled batch"}
                        {b.mode ? ` · ${b.mode}` : ""}
                        {b.size ? ` (${b.assignedCount || 0}/${b.size})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>Live Meeting Link</span>
                    {form.meetingLink && (
                      <button
                        type="button"
                        onClick={handlePreviewClip}
                        disabled={previewLoading}
                        className="inline-flex items-center gap-1 text-xs font-normal text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Preview a 10s clip from this meeting"
                      >
                        {previewLoading ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <PlayCircle size={14} />
                        )}
                        {previewLoading ? "Loading…" : "Preview clip"}
                      </button>
                    )}
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet…"
                    value={form.meetingLink}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, meetingLink: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {previewError && (
                    <p className="mt-1 text-xs text-red-600">{previewError}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={isAdmin && showPasscode ? "text" : "password"}
                      placeholder="e.g. 123456"
                      value={form.passcode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, passcode: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setShowPasscode((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title={showPasscode ? "Hide passcode" : "View passcode"}
                        tabIndex={-1}
                      >
                        {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCopyPasscode}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title={copiedPasscode ? "Passcode copied!" : "Copy passcode"}
                        tabIndex={-1}
                      >
                        {copiedPasscode ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Recording URL (after class)
                  </label>
                  <input
                    type="url"
                    placeholder="https://…/recording"
                    value={form.recordingUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, recordingUrl: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={0}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxParticipants}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxParticipants: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Update Class"
                      : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewUrl && (
        <ClipPreviewModal url={previewUrl} onClose={() => setPreviewUrl("")} />
      )}
    </div>
  );
}
