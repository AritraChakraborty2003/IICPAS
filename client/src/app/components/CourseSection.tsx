"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import axios from "axios";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Course {
  _id: string;
  title: string;
  image: string;
  price: number;
  slug: string;
  category: string;
  discount?: number;
  status: string;
  description?: string;
  createdAt?: string;
  pricing?: {
    recordedSession?: {
      price: number;
      discount: number;
      finalPrice: number;
    };
    liveSession?: {
      price: number;
      discount: number;
      finalPrice: number;
    };
  };
}

interface ApiCourse {
  _id: string;
  title?: string;
  image?: string;
  price?: number;
  slug?: string;
  category?: string;
  discount?: number;
  status?: string;
  description?: string;
  createdAt?: string;
  pricing?: {
    recordedSession?: {
      price: number;
      discount: number;
      finalPrice: number;
    };
    liveSession?: {
      price: number;
      discount: number;
      finalPrice: number;
    };
  };
}

const getApiBase = () => {
  const configuredBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.iicpa.in/api";

  const trimmed = configuredBase.trim().replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const getApiOrigin = () => {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api\/?$/i, "") ||
    "https://api.iicpa.in";

  return configuredOrigin.trim().replace(/\/+$/, "");
};

const extractCourses = (payload: unknown): ApiCourse[] => {
  if (Array.isArray(payload)) return payload as ApiCourse[];

  if (payload && typeof payload === "object") {
    const candidate = payload as {
      courses?: ApiCourse[];
      data?: ApiCourse[] | { courses?: ApiCourse[] };
    };

    if (Array.isArray(candidate.courses)) return candidate.courses;
    if (Array.isArray(candidate.data)) return candidate.data;
    if (Array.isArray(candidate.data?.courses)) return candidate.data.courses;
  }

  return [];
};

const resolveCourseImage = (image: string | undefined, apiOrigin: string) => {
  const value = (image || "").trim();
  if (!value) return "/images/a1.jpeg";
  if (/^https?:\/\//i.test(value)) {
    return value.replace(/^http:\/\//i, "https://");
  }
  if (value.startsWith("/uploads/")) {
    return `${apiOrigin}${value}`;
  }
  if (value.startsWith("/")) {
    return value;
  }
  return `${apiOrigin}/${value.replace(/^\/+/, "")}`;
};

const getDisplayPrice = (course: ApiCourse) => {
  return (
    course.pricing?.recordedSession?.finalPrice ||
    course.pricing?.recordedSession?.price ||
    course.price ||
    0
  );
};

// Fallback data - Updated to match real API data
const sampleCourses: Course[] = [
  {
    _id: "1",
    title: "Basic Accounting and Tally Certification Course",
    image: "https://api.iicpa.in/uploads/1758708914697-217664041.png",
    price: 15000,
    slug: "basic-accounting-and-tally-certification-course",
    category: "Accounting",
    status: "Active",
  },
  {
    _id: "2",
    title: "Payroll and HR Certification Course",
    image: "https://api.iicpa.in/uploads/1758720155374-15746882.jpg",
    price: 3500,
    slug: "payroll-and-hr-certification-course",
    category: "HR",
    status: "Active",
  },
  {
    _id: "3",
    title: "Excel Certification Course",
    image: "https://api.iicpa.in/uploads/1758720990274-883667247.jpg",
    price: 2000,
    slug: "excel-certification-course",
    category: "Accounting",
    status: "Active",
  },
];

const CourseSection = memo(function CourseSection() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const API_BASE = getApiBase();
        const API_ORIGIN = getApiOrigin();

        const response = await fetch(`${API_BASE}/courses`);

        if (response.ok) {
          const data = await response.json();
          const apiCourses = extractCourses(data);

          if (apiCourses.length > 0) {
            const transformedCourses = apiCourses.map(
              (course: ApiCourse): Course => ({
                _id: course._id,
                title: course.title?.trim() || "Untitled Course",
                image: resolveCourseImage(course.image, API_ORIGIN),
                price: getDisplayPrice(course),
                slug:
                  course.slug ||
                  course.title
                    ?.toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^\w-]/g, "") ||
                  "course",
                category: course.category || "General",
                discount: course.discount || 0,
                status: course.status || "Active",
                description: course.description || "",
                createdAt: course.createdAt || new Date().toISOString(),
                pricing: course.pricing || undefined,
              })
            );

            const activeCourses = transformedCourses
              .filter((c) => c.status === "Active")
              .sort(
                (a, b) =>
                  new Date(a.createdAt || 0).getTime() -
                  new Date(b.createdAt || 0).getTime()
              );
            setCourses(activeCourses);
          } else {
            setCourses(sampleCourses);
          }
        } else {
          setCourses(sampleCourses);
        }
      } catch (error) {
        console.error("🔍 CourseSection - Error fetching courses:", error);
        setCourses(sampleCourses);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await axios.get(`${API}/api/v1/students/isstudent`, {
          withCredentials: true,
        });
        setStudent(response.data.student || null);
      } catch {
        setStudent(null);
      }
    };

    fetchStudent();
  }, []);

  const handleEnrollNow = (course: Course) => {
    router.push(`/course/${course.slug}`);
  };

  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate the list so the marquee can loop seamlessly.
  const marqueeCourses = courses.length > 0 ? [...courses, ...courses] : [];

  // Auto-scroll the track. The track width is doubled (list rendered twice),
  // so when we pass the halfway point we reset to 0 for a seamless loop.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || courses.length === 0) return;

    let frame: number;
    const speed = 1.5; // pixels per frame

    const step = () => {
      if (!isPaused) {
        track.scrollLeft += speed;
        const half = track.scrollWidth / 2;
        if (track.scrollLeft >= half) {
          track.scrollLeft -= half;
        }
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [courses, isPaused]);

  const scrollByCard = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const amount = 320; // approx one card width + gap
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-16 px-4 md:px-20 bg-[#f9fbfa] min-h-[600px]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 text-gray-800">
          Our Courses Designed For{" "}
          <span className="text-[#3cd664] bg-[#3cd664]/10 px-2 py-1 rounded-lg">
            Your Success
          </span>
        </h2>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left arrow */}
          <button
            type="button"
            aria-label="Previous courses"
            onClick={() => scrollByCard("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-[#3cd664] hover:text-white transition-colors -ml-2 md:-ml-5"
          >
            <FaChevronLeft />
          </button>

          {/* Marquee track */}
          <div
            ref={trackRef}
            className="flex gap-8 overflow-x-hidden py-2 px-8 scroll-smooth"
          >
            {marqueeCourses.map((course, index) => (
              <div
                key={`${course._id}-${index}`}
                className="bg-white rounded-lg shadow-lg overflow-hidden min-h-[400px] flex-shrink-0 w-[300px]"
              >
                <div className="relative h-48 w-full">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover block"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#3cd664] text-white px-3 py-1 rounded-full text-sm font-medium">
                      {course.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#3cd664]">
                        {student
                          ? `₹${course.price.toLocaleString()}`
                          : "₹ (login to view)"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnrollNow(course)}
                    className="w-full bg-[#3cd664] text-white py-3 px-4 rounded-lg font-semibold"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            type="button"
            aria-label="Next courses"
            onClick={() => scrollByCard("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-[#3cd664] hover:text-white transition-colors -mr-2 md:-mr-5"
          >
            <FaChevronRight />
          </button>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.push("/course")}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold"
          >
            View All Courses ({courses.length})
          </button>
        </div>
      </div>
    </section>
  );
});

export default CourseSection;
