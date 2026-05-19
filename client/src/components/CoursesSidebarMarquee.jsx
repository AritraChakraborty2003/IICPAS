"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BookOpen } from "lucide-react";

const getApiOrigin = () => {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api\/?$/i, "") ||
    "http://localhost:8080";

  return configuredOrigin.trim().replace(/\/+$/, "");
};

const normalizeCourseImageSrc = (rawImage, apiUrl) => {
  if (!rawImage || typeof rawImage !== "string") return null;

  const safeApiOrigin = (() => {
    const fallback = "https://api.iicpa.in";
    if (!apiUrl || typeof apiUrl !== "string") return fallback;

    const trimmed = apiUrl.trim();
    if (!trimmed) return fallback;

    if (
      trimmed.includes("localhost") ||
      trimmed.includes("127.0.0.1") ||
      trimmed.includes("0.0.0.0")
    ) {
      return fallback;
    }

    return trimmed.replace(/^http:\/\//i, "https://").replace(/\/+$/, "");
  })();

  const value = rawImage.trim();

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/^http:\/\//i, "https://");
  }

  if (value.startsWith("/uploads/")) {
    return `${safeApiOrigin}${value}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  return `${safeApiOrigin}/${value.replace(/^\/+/, "")}`;
};

export default function CoursesSidebarMarquee() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/courses`
        );
        const coursesData = Array.isArray(response.data)
          ? response.data
          : response.data?.courses || [];

        // Filter active courses
        const activeCourses = coursesData.filter(
          (c) =>
            c.status === "Active" ||
            c.status === "active" ||
            c.status === undefined
        );
        setCourses(activeCourses);
      } catch (error) {
        console.error("Error fetching courses for marquee:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading || courses.length === 0) {
    return null;
  }

  // Duplicate items for seamless vertical scroll loop
  const items = [...courses, ...courses];
  const apiOrigin = getApiOrigin();

  const handleCourseClick = (course) => {
    const courseId =
      course.slug ||
      course.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
    router.push(`/course/${courseId}`);
  };

  const getLowestCoursePrice = (course) => {
    const prices = [
      course?.pricing?.recordedSession?.finalPrice,
      course?.pricing?.recordedSession?.price,
      course?.pricing?.liveSession?.finalPrice,
      course?.pricing?.liveSession?.price,
      course?.price,
    ]
      .map((price) => Number(price))
      .filter((price) => Number.isFinite(price) && price > 0);

    return prices.length > 0 ? Math.min(...prices) : null;
  };

  return (
    <aside className="hidden xl:block xl:w-full">
      <div className="sticky top-28 w-full rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-4 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-3 px-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3cd664]">
            POPULAR COURSES
          </p>
        </div>

        <div className="relative h-[76vh] min-h-[560px] overflow-hidden rounded-[24px] bg-white">
          <div className="courses-marquee-track absolute inset-x-0 top-0 animate-[coursesSidebarMarquee_30s_linear_infinite]">
            {items.map((course, index) => {
              const courseImageSrc = normalizeCourseImageSrc(
                course.image,
                apiOrigin
              );
              const price = getLowestCoursePrice(course);

              return (
                <div
                  key={`${course._id}-${index}`}
                  className="px-2 py-2.5 cursor-pointer"
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                    <div className="relative h-24 w-full rounded-[14px] overflow-hidden mb-3 bg-slate-100 flex items-center justify-center">
                      {courseImageSrc ? (
                        <img
                          src={courseImageSrc}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback =
                              e.currentTarget.nextElementSibling;
                            if (fallback) {
                              fallback.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`absolute inset-0 items-center justify-center text-slate-400 ${
                          courseImageSrc ? "hidden" : "flex"
                        }`}
                        style={{ display: courseImageSrc ? "none" : "flex" }}
                      >
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                    </div>

                    <div className="px-1 text-left">
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">
                        {course.level || course.category || "Course"}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem]">
                        {course.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-600">
                        {price !== null ? (
                          <span className="text-[#3cd664] font-bold">
                            Rs. {price.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[#3cd664] font-bold">Free</span>
                        )}
                        <span className="text-blue-600 hover:text-blue-800 font-semibold">
                          View →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/85 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent" />
        </div>
      </div>

      <style jsx>{`
        .courses-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes coursesSidebarMarquee {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </aside>
  );
}
