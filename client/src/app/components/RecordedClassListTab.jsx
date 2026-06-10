"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  PlayCircle,
  Calendar,
  BookOpen,
  ExternalLink,
} from "lucide-react";

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

const joinTitles = (arr) =>
  (arr || [])
    .map((x) => x?.title)
    .filter(Boolean)
    .join(", ");

export default function RecordedClassListTab({ student }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!student?._id) {
        setClasses([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fetch RECORDED classes for the student's purchased courses.
        // A live class that has ended is auto-resolved to "recorded" and
        // shows up here once its scheduled window passes.
        const response = await axios.get(
          `${API}/api/classes/for-student/${student._id}?type=recorded`,
          { withCredentials: true }
        );

        const data = Array.isArray(response.data) ? response.data : [];
        setClasses(data.sort((a, b) => new Date(b.startAt) - new Date(a.startAt)));
      } catch (err) {
        console.error("Failed to load recorded classes:", err);
        setError("Failed to load recorded classes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [student?._id]);

  // Group recorded classes by their first course
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

  const totalClasses = classes.length;

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
          <div className="text-gray-500 text-lg">
            Loading recorded classes...
          </div>
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
            Recordings of live classes from your enrolled courses, available
            after each class ends.
          </p>
        </div>

        <div className="text-sm font-medium bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100">
          {totalClasses} Recorded Class{totalClasses !== 1 ? "es" : ""}
        </div>
      </div>

      {groupedCourses.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            No recorded classes yet.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Once a live class in your enrolled courses ends, its recording will
            appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedCourses.map((course) => (
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
                      {course.classes.length} recorded class
                      {course.classes.length === 1 ? "" : "es"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200">
                  {course.classes.map((cls) => (
                    <li
                      key={cls._id}
                      className="flex flex-col gap-4 bg-white px-4 py-4 transition-colors hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                          <PlayCircle className="h-6 w-6" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold text-gray-900">
                              {cls.title}
                            </h4>
                            <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-green-700">
                              Recorded
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(cls.date)}</span>
                            </div>
                          </div>

                          {joinTitles(cls.chapters) ? (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium text-gray-700">
                                Chapter:
                              </span>{" "}
                              {joinTitles(cls.chapters)}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:pl-6 md:text-right">
                        <div className="hidden md:block">
                          <div className="text-xs uppercase tracking-[0.18em] text-gray-400">
                            Recording
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {cls.recordingUrl ? "Available" : "Processing"}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!cls.recordingUrl) return;
                            window.open(
                              cls.recordingUrl,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                          disabled={!cls.recordingUrl}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                            cls.recordingUrl
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
