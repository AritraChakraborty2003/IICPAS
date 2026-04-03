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
  businessHours: string;
}

interface RefundPolicyData {
  _id?: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const RefundPolicyPage = () => {
  const [refundPolicy, setRefundPolicy] = useState<RefundPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRefundPolicy();
  }, []);

  const fetchRefundPolicy = async () => {
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/refund-policy/active`);
      if (!response.ok) throw new Error("Failed to load refund policy");
      const data = await response.json();
      const policyData = extractPolicyData<RefundPolicyData>(data);

      if (policyData) {
        setRefundPolicy(policyData);
      } else {
        setError("Failed to load refund policy");
      }
    } catch (error) {
      console.error("Error fetching refund policy:", error);
      setError("Error loading refund policy");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading refund policy...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !refundPolicy) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
            <p className="text-xl text-gray-600 mb-8">Last updated: January 2025</p>
            <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
              <p className="text-gray-600">
                {error || "Refund policy not available at the moment. Please try again later."}
              </p>
            </div>
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
              {refundPolicy.title}
            </h1>
            <p className="text-xl text-gray-600">Last updated: {refundPolicy.lastUpdated}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {refundPolicy.sections.map((section, sectionIndex) => (
              <section key={sectionIndex}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {section.content}
                </p>

                {/* Subsections */}
                {section.subsections && section.subsections.map((subsection, subsectionIndex) => (
                  <div key={subsectionIndex} className="ml-4 mb-4">
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

                {/* Section List Items */}
                {section.listItems && section.listItems.length > 0 && (
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    {section.listItems.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <p className="text-gray-600 leading-relaxed">
                For refund requests or questions about this policy, please
                contact us at:
                <br />
                Email: {refundPolicy.contactInfo.email}
                <br />
                Phone: {refundPolicy.contactInfo.phone}
                <br />
                Address: {refundPolicy.contactInfo.address}
                <br />
                <br />
                <strong>Business Hours:</strong> {refundPolicy.contactInfo.businessHours}
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RefundPolicyPage;
