"use client";
import { getApiBase } from "@/lib/apiBase";
import { useState, useEffect } from "react";
import {
  FaSave,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaUpload,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function JoinLiveSectionTab() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    badgeText: "🎓 Join Live",
    title: "Join Our Live Class, \nStart Your Online",
    titleHighlight: "Journey",
    description: "Experience interactive learning with our expert instructors in real-time sessions",
    liveTagText: "LIVE · 01:30:56",
    buttonText: "Join Live Class Now",
    image: {
      url: "/images/live-class.jpg",
      alt: "Live Class Session"
    }
  });

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${API_BASE}/join-live-section/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching join live entries:", error);
      toast.error("Failed to fetch Join Live content");
      setEntries([]);
    } finally {
      setLoading(false);
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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        body: uploadData,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData((prev) => ({
          ...prev,
          image: { ...prev.image, url: result.relativePath || result.imageUrl },
        }));
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/join-live-section`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Join Live content created successfully!");
        fetchEntries();
        resetForm();
      } else {
        toast.error("Failed to create Join Live content");
      }
    } catch (error) {
      toast.error("Error creating Join Live content");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/join-live-section/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Join Live content updated successfully!");
        fetchEntries();
        setEditingId(null);
        resetForm();
      } else {
        toast.error("Failed to update Join Live content");
      }
    } catch (error) {
      toast.error("Error updating Join Live content");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this content?")) return;

    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/join-live-section/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Content deleted successfully!");
        fetchEntries();
      } else {
        toast.error("Failed to delete content");
      }
    } catch (error) {
      toast.error("Error deleting content");
    }
  };

  const handleActivate = async (id) => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/join-live-section/activate/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Content activated successfully!");
        fetchEntries();
      } else {
        toast.error("Failed to activate content");
      }
    } catch (error) {
      toast.error("Error activating content");
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
      badgeText: "🎓 Join Live",
      title: "Join Our Live Class, \nStart Your Online",
      titleHighlight: "Journey",
      description: "Experience interactive learning with our expert instructors in real-time sessions",
      liveTagText: "LIVE · 01:30:56",
      buttonText: "Join Live Class Now",
      image: {
        url: "/images/live-class.jpg",
        alt: "Live Class Session"
      }
    });
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
          Join Live Section Management
        </h1>
        <p className="text-gray-600">
          Manage your homepage's Join Live section content and styling
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Join Live Content" : "Create New Join Live Content"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
              <input
                type="text"
                value={formData.badgeText}
                onChange={(e) => handleInputChange("badgeText", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Live Tag Text (on image)</label>
              <input
                type="text"
                value={formData.liveTagText}
                onChange={(e) => handleInputChange("liveTagText", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <textarea
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title Highlight (Gradient word)</label>
              <input
                type="text"
                value={formData.titleHighlight}
                onChange={(e) => handleInputChange("titleHighlight", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
            <input
              type="text"
              value={formData.buttonText}
              onChange={(e) => handleInputChange("buttonText", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Cover Image Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
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
                    {uploadingImage ? "Uploading..." : "Choose Image"}
                  </label>
                </div>
                <div className="mt-2 text-sm text-gray-600 truncate">
                  Current: {formData.image.url}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Alt Text</label>
                <input
                  type="text"
                  value={formData.image.alt}
                  onChange={(e) => handleInputChange("image.alt", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                <FaTimes className="inline mr-2" />
                Cancel
              </button>
            )}
            <button
              type={editingId ? "button" : "submit"}
              onClick={editingId ? () => handleUpdate(editingId) : undefined}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaSave className="inline mr-2" />
              {editingId ? "Update" : "Create"} Content
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Existing Configurations</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {Array.isArray(entries) && entries.map((entry) => (
            <div key={entry._id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 whitespace-pre-wrap">
                      {entry.title} <span className="text-blue-500">{entry.titleHighlight}</span>
                    </h3>
                    {entry.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-1">{entry.description}</p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(entry)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>

                  {!entry.isActive && (
                    <button
                      onClick={() => handleActivate(entry._id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                      title="Activate"
                    >
                      <FaCheck />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="p-6 text-gray-500 text-center">No configurations found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
