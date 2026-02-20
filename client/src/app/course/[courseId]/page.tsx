import React from "react";
import { Metadata } from "next";
import CourseDetailClient from "./CourseDetailClient";
import CourseNotFound from "./CourseNotFound";

interface CourseData {
  _id?: string;
  title?: string;
  description?: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string;
  category?: string;
  level?: string;
  [key: string]: unknown;
}

interface CourseFetchResult {
  course: CourseData | null;
  status: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const sanitizeCourseId = (rawCourseId: string) => {
  try {
    return decodeURIComponent(rawCourseId).trim();
  } catch {
    return rawCourseId.trim();
  }
};

async function getCourseBySlug(rawCourseId: string): Promise<CourseFetchResult> {
  const normalizedCourseId = sanitizeCourseId(rawCourseId);
  if (!normalizedCourseId) {
    return { course: null, status: 400 };
  }

  try {
    const url = `${API_BASE.replace(/\/$/, "")}/api/courses/${encodeURIComponent(
      normalizedCourseId
    )}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return { course: null, status: response.status };
    }

    const payload = await response.json();
    if (!payload || typeof payload !== "object") {
      return { course: null, status: 502 };
    }

    return { course: payload as CourseData, status: 200 };
  } catch (error) {
    console.error("Error fetching course data:", error);
    return { course: null, status: 500 };
  }
}

// Generate dynamic metadata based on course data
export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const normalizedCourseId = sanitizeCourseId(resolvedParams.courseId);
  const { course } = await getCourseBySlug(normalizedCourseId);

  // Fallback metadata if course not found
  if (!course) {
    return {
      title: "Course Details - IICPA Institute",
      description:
        "Explore detailed course information, syllabus, pricing, and enrollment options. Join our comprehensive accounting and finance courses.",
      keywords:
        "course details, accounting courses, finance training, course syllabus, course pricing, course enrollment",
      openGraph: {
        title: "Course Details - IICPA Institute",
        description:
          "Explore detailed course information, syllabus, pricing, and enrollment options. Join our comprehensive accounting and finance courses.",
        url: "https://iicpa.in/course",
        siteName: "IICPA Institute",
        images: [
          {
            url: "https://iicpa.in/images/og-default.jpg",
            width: 1200,
            height: 630,
            alt: "Course Details - IICPA Institute",
          },
        ],
        locale: "en_IN",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Course Details - IICPA Institute",
        description:
          "Explore detailed course information, syllabus, pricing, and enrollment options. Join our comprehensive accounting and finance courses.",
        images: ["https://iicpa.in/images/og-default.jpg"],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  // Dynamic metadata based on course data
  const courseTitle = course.title || "Course";
  const courseDescription = course.description
    ? course.description.replace(/<[^>]*>/g, "").substring(0, 160) + "..."
    : "Explore detailed course information, syllabus, pricing, and enrollment options. Join our comprehensive accounting and finance courses.";

  const courseImage = course.image
    ? course.image.startsWith("/uploads")
      ? `https://iicpa.in${course.image}`
      : `https://iicpa.in${course.image}`
    : "https://iicpa.in/images/og-default.jpg";

  // Use admin meta fields with fallbacks
  const metaTitle = course.metaTitle || `${courseTitle} - IICPA Institute`;
  const metaDescription = course.metaDescription || courseDescription;
  const courseUrl = `https://iicpa.in/course/${encodeURIComponent(
    normalizedCourseId
  )}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords:
      course.seoKeywords ||
      `${courseTitle.toLowerCase()}, ${
        course.category || "accounting"
      } course, finance training, ${
        course.level || "professional"
      } level, course syllabus, course pricing, course enrollment, IICPA Institute`,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: courseUrl,
      siteName: "IICPA Institute",
      images: [
        {
          url: courseImage,
          width: 1200,
          height: 630,
          alt: `${courseTitle} - Course Preview`,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [courseImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = await params;
  const normalizedCourseId = sanitizeCourseId(resolvedParams.courseId);
  const { course, status } = await getCourseBySlug(normalizedCourseId);

  if (!course) {
    if (status === 404 || status === 400) {
      return <CourseNotFound courseId={normalizedCourseId} />;
    }

    return (
      <CourseNotFound
        courseId={normalizedCourseId}
        title="Unable to Load Course"
        description="We couldn't load this course right now. Please try again in a moment."
      />
    );
  }

  return (
    <CourseDetailClient
      courseId={normalizedCourseId}
      initialCourse={course}
    />
  );
}
