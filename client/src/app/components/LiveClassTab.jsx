"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const getCourseId = (session) =>
  String(
    session?.courseId?._id ||
      session?.courseId ||
      session?.category ||
      "uncategorized"
  );

const getCourseTitle = (session) =>
  session?.courseId?.title ||
  session?.courseTitle ||
  session?.category ||
  "General";

const getChapterId = (session) =>
  String(
    session?.chapterId?._id ||
      session?.chapterId ||
      session?.chapterTitle ||
      "uncategorized"
  );

const getChapterTitle = (session) =>
  session?.chapterId?.title || session?.chapterTitle || "No chapter";

const formatClockPart = (timeString) => {
  if (!timeString || typeof timeString !== "string") return "";
  const [hours, minutes] = timeString.split(":");
  if (!hours || !minutes) return "";
  const date = new Date(`2000-01-01T${timeString}`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatSessionTimeRange = (timeRange) => {
  if (!timeRange || typeof timeRange !== "string") return "";
  const [start, end] = timeRange.split(" - ");
  const startLabel = formatClockPart(start);
  const endLabel = formatClockPart(end);
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  return startLabel || endLabel || "";
};

const getSessionStatus = (session) => {
  const now = new Date();
  const sessionDate = new Date(session.date);
  if (Number.isNaN(sessionDate.getTime())) return "upcoming";

  if (!session.time || typeof session.time !== "string") {
    return now < sessionDate ? "upcoming" : "completed";
  }

  const [startTime, endTime] = session.time.split(" - ");
  const sessionStart = new Date(sessionDate);
  const sessionEnd = new Date(sessionDate);
  const [startHour, startMinute] = String(startTime || "")
    .split(":")
    .map(Number);
  const [endHour, endMinute] = String(endTime || "")
    .split(":")
    .map(Number);

  if (!Number.isFinite(startHour) || !Number.isFinite(startMinute)) {
    return now < sessionDate ? "upcoming" : "completed";
  }

  sessionStart.setHours(startHour, startMinute, 0, 0);

  if (!Number.isFinite(endHour) || !Number.isFinite(endMinute)) {
    return now < sessionStart ? "upcoming" : "completed";
  }

  sessionEnd.setHours(endHour, endMinute, 0, 0);

  const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(sessionEnd.getTime() + 60 * 60 * 1000);

  if (now >= oneHourBefore && now <= oneHourAfter) {
    return "live";
  }

  if (now < sessionStart) {
    return "upcoming";
  }

  return "completed";
};

const sortByDateThenTitle = (a, b) => {
  const dateA = new Date(a?.date || 0).getTime();
  const dateB = new Date(b?.date || 0).getTime();
  if (dateA !== dateB) return dateA - dateB;
  return String(a?.title || "").localeCompare(String(b?.title || ""));
};

export default function LiveClassTab({
  selectedLiveSessionId = "",
  onClearSelectedLiveSession = () => {},
}) {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [enrolledSessionIds, setEnrolledSessionIds] = useState([]);
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const enrolledSessionSet = useMemo(
    () => new Set(enrolledSessionIds.map((id) => String(id))),
    [enrolledSessionIds]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const studentResponse = await axios
          .get(`${API}/api/v1/students/isstudent`, {
            withCredentials: true,
          })
          .catch(() => ({ data: null }));

        const currentStudent = studentResponse?.data?.student || null;
        setStudent(currentStudent);

        const bookingsResponse = currentStudent?._id
          ? await axios
              .get(
                `${API}/api/bookings?category=live&hasLiveSession=true&studentId=${currentStudent._id}`,
                { withCredentials: true }
              )
              .catch(() => ({ data: [] }))
          : { data: [] };

        const bookings = Array.isArray(bookingsResponse.data)
          ? bookingsResponse.data
          : Array.isArray(bookingsResponse.data?.bookings)
          ? bookingsResponse.data.bookings
          : [];

        const bookingSessionIds = bookings
          .map((booking) => booking?.liveSessionId?._id || booking?.liveSessionId)
          .filter(Boolean)
          .map(String);

        const enrolledIds = Array.isArray(currentStudent?.enrolledLiveSessions)
          ? currentStudent.enrolledLiveSessions.map(String)
          : [];

        setEnrolledSessionIds([...new Set([...bookingSessionIds, ...enrolledIds])]);

        // Fetch live classes filtered to this student's purchased courses only
        const response = currentStudent?._id
          ? await axios
              .get(`${API}/api/live-sessions/for-student/${currentStudent._id}`, {
                withCredentials: true,
              })
              .catch(() => ({ data: [] }))
          : { data: [] };

        const sessions = Array.isArray(response.data) ? response.data : [];
        setLiveClasses(
          sessions
            .filter(
              (session) =>
                session.status === "active" ||
                session.status === "upcoming" ||
                session.status === "live" ||
                session.status === "completed"
            )
            .sort(sortByDateThenTitle)
        );
      } catch (err) {
        console.error("Error fetching live classes:", err);
        setError("Failed to load live sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API]);

  const courseOptions = useMemo(() => {
    const courseMap = new Map();

    liveClasses.forEach((session) => {
      const courseId = getCourseId(session);
      const courseTitle = getCourseTitle(session);
      const chapterId = getChapterId(session);
      const chapterTitle = getChapterTitle(session);

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          id: courseId,
          title: courseTitle,
          count: 0,
          chapters: new Map(),
        });
      }

      const courseEntry = courseMap.get(courseId);
      courseEntry.count += 1;

      if (chapterId) {
        if (!courseEntry.chapters.has(chapterId)) {
          courseEntry.chapters.set(chapterId, {
            id: chapterId,
            title: chapterTitle,
            count: 0,
          });
        }
        courseEntry.chapters.get(chapterId).count += 1;
      }
    });

    return Array.from(courseMap.values())
      .map((course) => ({
        ...course,
        chapters: Array.from(course.chapters.values()).sort((a, b) =>
          a.title.localeCompare(b.title)
        ),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [liveClasses]);

  const selectedCourse = useMemo(
    () =>
      courseOptions.find(
        (course) => String(course.id) === String(selectedCourseId)
      ) || null,
    [courseOptions, selectedCourseId]
  );

  const chapterOptions = useMemo(
    () => selectedCourse?.chapters || [],
    [selectedCourse]
  );

  const selectedChapter = useMemo(
    () =>
      chapterOptions.find(
        (chapter) => String(chapter.id) === String(selectedChapterId)
      ) || null,
    [chapterOptions, selectedChapterId]
  );

  const selectedSidebarSession = useMemo(
    () =>
      liveClasses.find(
        (session) => String(session?._id) === String(selectedLiveSessionId)
      ) || null,
    [liveClasses, selectedLiveSessionId]
  );

  useEffect(() => {
    if (!selectedSidebarSession) return;
    setSelectedCourseId(getCourseId(selectedSidebarSession));
    setSelectedChapterId(getChapterId(selectedSidebarSession));
  }, [selectedSidebarSession]);

  useEffect(() => {
    if (!selectedCourse) {
      setSelectedChapterId("");
      return;
    }

    if (!chapterOptions.length) {
      setSelectedChapterId("");
      return;
    }

    const selectedChapterExists = chapterOptions.some(
      (chapter) => String(chapter.id) === String(selectedChapterId)
    );

    if (!selectedChapterId || !selectedChapterExists) {
      setSelectedChapterId(chapterOptions[0].id);
    }
  }, [chapterOptions, selectedChapterId, selectedCourse]);

  const filteredLiveClasses = useMemo(() => {
    if (selectedSidebarSession) {
      return [selectedSidebarSession];
    }

    return liveClasses
      .filter((session) => {
        if (!selectedCourseId) return true;
        return String(getCourseId(session)) === String(selectedCourseId);
      })
      .filter((session) => {
        if (!selectedChapterId) return true;
        return String(getChapterId(session)) === String(selectedChapterId);
      })
      .sort(sortByDateThenTitle);
  }, [liveClasses, selectedCourseId, selectedChapterId, selectedSidebarSession]);

  const handleEnrollNewSessions = () => {
    router.push("/live-session");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date TBD";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleOpenSession = (session) => {
    if (!session?.link) return;
    if (session.link.startsWith("http")) {
      window.open(session.link, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = session.link;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Live Sessions</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading live sessions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Live Sessions</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Live Sessions</h1>
        <button
          onClick={handleEnrollNewSessions}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Enroll New Live Sessions
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
        <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Courses</h2>
            <button
              onClick={() => {
                setSelectedCourseId("");
                setSelectedChapterId("");
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCourseId("");
                setSelectedChapterId("");
              }}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                !selectedCourseId
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="font-medium text-gray-900">All Courses</div>
              <div className="text-xs text-gray-500">
                {liveClasses.length} live session{liveClasses.length !== 1 ? "s" : ""}
              </div>
            </button>

            {courseOptions.length === 0 ? (
              <p className="text-sm text-gray-500">No course-linked live sessions found.</p>
            ) : (
              courseOptions.map((course) => {
                const isActive = String(course.id) === String(selectedCourseId);

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setSelectedChapterId("");
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{course.title}</div>
                    <div className="text-xs text-gray-500">{course.count} live session{course.count !== 1 ? "s" : ""}</div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Chapters</h2>
              {selectedCourse ? (
                <span className="text-xs font-medium text-gray-500">{selectedCourse.title}</span>
              ) : null}
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {!selectedCourse ? (
                <p className="text-sm text-gray-500">Select a course to load chapters.</p>
              ) : chapterOptions.length === 0 ? (
                <p className="text-sm text-gray-500">No chapters linked to this course.</p>
              ) : (
                chapterOptions.map((chapter) => {
                  const isActive = String(chapter.id) === String(selectedChapterId);

                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setSelectedChapterId(chapter.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{chapter.title}</div>
                      <div className="text-xs text-gray-500">{chapter.count} live session{chapter.count !== 1 ? "s" : ""}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <main className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSidebarSession
                  ? selectedSidebarSession.title
                  : selectedCourse?.title || "All Live Sessions"}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedSidebarSession ? (
                  <>
                    {getCourseTitle(selectedSidebarSession)} •{" "}
                    {getChapterTitle(selectedSidebarSession)}
                  </>
                ) : selectedChapter
                  ? `Chapter: ${selectedChapter.title}`
                  : selectedCourse
                  ? "Choose a chapter to narrow the sessions."
                  : "Choose a course and chapter to narrow the sessions."}
              </p>
            </div>
            {selectedSidebarSession ? (
              <button
                type="button"
                onClick={onClearSelectedLiveSession}
                className="self-start rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Back to all classes
              </button>
            ) : null}
            <div className="text-sm text-gray-500">
              Showing {filteredLiveClasses.length} session{filteredLiveClasses.length !== 1 ? "s" : ""}
            </div>
          </div>

          {filteredLiveClasses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">
                No live sessions found for the selected course and chapter.
              </p>
              <button
                onClick={handleEnrollNewSessions}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Browse Available Sessions
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredLiveClasses.map((session) => {
                const status = getSessionStatus(session);
                const isEnrolled = enrolledSessionSet.has(String(session._id));
                const courseTitle = getCourseTitle(session);
                const chapterTitle = getChapterTitle(session);

                return (
                  <div
                    key={session._id}
                    className="bg-[#f8f9fa] p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-blue-800">
                          {session.title}
                        </h3>
                        <p className="text-sm mt-1 text-gray-700">
                          {formatDate(session.date)}
                          {formatSessionTimeRange(session.time)
                            ? ` at ${formatSessionTimeRange(session.time)}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          status === "live"
                            ? "bg-red-100 text-red-600"
                            : status === "upcoming"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium text-gray-700">Course:</span> {courseTitle}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Chapter:</span> {chapterTitle}
                      </p>
                      {session.price > 0 ? (
                        <p className="text-green-600 font-medium">Price: ₹{session.price}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isEnrolled ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                          Enrolled
                        </span>
                      ) : null}
                      {session.category ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                          {session.category}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      {status === "live" && session.link ? (
                        <a
                          href={session.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium"
                        >
                          Join Now
                        </a>
                      ) : null}

                      {status === "upcoming" ? (
                        <button
                          disabled
                          className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-medium cursor-not-allowed"
                        >
                          Not Started
                        </button>
                      ) : null}

                      {status === "completed" && session.link ? (
                        <button
                          onClick={() => handleOpenSession(session)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium"
                        >
                          View Session
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
