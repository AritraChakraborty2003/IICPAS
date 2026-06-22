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
      title?: string;
      buttonText?: string;
      finalPrice?: number;
      price?: number;
      discount?: number;
    };
    liveSession?: {
      title?: string;
      buttonText?: string;
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

  const generateBrochurePDF = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/brochures/course/${course._id || courseId}`);
      const brochure = res.data?.data;
      if (!brochure) { alert("No brochure available for this course yet."); return; }

      const { jsPDF: JsPDF } = await import("jspdf");
      const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = 297, H = 210;

      const hexToRgb = (hex: string) => {
        const clean = (hex || "#ffffff").replace("#", "").padEnd(6, "0");
        return {
          r: parseInt(clean.slice(0, 2), 16) || 0,
          g: parseInt(clean.slice(2, 4), 16) || 0,
          b: parseInt(clean.slice(4, 6), 16) || 0,
        };
      };

      // Fetch image via backend proxy (avoids all CORS issues — reads from disk)
      const proxyImage = async (url: string): Promise<string> => {
        if (!url) return "";
        if (url.startsWith("data:")) return url;
        try {
          const r = await axios.get(
            `${API_BASE}/api/brochures/image-proxy?url=${encodeURIComponent(url)}`
          );
          return r.data?.base64 || "";
        } catch { return ""; }
      };

      // Canvas in editor is fixed at 830px wide — scale to A4 landscape 297mm
      const CANVAS_W = 830;
      const SCALE = W / CANVAS_W;

      // Parse inline-colored spans from execCommand HTML into segments
      type TextSegment = { text: string; color: string; bold: boolean; size: number };
      const parseHtmlSegments = (html: string, defaultColor: string, defaultBold: boolean, defaultSize: number): TextSegment[] => {
        const segments: TextSegment[] = [];
        const div = document.createElement("div");
        div.innerHTML = html;
        const walk = (node: Node, color: string, bold: boolean, size: number) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const t = (node.textContent || "").replace(/ /g, " ");
            if (t) segments.push({ text: t, color, bold, size });
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === "br") { segments.push({ text: "\n", color, bold, size }); return; }
            let c = el.style.color || color;
            // parse rgb(r,g,b) → hex
            const rgbMatch = c.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            if (rgbMatch) {
              c = "#" + [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
            }
            const b = bold || tag === "b" || tag === "strong" || el.style.fontWeight === "bold";
            const fsMatch = el.style.fontSize?.match(/(\d+)/);
            const s = fsMatch ? parseInt(fsMatch[1]) : size;
            if (tag === "p" && segments.length > 0) segments.push({ text: "\n", color: c, bold: b, size: s });
            el.childNodes.forEach((child) => walk(child, c, b, s));
          }
        };
        div.childNodes.forEach((n) => walk(n, defaultColor, defaultBold, defaultSize));
        return segments.length ? segments : [{ text: div.innerText || "", color: defaultColor, bold: defaultBold, size: defaultSize }];
      };

      const renderPage = async (pageData: any, isFirst: boolean) => {
        if (!isFirst) doc.addPage();

        // Background color fill
        const bg = hexToRgb(pageData.backgroundColor || "#ffffff");
        doc.setFillColor(bg.r, bg.g, bg.b);
        doc.rect(0, 0, W, H, "F");

        // Background image (full page)
        if (pageData.backgroundImage) {
          const b64 = await proxyImage(pageData.backgroundImage);
          if (b64) {
            const fmt = b64.includes("image/png") ? "PNG" : "JPEG";
            try { doc.addImage(b64, fmt, 0, 0, W, H); } catch { /* skip bad image */ }
          }
        }

        // Overlay images — x/y/width/height are in editor canvas pixels (830px wide)
        for (const ov of (pageData.overlayImages || [])) {
          if (!ov.url) continue;
          const b64 = await proxyImage(ov.url);
          if (b64) {
            const fmt = b64.includes("image/png") ? "PNG" : "JPEG";
            try {
              doc.addImage(b64, fmt, ov.x * SCALE, ov.y * SCALE, ov.width * SCALE, ov.height * SCALE);
            } catch { /* skip */ }
          }
        }

        // Text content — honour per-span colors and font sizes from execCommand
        if (pageData.content) {
          const defaultColor = pageData.textColor || "#1a1a1a";
          const defaultBold = !!pageData.textBold;
          const defaultSize = pageData.textSize || 14;
          const segments = parseHtmlSegments(pageData.content, defaultColor, defaultBold, defaultSize);
          const x = Math.max(5, (pageData.textX ?? 24) * SCALE);
          let y = Math.max(10, (pageData.textY ?? 24) * SCALE);
          const lineH = (defaultSize * SCALE) * 1.4;

          let lineBuffer: TextSegment[] = [];
          const flushLine = () => {
            if (!lineBuffer.length) return;
            let cx = x;
            for (const seg of lineBuffer) {
              const tc = hexToRgb(seg.color);
              doc.setTextColor(tc.r, tc.g, tc.b);
              const sz = Math.max(6, Math.min(seg.size, 48));
              doc.setFontSize(sz);
              doc.setFont("helvetica", seg.bold ? "bold" : "normal");
              doc.text(seg.text, cx, y);
              cx += doc.getTextWidth(seg.text);
            }
            y += lineH;
            lineBuffer = [];
          };

          for (const seg of segments) {
            if (seg.text === "\n") { flushLine(); continue; }
            // Split on embedded newlines
            const parts = seg.text.split("\n");
            for (let i = 0; i < parts.length; i++) {
              if (i > 0) flushLine();
              if (parts[i]) lineBuffer.push({ ...seg, text: parts[i] });
            }
          }
          flushLine();
        }
      };

      await renderPage(brochure.coverPage, true);
      for (const pg of (brochure.pages || [])) {
        await renderPage(pg, false);
      }

      doc.save(`${(course.title || "Brochure").replace(/\s+/g, "_")}_Brochure.pdf`);
    } catch (err: any) {
      alert("Failed to generate brochure: " + (err?.message || "Unknown error"));
    }
  };

  const generateSyllabusPDF = () => {
    const doc = new jsPDF();
    const PAGE_H = 297;
    const MARGIN = 20;
    const MAX_W = 170;
    let y = MARGIN;

    const checkPage = (needed: number) => {
      if (y + needed > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN; }
    };

    const writeLine = (text: string, x: number, size: number, lineH: number, font = "normal") => {
      doc.setFontSize(size);
      doc.setFont("helvetica", font);
      const lines = doc.splitTextToSize(text, MAX_W - (x - MARGIN));
      checkPage(lines.length * lineH);
      doc.text(lines, x, y);
      y += lines.length * lineH;
    };

    writeLine("Course Syllabus", MARGIN, 20, 10, "bold");
    y += 2;
    writeLine(course.title || "Course Details", MARGIN, 16, 9, "bold");
    y += 6;

    if (course.description) {
      const clean = course.description.replace(/<[^>]*>/g, "").trim();
      if (clean) { writeLine(clean, MARGIN, 11, 6); y += 6; }
    }

    writeLine("Course Information:", MARGIN, 13, 7, "bold");
    writeLine(`Duration: ${course.duration || "N/A"}`, MARGIN, 11, 6);
    writeLine(`Level: ${course.level || "N/A"}`, MARGIN, 11, 6);
    writeLine(`Price: Rs. ${course.price || "N/A"}`, MARGIN, 11, 6);
    y += 8;

    const renderChapters = (chapters: any[]) => {
      checkPage(10);
      writeLine("Detailed Syllabus:", MARGIN, 13, 7, "bold");
      y += 2;
      chapters.forEach((chapter: any, index: number) => {
        checkPage(8);
        writeLine(`${index + 1}. ${chapter.title}`, MARGIN, 12, 6, "bold");
        if (chapter.topics?.length) {
          chapter.topics.forEach((topic: any) => {
            const txt = typeof topic === "string" ? topic : topic?.title || "";
            if (txt) writeLine(`• ${txt}`, MARGIN + 8, 10, 5);
          });
        }
        y += 3;
      });
    };

    if (course.chapters?.length) {
      renderChapters(course.chapters);
    } else if (course.syllabus?.length) {
      renderChapters(course.syllabus.map((ch: any) => ({
        ...ch,
        topics: ch.topics?.map((t: string) => ({ title: t })),
      })));
    }

    doc.save(`${(course.title || "Course").replace(/\s+/g, "_")}_Syllabus.pdf`);
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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 mr-0 lg:mr-4">
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
                  className="text-sm text-gray-700 leading-relaxed mb-8 [&>p]:mb-3"
                  dangerouslySetInnerHTML={{
                    __html: course.description || "<p>No description available.</p>",
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
                    <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
                        Course Syllabus
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={generateBrochurePDF}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download Brochure
                        </button>
                        <button
                          onClick={generateSyllabusPDF}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          View full Syllabus
                        </button>
                      </div>
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
                      courseId={course._id || courseId}
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
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
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
                      className="w-full h-full object-contain"
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

                  {/* Pricing Cards */}
                  {(() => {
                    const hasRecorded = (course?.pricing?.recordedSession?.price || 0) > 0 || (course?.pricing?.recordedSession?.finalPrice || 0) > 0;
                    const hasLive = (course?.pricing?.liveSession?.price || 0) > 0 || (course?.pricing?.liveSession?.finalPrice || 0) > 0;
                    if (!hasRecorded && !hasLive) return null;
                    return (
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        {/* Recorded Session */}
                        {hasRecorded && (
                          <div className="border-2 border-green-500 rounded-lg p-2">
                            <div className="mb-2">
                              <div className="text-center mb-1">
                                <span className="text-xs font-bold text-green-600 block">
                                  {course?.pricing?.recordedSession?.title || "RECORDED SESSION"}
                                </span>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-green-600">
                                  {student
                                    ? `₹${getSessionPrice("recorded").toLocaleString()}`
                                    : "₹ (login to view)"}
                                </div>
                                {student &&
                                  course?.pricing?.recordedSession?.discount &&
                                  course.pricing.recordedSession.discount > 0 && (
                                    <div className="text-xs text-gray-500 line-through">
                                      ₹{course.pricing.recordedSession.price?.toLocaleString()}
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
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-1 px-2 rounded text-xs"
                            >
                              {student
                                ? course?.pricing?.recordedSession?.buttonText || "Add Recorded Session"
                                : "Register to unlock"}
                            </button>
                          </div>
                        )}
                        {/* Live Session */}
                        {hasLive && (
                          <div className="border-2 border-blue-500 rounded-lg p-2">
                            <div className="mb-2">
                              <div className="text-center mb-1">
                                <span className="text-xs font-bold text-blue-500 block">
                                  {course?.pricing?.liveSession?.title || "DIGITAL HUB LIVE SESSION"}
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
                                      ₹{course.pricing.liveSession.price?.toLocaleString()}
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
                                ? course?.pricing?.liveSession?.buttonText || "Add Digital Hub+"
                                : "Register to unlock"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

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
