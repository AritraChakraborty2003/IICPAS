"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  PlayCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
} from "lucide-react";

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

        // First, get the authenticated student
        const studentResponse = await axios.get(
          `${API_BASE}/api/v1/students/isstudent`,
          { withCredentials: true }
        );

        if (studentResponse.data.student) {
          setStudent(studentResponse.data.student);

          // Fetch enrolled recorded sessions for this student
          const enrolledUrl = `${API_BASE}/api/v1/students/enrolled-recorded-sessions/${studentResponse.data.student._id}`;
          console.log(
            "Fetching enrolled recorded sessions with URL:",
            enrolledUrl
          );
          console.log("Student ID:", studentResponse.data.student._id);

          const enrolledSessionsResponse = await axios.get(enrolledUrl, {
            withCredentials: true,
          });

          setRecordedSessions(
            enrolledSessionsResponse.data.enrolledRecordedSessions || []
          );
        } else {
          // If not logged in, show empty state
          setRecordedSessions([]);
        }
      } catch (err) {
        console.error("Error fetching recorded sessions:", err);
        console.error("Error details:", err.response?.data);
        console.error("Error status:", err.response?.status);
        setError("Failed to load recorded sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleWatchSession = (courseId) => {
    // Navigate to digital hub with course ID
    window.open(`/digital-hub/${encodeURIComponent(courseId)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Recorded Sessions</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">
            Loading recorded sessions...
          </div>
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
                You haven't enrolled in any recorded sessions yet.
              </p>
              <p className="text-gray-400">
                Purchase a course with Digital Hub to get access to recorded
                sessions.
              </p>
            </div>
          ) : (
            <p className="text-gray-500">
              No recorded sessions available right now.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {recordedSessions.map((course) => (
            <div
              key={course._id}
              className="bg-[#f8f9fa] p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <PlayCircleIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-blue-800">
                      {course.title}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {course.description || "Recorded course content"}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Added: {formatDate(course.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>
                        {course.chapters ? course.chapters.length : 0} Lessons
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span>{course.category || "CA Foundation"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹{course.price?.toLocaleString() || "0"}
                    </div>
                    <div className="text-xs text-gray-500">Paid</div>
                  </div>

                  <button
                    onClick={() => handleWatchSession(course._id)}
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
