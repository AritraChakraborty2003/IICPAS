"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LiveClassTab() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First, get the authenticated student
        const studentResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/isstudent`,
          { withCredentials: true }
        );
        
        if (studentResponse.data.student) {
          const currentStudent = studentResponse.data.student;
          setStudent(currentStudent);

          // Fetch enrolled live sessions for this student
          const enrolledSessionsResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/enrolled-live-sessions/${currentStudent._id}`,
            { withCredentials: true }
          );

          const enrolledSessions =
            enrolledSessionsResponse.data.enrolledLiveSessions || [];

          if (Array.isArray(enrolledSessions) && enrolledSessions.length > 0) {
            setLiveClasses(enrolledSessions);
          } else {
            const bookingsResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/bookings?category=live&hasLiveSession=true&studentId=${currentStudent._id}`,
              { withCredentials: true }
            );
            const bookings = Array.isArray(bookingsResponse.data)
              ? bookingsResponse.data
              : [];
            const bookedSessions = bookings
              .map((booking) => booking.liveSessionId || booking)
              .filter(Boolean);
            setLiveClasses(bookedSessions.length > 0 ? bookedSessions : (currentStudent.enrolledLiveSessions || []));
          }
        } else {
          // If not logged in, show all live sessions
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/live-sessions`
          );
          setLiveClasses(response.data);
        }
      } catch (err) {
        console.error("Error fetching live classes:", err);
        setError("Failed to load live classes");
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

  const formatTime = (timeString) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const sessionTime = new Date(`2000-01-01T${session.time}`);

    // Combine date and time
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(sessionTime.getHours(), sessionTime.getMinutes());

    // Check if session is within 1 hour of now (live)
    const oneHourBefore = new Date(sessionDateTime.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(sessionDateTime.getTime() + 60 * 60 * 1000);

    if (now >= oneHourBefore && now <= oneHourAfter) {
      return "live";
    } else if (now < sessionDateTime) {
      return "upcoming";
    } else {
      return "completed";
    }
  };

  const handleEnrollNewSessions = () => {
    router.push('/live-session');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Live Classes</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading live classes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Live Classes</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Live Classes</h1>
        <button
          onClick={handleEnrollNewSessions}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Enroll New Live Sessions
        </button>
      </div>

      {liveClasses.length === 0 ? (
        <div className="text-center py-12">
          {student ? (
            <div>
              <p className="text-gray-500 text-lg mb-4">
                You haven't enrolled in any live sessions yet.
              </p>
                <p className="text-gray-400 mb-6">
                Once you enroll in a live session, it will appear here.
              </p>
              <button
                onClick={handleEnrollNewSessions}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Browse Available Sessions
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-6">
                No live sessions available right now.
              </p>
              <button
                onClick={handleEnrollNewSessions}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                View All Sessions
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {liveClasses.map((cls) => {
            const status = getSessionStatus(cls);

            return (
              <div
                key={cls._id}
                className="bg-[#f8f9fa] p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <h3 className="text-lg font-bold text-blue-800">
                    {cls.title}
                  </h3>
                  <p className="text-sm mt-1 text-gray-700">
                    {formatDate(cls.date)} at {formatTime(cls.time)}
                  </p>
                  {cls.price > 0 && (
                    <p className="text-sm mt-1 text-green-600 font-medium">
                      Price: ₹{cls.price}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Status Tag */}
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

                  {/* Actions */}
                  {status === "live" && (
                    <a
                      href={cls.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium"
                    >
                      Join Now
                    </a>
                  )}

                  {status === "upcoming" && (
                    <button
                      disabled
                      className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-medium cursor-not-allowed"
                    >
                      Not Started
                    </button>
                  )}

                  {status === "completed" && cls.link && (
                    <a
                      href={cls.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium"
                    >
                      Watch Recording
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
