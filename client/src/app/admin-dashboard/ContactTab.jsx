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
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ContactTab() {
  const { user } = useAuth();
  const [contactEntries, setContactEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    contactInfo: {
      phone: {
        number: "",
        label: "",
      },
      email: {
        address: "",
        label: "",
      },
      address: {
        text: "",
        label: "",
      },
    },
    form: {
      buttonText: "",
      successMessage: "",
      errorMessage: "",
    },
    colors: {
      title: "text-green-600",
      subtitle: "text-gray-900",
      description: "text-gray-600",
      background: "bg-white",
    },
  });

  const colorOptions = [
    { value: "text-white", label: "White" },
    { value: "text-green-600", label: "Green" },
    { value: "text-blue-600", label: "Blue" },
    { value: "text-purple-600", label: "Purple" },
    { value: "text-yellow-600", label: "Yellow" },
    { value: "text-red-600", label: "Red" },
    { value: "text-gray-600", label: "Gray" },
    { value: "text-gray-700", label: "Dark Gray" },
    { value: "text-gray-900", label: "Black" },
  ];

  const backgroundOptions = [
    { value: "bg-white", label: "White" },
    { value: "bg-gray-50", label: "Light Gray" },
    { value: "bg-blue-50", label: "Light Blue" },
    { value: "bg-green-50", label: "Light Green" },
    { value: "bg-purple-50", label: "Light Purple" },
    {
      value: "bg-gradient-to-br from-blue-50 to-green-50",
      label: "Blue to Green Gradient",
    },
    {
      value: "bg-gradient-to-br from-purple-50 to-pink-50",
      label: "Purple to Pink Gradient",
    },
  ];

  useEffect(() => {
    if (user) {
      fetchContactEntries();
    }
  }, [user]);

  const fetchContactEntries = async () => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/contact/all`, {
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
      setContactEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching contact entries:", error);
      toast.error("Failed to fetch Contact content");
      setContactEntries([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/contact/admin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Contact content created successfully!");
        fetchContactEntries();
        resetForm();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(
            `Failed to create Contact content: ${
              errorData.error || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error creating contact content:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/contact/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Contact content updated successfully!");
        fetchContactEntries();
        setEditingId(null);
        resetForm();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(
            `Failed to update Contact content: ${
              errorData.error || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error updating contact content:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this Contact content?")
    )
      return;

    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/contact/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Contact content deleted successfully!");
        fetchContactEntries();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(
            `Failed to delete Contact content: ${
              errorData.error || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error deleting contact content:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleActivate = async (id) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/contact/activate/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Contact content activated successfully!");
        fetchContactEntries();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(
            `Failed to activate Contact content: ${
              errorData.error || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error activating contact content:", error);
      toast.error("Network error. Please check your connection and try again.");
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
      contactInfo: {
        phone: {
          number: "",
          label: "",
        },
        email: {
          address: "",
          label: "",
        },
        address: {
          text: "",
          label: "",
        },
      },
      form: {
        buttonText: "",
        successMessage: "",
        errorMessage: "",
      },
      colors: {
        title: "text-green-600",
        subtitle: "text-gray-900",
        description: "text-gray-600",
        background: "bg-white",
      },
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
          Contact Section Management
        </h1>
        <p className="text-gray-600">
          Manage your website's Contact section content and styling
        </p>
      </div>

      {/* Create New Contact Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Contact Content" : "Create New Contact Content"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contact Us"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Let's Get in Touch"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Ready to start your learning journey? Get in touch with us today!"
              required
            />
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phone */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaPhone className="text-green-600" />
                  <h4 className="font-medium text-gray-700">Phone</h4>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.contactInfo.phone.label}
                    onChange={(e) =>
                      handleInputChange(
                        "contactInfo.phone.label",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone"
                  />
                  <input
                    type="text"
                    value={formData.contactInfo.phone.number}
                    onChange={(e) =>
                      handleInputChange(
                        "contactInfo.phone.number",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaEnvelope className="text-blue-600" />
                  <h4 className="font-medium text-gray-700">Email</h4>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.contactInfo.email.label}
                    onChange={(e) =>
                      handleInputChange(
                        "contactInfo.email.label",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                  />
                  <input
                    type="email"
                    value={formData.contactInfo.email.address}
                    onChange={(e) =>
                      handleInputChange(
                        "contactInfo.email.address",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="support@iicpa.org"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaMapMarkerAlt className="text-purple-600" />
                  <h4 className="font-medium text-gray-700">Address</h4>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.contactInfo.address.label}
                    onChange={(e) =>
                      handleInputChange(
                        "contactInfo.address.label",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Address"
                  />
                  <textarea
                    value={formData.contactInfo.address.text}
                    onChange={(e) =>
                      handleInputChange(
                        "contactInfo.address.text",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="123 Knowledge Park, New Delhi, India"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Form Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={formData.form.buttonText}
                  onChange={(e) =>
                    handleInputChange("form.buttonText", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Send Message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Success Message
                </label>
                <input
                  type="text"
                  value={formData.form.successMessage}
                  onChange={(e) =>
                    handleInputChange("form.successMessage", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Message sent successfully!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Message
                </label>
                <input
                  type="text"
                  value={formData.form.errorMessage}
                  onChange={(e) =>
                    handleInputChange("form.errorMessage", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Something went wrong. Please try again."
                />
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
              {editingId ? "Update" : "Create"} Contact Content
            </button>
          </div>
        </form>
      </div>

      {/* Existing Contact Contents */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Existing Contact Contents</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {contactEntries.map((entry) => (
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
                    <span className="font-medium">Contact: </span>
                    {entry.contactInfo.phone.number},{" "}
                    {entry.contactInfo.email.address}
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
        </div>
      </div>
    </div>
  );
}
