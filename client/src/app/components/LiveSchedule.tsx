"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Play,
  ExternalLink,
  CheckCircle,
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
  maxParticipants: number;
  thumbnail: string;
  status: string;
}

interface LiveScheduleProps {
  courseCategory: string;
  courseId?: string;
  student?: any;
}

export default function LiveSchedule({
  courseCategory,
  courseId,
  student,
}: LiveScheduleProps) {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolledSessions, setEnrolledSessions] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetchLiveSessions();
    if (student) {
      fetchEnrolledSessions();
    }
  }, [courseCategory, courseId, student]);

  const fetchLiveSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/live-sessions`);

      // Filter sessions by course category
      const filteredSessions = response.data.filter(
        (session: LiveSession) =>
          session.category === courseCategory ||
          session.category === "CA Foundation"
      );

      setLiveSessions(filteredSessions);
    } catch (err) {
      console.error("Error fetching live sessions:", err);
      setError("Failed to load live sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledSessions = async () => {
    if (!student) return;

    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/students/enrolled-live-sessions/${student._id}`
      );
      const enrolledIds = response.data.enrolledLiveSessions.map(
        (session: any) => session._id
      );
      setEnrolledSessions(enrolledIds);
    } catch (err) {
      console.error("Error fetching enrolled sessions:", err);
    }
  };

  const handleJoinSession = (session: LiveSession) => {
    if (session.link) {
      if (session.link.startsWith("http")) {
        window.open(session.link, "_blank");
      } else {
        window.location.href = session.link;
      }
    }
  };

  const handleEnrollSession = async (sessionId: string) => {
    if (!student) {
      setShowLoginModal(true);
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/v1/students/enroll-live-session/${student._id}`,
        { sessionId },
        { withCredentials: true }
      );

      setEnrolledSessions((prev) => [...prev, sessionId]);
      alert("Successfully enrolled in live session!");
    } catch (err: any) {
      console.error("Error enrolling in session:", err);
      if (err.response?.data?.message?.includes("already enrolled")) {
        alert("You are already enrolled in this session");
      } else {
        alert("Failed to enroll in session. Please try again.");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString; // Assuming time is already formatted as "HH:MM - HH:MM"
  };

  const getSessionStatus = (session: LiveSession) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const sessionTime = session.time.split(" - ")[0];
    const [hours, minutes] = sessionTime.split(":").map(Number);

    sessionDate.setHours(hours, minutes, 0, 0);

    if (sessionDate < now) {
      return "completed";
    } else if (sessionDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return "upcoming";
    } else {
      return "scheduled";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <span className="ml-4 text-gray-600">Loading live sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Sessions
          </h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchLiveSessions}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (liveSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Live Sessions Scheduled
          </h3>
          <p className="text-gray-600 mb-4">
            There are currently no live sessions scheduled for this course
            category.
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
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Live Schedule</h3>
          <div className="text-sm text-gray-600">
            {liveSessions.length} session{liveSessions.length !== 1 ? "s" : ""}{" "}
            available
          </div>
        </div>

        <div className="grid gap-6">
          {liveSessions.map((session, index) => {
            const isEnrolled = enrolledSessions.includes(session._id);
            const sessionStatus = getSessionStatus(session);

            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-xl font-bold text-gray-900 pr-4">
                        {session.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {isEnrolled && (
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Enrolled
                          </span>
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            sessionStatus === "upcoming"
                              ? "bg-blue-100 text-blue-800"
                              : sessionStatus === "completed"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {sessionStatus === "upcoming"
                            ? "Upcoming"
                            : sessionStatus === "completed"
                            ? "Completed"
                            : "Scheduled"}
                        </span>
                      </div>
                    </div>

                    {session.description && (
                      <p className="text-gray-600 mb-4">
                        {session.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(session.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(session.time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Max {session.maxParticipants} participants</span>
                      </div>
                      {session.instructor && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Instructor:</span>
                          <span>{session.instructor}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-col">
                    {isEnrolled ? (
                      <button
                        onClick={() => handleJoinSession(session)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Join Session
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnrollSession(session._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        Enroll Now
                      </button>
                    )}

                    {session.link && (
                      <button
                        onClick={() => handleJoinSession(session)}
                        className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                About Live Sessions
              </h4>
              <p className="text-blue-800 text-sm">
                Live sessions provide interactive learning experiences with
                real-time Q&A, practical demonstrations, and direct instructor
                guidance. Enroll in sessions to access the meeting links and
                join the live classes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          // Refresh the page to update student state
          window.location.reload();
        }}
      />
    </>
  );
}
