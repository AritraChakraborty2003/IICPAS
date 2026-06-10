"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

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

const getStatusBadge = (status) => {
  switch (status) {
    case "live":
      return "bg-red-100 text-red-600";
    case "scheduled":
    case "upcoming":
      return "bg-yellow-100 text-yellow-600";
    case "completed":
      return "bg-green-100 text-green-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const labelize = (s = "") =>
  String(s).charAt(0).toUpperCase() + String(s).slice(1);

const joinTitles = (arr) =>
  (arr || [])
    .map((x) => x?.title)
    .filter(Boolean)
    .join(", ");

export default function LiveClassListTab() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        setError("");

        // Identify logged-in student
        const studentResponse = await axios
          .get(`${API}/api/v1/students/isstudent`, { withCredentials: true })
          .catch(() => ({ data: null }));

        const student = studentResponse?.data?.student || null;
        if (!student?._id) {
          setClasses([]);
          return;
        }

        // Fetch only LIVE classes for the student's purchased courses.
        // A class that has ended is resolved to "recorded" server-side and
        // therefore won't appear here — it moves to the Recorded Class tab.
        const response = await axios.get(
          `${API}/api/classes/for-student/${student._id}?type=live`,
          { withCredentials: true }
        );

        const data = Array.isArray(response.data) ? response.data : [];
        setClasses(data.sort((a, b) => new Date(a.startAt) - new Date(b.startAt)));
      } catch (err) {
        console.error("Failed to load live classes:", err);
        setError("Failed to load live classes");
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  // Group by the first course of each class (a class can target multiple courses)
  const groupedCourses = useMemo(() => {
    const courseMap = new Map();

    classes.forEach((cls) => {
      const courseList = cls.courses?.length
        ? cls.courses
        : [{ _id: "general", title: "General" }];

      courseList.forEach((course) => {
        const courseKey = String(course._id || "general");
        if (!courseMap.has(courseKey)) {
          courseMap.set(courseKey, {
            id: courseKey,
            title: course.title || "General",
            classes: [],
          });
        }
        courseMap.get(courseKey).classes.push(cls);
      });
    });

    return Array.from(courseMap.values());
  }, [classes]);

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
          {classes.length} class{classes.length !== 1 ? "es" : ""} saved
        </div>
      </div>

      {groupedCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No live classes available right now.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Live classes for your enrolled courses will appear here. Once a class
            ends, it moves to the Recorded Class tab.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedCourses.map((course) => (
            <section
              key={course.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {course.title}
                </h2>
                <span className="text-sm text-gray-500">
                  {course.classes.length} class
                  {course.classes.length !== 1 ? "es" : ""}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {course.classes.map((cls) => (
                  <div
                    key={cls._id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-bold text-blue-800">
                          {cls.title}
                        </h4>
                        <p className="text-sm text-gray-700 mt-1">
                          {formatDate(cls.date)}
                          {cls.time ? ` at ${cls.time}` : ""}
                          {cls.durationMinutes ? ` · ${cls.durationMinutes}m` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(
                          cls.status
                        )}`}
                      >
                        {labelize(cls.status)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      {cls.instructor ? (
                        <p>
                          <span className="font-medium text-gray-700">
                            Instructor:
                          </span>{" "}
                          {cls.instructor}
                        </p>
                      ) : null}
                      {joinTitles(cls.chapters) ? (
                        <p>
                          <span className="font-medium text-gray-700">
                            Chapter:
                          </span>{" "}
                          {joinTitles(cls.chapters)}
                        </p>
                      ) : null}
                      {cls.price ? (
                        <p className="text-green-600 font-medium">
                          Price: ₹{cls.price}
                        </p>
                      ) : null}
                    </div>

                    {cls.meetingLink ? (
                      <a
                        href={cls.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Open Class
                      </a>
                    ) : (
                      <p className="mt-4 text-xs text-gray-400">
                        Meeting link not available yet
                      </p>
                    )}
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
