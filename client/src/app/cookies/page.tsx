"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const getApiBase = () => {
  const configuredBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080/api";
  const trimmed = configuredBase.trim().replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const extractPolicyData = <T,>(payload: any): T | null => {
  if (!payload) return null;
  if (payload.success && payload.data) return payload.data as T;
  if (payload.data && typeof payload.data === "object") return payload.data as T;
  if (typeof payload === "object") return payload as T;
  return null;
};

interface Subsection {
  title?: string;
  content?: string;
  listItems?: string[];
}

interface Section {
  title: string;
  content: string;
  subsections?: Subsection[];
  listItems?: string[];
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

interface CookiePolicyData {
  _id?: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const CookiePolicyPage = () => {
  const [cookiePolicy, setCookiePolicy] = useState<CookiePolicyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCookiePolicy();
  }, []);

  const fetchCookiePolicy = async () => {
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/cookie-policy/active`);
      
      if (response.ok) {
        const data = await response.json();
        const policyData = extractPolicyData<CookiePolicyData>(data);
        if (policyData) {
          setCookiePolicy(policyData);
        } else {
          console.error("Failed to fetch cookie policy:", data.message);
        }
      } else {
        console.error("Failed to fetch cookie policy:", response.status);
      }
    } catch (error) {
      console.error("Error fetching cookie policy:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fallback content if no policy is found
  const defaultPolicy: CookiePolicyData = {
    title: "Cookie Policy",
    lastUpdated: "January 2025",
    sections: [
      {
        title: "What Are Cookies",
        content: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners about how their site is being used.",
        subsections: []
      }
    ],
    contactInfo: {
      email: "privacy@iicpa.com",
      phone: "+91 98765 43210",
      address: "123 Education Street, Learning City, LC 12345"
    },
    isActive: true
  };

  const policy = cookiePolicy || defaultPolicy;

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {policy.title}
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {policy.lastUpdated}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {policy.sections.map((section, sectionIndex) => (
              <section key={sectionIndex}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {section.content}
                </p>
                
                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-6">
                    {section.subsections.map((subsection, subsectionIndex) => (
                      <div key={subsectionIndex}>
                        {subsection.title && (
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{subsection.title}</h3>
                        )}
                        {subsection.content && (
                          <p className="text-gray-600 leading-relaxed mb-2">
                            {subsection.content}
                          </p>
                        )}
                        {subsection.listItems && subsection.listItems.length > 0 && (
                          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                            {subsection.listItems.map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.listItems && section.listItems.length > 0 && (
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    {section.listItems.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
                <br />
                Email: {policy.contactInfo.email}
                <br />
                Phone: {policy.contactInfo.phone}
                <br />
                Address: {policy.contactInfo.address}
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CookiePolicyPage;
