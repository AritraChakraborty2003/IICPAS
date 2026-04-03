import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaPlayCircle, FaBookOpen, FaCalculator, FaChartBar, FaFileAlt, FaVideo, FaDownload, FaEye, FaPlus, FaEdit, FaTrash, FaSave } from "react-icons/fa";

const API_BASE = getApiBase();

const iconOptions = [
  { value: "FaPlayCircle", label: "Play Circle", icon: <FaPlayCircle /> },
  { value: "FaBookOpen", label: "Book Open", icon: <FaBookOpen /> },
  { value: "FaCalculator", label: "Calculator", icon: <FaCalculator /> },
  { value: "FaChartBar", label: "Chart Bar", icon: <FaChartBar /> },
  { value: "FaFileAlt", label: "File", icon: <FaFileAlt /> },
  { value: "FaVideo", label: "Video", icon: <FaVideo /> },
  { value: "FaDownload", label: "Download", icon: <FaDownload /> },
  { value: "FaEye", label: "Eye", icon: <FaEye /> },
];

const iconMap = {
  FaPlayCircle: FaPlayCircle,
  FaBookOpen: FaBookOpen,
  FaCalculator: FaCalculator,
  FaChartBar: FaChartBar,
  FaFileAlt: FaFileAlt,
  FaVideo: FaVideo,
  FaDownload: FaDownload,
  FaEye: FaEye,
};

