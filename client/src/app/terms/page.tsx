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

interface TermsOfServiceData {
  _id: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  updatedAt?: string;
}

const TermsOfServicePage = () => {
  const [termsOfService, setTermsOfService] = useState<TermsOfServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTermsOfService = async () => {
      try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/terms-of-service/active`);
        if (!response.ok) throw new Error("Failed to load terms of service");
        const data = await response.json();
        const policyData = extractPolicyData<TermsOfServiceData>(data);

        if (policyData) {
          setTermsOfService(policyData);
        } else {
          setError('Failed to load terms of service');
        }
      } catch (err) {
        setError('Error loading terms of service');
        console.error('Error fetching terms of service:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTermsOfService();
  }, []);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Terms of Service...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !termsOfService) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-lg">{error || 'Terms of service not found'}</p>
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
              {termsOfService.title}
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {termsOfService.lastUpdated}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {termsOfService.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {section.content}
                  </p>
                )}
                {section.subsections.map((subsection, subIndex) => (
                  <div key={subIndex} className="mb-4">
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
                      <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                        {subsection.listItems.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            ))}

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
                <br />
                Email: {termsOfService.contactInfo.email}
                <br />
                Phone: {termsOfService.contactInfo.phone}
                <br />
                Address: {termsOfService.contactInfo.address}
                <br />
                Business Hours: {termsOfService.contactInfo.businessHours}
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
