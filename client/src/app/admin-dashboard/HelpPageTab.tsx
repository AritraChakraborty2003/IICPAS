"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTrash, FaFileExcel, FaChevronDown, FaChevronUp } from "react-icons/fa";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface FAQ {
  question: string;
  answer: string;
}

interface Category {
  title: string;
  icon: string;
  faqs: FAQ[];
}

interface HeroData {
  title: string;
  subtitle: string;
  button1: { text: string; link: string };
  button2: { text: string; link: string };
}

interface HelpPageData {
  _id?: string;
  hero: HeroData;
  categories: Category[];
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  lastUpdated?: string;
  createdAt?: string;
}

interface HelpPageTabProps {
  onEditHelpPage?: (id: string) => void;
}

export default function HelpPageTab({ onEditHelpPage }: HelpPageTabProps) {
  const [helpPages, setHelpPages] = useState<HelpPageData[]>([]);
  const [currentHelp, setCurrentHelp] = useState<HelpPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    fetchHelpPages();
  }, []);

  const fetchHelpPages = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/v1/website/faq/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data?.length > 0) {
        setHelpPages(data.data);
        setCurrentHelp(data.data[0]);
      } else {
        // Fetch public active version as fallback
        const pubRes = await fetch(`${API_BASE}/v1/website/faq`);
        const pubData = await pubRes.json();
        if (pubData?.hero) {
          setCurrentHelp({ ...pubData, isActive: true });
        }
      }
    } catch (error) {
      console.error("Error fetching help page data:", error);
      toast.error("Error fetching help page data");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      await fetch(`${API_BASE}/v1/website/faq/admin/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Help page activated");
      fetchHelpPages();
    } catch {
      toast.error("Failed to activate");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this help page version?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      await fetch(`${API_BASE}/v1/website/faq/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Deleted successfully");
      fetchHelpPages();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleExportExcel = () => {
    if (!currentHelp) return;
    const rows: any[] = [];
    currentHelp.categories.forEach((cat) => {
      cat.faqs.forEach((faq) => {
        rows.push({ Category: cat.title, Question: faq.question, Answer: faq.answer });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Help FAQs");
    XLSX.writeFile(wb, "help-page-faqs.xlsx");
  };

  const toggleCategory = (idx: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  if (loading) return <div className="p-8 text-gray-500">Loading help page data...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Help Page Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the /help page content, FAQs and hero section</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <FaFileExcel /> Export Excel
          </button>
          <button
            onClick={() => onEditHelpPage?.("new")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <FaPlus /> Add New Version
          </button>
        </div>
      </div>

      {/* Version List */}
      {helpPages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Help Page Versions</h2>
          <div className="space-y-2">
            {helpPages.map((hp) => (
              <div
                key={hp._id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentHelp?._id === hp._id
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
                onClick={() => setCurrentHelp(hp)}
              >
                <div>
                  <p className="font-medium text-gray-800">{hp.hero?.title || "Help Page"}</p>
                  <p className="text-xs text-gray-500">
                    Last updated:{" "}
                    {hp.lastUpdated
                      ? new Date(hp.lastUpdated).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                      : "N/A"}{" "}
                    | Created:{" "}
                    {hp.createdAt
                      ? new Date(hp.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                      : "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditHelpPage?.(hp._id!); }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  {hp.isActive ? (
                    <span className="text-green-600 text-sm font-semibold">Active</span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleActivate(hp._id!); }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(hp._id!); }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Help Page Preview */}
      {currentHelp ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Current Help Page</h2>
            <button
              onClick={() => onEditHelpPage?.(currentHelp._id || "new")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <FaEdit /> Edit
            </button>
          </div>

          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Hero Title</p>
              <p className="text-base font-semibold text-gray-800">{currentHelp.hero?.title}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Hero Subtitle</p>
              <p className="text-sm text-gray-600">{currentHelp.hero?.subtitle}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Button 1</p>
              <p className="text-sm text-gray-700">{currentHelp.hero?.button1?.text} → {currentHelp.hero?.button1?.link}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Button 2</p>
              <p className="text-sm text-gray-700">{currentHelp.hero?.button2?.text} → {currentHelp.hero?.button2?.link}</p>
            </div>
          </div>

          {/* Meta */}
          {currentHelp.metaTitle && (
            <div className="border-b pb-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Meta Title</p>
              <p className="text-sm text-gray-700">{currentHelp.metaTitle}</p>
            </div>
          )}

          {/* FAQ Categories */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-3">
              FAQ Categories ({currentHelp.categories?.length || 0})
            </p>
            <div className="space-y-3">
              {(currentHelp.categories || []).map((cat, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(idx)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                  >
                    <span className="font-medium text-gray-800">
                      {cat.title}{" "}
                      <span className="text-xs text-gray-500 font-normal">({cat.faqs?.length || 0} FAQs)</span>
                    </span>
                    {expandedCategories.has(idx) ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                  </button>
                  {expandedCategories.has(idx) && (
                    <div className="divide-y divide-gray-100">
                      {(cat.faqs || []).map((faq, fIdx) => (
                        <div key={fIdx} className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{faq.question}</p>
                          <p className="text-sm text-gray-500 mt-1">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No help page content found.</p>
          <button
            onClick={() => onEditHelpPage?.("new")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm"
          >
            Create Help Page
          </button>
        </div>
      )}
    </div>
  );
}
