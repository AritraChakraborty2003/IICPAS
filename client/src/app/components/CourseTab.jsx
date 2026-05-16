"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlayArrow,
  Visibility,
  Edit,
  Book,
  Assignment,
  Science,
  QuestionAnswer,
  ExpandMore,
  ExpandLess,
  Add,
  Save,
  Close,
  ArrowBack,
} from "@mui/icons-material";
import {
  FaShoppingCart,
  FaStar,
} from "react-icons/fa";
import { Lock } from "lucide-react";
import StarRating from "./StarRating";
import TopicLessonsDisplay from "./TopicLessonsDisplay";
import { toast } from "react-hot-toast";

const extractCourseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractCourseRecord = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (payload.course && typeof payload.course === "object") return payload.course;
  if (payload.data?.course && typeof payload.data.course === "object") {
    return payload.data.course;
  }
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload;
};

const getChapterIdentifier = (chapter, fallbackIndex) =>
  String(
    chapter?._id ??
      chapter?.chapterId ??
      chapter?.id ??
      (Number.isInteger(fallbackIndex) ? fallbackIndex : "")
  );

const parseDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const mergeChaptersWithProgress = (chapters, progressPayload) => {
  const orderedChapters = Array.isArray(chapters) ? [...chapters] : [];
  const progressMap = new Map(
    Array.isArray(progressPayload?.chapters)
      ? progressPayload.chapters.map((chapter) => [
          String(chapter.chapterId),
          chapter,
        ])
      : []
  );

  return orderedChapters.map((chapter, index) => {
    const progressEntry = progressMap.get(String(chapter?._id)) || {};

    return {
      ...chapter,
      isLocked: false,
      isCompleted: Boolean(progressEntry.isCompleted),
      completedTopicCount: Number(progressEntry.completedTopicCount || 0),
      totalTopicCount:
        typeof progressEntry.totalTopicCount === "number"
          ? progressEntry.totalTopicCount
          : Array.isArray(chapter?.topics)
          ? chapter.topics.length
          : 0,
      completedAssignmentCount: Number(
        progressEntry.completedAssignmentCount || 0
      ),
      totalAssignmentCount: Number(progressEntry.totalAssignmentCount || 0),
      completedQuestionSetCount: Number(
        progressEntry.completedQuestionSetCount || 0
      ),
      totalQuestionSetCount: Number(progressEntry.totalQuestionSetCount || 0),
      completion:
        typeof progressEntry.completionPercent === "number"
          ? progressEntry.completionPercent
          : Number(chapter?.completion || 0),
    };
  });
};

