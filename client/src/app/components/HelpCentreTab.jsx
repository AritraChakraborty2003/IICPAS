"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  FaQuestionCircle, 
  FaSearch, 
  FaBook, 
  FaVideo, 
  FaPhone, 
  FaEnvelope, 
  FaComments,
  FaChevronDown,
  FaChevronUp,
  FaExternalLinkAlt,
  FaGraduationCap,
  FaCreditCard,
  FaUser,
  FaCertificate
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// Icon mapping for dynamic categories
const iconMap = {
  FaQuestionCircle: <FaQuestionCircle />,
  FaGraduationCap: <FaGraduationCap />,
  FaCreditCard: <FaCreditCard />,
  FaUser: <FaUser />,
  FaBook: <FaBook />,
  FaCertificate: <FaCertificate />,
};

export default function HelpCentreTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [faqCategories, setFaqCategories] = useState([]);
  const [heroData, setHeroData] = useState({
    title: "Help Centre",
    subtitle: "Find answers to common questions and get support"
  });

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const fetchHelpData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/v1/website/faq`);
      if (res.data) {
        if (res.data.hero) setHeroData(res.data.hero);
        if (res.data.categories) setFaqCategories(res.data.categories);
      }
    } catch (error) {
      console.error("Error fetching help data:", error);
      toast.error("Failed to load help center content");
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchHelpData();
  }, [fetchHelpData]);

  // Flattened FAQs for searching
  const allFAQs = faqCategories.flatMap(cat => 
    cat.faqs.map(faq => ({ ...faq, categoryTitle: cat.title }))
  );

  const filteredFAQs = allFAQs.filter(faq => {
    const matchesCategory = selectedCategory === "all" || faq.categoryTitle === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Loading help center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{heroData.title}</h1>
        <p className="text-gray-600">{heroData.subtitle}</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaVideo className="text-blue-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Updates & Tutorials</h3>
          </div>
          <p className="text-gray-600 mb-4">Watch step-by-step video guides to get started</p>
          <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
            Watch Now <FaExternalLinkAlt className="text-sm" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaComments className="text-green-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Support Ticket</h3>
          </div>
          <p className="text-gray-600 mb-4">Found an issue? Submit a support ticket</p>
          <button className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2">
            Submit Ticket <FaExternalLinkAlt className="text-sm" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaEnvelope className="text-purple-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Email Support</h3>
          </div>
          <p className="text-gray-600 mb-4">Send us an email and we'll respond within 24 hours</p>
          <button className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2">
            Send Email <FaExternalLinkAlt className="text-sm" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaBook /> All Topics
          </button>
          {faqCategories.map((category, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(category.title)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.title
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {iconMap[category.icon] || <FaQuestionCircle />}
              {category.title}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, idx) => (
              <div key={idx} className="p-6">
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-left flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <h3 className="text-lg font-medium text-gray-900 pr-4">{faq.question}</h3>
                  {expandedFAQ === idx ? (
                    <FaChevronUp className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <FaChevronDown className="text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                {expandedFAQ === idx && (
                  <div className="mt-4 pl-2">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No FAQs found matching your search criteria.
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Still Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaPhone className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Phone Support</p>
              <p className="text-gray-600">+91 97736 10185</p>
              <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaEnvelope className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Email Support</p>
              <p className="text-gray-600">info@iicpa.in</p>
              <p className="text-sm text-gray-500">Response within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
