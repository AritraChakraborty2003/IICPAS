/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle,
  Download,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import LoginModal from "../../components/LoginModal";
import SimpleCheckoutModal from "../../../components/SimpleCheckoutModal";
import jsPDF from "jspdf";
import axios from "axios";
import { useRouter } from "next/navigation";
import { formatTextAsParagraphs } from "../../../lib/blogUtils";

const SERVER_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = `${SERVER_BASE}/api`;

type Topic = { _id?: string; title?: string } | string;
type Chapter = { _id?: string; title: string; topics?: Topic[] };

type IncludedCourse = {
  _id: string;
  title: string;
  category?: string;
  level?: string;
  price?: number;
  duration?: string;
  chapters?: Chapter[];
};

type GroupPricingResponse = {
  _id: string;
  groupName: string;
  slug: string;
  level: string;
  courseIds: IncludedCourse[];
  groupPrice: number;
  description?: string;
  image?: string;
  pricing: {
    recordedSession: {
      price: number;
      finalPrice: number;
      discount?: number;
      title?: string;
      buttonText?: string;
    };
    liveSession: {
      price: number;
      finalPrice: number;
      discount?: number;
      title?: string;
      buttonText?: string;
    };
    recordedSessionCenter?: {
      price: number;
      finalPrice: number;
      discount?: number;
      title?: string;
      buttonText?: string;
    };
    liveSessionCenter?: {
      price: number;
      finalPrice: number;
      discount?: number;
      title?: string;
      buttonText?: string;
    };
  };
  averageRating?: number;
  totalRatings?: number;
};

