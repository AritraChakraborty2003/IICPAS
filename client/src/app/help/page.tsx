import React from "react";
import { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HelpCentreTab from "../components/HelpCentreTab";

export const metadata: Metadata = {
  title: "Help Centre - IICPA Institute",
  description: "Get the support you need for your learning journey at IICPA Institute. Find FAQs, video tutorials, and contact our support team.",
  keywords: "help centre, support, IICPA, FAQs, learning support, technical support",
};

const HelpCenterPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HelpCentreTab />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenterPage;
