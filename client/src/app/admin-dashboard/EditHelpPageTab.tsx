"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import { FaSave, FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";

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

interface SupportContact {
  phone: { number: string; hours: string };
  email: { address: string; responseTime: string };
}

interface FormData {
  hero: HeroData;
  categories: Category[];
  support: SupportContact;
  metaTitle: string;
  metaDescription: string;
}

const ICON_OPTIONS = [
  "FaQuestionCircle",
  "FaGraduationCap",
  "FaCreditCard",
  "FaUser",
  "FaBook",
  "FaCertificate",
];

const emptyCategory = (): Category => ({
  title: "",
  icon: "FaQuestionCircle",
  faqs: [{ question: "", answer: "" }],
});

interface EditHelpPageTabProps {
  onBack: () => void;
  helpPageId?: string;
}

export default function EditHelpPageTab({ onBack, helpPageId }: EditHelpPageTabProps) {
  const isNew = !helpPageId || helpPageId === "new";
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    hero: {
      title: "Help Centre",
      subtitle: "Find answers to common questions and get support",
      button1: { text: "Contact Support", link: "/contact" },
      button2: { text: "Browse Courses", link: "/course" },
    },
    categories: [emptyCategory()],
    support: {
      phone: { number: "+91 97736 10185", hours: "Mon-Fri, 9 AM - 6 PM" },
      email: { address: "info@iicpa.in", responseTime: "Response within 24 hours" },
    },
    metaTitle: "Help Centre | IICPA Institute",
    metaDescription: "Find answers to common questions about IICPA Institute.",
  });

  useEffect(() => {
    if (!isNew) loadExisting();
    else loadActive();
  }, [helpPageId]);

  const loadActive = async () => {
    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/v1/website/faq`);
      const data = await res.json();
      if (data?.hero) {
        setForm({
          hero: data.hero,
          categories: data.categories || [emptyCategory()],
          support: data.support || {
            phone: { number: "+91 97736 10185", hours: "Mon-Fri, 9 AM - 6 PM" },
            email: { address: "info@iicpa.in", responseTime: "Response within 24 hours" },
          },
          metaTitle: data.meta?.title || "",
          metaDescription: data.meta?.description || "",
        });
      }
    } catch {
      // use defaults
    }
  };

  const loadExisting = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/v1/website/faq/admin/${helpPageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setForm({
          hero: d.hero,
          categories: d.categories || [emptyCategory()],
          metaTitle: d.metaTitle || "",
          metaDescription: d.metaDescription || "",
        });
      }
    } catch {
      toast.error("Failed to load help page data");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const payload = {
        hero: form.hero,
        categories: form.categories,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
      };

      let res;
      if (isNew) {
        res = await fetch(`${API_BASE}/v1/website/faq/admin/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/v1/website/faq/admin/${helpPageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        toast.success(isNew ? "Help page created!" : "Help page updated!");
        onBack();
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch {
      toast.error("Failed to save help page");
    } finally {
      setSaving(false);
    }
  };

  // Hero handlers
  const setHero = (field: string, value: string) =>
    setForm((f) => ({ ...f, hero: { ...f.hero, [field]: value } }));

  const setHeroButton = (btn: "button1" | "button2", field: "text" | "link", value: string) =>
    setForm((f) => ({
      ...f,
      hero: { ...f.hero, [btn]: { ...f.hero[btn], [field]: value } },
    }));

  // Category handlers
  const addCategory = () =>
    setForm((f) => ({ ...f, categories: [...f.categories, emptyCategory()] }));

  const removeCategory = (idx: number) =>
    setForm((f) => ({ ...f, categories: f.categories.filter((_, i) => i !== idx) }));

  const setCategoryField = (idx: number, field: keyof Category, value: any) =>
    setForm((f) => {
      const cats = [...f.categories];
      cats[idx] = { ...cats[idx], [field]: value };
      return { ...f, categories: cats };
    });

  // FAQ handlers
  const addFaq = (catIdx: number) =>
    setCategoryField(catIdx, "faqs", [
      ...form.categories[catIdx].faqs,
      { question: "", answer: "" },
    ]);

  const removeFaq = (catIdx: number, faqIdx: number) =>
    setCategoryField(
      catIdx,
      "faqs",
      form.categories[catIdx].faqs.filter((_, i) => i !== faqIdx)
    );

  const setFaqField = (catIdx: number, faqIdx: number, field: "question" | "answer", value: string) => {
    const faqs = [...form.categories[catIdx].faqs];
    faqs[faqIdx] = { ...faqs[faqIdx], [field]: value };
    setCategoryField(catIdx, "faqs", faqs);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
            <FaArrowLeft className="text-lg" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isNew ? "Create Help Page" : "Edit Help Page"}
            </h1>
            <p className="text-sm text-gray-500">Updates the /help page on the website</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium"
        >
          <FaSave /> {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-700">Hero Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <input
              value={form.hero.title}
              onChange={(e) => setHero("title", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Subtitle</label>
            <textarea
              value={form.hero.subtitle}
              onChange={(e) => setHero("subtitle", e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Button 1 Text</label>
            <input
              value={form.hero.button1.text}
              onChange={(e) => setHeroButton("button1", "text", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Button 1 Link</label>
            <input
              value={form.hero.button1.link}
              onChange={(e) => setHeroButton("button1", "link", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Button 2 Text</label>
            <input
              value={form.hero.button2.text}
              onChange={(e) => setHeroButton("button2", "text", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Button 2 Link</label>
            <input
              value={form.hero.button2.link}
              onChange={(e) => setHeroButton("button2", "link", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-700">SEO / Meta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Meta Title</label>
            <input
              value={form.metaTitle}
              onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Meta Description</label>
            <input
              value={form.metaDescription}
              onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">FAQ Categories</h2>
          <button
            onClick={addCategory}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <FaPlus /> Add Category
          </button>
        </div>

        {form.categories.map((cat, catIdx) => (
          <div key={catIdx} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Category Title</label>
                  <input
                    value={cat.title}
                    onChange={(e) => setCategoryField(catIdx, "title", e.target.value)}
                    placeholder="e.g. General Questions"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Icon</label>
                  <select
                    value={cat.icon}
                    onChange={(e) => setCategoryField(catIdx, "icon", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ICON_OPTIONS.map((ico) => (
                      <option key={ico} value={ico}>{ico}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeCategory(catIdx)}
                className="mt-6 text-red-500 hover:text-red-700"
              >
                <FaTrash />
              </button>
            </div>

            {/* FAQs */}
            <div className="space-y-3 pl-2 border-l-2 border-blue-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">FAQs</p>
              {cat.faqs.map((faq, faqIdx) => (
                <div key={faqIdx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        value={faq.question}
                        onChange={(e) => setFaqField(catIdx, faqIdx, "question", e.target.value)}
                        placeholder="Question"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(e) => setFaqField(catIdx, faqIdx, "answer", e.target.value)}
                        placeholder="Answer"
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeFaq(catIdx, faqIdx)}
                      className="mt-1 text-red-400 hover:text-red-600"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addFaq(catIdx)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <FaPlus className="text-xs" /> Add FAQ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save bottom */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
        >
          <FaSave /> {saving ? "Saving..." : "Save Help Page"}
        </button>
      </div>
    </div>
  );
}
