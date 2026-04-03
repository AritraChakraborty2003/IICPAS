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
  businessHours?: string;
}

interface IICPAReviewData {
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
}

const IICPAReviewPage = () => {
  const [iicpaReview, setIicpaReview] = useState<IICPAReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIICPAReview = async () => {
      try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/iicpa-review/active`);
        if (!response.ok) throw new Error("Failed to load IICPA Review");
        const data = await response.json();
        const reviewData = extractPolicyData<IICPAReviewData>(data);

        if (reviewData) {
          setIicpaReview(reviewData);
        } else {
          setError('Failed to load IICPA Review');
        }
      } catch (err) {
        setError('Error loading IICPA Review');
        console.error('Error fetching IICPA Review:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIICPAReview();
  }, []);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading IICPA Review...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !iicpaReview) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-lg">{error || 'IICPA Review not found'}</p>
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
              {iicpaReview.title}
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {iicpaReview.lastUpdated}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {iicpaReview.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                
                {section.content && (
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {section.content}
                  </p>
                )}

                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-6">
                    {section.subsections.map((subsection, subIndex) => (
                      <div key={subIndex}>
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

                {section.listItems && section.listItems.length > 0 && (
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    {section.listItems.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.title === "Contact Us" && (
                  <div className="mt-4">
                    <p className="text-gray-600 leading-relaxed">
                      <br />
                      Email: {iicpaReview.contactInfo.email}
                      <br />
                      Phone: {iicpaReview.contactInfo.phone}
                      <br />
                      Address: {iicpaReview.contactInfo.address}
                      {iicpaReview.contactInfo.businessHours && (
                        <>
                          <br />
                          Business Hours: {iicpaReview.contactInfo.businessHours}
                        </>
                      )}
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default IICPAReviewPage;
