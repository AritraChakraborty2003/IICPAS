"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getCourseTitle = (session) =>
  session?.courseId?.title || session?.courseTitle || session?.category || "General";

const getChapterTitle = (session) =>
  session?.chapterId?.title || session?.chapterTitle || "No chapter";

const getCourseKey = (session) =>
  String(session?.courseId?._id || session?.courseId || session?.category || "general");

const getChapterKey = (session) =>
  String(session?.chapterId?._id || session?.chapterId || session?.chapterTitle || "no-chapter");

const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeRange = (timeRange) => {
  if (!timeRange || typeof timeRange !== "string") return "";
  const [start, end] = timeRange.split(" - ");
  if (!start || !end) return "";
  return `${start} - ${end}`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case "live":
      return "bg-red-100 text-red-600";
    case "upcoming":
      return "bg-yellow-100 text-yellow-600";
    case "completed":
      return "bg-green-100 text-green-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function LiveClassListTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError("");

        // Identify logged-in student
        const studentResponse = await axios
          .get(`${API}/api/v1/students/isstudent`, { withCredentials: true })
          .catch(() => ({ data: null }));

        const student = studentResponse?.data?.student || null;

        if (!student?._id) {
          // Not logged in — show nothing
          setSessions([]);
          return;
        }

        // Fetch live classes nested in student's purchased courses
        const response = await axios.get(
          `${API}/api/live-sessions/course-lessons/${student._id}`,
          { withCredentials: true }
        );

        const data = Array.isArray(response.data) ? response.data : [];
        setSessions(
          data
            .filter(
              (session) =>
                session.status === "active" ||
                session.status === "upcoming" ||
                session.status === "live" ||
                session.status === "completed"
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        );
      } catch (err) {
        console.error("Failed to load live classes:", err);
        setError("Failed to load live classes");
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);


  const groupedCourses = useMemo(() => {
    const courseMap = new Map();

    sessions.forEach((session) => {
      const courseKey = getCourseKey(session);
      const courseTitle = getCourseTitle(session);
      const chapterKey = getChapterKey(session);
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

      courseEntry.chapters.get(chapterKey).sessions.push(session);
    });

    return Array.from(courseMap.values()).map((course) => ({
      ...course,
      chapters: Array.from(course.chapters.values()).map((chapter) => ({
        ...chapter,
        sessions: chapter.sessions.sort((a, b) => new Date(a.date) - new Date(b.date)),
      })),
    }));
  }, [sessions]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Live Class</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading live classes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Live Class</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Live Class</h1>
        <div className="text-sm text-gray-500">
          {sessions.length} class{sessions.length !== 1 ? "es" : ""} saved
        </div>
      </div>

      {groupedCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No live classes available right now.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedCourses.map((course) => (
            <section key={course.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{course.title}</h2>
                <span className="text-sm text-gray-500">
                  {course.chapters.reduce((sum, chapter) => sum + chapter.sessions.length, 0)} classes
                </span>
              </div>

              <div className="space-y-6">
                {course.chapters.map((chapter) => (
                  <div key={chapter.id}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        {chapter.title}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {chapter.sessions.length} session{chapter.sessions.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {chapter.sessions.map((session) => (
                        <div
                          key={session._id}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-lg font-bold text-blue-800">
                                {session.title}
                              </h4>
                              <p className="text-sm text-gray-700 mt-1">
                                {formatDate(session.date)}
                                {formatTimeRange(session.time)
                                  ? ` at ${formatTimeRange(session.time)}`
                                  : ""}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(
                                session.status
                              )}`}
                            >
                              {String(session.status || "")
                                .charAt(0)
                                .toUpperCase() + String(session.status || "").slice(1)}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium text-gray-700">Course:</span>{" "}
                              {getCourseTitle(session)}
                            </p>
                            <p>
                              <span className="font-medium text-gray-700">Chapter:</span>{" "}
                              {getChapterTitle(session)}
                            </p>
                            {session.price ? (
                              <p className="text-green-600 font-medium">
                                Price: ₹{session.price}
                              </p>
                            ) : null}
                          </div>

                          {session.link ? (
                            <a
                              href={session.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              Open Class
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
