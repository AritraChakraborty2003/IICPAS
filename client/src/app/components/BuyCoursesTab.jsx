"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCheck,
  FaFilter,
  FaSearch,
  FaStar,
  FaTimes,
  FaTags,
} from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import wishlistEventManager from "../../utils/wishlistEventManager";

const skillLevels = ["Executive Level", "Professional Level"];

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "discount-desc", label: "Highest Discount" },
  { value: "newest", label: "Newest" },
];

const dummyCourses = [
  {
    _id: "1",
    title: "Basic Accounting & Tally Foundation",
    slug: "basic-accounting-tally-foundation",
    category: "Accounting",
    level: "Professional Level",
    price: 5000,
    discount: 5,
    image: "/images/accounting.webp",
    description: "Master the fundamentals of accounting and Tally software.",
  },
  {
    _id: "2",
    title: "HR Certification Course",
    slug: "hr-certification-course",
    category: "HR",
    level: "Executive Level",
    price: 1000,
    discount: 10,
    image: "/images/young-woman.jpg",
    description: "Comprehensive HR certification with practical skills.",
  },
  {
    _id: "3",
    title: "Excel Certification Course",
    slug: "excel-certification-course",
    category: "Accounting",
    level: "Professional Level",
    price: 2000,
    discount: 0,
    image: "/images/course.png",
    description: "Advanced Excel skills for accounting and reporting workflows.",
  },
  {
    _id: "4",
    title: "Finance Management Course",
    slug: "finance-management-course",
    category: "Finance",
    level: "Executive Level",
    price: 3500,
    discount: 15,
    image: "/images/a1.jpeg",
    description: "Build practical financial management and analysis capabilities.",
  },
  {
    _id: "5",
    title: "US CMA Certification Prep",
    slug: "us-cma-certification-prep",
    category: "US CMA",
    level: "Executive Level",
    price: 8000,
    discount: 8,
    image: "/images/a2.avif",
    description: "Structured preparation for the US CMA exam with guided modules.",
  },
  {
    _id: "6",
    title: "Advanced Excel Mastery",
    slug: "advanced-excel-mastery",
    category: "Excel",
    level: "Professional Level",
    price: 2800,
    discount: 12,
    image: "/images/a3.jpeg",
    description: "Master advanced formulas, analytics, and dashboarding.",
  },
];

