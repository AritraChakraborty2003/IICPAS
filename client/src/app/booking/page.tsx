import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BookingPageClient from "./BookingPageClient";

export const metadata: Metadata = {
  title: "Book Courses - IICPA Institute",
  description:
    "Browse all IICPA courses and book the one that matches your career goals.",
};

export default function BookingPage() {
  return (
    <div className="pt-10">
      <Header />
      <BookingPageClient />
      <Footer />
    </div>
  );
}
