/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Users,
  CheckCircle,
  Download,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import LoginModal from "../../components/LoginModal";
import jsPDF from "jspdf";
import CoursesSidebarMarquee from "@/components/CoursesSidebarMarquee";

import LiveSchedule from "../../components/LiveSchedule";
import { useCart } from "../../../hooks/useCart";

import axios from "axios";

interface Course {
  _id?: string;
  title?: string;
  description?: string;
  level?: string;
  rating?: number;
  reviewCount?: number;
  tabs?: {
    syllabus?: { label?: string };
    assignment?: { label?: string };
    assessment?: { label?: string };
    schedule?: { label?: string };
    simulator?: { label?: string };
  };
  pricing?: {
    recordedSession?: {
      finalPrice?: number;
      price?: number;
      discount?: number;
    };
    liveSession?: {
      finalPrice?: number;
      price?: number;
      discount?: number;
      priceMultiplier?: number;
    };
  };
  chapters?: Array<{
    title?: string;
    topics?: Array<{ title?: string } | string>;
  }>;
  syllabus?: Array<{
    title?: string;
    topics?: string[];
  }>;
  [key: string]: any;
}

export default function CourseDetailClient({
  courseId,
  initialCourse,
}: {
  courseId: string;
  initialCourse: Course;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("syllabus");
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [course] = useState<Course>(initialCourse);
  const [courseRatings, setCourseRatings] = useState<any>(null);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login"
  );
  const [pendingCartAction, setPendingCartAction] = useState<{
    courseId: string;
    sessionType: "recorded" | "live";
  } | null>(null);

  // Use the new cart hook
  const { cartCount, addToCart, loading: cartLoading } = useCart(student);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const notifyCartUpdateAndOpenDrawer = () => {
    window.dispatchEvent(
      new CustomEvent("cartUpdated", { detail: { openDrawer: true } })
    );
  };

  const openAuthModal = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setShowLoginModal(true);
  };

  const getSessionPrice = (sessionType: "recorded" | "live") => {
    if (sessionType === "recorded") {
      return (
        course?.pricing?.recordedSession?.finalPrice ||
        course?.pricing?.recordedSession?.price ||
        course.price ||
        2000
      );
    }

    return (
      course?.pricing?.liveSession?.finalPrice ||
      course?.pricing?.liveSession?.price ||
      (course.price ? course.price * (course?.pricing?.liveSession?.priceMultiplier || 1.5) : 3000)
    );
  };

  // Check student authentication
  useEffect(() => {
    const checkStudentAuth = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/students/isstudent`, {
          withCredentials: true,
        });
        setStudent(response.data.student);
      } catch {
        setStudent(null);
      }
    };
    checkStudentAuth();
  }, [API_BASE]);

  // Handle adding course to cart
  const handleAddToCart = async (
    courseId: string,
    sessionType: "recorded" | "live"
  ) => {
    console.log("handleAddToCart called with:", {
      courseId,
      sessionType,
      student: student?._id,
    });

    if (!student) {
      // Store the pending action and show login modal
      setPendingCartAction({ courseId, sessionType });
      openAuthModal("register");
      return;
    }

    try {
      const result = await addToCart(courseId, sessionType);
      console.log("Add to cart result:", result);

      notifyCartUpdateAndOpenDrawer();
    } catch (error: any) {
      console.error("Error adding to cart:", error);
    }
  };

  // Fetch course ratings from API
  useEffect(() => {
    const fetchCourseRatings = async () => {
      try {
        setRatingsLoading(true);
        const ratingCourseId = course?._id || courseId;
        const response = await axios.get(
          `${API_BASE}/v1/course-ratings/course/${ratingCourseId}`
        );
        if (response.data.success) {
          setCourseRatings(response.data);
        } else {
          // Set fallback ratings
          setCourseRatings({
            averageRating: course?.rating || 4.7,
            totalRatings: course?.reviewCount || 449,
            data: [],
          });
        }
      } catch {
        // Set default ratings if API fails
        setCourseRatings({
          averageRating: course?.rating || 4.7,
          totalRatings: course?.reviewCount || 449,
          data: [],
        });
      } finally {
        setRatingsLoading(false);
      }
    };

    // Only fetch ratings after course data is loaded
    if (course && course._id) {
      fetchCourseRatings();
    }
  }, [course, API_BASE, courseId]);

  const toggleSection = (index: number) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const generateSyllabusPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Add title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Course Syllabus", 20, yPosition);
    yPosition += 15;

    // Add course title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(course.title || "Course Details", 20, yPosition);
    yPosition += 20;

    // Add course description
    if (course.description) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      // Remove HTML tags from description
      const cleanDescription = course.description.replace(/<[^>]*>/g, "");
      const descriptionLines = doc.splitTextToSize(cleanDescription, 170);
      doc.text(descriptionLines, 20, yPosition);
      yPosition += descriptionLines.length * 6 + 10;
    }

    // Add course details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Course Information:", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Duration: ${course.duration || "N/A"}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Level: ${course.level || "N/A"}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Price: Rs. ${course.price || "N/A"}`, 20, yPosition);
    yPosition += 15;

    // Add syllabus content
    if (course.chapters && course.chapters.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Syllabus:", 20, yPosition);
      yPosition += 10;

      course.chapters.forEach((chapter: any, index: number) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Chapter title
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${chapter.title}`, 20, yPosition);
        yPosition += 8;

        // Chapter topics
        if (chapter.topics && chapter.topics.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          chapter.topics.forEach((topic: any) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`• ${topic.title || topic}`, 30, yPosition);
            yPosition += 5;
          });
        }
        yPosition += 5;
      });
    } else if (course.syllabus && course.syllabus.length > 0) {
      // Fallback to dummy syllabus data
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Syllabus:", 20, yPosition);
      yPosition += 10;

      course.syllabus.forEach((chapter: any, index: number) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Chapter title
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${chapter.title}`, 20, yPosition);
        yPosition += 8;

        // Chapter topics
        if (chapter.topics && chapter.topics.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          chapter.topics.forEach((topic: string) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`• ${topic}`, 30, yPosition);
            yPosition += 5;
          });
        }
        yPosition += 5;
      });
    }

    // Save the PDF
    const fileName = `${course.title || "Course"}_Syllabus.pdf`;
    doc.save(fileName);
  };

  // Dynamic tabs based on course data
  const tabs = [
    { id: "syllabus", label: course?.tabs?.syllabus?.label || "Syllabus" },
    {
      id: "case-studies",
      label: course?.tabs?.assignment?.label || "Assignment",
    },
    {
      id: "exam",
      label: course?.tabs?.assessment?.label || "Assessment & Certificates",
    },
    {
      id: "schedule",
      label: course?.tabs?.schedule?.label || "Live Schedule +",
    },
    { id: "simulation", label: course?.tabs?.simulator?.label || "Simulator" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <div className="pt-48 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[280px_1fr_350px] gap-8">
            {/* Courses Marquee (Left) */}
            <CoursesSidebarMarquee />

            {/* Left Column - Course Info */}
            <div className="lg:col-span-2 xl:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-lg shadow-lg p-6 mb-6"
              >
                {/* Course Type Badge */}
                <div className="inline-block bg-[#3cd664] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                  {course.level || "Individual Course"}
                </div>

                {/* Course Title */}
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent mb-4 leading-tight">
                  {course.title}
                </h1>

                {/* Rating - Always show stars with proper rating */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i <
                          Math.floor(
                            courseRatings?.averageRating ||
                              course?.rating ||
                              4.7
                          )
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {courseRatings?.averageRating || course?.rating || 4.7}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({courseRatings?.totalRatings || course?.reviewCount || 449}{" "}
                    reviews)
                  </span>
                  {ratingsLoading && (
                    <span className="text-sm text-gray-500">
                      Loading ratings...
                    </span>
                  )}
                </div>

                {/* Description */}
                <div
                  className="text-sm text-gray-700 leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{
                    __html: course.description || "No description available.",
                  }}
                />

                {/* Tabs */}
                <div className="border-b-2 border-gray-200 mb-8">
                  <nav className="-mb-px flex space-x-4">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-2 border-b-4 font-semibold text-sm whitespace-nowrap ${
                          activeTab === tab.id
                            ? "border-[#3cd664] text-[#3cd664]"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === "syllabus" && (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
                        Course Syllabus
                      </h3>
                      <button
                        onClick={generateSyllabusPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        View full Syllabus
                      </button>
                    </div>

                    {/* Dynamic syllabus from chapters */}
                    {course.chapters && course.chapters.length > 0 ? (
                      <div className="space-y-4">
                        {course.chapters.map(
                          (
                            chapter: {
                              title:
                                | string
                                | number
                                | bigint
                                | boolean
                                | React.ReactElement<
                                    unknown,
                                    string | React.JSXElementConstructor<any>
                                  >
                                | Iterable<React.ReactNode>
                                | React.ReactPortal
                                | Promise<
                                    | string
                                    | number
                                    | bigint
                                    | boolean
                                    | React.ReactPortal
                                    | React.ReactElement<
                                        unknown,
                                        | string
                                        | React.JSXElementConstructor<any>
                                      >
                                    | Iterable<React.ReactNode>
                                    | null
                                    | undefined
                                  >
                                | null
                                | undefined;
                              topics: any[];
                            },
                            index: React.Key | null | undefined
                          ) => (
                            <div
                              key={index}
                              className="border border-gray-100 rounded-lg shadow-md hover:scale-[1.02] transition-all duration-200"
                            >
                              <button
                                onClick={() => toggleSection(Number(index))}
                                className="w-full px-2 py-1 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg"
                              >
                                <span className="font-semibold text-sm text-gray-900">
                                  {chapter.title}
                                </span>
                                {expandedSections.includes(Number(index)) ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                              </button>

                              {expandedSections.includes(Number(index)) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="px-2 pb-1"
                                >
                                  <ul className="space-y-1">
                                    {chapter.topics &&
                                      chapter.topics.map(
                                        (
                                          topic: { title: any },
                                          topicIndex:
                                            | React.Key
                                            | null
                                            | undefined
                                        ) => (
                                          <li
                                            key={topicIndex}
                                            className="flex items-center text-xs text-gray-600"
                                          >
                                            <CheckCircle className="w-3 h-3 text-[#3cd664] mr-1 flex-shrink-0" />
                                            {topic.title || topic}
                                          </li>
                                        )
                                      )}
                                  </ul>
                                </motion.div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-lg p-8">
                          <h3 className="text-base font-semibold text-gray-700 mb-4">
                            Syllabus Coming Soon
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            The detailed syllabus for this course is being
                            prepared and will be available soon.
                          </p>
                          <p className="text-xs text-gray-500">
                            Please check back later or contact us for more
                            information about the course content.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "case-studies" && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Assignment
                    </h3>
                    <div
                      className="text-sm text-gray-600"
                      dangerouslySetInnerHTML={{
                        __html:
                          course.assignment ||
                          "Practical assignments will be available here.",
                      }}
                    />
                  </div>
                )}

                {activeTab === "exam" && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Assessment & Certificates
                    </h3>
                    <div
                      className="text-sm text-gray-600"
                      dangerouslySetInnerHTML={{
                        __html:
                          course.examCert ||
                          "Assessment details and certificate information will be available here.",
                      }}
                    />
                  </div>
                )}

                {activeTab === "schedule" && (
                  <div>
                    <LiveSchedule
                      courseCategory={course.category || "CA Foundation"}
                      student={student}
                    />
                  </div>
                )}

                {activeTab === "simulation" && (
                  <div>
                    <div className="text-center py-12">
                      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                        <div className="mb-6">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                              className="w-8 h-8 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Access Simulator
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Experience our interactive simulator through the
                            Demo Digital Hub
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            (window.location.href = "/demo-digital-hub")
                          }
                          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Go to Demo Digital Hub
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column - Video & Enrollment */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                {/* Video Section */}
                <div className="relative">
                  <div className="aspect-video bg-gray-900 relative overflow-hidden">
                    {/* Course Thumbnail - Direct Image Test */}
                    <img
                      src={
                        course?.image
                          ? course.image.startsWith("/uploads")
                            ? `${API_BASE}${course.image}` // uploaded images
                            : course.image // already local/public images like /images/a1.jpeg
                          : "/images/a1.jpeg" // fallback
                      }
                      alt={`${course?.title || "Course"} - Course Preview`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log("Image failed, using fallback");
                        e.currentTarget.src = "/images/a1.jpeg";
                      }}
                    />

                    {/* Play Button Overlay */}
                  </div>
                </div>

                {/* Pricing & Enrollment */}
                <div className="p-6 border-b-2">
                  <div className="text-center text-sm text-gray-600 mb-6">
                    <p>Get access to this course in DIGITAL HUB.</p>
                    <button
                      onClick={() =>
                        student ? undefined : openAuthModal("register")
                      }
                      className="text-blue-600 hover:text-blue-800 font-semibold mt-2 text-sm"
                    >
                      {student ? "Select Plan" : "Register to unlock"}
                    </button>
                  </div>

                  {/* Pricing Cards - Side by Side */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {/* Recorded Lecture Option */}
                    <div className="border-2 border-[#3cd664] rounded-lg p-2">
                      <div className="mb-2">
                        <div className="text-center mb-1">
                          <span className="text-xs font-bold text-[#3cd664] block">
                            {course?.pricing?.recordedSession?.title ||
                              "DIGITAL HUB RECORDED SESSION"}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-[#3cd664]">
                            {student
                              ? `₹${getSessionPrice("recorded").toLocaleString()}`
                              : "₹ (login to view)"}
                          </div>
                          {student &&
                            course?.pricing?.recordedSession?.discount &&
                            course.pricing.recordedSession.discount > 0 && (
                              <div className="text-xs text-gray-500 line-through">
                                ₹
                                {course.pricing.recordedSession.price.toLocaleString()}
                              </div>
                            )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          student
                            ? handleAddToCart(course._id || course.id, "recorded")
                            : openAuthModal("register")
                        }
                        className="w-full bg-[#3cd664] hover:bg-[#33bb58] text-white font-bold py-1 px-2 rounded text-xs"
                      >
                        {student
                          ? course?.pricing?.recordedSession?.buttonText ||
                            "Add Digital Hub"
                          : "Register to unlock"}
                      </button>
                    </div>

                    {/* Live Lecture Option */}
                    <div className="border-2 border-blue-500 rounded-lg p-2">
                      <div className="mb-2">
                        <div className="text-center mb-1">
                          <span className="text-xs font-bold text-blue-500 block">
                            {course?.pricing?.liveSession?.title ||
                              "DIGITAL HUB LIVE SESSION"}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-blue-500">
                            {student
                              ? `₹${getSessionPrice("live").toLocaleString()}`
                              : "₹ (login to view)"}
                          </div>
                          {student &&
                            course?.pricing?.liveSession?.discount &&
                            course.pricing.liveSession.discount > 0 && (
                              <div className="text-xs text-gray-500 line-through">
                                ₹
                                {course.pricing.liveSession.price.toLocaleString()}
                              </div>
                            )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          student
                            ? handleAddToCart(course._id || course.id, "live")
                            : openAuthModal("register")
                        }
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-1 px-2 rounded text-xs"
                      >
                        {student
                          ? course?.pricing?.liveSession?.buttonText ||
                            "Add Digital Hub+"
                          : "Register to unlock"}
                      </button>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  {cartCount > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-900">
                            {cartCount} item{cartCount > 1 ? "s" : ""} in cart
                          </h4>
                          <p className="text-sm text-blue-700">
                            Ready to checkout?
                          </p>
                        </div>
                        <button
                          onClick={() => router.push("/checkout")}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                          disabled={cartLoading}
                        >
                          {cartLoading ? "Loading..." : "Checkout"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Features */}
                <div className="p-6 border-b-2">
                  <p className="text-sm text-gray-600 mb-6 font-semibold">
                    This course includes:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">
                      {course.chapters ? course.chapters.length : 0} Lesson
                    </div>
                    <div className="bg-[#3cd664] text-white px-3 py-2 rounded-lg text-sm font-bold">
                      {course.chapters
                        ? course.chapters.reduce(
                            (total: any, chapter: { topics: string | any[] }) =>
                              total +
                              (chapter.topics ? chapter.topics.length : 0),
                            0
                          )
                        : 0}{" "}
                      Topics
                    </div>
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">
                      Simulator
                    </div>
                    <div className="bg-[#3cd664] text-white px-3 py-2 rounded-lg text-sm font-bold">
                      {course.examCert ? "Yes" : "No."} Assignment
                    </div>
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">
                      {course.video ? "Yes" : "No"} Live Sessions
                    </div>
                    <div className="bg-[#3cd664] text-white px-3 py-2 rounded-lg text-sm font-bold">
                      {course.level || "Levels"}
                    </div>
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">
                      {course.category || "General"} Category
                    </div>
                    <div className="bg-[#3cd664] text-white px-3 py-2 rounded-lg text-sm font-bold">
                      {course.discount > 0
                        ? `${course.discount}% OFF`
                        : "No Discount"}
                    </div>
                  </div>
                </div>

                {/* Course Stats */}
                <div className="p-6 bg-gray-50 border-t-2">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm font-bold text-gray-900">
                          {course.level || "Levels"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-semibold">
                        Level
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-2">
                        <Users className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm font-bold text-gray-900">
                          {course.category || "General"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-semibold">
                        Category
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        initialMode={authModalMode}
        onClose={() => {
          setShowLoginModal(false);
          setPendingCartAction(null);
        }}
        onLoginSuccess={async () => {
          setShowLoginModal(false);

          // Check if there's a pending cart action
          if (pendingCartAction) {
            // Refresh student data first
            try {
              const response = await axios.get(
                `${API_BASE}/api/v1/students/isstudent`,
                { withCredentials: true }
              );
              const loggedInStudent = response.data.student;
              setStudent(loggedInStudent);

              // Now add to cart using the new system
              if (loggedInStudent) {
                try {
                  const result = await addToCart(
                    pendingCartAction.courseId,
                    pendingCartAction.sessionType
                  );

                  console.log("Add to cart after login result:", result);
                  notifyCartUpdateAndOpenDrawer();

                  // Clear pending action
                  setPendingCartAction(null);
                } catch (error: any) {
                  console.error("Error adding to cart after login:", error);
                  setPendingCartAction(null);
                }
              }
            } catch (error) {
              console.error("Error refreshing student data:", error);
              // Fallback: just reload the page
              window.location.reload();
            }
          } else {
            // No pending action, just refresh the page
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
