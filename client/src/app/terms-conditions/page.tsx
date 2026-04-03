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
  subsections: Subsection[];
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  businessHours: string;
}

interface TermsAndConditionsData {
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  updatedAt?: string;
}

export default function TermsAndConditionsPage() {
  const [termsData, setTermsData] = useState<TermsAndConditionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTermsAndConditions = async () => {
      try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/terms-and-conditions/active`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch terms and conditions');
        }

        const result = await response.json();
        
        const termsPayload = extractPolicyData<TermsAndConditionsData>(result);
        if (termsPayload) {
          setTermsData(termsPayload);
        } else {
          throw new Error(result.message || 'Failed to fetch terms and conditions');
        }
      } catch (err) {
        console.error('Error fetching terms and conditions:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTermsAndConditions();
  }, []);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3cd664] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Terms & Conditions...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Content</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#3cd664] text-white px-6 py-2 rounded-lg hover:bg-[#2fb854] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!termsData) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Content Available</h2>
            <p className="text-gray-600">Terms & Conditions content is not available at the moment.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {termsData.title}
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {termsData.lastUpdated}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {termsData.sections.map((section, sectionIndex) => (
              <section key={sectionIndex}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                
                {section.content && (
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {section.content}
                  </p>
                )}

                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-4">
                    {section.subsections.map((subsection, subsectionIndex) => (
                      <div key={subsectionIndex}>
                        {subsection.title && (
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {subsection.title}
                          </h3>
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
              </section>
            ))}

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms & Conditions, please contact us at:
                <br />
                Email: {termsData.contactInfo.email}
                <br />
                Phone: {termsData.contactInfo.phone}
                <br />
                Address: {termsData.contactInfo.address}
                <br />
                Business Hours: {termsData.contactInfo.businessHours}
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