export default function CourseTab() {
  const [studentId, setStudentId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [purchasedCourses, setPurchasedCourses] = useState([]); // Student's purchased courses
  const [availableCourses, setAvailableCourses] = useState([]); // All available courses
  const [loading, setLoading] = useState(false); // Initialize as false to prevent initial blinking
  const [lastAccessedCourse, setLastAccessedCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("chapters");
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("");
  const [formData, setFormData] = useState({});
  const [viewModes, setViewModes] = useState({}); // Track view mode for each course
  const [courseChapters, setCourseChapters] = useState({}); // Store chapters for each course
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [courseToRate, setCourseToRate] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [courseRatings, setCourseRatings] = useState({}); // Store existing ratings
  const [expandedChapterKeys, setExpandedChapterKeys] = useState({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const purchasedCourseAccessMap = useMemo(() => {
    const map = new Map();
    purchasedCourses.forEach((course) => {
      if (course?._id) {
        map.set(String(course._id), course);
      }
    });
    return map;
  }, [purchasedCourses]);

  // Fetch student courses from database
  const fetchStudentCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/v1/students/isstudent`, {
        withCredentials: true,
      });

      if (response.data && response.data.student) {
        const student = response.data.student;
        setStudentId(student._id);

        // Fetch purchased courses
        let purchasedCoursesData = [];
        if (student.course && student.course.length > 0) {
          const purchasedCoursesResponse = await axios.get(
            `${API}/api/courses/student-courses/${student._id}`,
            {
              withCredentials: true,
            }
          );

          const normalizedPurchasedCourses = extractCourseList(
            purchasedCoursesResponse.data
          );

          if (normalizedPurchasedCourses.length > 0) {
            purchasedCoursesData = normalizedPurchasedCourses;
            setPurchasedCourses(purchasedCoursesData);
          }
        }

        // Fetch all available courses
        const allCoursesResponse = await axios.get(`${API}/api/courses/all`);
        const allCoursesData = extractCourseList(allCoursesResponse.data);

        if (allCoursesData.length > 0) {
          setAvailableCourses(allCoursesData);

          setPurchasedCourses(purchasedCoursesData);
          setCourses(purchasedCoursesData);

          if (purchasedCoursesData.length > 0) {
            setSelectedCourse(purchasedCoursesData[0]);
            setLastAccessedCourse(purchasedCoursesData[0]);
          } else {
            setCourses([]);
            setSelectedCourse(null);
            setLastAccessedCourse(null);
          }
        } else {
          // If no courses at all, just set purchased courses
          setAvailableCourses([]);
          setCourses(purchasedCoursesData);
          if (purchasedCoursesData.length > 0) {
            setSelectedCourse(purchasedCoursesData[0]);
            setLastAccessedCourse(purchasedCoursesData[0]);
          } else {
            setSelectedCourse(null);
            setLastAccessedCourse(null);
          }
        }
      } else {
        setCourses([]);
        setPurchasedCourses([]);
        setAvailableCourses([]);
        setSelectedCourse(null);
        setLastAccessedCourse(null);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error.message ||
          "Failed to fetch courses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentCourses();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    const requestedCourseId = searchParams.get("courseId");
    const requestedView = searchParams.get("view");

    if (requestedTab !== "courses" || !requestedCourseId || courses.length === 0) {
      return;
    }

    const matchedCourse = courses.find((course) => course._id === requestedCourseId);
    if (!matchedCourse) {
      return;
    }

    setSelectedCourse(matchedCourse);
    setLastAccessedCourse(matchedCourse);

    if (
      requestedView === "detailed" &&
      isCoursePurchased(matchedCourse._id) &&
      !isCourseLocked(matchedCourse._id)
    ) {
      setViewModes((prev) => ({ ...prev, [matchedCourse._id]: "detailed" }));
      if (!courseChapters[matchedCourse._id]) {
        fetchChaptersForCourse(matchedCourse._id);
      }
    }
  }, [searchParams, courses, courseChapters]);

  // Helper function to check if a course is purchased

  const isCoursePurchased = (courseId) => {
    return purchasedCourses.some(
      (course) => String(course._id) === String(courseId)
    );
  };

  const getCourseAccessWindow = (courseId) => {
    const access = purchasedCourseAccessMap.get(String(courseId)) || null;
    const accessState = String(access?.batchAccessState || "").toLowerCase();
    const batchLockStartsAt = parseDateOrNull(access?.batchLockStartsAt);
    const batchLockEndsAt = parseDateOrNull(access?.batchLockEndsAt);
    const hasBatchWindow = Boolean(batchLockStartsAt && batchLockEndsAt);
    const isWithinBatchWindow =
      accessState === "active" ||
      (typeof access?.batchWindowActive === "boolean"
        ? access.batchWindowActive
        : hasBatchWindow
        ? Date.now() >= batchLockStartsAt.getTime() &&
          Date.now() <= batchLockEndsAt.getTime()
        : true);
    const isPreviewOnly =
      accessState === "preview" ||
      (typeof access?.batchPreviewOnly === "boolean"
        ? access.batchPreviewOnly
        : hasBatchWindow && !isWithinBatchWindow);

    return {
      access,
      hasBatchWindow,
      isWithinBatchWindow,
      isPreviewOnly,
      isHardLocked:
        !hasBatchWindow ||
        String(access?.status || "").toLowerCase() === "inactive",
    };
  };

  const isCourseLocked = (courseId) => getCourseAccessWindow(courseId).isHardLocked;

  // Handle Buy Now functionality
  const handleBuyNow = (course) => {
    // For now, we'll redirect to the course detail page where student can purchase
    // You can modify this to redirect to a payment page or show a purchase modal
    router.push(`/course/${course.slug || course._id}`);
  };

  // Check if course is completed (simplified logic - you can enhance this)
  const isCourseCompleted = (course) => {
    // Consider course completed if progress > 80%.
    return course.overallProgress >= 80;
  };

  // Check if student has already rated this course
  const hasStudentRated = async (courseId) => {
    try {
      const response = await axios.get(
        `${API}/api/v1/course-ratings/student/${studentId}`
      );
      if (response.data.success) {
        const existingRating = response.data.data.find(
          (rating) => rating.courseId._id === courseId
        );
        return existingRating;
      }
    } catch (error) {
      console.error("Error checking existing rating:", error);
    }
    return null;
  };

  // Handle course completion and rating prompt
  const handleCourseCompletion = async (course) => {
    if (isCourseCompleted(course)) {
      const existingRating = await hasStudentRated(course._id);
      if (!existingRating) {
        setCourseToRate(course);
        setShowRatingModal(true);
      }
    }
  };

  // Submit rating
  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await axios.post(`${API}/api/v1/course-ratings/submit`, {
        studentId: studentId,
        courseId: courseToRate._id,
        rating: rating,
        review: review,
      });

      if (response.data.success) {
        toast.success(
          "Rating submitted successfully! It will be reviewed by admin."
        );
        setShowRatingModal(false);
        setRating(0);
        setReview("");
        setCourseToRate(null);

        // Update local state
        setCourseRatings((prev) => ({
          ...prev,
          [courseToRate._id]: { rating, review, status: "pending" },
        }));
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFaqToggle = (faqId) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [faqId]: !prev[faqId],
    }));
  };

  const buildDigitalHubPath = (course, chapterId) => {
    if (!course?._id && !course?.slug) return "/digital-hub";
    const identifier = encodeURIComponent(course?.slug || course?._id);
    const basePath = `/digital-hub/${identifier}`;
    if (!chapterId) return basePath;
    return `${basePath}/${encodeURIComponent(chapterId)}`;
  };

  const toggleDetailedChapter = (courseId, chapterId) => {
    const key = `${courseId}-${chapterId}`;
    setExpandedChapterKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getTopicSubtopics = (topic) => {
    if (!topic) return [];
    if (Array.isArray(topic.subtopics)) return topic.subtopics;
    if (Array.isArray(topic.points)) return topic.points;
    if (Array.isArray(topic.items)) return topic.items;
    return [];
  };

  const handleAddNew = (type) => {
    setFormType(type);
    setFormData({});
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Here you would submit the form data to your backend
      console.log("Submitting form data:", { type: formType, data: formData });

      // For now, just close the form
      setShowForm(false);
      setFormData({});

      // You could add a success message here
      alert(`${formType} added successfully!`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please try again.");
    }
  };

  // Fetch chapters for a course
  const fetchChaptersForCourse = async (courseId) => {
    try {
      const [response, progressResponse] = await Promise.all([
        axios.get(`${API}/api/chapters/course/${courseId}`),
        studentId
          ? axios
              .get(
                `${API}/api/v1/students/${studentId}/digital-hub-progress/${courseId}`,
                { withCredentials: true }
              )
              .catch(() => null)
          : Promise.resolve(null),
      ]);
      if (response.data.success) {
        const mergedChapters = mergeChaptersWithProgress(
          response.data.chapters,
          progressResponse?.data
        );
        setCourseChapters((prev) => ({
          ...prev,
          [courseId]: mergedChapters,
        }));
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };

  // Handle detailed view toggle
  const handleDetailedToggle = (courseId) => {
    // Check if course is purchased before allowing detailed view
    if (!isCoursePurchased(courseId)) {
      // If not purchased, redirect to buy page instead
      const course = courses.find((c) => c._id === courseId);
      if (course) {
        handleBuyNow(course);
      }
      return;
    }

    if (isCourseLocked(courseId)) {
      toast.error("This course is locked by the admin.");
      return;
    }

    setViewModes((prev) => ({ ...prev, [courseId]: "detailed" }));
    const selected = courses.find((course) => course._id === courseId);
    if (selected) {
      setSelectedCourse(selected);
      setLastAccessedCourse(selected);
    }

    // Fetch chapters if cache data available
    if (!courseChapters[courseId]) {
      fetchChaptersForCourse(courseId);
    }
  };

  const getCourseImageSrc = (course) => {
    if (!course?.image) return "/images/a1.jpeg";
    if (course.image.startsWith("http")) return course.image;
    if (course.image.startsWith("/uploads/")) return `${API}${course.image}`;
    if (course.image.startsWith("/")) return course.image;
    return `${API}/${course.image}`;
  };

  const getCourseCategory = (course) => course?.category || "General";

  const getCourseCount = (course, itemsKey, totalKey) => {
    if (Array.isArray(course?.[itemsKey])) {
      return course[itemsKey].length;
    }

    const count = Number(course?.[totalKey] || 0);
    return Number.isFinite(count) ? count : 0;
  };

  const getProgressValue = (course) => {
    const progress = Number(course?.overallProgress || 0);
    if (!Number.isFinite(progress)) return 0;
    return Math.max(0, Math.min(progress, 100));
  };

  const getCourseDescription = (course, isPurchased) => {
    const rawDescription = course?.description;
    const cleanedDescription = rawDescription
      ? String(rawDescription).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : "";

    if (cleanedDescription) return cleanedDescription;

    return isPurchased
      ? "Resume your enrolled course and keep track of chapters, tests, and assignments from one place."
      : "Review the course structure, pricing, and highlights before you enroll.";
  };

  const getTabIcon = (tabName) => {
    switch (tabName) {
      case "chapters":
        return <Book />;
      case "assignments":
        return <Assignment />;
      case "experiments":
        return <Science />;
      case "tests":
        return <QuestionAnswer />;
      default:
        return <Book />;
    }
  };

  const getTabLabel = (tabName) => {
    switch (tabName) {
      case "chapters":
        return "Chapter";
      case "assignments":
        return "Assign";
      case "experiments":
        return "Exp";
      case "tests":
        return "Conf";
      default:
        return "Chapter";
    }
  };

  const handleOpenChapter = (course, chapter, chapterIndex) => {
    if (!chapter) return;

    router.push(buildDigitalHubPath(course, getChapterIdentifier(chapter, chapterIndex)));
  };

  const renderForm = () => {
    if (!showForm) return null;

    const formFields = {
      test: [
        { name: "title", label: "Test Title", type: "text", required: true },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          required: true,
        },
        {
          name: "duration",
          label: "Duration (minutes)",
          type: "number",
          required: true,
        },
        {
          name: "totalQuestions",
          label: "Total Questions",
          type: "number",
          required: true,
        },
      ],
      database: [
        {
          name: "title",
          label: "Database Title",
          type: "text",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          required: true,
        },
        {
          name: "type",
          label: "Database Type",
          type: "select",
          options: ["MySQL", "PostgreSQL", "MongoDB", "SQLite"],
          required: true,
        },
        {
          name: "difficulty",
          label: "Difficulty Level",
          type: "select",
          options: ["Beginner", "Intermediate", "Advanced"],
          required: true,
        },
      ],
      assignment: [
        {
          name: "title",
          label: "Assignment Title",
          type: "text",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          required: true,
        },
        { name: "dueDate", label: "Due Date", type: "date", required: true },
        {
          name: "maxScore",
          label: "Maximum Score",
          type: "number",
          required: true,
        },
      ],
    };

    const fields = formFields[formType] || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Add New {formType.charAt(0).toUpperCase() + formType.slice(1)}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Close />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value })
                    }
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                ) : field.type === "select" ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value })
                    }
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value })
                    }
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="inline mr-2" />
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderContentList = () => {
    if (!selectedCourse) return null;

    switch (activeTab) {
      case "chapters":
        return (
          <div className="space-y-3">
            {selectedCourse.chapters && selectedCourse.chapters.length > 0 ? (
              selectedCourse.chapters.map((chapter, index) => (
                <div
                  key={chapter._id || index}
                  className="bg-gradient-to-r from-gray-100 to-gray-150 border border-gray-300 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-blue-600 text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          toggleDetailedChapter(
                            selectedCourse._id,
                            chapter._id || index
                          )
                        }
                        className="text-left"
                      >
                        <p className="font-semibold text-gray-800">
                          {chapter.title || chapter.name}
                        </p>
                        {chapter.description && (
                          <p className="text-sm text-gray-600">
                            {chapter.description}
                          </p>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (chapter.completion || 0) === 100
                              ? "bg-green-500"
                              : (chapter.completion || 0) >= 70
                              ? "bg-blue-500"
                              : (chapter.completion || 0) >= 40
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          }`}
                          style={{ width: `${chapter.completion || 0}%` }}
                        />
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          (chapter.completion || 0) === 100
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {chapter.completion || 0}%
                      </span>
                    </div>
                  </div>
                  {expandedChapterKeys[
                    `${selectedCourse._id}-${chapter._id || index}`
                  ] ? (
                    <div className="mt-3 rounded-md border border-gray-200 bg-white p-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenChapter(selectedCourse, chapter, index)
                        }
                        className="mb-3 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Open in Digital Hub
                      </button>
                      {Array.isArray(chapter.topics) && chapter.topics.length > 0 ? (
                        <ul className="space-y-2">
                          {chapter.topics.map((topic, topicIndex) => {
                            const subtopics = getTopicSubtopics(topic);
                            return (
                              <li
                                key={topic?._id || `${chapter._id}-topic-${topicIndex}`}
                                className="rounded border border-gray-100 bg-gray-50 p-2"
                              >
                                <p className="text-sm font-semibold text-gray-800">
                                  {topic?.title || `Topic ${topicIndex + 1}`}
                                </p>
                                {subtopics.length ? (
                                  <ul className="mt-1 list-disc pl-5 text-xs text-gray-600">
                                    {subtopics.map((subtopic, subtopicIndex) => (
                                      <li key={`sub-${subtopicIndex}`}>
                                        {typeof subtopic === "string"
                                          ? subtopic
                                          : subtopic?.title ||
                                            subtopic?.name ||
                                            `Subtopic ${subtopicIndex + 1}`}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-gray-500 mt-1">
                                    No subtopics
                                  </p>
                                )}
                                <TopicLessonsDisplay
                                  topic={topic}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No topics available for this chapter.
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          Topics {chapter.completedTopicCount || 0}/
                          {chapter.totalTopicCount || 0}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          Assignments {chapter.completedAssignmentCount || 0}/
                          {chapter.totalAssignmentCount || 0}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          Question sets {chapter.completedQuestionSetCount || 0}/
                          {chapter.totalQuestionSetCount || 0}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Book className="mx-auto mb-4 text-4xl text-gray-300" />
                <p>Loading chapters...</p>
              </div>
            )}
          </div>
        );
      case "assignments":
        return (
          <div className="space-y-3">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Course Assignments</h3>
            </div>

            {selectedCourse.assignments &&
            selectedCourse.assignments.length > 0 ? (
              selectedCourse.assignments.map((assignment, index) => (
                <div
                  key={assignment._id || index}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Assignment className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {assignment.title || assignment.name}
                      </p>
                      {assignment.description && (
                        <p className="text-sm text-gray-600">
                          {assignment.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Assignment {index + 1}
                      </p>
                    </div>
                    <button className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Assignment className="mx-auto mb-4 text-4xl text-gray-300" />
                <p>No assignments available for this course.</p>
              </div>
            )}
          </div>
        );
      case "experiments":
        return (
          <div className="space-y-3">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Course Experiments</h3>
            </div>

            {selectedCourse.experiments &&
            selectedCourse.experiments.length > 0 ? (
              selectedCourse.experiments.map((experiment, index) => (
                <div
                  key={experiment._id || index}
                  className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Science className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {experiment.title || experiment.name}
                      </p>
                      {experiment.description && (
                        <p className="text-sm text-gray-600">
                          {experiment.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Experiment {index + 1}
                      </p>
                    </div>
                    <button className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors">
                      Start
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Science className="mx-auto mb-4 text-4xl text-gray-300" />
                <p>No experiments available for this course.</p>
              </div>
            )}
          </div>
        );
      case "tests":
        return (
          <div className="space-y-3">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Course Tests</h3>
            </div>

            {selectedCourse.tests && selectedCourse.tests.length > 0 ? (
              selectedCourse.tests.map((test, index) => (
                <div
                  key={test._id || index}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <QuestionAnswer className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {test.title || test.name}
                      </p>
                      {test.description && (
                        <p className="text-sm text-gray-600">
                          {test.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">Test {index + 1}</p>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {test.status || "Coming Soon"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <QuestionAnswer className="mx-auto mb-4 text-4xl text-gray-300" />
                <p>No tests available for this course.</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading your courses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              Digital Hub
            </span>
            <h1 className="mt-3 text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              My Courses
            </h1>
            <p className="mt-2 text-base text-gray-600 sm:text-lg">
              Continue your learning journey with a cleaner course overview.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-1 xl:min-w-[190px]">
            <div className="rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Enrolled
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {purchasedCourses.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/course")}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
            >
              View All Courses
            </button>
          </div>
        </div>
      </div>

      {/* Course Display with State Switching */}
      <div className="px-6 pb-6 space-y-6">
        {courses.length === 0 ? (
          <div className="rounded-[28px] border border-blue-100 bg-white px-6 py-12 text-center shadow-[0_18px_48px_-28px_rgba(15,23,42,0.25)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Lock className="text-2xl" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Purchase a course to view your dashboard
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              New student accounts do not show sample course content. Once you
              purchase or enroll in a course, it will appear here with chapters,
              progress, and learning tools.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/course")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <FaShoppingCart className="text-base" />
                View Courses
              </button>
              <button
                type="button"
                onClick={() => router.push("/course")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Browse Catalog
              </button>
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {availableCourses.length > 0
                ? `${availableCourses.length} courses available`
                : "No purchased courses yet"}
            </p>
          </div>
        ) : (
          courses.map((course) => {
            const isPurchased = isCoursePurchased(course._id);
            const chaptersCount = getCourseCount(course, "chapters", "totalChapters");
            const assignmentsCount = getCourseCount(
              course,
              "assignments",
              "totalAssignments"
            );
            const testsCount = getCourseCount(course, "tests", "totalTests");
            const experimentsCount = getCourseCount(
              course,
              "experiments",
              "totalExperiments"
            );
            const progressValue = getProgressValue(course);
            const description = getCourseDescription(course, isPurchased);
            const courseAccessWindow = getCourseAccessWindow(course._id);
            const isHardLocked = courseAccessWindow.isHardLocked;
            const overviewStats = [
              {
                label: "Category",
                value: getCourseCategory(course),
              },
              {
                label: "Level",
                value: course?.level || "Professional course",
              },
              {
                label: "Content",
                value: `${chaptersCount} ${chaptersCount === 1 ? "chapter" : "chapters"}`,
              },
              {
                label: "Activities",
                value: `${assignmentsCount + testsCount + experimentsCount} items`,
              },
            ];
            return (
              <div key={course._id} className="group relative">
                {viewModes[course._id] !== "detailed" ? (
                  // State 1: Cleaner Course Overview Card
                  <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)]">
                    <div className="flex flex-col lg:flex-row">
                      <div className="relative overflow-hidden bg-white lg:w-[280px] lg:shrink-0">
                        <img
                          src={getCourseImageSrc(course)}
                          alt={course.title}
                          className="h-[230px] w-full object-contain transition-transform duration-500 group-hover:scale-105 lg:h-full"
                          onError={(e) => {
                            e.target.src = "/images/a1.jpeg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent" />

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                            {getCourseCategory(course)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                              isHardLocked
                                ? "bg-rose-500/95 text-white"
                                : isPurchased
                                ? "bg-emerald-500/95 text-white"
                                : "bg-slate-950/75 text-white"
                            }`}
                          >
                            {isHardLocked
                              ? "Locked"
                              : isPurchased
                              ? "Enrolled"
                              : "Available"}
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4">
                          <span className="rounded-full bg-slate-950/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                            {chaptersCount} {chaptersCount === 1 ? "chapter" : "chapters"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6 xl:flex-row">
                        <div className="min-w-0 flex flex-1 flex-col">
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {course?.level || "Professional course"}
                            </span>
                            {testsCount > 0 ? (
                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                {testsCount} {testsCount === 1 ? "test" : "tests"}
                              </span>
                            ) : null}
                            {experimentsCount > 0 ? (
                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                {experimentsCount}{" "}
                                {experimentsCount === 1 ? "experiment" : "experiments"}
                              </span>
                            ) : null}
                          </div>

                          <h2 className="max-w-4xl text-xl font-bold leading-snug text-slate-900 sm:text-[1.65rem]">
                            {course.title}
                          </h2>

                          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 line-clamp-2">
                            {description}
                          </p>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {overviewStats.map((stat) => (
                              <div
                                key={`${course._id}-${stat.label}`}
                                className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm"
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                  {stat.label}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                  {stat.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            {isPurchased ? (
                              <button
                                onClick={() => handleDetailedToggle(course._id)}
                                disabled={isHardLocked}
                                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition sm:w-auto sm:min-w-[210px] ${
                                  isHardLocked
                                    ? "cursor-not-allowed bg-slate-400"
                                    : "bg-slate-900 hover:bg-slate-800"
                                }`}
                                >
                                  {isHardLocked ? <Lock className="text-xl" /> : <Book className="text-xl" />}
                                  {isHardLocked ? "Locked" : "Open Course"}
                                </button>
                            ) : (
                              <button
                                onClick={() => handleBuyNow(course)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto sm:min-w-[210px]"
                              >
                                <FaShoppingCart className="text-lg" />
                                Enroll Now
                              </button>
                            )}

                            <button
                              onClick={() =>
                                router.push(`/course/${course.slug || course._id}`)
                              }
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto sm:min-w-[190px]"
                              >
                                <Visibility className="text-lg" />
                                View Details
                              </button>
                          </div>

                          {isPurchased && isHardLocked ? (
                            <div
                              className="mt-1 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                            >
                              <span className="h-2 w-2 rounded-full bg-current" />
                              Locked by admin
                            </div>
                          ) : null}

                          {isPurchased &&
                            isCourseCompleted(course) &&
                            !courseRatings[course._id] && (
                              <button
                                onClick={() => {
                                  setCourseToRate(course);
                                  setShowRatingModal(true);
                                }}
                                className="mt-3 w-full rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 sm:w-auto sm:self-start"
                              >
                                Rate Course
                              </button>
                            )}

                          {courseRatings[course._id] && (
                            <div className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 sm:w-auto sm:self-start">
                              <span>
                                {courseRatings[course._id].status === "pending"
                                  ? "Rating Pending"
                                  : courseRatings[course._id].status === "approved"
                                    ? "Rating Approved"
                                    : "Rating Rejected"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="xl:w-[240px] xl:shrink-0">
                          <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 px-5 py-4 text-white shadow-lg">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                              Course Progress
                            </p>
                            <p className="mt-3 text-3xl font-bold leading-none">
                              {progressValue}%
                            </p>
                            <p className="mt-2 text-sm leading-6 text-blue-50">
                              {isPurchased
                                ? progressValue > 0
                                  ? "Keep moving through your lessons, tests, and assignments."
                                  : "You are enrolled. Start the first chapter to begin progress."
                                : "Enroll to unlock your chapter-wise course progress."}
                            </p>

                            <div className="mt-5">
                              <div className="flex items-center justify-between text-xs font-medium text-blue-100">
                                <span>{isPurchased ? "Learning progress" : "Progress tracker"}</span>
                                <span>{progressValue}%</span>
                              </div>
                              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
                                <div
                                  className="h-full rounded-full bg-white"
                                  style={{ width: `${progressValue}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
              // State 2: Course Detailed View (Compact Professional)
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Course Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                        {course.title}
                      </h2>
                      <p className="text-xs text-slate-600">
                        Explore chapters, assignments, and assessments
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setViewModes((prev) => ({
                          ...prev,
                          [course._id]: "overview",
                        }))
                      }
                      className="h-9 w-9 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
                    >
                      <ArrowBack className="text-base" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {/* Full Width Content Area - No Image */}
                  <div className="w-full">
                    {/* Compact Tab Navigation */}
                    <div className="bg-slate-50 p-2 rounded-lg mb-4 border border-slate-200">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          "chapters",
                          "assignments",
                          "experiments",
                          "tests",
                        ].map((tab) => (
                          <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors min-w-[110px] justify-center border text-sm font-medium ${
                              activeTab === tab
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                            }`}
                          >
                            {getTabIcon(tab)}
                            <span>
                              {getTabLabel(tab)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-slate-50 rounded-lg p-4 h-[500px] overflow-y-auto border border-slate-200">
                      {activeTab === "chapters" ? (
                        <div className="space-y-3">
                          {courseChapters[course._id] &&
                          courseChapters[course._id].length > 0 ? (
                            courseChapters[course._id].map((chapter, index) => (
                              <div
                                key={chapter._id || index}
                                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
                                      <span className="font-semibold text-white text-sm">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleDetailedChapter(
                                          course._id,
                                          chapter._id || index
                                        )
                                      }
                                      className="text-left flex-1 min-w-0"
                                    >
                                      <p className="font-semibold text-slate-800 text-base mb-1 truncate">
                                        {chapter.title || chapter.name}
                                      </p>
                                      {chapter.description && (
                                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                          {chapter.description}
                                        </p>
                                      )}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-24 bg-slate-200 rounded-full h-2.5">
                                      <div
                                        className={`h-2.5 rounded-full transition-all duration-500 ${
                                          (chapter.completion || 0) === 100
                                            ? "bg-emerald-500"
                                            : (chapter.completion || 0) >= 70
                                            ? "bg-blue-500"
                                            : (chapter.completion || 0) >= 40
                                            ? "bg-amber-500"
                                            : "bg-slate-400"
                                        }`}
                                        style={{
                                          width: `${chapter.completion || 0}%`,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        (chapter.completion || 0) === 100
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {chapter.completion || 0}%
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenChapter(course, chapter, index)
                                      }
                                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                      Open in Digital Hub
                                    </button>
                                  </div>
                                </div>

                                {expandedChapterKeys[
                                  `${course._id}-${chapter._id || index}`
                                ] ? (
                                  <div className="mt-4 border-t border-slate-200 pt-3">
                                    <h4 className="text-sm font-semibold text-slate-800 mb-2">
                                      Topics
                                    </h4>
                                    {Array.isArray(chapter.topics) &&
                                    chapter.topics.length > 0 ? (
                                      <div className="space-y-2">
                                        {chapter.topics.map((topic, topicIndex) => {
                                          const subtopics = getTopicSubtopics(topic);
                                          return (
                                            <div
                                              key={topic?._id || `${chapter._id}-topic-${topicIndex}`}
                                              className="rounded-md border border-slate-200 bg-slate-50 p-2.5"
                                            >
                                              <p className="text-sm font-medium text-slate-800">
                                                {topic?.title || `Topic ${topicIndex + 1}`}
                                              </p>
                                              {topic?.content ? (
                                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                                  {String(topic.content).replace(/<[^>]*>/g, "")}
                                                </p>
                                              ) : null}
                                              <div className="mt-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                  Subtopics
                                                </p>
                                                {subtopics.length > 0 ? (
                                                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-700 space-y-1">
                                                    {subtopics.map((subtopic, subtopicIndex) => (
                                                      <li key={`subtopic-${subtopicIndex}`}>
                                                        {typeof subtopic === "string"
                                                          ? subtopic
                                                          : subtopic?.title || subtopic?.name || `Subtopic ${subtopicIndex + 1}`}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                ) : (
                                                  <p className="text-xs text-slate-500 mt-1">
                                                    No subtopics
                                                  </p>
                                                )}
                                                <TopicLessonsDisplay
                                                  topic={topic}
                                                />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-500">
                                        No topics available for this chapter.
                                      </p>
                                    )}
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                        Topics {chapter.completedTopicCount || 0}/
                                        {chapter.totalTopicCount || 0}
                                      </span>
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                        Assignments {chapter.completedAssignmentCount || 0}/
                                        {chapter.totalAssignmentCount || 0}
                                      </span>
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                        Question sets {chapter.completedQuestionSetCount || 0}/
                                        {chapter.totalQuestionSetCount || 0}
                                      </span>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-slate-500">
                              <Book className="mx-auto mb-3 text-5xl text-slate-300" />
                              <p className="text-base font-medium">
                                No chapters available for this course.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        renderContentList()
                      )}
                    </div>

                    {/* Back Button */}
                    <button
                      onClick={() =>
                        setViewModes((prev) => ({
                          ...prev,
                          [course._id]: "overview",
                        }))
                      }
                      className="w-full mt-4 bg-slate-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowBack className="text-base" />
                      Back to Course Overview
                    </button>
                  </div>
                </div>
              </div>
                )}
	              </div>
	            );
	          })
	        )}
      </div>

      {/* Form Modal */}
      {renderForm()}

      {/* Rating Modal */}
      {showRatingModal && courseToRate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Rate Course</h3>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setCourseToRate(null);
                  setRating(0);
                  setReview("");
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {courseToRate.title}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <StarRating
                    rating={rating}
                    onRatingChange={setRating}
                    interactive={true}
                    size="text-2xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review (Optional)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your experience with this course..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setCourseToRate(null);
                    setRating(0);
                    setReview("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating || rating === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingRating ? "Submitting..." : "Submit Rating"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
