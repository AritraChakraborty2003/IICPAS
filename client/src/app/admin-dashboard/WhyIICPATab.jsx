"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import {
  FaSave,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaImage,
  FaPlus,
  FaMinus,
  FaUpload,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function WhyIICPATab() {
  const { user } = useAuth();
  const [whyIICPAEntries, setWhyIICPAEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    statistics: {
      courses: {
        number: "",
        label: "",
        description: "",
      },
      students: {
        number: "",
        label: "",
        description: "",
      },
      successRate: {
        number: "",
        label: "",
      },
    },
    features: [],
    buttons: {
      exploreCourses: {
        text: "",
        link: "",
      },
      learnMore: {
        text: "",
        link: "",
      },
    },
    colors: {
      title: "text-white",
      subtitle: "text-green-400",
      description: "text-white/70",
      background: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    },
  });
  const [newFeature, setNewFeature] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const colorOptions = [
    { value: "text-white", label: "White" },
    { value: "text-green-400", label: "Green" },
    { value: "text-blue-400", label: "Blue" },
    { value: "text-purple-400", label: "Purple" },
    { value: "text-yellow-400", label: "Yellow" },
    { value: "text-red-400", label: "Red" },
    { value: "text-white/70", label: "White 70%" },
    { value: "text-white/80", label: "White 80%" },
    { value: "text-white/90", label: "White 90%" },
  ];

  const backgroundOptions = [
    {
      value: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
      label: "Dark Gradient",
    },
    {
      value: "bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900",
      label: "Blue Gradient",
    },
    {
      value: "bg-gradient-to-br from-green-900 via-green-800 to-green-900",
      label: "Green Gradient",
    },
    {
      value: "bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900",
      label: "Purple Gradient",
    },
    { value: "bg-slate-900", label: "Dark Solid" },
    { value: "bg-blue-900", label: "Blue Solid" },
  ];

  useEffect(() => {
    if (user) {
      fetchWhyIICPAEntries();
    }
  }, [user]);

  const fetchWhyIICPAEntries = async () => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/why-iicpa/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Ensure data is always an array
      setWhyIICPAEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching WhyIICPA entries:", error);
      toast.error("Failed to fetch WhyIICPA content");
      setWhyIICPAEntries([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child, subChild] = field.split(".");
      if (subChild) {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value,
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFeatureAdd = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const handleFeatureRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (10MB limit to match backend)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData((prev) => ({
          ...prev,
          image: result.imageUrl,
        }));
        toast.success("Image uploaded successfully!");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(`Failed to upload image: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/why-iicpa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("WhyIICPA content created successfully!");
        fetchWhyIICPAEntries();
        resetForm();
      } else {
        toast.error("Failed to create WhyIICPA content");
      }
    } catch (error) {
      toast.error("Error creating WhyIICPA content");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/why-iicpa/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("WhyIICPA content updated successfully!");
        fetchWhyIICPAEntries();
        setEditingId(null);
        resetForm();
      } else {
        toast.error("Failed to update WhyIICPA content");
      }
    } catch (error) {
      toast.error("Error updating WhyIICPA content");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this WhyIICPA content?")
    )
      return;

    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/why-iicpa/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("WhyIICPA content deleted successfully!");
        fetchWhyIICPAEntries();
      } else {
        toast.error("Failed to delete WhyIICPA content");
      }
    } catch (error) {
      toast.error("Error deleting WhyIICPA content");
    }
  };

  const handleActivate = async (id) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/why-iicpa/activate/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("WhyIICPA content activated successfully!");
        fetchWhyIICPAEntries();
      } else {
        toast.error("Failed to activate WhyIICPA content");
      }
    } catch (error) {
      toast.error("Error activating WhyIICPA content");
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
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image: "",
      statistics: {
        courses: {
          number: "",
          label: "",
          description: "",
        },
        students: {
          number: "",
          label: "",
          description: "",
        },
        successRate: {
          number: "",
          label: "",
        },
      },
      features: [],
      buttons: {
        exploreCourses: {
          text: "",
          link: "",
        },
        learnMore: {
          text: "",
          link: "",
        },
      },
      colors: {
        title: "text-white",
        subtitle: "text-green-400",
        description: "text-white/70",
        background:
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
      },
    });
    setNewFeature("");
    setUploadingImage(false);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          WhyIICPA Section Management
        </h1>
        <p className="text-gray-600">
          Manage your website's WhyIICPA section content and styling
        </p>
      </div>

      {/* Create New WhyIICPA Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit WhyIICPA Content" : "Create New WhyIICPA Content"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Why Choose IICPA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
              </label>
              
              {/* Image Upload */}
              <div>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 ${
                      uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <FaUpload className="mr-2" />
                    {uploadingImage ? "Uploading..." : "Choose Image File"}
                  </label>
                  {formData.image && (
                    <span className="text-sm text-gray-600">
                      Current: {formData.image}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF, WebP. Max size: 10MB
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Empowering Your Future with Excellence"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter description"
              required
            />
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Courses */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Courses</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.statistics.courses.number}
                    onChange={(e) =>
                      handleInputChange(
                        "statistics.courses.number",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50+"
                  />
                  <input
                    type="text"
                    value={formData.statistics.courses.label}
                    onChange={(e) =>
                      handleInputChange(
                        "statistics.courses.label",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Courses"
                  />
                  <textarea
                    value={formData.statistics.courses.description}
                    onChange={(e) =>
                      handleInputChange(
                        "statistics.courses.description",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Description"
                  />
                </div>
              </div>

              {/* Students */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Students</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.statistics.students.number}
                    onChange={(e) =>
                      handleInputChange(
                        "statistics.students.number",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10K+"
                  />
                  <input
                    type="text"
                    value={formData.statistics.students.label}
                    onChange={(e) =>
                      handleInputChange(
                        "statistics.students.label",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Students"
                  />
                  <textarea
                    value={formData.statistics.students.description}
                    onChange={(e) =>
                      handleInputChange(
                        "statistics.students.description",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Description"
                  />
                </div>
              </div>

              {/* Success Rate */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Success Rate</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.statistics.successRate.number}
                    onChange={(e) =>
                      handleInputChange(
                        "statistics.successRate.number",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="98%"
                  />
                  <input
                    type="text"
                    value={formData.statistics.successRate.label}
                    onChange={(e) =>
                      handleInputChange(
                        "statistics.successRate.label",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Success Rate"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Features</h3>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...formData.features];
                      newFeatures[index] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        features: newFeatures,
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleFeatureRemove(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                  >
                    <FaMinus />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add new feature"
                />
                <button
                  type="button"
                  onClick={handleFeatureAdd}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Buttons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">
                  Explore Courses Button
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.buttons.exploreCourses.text}
                    onChange={(e) =>
                      handleInputChange(
                        "buttons.exploreCourses.text",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explore Our Courses"
                  />
                  <input
                    type="text"
                    value={formData.buttons.exploreCourses.link}
                    onChange={(e) =>
                      handleInputChange(
                        "buttons.exploreCourses.link",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/courses"
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">
                  Learn More Button
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.buttons.learnMore.text}
                    onChange={(e) =>
                      handleInputChange(
                        "buttons.learnMore.text",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Learn More About IICPA"
                  />
                  <input
                    type="text"
                    value={formData.buttons.learnMore.link}
                    onChange={(e) =>
                      handleInputChange(
                        "buttons.learnMore.link",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/about"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Color Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Color Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(formData.colors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <select
                    value={value}
                    onChange={(e) =>
                      handleInputChange(`colors.${key}`, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {key === "background"
                      ? backgroundOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))
                      : colorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                <FaTimes className="inline mr-2" />
                Cancel
              </button>
            )}
            <button
              type={editingId ? "button" : "submit"}
              onClick={editingId ? () => handleUpdate(editingId) : undefined}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaSave className="inline mr-2" />
              {editingId ? "Update" : "Create"} WhyIICPA Content
            </button>
          </div>
        </form>
      </div>

      {/* Existing WhyIICPA Contents */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Existing WhyIICPA Contents</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {Array.isArray(whyIICPAEntries) &&
            whyIICPAEntries.map((entry) => (
              <div key={entry._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {entry.title}
                      </h3>
                      {entry.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="text-gray-600 mb-2">
                      <span className="font-medium">Subtitle: </span>
                      {entry.subtitle}
                    </div>

                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Description: </span>
                      {entry.description.substring(0, 100)}...
                    </p>

                    <div className="text-gray-600">
                      <span className="font-medium">Statistics: </span>
                      {entry.statistics.courses.number}{" "}
                      {entry.statistics.courses.label},
                      {entry.statistics.students.number}{" "}
                      {entry.statistics.students.label},
                      {entry.statistics.successRate.number}{" "}
                      {entry.statistics.successRate.label}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(entry)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    {!entry.isActive && (
                      <button
                        onClick={() => handleActivate(entry._id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                        title="Activate"
                      >
                        <FaCheck />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          {Array.isArray(whyIICPAEntries) && whyIICPAEntries.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No WhyIICPA content found. Create your first entry above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
