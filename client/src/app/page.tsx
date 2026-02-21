import React from "react";
import { Metadata } from "next";
import HeroSection from "./components/HeroSection";
import NewsletterSection from "./components/Newsletter";
import Footer from "./components/Footer";
import BlogSection from "./components/BlogsSection";
import LiveClassSection from "./components/LiveClassSection";
import YellowStatsStrip from "./components/YellowStrip";
import AboutUsSection from "./components/AboutUsSection";
import CoursesSection from "./components/CourseSection";
import TestimonialSection from "./components/TestimonialSection";
import ContactSection from "./components/ContactSection";
import Header from "./components/Header";
import AlertMarquee from "./components/AlertMarquee";
import WhyIICPA from "./components/WhyIICPA";
import SearchCenter from "./components/SearchCenter";
import ScrollbarController from "./components/ScrollbarController";

export const metadata: Metadata = {
  title: "IICPA Institute - Best Accounting & Finance Institute in India",
  description:
    "Professional accounting, taxation, GST, and finance training with live sessions, digital hub, and placement support. Join India's leading accounting institute.",
  keywords:
    "accounting institute, finance courses, GST training, Tally courses, CA preparation, accounting education, finance certification",
  openGraph: {
    title: "IICPA Institute - Best Accounting & Finance Institute in India",
    description:
      "Professional accounting, taxation, GST, and finance training with live sessions, digital hub, and placement support.",
    url: "https://iicpa.in",
    siteName: "IICPA Institute",
    images: [
      {
        url: "https://iicpa.in/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "IICPA Institute - Best Accounting & Finance Institute",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IICPA Institute - Best Accounting & Finance Institute in India",
    description:
      "Professional accounting, taxation, GST, and finance training with live sessions, digital hub, and placement support.",
    images: ["https://iicpa.in/images/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const page = () => {
  return (
    <>
      <ScrollbarController />
      <div>
        <Header />
        <HeroSection />
        <AboutUsSection />

        <CoursesSection />
        <WhyIICPA />
        <SearchCenter />
        <BlogSection />
        <YellowStatsStrip />
        <LiveClassSection />
        <TestimonialSection />
        <NewsletterSection />
        <ContactSection />
        <Footer />
      </div>
    </>
  );
};

export default page;
