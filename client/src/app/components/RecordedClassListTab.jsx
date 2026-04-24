"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { PlayCircle, Clock, Calendar, BookOpen, ExternalLink } from "lucide-react";

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

export default function RecordedClassListTab({ student }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!student?._id) return;
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${API}/api/courses/student-courses/${student._id}`);
        const data = response.data?.courses || [];
        setCourses(data);
      } catch (err) {
        console.error("Failed to load recorded classes:", err);
        setError("Failed to load recorded classes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [student?._id]);

  const recordedLessonsByGroup = useMemo(() => {
    const groups = [];

    courses.forEach((course) => {
      const courseGroup = {
        id: course._id,
        title: course.title,
        chapters: [],
      };

      (course.chapters || []).forEach((chapter) => {
        const chapterGroup = {
          id: chapter._id,
          title: chapter.title,
          lessons: (chapter.topics || []).flatMap((topic) => 
            (topic.lessons || [])
              .filter((lesson) => lesson.kind === "recorded" && lesson.status === "active")
              .map((lesson) => ({
                ...lesson,
                topicTitle: topic.title,
                courseTitle: course.title,
                chapterTitle: chapter.title,
              }))
          ),
        };

        if (chapterGroup.lessons.length > 0) {
          courseGroup.chapters.push(chapterGroup);
        }
      });

      if (courseGroup.chapters.length > 0) {
        groups.push(courseGroup);
      }
    });

    return groups;
  }, [courses]);

  const totalLessons = useMemo(() => {
    return recordedLessonsByGroup.reduce((sum, course) => 
      sum + course.chapters.reduce((cSum, chapter) => cSum + chapter.lessons.length, 0), 0
    );
  }, [recordedLessonsByGroup]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-white text-black overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-8">Recorded Class</h1>
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Recorded Class</h1>
          <p className="text-sm text-gray-500 mt-1">
            Access all video lessons from your enrolled courses.
          </p>
        </div>
        <div className="text-sm font-medium bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100">
          {totalLessons} Recorded Lesson{totalLessons !== 1 ? "s" : ""}
        </div>
      </div>

      {recordedLessonsByGroup.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No recorded classes found.</p>
          <p className="text-gray-400 text-sm mt-2">Enroll in a course to start learning.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {recordedLessonsByGroup.map((course) => (
            <section key={course.id} className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
              </div>

              <div className="space-y-8 ml-5">
                {course.chapters.map((chapter) => (
                  <div key={chapter.id}>
                    <div className="mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        {chapter.title}
                      </h3>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {chapter.lessons.map((lesson) => (
                        <div
                          key={lesson._id}
                          className="group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                              <PlayCircle className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded">
                              Order {lesson.order}
                            </span>
                          </div>

                          <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                            {lesson.title}
                          </h4>

                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Published: {formatDate(lesson.publishAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span className="truncate">Topic: {lesson.topicTitle}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const url = lesson.sourceUrl || (lesson.sourceType === "link" ? lesson.sourceUrl : "");
                              if (url) window.open(url, "_blank", "noopener,noreferrer");
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-blue-600 shadow-lg shadow-gray-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Watch Lesson
                          </button>
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
