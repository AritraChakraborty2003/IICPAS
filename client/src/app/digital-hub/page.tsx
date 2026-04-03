import { redirect } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getSingleParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const sanitize = (value: string) => {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
};

const extractCourseRecord = (payload: unknown): Record<string, unknown> | null => {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as {
    course?: Record<string, unknown>;
    data?: Record<string, unknown> | { course?: Record<string, unknown> };
  };

  if (candidate.course && typeof candidate.course === "object") {
    return candidate.course;
  }

  if (
    candidate.data &&
    typeof candidate.data === "object" &&
    "course" in candidate.data &&
    candidate.data.course &&
    typeof candidate.data.course === "object"
  ) {
    return candidate.data.course;
  }

  if (candidate.data && typeof candidate.data === "object" && !Array.isArray(candidate.data)) {
    return candidate.data;
  }

  return candidate;
};

async function resolveCourseSlug(courseIdentifier: string): Promise<string | null> {
  const normalized = sanitize(courseIdentifier);
  if (!normalized) return null;

  try {
    const url = `${API_BASE.replace(/\/$/, "")}/api/courses/${encodeURIComponent(
      normalized
    )}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) return null;

    const payload = await response.json();
    const courseRecord = extractCourseRecord(payload);
    const slug = courseRecord?.slug;
    const fallbackId = courseRecord?._id;

    if (typeof slug === "string" && slug.trim()) return slug.trim();
    if (typeof fallbackId === "string" && fallbackId.trim()) return fallbackId.trim();
    return null;
  } catch {
    return null;
  }
}

export default async function LegacyDigitalHubRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawCourseId = getSingleParam(resolvedSearchParams.courseId);
  const rawDemo = getSingleParam(resolvedSearchParams.demo);
  const rawChapterId = getSingleParam(resolvedSearchParams.chapterId);

  if (!rawCourseId) {
    redirect("/demo-digital-hub");
  }

  const courseSlug = await resolveCourseSlug(rawCourseId);

  if (!courseSlug) {
    redirect("/demo-digital-hub");
  }

  const isDemo = rawDemo === "true";
  const safeSlug = encodeURIComponent(courseSlug);
  const safeChapter = rawChapterId ? encodeURIComponent(sanitize(rawChapterId)) : "";

  const basePath = isDemo ? `/digital-hub/demo/${safeSlug}` : `/digital-hub/${safeSlug}`;
  const targetPath = safeChapter ? `${basePath}/${safeChapter}` : basePath;

  redirect(targetPath);
}
