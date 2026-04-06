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

const getApiBase = () => {
  const configuredBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.iicpa.in/api";

  const trimmed = configuredBase.trim().replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

async function getInitialCourses(): Promise<BookingCourse[]> {
  const API_BASE = getApiBase();
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

async function getInitialGroupPricing(): Promise<Array<Record<string, unknown>>> {
  const API_BASE = getApiBase();
  try {
    const response = await fetch(`${API_BASE}/group-pricing`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = await response.json();
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.groupPricing)) return payload.groupPricing;
    return [];
  } catch (error) {
    console.error("Failed to load group pricing on server:", error);
    return [];
  }
}

async function getInitialCategories(): Promise<Array<{ _id?: string; category?: string }>> {
  const API_BASE = getApiBase();
  try {
    const response = await fetch(`${API_BASE}/categories`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = await response.json();
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.categories)) return payload.categories;
    return [];
  } catch (error) {
    console.error("Failed to load categories on server:", error);
    return [];
  }
}

export default async function BookingPage() {
  const [initialCourses, initialGroupPricing, initialCategories] = await Promise.all([
    getInitialCourses(),
    getInitialGroupPricing(),
    getInitialCategories(),
  ]);

  return (
    <div>
      <Header />
      <ThinHeroSection title="Register & Pre-Book Courses" breadcrumb="Home > Book Course" />
      <BookingPageClient
        initialCourses={initialCourses}
        initialGroupPricing={initialGroupPricing}
        initialCategories={initialCategories}
      />
      <Footer />
    </div>
  );
}
