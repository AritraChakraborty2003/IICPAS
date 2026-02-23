"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import toast from "react-hot-toast";
import { ArrowRight, Sparkles } from "lucide-react";
import BookingFilterBar from "./BookingFilterBar";
import BookingCourseCard from "./BookingCourseCard";
import BookingSkeletonGrid from "./BookingSkeletonGrid";
import { getDefaultSessionType, getPriceBounds, normalizeCoursesPayload } from "./courseUtils";
import { BookingCourse, BookingFilterState } from "./types";

type BookingPageClientProps = {
  initialCourses: BookingCourse[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.iicpa.in/api";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function BookingPageClient({ initialCourses }: BookingPageClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<BookingCourse[]>(initialCourses);
  const [loading, setLoading] = useState(initialCourses.length === 0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCourseId, setBookingCourseId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const priceBounds = useMemo(() => getPriceBounds(courses), [courses]);

  const [filters, setFilters] = useState<BookingFilterState>({
    search: "",
    categories: [],
    minPrice: priceBounds.min,
    maxPrice: priceBounds.max,
    sortBy: "relevance",
  });
  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => {
    setFilters((prev) => {
      const isFirstInit = prev.minPrice === 0 && prev.maxPrice === 0;
      if (isFirstInit) {
        return { ...prev, minPrice: priceBounds.min, maxPrice: priceBounds.max };
      }

      const clampedMin = Math.max(priceBounds.min, prev.minPrice);
      const clampedMax = Math.min(priceBounds.max || prev.maxPrice, prev.maxPrice);
      return {
        ...prev,
        minPrice: clampedMin,
        maxPrice: clampedMax >= clampedMin ? clampedMax : clampedMin,
      };
    });
  }, [priceBounds.min, priceBounds.max]);

  const categories = useMemo(
    () => Array.from(new Set(courses.map((course) => course.category))).sort((a, b) => a.localeCompare(b)),
    [courses]
  );

  const fetchLatestCourses = async ({ showLoader = false }: { showLoader?: boolean } = {}) => {
    if (showLoader) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/courses`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load courses (${response.status})`);
      }
      const payload = await response.json();
      const normalized = normalizeCoursesPayload(payload);
      setCourses(normalized);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Unable to refresh courses right now. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLatestCourses({ showLoader: initialCourses.length === 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    setIsFiltering(true);
    const timeout = setTimeout(() => setIsFiltering(false), 120);
    return () => clearTimeout(timeout);
  }, [filters.search, filters.categories, filters.minPrice, filters.maxPrice, filters.sortBy, loading]);

  const filteredCourses = useMemo(() => {
    const searchTerm = deferredSearch.trim().toLowerCase();

    const list = courses.filter((course) => {
      const matchesSearch = !searchTerm || course.title.toLowerCase().includes(searchTerm);
      const matchesCategory =
        filters.categories.length === 0 || filters.categories.includes(course.category);
      const matchesPrice =
        course.effectivePrice >= filters.minPrice && course.effectivePrice <= filters.maxPrice;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (filters.sortBy === "price-low-high") {
      list.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (filters.sortBy === "price-high-low") {
      list.sort((a, b) => b.effectivePrice - a.effectivePrice);
    } else if (filters.sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [courses, deferredSearch, filters.categories, filters.minPrice, filters.maxPrice, filters.sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count += 1;
    count += filters.categories.length;
    if (filters.minPrice > priceBounds.min || filters.maxPrice < priceBounds.max) count += 1;
    return count;
  }, [filters.search, filters.categories.length, filters.minPrice, filters.maxPrice, priceBounds.min, priceBounds.max]);

  const clearAllFilters = () => {
    setFilters({
      search: "",
      categories: [],
      minPrice: priceBounds.min,
      maxPrice: priceBounds.max,
      sortBy: "relevance",
    });
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((entry) => entry !== category)
        : [...prev.categories, category],
    }));
  };

  const setPriceRange = (minPrice: number, maxPrice: number) => {
    const validMin = Number.isFinite(minPrice) ? minPrice : priceBounds.min;
    const validMax = Number.isFinite(maxPrice) ? maxPrice : priceBounds.max;
    const clampedMin = Math.max(priceBounds.min, Math.min(validMin, priceBounds.max));
    const clampedMax = Math.max(clampedMin, Math.min(validMax, priceBounds.max));

    setFilters((prev) => ({
      ...prev,
      minPrice: clampedMin,
      maxPrice: clampedMax,
    }));
  };

  const handleBookNow = async (course: BookingCourse) => {
    const sessionType = getDefaultSessionType(course);
    setBookingCourseId(course.id);

    try {
      const studentResponse = await axios.get(`${API_URL}/api/v1/students/isstudent`, {
        withCredentials: true,
      });
      const student = studentResponse.data?.student;

      if (!student?._id) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "booking_intent",
            JSON.stringify({ courseId: course.id, sessionType })
          );
        }
        router.push(
          `/student-login?redirect=${encodeURIComponent(
            "/booking"
          )}&courseId=${encodeURIComponent(course.id)}&sessionType=${encodeURIComponent(sessionType)}`
        );
        return;
      }

      await axios.post(
        `${API_URL}/api/v1/cart/add/${student._id}`,
        { courseId: course.id, sessionType },
        { withCredentials: true }
      );

      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { openDrawer: false } }));
      toast.success("Pre-booking started. Redirecting to checkout...");
      router.push("/checkout");
    } catch (bookingError) {
      console.error("Booking failed:", bookingError);
      toast.error("Unable to book this course right now. Please try again.");
    } finally {
      setBookingCourseId(null);
    }
  };

  const showSkeleton = loading || (isFiltering && courses.length > 0);

  return (
    <main className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 min-h-screen">
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-14">
        <div className="pt-4 md:pt-6 mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 md:p-7 text-white shadow-lg">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-16 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
                  <Sparkles className="h-3.5 w-3.5" />
                  Fast Admissions
                </p>
                <h2 className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight">
                  Register and Pre-Book Courses
                </h2>
                <p className="mt-2 text-sm md:text-base text-white/90">
                  Reserve your seat now, complete checkout in seconds, and start learning faster.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Register Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const element = document.getElementById("booking-courses-grid");
                    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Pre-Book Courses
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchLatestCourses({ showLoader: true })}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <BookingFilterBar
          filters={filters}
          categories={categories}
          minBound={priceBounds.min}
          maxBound={priceBounds.max}
          activeFilterCount={activeFilterCount}
          onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          onSortChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
          onToggleCategory={toggleCategory}
          onPriceChange={setPriceRange}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          onClearAll={clearAllFilters}
          onRemoveSearch={() => setFilters((prev) => ({ ...prev, search: "" }))}
          onRemoveCategory={(value) =>
            setFilters((prev) => ({
              ...prev,
              categories: prev.categories.filter((entry) => entry !== value),
            }))
          }
          onRemovePrice={() =>
            setFilters((prev) => ({
              ...prev,
              minPrice: priceBounds.min,
              maxPrice: priceBounds.max,
            }))
          }
        />

        <Drawer
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          direction="right"
          className="md:hidden"
          size={320}
        >
          <div className="h-full bg-white p-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Filters</h3>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: event.target.value as BookingFilterState["sortBy"],
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low-high">Price low-high</option>
                <option value="price-high-low">Price high-low</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Categories</p>
              <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 p-3">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-2 py-1 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="accent-emerald-600"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Min price</label>
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={filters.minPrice}
                  onChange={(event) => setPriceRange(Number(event.target.value), filters.maxPrice)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max price</label>
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={filters.maxPrice}
                  onChange={(event) => setPriceRange(filters.minPrice, Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                  setMobileFiltersOpen(false);
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Apply filters
              </button>
            </div>
          </div>
        </Drawer>

        <div className="mt-6 mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600">
            {isRefreshing ? "Refreshing courses..." : `${filteredCourses.length} course(s) found`}
          </p>
          <p className="hidden md:block text-xs text-slate-500">
            Efficient filtering with instant results
          </p>
        </div>

        {showSkeleton ? (
          <BookingSkeletonGrid count={9} showFilterSkeleton={loading && courses.length === 0} />
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-14 px-6 text-center">
            <h3 className="text-xl font-bold text-slate-900">No courses match your filters</h3>
            <p className="mt-2 text-slate-600">Try changing filters or reset to view all courses.</p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div id="booking-courses-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <BookingCourseCard
                key={course.id}
                course={course}
                onBookNow={handleBookNow}
                isBooking={bookingCourseId === course.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
