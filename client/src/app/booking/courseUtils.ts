import { BookingCourse, RawCourse } from "./types";

const FALLBACK_IMAGE = "/images/a1.jpeg";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const normalizeCourseImage = (image?: string): string => {
  if (!image || typeof image !== "string") return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(image)) return image.replace(/^http:\/\//i, "https://");
  if (image.startsWith("/uploads/")) return `https://api.iicpa.in${image}`;
  if (image.startsWith("/")) return image;
  return `https://api.iicpa.in/${image}`;
};

export const isActiveCourse = (status?: string): boolean => {
  if (!status) return true;
  return status.toLowerCase() === "active";
};

export const normalizeCourse = (course: RawCourse): BookingCourse | null => {
  const id = String(course._id || course.id || "").trim();
  if (!id) return null;

  const title = (course.title || "Untitled Course").trim();
  const slug =
    String(course.slug || "")
      .trim()
      .toLowerCase() ||
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .trim();

  const recordedFinal = toNumber(course.pricing?.recordedSession?.finalPrice);
  const recordedBase = toNumber(course.pricing?.recordedSession?.price);
  const liveFinal = toNumber(course.pricing?.liveSession?.finalPrice);
  const liveBase = toNumber(course.pricing?.liveSession?.price);
  const legacyPrice = toNumber(course.price) ?? 0;

  const effectivePrice = recordedFinal ?? recordedBase ?? liveFinal ?? liveBase ?? legacyPrice;

  return {
    id,
    slug: slug || id,
    title,
    image: normalizeCourseImage(course.image),
    category: (course.category || "General").trim() || "General",
    description: course.description || "",
    status: course.status || "Active",
    createdAt: course.createdAt || new Date(0).toISOString(),
    recordedPrice: recordedFinal ?? recordedBase ?? null,
    recordedOriginalPrice:
      recordedFinal !== null && recordedBase !== null && recordedBase > recordedFinal
        ? recordedBase
        : null,
    livePrice: liveFinal ?? liveBase ?? null,
    liveOriginalPrice:
      liveFinal !== null && liveBase !== null && liveBase > liveFinal ? liveBase : null,
    effectivePrice,
  };
};

export const normalizeCoursesPayload = (payload: unknown): BookingCourse[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { courses?: unknown[] })?.courses)
    ? (payload as { courses: unknown[] }).courses
    : Array.isArray((payload as { data?: unknown[] })?.data)
    ? (payload as { data: unknown[] }).data
    : Array.isArray((payload as { data?: { courses?: unknown[] } })?.data?.courses)
    ? (payload as { data: { courses: unknown[] } }).data.courses
    : [];

  return list
    .map((item) => normalizeCourse(item as RawCourse))
    .filter((item): item is BookingCourse => Boolean(item))
    .filter((course) => isActiveCourse(course.status));
};

export const getPriceBounds = (courses: BookingCourse[]) => {
  if (!courses.length) return { min: 0, max: 0 };
  const prices = courses.map((course) => course.effectivePrice).filter((price) => price >= 0);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

export const getDefaultSessionType = (course: BookingCourse): "recorded" | "live" => {
  if (course.recordedPrice !== null) return "recorded";
  return "live";
};
