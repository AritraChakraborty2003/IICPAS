"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  PlayCircle,
  Clock,
  Calendar,
  BookOpen,
  ExternalLink,
  Layers,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const resolveObjectId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return "";
};

const getBatchLabel = (student = {}) =>
  student.batchCode || student.batchId?.code || "";

const getSessionBatchId = (session = {}) =>
  resolveObjectId(session.batchId);

const getSessionBatchCode = (session = {}) =>
  String(session.batchCode || session.batchId?.code || "").trim();

const getCourseTitle = (session = {}) =>
  session.courseId?.title ||
  session.courseTitle ||
  session.courseIds?.[0]?.title ||
  "General";

const getChapterTitle = (session = {}) =>
  session.chapterId?.title ||
  session.chapterTitle ||
  session.chapterIds?.[0]?.title ||
  "No chapter";

const getSessionStatusLabel = (status = "") =>
  String(status || "")
    .charAt(0)
    .toUpperCase() + String(status || "").slice(1);

export default function RecordedClassListTab({ student }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentBatchId = resolveObjectId(student?.batchId);
  const studentBatchCode = getBatchLabel(student);
  const batchLabel = studentBatchCode || studentBatchId;

  useEffect(() => {
    const loadData = async () => {
      if (!student?._id) {
        setSessions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API}/api/live-sessions`);
        const data = Array.isArray(response.data) ? response.data : [];

        const completedForBatch = data
          .filter((session) => String(session?.status || "").toLowerCase() === "completed")
          .filter((session) => {
            if (!studentBatchId && !studentBatchCode) return false;

            const sessionBatchId = getSessionBatchId(session);
            const sessionBatchCode = getSessionBatchCode(session);

            return (
              (studentBatchId && sessionBatchId === studentBatchId) ||
              (studentBatchCode && sessionBatchCode === studentBatchCode)
            );
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setSessions(completedForBatch);
      } catch (err) {
        console.error("Failed to load recorded classes:", err);
        setError("Failed to load recorded classes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [student?._id, studentBatchId, studentBatchCode]);

  const groupedSessions = useMemo(() => {
    const courseMap = new Map();

    sessions.forEach((session) => {
      const courseKey = String(
        session.courseId?._id ||
          session.courseId ||
          session.courseIds?.[0]?._id ||
          session.courseIds?.[0] ||
          session.category ||
          "general"
      );
      const courseTitle = getCourseTitle(session);
      const chapterKey = String(
        session.chapterId?._id ||
          session.chapterId ||
          session.chapterIds?.[0]?._id ||
          session.chapterIds?.[0] ||
          session.chapterTitle ||
          "no-chapter"
      );
      const chapterTitle = getChapterTitle(session);

      if (!courseMap.has(courseKey)) {
        courseMap.set(courseKey, {
          id: courseKey,
          title: courseTitle,
          chapters: new Map(),
        });
      }

      const courseEntry = courseMap.get(courseKey);

      if (!courseEntry.chapters.has(chapterKey)) {
        courseEntry.chapters.set(chapterKey, {
          id: chapterKey,
          title: chapterTitle,
          sessions: [],
        });
      }

      courseEntry.chapters.get(chapterKey).sessions.push({
        ...session,
        courseTitle,
        chapterTitle,
      });
    });

    return Array.from(courseMap.values()).map((course) => ({
      ...course,
      chapters: Array.from(course.chapters.values()).map((chapter) => ({
        ...chapter,
        sessions: chapter.sessions.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        ),
      })),
    }));
  }, [sessions]);

  const totalSessions = useMemo(
    () =>
      groupedSessions.reduce(
        (sum, course) =>
          sum +
          course.chapters.reduce(
            (chapterSum, chapter) => chapterSum + chapter.sessions.length,
            0
          ),
        0
      ),
    [groupedSessions]
  );

  const hasBatch = Boolean(batchLabel);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Recorded Class</h1>
          <p className="text-sm text-gray-500 mt-1">
            Loading recorded classes for your batch...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading recorded classes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Recorded Class</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
      <div className="flex justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Recorded Class</h1>
          <p className="text-sm text-gray-500 mt-1">
            Completed live sessions for your assigned batch are listed below.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-medium bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100">
            {totalSessions} Recorded Lesson{totalSessions !== 1 ? "s" : ""}
          </div>
          {hasBatch ? (
            <div className="text-xs font-semibold uppercase tracking-[0.18em] bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
              Batch {batchLabel}
            </div>
          ) : null}
        </div>
      </div>

      {!hasBatch ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No batch assigned yet.</p>
          <p className="text-gray-400 text-sm mt-2">
            Recorded classes will appear here once your batch is mapped.
          </p>
        </div>
      ) : groupedSessions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            No recorded classes found for this batch.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Once a completed live session is added for batch {batchLabel}, it will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedSessions.map((course) => {
            const courseSessionCount = course.chapters.reduce(
              (sum, chapter) => sum + chapter.sessions.length,
              0
            );

            return (
              <section
                key={course.id}
                className="rounded-3xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {course.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {courseSessionCount} recorded class
                        {courseSessionCount === 1 ? "" : "es"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="space-y-8">
                    {course.chapters.map((chapter) => (
                      <div key={chapter.id}>
                        <div className="mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                            {chapter.title}
                          </h3>
                        </div>

                        <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200">
                          {chapter.sessions.map((session) => (
                            <li
                              key={session._id}
                              className="flex flex-col gap-4 bg-white px-4 py-4 transition-colors hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                            >
                              <div className="flex items-start gap-4">
                                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                                  <PlayCircle className="h-6 w-6" />
                                </div>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-base font-semibold text-gray-900">
                                      {session.title}
                                    </h4>
                                    <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-green-700">
                                      {getSessionStatusLabel(session.status)}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-4 h-4" />
                                      <span>{formatDate(session.date)}</span>
                                    </div>
                                    {session.time ? (
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        <span>{session.time}</span>
                                      </div>
                                    ) : null}
                                    <span className="flex items-center gap-1.5">
                                      <Layers className="w-4 h-4" />
                                      <span>
                                        Batch {session.batchCode || session.batchId?.code || batchLabel}
                                      </span>
                                    </span>
                                  </div>

                                  <div className="mt-2 text-sm text-gray-600">
                                    <span className="font-medium text-gray-700">
                                      Instructor:
                                    </span>{" "}
                                    {session.instructor || "Not assigned"}
                                    <span className="mx-2 text-gray-300">•</span>
                                    <span className="font-medium text-gray-700">
                                      Chapter:
                                    </span>{" "}
                                    {chapter.title}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 md:pl-6 md:text-right">
                                <div className="hidden md:block">
                                  <div className="text-xs uppercase tracking-[0.18em] text-gray-400">
                                    Recorded link
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    {session.link ? "Available" : "Not available"}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    if (!session.link) return;
                                    window.open(
                                      session.link,
                                      "_blank",
                                      "noopener,noreferrer"
                                    );
                                  }}
                                  disabled={!session.link}
                                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                                    session.link
                                      ? "bg-gray-900 text-white shadow-lg shadow-gray-200 hover:bg-blue-600"
                                      : "cursor-not-allowed bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Watch Class
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
