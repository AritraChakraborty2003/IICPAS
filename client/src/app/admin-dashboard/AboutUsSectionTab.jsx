"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import { FaSave, FaEdit, FaTrash, FaCheck, FaTimes, FaPlus, FaMinus, FaImage, FaUpload } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function AboutUsSectionTab() {
  const { user } = useAuth();
  
  // Function to get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  };

  const [aboutUsEntries, setAboutUsEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(() => {
    const currentDateTime = getCurrentDateTime();
    return {
      hero: {
        title: "",
        breadcrumb: ""
      },
      mainContent: {
        badge: "",
        title: "",
        description: ""
      },
      images: {
        mainImage: {
          url: "",
          alt: ""
        },
        secondaryImage: {
          url: "",
          alt: ""
        }
      },
      experienceBadge: {
        icon: "",
        years: "",
        text: ""
      },
      mission: {
        title: "",
        description: ""
      },
      vision: {
        title: "",
        description: ""
      },
      colors: {
        primary: "text-green-600",
        secondary: "text-gray-600",
        accent: "bg-green-600"
      },
      dateTime: {
        publishDate: currentDateTime.date,
        publishTime: currentDateTime.time
      }
    };
  });

  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingSecondaryImage, setUploadingSecondaryImage] = useState(false);

  const colorOptions = [
    { value: "text-green-600", label: "Green" },
    { value: "text-blue-600", label: "Blue" },
    { value: "text-purple-600", label: "Purple" },
    { value: "text-red-600", label: "Red" },
    { value: "text-yellow-600", label: "Yellow" },
    { value: "text-indigo-600", label: "Indigo" }
  ];

  const accentColorOptions = [
    { value: "bg-green-600", label: "Green" },
    { value: "bg-blue-600", label: "Blue" },
    { value: "bg-purple-600", label: "Purple" },
    { value: "bg-red-600", label: "Red" },
    { value: "bg-yellow-600", label: "Yellow" },
    { value: "bg-indigo-600", label: "Indigo" }
  ];

  useEffect(() => {
    if (user) {
      fetchAboutUsEntries();
    }
  }, [user]);

  const fetchAboutUsEntries = async () => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch(`${API_BASE}/about-us/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAboutUsEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching about us entries:", error);
      toast.error("Failed to fetch About Us content");
      setAboutUsEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child, subChild] = field.split(".");
      if (subChild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageUpload = async (file, imageType) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      if (imageType === 'main') {
        setUploadingMainImage(true);
      } else {
        setUploadingSecondaryImage(true);
      }

      const response = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleInputChange(`images.${imageType}Image.url`, data.imageUrl);
        toast.success(`${imageType === 'main' ? 'Main' : 'Secondary'} image uploaded successfully!`);
      } else {
        toast.error(`Failed to upload ${imageType} image`);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(`Error uploading ${imageType} image`);
    } finally {
      if (imageType === 'main') {
        setUploadingMainImage(false);
      } else {
        setUploadingSecondaryImage(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/about-us`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("About Us content created successfully!");
        fetchAboutUsEntries();
        resetForm();
      } else {
        toast.error("Failed to create About Us content");
      }
    } catch (error) {
      toast.error("Error creating About Us content");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/about-us/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("About Us content updated successfully!");
        fetchAboutUsEntries();
        setEditingId(null);
        resetForm();
      } else {
        toast.error("Failed to update About Us content");
      }
    } catch (error) {
      toast.error("Error updating About Us content");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this About Us content?")) return;

    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/about-us/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("About Us content deleted successfully!");
        fetchAboutUsEntries();
      } else {
        toast.error("Failed to delete About Us content");
      }
    } catch (error) {
      toast.error("Error deleting About Us content");
    }
  };

  const handleActivate = async (id) => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/about-us/activate/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("About Us content activated successfully!");
        fetchAboutUsEntries();
      } else {
        toast.error("Failed to activate About Us content");
      }
    } catch (error) {
      toast.error("Error activating About Us content");
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setFormData(entry);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    const currentDateTime = getCurrentDateTime();
    setFormData({
      hero: {
        title: "",
        breadcrumb: ""
      },
      mainContent: {
        badge: "",
        title: "",
        description: ""
      },
      images: {
        mainImage: {
          url: "",
          alt: ""
        },
        secondaryImage: {
          url: "",
          alt: ""
        }
      },
      experienceBadge: {
        icon: "",
        years: "",
        text: ""
      },
      mission: {
        title: "",
        description: ""
      },
      vision: {
        title: "",
        description: ""
      },
      colors: {
        primary: "text-green-600",
        secondary: "text-gray-600",
        accent: "bg-green-600"
      },
      dateTime: {
        publishDate: currentDateTime.date,
        publishTime: currentDateTime.time
      }
    });
    setUploadingMainImage(false);
    setUploadingSecondaryImage(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">About Us Section Management</h1>
        <p className="text-gray-600">Manage your website's About Us section content and styling</p>
      </div>

      {/* Create New About Us Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit About Us Content" : "Create New About Us Content"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hero Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Hero Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={formData.hero.title}
                  onChange={(e) => handleInputChange("hero.title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="About Us"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breadcrumb
                </label>
                <input
                  type="text"
                  value={formData.hero.breadcrumb}
                  onChange={(e) => handleInputChange("hero.breadcrumb", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Home // About Us"
                  required
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Main Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={formData.mainContent.badge}
                  onChange={(e) => handleInputChange("mainContent.badge", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="📘 About Us"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Title
                </label>
                <textarea
                  value={formData.mainContent.title}
                  onChange={(e) => handleInputChange("mainContent.title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Behind The Scenes: Discover The People & Passion"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.mainContent.description}
                  onChange={(e) => handleInputChange("mainContent.description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Meet the talented individuals who bring our vision to life every day..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Image Upload */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Main Image
                </label>
                
                {/* Image Preview */}
                {formData.images.mainImage.url && (
                  <div className="mb-3">
                    <img
                      src={formData.images.mainImage.url}
                      alt="Main image preview"
                      className="w-full h-32 object-cover rounded-md border border-gray-200"
                    />
                  </div>
                )}
                
                {/* File Upload */}
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(file, 'main');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={uploadingMainImage}
                  />
                  {uploadingMainImage && (
                    <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
                  )}
                </div>
                
                {/* Alt Text */}
                <input
                  type="text"
                  value={formData.images.mainImage.alt}
                  onChange={(e) => handleInputChange("images.mainImage.alt", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alt text for main image"
                  required
                />
              </div>

              {/* Secondary Image Upload */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Secondary Image
                </label>
                
                {/* Image Preview */}
                {formData.images.secondaryImage.url && (
                  <div className="mb-3">
                    <img
                      src={formData.images.secondaryImage.url}
                      alt="Secondary image preview"
                      className="w-full h-32 object-cover rounded-md border border-gray-200"
                    />
                  </div>
                )}
                
                {/* File Upload */}
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(file, 'secondary');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={uploadingSecondaryImage}
                  />
                  {uploadingSecondaryImage && (
                    <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
                  )}
                </div>
                
                {/* Alt Text */}
                <input
                  type="text"
                  value={formData.images.secondaryImage.alt}
                  onChange={(e) => handleInputChange("images.secondaryImage.alt", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alt text for secondary image"
                  required
                />
              </div>
            </div>
          </div>

          {/* Experience Badge */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Experience Badge</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <input
                  type="text"
                  value={formData.experienceBadge.icon}
                  onChange={(e) => handleInputChange("experienceBadge.icon", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="💡"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years
                </label>
                <input
                  type="text"
                  value={formData.experienceBadge.years}
                  onChange={(e) => handleInputChange("experienceBadge.years", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25+"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text
                </label>
                <input
                  type="text"
                  value={formData.experienceBadge.text}
                  onChange={(e) => handleInputChange("experienceBadge.text", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Years of experience"
                  required
                />
              </div>
            </div>
          </div>

          {/* Mission and Vision */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Mission & Vision</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Mission</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.mission.title}
                    onChange={(e) => handleInputChange("mission.title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mission title"
                    required
                  />
                  <textarea
                    value={formData.mission.description}
                    onChange={(e) => handleInputChange("mission.description", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Mission description"
                    required
                  />
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Vision</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.vision.title}
                    onChange={(e) => handleInputChange("vision.title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Vision title"
                    required
                  />
                  <textarea
                    value={formData.vision.description}
                    onChange={(e) => handleInputChange("vision.description", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Vision description"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Color Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Color Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <select
                  value={formData.colors.primary}
                  onChange={(e) => handleInputChange("colors.primary", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <select
                  value={formData.colors.secondary}
                  onChange={(e) => handleInputChange("colors.secondary", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <select
                  value={formData.colors.accent}
                  onChange={(e) => handleInputChange("colors.accent", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {accentColorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date and Time Settings */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">Publishing Schedule</h3>
              <button
                type="button"
                onClick={() => {
                  const currentDateTime = getCurrentDateTime();
                  handleInputChange("dateTime.publishDate", currentDateTime.date);
                  handleInputChange("dateTime.publishTime", currentDateTime.time);
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Set Current Time
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={formData.dateTime.publishDate}
                  onChange={(e) => handleInputChange("dateTime.publishDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publish Time
                </label>
                <input
                  type="time"
                  value={formData.dateTime.publishTime}
                  onChange={(e) => handleInputChange("dateTime.publishTime", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-2 py-1 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                <FaTimes className="inline mr-2" />
                Cancel
              </button>
            )}
            <button
              type={editingId ? "button" : "submit"}
              onClick={editingId ? () => handleUpdate(editingId) : undefined}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaSave className="inline mr-2" />
              {editingId ? "Update" : "Create"} About Us Content
            </button>
          </div>
        </form>
      </div>

      {/* Existing About Us Contents */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Existing About Us Contents</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {Array.isArray(aboutUsEntries) && aboutUsEntries.map((entry) => (
            <div key={entry._id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {entry.hero.title}
                    </h3>
                    {entry.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-600 mb-2">
                    <span className="font-medium">Badge: </span>
                    {entry.mainContent.badge}
                  </div>
                  
                  <div className="text-gray-600">
                    <span className="font-medium">Experience: </span>
                    {entry.experienceBadge.years} {entry.experienceBadge.text}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(entry)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  
                  {!entry.isActive && (
                    <button
                      onClick={() => handleActivate(entry._id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                      title="Activate"
                    >
                      <FaCheck />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                    title="Delete"
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
  );
}
