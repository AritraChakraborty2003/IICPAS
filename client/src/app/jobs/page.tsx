import React from "react";
import { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CourseJobs from "./CourseJobs";
import ApplyJobsWithModalApply from "./ AllJobsWithModalApply";

export const metadata: Metadata = {
  title: "Jobs & Careers - IICPA Institute",
  description:
    "Find accounting and finance job opportunities. Explore career options in accounting, taxation, auditing, and finance with our job portal.",
  keywords:
    "accounting jobs, finance careers, job opportunities, accounting positions, finance jobs, career opportunities, job portal",
  openGraph: {
    title: "Jobs & Careers - IICPA Institute",
    description:
      "Find accounting and finance job opportunities. Explore career options in accounting, taxation, auditing, and finance with our job portal.",
    url: "https://iicpa.in/jobs",
    siteName: "IICPA Institute",
    images: [
      {
        url: "https://iicpa.in/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Jobs & Careers - IICPA Institute",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobs & Careers - IICPA Institute",
    description:
      "Find accounting and finance job opportunities. Explore career options in accounting, taxation, auditing, and finance with our job portal.",
    images: ["https://iicpa.in/images/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const page = () => {
  return (
    <div>
      <Header />
      <CourseJobs />
      <ApplyJobsWithModalApply />
      <Footer />
    </div>
  );
};

export default page;