const dummyCategories = [
  { _id: "1", category: "Accounting" },
  { _id: "2", category: "HR" },
  { _id: "3", category: "Finance" },
  { _id: "4", category: "US CMA" },
  { _id: "5", category: "Excel" },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDisplayPricing = (course) => {
  const recordedFinal = toNumber(course?.pricing?.recordedSession?.finalPrice, NaN);
  const recordedPrice = toNumber(course?.pricing?.recordedSession?.price, NaN);
  const legacyPrice = toNumber(course?.price, 0);

  const finalPrice = Number.isFinite(recordedFinal)
    ? recordedFinal
    : Number.isFinite(recordedPrice)
    ? recordedPrice
    : legacyPrice;

  const originalPrice = Number.isFinite(recordedPrice) ? recordedPrice : legacyPrice;

  const explicitDiscount = toNumber(
    course?.pricing?.recordedSession?.discount ?? course?.discount,
    0
  );

  const derivedDiscount =
    originalPrice > 0 && finalPrice < originalPrice
      ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
      : 0;

  const discountPercent = Math.max(explicitDiscount, derivedDiscount, 0);

  return {
    finalPrice,
    originalPrice,
    discountPercent,
    hasDiscount: discountPercent > 0 || finalPrice < originalPrice,
  };
};

const resolveCourseImage = (course, apiBase) => {
  const raw = (course?.image || "").toString().trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/^http:\/\//i, "https://");
  }

  if (raw.startsWith("/uploads/")) {
    return `${apiBase}${raw}`;
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  return `${apiBase}/${raw.replace(/^\/+/, "")}`;
};

const getCoursePath = (course) => {
  const id =
    course?.slug ||
    (course?.title || "course")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  return `/course/${id}`;
};

const stripHtml = (value) => {
  if (!value) return "";
  return value
    .toString()
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
};

export default function BuyCoursesTab() {
  const router = useRouter();
  const videoRef = useRef(null);
  const studentRef = useRef(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const [allCourses, setAllCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [student, setStudent] = useState(null);
  const [wishlistCourseIds, setWishlistCourseIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const fetchWishlistState = useCallback(async () => {
    try {
      const studentRes = await axios.get(`${API_BASE}/api/v1/students/isstudent`, {
        withCredentials: true,
      });

      if (studentRes.data?.student) {
        const currentStudent = studentRes.data.student;
        setStudent(currentStudent);
        studentRef.current = currentStudent;

        const wishlistRes = await axios.get(
          `${API_BASE}/api/v1/students/get-wishlist/${currentStudent._id}`,
          { withCredentials: true }
        );

        setWishlistCourseIds(wishlistRes.data?.wishlist || []);
      } else {
        setStudent(null);
        studentRef.current = null;
        setWishlistCourseIds([]);
      }
    } catch (error) {
      setStudent(null);
      studentRef.current = null;
      setWishlistCourseIds([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    setAllCourses(dummyCourses);
    setCategories(dummyCategories);
    setLoading(false);

    const fetchData = async () => {
      try {
        const [coursesResponse, categoriesResponse] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/courses`),
          axios.get(`${API_BASE}/categories`),
        ]);

        if (
          coursesResponse.status === "fulfilled" &&
          Array.isArray(coursesResponse.value.data) &&
          coursesResponse.value.data.length > 0
        ) {
          setAllCourses(coursesResponse.value.data);
        }

        if (categoriesResponse.status === "fulfilled") {
          const apiCategories =
            categoriesResponse.value.data?.categories || categoriesResponse.value.data;

          if (Array.isArray(apiCategories) && apiCategories.length > 0) {
            setCategories(apiCategories);
          }
        }
      } catch (error) {
        // Keep fallback data silently.
      }
    };

    fetchData();
    fetchWishlistState();

    const unsubscribe = wishlistEventManager.subscribe(({ studentId }) => {
      if (studentRef.current?._id === studentId) {
        fetchWishlistState();
      }
    });

    return () => unsubscribe();
  }, [API_BASE, fetchWishlistState]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay errors.
      });
    }
  }, []);

  const effectiveCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories
        .map((cat) => cat.category)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    }

    return Array.from(new Set(allCourses.map((course) => course.category).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [allCourses, categories]);

  const priceBounds = useMemo(() => {
    if (allCourses.length === 0) return { min: 0, max: 0 };

    const prices = allCourses
      .map((course) => getDisplayPricing(course).finalPrice)
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) return { min: 0, max: 0 };

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [allCourses]);

  useEffect(() => {
    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
  }, [priceBounds.max, priceBounds.min]);

  const courseIndexMap = useMemo(() => {
    const map = new Map();
    allCourses.forEach((course, index) => {
      const key = course._id || course.slug || course.title || `course-${index}`;
      map.set(key, index);
    });
    return map;
  }, [allCourses]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return allCourses.filter((course) => {
      const { finalPrice, hasDiscount } = getDisplayPricing(course);

      const matchesSearch =
        !normalizedSearch ||
        (course.title || "").toLowerCase().includes(normalizedSearch) ||
        stripHtml(course.description || "").toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(course.category);

      const matchesLevel =
        selectedLevels.length === 0 || selectedLevels.includes(course.level);

      const matchesPrice =
        finalPrice >= priceRange.min && finalPrice <= priceRange.max;

      const matchesDiscount = !showDiscountOnly || hasDiscount;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel &&
        matchesPrice &&
        matchesDiscount
      );
    });
  }, [
    allCourses,
    search,
    selectedCategories,
    selectedLevels,
    priceRange.max,
    priceRange.min,
    showDiscountOnly,
  ]);

  const sortedCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const list = [...filteredCourses];

    return list.sort((a, b) => {
      const pricingA = getDisplayPricing(a);
      const pricingB = getDisplayPricing(b);

      if (sortBy === "price-asc") {
        return pricingA.finalPrice - pricingB.finalPrice;
      }

      if (sortBy === "price-desc") {
        return pricingB.finalPrice - pricingA.finalPrice;
      }

      if (sortBy === "discount-desc") {
        return pricingB.discountPercent - pricingA.discountPercent;
      }

      if (sortBy === "newest") {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
      }

      const titleA = (a.title || "").toLowerCase();
      const titleB = (b.title || "").toLowerCase();

      const ratingA = toNumber(a.rating ?? a.averageRating, 0);
      const ratingB = toNumber(b.rating ?? b.averageRating, 0);

      const relevanceA =
        pricingA.discountPercent * 3 +
        ratingA * 10 +
        (normalizedSearch && titleA.startsWith(normalizedSearch) ? 8 : 0) +
        (normalizedSearch && titleA.includes(normalizedSearch) ? 5 : 0);

      const relevanceB =
        pricingB.discountPercent * 3 +
        ratingB * 10 +
        (normalizedSearch && titleB.startsWith(normalizedSearch) ? 8 : 0) +
        (normalizedSearch && titleB.includes(normalizedSearch) ? 5 : 0);

      if (relevanceA !== relevanceB) return relevanceB - relevanceA;

      const keyA = a._id || a.slug || a.title;
      const keyB = b._id || b.slug || b.title;
      return (courseIndexMap.get(keyA) ?? 0) - (courseIndexMap.get(keyB) ?? 0);
    });
  }, [courseIndexMap, filteredCourses, search, sortBy]);

  const displayCourses = useMemo(() => sortedCourses, [sortedCourses]);

  const toggleCategory = useCallback((categoryName) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((category) => category !== categoryName)
        : [...prev, categoryName]
    );
  }, []);

  const toggleLevel = useCallback((level) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((item) => item !== level) : [...prev, level]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedLevels([]);
    setShowDiscountOnly(false);
    setSortBy("relevance");
    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
  }, [priceBounds.max, priceBounds.min]);

  const handleMinPriceChange = (value) => {
    const nextMin = Number(value);
    setPriceRange((prev) => ({
      min: Math.min(nextMin, prev.max),
      max: prev.max,
    }));
  };

  const handleMaxPriceChange = (value) => {
    const nextMax = Number(value);
    setPriceRange((prev) => ({
      min: prev.min,
      max: Math.max(nextMax, prev.min),
    }));
  };

  const handleCourseNavigate = (course) => {
    router.push(getCoursePath(course));
  };

  const toggleLike = async (courseId) => {
    try {
      if (!student) {
        const result = await Swal.fire({
          title: "Login Required",
          text: "Please login to add courses to your wishlist.",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Login",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#1f2937",
          cancelButtonColor: "#d1d5db",
        });

        if (result.isConfirmed) {
          window.location.href = "/student-login?redirect=course";
        }
        return;
      }

      const studentId = student._id;
      const isLiked = wishlistCourseIds.includes(courseId);

      if (isLiked) {
        await axios.delete(
          `${API_BASE}/api/v1/students/remove-from-wishlist/${studentId}/${courseId}`,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE}/api/v1/students/add-to-wishlist/${studentId}`,
          { courseId },
          { withCredentials: true }
        );
      }

      await fetchWishlistState();
      wishlistEventManager.notifyChange(studentId, courseId, isLiked ? "removed" : "added");
    } catch (error) {
      let errorMessage = "Failed to update wishlist. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Please login to add courses to your wishlist.";
      } else if (error.response?.status === 404) {
        errorMessage = "Course or student not found.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || "Invalid request. Please try again.";
      }

      await Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
    }
  };

  const FilterPanel = ({ isMobile = false }) => (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Category</h3>
          <span className="text-xs text-slate-500">{selectedCategories.length} selected</span>
        </div>
        <div className="max-h-48 space-y-2 overflow-auto pr-1">
          {effectiveCategories.map((category) => (
            <label key={category} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-700"
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Skill Level</h3>
        <div className="space-y-2">
          {skillLevels.map((level) => (
            <label key={level} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selectedLevels.includes(level)}
                onChange={() => toggleLevel(level)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-700"
              />
              <span>{level}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Price Range</h3>
          <span className="text-xs font-medium text-slate-600">
            Rs {priceRange.min.toLocaleString()} - Rs {priceRange.max.toLocaleString()}
          </span>
        </div>

        <div className="space-y-3">
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            value={priceRange.min}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
            disabled={priceBounds.max === priceBounds.min}
            aria-label="Minimum price"
          />
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            value={priceRange.max}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
            disabled={priceBounds.max === priceBounds.min}
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-800">Discounted courses only</span>
          <button
            type="button"
            onClick={() => setShowDiscountOnly((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              showDiscountOnly ? "bg-slate-900" : "bg-slate-300"
            }`}
            aria-pressed={showDiscountOnly}
            aria-label="Toggle discounted courses"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                showDiscountOnly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>

      <button
        type="button"
        onClick={clearAllFilters}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
      >
        Clear All Filters
      </button>

      {isMobile && (
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(false)}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          Apply Filters
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
          <p className="text-sm text-slate-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            loop
            muted
            playsInline
            autoPlay
          >
            <source src="/videos/homehero.mp4" type="video/mp4" />
            <source src="/videos/homehero.webm" type="video/webm" />
          </video>
          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Student Dashboard
            </p>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Buy Courses</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">
              Explore certified programs, compare value quickly, and choose your next learning track.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-center">
            <label className="relative block">
              <span className="sr-only">Search courses</span>
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course title or description"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="sr-only">Sort courses</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={clearAllFilters}
                className="hidden rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 lg:inline-flex"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 lg:hidden"
              >
                <FaFilter className="text-xs" />
                Filters
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-slate-600" aria-live="polite">
            <span>
              {displayCourses.length} course{displayCourses.length === 1 ? "" : "s"} found
            </span>
            {(selectedCategories.length > 0 ||
              selectedLevels.length > 0 ||
              showDiscountOnly ||
              search.trim() ||
              priceRange.min !== priceBounds.min ||
              priceRange.max !== priceBounds.max) && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <FaCheck className="text-[10px]" />
                Filters active
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FaTags className="text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">Filter Courses</h2>
              </div>
              <FilterPanel />
            </div>
          </aside>

          <div>
            {displayCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">No courses match your filters</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Try adjusting search or filters to see more courses.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {displayCourses.map((course, index) => {
                  const pricing = getDisplayPricing(course);
                  const imageSrc = resolveCourseImage(course, API_BASE);
                  const inWishlist = wishlistCourseIds.includes(course._id);

                  return (
                    <article
                      key={course._id || index}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt={course.title || "Course"}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            className="object-cover transition duration-300 group-hover:scale-[1.03]"
                            priority={index < 2}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            Course image
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(course._id);
                          }}
                          className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 ${
                            inWishlist
                              ? "border-amber-300 text-amber-500"
                              : "border-slate-200 text-slate-500 hover:text-amber-500"
                          }`}
                          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <FaStar />
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {course.category || "General"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {course.level || "Professional"}
                          </span>
                        </div>

                        <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold text-slate-900">
                          {course.title || "Untitled Course"}
                        </h3>
                        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600">
                          {stripHtml(course.description) ||
                            "Comprehensive curriculum with practical learning outcomes."}
                        </p>

                        <div className="mt-4 flex items-end justify-between">
                          <div>
                            <p className="text-lg font-bold text-slate-900">
                              Rs {pricing.finalPrice.toLocaleString()}
                            </p>
                            {pricing.hasDiscount && pricing.originalPrice > pricing.finalPrice && (
                              <p className="text-xs text-slate-500 line-through">
                                Rs {pricing.originalPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                          {pricing.discountPercent > 0 ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {pricing.discountPercent}% OFF
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                              Standard
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCourseNavigate(course)}
                          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
                        >
                          View Details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/45"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                aria-label="Close filters"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
            <FilterPanel isMobile />
          </div>
        </div>
      )}
    </section>
  );
}
