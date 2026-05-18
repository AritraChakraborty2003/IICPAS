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
import { buildTopicLessonRows } from "@/lib/topicLessons";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getSessionStatusLabel = (status = "") =>
  String(status || "")
    .charAt(0)
    .toUpperCase() + String(status || "").slice(1);

export default function RecordedClassListTab({ student }) {
  const [sessions, setSessions] = useState([]);
  const [hasCourses, setHasCourses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        // 1. Fetch student's purchased courses
        const response = await axios.get(
          `${API}/api/courses/student-courses/${student._id}`,
          { withCredentials: true }
        );
        const enrolledCourses = response.data.courses || [];
        setHasCourses(enrolledCourses.length > 0);

        // 2. Process and extract all recorded lessons grouped by Course -> Chapter
        const processedCourses = [];

        enrolledCourses.forEach((course) => {
          const courseChapters = [];
          const chaptersList = Array.isArray(course.chapters) ? course.chapters : [];

          chaptersList.forEach((chapter) => {
            const topicsList = Array.isArray(chapter.topics) ? chapter.topics : [];
            // Retrieve all active recorded lessons using buildTopicLessonRows
            const recordedLessons = buildTopicLessonRows(topicsList, "recorded", {
              includeLegacyIntro: true,
            });

            if (recordedLessons.length > 0) {
              const sessionsList = recordedLessons.map((lesson) => ({
                _id: lesson.id,
                title: lesson.title,
                status: lesson.status,
                date: lesson.publishAt || chapter.createdAt || course.createdAt || new Date(),
                time: "",
                link: lesson.sourceUrl,
                sourceType: lesson.sourceType,
              }));

              courseChapters.push({
                id: chapter._id,
                title: chapter.title,
                sessions: sessionsList,
              });
            }
          });

          if (courseChapters.length > 0) {
            processedCourses.push({
              id: course._id,
              title: course.title,
              chapters: courseChapters,
            });
          }
        });

        setSessions(processedCourses);
      } catch (err) {
        console.error("Failed to load recorded classes:", err);
        setError("Failed to load recorded classes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [student?._id]);

  const groupedSessions = sessions;

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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Recorded Class</h1>
          <p className="text-sm text-gray-500 mt-1">
            Loading recorded classes for your enrolled courses...
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
            Access course-wise recorded lessons and materials for your enrolled courses.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-medium bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100">
            {totalSessions} Recorded Lesson{totalSessions !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {!hasCourses ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No enrolled courses yet.</p>
          <p className="text-gray-400 text-sm mt-2">
            Recorded classes will appear here once you purchase or enroll in a course.
          </p>
        </div>
      ) : groupedSessions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            No recorded classes found.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Once recorded lessons are added to your enrolled courses, they will show up here.
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
                                  </div>

                                  <div className="mt-2 text-sm text-gray-600">
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
