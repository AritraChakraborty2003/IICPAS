import React from "react";
import { Metadata } from "next";
import Header from "../components/Header";
import StudentRegister from "../components/StudentRegister";

export const metadata: Metadata = {
  title: "Student Login - IICPA Institute",
  description:
    "Access your student dashboard and continue your learning journey. Login to IICPA Institute to access courses, simulations, and learning resources.",
  keywords:
    "student login, IICPA login, student dashboard, access courses, learning portal, student portal",
  openGraph: {
    title: "Student Login - IICPA Institute",
    description:
      "Access your student dashboard and continue your learning journey. Login to IICPA Institute to access courses, simulations, and learning resources.",
    url: "https://iicpa.in/login",
    siteName: "IICPA Institute",
    images: [
      {
        url: "https://iicpa.in/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Student Login - IICPA Institute",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Login - IICPA Institute",
    description:
      "Access your student dashboard and continue your learning journey. Login to IICPA Institute to access courses, simulations, and learning resources.",
    images: ["https://iicpa.in/images/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LoginPage = () => {
  return (
    <div>
      <Header />
      <StudentRegister />
    </div>
  );
};

export default LoginPage;
