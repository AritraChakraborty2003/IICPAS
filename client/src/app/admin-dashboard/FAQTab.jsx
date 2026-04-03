import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaQuestionCircle, FaGraduationCap, FaCreditCard, FaUser, FaBook, FaCertificate, FaPlus, FaEdit, FaTrash, FaSave, FaChevronDown, FaChevronUp } from "react-icons/fa";

const API_BASE = getApiBase();

const iconOptions = [
  { value: "FaQuestionCircle", label: "Question Circle", icon: <FaQuestionCircle /> },
  { value: "FaGraduationCap", label: "Graduation Cap", icon: <FaGraduationCap /> },
  { value: "FaCreditCard", label: "Credit Card", icon: <FaCreditCard /> },
  { value: "FaUser", label: "User", icon: <FaUser /> },
  { value: "FaBook", label: "Book", icon: <FaBook /> },
  { value: "FaCertificate", label: "Certificate", icon: <FaCertificate /> },
];

export default function FAQTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/v1/website/faq`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching FAQ data:", error);
      // Set default data if API fails
      setData({
        hero: {
          title: "Frequently Asked Questions",
          subtitle: "Find answers to common questions about our courses, admissions, and services. Can't find what you're looking for? Contact us for personalized assistance.",
          button1: { text: "Contact Support", link: "/contact" },
          button2: { text: "Browse Courses", link: "/course" },
          backgroundGradient: { from: "from-blue-200", via: "via-white", to: "to-indigo-200" },
          textColor: "text-gray-800"
        },
        categories: [
          {
            title: "General Questions",
            icon: "FaQuestionCircle",
            faqs: [
              {
                question: "What is IICPA Institute?",
                answer: "IICPA Institute is a leading online education platform specializing in finance and accounting courses. We provide comprehensive training programs, practical simulations, and career guidance to help students excel in their professional journey."
              },
              {
                question: "How do I get started?",
                answer: "Getting started is easy! Simply browse our courses, create an account, and enroll in the program that interests you. You can also contact our support team for personalized guidance on choosing the right course for your career goals."
              }
            ]
          },
          {
            title: "Courses & Learning",
            icon: "FaGraduationCap",
            faqs: [
              {
                question: "What courses do you offer?",
                answer: "We offer a wide range of courses including GST training, accounting fundamentals, tax preparation, financial analysis, and specialized certification programs. All courses are designed with practical applications in mind."
              },
              {
                question: "How long are the courses?",
                answer: "Course duration varies depending on the program. Most courses range from 4-12 weeks, with flexible learning schedules that accommodate working professionals and students."
              }
            ]
          }
        ],
        meta: {
          title: "FAQ - Frequently Asked Questions | IICPA Institute",
          description: "Find answers to common questions about IICPA Institute courses, admissions, payments, and support. Get help with your learning journey.",
          keywords: ["FAQ", "questions", "help", "support", "courses", "admissions", "IICPA"]
        }
      });
      toast.error("Using default data - API connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("No authentication token found. Please log in again.");
        return;
      }
      
      console.log("Saving FAQ with token:", token ? "Token exists" : "No token");
      await axios.post(`${API_BASE}/v1/website/faq/admin/create`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        withCredentials: true
      });
      toast.success("FAQ updated successfully!");
    } catch (error) {
      console.error("Error saving FAQ:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
      } else {
        toast.error("Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  const handleButtonChange = (buttonNum, field, value) => {
    setData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [`button${buttonNum}`]: {
          ...prev.hero[`button${buttonNum}`],
          [field]: value
        }
      }
    }));
  };

  const handleCategoryChange = (index, field, value) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map((category, i) => 
        i === index ? { ...category, [field]: value } : category
      )
    }));
  };

  const handleFAQChange = (categoryIndex, faqIndex, field, value) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map((category, i) => 
        i === categoryIndex ? {
          ...category,
          faqs: category.faqs.map((faq, j) => 
            j === faqIndex ? { ...faq, [field]: value } : faq
          )
        } : category
      )
    }));
  };

  const addCategory = () => {
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, {
        title: "New Category",
        icon: "FaQuestionCircle",
        faqs: []
      }]
    }));
  };

  const removeCategory = (index) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const addFAQ = (categoryIndex) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map((category, i) => 
        i === categoryIndex ? {
          ...category,
          faqs: [...category.faqs, {
            question: "New Question",
            answer: "New Answer"
          }]
        } : category
      )
    }));
  };

  const removeFAQ = (categoryIndex, faqIndex) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map((category, i) => 
        i === categoryIndex ? {
          ...category,
          faqs: category.faqs.filter((_, j) => j !== faqIndex)
        } : category
      )
    }));
  };

  const toggleCategoryExpanded = (index) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">Failed to load data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">FAQ Page Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <FaSave />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Hero Section</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={data.hero.title}
              onChange={(e) => handleInputChange('hero', 'title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <textarea
              value={data.hero.subtitle}
              onChange={(e) => handleInputChange('hero', 'subtitle', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Button 1 Text</label>
            <input
              type="text"
              value={data.hero.button1.text}
              onChange={(e) => handleButtonChange(1, 'text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Button 1 Link</label>
            <input
              type="text"
              value={data.hero.button1.link}
              onChange={(e) => handleButtonChange(1, 'link', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Button 2 Text</label>
            <input
              type="text"
              value={data.hero.button2.text}
              onChange={(e) => handleButtonChange(2, 'text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Button 2 Link</label>
            <input
              type="text"
              value={data.hero.button2.link}
              onChange={(e) => handleButtonChange(2, 'link', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">FAQ Categories</h3>
          <button
            onClick={addCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus />
            Add Category
          </button>
        </div>

        <div className="space-y-4">
          {data.categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => toggleCategoryExpanded(categoryIndex)}
                  className="flex items-center gap-2 text-lg font-medium text-gray-900 hover:text-blue-600"
                >
                  {expandedCategories[categoryIndex] ? <FaChevronUp /> : <FaChevronDown />}
                  Category {categoryIndex + 1}: {category.title}
                </button>
                <button
                  onClick={() => removeCategory(categoryIndex)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <FaTrash />
                </button>
              </div>

              {expandedCategories[categoryIndex] && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category Title</label>
                      <input
                        type="text"
                        value={category.title}
                        onChange={(e) => handleCategoryChange(categoryIndex, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                      <select
                        value={category.icon}
                        onChange={(e) => handleCategoryChange(categoryIndex, 'icon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {iconOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium">FAQs</h4>
                      <button
                        onClick={() => addFAQ(categoryIndex)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                      >
                        <FaPlus />
                        Add FAQ
                      </button>
                    </div>

                    <div className="space-y-3">
                      {category.faqs.map((faq, faqIndex) => (
                        <div key={faqIndex} className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                              <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => handleFAQChange(categoryIndex, faqIndex, 'question', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
                              <textarea
                                value={faq.answer}
                                onChange={(e) => handleFAQChange(categoryIndex, faqIndex, 'answer', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={() => removeFAQ(categoryIndex, faqIndex)}
                                className="text-red-600 hover:text-red-800 p-2"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">SEO Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
            <input
              type="text"
              value={data.meta?.title || ""}
              onChange={(e) => handleInputChange('meta', 'title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
            <input
              type="text"
              value={Array.isArray(data.meta?.keywords) ? data.meta.keywords.join(', ') : data.meta?.keywords || ""}
              onChange={(e) => handleInputChange('meta', 'keywords', e.target.value.split(',').map(k => k.trim()))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
            <textarea
              value={data.meta?.description || ""}
              onChange={(e) => handleInputChange('meta', 'description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
