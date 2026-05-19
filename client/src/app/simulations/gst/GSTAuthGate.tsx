"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getApiBase } from "@/lib/apiBase";

type GSTAuthGateProps = {
  children: React.ReactNode;
};

const ADMIN_STORAGE_KEYS = ["adminToken", "adminUser"];
const GST_COURSE_PATTERN = /\bgst\b/i;
const UNPROTECTED_PATHS = [
  "/simulations/gst/e-way-bill",
  "/simulations/gst/e-way-bill-login",
  "/simulations/gst/e-way-bill-dashboard",
  "/simulations/gst/e-way-bill-5",
  "/simulations/gst/gst-computation-1",
  "/simulations/gst/gst-computation-2",
  "/simulations/gst/gst-computation-3",
  "/simulations/gst/gst-computation-4",
  "/simulations/gst/gstr-1a-1",
  "/simulations/gst/gstr-2a-2b-1",
];

const normalizeCourseList = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as { courses?: unknown[] })?.courses)) {
    return (payload as { courses: unknown[] }).courses;
  }
  if (Array.isArray((payload as { data?: unknown[] })?.data)) {
    return (payload as { data: unknown[] }).data;
  }
  if (
    (payload as { data?: { courses?: unknown[] } })?.data &&
    Array.isArray((payload as { data: { courses?: unknown[] } }).data.courses)
  ) {
    return (payload as { data: { courses: unknown[] } }).data.courses;
  }
  return [];
};

const isGstCourse = (course: unknown) => {
  if (!course || typeof course !== "object") return false;
  const record = course as {
    title?: string;
    slug?: string;
    category?: string;
    name?: string;
  };
  const haystack = [
    record.title,
    record.slug,
    record.category,
    record.name,
  ]
    .filter(Boolean)
    .join(" ");

  return GST_COURSE_PATTERN.test(haystack);
};

export default function GSTAuthGate({ children }: GSTAuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname ?? "";
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // E-way bill simulations are public and should not call the auth backend.
    // Also bypass auth check during development / local testing.
    if (
      process.env.NODE_ENV !== "production" ||
      (typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")) ||
      UNPROTECTED_PATHS.some((path) => currentPathname.startsWith(path))
    ) {
      setCheckingAuth(false);
      return;
    }

    let isMounted = true;
    let aborted = false;

    const clearAdminAuth = () => {
      if (typeof window === "undefined") {
        return;
      }

      ADMIN_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
    };

    const redirectToLogin = () => {
      clearAdminAuth();
      router.replace("/student-login");
    };

    const redirectToStudentDashboard = () => {
      router.replace("/student-dashboard?tab=courses");
    };

    const studentHasGstCourse = async (studentId: string) => {
      const response = await fetch(
        `${getApiBase()}/courses/student-courses/${studentId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        return false;
      }

      const payload = await response.json();
      const courseList = normalizeCourseList(payload);
      return courseList.some(isGstCourse);
    };

    const checkAccess = async () => {
      try {
        const adminToken =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;

        if (adminToken) {
          const adminResponse = await fetch(`${getApiBase()}/employees/profile`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          if (adminResponse.ok) {
            if (isMounted) {
              setCheckingAuth(false);
            }
            return;
          }

          clearAdminAuth();
        }

        const studentResponse = await fetch(
          `${getApiBase()}/v1/students/isstudent`,
          {
            credentials: "include",
          }
        );

        if (studentResponse.ok) {
          const studentJson = await studentResponse.json();
          const studentId = studentJson?.student?._id;

          if (!studentId) {
            if (!aborted) {
              redirectToLogin();
            }
            return;
          }

          if (await studentHasGstCourse(studentId)) {
            if (isMounted) {
              setCheckingAuth(false);
            }
            return;
          }

          if (isMounted) {
            setCheckingAuth(false);
            redirectToStudentDashboard();
          }
          return;
        }

        if (!aborted) {
          redirectToLogin();
        }
      } catch {
        if (!aborted) {
          redirectToLogin();
        }
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
      aborted = true;
    };
  }, [currentPathname, router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e7f4ff,_#f7fbff_40%,_#eef4fa_100%)] text-slate-700">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}
