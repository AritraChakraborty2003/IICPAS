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

interface PrivacyPolicyData {
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
}

const PrivacyPolicyPage = () => {
  const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/privacy-policy/active`);
        if (!response.ok) throw new Error("Failed to load privacy policy");
        const data = await response.json();
        const policyData = extractPolicyData<PrivacyPolicyData>(data);

        if (policyData) {
          setPrivacyPolicy(policyData);
        } else {
          setError('Failed to load privacy policy');
        }
      } catch (err) {
        setError('Error loading privacy policy');
        console.error('Error fetching privacy policy:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Privacy Policy...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !privacyPolicy) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-lg">{error || 'Privacy policy not found'}</p>
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
              {privacyPolicy.title}
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {privacyPolicy.lastUpdated}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {privacyPolicy.sections.map((section, index) => (
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
                      Email: {privacyPolicy.contactInfo.email}
                      <br />
                      Phone: {privacyPolicy.contactInfo.phone}
                      <br />
                      Address: {privacyPolicy.contactInfo.address}
                      {privacyPolicy.contactInfo.businessHours && (
                        <>
                          <br />
                          Business Hours: {privacyPolicy.contactInfo.businessHours}
                        </>
                      )}
                    </p>
                  </div>
                )}
              </section>
            ))}

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                Email: {privacyPolicy.contactInfo.email}
                <br />
                Phone: {privacyPolicy.contactInfo.phone}
                <br />
                Address: {privacyPolicy.contactInfo.address}
                {privacyPolicy.contactInfo.businessHours && (
                  <>
                    <br />
                    Business Hours: {privacyPolicy.contactInfo.businessHours}
                  </>
                )}
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
