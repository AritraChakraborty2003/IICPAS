"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaPlay,
  FaExternalLinkAlt,
  FaFileAlt,
  FaVideo,
  FaLink,
  FaPalette,
  FaGraduationCap,
  FaGripVertical,
} from "react-icons/fa";

const API_BASE = getApiBase();

const GuidesTab = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "marketing",
    type: "document",
    icon: "document",
    fileUrl: "",
    externalUrl: "",
    actionButtons: [],
    order: 0,
  });

  const categories = [
    {
      value: "marketing",
      label: "Marketing & Creative Resources",
      icon: <FaPalette />,
    },
    {
      value: "counselling",
      label: "For Counsellors & Sales Teams",
      icon: <FaGraduationCap />,
    },
    { value: "sales", label: "Sales Resources", icon: <FaFileAlt /> },
    { value: "general", label: "General Resources", icon: <FaFileAlt /> },
  ];

  const types = [
    { value: "document", label: "Document", icon: <FaFileAlt /> },
    { value: "video", label: "Video", icon: <FaVideo /> },
    { value: "template", label: "Template", icon: <FaPalette /> },
    { value: "link", label: "External Link", icon: <FaLink /> },
    { value: "training", label: "Training", icon: <FaGraduationCap /> },
  ];

  const icons = [
    { value: "document", label: "Document", icon: <FaFileAlt /> },
    { value: "video", label: "Video", icon: <FaVideo /> },
    { value: "link", label: "Link", icon: <FaLink /> },
    { value: "download", label: "Download", icon: <FaDownload /> },
    { value: "play", label: "Play", icon: <FaPlay /> },
    { value: "external", label: "External", icon: <FaExternalLinkAlt /> },
  ];

  const actionTypes = [
    { value: "download", label: "Download", icon: <FaDownload /> },
    { value: "view", label: "View", icon: <FaEye /> },
    { value: "watch", label: "Watch", icon: <FaPlay /> },
    { value: "visit", label: "Visit", icon: <FaExternalLinkAlt /> },
    { value: "start", label: "Start", icon: <FaPlay /> },
  ];

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/v1/guides`);
      setGuides(response.data);
    } catch (error) {
      console.error("Error fetching guides:", error);
      Swal.fire("Error", "Failed to fetch guides", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingGuide) {
        await axios.put(
          `${API_BASE}/v1/guides/${editingGuide._id}`,
          formData
        );
        Swal.fire("Success", "Guide updated successfully", "success");
      } else {
        await axios.post(`${API_BASE}/v1/guides`, formData);
        Swal.fire("Success", "Guide created successfully", "success");
      }

      setShowForm(false);
      setEditingGuide(null);
      resetForm();
      fetchGuides();
    } catch (error) {
      console.error("Error saving guide:", error);
      Swal.fire("Error", "Failed to save guide", "error");
    }
  };

  const handleEdit = (guide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      description: guide.description,
      category: guide.category,
      type: guide.type,
      icon: guide.icon,
      fileUrl: guide.fileUrl || "",
      externalUrl: guide.externalUrl || "",
      actionButtons: guide.actionButtons || [],
      order: guide.order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the guide.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/v1/guides/${id}`);
        Swal.fire("Deleted!", "Guide has been deleted.", "success");
        fetchGuides();
      } catch (error) {
        console.error("Error deleting guide:", error);
        Swal.fire("Error", "Failed to delete guide", "error");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.put(`${API_BASE}/v1/guides/${id}/toggle-status`);
      fetchGuides();
    } catch (error) {
      console.error("Error toggling status:", error);
      Swal.fire("Error", "Failed to toggle status", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "marketing",
      type: "document",
      icon: "document",
      fileUrl: "",
      externalUrl: "",
      actionButtons: [],
      order: 0,
    });
  };

  const addActionButton = () => {
    setFormData((prev) => ({
      ...prev,
      actionButtons: [
        ...prev.actionButtons,
        { label: "", action: "download", url: "", icon: "download" },
      ],
    }));
  };

  const removeActionButton = (index) => {
    setFormData((prev) => ({
      ...prev,
      actionButtons: prev.actionButtons.filter((_, i) => i !== index),
    }));
  };

  const updateActionButton = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      actionButtons: prev.actionButtons.map((btn, i) =>
        i === index ? { ...btn, [field]: value } : btn
      ),
    }));
  };

  const getCategoryLabel = (category) => {
    return categories.find((cat) => cat.value === category)?.label || category;
  };

  const getTypeLabel = (type) => {
    return types.find((t) => t.value === type)?.label || type;
  };

  const getIconComponent = (iconName) => {
    const icon = icons.find((i) => i.value === iconName);
    return icon ? icon.icon : <FaFileAlt />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Guides & Resources</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingGuide(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FaPlus size={16} />
          Add Guide
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-md flex items-center justify-center z-50"
          style={{ backdropFilter: "blur(6px)" }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-semibold mb-4">
              {editingGuide ? "Edit Guide" : "Add New Guide"}
            </h2>
            ∆
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {icons.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File URL
                  </label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, fileUrl: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/file.pdf"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={formData.externalUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, externalUrl: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Action Buttons
                  </label>
                  <button
                    type="button"
                    onClick={addActionButton}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Button
                  </button>
                </div>

                {formData.actionButtons.map((button, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Button Label"
                      value={button.label}
                      onChange={(e) =>
                        updateActionButton(index, "label", e.target.value)
                      }
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={button.action}
                      onChange={(e) =>
                        updateActionButton(index, "action", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {actionTypes.map((action) => (
                        <option key={action.value} value={action.value}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      placeholder="URL (optional)"
                      value={button.url}
                      onChange={(e) =>
                        updateActionButton(index, "url", e.target.value)
                      }
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeActionButton(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGuide(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingGuide ? "Update Guide" : "Create Guide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guides List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guide
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guides.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No guides found. Create your first guide!
                  </td>
                </tr>
              ) : (
                guides.map((guide) => (
                  <tr key={guide._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-lg">
                          {getIconComponent(guide.icon)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {guide.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {guide.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryLabel(guide.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTypeLabel(guide.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(guide._id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          guide.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {guide.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {guide.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(guide)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(guide._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GuidesTab;
