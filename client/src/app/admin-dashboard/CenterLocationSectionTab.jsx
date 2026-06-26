import React, { useState, useEffect } from "react";
import { getApiBase } from "@/lib/apiBase";
import { toast } from "react-hot-toast";

export default function CenterLocationSectionTab() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    badgeText: "Find Your Nearest Center",
    titlePart1: "Search & Book",
    titleHighlight1: "Courses",
    titlePart2: "at",
    titleHighlight2: "IICPA Centers",
    description: "Find the nearest IICPA center, explore available courses, and book your preferred training program with just a few clicks.",
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);

  const API_URL = getApiBase();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch(`${API_URL}/center-location-section/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error("Error fetching configs:", error);
      toast.error("Failed to load configurations.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `${API_URL}/center-location-section/${editingId}`
        : `${API_URL}/center-location-section`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? "Configuration updated!" : "Configuration added!");
        setEditingId(null);
        setFormData({
          badgeText: "Find Your Nearest Center",
          titlePart1: "Search & Book",
          titleHighlight1: "Courses",
          titlePart2: "at",
          titleHighlight2: "IICPA Centers",
          description: "Find the nearest IICPA center, explore available courses, and book your preferred training program with just a few clicks.",
          isActive: true,
        });
        fetchConfigs();
      } else {
        toast.error("Failed to save configuration.");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error saving configuration.");
    }
  };

  const handleEdit = (config) => {
    setEditingId(config._id);
    setFormData({
      badgeText: config.badgeText,
      titlePart1: config.titlePart1,
      titleHighlight1: config.titleHighlight1,
      titlePart2: config.titlePart2,
      titleHighlight2: config.titleHighlight2,
      description: config.description,
      isActive: config.isActive,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    try {
      const res = await fetch(`${API_URL}/center-location-section/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      if (res.ok) {
        toast.success("Deleted successfully!");
        fetchConfigs();
      }
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  if (loading) return <div>Loading configuration...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Center Location Section Header
      </h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Configuration" : "Add New Configuration"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Badge Text</label>
            <input
              type="text"
              name="badgeText"
              value={formData.badgeText}
              onChange={handleInputChange}
              className="mt-1 w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title Part 1</label>
              <input
                type="text"
                name="titlePart1"
                value={formData.titlePart1}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 text-green-600">Title Highlight 1 (Green/Blue)</label>
              <input
                type="text"
                name="titleHighlight1"
                value={formData.titleHighlight1}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title Part 2</label>
              <input
                type="text"
                name="titlePart2"
                value={formData.titlePart2}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 text-purple-600">Title Highlight 2 (Blue/Purple)</label>
              <input
                type="text"
                name="titleHighlight2"
                value={formData.titleHighlight2}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border rounded"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 w-full px-3 py-2 border rounded h-24"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Set as Active Configuration</label>
          </div>
          <div className="flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    badgeText: "Find Your Nearest Center",
                    titlePart1: "Search & Book",
                    titleHighlight1: "Courses",
                    titlePart2: "at",
                    titleHighlight2: "IICPA Centers",
                    description: "Find the nearest IICPA center, explore available courses, and book your preferred training program with just a few clicks.",
                    isActive: true,
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Saved Configurations</h3>
        {configs.length === 0 ? (
          <p>No configurations found.</p>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <div
                key={config._id}
                className={`border p-4 rounded-lg flex justify-between items-center ${
                  config.isActive ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
              >
                <div>
                  <h4 className="font-semibold text-lg">
                    {config.titlePart1} <span className="text-green-600">{config.titleHighlight1}</span> {config.titlePart2} <span className="text-purple-600">{config.titleHighlight2}</span>
                  </h4>
                  <p className="text-sm text-gray-600">{config.badgeText}</p>
                  <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                  {config.isActive && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(config)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(config._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
