"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  PlayCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
} from "lucide-react";

const stripHtml = (value) => {
  if (!value) return "";
  return value
    .toString()
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
};

// Returns true if the session's scheduled date+time window has ended
const isSessionOver = (session) => {
  const now = new Date();
  const sessionDate = new Date(session.date);
  if (Number.isNaN(sessionDate.getTime())) return false;

  if (!session.time || typeof session.time !== "string") {
    // No time info — treat as over if the date has passed
    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);
    return now > endOfDay;
  }

  const [, endTime] = session.time.split(" - ");
  if (!endTime) return now > sessionDate;

  const [endHour, endMinute] = String(endTime).split(":").map(Number);
  if (!Number.isFinite(endHour) || !Number.isFinite(endMinute)) return now > sessionDate;

  const sessionEnd = new Date(sessionDate);
  sessionEnd.setHours(endHour, endMinute, 0, 0);
  return now > sessionEnd;
};

export default function RecordedSessionTab() {
  const [recordedSessions, setRecordedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const studentResponse = await axios.get(
          `${API_BASE}/api/v1/students/isstudent`,
          { withCredentials: true }
        );

        if (studentResponse.data.student) {
          setStudent(studentResponse.data.student);
          const studentId = studentResponse.data.student._id;

          const response = await axios.get(
            `${API_BASE}/api/live-sessions/for-student/${studentId}`,
            { withCredentials: true }
          );

          const sessions = Array.isArray(response.data) ? response.data : [];

          // A session counts as a recording if:
          // 1. The student is enrolled (purchased course or directly enrolled)
          // 2. The session has ended — either server says "completed" OR date/time has passed
          // 3. There is a recording link
          const completed = sessions
            .filter((session) => {
              const enrolled = session?.isEnrolled === true;
              const hasLink = session?.link && session.link.trim() !== "";
              const over =
                String(session?.status || "").toLowerCase() === "completed" ||
                isSessionOver(session);
              return enrolled && hasLink && over;
            })
            .sort(
              (a, b) =>
                new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );

          setRecordedSessions(completed);
        } else {
          setRecordedSessions([]);
        }
      } catch (err) {
        console.error("Error fetching recorded sessions:", err);
        setError("Failed to load recorded sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date TBD";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleWatchSession = (link) => {
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Recorded Sessions</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading recorded sessions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Recorded Sessions</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
      <h1 className="text-2xl font-semibold mb-8">Recorded Sessions</h1>

      {recordedSessions.length === 0 ? (
        <div className="text-center py-12">
          {student ? (
            <div>
              <p className="text-gray-500 text-lg mb-4">
                No recordings available yet.
              </p>
              <p className="text-gray-400">
                Live sessions you are enrolled in will appear here automatically once the session ends.
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No recorded sessions available right now.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {recordedSessions.map((session) => (
            <div
              key={session._id}
              className="bg-[#f8f9fa] p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <PlayCircleIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-blue-800">
                      {session.title}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {stripHtml(session.description) ||
                      session.subtitle ||
                      "Recorded live session content"}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Date: {formatDate(session.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>Time: {session.time || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span>Instructor: {session.instructor || "IICPA Faculty"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {session.price > 0
                        ? `₹${session.price.toLocaleString()}`
                        : "Free"}
                    </div>
                    <div className="text-xs text-gray-500">Paid</div>
                  </div>

                  <button
                    onClick={() => handleWatchSession(session.link)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <PlayCircleIcon className="w-4 h-4" />
                    Watch Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
