"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import axios from "axios";
import { showSuccess, showError } from "@/utils/sweetAlert";
import { FaSave, FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa";
import { universityCourses, getCourseBySlug } from "@/data/universityCourses";

const API_BASE = getApiBase();

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

interface UniversityCourse {
  _id?: string;
  slug: string;
  name: string;
  category: "UG Programs" | "PG Programs" | "Ph.D Programs";
  about: string;
  eligibility: string[];
  highlights: string[];
  description: string;
  careerProspects: string[];
  duration?: string;
  contactSection: {
    phone: string;
    email: string;
    address: string;
    showForm: boolean;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  isActive?: boolean;
}

export default function UniversityCourseManagementTab() {
  const [courses, setCourses] = useState<UniversityCourse[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<UniversityCourse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "about" | "eligibility" | "description" | "contact"
  >("about");

  // Form states
  const [formData, setFormData] = useState<UniversityCourse>({
    slug: "",
    name: "",
    category: "UG Programs",
    about: "",
    eligibility: [],
    highlights: [],
    description: "",
    careerProspects: [],
    duration: "",
    contactSection: {
      phone: "",
      email: "",
      address: "",
      showForm: true,
    },
    seo: {
      title: "",
      description: "",
      keywords: "",
    },
    isActive: true,
  });

  // Temporary fields for adding list items
  const [newEligibilityItem, setNewEligibilityItem] = useState("");
  const [newHighlightItem, setNewHighlightItem] = useState("");
  const [newCareerItem, setNewCareerItem] = useState("");

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/university-courses`);
      const dbCourses = res.data || [];

      // Create a map of database courses by slug for quick lookup
      const dbCoursesMap = new Map(
        dbCourses.map((c: UniversityCourse) => [c.slug, c])
      );

      // Merge default courses with database courses
      // If a course exists in database, use database version; otherwise use default
      const mergedCourses = universityCourses.map((defaultCourse) => {
        const dbCourse = dbCoursesMap.get(defaultCourse.slug);
        if (dbCourse) {
          // Use database course (has _id, may have been modified)
          return dbCourse;
        }
        // Use default course (no _id, from static data)
        return {
          ...defaultCourse,
          contactSection: {
            phone: "",
            email: "",
            address: "",
            showForm: true,
          },
          isActive: true,
        } as UniversityCourse;
      });

      // Add any database courses that aren't in defaults (for custom courses)
      dbCourses.forEach((dbCourse: UniversityCourse) => {
        const defaultCourseExists = universityCourses.some(
          (c) => c.slug === dbCourse.slug
        );
        if (
          !defaultCourseExists &&
          !mergedCourses.find((c) => c.slug === dbCourse.slug)
        ) {
          mergedCourses.push(dbCourse);
        }
      });

      setCourses(mergedCourses);
      if (mergedCourses.length > 0 && !selectedCourseSlug) {
        setSelectedCourseSlug(mergedCourses[0].slug);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      // On error, use default courses as fallback
      const fallbackCourses = universityCourses.map((course) => ({
        ...course,
        contactSection: {
          phone: "",
          email: "",
          address: "",
          showForm: true,
        },
        isActive: true,
      })) as UniversityCourse[];
      setCourses(fallbackCourses);
      if (fallbackCourses.length > 0 && !selectedCourseSlug) {
        setSelectedCourseSlug(fallbackCourses[0].slug);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch single course
  const fetchCourse = async (slug: string) => {
    try {
      setLoading(true);

      // Try to fetch from database first
      try {
        const res = await axios.get(`${API_BASE}/university-courses/${slug}`);
        const course = res.data;
        setSelectedCourse(course);
        setFormData({
          slug: course.slug || "",
          name: course.name || "",
          category: course.category || "UG Programs",
          about: course.about || "",
          eligibility: course.eligibility || [],
          highlights: course.highlights || [],
          description: course.description || "",
          careerProspects: course.careerProspects || [],
          duration: course.duration || "",
          contactSection: {
            phone: course.contactSection?.phone || "",
            email: course.contactSection?.email || "",
            address: course.contactSection?.address || "",
            showForm: course.contactSection?.showForm !== false,
          },
          seo: {
            title: course.seo?.title || "",
            description: course.seo?.description || "",
            keywords: course.seo?.keywords || "",
          },
          isActive: course.isActive !== false,
        });
        return;
      } catch (apiError: any) {
        // If course not found in database (404), try to load from default courses
        if (apiError.response?.status === 404) {
          const defaultCourse = getCourseBySlug(slug);
          if (defaultCourse) {
            // Use default course data
            const course = {
              ...defaultCourse,
              contactSection: {
                phone: "",
                email: "",
                address: "",
                showForm: true,
              },
              isActive: true,
            } as UniversityCourse;

            setSelectedCourse(course);
            setFormData({
              slug: course.slug || "",
              name: course.name || "",
              category: course.category || "UG Programs",
              about: course.about || "",
              eligibility: course.eligibility || [],
              highlights: course.highlights || [],
              description: course.description || "",
              careerProspects: course.careerProspects || [],
              duration: course.duration || "",
              contactSection: {
                phone: course.contactSection?.phone || "",
                email: course.contactSection?.email || "",
                address: course.contactSection?.address || "",
                showForm: course.contactSection?.showForm !== false,
              },
              seo: {
                title: course.seo?.title || "",
                description: course.seo?.description || "",
                keywords: course.seo?.keywords || "",
              },
              isActive: course.isActive !== false,
            });
            return;
          }
        }
        // Re-throw if it's not a 404 or course not found in defaults
        throw apiError;
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      showError("Error!", "Failed to fetch course details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseSlug) {
      fetchCourse(selectedCourseSlug);
    }
  }, [selectedCourseSlug]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (selectedCourse && selectedCourse._id) {
        // Update existing course
        await axios.put(
          `${API_BASE}/university-courses/${selectedCourseSlug}`,
          formData,
          getAuthHeaders()
        );
        showSuccess("Updated!", "Course updated successfully");
      } else {
        // Create new course
        await axios.post(
          `${API_BASE}/university-courses`,
          formData,
          getAuthHeaders()
        );
        showSuccess("Created!", "Course created successfully");
      }
      await fetchCourses();
      if (selectedCourseSlug) {
        await fetchCourse(selectedCourseSlug);
      }
    } catch (error: any) {
      console.error("Error saving course:", error);
      showError(
        "Error!",
        error.response?.data?.error || "Failed to save course"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddListItem = (
    type: "eligibility" | "highlights" | "careerProspects"
  ) => {
    let newItem = "";
    let setter: (value: string) => void;
    if (type === "eligibility") {
      newItem = newEligibilityItem;
      setter = setNewEligibilityItem;
    } else if (type === "highlights") {
      newItem = newHighlightItem;
      setter = setNewHighlightItem;
    } else {
      newItem = newCareerItem;
      setter = setNewCareerItem;
    }

    if (newItem.trim()) {
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], newItem.trim()],
      }));
      setter("");
    }
  };

  const handleRemoveListItem = (
    type: "eligibility" | "highlights" | "careerProspects",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    setSelectedCourseSlug(slug);
    setActiveTab("about");
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          University Course Management
        </h2>

        {/* Course Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course:
          </label>
          <select
            value={selectedCourseSlug}
            onChange={handleCourseChange}
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select a course...</option>
            {courses.map((course) => (
              <option key={course.slug} value={course.slug}>
                {course.name} ({course.category})
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        {selectedCourseSlug && (
          <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("about")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "about"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("eligibility")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "eligibility"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Eligibility & Program Highlights
            </button>
            <button
              onClick={() => setActiveTab("description")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "description"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Course Description & Career Prospects
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "contact"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Contact Section
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && !selectedCourseSlug ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      ) : !selectedCourseSlug ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Please select a course to manage</p>
        </div>
      ) : loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* About Tab */}
          {activeTab === "about" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">About Section</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Content:
                </label>
                <textarea
                  value={formData.about}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, about: e.target.value }))
                  }
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter about content for the course..."
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title:
                </label>
                <input
                  type="text"
                  value={formData.seo.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, title: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SEO title for the course page"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description:
                </label>
                <textarea
                  value={formData.seo.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, description: e.target.value },
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SEO description for the course page"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Keywords:
                </label>
                <input
                  type="text"
                  value={formData.seo.keywords}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, keywords: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comma-separated keywords"
                />
              </div>
            </div>
          )}

          {/* Eligibility & Highlights Tab */}
          {activeTab === "eligibility" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">
                Eligibility & Program Highlights
              </h3>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Duration:
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3 Years"
                />
              </div>

              {/* Eligibility Criteria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eligibility Criteria:
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newEligibilityItem}
                    onChange={(e) => setNewEligibilityItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddListItem("eligibility");
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter eligibility criterion"
                  />
                  <button
                    onClick={() => handleAddListItem("eligibility")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaPlus /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.eligibility.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                    >
                      <span>{item}</span>
                      <button
                        onClick={() =>
                          handleRemoveListItem("eligibility", index)
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Highlights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Highlights:
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newHighlightItem}
                    onChange={(e) => setNewHighlightItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddListItem("highlights");
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter program highlight"
                  />
                  <button
                    onClick={() => handleAddListItem("highlights")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaPlus /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.highlights.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                    >
                      <span>{item}</span>
                      <button
                        onClick={() =>
                          handleRemoveListItem("highlights", index)
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description & Career Prospects Tab */}
          {activeTab === "description" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">
                Course Description & Career Prospects
              </h3>

              {/* Course Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description:
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter course description..."
                />
              </div>

              {/* Career Prospects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Prospects:
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCareerItem}
                    onChange={(e) => setNewCareerItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddListItem("careerProspects");
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter career prospect"
                  />
                  <button
                    onClick={() => handleAddListItem("careerProspects")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaPlus /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.careerProspects.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                    >
                      <span>{item}</span>
                      <button
                        onClick={() =>
                          handleRemoveListItem("careerProspects", index)
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact Section Tab */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Contact Section</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number:
                </label>
                <input
                  type="tel"
                  value={formData.contactSection.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactSection: {
                        ...prev.contactSection,
                        phone: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., +91 9593330999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address:
                </label>
                <input
                  type="email"
                  value={formData.contactSection.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactSection: {
                        ...prev.contactSection,
                        email: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., iicpaconnect@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address:
                </label>
                <textarea
                  value={formData.contactSection.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactSection: {
                        ...prev.contactSection,
                        address: e.target.value,
                      },
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full address"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showForm"
                  checked={formData.contactSection.showForm}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactSection: {
                        ...prev.contactSection,
                        showForm: e.target.checked,
                      },
                    }))
                  }
                  className="mr-2"
                />
                <label
                  htmlFor="showForm"
                  className="text-sm font-medium text-gray-700"
                >
                  Show Contact Form
                </label>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
