"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import GroupCourseCard from "../components/GroupCourseCard";
import BookingCourseCard from "./BookingCourseCard";
import BookingSkeletonGrid from "./BookingSkeletonGrid";
import { getDefaultSessionType, getPriceBounds, normalizeCoursesPayload } from "./courseUtils";
import { BookingCourse, BookingFilterState } from "./types";

type BookingPageClientProps = {
  initialCourses: BookingCourse[];
  initialGroupPricing: Array<Record<string, unknown>>;
  initialCategories: Array<{ _id?: string; category?: string }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.iicpa.in/api";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type RazorpayOrderData = {
  orderId: string;
  amount: number;
  currency?: string;
  key?: string;
};

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name?: string; email?: string; contact?: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
  handler: (response: RazorpayHandlerResponse) => void;
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export default function BookingPageClient({
  initialCourses,
  initialGroupPricing,
  initialCategories,
}: BookingPageClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<BookingCourse[]>(initialCourses);
  const [groupPricing, setGroupPricing] =
    useState<Array<Record<string, unknown>>>(initialGroupPricing);
  const [categoriesData, setCategoriesData] =
    useState<Array<{ _id?: string; category?: string }>>(initialCategories);

  const [loading, setLoading] = useState(initialCourses.length === 0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCourseId, setBookingCourseId] = useState<string | null>(null);
  const [bookingGroupId, setBookingGroupId] = useState<string | null>(null);
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([]);
  const [razorpayReady, setRazorpayReady] = useState(false);

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

  const categories = useMemo(() => {
    if (categoriesData.length > 0) {
      return categoriesData
        .map((item) => (item.category || "").trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    }
    return Array.from(new Set(courses.map((course) => course.category))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [categoriesData, courses]);

  const fetchLatestData = async ({ showLoader = false }: { showLoader?: boolean } = {}) => {
    if (showLoader) setLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const [coursesResponse, categoriesResponse, groupResponse] = await Promise.allSettled([
        fetch(`${API_BASE}/courses`, { cache: "no-store" }),
        fetch(`${API_BASE}/categories`, { cache: "no-store" }),
        fetch(`${API_BASE}/group-pricing`, { cache: "no-store" }),
      ]);

      if (coursesResponse.status === "fulfilled" && coursesResponse.value.ok) {
        const payload = await coursesResponse.value.json();
        setCourses(normalizeCoursesPayload(payload));
      }

      if (categoriesResponse.status === "fulfilled" && categoriesResponse.value.ok) {
        const payload = await categoriesResponse.value.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.categories)
          ? payload.categories
          : [];
        setCategoriesData(list);
      }

      if (groupResponse.status === "fulfilled" && groupResponse.value.ok) {
        const payload = await groupResponse.value.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.groupPricing)
          ? payload.groupPricing
          : [];
        setGroupPricing(list);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError("Unable to refresh courses right now. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLatestData({ showLoader: initialCourses.length === 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    setIsFiltering(true);
    const timeout = setTimeout(() => setIsFiltering(false), 120);
    return () => clearTimeout(timeout);
  }, [filters.search, filters.categories, filters.minPrice, filters.maxPrice, filters.sortBy, selectedGroupNames, loading]);

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

  const filteredGroupPricing = useMemo(() => {
    const searchTerm = deferredSearch.trim().toLowerCase();

    return groupPricing.filter((group) => {
      const groupName = String(group.groupName || group.level || "").toLowerCase();
      const matchesSearch = !searchTerm || groupName.includes(searchTerm);
      const matchesGroup =
        selectedGroupNames.length === 0 ||
        selectedGroupNames.includes(String(group.groupName || group.level || ""));
      return matchesSearch && matchesGroup;
    });
  }, [groupPricing, deferredSearch, selectedGroupNames]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count += 1;
    count += filters.categories.length;
    count += selectedGroupNames.length;
    if (filters.minPrice > priceBounds.min || filters.maxPrice < priceBounds.max) count += 1;
    return count;
  }, [
    filters.search,
    filters.categories.length,
    selectedGroupNames.length,
    filters.minPrice,
    filters.maxPrice,
    priceBounds.min,
    priceBounds.max,
  ]);

  const clearAllFilters = () => {
    setFilters({
      search: "",
      categories: [],
      minPrice: priceBounds.min,
      maxPrice: priceBounds.max,
      sortBy: "relevance",
    });
    setSelectedGroupNames([]);
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

  const ensureStudent = async () => {
    try {
      const studentResponse = await axios.get(`${API_URL}/api/v1/students/isstudent`, {
        withCredentials: true,
      });
      return studentResponse.data?.student ?? null;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        return null;
      }
      throw error;
    }
  };

  const openRazorpay = ({
    order,
    description,
    prefill,
    onSuccess,
    onClose,
  }: {
    order: RazorpayOrderData;
    description: string;
    prefill: { name?: string; email?: string; contact?: string };
    onSuccess: (response: RazorpayHandlerResponse) => Promise<void>;
    onClose: () => void;
  }) => {
    if (!window.Razorpay) {
      throw new Error("Razorpay checkout SDK not loaded");
    }
    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || order?.key,
      amount: order?.amount,
      currency: order?.currency || "INR",
      name: "IICPA Institute",
      description,
      order_id: order?.orderId,
      prefill,
      theme: { color: "#059669" },
      modal: { ondismiss: onClose },
      handler: async (response: RazorpayHandlerResponse) => {
        await onSuccess(response);
      },
    });
    rzp.open();
  };

  const handleBookNow = async (course: BookingCourse) => {
    const sessionType = getDefaultSessionType(course);
    setBookingCourseId(course.id);
    try {
      if (!razorpayReady) {
        toast.error("Payment gateway is loading. Please retry.");
        return;
      }
      const student = await ensureStudent();

      if (!student?._id) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "booking_intent",
            JSON.stringify({
              itemType: "single_course",
              courseId: course.id,
              sessionType,
            })
          );
        }
        router.push(
          `/student-login?redirect=${encodeURIComponent(
            "/booking"
          )}&courseId=${encodeURIComponent(course.id)}&sessionType=${encodeURIComponent(sessionType)}`
        );
        return;
      }

      const orderResponse = await axios.post(
        `${API_URL}/api/v1/course-bookings/create-order`,
        { itemType: "single_course", courseId: course.id, sessionType },
        { withCredentials: true }
      );
      const orderData = orderResponse.data?.data;
      if (!orderData?.orderId) throw new Error("Order creation failed");

      openRazorpay({
        order: orderData,
        description: `Pre-book ${course.title}`,
        prefill: {
          name: student.name || "",
          email: student.email || "",
          contact: student.phone || "",
        },
        onClose: () => setBookingCourseId(null),
        onSuccess: async (response) => {
          try {
            const verifyResponse = await axios.post(
              `${API_URL}/api/v1/course-bookings/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );
            if (verifyResponse.data?.success) {
              toast.success("Booking successful");
              router.push("/student-dashboard?tab=bookings");
            } else {
              toast.error("Payment verification failed");
            }
          } catch (verifyError) {
            const message =
              axios.isAxiosError(verifyError) &&
              typeof verifyError.response?.data?.message === "string"
                ? verifyError.response.data.message
                : "Unable to verify payment";
            toast.error(message);
          } finally {
            setBookingCourseId(null);
          }
        },
      });
    } catch (bookingError) {
      console.error("Booking failed:", bookingError);
      if (axios.isAxiosError(bookingError)) {
        if (bookingError.response?.status === 401 || bookingError.response?.status === 403) {
          toast.error("Please login to continue booking.");
          router.push(`/student-login?redirect=${encodeURIComponent("/booking")}`);
        } else if (bookingError.response?.status === 409) {
          const existingBookingId = bookingError.response?.data?.data?.bookingId;
          toast.error(bookingError.response?.data?.message || "Booking already exists");
          if (existingBookingId) {
            router.push("/student-dashboard?tab=bookings");
          }
        } else {
          toast.error("Unable to book this course right now. Please try again.");
        }
      } else {
        toast.error("Unable to book this course right now. Please try again.");
      }
      setBookingCourseId(null);
    }
  };

  const handleGroupBookNow = async (group: Record<string, unknown>) => {
    const groupId = String(group._id || "");
    setBookingGroupId(groupId);
    try {
      if (!razorpayReady) {
        toast.error("Payment gateway is loading. Please retry.");
        return;
      }
      const student = await ensureStudent();
      if (!student?._id) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "booking_intent",
            JSON.stringify({
              itemType: "group_package",
              groupPackageId: groupId,
            })
          );
        }
        router.push(`/student-login?redirect=${encodeURIComponent("/booking")}`);
        return;
      }

      const orderResponse = await axios.post(
        `${API_URL}/api/v1/course-bookings/create-order`,
        {
          itemType: "group_package",
          groupPackageId: groupId,
        },
        { withCredentials: true }
      );

      const orderData = orderResponse.data?.data;
      if (!orderData?.orderId) throw new Error("Order creation failed");

      openRazorpay({
        order: orderData,
        description: `Pre-book ${String(group.groupName || group.level || "Package")}`,
        prefill: {
          name: student.name || "",
          email: student.email || "",
          contact: student.phone || "",
        },
        onClose: () => setBookingGroupId(null),
        onSuccess: async (response) => {
          try {
            const verifyResponse = await axios.post(
              `${API_URL}/api/v1/course-bookings/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );
            if (verifyResponse.data?.success) {
              toast.success("Package booking successful");
              router.push("/student-dashboard?tab=bookings");
            } else {
              toast.error("Payment verification failed");
            }
          } catch (verifyError) {
            const message =
              axios.isAxiosError(verifyError) &&
              typeof verifyError.response?.data?.message === "string"
                ? verifyError.response.data.message
                : "Unable to verify payment";
            toast.error(message);
          } finally {
            setBookingGroupId(null);
          }
        },
      });
    } catch (bookingError) {
      console.error("Group booking failed:", bookingError);
      if (axios.isAxiosError(bookingError)) {
        if (bookingError.response?.status === 401 || bookingError.response?.status === 403) {
          toast.error("Please login to continue booking.");
          router.push(`/student-login?redirect=${encodeURIComponent("/booking")}`);
        } else if (bookingError.response?.status === 409) {
          toast.error(bookingError.response?.data?.message || "Booking already exists");
          router.push("/student-dashboard?tab=bookings");
        } else {
          toast.error("Unable to pre-book this package right now.");
        }
      } else {
        toast.error("Unable to pre-book this package right now.");
      }
      setBookingGroupId(null);
    }
  };

  const showSkeleton = loading || (isFiltering && (courses.length > 0 || groupPricing.length > 0));

  return (
    <main className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 min-h-screen">
      <section className="max-w-full mx-auto px-3 sm:px-4 pb-14 mr-0 lg:mr-4">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchLatestData({ showLoader: true })}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-1/4 xl:w-1/5 lg:sticky lg:top-24 lg:max-h-screen lg:overflow-y-auto ml-0 lg:ml-8">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 lg:p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Find by Course Name</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, search: event.target.value }))
                  }
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none shadow"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 lg:p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Categories</h3>
              {categories.length === 0 && (
                <div className="text-gray-400 text-sm">No categories</div>
              )}
              {categories.map((category) => (
                <label key={category} className="flex items-center space-x-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="accent-green-600"
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 lg:p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Course Combinations</h3>
              {groupPricing.length === 0 ? (
                <div className="text-gray-400 text-sm">No groups available</div>
              ) : (
                groupPricing.map((group) => {
                  const groupName = String(group.groupName || group.level || "");
                  return (
                    <label
                      key={String(group._id || groupName)}
                      className="flex items-center space-x-2 text-sm mb-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupNames.includes(groupName)}
                        onChange={() =>
                          setSelectedGroupNames((prev) =>
                            prev.includes(groupName)
                              ? prev.filter((name) => name !== groupName)
                              : [...prev, groupName]
                          )
                        }
                        className="accent-green-600"
                      />
                      <span>{groupName}</span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 lg:p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Sort & Price</h3>
              <select
                value={filters.sortBy}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: event.target.value as BookingFilterState["sortBy"],
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low-high">Price low-high</option>
                <option value="price-high-low">Price high-low</option>
                <option value="newest">Newest</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={filters.minPrice}
                  onChange={(event) => setPriceRange(Number(event.target.value), filters.maxPrice)}
                  className="border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={filters.maxPrice}
                  onChange={(event) => setPriceRange(filters.minPrice, Number(event.target.value))}
                  className="border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          <main className="w-full lg:w-3/4 xl:w-4/5">
            <div className="mt-2 mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                {isRefreshing
                  ? "Refreshing courses..."
                  : `${filteredCourses.length} course(s) found`}
              </p>
              <p className="hidden md:block text-xs text-slate-500">
                Group packages included
              </p>
            </div>

            {showSkeleton ? (
              <BookingSkeletonGrid count={9} showFilterSkeleton={loading && courses.length === 0} />
            ) : (
              <div id="booking-courses-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredGroupPricing.length > 0 && (
                  <>
                    <div className="col-span-full pt-4">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Course Packages</h2>
                      <p className="text-gray-600">Complete course bundles with special pricing</p>
                    </div>
                    {filteredGroupPricing.map((group, index) => (
                      <GroupCourseCard
                        key={String(group._id || `group-${index}`)}
                        groupPricing={group}
                        index={index}
                        ctaLabel="Pre-Book Now"
                        onPrimaryAction={handleGroupBookNow}
                        isLoading={bookingGroupId === String(group._id || "")}
                      />
                    ))}
                  </>
                )}

                {filteredCourses.map((course) => (
                  <BookingCourseCard
                    key={course.id}
                    course={course}
                    onBookNow={handleBookNow}
                    isBooking={bookingCourseId === course.id}
                  />
                ))}

                {filteredCourses.length === 0 && filteredGroupPricing.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-slate-200 bg-white py-14 px-6 text-center">
                    <h3 className="text-xl font-bold text-slate-900">
                      No courses or packages match your filters
                    </h3>
                    <p className="mt-2 text-slate-600">
                      Try changing filters or reset to view all options.
                    </p>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </section>
    </main>
  );
}
