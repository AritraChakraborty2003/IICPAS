import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThinHeroSection from "../components/ThinHeroSection";
import BookingPageClient from "./BookingPageClient";
import { normalizeCoursesPayload } from "./courseUtils";
import { BookingCourse } from "./types";

export const metadata: Metadata = {
  title: "Register & Pre-Book Courses - IICPA Institute",
  description:
    "Register and pre-book IICPA courses with a modern, fast booking experience.",
};

async function getInitialCourses(): Promise<BookingCourse[]> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.iicpa.in/api";
  try {
    const response = await fetch(`${API_BASE}/courses`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return normalizeCoursesPayload(payload);
  } catch (error) {
    console.error("Failed to load booking courses on server:", error);
    return [];
  }
}

export default async function BookingPage() {
  const initialCourses = await getInitialCourses();

  return (
    <div>
      <Header />
      <ThinHeroSection title="Register & Pre-Book Courses" breadcrumb="Home > Book Course" />
      <BookingPageClient initialCourses={initialCourses} />
      <Footer />
    </div>
  );
}
