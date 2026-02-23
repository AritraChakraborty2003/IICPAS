"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ApiCourse = {
  _id: string;
  title?: string;
  slug?: string;
  image?: string;
  category?: string;
  description?: string;
  price?: number;
  status?: string;
  pricing?: {
    recordedSession?: {
      price?: number;
      finalPrice?: number;
    };
  };
};

const normalizeImage = (image?: string) => {
  if (!image) return "/images/a1.jpeg";
  if (image.startsWith("http")) return image;
  if (image.startsWith("/uploads/")) return `https://api.iicpa.in${image}`;
  if (image.startsWith("/")) return image;
  return `https://api.iicpa.in/${image}`;
};

const toPrice = (course: ApiCourse) =>
  course.pricing?.recordedSession?.finalPrice ||
  course.pricing?.recordedSession?.price ||
  course.price ||
  0;

export default function BookingPageClient() {
  const router = useRouter();
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE || "https://api.iicpa.in/api";
        const response = await fetch(`${API_BASE}/courses`, {
          cache: "no-store",
        });
        const data = await response.json();
        const courseList = Array.isArray(data) ? data : data?.courses || [];
        const activeCourses = courseList.filter(
          (course: ApiCourse) => !course.status || course.status === "Active"
        );
        setCourses(activeCourses);
      } catch (error) {
        console.error("Failed to fetch courses for booking page:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses;
    const query = search.toLowerCase();
    return courses.filter((course) =>
      (course.title || "").toLowerCase().includes(query)
    );
  }, [courses, search]);

  const handleBookNow = (course: ApiCourse) => {
    const courseId = course.slug || course._id;
    router.push(`/course/${encodeURIComponent(courseId)}`);
  };

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Book Your Course
          </h1>
          <p className="text-slate-600 mt-2">
            Browse all available courses and book instantly.
          </p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full md:w-[420px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {loading ? (
          <p className="text-slate-600">Loading courses...</p>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-700 font-semibold">No courses found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <article
                key={course._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="h-44 w-full bg-slate-100">
                  <img
                    src={normalizeImage(course.image)}
                    alt={course.title || "Course image"}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-5">
                  <div className="mb-2">
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      {course.category || "General"}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 line-clamp-2 min-h-[56px]">
                    {course.title || "Untitled Course"}
                  </h2>

                  <p className="text-green-700 font-bold text-xl mt-3">
                    Rs {toPrice(course).toLocaleString()}
                  </p>

                  <button
                    onClick={() => handleBookNow(course)}
                    className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Book Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
