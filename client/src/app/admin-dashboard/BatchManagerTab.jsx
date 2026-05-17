"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Layers3,
  Save,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiBase } from "@/lib/apiBase";
import { NestedScheduleManager } from "./NestedScheduleManager";
import { CalendarSidePanel } from "./BatchManagerTabCalendar";

const API_BASE = getApiBase();

const MODE_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const emptyForm = {
  mode: "online",
  size: 100,
  courseLocks: [],
};

const createEmptyCourseLock = (courseId = "") => ({
  courseId,
  start_time: "",
  end_time: "",
});

const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const normalizeCourseLocksForForm = (courseLocks = []) => {
  const normalized = new Map();

  (Array.isArray(courseLocks) ? courseLocks : []).forEach((lock) => {
    const courseId = String(lock?.courseId || lock?._id || lock?.course || "").trim();
    if (!courseId) return;

    normalized.set(courseId, {
      courseId,
      start_time: toDatetimeLocalValue(lock?.start_time || lock?.startTime || lock?.start),
      end_time: toDatetimeLocalValue(lock?.end_time || lock?.endTime || lock?.end),
      chapters: Array.isArray(lock?.chapters)
        ? lock.chapters.map((ch) => ({
            chapterId: String(ch?.chapterId || ""),
            start_time: toDatetimeLocalValue(ch?.start_time),
            end_time: toDatetimeLocalValue(ch?.end_time),
            topics: Array.isArray(ch?.topics)
              ? ch.topics.map((t) => ({
                  topicId: String(t?.topicId || ""),
                  start_time: toDatetimeLocalValue(t?.start_time),
                  end_time: toDatetimeLocalValue(t?.end_time),
                }))
              : [],
          }))
        : [],
    });
  });

  return Array.from(normalized.values());
};

const getCourseTitle = (course) =>
  course?.title || course?.name || course?.slug || "Untitled Course";

const getCourseId = (course) =>
  String(course?._id || course?.courseId || course?.id || "").trim();

