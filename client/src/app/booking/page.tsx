import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThinHeroSection from "../components/ThinHeroSection";
import BookingPageClient from "./BookingPageClient";
import { normalizeCoursesPayload } from "./courseUtils";
import { BookingCourse } from "./types";

export const metadata: Metadata = {
  title: "Book Courses - IICPA Institute",
  description:
    "Browse all IICPA courses and book the one that matches your career goals.",
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
      <ThinHeroSection title="Book Your Course" breadcrumb="Home > Book Course" />
      <BookingPageClient initialCourses={initialCourses} />
      <Footer />
    </div>
  );
}
