"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Play,
  ExternalLink,
  CheckCircle,
  Video,
} from "lucide-react";
import axios from "axios";
import LoginModal from "./LoginModal";

interface LiveSession {
  _id: string;
  title: string;
  instructor: string;
  description: string;
  time: string;
  date: string;
  link: string;
  price: number;
  category: string;
  courseId?: any;
  courseIds?: any[];
  maxParticipants: number;
  thumbnail: string;
  status: string;
}

interface LiveClass {
  _id: string;
  title: string;
  instructor?: string;
  description?: string;
  time?: string;
  date?: string;
  startAt?: string;
  durationMinutes?: number;
  meetingLink?: string;
  status: string;
  courses?: any[];
  chapters?: any[];
  price?: number;
  type?: string;
}

interface LiveScheduleProps {
  courseCategory: string;
  courseId?: string;
  student?: any;
}

const extractId = (val: any): string => String(val?._id || val || "");

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTimeRange = (t: string) => {
  if (!t) return "";
  const [start, end] = t.split(" - ");
  const fmt = (s: string) => {
    if (!s) return "";
    const d = new Date(`2000-01-01T${s}`);
    return isNaN(d.getTime())
      ? s
      : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
};

const getSessionStatus = (session: LiveSession) => {
  const now = new Date();
  const sessionDate = new Date(session.date);
  if (isNaN(sessionDate.getTime())) return "scheduled";

  if (!session.time) return now < sessionDate ? "upcoming" : "completed";

  const [startStr, endStr] = session.time.split(" - ");
  const [sh, sm] = (startStr || "").split(":").map(Number);
  const [eh, em] = (endStr || startStr || "").split(":").map(Number);

  const sessionStart = new Date(sessionDate);
  sessionStart.setHours(sh || 0, sm || 0, 0, 0);
  const sessionEnd = new Date(sessionDate);
  sessionEnd.setHours(eh || sh || 0, em || sm || 0, 0, 0);

  if (now >= new Date(sessionStart.getTime() - 3600000) && now <= new Date(sessionEnd.getTime() + 3600000)) {
    return "live";
  }
  return now < sessionStart ? "upcoming" : "completed";
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "live": return "bg-red-100 text-red-700";
    case "upcoming": return "bg-blue-100 text-blue-800";
    case "completed": return "bg-gray-100 text-gray-700";
    default: return "bg-yellow-100 text-yellow-800";
  }
};

const statusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export default function LiveSchedule({
  courseCategory,
  courseId,
  student,
}: LiveScheduleProps) {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolledSessions, setEnrolledSessions] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetchAll();
    if (student?._id) {
      fetchEnrolledSessions();
    }
  }, [courseCategory, courseId, student?._id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionsRes, classesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/live-sessions`).catch(() => ({ data: [] })),
        courseId
          ? axios.get(`${API_BASE}/api/classes/course/${courseId}`).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      // Filter live sessions: match by courseId (handling populated objects) or category
      const allSessions: LiveSession[] = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      const filtered = allSessions.filter((session) => {
        if (courseId) {
          const primaryMatch = session.courseId && extractId(session.courseId) === String(courseId);
          const arrayMatch =
            Array.isArray(session.courseIds) &&
            session.courseIds.some((id) => extractId(id) === String(courseId));
          if (primaryMatch || arrayMatch) return true;
        }
        // Fallback: category match
        return session.category === courseCategory;
      });

      setLiveSessions(filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

      // Live classes for this course
      const allClasses: LiveClass[] = Array.isArray(classesRes.data) ? classesRes.data : [];
      setLiveClasses(
        allClasses
          .filter((c) => c.isActive !== false)
          .sort((a, b) => new Date(a.date || a.startAt || 0).getTime() - new Date(b.date || b.startAt || 0).getTime())
      );
    } catch (err) {
      console.error("Error fetching live schedule:", err);
      setError("Failed to load live schedule");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledSessions = async () => {
    if (!student?._id) return;
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/students/enrolled-live-sessions/${student._id}`
      );
      const ids = (response.data.enrolledLiveSessions || []).map((s: any) => String(s._id || s));
      setEnrolledSessions(ids);
    } catch {
      // silently ignore
    }
  };

  const handleJoinSession = (link: string) => {
    if (!link) return;
    if (link.startsWith("http")) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = link;
    }
  };

  const handleEnrollSession = async (session: LiveSession) => {
    if (!student) {
      setShowLoginModal(true);
      return;
    }
    // Paid session → go to the landing/payment page
    if (session.price > 0) {
      router.push(`/live-session/landing/${session._id}`);
      return;
    }
    // Free session → direct enroll
    try {
      await axios.post(
        `${API_BASE}/api/v1/students/enroll-live-session/${student._id}`,
        { sessionId: session._id },
        { withCredentials: true }
      );
      setEnrolledSessions((prev) => [...prev, session._id]);
      alert("Successfully enrolled in live session!");
    } catch (err: any) {
      if (err.response?.data?.message?.includes("already enrolled")) {
        alert("You are already enrolled in this session");
      } else {
        alert("Failed to enroll. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
        <span className="ml-4 text-gray-600">Loading live schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Schedule</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAll}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalCount = liveSessions.length + liveClasses.length;

  if (totalCount === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Live Sessions Scheduled
          </h3>
          <p className="text-gray-600 mb-2">
            There are currently no live sessions scheduled for this course.
          </p>
          <p className="text-sm text-gray-500">
            Check back later or contact us for upcoming sessions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Live Schedule</h3>
          <div className="text-sm text-gray-500">
            {totalCount} item{totalCount !== 1 ? "s" : ""} available
          </div>
        </div>

        {/* ── Live Sessions ── */}
        {liveSessions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Play className="w-3.5 h-3.5" /> Live Sessions
            </h4>
            <div className="grid gap-5">
              {liveSessions.map((session, index) => {
                const isEnrolled = enrolledSessions.includes(session._id);
                const status = getSessionStatus(session);
                const isOver = status === "completed";

                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.07 }}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{session.title}</h4>
                          {isEnrolled && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Enrolled
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadgeClass(status)}`}>
                            {statusLabel(status)}
                          </span>
                          {isOver && (
                            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              <Video className="w-3 h-3" /> Recorded
                            </span>
                          )}
                        </div>

                        {session.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{session.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.date)}
                          </span>
                          {session.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTimeRange(session.time)}
                            </span>
                          )}
                          {session.maxParticipants > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              Max {session.maxParticipants}
                            </span>
                          )}
                          {session.instructor && (
                            <span>
                              <span className="font-medium">Instructor:</span> {session.instructor}
                            </span>
                          )}
                          {session.price > 0 && (
                            <span className="font-semibold text-green-600">₹{session.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                        {isEnrolled ? (
                          <>
                            {status === "live" && session.link && (
                              <button
                                onClick={() => handleJoinSession(session.link)}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
                              >
                                <Play className="w-4 h-4" /> Join Now
                              </button>
                            )}
                            {status === "upcoming" && (
                              <button disabled className="inline-flex items-center gap-2 bg-gray-200 text-gray-500 font-semibold py-2.5 px-5 rounded-lg cursor-not-allowed">
                                <Clock className="w-4 h-4" /> Not Started
                              </button>
                            )}
                            {isOver && session.link && (
                              <button
                                onClick={() => handleJoinSession(session.link)}
                                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
                              >
                                <Video className="w-4 h-4" /> Watch Recording
                              </button>
                            )}
                            {isOver && !session.link && (
                              <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 font-medium py-2.5 px-5 rounded-lg text-sm">
                                <Clock className="w-4 h-4" /> Recording soon
                              </span>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleEnrollSession(session)}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
                          >
                            {session.price > 0 ? `Buy • ₹${session.price}` : "Enroll Free"}
                          </button>
                        )}
                        {session.link && !isOver && (
                          <button
                            onClick={() => handleJoinSession(session.link)}
                            className="inline-flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2.5 px-5 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" /> Details
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Live Classes ── */}
        {liveClasses.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Video className="w-3.5 h-3.5" /> Live Classes
            </h4>
            <div className="grid gap-5">
              {liveClasses.map((cls, index) => {
                const clsDate = cls.date || cls.startAt || "";
                const isRecorded = cls.type === "recorded";
                const clsStatus = isRecorded ? "completed" : (cls.status || "scheduled");

                return (
                  <motion.div
                    key={cls._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.07 }}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{cls.title}</h4>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadgeClass(clsStatus)}`}>
                            {statusLabel(clsStatus)}
                          </span>
                          {isRecorded && (
                            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              <Video className="w-3 h-3" /> Recorded
                            </span>
                          )}
                        </div>

                        {cls.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cls.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {clsDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(clsDate)}
                            </span>
                          )}
                          {cls.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {cls.time}
                            </span>
                          )}
                          {(cls.durationMinutes || 0) > 0 && (
                            <span>{cls.durationMinutes}m</span>
                          )}
                          {cls.instructor && (
                            <span>
                              <span className="font-medium">Instructor:</span> {cls.instructor}
                            </span>
                          )}
                          {Array.isArray(cls.chapters) && cls.chapters.length > 0 && (
                            <span className="text-xs text-gray-400">
                              Chapters: {cls.chapters.map((ch: any) => ch?.title).filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                        {isRecorded && (cls as any).recordingUrl ? (
                          <button
                            onClick={() => handleJoinSession((cls as any).recordingUrl)}
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
                          >
                            <Video className="w-4 h-4" /> Watch Recording
                          </button>
                        ) : cls.meetingLink ? (
                          <a
                            href={cls.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" /> Open Class
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 font-medium py-2.5 px-5 rounded-lg text-sm">
                            <Clock className="w-4 h-4" />
                            {isRecorded ? "Recording soon" : "Link pending"}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2 shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">About Live Sessions & Classes</h4>
              <p className="text-blue-800 text-sm">
                Live sessions and classes provide interactive learning with real-time Q&A and
                instructor guidance. Completed sessions are available as recordings.
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          window.location.reload();
        }}
      />
    </>
  );
}
