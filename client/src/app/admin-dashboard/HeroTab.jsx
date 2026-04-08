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
  FaUpload,
  FaVideo,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function HeroTab() {
  const { user } = useAuth();
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    smallText: "",
    mainHeading: {
      part1: "",
      part2: "",
      part3: "",
      part4: "",
      part5: "",
    },
    description: "",
    buttonText: "",
    videoUrl: "",
    videoFile: null,
    colors: {
      smallText: "text-green-400",
      part1: "text-white",
      part2: "text-green-400",
      part3: "text-green-400",
      part4: "text-white",
      part5: "text-blue-300",
      description: "text-white/90",
      button: "bg-green-500 hover:bg-green-600",
    },
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const colorOptions = [
    { value: "text-white", label: "White" },
    { value: "text-green-400", label: "Green" },
    { value: "text-blue-300", label: "Blue" },
    { value: "text-yellow-400", label: "Yellow" },
    { value: "text-red-400", label: "Red" },
    { value: "text-purple-400", label: "Purple" },
    { value: "text-pink-400", label: "Pink" },
    { value: "text-indigo-400", label: "Indigo" },
    { value: "text-white/90", label: "White 90%" },
    { value: "text-white/80", label: "White 80%" },
  ];

  const buttonColorOptions = [
    { value: "bg-green-500 hover:bg-green-600", label: "Green" },
    { value: "bg-blue-500 hover:bg-blue-600", label: "Blue" },
    { value: "bg-red-500 hover:bg-red-600", label: "Red" },
    { value: "bg-purple-500 hover:bg-purple-600", label: "Purple" },
    { value: "bg-yellow-500 hover:bg-yellow-600", label: "Yellow" },
    { value: "bg-indigo-500 hover:bg-indigo-600", label: "Indigo" },
    { value: "bg-pink-500 hover:bg-pink-600", label: "Pink" },
  ];

  useEffect(() => {
    if (user) {
      fetchHeroes();
    }
  }, [user]);

  const fetchHeroes = async () => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/hero/all`, {
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
      setHeroes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching hero entries:", error);
      toast.error("Failed to fetch hero content");
      setHeroes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
      "video/mkv",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Please select a valid video file (MP4, AVI, MOV, WMV, FLV, WEBM, MKV)"
      );
      return;
    }

    // Validate file size (350MB limit)
    if (file.size > 350 * 1024 * 1024) {
      toast.error("Video file size must be less than 350MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("video", file);

    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/hero/upload-video`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          videoFile: data.videoPath,
          videoUrl: data.videoPath,
        }));
        toast.success("Video uploaded successfully!");
      } else {
        toast.error("Failed to upload video");
      }
    } catch (error) {
      toast.error("Error uploading video");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      handleVideoUpload(file);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/hero`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Hero content created successfully!");
        fetchHeroes();
        resetForm();
      } else {
        toast.error("Failed to create hero content");
      }
    } catch (error) {
      toast.error("Error creating hero content");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/hero/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Hero content updated successfully!");
        fetchHeroes();
        setEditingId(null);
        resetForm();
      } else {
        toast.error("Failed to update hero content");
      }
    } catch (error) {
      toast.error("Error updating hero content");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hero content?"))
      return;

    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/hero/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Hero content deleted successfully!");
        fetchHeroes();
      } else {
        toast.error("Failed to delete hero content");
      }
    } catch (error) {
      toast.error("Error deleting hero content");
    }
  };

  const handleActivate = async (id) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/hero/activate/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Hero content activated successfully!");
        fetchHeroes();
      } else {
        toast.error("Failed to activate hero content");
      }
    } catch (error) {
      toast.error("Error activating hero content");
    }
  };

  const startEdit = (hero) => {
    setEditingId(hero._id);
    setFormData(hero);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      smallText: "",
      mainHeading: {
        part1: "",
        part2: "",
        part3: "",
        part4: "",
        part5: "",
      },
      description: "",
      buttonText: "",
      videoUrl: "",
      videoFile: null,
      colors: {
        smallText: "text-green-400",
        part1: "text-white",
        part2: "text-green-400",
        part3: "text-green-400",
        part4: "text-white",
        part5: "text-blue-300",
        description: "text-white/90",
        button: "bg-green-500 hover:bg-green-600",
      },
    });
    setVideoFile(null);
    setVideoPreview(null);
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
          Hero Section Management
        </h1>
        <p className="text-gray-600">
          Manage your website's hero section content and styling
        </p>
      </div>

      {/* Create New Hero Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Hero Content" : "Create New Hero Content"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Small Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Small Text (e.g., "# Best Online Platform")
              </label>
              <input
                type="text"
                value={formData.smallText}
                onChange={(e) => handleInputChange("smallText", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter small text"
                required
              />
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hero Video
              </label>

              {/* Video Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="video-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  {uploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="text-blue-600">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <FaVideo className="text-4xl text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          {videoFile ? "Change Video" : "Upload Video"}
                        </p>
                        <p className="text-sm text-gray-500">
                          MP4, AVI, MOV, WMV, FLV, WEBM, MKV (Max 350MB)
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {/* Video Preview */}
              {videoPreview && (
                <div className="mt-4">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-48 object-cover rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Current Video Display */}
              {formData.videoFile && !videoPreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Current Video:</p>
                  <video
                    src={formData.videoFile}
                    controls
                    className="w-full h-48 object-cover rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Video URL Input (Fallback) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Enter Video URL
                </label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    handleInputChange("videoUrl", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/videos/homehero.mp4"
                />
              </div>
            </div>
          </div>

          {/* Main Heading Parts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Heading Parts
            </label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(formData.mainHeading).map(([key, value]) => (
                <div key={key}>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      handleInputChange(`mainHeading.${key}`, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Part ${key.slice(-1)}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Enter description"
              required
            />
          </div>

          {/* Button Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Text
            </label>
            <input
              type="text"
              value={formData.buttonText}
              onChange={(e) => handleInputChange("buttonText", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Get Started »"
              required
            />
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
                    {key === "button"
                      ? buttonColorOptions.map((option) => (
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
              {editingId ? "Update" : "Create"} Hero Content
            </button>
          </div>
        </form>
      </div>

      {/* Existing Hero Contents */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Existing Hero Contents</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {Array.isArray(heroes) &&
            heroes.map((hero) => (
              <div key={hero._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {hero.smallText}
                      </h3>
                      {hero.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="text-gray-600 mb-2">
                      <span className="font-medium">Heading: </span>
                      <span className={hero.colors.part1}>
                        {hero.mainHeading.part1}
                      </span>{" "}
                      <span className={hero.colors.part2}>
                        {hero.mainHeading.part2}
                      </span>{" "}
                      <span className={hero.colors.part3}>
                        {hero.mainHeading.part3}
                      </span>{" "}
                      <span className={hero.colors.part4}>
                        {hero.mainHeading.part4}
                      </span>{" "}
                      <span className={hero.colors.part5}>
                        {hero.mainHeading.part5}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Description: </span>
                      {hero.description}
                    </p>

                    <p className="text-gray-600">
                      <span className="font-medium">Button: </span>
                      <span
                        className={
                          hero.colors.button + " text-white px-2 py-1 rounded"
                        }
                      >
                        {hero.buttonText}
                      </span>
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(hero)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    {!hero.isActive && (
                      <button
                        onClick={() => handleActivate(hero._id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                        title="Activate"
                      >
                        <FaCheck />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(hero._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
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
