"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { memo } from "react";

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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE || "https://api.iicpa.in/api";

        const response = await fetch(`${API_BASE}/courses`);

        if (response.ok) {
          const data = await response.json();

          if (Array.isArray(data) && data.length > 0) {
            const transformedCourses = data.map(
              (course: ApiCourse): Course => ({
                _id: course._id,
                title: course.title?.trim() || "Untitled Course",
                image: course.image
                  ? course.image.startsWith("http")
                    ? course.image
                    : course.image.startsWith("/uploads/")
                    ? `https://api.iicpa.in${course.image}`
                    : `https://api.iicpa.in/${course.image}`
                  : "/images/a1.jpeg",
                price: course.price || 0,
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
                  new Date(b.createdAt || 0).getTime() -
                  new Date(a.createdAt || 0).getTime()
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

  const handleEnrollNow = (course: Course) => {
    router.push(`/course/${course.slug}`);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.slice(0, 3).map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden min-h-[400px]"
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
                    <span className="text-2xl font-bold text-[#3cd664]">
                      ₹{course.price.toLocaleString()}
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