export default function GroupPackagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [pkg, setPkg] = useState<GroupPricingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"syllabus" | "pricing">(
    "syllabus"
  );
  const [student, setStudent] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        let data;
        try {
          // Try fetching by slug first
          const response = await axios.get<GroupPricingResponse>(
            `${API_BASE}/group-pricing/slug/${slug}`
          );
          data = response.data;
        } catch {
          // If slug fails, try by ID as fallback
          const response = await axios.get<GroupPricingResponse>(
            `${API_BASE}/group-pricing/${slug}`
          );
          data = response.data;
        }
        setPkg(data);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to load package.");
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [slug]);

  const checkStudent = useCallback(async () => {
    try {
      const res = await axios.get(`${SERVER_BASE}/api/v1/students/isstudent`, {
        withCredentials: true,
      });
      setStudent(res.data.student);
    } catch {
      setStudent(null);
    }
  }, []);

  useEffect(() => {
    checkStudent();
  }, [checkStudent]);



  const toggle = (i: number) =>
    setExpanded((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  const imgSrc = (src?: string) => {
    if (!src) return "/images/a1.jpeg";
    if (src.startsWith("http")) return src;
    if (src.startsWith("/uploads")) return `${SERVER_BASE}${src}`;
    return src;
  };

  const avg =
    typeof pkg?.averageRating === "number" && pkg?.averageRating > 0
      ? pkg.averageRating
      : 4.7;
  const totalR =
    typeof pkg?.totalRatings === "number" && pkg?.totalRatings > 0
      ? pkg.totalRatings
      : 449;

  const generatePDF = () => {
    if (!pkg) return;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text(`${pkg.groupName} - Syllabus`, 20, y);
    y += 10;
    const cleanDesc = (pkg.description || "").replace(/<[^>]*>/g, "");
    const lines = doc.splitTextToSize(cleanDesc, 170);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 10;
    pkg.courseIds.forEach((c, idx) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. ${c.title}`, 20, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Duration: ${c.duration || "N/A"}`, 20, y);
      y += 6;
      doc.text(`Level: ${c.level || "N/A"}`, 20, y);
      y += 6;
      if (c.chapters?.length) {
        c.chapters.forEach((ch) => {
          doc.text(`• ${ch.title}`, 26, y);
          y += 5;
          ch.topics?.forEach((t) => {
            const txt = typeof t === "string" ? t : t?.title || "";
            doc.text(`- ${txt}`, 32, y);
            y += 4;
          });
        });
      }
      y += 6;
    });
    doc.save(`${pkg.groupName.replace(/\s+/g, "_")}_Syllabus.pdf`);
  };

  const handleEnroll = async (
    packageId: string,
    sessionType:
      | "recordedSession"
      | "liveSession"
      | "recordedSessionCenter"
      | "liveSessionCenter"
  ) => {
    if (!student) {
      setShowLogin(true);
      return;
    }
    
    // Redirect to checkout page
    router.push(`/checkout?type=group_package&packageId=${packageId}&sessionType=${sessionType}`);
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Loading group package...</p>
        </div>
      </div>
    );

  if (err || !pkg)
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-32 text-center text-gray-700">
          <h1 className="text-2xl font-bold">Package Not Found</h1>
          <p>{err}</p>
        </div>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-32 sm:pt-40 lg:pt-48 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 ml-16">
          {/* LEFT */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-3 inline-block rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                {pkg.level}
              </div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                {pkg.groupName}
              </h1>

              {/* Ratings */}
              <div className="mt-3 mb-5 flex items-center gap-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(avg)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {avg.toFixed(1)}
                </span>
                <span className="text-xs text-gray-600">
                  ({totalR} reviews)
                </span>
              </div>

              <div
                className="mb-6 text-sm leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{
                  __html:
                    formatTextAsParagraphs(pkg.description) ||
                    "<p>No description available.</p>",
                }}
              />

              {/* Tabs */}
              <div className="mb-6 flex overflow-x-auto rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setActiveTab("syllabus")}
                  className={`flex-1 min-w-[120px] rounded-md py-2 text-sm font-medium ${
                    activeTab === "syllabus"
                      ? "bg-white text-green-600 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Syllabus
                </button>
                <button
                  onClick={() => setActiveTab("pricing")}
                  className={`flex-1 min-w-[120px] rounded-md py-2 text-sm font-medium ${
                    activeTab === "pricing"
                      ? "bg-white text-green-600 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pricing
                </button>
              </div>

              {/* --- Syllabus Tab --- */}
              {activeTab === "syllabus" && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-lg font-bold text-transparent">
                      Package Syllabus
                    </h3>
                    <button
                      onClick={generatePDF}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      View full Syllabus
                    </button>
                  </div>

                  {pkg.courseIds.map((course, i) => (
                    <div
                      key={course._id}
                      className="mb-3 ml-4 mr-4 rounded-lg border border-gray-100 shadow-md hover:scale-[1.01] transition"
                    >
                      <button
                        onClick={() => toggle(i)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {course.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {course.category} • {course.level}
                          </p>
                        </div>
                        {expanded.includes(i) ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      {expanded.includes(i) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="px-3 pb-3"
                        >
                          {course.chapters?.length ? (
                            <ul className="space-y-1">
                              {course.chapters.map((ch) => (
                                <li key={ch._id || ch.title}>
                                  <p className="text-sm font-medium text-gray-800">
                                    {ch.title}
                                  </p>
                                  <div className="mt-1 space-y-1 pl-3">
                                    {ch.topics?.map((t, j) => {
                                      const txt =
                                        typeof t === "string"
                                          ? t
                                          : t?.title || "";
                                      return (
                                        <div
                                          key={j}
                                          className="flex items-center text-xs text-gray-600"
                                        >
                                          <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                                          {txt}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500">
                              Syllabus coming soon.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* --- Pricing Tab --- */}
              {activeTab === "pricing" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(pkg.pricing).map(([key, val], index) => {
                    const isGreen = index % 2 === 0;
                    const gradient = isGreen
                      ? "from-green-50 via-white to-green-100"
                      : "from-blue-50 via-white to-blue-100";
                    const border = isGreen
                      ? "border-green-200"
                      : "border-blue-200";
                    const text = isGreen ? "text-green-700" : "text-blue-700";
                    const buttonGradient = isGreen
                      ? "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      : "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700";

                    return (
                      <div
                        key={key}
                        className={`rounded-2xl border ${border} p-5 shadow-lg text-center transition hover:scale-[1.02] bg-gradient-to-b ${gradient}`}
                      >
                        <p className={`text-[11px] font-bold ${text}`}>
                          {val.title}
                        </p>
                        <p className={`text-2xl font-extrabold ${text}`}>
                          ₹{val.finalPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 line-through">
                          ₹{val.price.toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleEnroll(pkg._id, key as any)}
                          disabled={isPaying}
                          className={`mt-3 w-full rounded-lg py-2 text-sm font-bold text-white bg-gradient-to-r ${buttonGradient} shadow-md disabled:opacity-60`}
                        >
                          {isPaying ? "Processing..." : val.buttonText}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 overflow-hidden rounded-2xl bg-white/90 shadow-xl backdrop-blur">
              <img
                src={imgSrc(pkg.image)}
                alt={pkg.groupName}
                className="h-48 w-full object-cover"
              />
              <div className="p-6 text-center">
                <p className="text-xs font-semibold text-gray-500">
                  Get access to this package in
                </p>
                <p className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-base font-extrabold text-transparent">
                  DIGITAL HUB
                </p>
              </div>

              {/* RIGHT pricing grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 pb-6">
                {Object.entries(pkg.pricing).map(([key, val], index) => {
                  const isGreen = index % 2 === 0;
                  const gradient = isGreen
                    ? "from-green-50 via-white to-green-100"
                    : "from-blue-50 via-white to-blue-100";
                  const border = isGreen
                    ? "border-green-200"
                    : "border-blue-200";
                  const text = isGreen ? "text-green-700" : "text-blue-700";
                  const buttonGradient = isGreen
                    ? "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    : "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700";

                  return (
                    <div
                      key={key}
                      className={`rounded-2xl border ${border} p-4 text-center shadow-md bg-gradient-to-b ${gradient}`}
                    >
                      <p className={`text-[11px] font-bold ${text}`}>
                        {val.title}
                      </p>
                      <p className={`text-xl font-extrabold ${text}`}>
                        ₹{val.finalPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 line-through">
                        ₹{val.price.toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleEnroll(pkg._id, key as any)}
                        disabled={isPaying}
                        className={`mt-3 w-full rounded-lg py-2 text-xs font-bold text-white bg-gradient-to-r ${buttonGradient} shadow-md disabled:opacity-60`}
                      >
                        {isPaying ? "Processing..." : val.buttonText}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
      <SimpleCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        student={student}
      />
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => {
          setShowLogin(false);
          setTimeout(checkStudent, 500);
        }}
      />
    </div>
  );
}
