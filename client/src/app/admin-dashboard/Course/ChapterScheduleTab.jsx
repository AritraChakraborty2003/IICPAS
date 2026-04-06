"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = getApiBase();

const toDateTimeLocalValue = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const formatDateTime = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const extractCourses = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractChapters = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.chapters)) return payload.chapters;
  if (Array.isArray(payload?.data?.chapters)) return payload.data.chapters;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function ChapterScheduleTab({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [publishAt, setPublishAt] = useState(toDateTimeLocalValue());

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter._id === selectedChapterId) || null,
    [chapters, selectedChapterId]
  );

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await axios.get(`${API_BASE}/courses`);
      setCourses(extractCourses(response.data));
    } catch (error) {
      console.error("Failed to load courses:", error);
      Swal.fire("Error", "Failed to load courses", "error");
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchChapters = async (courseId) => {
    if (!courseId) {
      setChapters([]);
      return;
    }
    setLoadingChapters(true);
    try {
      const response = await axios.get(`${API_BASE}/chapters/course/${courseId}`);
      setChapters(extractChapters(response.data));
    } catch (error) {
      console.error("Failed to load chapters:", error);
      setChapters([]);
      Swal.fire("Error", "Failed to load chapters", "error");
    } finally {
      setLoadingChapters(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setChapters([]);
      setSelectedChapterId("");
      return;
    }
    fetchChapters(selectedCourseId);
    setSelectedChapterId("");
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedChapterId) return;
    const chapter = chapters.find((item) => item._id === selectedChapterId);
    setPublishAt(
      toDateTimeLocalValue(chapter?.publishAt || chapter?.updatedAt || chapter?.createdAt)
    );
  }, [chapters, selectedChapterId]);

  const handleSave = async () => {
    if (!selectedCourseId) {
      Swal.fire("Validation", "Please select a course.", "warning");
      return;
    }
    if (!selectedChapterId) {
      Swal.fire("Validation", "Please select a chapter.", "warning");
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_BASE}/chapters/${selectedChapterId}`, {
        publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
      });
      Swal.fire("Saved", "Chapter date and time updated.", "success");
      await fetchChapters(selectedCourseId);
    } catch (error) {
      console.error("Failed to save chapter schedule:", error);
      Swal.fire("Error", "Failed to save chapter schedule", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chapter Schedule</h1>
          <p className="text-slate-500 mt-1">
            Select a course, choose a chapter, set date and time, and save it to the database.
          </p>
        </div>
        <button
          onClick={onBack}
          className="self-start md:self-auto px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title || course.name || course.slug || course._id}
                </option>
              ))}
            </select>
            {loadingCourses && (
              <p className="mt-2 text-sm text-slate-500">Loading courses...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Chapter
            </label>
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              disabled={!selectedCourseId || loadingChapters}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">
                {selectedCourseId ? "Select chapter" : "Choose a course first"}
              </option>
              {chapters.map((chapter) => (
                <option key={chapter._id} value={chapter._id}>
                  {chapter.title}
                </option>
              ))}
            </select>
            {loadingChapters && (
              <p className="mt-2 text-sm text-slate-500">Loading chapters...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !selectedCourseId || !selectedChapterId}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "Saving..." : "Save Schedule"}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Current Schedule
          </h2>
          {!selectedCourse ? (
            <p className="text-slate-500">Select a course to view its chapters.</p>
          ) : chapters.length === 0 ? (
            <p className="text-slate-500">No chapters available for this course.</p>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <div
                  key={chapter._id}
                  className={`rounded-xl border p-4 ${
                    selectedChapterId === chapter._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{chapter.title}</p>
                      <p className="text-sm text-slate-500">
                        Scheduled: {formatDateTime(chapter.publishAt || chapter.updatedAt || chapter.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedChapterId(chapter._id);
                        setPublishAt(
                          toDateTimeLocalValue(
                            chapter.publishAt || chapter.updatedAt || chapter.createdAt
                          )
                        );
                      }}
                      className="self-start rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Edit Time
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
