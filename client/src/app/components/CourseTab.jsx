"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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
  FaStar,
  FaClock,
  FaGraduationCap,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShoppingCart,
} from "react-icons/fa";
import StarRating from "./StarRating";
import { toast } from "react-hot-toast";

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
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  // Fetch student courses from database
  const fetchStudentCourses = async () => {
    try {
      // Don't set loading to true initially to prevent blinking
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

          if (
            purchasedCoursesResponse.data &&
            purchasedCoursesResponse.data.courses
          ) {
            purchasedCoursesData = purchasedCoursesResponse.data.courses;
            setPurchasedCourses(purchasedCoursesData);
          }
        }

        // Fetch all available courses
        const allCoursesResponse = await axios.get(`${API}/api/courses/all`);
        if (allCoursesResponse.data) {
          const allCoursesData = allCoursesResponse.data;
          setAvailableCourses(allCoursesData);

          // Filter out purchased courses from available courses
          const purchasedCourseIds = student.course || [];
          const filteredAvailableCourses = allCoursesData.filter(
            (course) => !purchasedCourseIds.includes(course._id)
          );

          // Combine purchased courses and available courses
          const combinedCourses = [
            ...purchasedCoursesData,
            ...filteredAvailableCourses,
          ];
          setCourses(combinedCourses);

          if (combinedCourses.length > 0) {
            setSelectedCourse(combinedCourses[0]);
            setLastAccessedCourse(combinedCourses[0]);
          }
        } else {
          // If no courses at all, just set purchased courses
          setCourses(purchasedCoursesData);
          if (purchasedCoursesData.length > 0) {
            setSelectedCourse(purchasedCoursesData[0]);
            setLastAccessedCourse(purchasedCoursesData[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      // Fallback to demo data if API fails
      showDemoData();
    }
    // Remove finally block to prevent loading state changes
  };

  // Mock data for demonstration (fallback)
  const showDemoData = () => {
    const demoCourses = [
      {
        _id: "1",
        title: "Basic Accounting & Tally Foundation",
        description:
          "Comprehensive accounting course covering all aspects of modern accounting practices.",
        image: "/images/a1.jpeg",
        status: "Active",
        level: "Foundation",
        price: 999,
        overallProgress: 75,
        totalChapters: 8,
        totalAssignments: 12,
        totalExperiments: 6,
        totalTests: 5,
        chapters: [
          { id: 1, name: "Basic Accounting", completion: 100 },
          { id: 2, name: "Company Creation", completion: 100 },
          { id: 3, name: "Voucher Entries", completion: 100 },
          { id: 4, name: "Accounting Methods", completion: 60 },
          { id: 5, name: "Ledger Balances", completion: 45 },
          { id: 6, name: "Bank Reconciliation", completion: 30 },
          { id: 7, name: "Advanced Topics", completion: 20 },
          { id: 8, name: "Final Assessment", completion: 10 },
        ],
        assignments: [
          { id: 1, name: "Assignment 1: Basic Principles" },
          { id: 2, name: "Assignment 2: Company Setup" },
          { id: 3, name: "Assignment 3: Voucher Entries" },
          { id: 4, name: "Assignment 4: Ledger Management" },
          { id: 5, name: "Assignment 5: Final Project" },
        ],
        experiments: [
          { id: 1, name: "Experiment 1: Ledger Creation" },
          { id: 2, name: "Experiment 2: Balance Sheet" },
          { id: 3, name: "Experiment 3: Income Statement" },
          { id: 4, name: "Experiment 4: Cash Flow" },
        ],
        tests: [
          {
            id: 1,
            name: "Basic Accounting Test",
            status: "Coming Soon",
          },
          {
            id: 2,
            name: "Voucher Entries Test",
            status: "Coming Soon",
          },
          {
            id: 3,
            name: "Ledger Management Test",
            status: "Coming Soon",
          },
          {
            id: 4,
            name: "Final Assessment Test",
            status: "Coming Soon",
          },
          {
            id: 5,
            name: "Comprehensive Test",
            status: "Coming Soon",
          },
        ],
      },
    ];
    setCourses(demoCourses);
    setPurchasedCourses(demoCourses); // Demo data represents purchased courses
    setAvailableCourses([]); // No additional available courses in demo
    setSelectedCourse(demoCourses[0]);
    setLastAccessedCourse(demoCourses[0]);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudentCourses();
  }, []);

  // Helper function to check if a course is purchased

  const isCoursePurchased = (courseId) => {
    return purchasedCourses.some((course) => course._id === courseId);
  };

  // Handle Buy Now functionality
  const handleBuyNow = (course) => {
    // For now, we'll redirect to the course detail page where student can purchase
    // You can modify this to redirect to a payment page or show a purchase modal
    router.push(`/course/${course.slug || course._id}`);
  };

  // Check if course is completed (simplified logic - you can enhance this)
  const isCourseCompleted = (course) => {
    // For demo purposes, consider course completed if progress > 80%
    // In real implementation, you'd check if all chapters, assignments, and tests are completed
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

  const handleChapterClick = (chapterName) => {
    // Navigate to digital-hub when any chapter is clicked
    if (!selectedCourse) return;
    router.push(buildDigitalHubPath(selectedCourse));
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
      const response = await axios.get(
        `${API}/api/chapters/course/${courseId}`
      );
      if (response.data.success) {
        setCourseChapters((prev) => ({
          ...prev,
          [courseId]: response.data.chapters,
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

    setViewModes((prev) => ({ ...prev, [courseId]: "detailed" }));

    // Fetch chapters if cache data available
    if (!courseChapters[courseId]) {
      fetchChaptersForCourse(courseId);
    }
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
                  className="bg-gradient-to-r from-gray-100 to-gray-150 border border-gray-300 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() =>
                    handleChapterClick(chapter.title || chapter.name)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-blue-600 text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {chapter.title || chapter.name}
                        </p>
                        {chapter.description && (
                          <p className="text-sm text-gray-600">
                            {chapter.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            chapter.completion === 100
                              ? "bg-green-500"
                              : chapter.completion >= 70
                              ? "bg-blue-500"
                              : chapter.completion >= 40
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent mb-2">
            My Courses
          </h1>
          <p className="text-gray-600 text-lg">
            Continue your learning journey
          </p>
        </div>
      </div>

      {/* Course Display with State Switching */}
      <div className="px-6 pb-6 space-y-6">
        {courses.map((course) => (
          <div key={course._id} className="group relative">
            {viewModes[course._id] !== "detailed" ? (
              // State 1: Modern Course Overview Card
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                {/* Course Header with Gradient */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-2 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                  <div className="relative z-10">
                    <h2 className="text-lg font-bold mb-2">{course.title}</h2>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                <div className="p-3">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {/* Left Side - Course Image with Modern Styling */}
                    <div className="lg:col-span-1">
                      <div className="relative group">
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                          <img
                            src={
                              course.image
                                ? `${API}${course.image}`
                                : "/images/a1.jpeg"
                            }
                            alt={course.title}
                            className="w-full h-32 object-cover transform transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.target.src = "/images/a1.jpeg";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Course Stats with Modern Cards */}
                    <div className="lg:col-span-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        {/* Status Card */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <FaCheckCircle className="text-emerald-600 text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Status
                              </p>
                              <p className="text-sm font-bold text-emerald-700">
                                {course.status}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Level Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaGraduationCap className="text-blue-600 text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Level
                              </p>
                              <p className="text-sm font-bold text-blue-700">
                                {course.level}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Price Card */}
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <FaStar className="text-purple-600 text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Price
                              </p>
                              <p className="text-sm font-bold text-purple-700">
                                ₹{course.price}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Duration Card */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <FaClock className="text-orange-600 text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Duration
                              </p>
                              <p className="text-sm font-bold text-orange-700">
                                8 Weeks
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 pb-2">
                        {/* Show different button based on purchase status */}
                        {isCoursePurchased(course._id) ? (
                          // Purchased course - show "View Course Details"
                          <button
                            onClick={() => handleDetailedToggle(course._id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Book className="text-xl" />
                              View Course Details
                            </span>
                          </button>
                        ) : (
                          // Available course - show "Buy Now"
                          <button
                            onClick={() => handleBuyNow(course)}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-700 hover:to-emerald-700"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <FaShoppingCart className="text-xl" />
                              Buy Now
                            </span>
                          </button>
                        )}

                        {/* Rating Button - Show only for purchased courses that are completed and not already rated */}
                        {isCoursePurchased(course._id) &&
                          isCourseCompleted(course) &&
                          !courseRatings[course._id] && (
                            <button
                              onClick={() => {
                                setCourseToRate(course);
                                setShowRatingModal(true);
                              }}
                              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:from-yellow-600 hover:to-orange-600"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <FaStar className="text-xl" />
                                Rate Course
                              </span>
                            </button>
                          )}

                        {/* Show rating status if already rated */}
                        {courseRatings[course._id] && (
                          <div className="flex items-center justify-center px-6 py-4 bg-gray-100 rounded-xl">
                            <span className="text-gray-600 font-medium">
                              {courseRatings[course._id].status === "pending"
                                ? "Rating Pending"
                                : courseRatings[course._id].status ===
                                  "approved"
                                ? "Rating Approved"
                                : "Rating Rejected"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // State 2: Course Detailed View with Modern Design
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Course Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {course.title}
                      </h2>
                      <p className="text-indigo-100 text-sm opacity-90">
                        Explore chapters, assignments, and assessments
                      </p>
                    </div>
                    {/* Small Back Arrow Icon */}
                    <button
                      onClick={() =>
                        setViewModes((prev) => ({
                          ...prev,
                          [course._id]: "overview",
                        }))
                      }
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-3 rounded-full transition-all duration-300 hover:scale-110 border border-white/30"
                    >
                      <ArrowBack className="text-white text-xl" />
                    </button>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                <div className="p-6">
                  {/* Full Width Content Area - No Image */}
                  <div className="w-full">
                    {/* Modern Tab Navigation - Full Width */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-xl mb-6 border border-gray-200">
                      <div className="flex gap-3 justify-center">
                        {[
                          "chapters",
                          "assignments",
                          "experiments",
                          "tests",
                        ].map((tab) => (
                          <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all duration-300 min-w-[120px] justify-center border-2 font-semibold text-lg ${
                              activeTab === tab
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg text-white border-transparent transform scale-105"
                                : "bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-200 hover:border-gray-300 hover:shadow-md"
                            }`}
                          >
                            {getTabIcon(tab)}
                            <span className="font-semibold">
                              {getTabLabel(tab)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tab Content with Modern Styling - Full Width */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 h-[500px] overflow-y-auto border border-gray-200 shadow-inner">
                      {activeTab === "chapters" ? (
                        <div className="space-y-4">
                          {courseChapters[course._id] &&
                          courseChapters[course._id].length > 0 ? (
                            courseChapters[course._id].map((chapter, index) => (
                              <div
                                key={chapter._id || index}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:border-blue-300"
                                onClick={() =>
                                  router.push(
                                    buildDigitalHubPath(course, chapter._id)
                                  )
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                      <span className="font-bold text-white text-lg">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-bold text-gray-800 text-xl mb-2">
                                        {chapter.title || chapter.name}
                                      </p>
                                      {chapter.description && (
                                        <p className="text-gray-600 text-base leading-relaxed">
                                          {chapter.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="w-32 bg-gray-200 rounded-full h-4">
                                      <div
                                        className={`h-4 rounded-full transition-all duration-500 ${
                                          chapter.completion === 100
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                            : chapter.completion >= 70
                                            ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                            : chapter.completion >= 40
                                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                            : "bg-gradient-to-r from-gray-400 to-gray-500"
                                        }`}
                                        style={{
                                          width: `${chapter.completion || 0}%`,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                                        (chapter.completion || 0) === 100
                                          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
                                          : "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800"
                                      }`}
                                    >
                                      {chapter.completion || 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12 text-gray-500">
                              <Book className="mx-auto mb-4 text-6xl text-gray-300" />
                              <p className="text-lg font-medium">
                                No chapters available for this course.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        renderContentList()
                      )}
                    </div>

                    {/* Back Button with Modern Styling */}
                    <button
                      onClick={() =>
                        setViewModes((prev) => ({
                          ...prev,
                          [course._id]: "overview",
                        }))
                      }
                      className="w-full mt-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:from-gray-700 hover:to-gray-800 flex items-center justify-center gap-3"
                    >
                      <ArrowBack />
                      Back to Course Overview
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
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
