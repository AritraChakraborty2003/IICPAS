"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = getApiBase();

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

interface Brochure {
  _id: string;
  courseId: string;
  courseName: string;
  chapters: BrochureChapter[];
  updatedAt: string;
}

export default function BrochureTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<Record<string, boolean>>({});
  const [selectedTopics, setSelectedTopics] = useState<Record<string, boolean>>({});
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
    } catch {
      // ignore
    }
  };

  const fetchBrochures = async () => {
    try {
      const res = await axios.get(`${API_BASE}/brochures`);
      setBrochures(res.data?.data ?? []);
    } catch {
      // ignore
    }
  };

  const handleCourseSelect = async (courseId: string) => {
    if (!courseId) {
      setSelectedCourse(null);
      setSelectedChapters({});
      setSelectedTopics({});
      return;
    }
    setLoadingCourse(true);
    try {
      const res = await axios.get(`${API_BASE}/courses/${courseId}`);
      const course: Course = res.data?.data ?? res.data;
      setSelectedCourse(course);

      // Pre-fill from existing brochure if any
      const existing = brochures.find((b) => b.courseId === courseId);
      if (existing) {
        const chMap: Record<string, boolean> = {};
        const topicMap: Record<string, boolean> = {};
        existing.chapters.forEach((ch) => {
          chMap[ch.chapterId] = true;
          ch.topics.forEach((t) => { topicMap[t.topicId] = true; });
        });
        setSelectedChapters(chMap);
        setSelectedTopics(topicMap);
      } else {
        setSelectedChapters({});
        setSelectedTopics({});
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load course details." });
    } finally {
      setLoadingCourse(false);
    }
  };

  const toggleChapter = (chapterId: string, topics: Topic[]) => {
    const next = !selectedChapters[chapterId];
    setSelectedChapters((prev) => ({ ...prev, [chapterId]: next }));
    if (!next) {
      // uncheck all topics of this chapter
      const topicMap: Record<string, boolean> = { ...selectedTopics };
      topics.forEach((t) => { topicMap[t._id] = false; });
      setSelectedTopics(topicMap);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleSave = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    setMessage(null);
    try {
      const chapters: BrochureChapter[] = (selectedCourse.chapters ?? [])
        .filter((ch) => selectedChapters[ch._id])
        .map((ch) => ({
          chapterId: ch._id,
          chapterName: ch.title,
          topics: (ch.topics ?? [])
            .filter((t) => selectedTopics[t._id])
            .map((t) => ({ topicId: t._id, topicName: t.title })),
        }));

      await axios.post(`${API_BASE}/brochures`, {
        courseId: selectedCourse._id,
        courseName: selectedCourse.title,
        chapters,
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

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Manage Brochures</h2>

      {message && (
        <div
          className={`px-4 py-3 rounded text-sm font-medium ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Builder */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Build / Edit Brochure</h3>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Select Course</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleCourseSelect(e.target.value)}
            defaultValue=""
          >
            <option value="">-- Choose a course --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {loadingCourse && (
          <p className="text-sm text-gray-500 animate-pulse">Loading course details...</p>
        )}

        {selectedCourse && !loadingCourse && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">
              Select chapters and topics to include:
            </p>

            {(selectedCourse.chapters ?? []).length === 0 && (
              <p className="text-sm text-gray-400">No chapters found for this course.</p>
            )}

            {(selectedCourse.chapters ?? []).map((chapter) => (
              <div key={chapter._id} className="border border-gray-200 rounded-lg overflow-hidden">
                <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={!!selectedChapters[chapter._id]}
                    onChange={() => toggleChapter(chapter._id, chapter.topics ?? [])}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="font-medium text-gray-800 text-sm">{chapter.title}</span>
                </label>

                {selectedChapters[chapter._id] && (
                  <div className="px-8 py-2 space-y-1 bg-white">
                    {(chapter.topics ?? []).length === 0 && (
                      <p className="text-xs text-gray-400 py-1">No topics in this chapter.</p>
                    )}
                    {(chapter.topics ?? []).map((topic) => (
                      <label
                        key={topic._id}
                        className="flex items-center gap-3 py-1 cursor-pointer hover:text-blue-600"
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedTopics[topic._id]}
                          onChange={() => toggleTopic(topic._id)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{topic.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? "Saving..." : "Save Brochure"}
            </button>
          </div>
        )}
      </div>

      {/* Saved Brochures */}
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
                  <th className="pb-2 pr-4">Last Updated</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brochures.map((b) => (
                  <tr key={b._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-800">{b.courseName}</td>
                    <td className="py-3 pr-4 text-gray-600">{b.chapters.length} chapter(s)</td>
                    <td className="py-3 pr-4 text-gray-500">
                      {new Date(b.updatedAt).toLocaleDateString()}
                    </td>
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