export default function BatchManagerTab() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [courseHierarchy, setCourseHierarchy] = useState({});

  const fetchCourseHierarchy = async (courseId) => {
    if (courseHierarchy[courseId]) return;
    try {
      const response = await axios.get(`${API_BASE}/chapters/course/${courseId}`);
      if (response.data.success) {
        setCourseHierarchy((prev) => ({ ...prev, [courseId]: response.data.chapters }));
      }
    } catch (error) {
      console.error("Failed to fetch course hierarchy", error);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScheduleSave = (id, type, startTime, endTime, parentIds) => {
    setForm((prev) => {
      const newLocks = [...prev.courseLocks];
      
      if (type === 'course') {
        const courseIndex = newLocks.findIndex(l => String(l.courseId) === String(id));
        if (courseIndex >= 0) {
          newLocks[courseIndex] = { ...newLocks[courseIndex], start_time: startTime, end_time: endTime };
        }
      } else if (type === 'chapter') {
        const courseIndex = newLocks.findIndex(l => String(l.courseId) === String(parentIds.courseId));
        if (courseIndex >= 0) {
          const courseLock = { ...newLocks[courseIndex] };
          courseLock.chapters = [...(courseLock.chapters || [])];
          const chapterIndex = courseLock.chapters.findIndex(c => String(c.chapterId) === String(id));
          if (chapterIndex >= 0) {
            courseLock.chapters[chapterIndex] = { ...courseLock.chapters[chapterIndex], start_time: startTime, end_time: endTime };
          } else {
            courseLock.chapters.push({ chapterId: id, start_time: startTime, end_time: endTime, topics: [] });
          }
          newLocks[courseIndex] = courseLock;
        }
      } else if (type === 'topic') {
        const courseIndex = newLocks.findIndex(l => String(l.courseId) === String(parentIds.courseId));
        if (courseIndex >= 0) {
          const courseLock = { ...newLocks[courseIndex] };
          courseLock.chapters = [...(courseLock.chapters || [])];
          let chapterIndex = courseLock.chapters.findIndex(c => String(c.chapterId) === String(parentIds.chapterId));
          if (chapterIndex < 0) {
            courseLock.chapters.push({ chapterId: parentIds.chapterId, topics: [] });
            chapterIndex = courseLock.chapters.length - 1;
          }
          const chapterLock = { ...courseLock.chapters[chapterIndex] };
          chapterLock.topics = [...(chapterLock.topics || [])];
          const topicIndex = chapterLock.topics.findIndex(t => String(t.topicId) === String(id));
          if (topicIndex >= 0) {
            chapterLock.topics[topicIndex] = { ...chapterLock.topics[topicIndex], start_time: startTime, end_time: endTime };
          } else {
            chapterLock.topics.push({ topicId: id, start_time: startTime, end_time: endTime });
          }
          courseLock.chapters[chapterIndex] = chapterLock;
          newLocks[courseIndex] = courseLock;
        }
      }
      return { ...prev, courseLocks: newLocks };
    });
  };

  const fetchBatches = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await axios.get(`${API_BASE}/batch-manager`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(Array.isArray(response.data?.batches) ? response.data.batches : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE}/courses/all`);
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load courses");
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchCourses();
  }, []);

  const openCreateModal = () => {
    setEditingBatch(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setForm({
      mode: batch.mode || "online",
      size: Number(batch.size) || 100,
      courseLocks: normalizeCourseLocksForForm(batch.courseLocks),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBatch(null);
    setForm(emptyForm);
    setSelectedScheduleItem(null);
    setExpandedItems({});
  };

  const toggleCourseSelection = (courseId) => {
    fetchCourseHierarchy(courseId);
    setForm((prev) => {
      const exists = prev.courseLocks.some(
        (lock) => String(lock.courseId) === String(courseId)
      );

      if (exists) {
        return {
          ...prev,
          courseLocks: prev.courseLocks.filter(
            (lock) => String(lock.courseId) !== String(courseId)
          ),
        };
      }

      return {
        ...prev,
        courseLocks: [...prev.courseLocks, createEmptyCourseLock(courseId)],
      };
    });
  };

  const updateCourseLock = (courseId, field, value) => {
    setForm((prev) => ({
      ...prev,
      courseLocks: prev.courseLocks.map((lock) =>
        String(lock.courseId) === String(courseId)
          ? { ...lock, [field]: value }
          : lock
      ),
    }));
  };

  const removeCourseLock = (courseId) => {
    setForm((prev) => ({
      ...prev,
      courseLocks: prev.courseLocks.filter(
        (lock) => String(lock.courseId) !== String(courseId)
      ),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("adminToken");
    setSaving(true);

    try {
      const size = Number(form.size);
      if (!Number.isFinite(size) || size < 1) {
        throw new Error("Size must be a positive number");
      }

      const normalizedLocks = form.courseLocks.map((lock) => {
        const courseId = String(lock.courseId || "").trim();
        const startTime = String(lock.start_time || "").trim();
        const endTime = String(lock.end_time || "").trim();

        if (!courseId) {
          throw new Error("Every selected course must have a course id");
        }

        if (!startTime || !endTime) {
          throw new Error(`Start and end time are required for ${courseId}`);
        }

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          throw new Error(`Invalid time range for course ${courseId}`);
        }

        if (endDate.getTime() < startDate.getTime()) {
          throw new Error(`End time must be after start time for course ${courseId}`);
        }

        return {
          courseId,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          chapters: Array.isArray(lock.chapters) ? lock.chapters.map((ch) => {
             const chStart = ch.start_time ? new Date(ch.start_time) : null;
             const chEnd = ch.end_time ? new Date(ch.end_time) : null;
             return {
                chapterId: String(ch.chapterId || "").trim(),
                start_time: chStart && !Number.isNaN(chStart.getTime()) ? chStart.toISOString() : null,
                end_time: chEnd && !Number.isNaN(chEnd.getTime()) ? chEnd.toISOString() : null,
                topics: Array.isArray(ch.topics) ? ch.topics.map(t => {
                   const tStart = t.start_time ? new Date(t.start_time) : null;
                   const tEnd = t.end_time ? new Date(t.end_time) : null;
                   return {
                      topicId: String(t.topicId || "").trim(),
                      start_time: tStart && !Number.isNaN(tStart.getTime()) ? tStart.toISOString() : null,
                      end_time: tEnd && !Number.isNaN(tEnd.getTime()) ? tEnd.toISOString() : null,
                   };
                }) : []
             };
          }) : []
        };
      });

      const payload = {
        mode: form.mode,
        size,
        courseLocks: normalizedLocks,
      };

      if (editingBatch?._id) {
        await axios.put(`${API_BASE}/batch-manager/${editingBatch._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Batch updated successfully");
      } else {
        await axios.post(`${API_BASE}/batch-manager`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Batch created successfully");
      }

      closeModal();
      fetchBatches();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batch) => {
    const confirmDelete = window.confirm(
      `Delete ${batch.code || "this"} batch (${String(batch.mode || "").toUpperCase()}) with ${Number(
        batch.assignedCount || 0
      )}/${Number(batch.size || 0)} students?`
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("adminToken");
    try {
      await axios.delete(`${API_BASE}/batch-manager/${batch._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Batch deleted successfully");
      fetchBatches();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete batch");
    }
  };

  const selectedCourseIds = new Set(
    form.courseLocks.map((lock) => String(lock.courseId || "").trim()).filter(Boolean)
  );
  const sortedCourses = [...courses].sort((left, right) =>
    getCourseTitle(left).localeCompare(getCourseTitle(right))
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading batch manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            <Layers3 className="h-4 w-4" />
            Batch Manager
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Manage batches and course lock windows
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Create or edit batches, then assign one or more courses with start and
            end timestamps. Once a course&apos;s end time passes, students in that
            batch will be locked out automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Batch
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Saved Batches</h2>
        </div>

        {batches.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            No batches found. Add your first batch to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Mode
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Occupancy
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Course Locks
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map((batch) => (
                  <tr key={batch._id} className="bg-white">
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {batch.code || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          batch.mode === "online"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {String(batch.mode || "").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                          <span>
                            {Number(batch.assignedCount || 0)} / {Number(batch.size || 0)}
                          </span>
                          <span>{Number(batch.occupancyPercent || 0)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Number(batch.occupancyPercent || 0)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {batch.size}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                        {Number(batch.courseLocks?.length || 0)} course
                        {Number(batch.courseLocks?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {batch.updatedAt
                        ? new Date(batch.updatedAt).toLocaleString("en-IN")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(batch)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                          title="Edit batch"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(batch)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete batch"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-3 py-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative flex h-[92vh] w-[96vw] max-w-[1600px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-gray-100 px-6 py-5 pr-16">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingBatch ? "Edit Batch" : "Add Batch"}
                </h3>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {form.courseLocks.length} selected
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Choose the batch mode and size, then attach course lock windows
                with checkboxes and inline time fields.
              </p>
            </div>

            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
              <div className={`grid min-h-0 flex-1 gap-6 overflow-y-auto px-6 py-6 ${selectedScheduleItem ? "xl:grid-cols-[0.8fr_1fr_auto]" : "xl:grid-cols-[0.95fr_1.35fr]"}`}>
                <div className="space-y-6">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Batch Code
                        </label>
                        <input
                          type="text"
                          value={editingBatch?.code || "Generated automatically"}
                          readOnly
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Mode
                        </label>
                        <select
                          value={form.mode}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, mode: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        >
                          {MODE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Size
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={form.size}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              size: event.target.value === "" ? "" : Number(event.target.value),
                            }))
                          }
                          placeholder="Enter batch size"
                          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Enter any positive number. This controls how many students can
                          be assigned to the batch.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Select Courses
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Use the checkboxes to attach one or more courses to this batch.
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {selectedCourseIds.size} chosen
                      </span>
                    </div>

                    <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                      {coursesLoading ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                          Loading courses...
                        </div>
                      ) : sortedCourses.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                          No courses available to assign.
                        </div>
                      ) : (
                        sortedCourses.map((course) => {
                          const courseId = getCourseId(course);
                          const checked = selectedCourseIds.has(courseId);

                          return (
                            <label
                              key={courseId}
                              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                                checked
                                  ? "border-emerald-200 bg-emerald-50"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCourseSelection(courseId)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {getCourseTitle(course)}
                                  </span>
                                  {course.slug ? (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                      {course.slug}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  {course.category || course.level || course._id || "Course"}
                                </p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Course Lock Schedule
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Set the start and end window for each selected course, chapter, and topic.
                        The lock activates after the end time passes.
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {form.courseLocks.length} schedule
                      {form.courseLocks.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <NestedScheduleManager
                    courseLocks={form.courseLocks}
                    sortedCourses={sortedCourses}
                    courseHierarchy={courseHierarchy}
                    onSelectScheduleItem={setSelectedScheduleItem}
                    removeCourseLock={removeCourseLock}
                    toggleExpanded={toggleExpanded}
                    expandedItems={expandedItems}
                  />

                  <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-semibold">Important</p>
                    <p className="mt-1 leading-6">
                      Click the calendar icon to set a time block for a specific item.
                      If a nested item has no schedule, it falls back to the parent schedule.
                    </p>
                  </div>
                </div>

                {selectedScheduleItem && (
                  <CalendarSidePanel
                    selectedItem={selectedScheduleItem}
                    onClose={() => setSelectedScheduleItem(null)}
                    onSave={handleScheduleSave}
                  />
                )}
              </div>

              <div className="border-t border-gray-100 bg-white px-6 py-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {saving ? (
                      <>
                        <RotateCcw className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Batch
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