export default function DemoDigitalHubTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState('website'); // 'website' or 'courses'
  const [newMaterial, setNewMaterial] = useState({
    icon: "FaPlayCircle",
    title: "",
    description: "",
    feature: "",
    link: "#",
    contentType: "pdf",
    contentFile: null,
    contentUrl: null,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE || 'http://localhost:8080'}/api/v1/website/demo-digital-hub`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching demo digital hub data:", error);
      // Set default data if API fails
      setData({
        hero: {
          title: "Demo Digital Hub",
          subtitle: "Explore our comprehensive course demos and get a preview of what you'll learn in our finance and accounting programs.",
          button1: { text: "Browse Demos", link: "#demos" },
          button2: { text: "Try Free Samples", link: "#samples" },
          backgroundGradient: { from: "from-[#afffe8]", via: "via-white", to: "to-[#b8e6ff]" },
          textColor: "text-gray-800"
        },
        mainSection: {
          title: "Interactive Course Demos",
          subtitle: "Experience our courses firsthand with interactive demos, sample lessons, and preview content designed to showcase our teaching methodology.",
          ctaTitle: "Ready to Experience Our Courses?",
          ctaDescription: "Join thousands of students who have discovered their potential through our comprehensive finance and accounting programs.",
          ctaButton1: { text: "Start Free Trial", link: "/student-login" },
          ctaButton2: { text: "View Course Catalog", link: "/course" }
        },
        materials: [
          {
            icon: "FaPlayCircle",
            title: "Video Demo Lessons",
            description: "Watch sample video lessons from our expert instructors covering key concepts in finance and accounting.",
            feature: "HD Quality Videos",
            link: "#video-demos"
          },
          {
            icon: "FaBookOpen",
            title: "Interactive Course Previews",
            description: "Explore interactive course modules and get a feel for our comprehensive curriculum structure.",
            feature: "Interactive Content",
            link: "#course-preview"
          },
          {
            icon: "FaCalculator",
            title: "Practice Problem Demos",
            description: "Try sample practice problems with step-by-step solutions to understand our teaching approach.",
            feature: "Step-by-Step Solutions",
            link: "#practice-demos"
          },
          {
            icon: "FaChartBar",
            title: "Case Study Samples",
            description: "Review real-world case studies and see how we apply theoretical knowledge to practical scenarios.",
            feature: "Real Industry Cases",
            link: "#case-studies"
          },
          {
            icon: "FaFileAlt",
            title: "Sample Study Materials",
            description: "Download sample notes, formula sheets, and reference materials to see the quality of our content.",
            feature: "High-Quality Materials",
            link: "#sample-materials"
          },
          {
            icon: "FaVideo",
            title: "Live Session Previews",
            description: "Experience snippets from our live interactive sessions and Q&A discussions.",
            feature: "Live Interaction",
            link: "#live-previews"
          }
        ],
        seo: {
          title: "Demo Digital Hub - IICPA Institute",
          description: "Explore interactive course demos and preview content for finance and accounting programs at IICPA Institute.",
          keywords: "demo, course preview, finance, accounting, interactive, IICPA"
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
      await axios.put(`${API_BASE || 'http://localhost:8080'}/api/v1/website/demo-digital-hub`, data);
      toast.success("Demo Digital Hub updated successfully!");
    } catch (error) {
      console.error("Error saving demo digital hub:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleMaterialChange = (index, field, value) => {
    setData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const handleFileUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      setData(prev => ({
        ...prev,
        materials: prev.materials.map((material, i) => 
          i === index ? { ...material, contentFile: file, contentUrl: URL.createObjectURL(file) } : material
        )
      }));
    }
  };

  const addMaterial = async () => {
    try {
      console.log("Adding material:", newMaterial);
      
      // Validate required fields
      if (!newMaterial.title.trim()) {
        toast.error("Please enter a course title");
        return;
      }
      if (!newMaterial.description.trim()) {
        toast.error("Please enter a course description");
        return;
      }
      if (!newMaterial.feature.trim()) {
        toast.error("Please enter a course feature");
        return;
      }

      // Add to local state first
      const materialWithId = {
        ...newMaterial,
        id: Date.now() + Math.random() // Generate unique ID
      };
      
      const updatedData = {
        ...data,
        materials: [...data.materials, materialWithId]
      };
      
      console.log("Updated data:", updatedData);
      console.log("Number of materials:", updatedData.materials.length);
      setData(updatedData);
      
      // Save to backend immediately
      console.log("Saving to backend...");
      console.log("Materials being saved:", updatedData.materials);
      
      // Try PUT first, if it fails try POST
      let response;
      try {
        response = await axios.put(`${API_BASE || 'http://localhost:8080'}/api/v1/website/demo-digital-hub`, updatedData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (putError) {
        console.log("PUT failed, trying POST:", putError);
        response = await axios.post(`${API_BASE || 'http://localhost:8080'}/api/v1/website/demo-digital-hub`, updatedData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log("Backend response:", response.data);
      console.log("Response status:", response.status);
      
      // Verify the backend actually saved the data
      if (response.data && response.data.materials) {
        console.log("Backend materials count:", response.data.materials.length);
        if (response.data.materials.length !== updatedData.materials.length) {
          console.warn("Backend materials count doesn't match!");
          toast.error("Warning: Backend may not have saved all courses");
        }
      }
      
      console.log("Saved successfully!");
      
      // Reset form
      setNewMaterial({
        icon: "FaPlayCircle",
        title: "",
        description: "",
        feature: "",
        link: "#",
        contentType: "pdf",
        contentFile: null,
        contentUrl: null,
        isActive: true
      });
      
      toast.success("Demo course added successfully!");
      
      // Refresh data from backend to ensure consistency
      setTimeout(async () => {
        try {
          await fetchData();
        } catch (error) {
          console.error("Error refreshing data:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Error adding demo course:", error);
      toast.error("Failed to add demo course");
    }
  };

  const removeMaterial = async (index) => {
    try {
      const updatedData = {
        ...data,
        materials: data.materials.filter((_, i) => i !== index)
      };
      
      setData(updatedData);
      
      // Save to backend immediately
      await axios.put(`${API_BASE || 'http://localhost:8080'}/api/v1/website/demo-digital-hub`, updatedData);
      
      toast.success("Demo course removed successfully!");
    } catch (error) {
      console.error("Error removing demo course:", error);
      toast.error("Failed to remove demo course");
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Demo Digital Hub Management</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('website')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'website'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Website Settings
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'courses'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Course Management
          </button>
        </nav>
      </div>

      {/* Website Settings Tab */}
      {activeTab === 'website' && (
        <>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <textarea
                  value={data.hero.subtitle}
                  onChange={(e) => handleInputChange('hero', 'subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Button 1 Text</label>
                <input
                  type="text"
                  value={data.hero.button1.text}
                  onChange={(e) => handleInputChange('hero', 'button1', { ...data.hero.button1, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Button 2 Text</label>
                <input
                  type="text"
                  value={data.hero.button2.text}
                  onChange={(e) => handleInputChange('hero', 'button2', { ...data.hero.button2, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Main Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Main Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={data.mainSection.title}
                  onChange={(e) => handleInputChange('mainSection', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <textarea
                  value={data.mainSection.subtitle}
                  onChange={(e) => handleInputChange('mainSection', 'subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
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
                  value={data.seo.title}
                  onChange={(e) => handleInputChange('seo', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <input
                  type="text"
                  value={data.seo.keywords}
                  onChange={(e) => handleInputChange('seo', 'keywords', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                <textarea
                  value={data.seo.description}
                  onChange={(e) => handleInputChange('seo', 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Save Changes Button for Website Settings */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-lg font-medium shadow-lg"
            >
              <FaSave />
              {saving ? "Saving..." : "Save Website Settings"}
            </button>
          </div>
        </>
      )}

      {/* Course Management Tab */}
      {activeTab === 'courses' && (
        <>
          {/* Add New Course Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add New Demo Course</h3>
          <button
            onClick={addMaterial}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus />
            Add Demo Course
          </button>
        </div>

        {/* Add Course Form */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <select
                value={newMaterial.icon}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {iconOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Course Title"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newMaterial.description}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Course Description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Feature</label>
              <input
                type="text"
                value={newMaterial.feature}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, feature: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Course Feature"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={newMaterial.contentType}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, contentType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="pdf">PDF Document</option>
                <option value="video">Video</option>
                <option value="interactive">Interactive Content</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Demo Content (PDF/Video)</label>
              <input
                type="file"
                accept=".pdf,.mp4,.avi,.mov,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewMaterial(prev => ({ ...prev, contentFile: file, contentUrl: URL.createObjectURL(file) }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {newMaterial.contentFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ {newMaterial.contentFile.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Course Content Table */}
      {data.materials.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Demo Course Content ({data.materials.length} courses)</h3>
          
          {/* Courses Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.materials.map((material, index) => {
                  const IconComponent = iconMap[material.icon] || FaPlayCircle;
                  return (
                    <tr key={material.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <IconComponent className="h-8 w-8 text-purple-600 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{material.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{material.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{material.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{material.feature}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {material.contentType || 'PDF'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {material.contentFile ? (
                          <div className="text-xs text-green-600">
                            ✓ {material.contentFile.name}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">No file</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingMaterial(index)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                            title="Edit Course"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => removeMaterial(index)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                            title="Delete Course"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingMaterial !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900">Edit Course</h3>
                <button
                  onClick={() => setEditingMaterial(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <select
                      value={data.materials[editingMaterial].icon}
                      onChange={(e) => handleMaterialChange(editingMaterial, 'icon', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {iconOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={data.materials[editingMaterial].title}
                      onChange={(e) => handleMaterialChange(editingMaterial, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Course Title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={data.materials[editingMaterial].description}
                      onChange={(e) => handleMaterialChange(editingMaterial, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Course Description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Feature</label>
                    <input
                      type="text"
                      value={data.materials[editingMaterial].feature}
                      onChange={(e) => handleMaterialChange(editingMaterial, 'feature', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Course Feature"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                    <select
                      value={data.materials[editingMaterial].contentType || 'pdf'}
                      onChange={(e) => handleMaterialChange(editingMaterial, 'contentType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="video">Video</option>
                      <option value="interactive">Interactive Content</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Demo Content (PDF/Video)</label>
                    <input
                      type="file"
                      accept=".pdf,.mp4,.avi,.mov,.doc,.docx"
                      onChange={(e) => handleFileUpload(editingMaterial, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {data.materials[editingMaterial].contentFile && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ {data.materials[editingMaterial].contentFile.name}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setEditingMaterial(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Save to backend
                        await axios.put(`${API_BASE || 'http://localhost:8080'}/api/v1/website/demo-digital-hub`, data);
                        setEditingMaterial(null);
                        toast.success("Course updated successfully!");
                      } catch (error) {
                        console.error("Error updating course:", error);
                        toast.error("Failed to update course");
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* SEO Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">SEO Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
            <input
              type="text"
              value={data.seo.title}
              onChange={(e) => handleInputChange('seo', 'title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
            <input
              type="text"
              value={data.seo.keywords}
              onChange={(e) => handleInputChange('seo', 'keywords', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
            <textarea
              value={data.seo.description}
              onChange={(e) => handleInputChange('seo', 'description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

          {/* Save Changes Button for Course Management */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-lg font-medium shadow-lg"
            >
              <FaSave />
              {saving ? "Saving..." : "Save Course Changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
