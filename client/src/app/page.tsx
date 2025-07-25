import React from "react";
import HeroSection from "./components/HeroSection";
import NewsletterSection from "./components/Newsletter";
import Footer from "./components/Footer";
import BlogSection from "./components/BlogsSection";
import LiveClassSection from "./components/LiveClassSection";
import YellowStatsStrip from "./components/YellowStrip";
import AboutUsSection from "./components/AboutUsSection";
import CoursesSection from "./components/CourseSection";
import TestimonialSection from "./components/TestimonialSection";
import CourseCategorySection from "./components/CourseCategorySection";
import ContactSection from "./components/ContactSection";
import Header from "./components/Header";

const page = () => {
  return (
    <>
      <div className="pb-20">
        <Header />
        <HeroSection />
        <AboutUsSection />
        <CoursesSection />
        <BlogSection />
        <YellowStatsStrip />
        <CourseCategorySection />
        <LiveClassSection />
        <TestimonialSection />
        <NewsletterSection />
        <ContactSection />
      </div>
    </>
  );
};

export default page;
