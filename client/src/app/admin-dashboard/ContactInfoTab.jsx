"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import {
  FaSave,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaPlus,
  FaPaperPlane,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ContactInfoTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("contact-info"); // "contact-info" or "contact-form"

  // Contact Info states
  const [contactInfo, setContactInfo] = useState([]);
  const [contactInfoLoading, setContactInfoLoading] = useState(true);
  const [editingContactInfoId, setEditingContactInfoId] = useState(null);
  const [contactInfoFormData, setContactInfoFormData] = useState({
    title: "",
    content: "",
    icon: "FaMapMarkerAlt",
    bg: "from-purple-100 to-white",
    isActive: true,
  });

  // Contact Form states
  const [contactForms, setContactForms] = useState([]);
  const [contactFormLoading, setContactFormLoading] = useState(true);
  const [editingContactFormId, setEditingContactFormId] = useState(null);
  const [contactFormData, setContactFormData] = useState({
    smallText: "🎓 Get In Touch",
    mainHeading: "We're Here To Help And Ready To Hear From You",
    formFields: {
      nameField: {
        placeholder: "Enter your name",
        required: true,
        visible: true,
      },
      emailField: {
        placeholder: "Enter your email",
        required: true,
        visible: true,
      },
      phoneField: {
        placeholder: "Write about your phone",
        required: true,
        visible: true,
      },
      messageField: {
        placeholder: "Write Your Message",
        required: true,
        visible: true,
        rows: 5,
      },
    },
    submitButton: {
      text: "Submit",
      icon: "FaPaperPlane",
      color: "bg-green-500 hover:bg-green-600",
    },
    messages: {
      successMessage: "Message sent successfully!",
      errorMessage: "Submission failed",
    },
    colors: {
      smallText: "text-green-600",
      mainHeading: "text-slate-900",
      buttonText: "text-white",
    },
    image: {
      url: "/images/contact-section.jpg",
      alt: "Contact Support",
    },
    isActive: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);

  const iconOptions = [
    { value: "FaMapMarkerAlt", label: "Map Marker", icon: <FaMapMarkerAlt /> },
    { value: "FaPhoneAlt", label: "Phone", icon: <FaPhoneAlt /> },
    { value: "FaEnvelope", label: "Envelope", icon: <FaEnvelope /> },
    { value: "FaClock", label: "Clock", icon: <FaClock /> },
  ];

  const backgroundOptions = [
    { value: "from-purple-100 to-white", label: "Purple" },
    { value: "from-pink-100 to-white", label: "Pink" },
    { value: "from-yellow-100 to-white", label: "Yellow" },
    { value: "from-green-100 to-white", label: "Green" },
    { value: "from-blue-100 to-white", label: "Blue" },
    { value: "from-indigo-100 to-white", label: "Indigo" },
    { value: "from-red-100 to-white", label: "Red" },
    { value: "from-gray-100 to-white", label: "Gray" },
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

  const textColorOptions = [
    { value: "text-green-600", label: "Green" },
    { value: "text-blue-600", label: "Blue" },
    { value: "text-red-600", label: "Red" },
    { value: "text-purple-600", label: "Purple" },
    { value: "text-yellow-600", label: "Yellow" },
    { value: "text-indigo-600", label: "Indigo" },
    { value: "text-pink-600", label: "Pink" },
    { value: "text-gray-900", label: "Dark Gray" },
    { value: "text-slate-900", label: "Slate" },
  ];

  const iconMap = {
    FaMapMarkerAlt: FaMapMarkerAlt,
    FaPhoneAlt: FaPhoneAlt,
    FaEnvelope: FaEnvelope,
    FaClock: FaClock,
  };

  useEffect(() => {
    if (user) {
      fetchContactInfo();
      fetchContactForms();
    }
  }, [user]);

  // Ensure image data is always properly initialized
  useEffect(() => {
    if (!contactFormData.image) {
      setContactFormData((prev) => ({
        ...prev,
        image: {
          url: "/images/contact-section.jpg",
          alt: "Contact Support",
        },
      }));
    }
  }, [contactFormData.image]);

  // Contact Info Functions
  const fetchContactInfo = async () => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/contact-info/all`, {
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
      setContactInfo(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching contact info:", error);
      toast.error("Failed to fetch contact information");
      setContactInfo([]);
    } finally {
      setContactInfoLoading(false);
    }
  };

  const handleContactInfoInputChange = (field, value) => {
    setContactInfoFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContactInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/contact-info`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(contactInfoFormData),
      });

      if (response.ok) {
        toast.success("Contact information created successfully!");
        fetchContactInfo();
        resetContactInfoForm();
      } else {
        toast.error("Failed to create contact information");
      }
    } catch (error) {
      toast.error("Error creating contact information");
    }
  };

  const handleContactInfoUpdate = async (id) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/contact-info/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(contactInfoFormData),
      });

      if (response.ok) {
        toast.success("Contact information updated successfully!");
        fetchContactInfo();
        setEditingContactInfoId(null);
        resetContactInfoForm();
      } else {
        toast.error("Failed to update contact information");
      }
    } catch (error) {
      toast.error("Error updating contact information");
    }
  };

  const handleContactInfoDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this contact information?"
      )
    )
      return;

    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/contact-info/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Contact information deleted successfully!");
        fetchContactInfo();
      } else {
        toast.error("Failed to delete contact information");
      }
    } catch (error) {
      toast.error("Error deleting contact information");
    }
  };

  const handleContactInfoToggleActive = async (id, currentStatus) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/contact-info/${id}/toggle`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(
          `Contact information ${
            !currentStatus ? "activated" : "deactivated"
          } successfully!`
        );
        fetchContactInfo();
      } else {
        toast.error("Failed to update contact information status");
      }
    } catch (error) {
      toast.error("Error updating contact information status");
    }
  };

  const startContactInfoEdit = (contact) => {
    setEditingContactInfoId(contact._id);
    setContactInfoFormData(contact);
  };

  const cancelContactInfoEdit = () => {
    setEditingContactInfoId(null);
    resetContactInfoForm();
  };

  const resetContactInfoForm = () => {
    setContactInfoFormData({
      title: "",
      content: "",
      icon: "FaMapMarkerAlt",
      bg: "from-purple-100 to-white",
      isActive: true,
    });
  };

  // Contact Form Functions
  const fetchContactForms = async () => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/contact-form/all`, {
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
      setContactForms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching contact forms:", error);
      toast.error("Failed to fetch contact form configurations");
      setContactForms([]);
    } finally {
      setContactFormLoading(false);
    }
  };

  const handleContactFormInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child, subChild] = field.split(".");
      if (subChild) {
        setContactFormData((prev) => ({
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
        setContactFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }));
      }
    } else {
      setContactFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, GIF)");
      return null;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        return null;
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
        const data = await response.json();
        const imageUrl = data.imageUrl || data.url;

        if (!imageUrl) {
          toast.error("No image URL returned from server");
          return null;
        }

        setContactFormData((prev) => ({
          ...prev,
          image: {
            ...prev.image,
            url: imageUrl,
          },
        }));

        toast.success("Image uploaded successfully!");
        return imageUrl;
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || errorData.message || "Failed to upload image";
        toast.error(errorMessage);
        console.error("Upload failed:", response.status, errorMessage);
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Network error while uploading image. Please try again.");
      return null;
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPG, PNG, GIF)");
        e.target.value = ""; // Clear the input
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file size must be less than 5MB");
        e.target.value = ""; // Clear the input
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Auto-upload the image
      setImageUploading(true);
      const uploadedUrl = await handleImageUpload(file);
      setImageUploading(false);

      if (!uploadedUrl) {
        // If upload failed, clear the file selection
        setImageFile(null);
        setImagePreview(null);
        e.target.value = "";
      }
    } else {
      // Clear preview if no file selected
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const formDataToSubmit = {
        ...contactFormData,
        image: {
          url: contactFormData.image?.url || "/images/contact-section.jpg",
          alt: contactFormData.image?.alt || "Contact Support",
        },
      };

      const response = await fetch(`${API_BASE}/contact-form`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formDataToSubmit),
      });

      if (response.ok) {
        toast.success("Contact form configuration created successfully!");
        fetchContactForms();
        resetContactForm();
        setImageFile(null);
        setImagePreview(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          "Failed to create contact form configuration";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating contact form configuration:", error);
      toast.error("Error creating contact form configuration");
    }
  };

  const handleContactFormUpdate = async (id) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const formDataToSubmit = {
        ...contactFormData,
        image: {
          url: contactFormData.image?.url || "/images/contact-section.jpg",
          alt: contactFormData.image?.alt || "Contact Support",
        },
      };

      const response = await fetch(`${API_BASE}/contact-form/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formDataToSubmit),
      });

      if (response.ok) {
        toast.success("Contact form configuration updated successfully!");
        fetchContactForms();
        setEditingContactFormId(null);
        resetContactForm();
        setImageFile(null);
        setImagePreview(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          "Failed to update contact form configuration";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating contact form configuration:", error);
      toast.error("Error updating contact form configuration");
    }
  };

  const handleContactFormDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this contact form configuration?"
      )
    )
      return;

    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/contact-form/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Contact form configuration deleted successfully!");
        fetchContactForms();
      } else {
        toast.error("Failed to delete contact form configuration");
      }
    } catch (error) {
      toast.error("Error deleting contact form configuration");
    }
  };

  const handleContactFormToggleActive = async (id, currentStatus) => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE}/contact-form/${id}/toggle`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(
          `Contact form ${
            !currentStatus ? "activated" : "deactivated"
          } successfully!`
        );
        fetchContactForms();
      } else {
        toast.error("Failed to update contact form status");
      }
    } catch (error) {
      toast.error("Error updating contact form status");
    }
  };

  const startContactFormEdit = (contactForm) => {
    setEditingContactFormId(contactForm._id);
    setContactFormData(contactForm);
  };

  const cancelContactFormEdit = () => {
    setEditingContactFormId(null);
    resetContactForm();
  };

  const resetContactForm = () => {
    setContactFormData({
      smallText: "🎓 Get In Touch",
      mainHeading: "We're Here To Help And Ready To Hear From You",
      formFields: {
        nameField: {
          placeholder: "Enter your name",
          required: true,
          visible: true,
        },
        emailField: {
          placeholder: "Enter your email",
          required: true,
          visible: true,
        },
        phoneField: {
          placeholder: "Write about your phone",
          required: true,
          visible: true,
        },
        messageField: {
          placeholder: "Write Your Message",
          required: true,
          visible: true,
          rows: 5,
        },
      },
      submitButton: {
        text: "Submit",
        icon: "FaPaperPlane",
        color: "bg-green-500 hover:bg-green-600",
      },
      messages: {
        successMessage: "Message sent successfully!",
        errorMessage: "Submission failed",
      },
      colors: {
        smallText: "text-green-600",
        mainHeading: "text-slate-900",
        buttonText: "text-white",
      },
      image: {
        url: "/images/contact-section.jpg",
        alt: "Contact Support",
      },
      isActive: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setImageUploading(false);
    setFileInputKey((prev) => prev + 1);
  };

  if (contactInfoLoading || contactFormLoading) {
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
          Contact Management
        </h1>
        <p className="text-gray-600">
          Manage your website's contact information and contact form
          configuration
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("contact-info")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "contact-info"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Contact Information
          </button>
          <button
            onClick={() => setActiveTab("contact-form")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "contact-form"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Contact Form
          </button>
        </nav>
      </div>

      {/* Contact Information Tab */}
      {activeTab === "contact-info" && (
        <>
          {/* Create New Contact Info Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingContactInfoId
                ? "Edit Contact Information"
                : "Add New Contact Information"}
            </h2>

            <form onSubmit={handleContactInfoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (e.g., "Our Address", "Contact Number")
                  </label>
                  <input
                    type="text"
                    value={contactInfoFormData.title}
                    onChange={(e) =>
                      handleContactInfoInputChange("title", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter title"
                    required
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <select
                    value={contactInfoFormData.icon}
                    onChange={(e) =>
                      handleContactInfoInputChange("icon", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content (Use &lt;br /&gt; for line breaks)
                </label>
                <textarea
                  value={contactInfoFormData.content}
                  onChange={(e) =>
                    handleContactInfoInputChange("content", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter content (e.g., 3149 New Creek Road, &lt;br /&gt;Huntsville, Alabama, USA)"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use &lt;br /&gt; to create line breaks in the content
                </p>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <select
                  value={contactInfoFormData.bg}
                  onChange={(e) =>
                    handleContactInfoInputChange("bg", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {backgroundOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={contactInfoFormData.isActive}
                    onChange={(e) =>
                      handleContactInfoInputChange("isActive", e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (visible on website)
                  </span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                {editingContactInfoId && (
                  <button
                    type="button"
                    onClick={cancelContactInfoEdit}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    <FaTimes className="inline mr-2" />
                    Cancel
                  </button>
                )}
                <button
                  type={editingContactInfoId ? "button" : "submit"}
                  onClick={
                    editingContactInfoId
                      ? () => handleContactInfoUpdate(editingContactInfoId)
                      : undefined
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaSave className="inline mr-2" />
                  {editingContactInfoId ? "Update" : "Create"} Contact
                  Information
                </button>
              </div>
            </form>
          </div>

          {/* Existing Contact Information */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                Existing Contact Information
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {Array.isArray(contactInfo) &&
                contactInfo.map((contact) => {
                  const IconComponent = iconMap[contact.icon];
                  return (
                    <div key={contact._id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <div
                              className={`bg-gradient-to-br ${contact.bg} rounded-lg p-3 shadow-sm`}
                            >
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow">
                                <IconComponent className="text-lg text-gray-600" />
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {contact.title}
                              </h3>
                              {contact.isActive && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-gray-600 mb-2">
                            <span className="font-medium">Content: </span>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: contact.content,
                              }}
                            />
                          </div>

                          <div className="text-gray-600">
                            <span className="font-medium">Background: </span>
                            <span className="capitalize">
                              {contact.bg.split("-")[1]}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => startContactInfoEdit(contact)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>

                          <button
                            onClick={() =>
                              handleContactInfoToggleActive(
                                contact._id,
                                contact.isActive
                              )
                            }
                            className={`p-2 rounded-md transition-colors ${
                              contact.isActive
                                ? "text-yellow-600 hover:bg-yellow-100"
                                : "text-green-600 hover:bg-green-100"
                            }`}
                            title={contact.isActive ? "Deactivate" : "Activate"}
                          >
                            <FaCheck />
                          </button>

                          <button
                            onClick={() => handleContactInfoDelete(contact._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* Contact Form Tab */}
      {activeTab === "contact-form" && (
        <>
          {/* Create New Contact Form Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingContactFormId
                ? "Edit Contact Form Configuration"
                : "Add New Contact Form Configuration"}
            </h2>

            <form onSubmit={handleContactFormSubmit} className="space-y-6">
              {/* Header Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Small Text (e.g., "🎓 Get In Touch")
                  </label>
                  <input
                    type="text"
                    value={contactFormData.smallText}
                    onChange={(e) =>
                      handleContactFormInputChange("smallText", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter small text"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Heading
                  </label>
                  <input
                    type="text"
                    value={contactFormData.mainHeading}
                    onChange={(e) =>
                      handleContactFormInputChange(
                        "mainHeading",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter main heading"
                    required
                  />
                </div>
              </div>

              {/* Form Fields Configuration */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Form Fields Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Name Field
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={contactFormData.formFields.nameField.placeholder}
                        onChange={(e) =>
                          handleContactFormInputChange(
                            "formFields.nameField.placeholder",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Field placeholder"
                      />
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              contactFormData.formFields.nameField.required
                            }
                            onChange={(e) =>
                              handleContactFormInputChange(
                                "formFields.nameField.required",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          Required
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              contactFormData.formFields.nameField.visible
                            }
                            onChange={(e) =>
                              handleContactFormInputChange(
                                "formFields.nameField.visible",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          Visible
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Email Field
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={
                          contactFormData.formFields.emailField.placeholder
                        }
                        onChange={(e) =>
                          handleContactFormInputChange(
                            "formFields.emailField.placeholder",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Field placeholder"
                      />
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              contactFormData.formFields.emailField.required
                            }
                            onChange={(e) =>
                              handleContactFormInputChange(
                                "formFields.emailField.required",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          Required
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              contactFormData.formFields.emailField.visible
                            }
                            onChange={(e) =>
                              handleContactFormInputChange(
                                "formFields.emailField.visible",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          Visible
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Phone Field
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={
                          contactFormData.formFields.phoneField.placeholder
                        }
                        onChange={(e) =>
                          handleContactFormInputChange(
                            "formFields.phoneField.placeholder",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Field placeholder"
                      />
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              contactFormData.formFields.phoneField.required
                            }
                            onChange={(e) =>
                              handleContactFormInputChange(
                                "formFields.phoneField.required",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          Required
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              contactFormData.formFields.phoneField.visible
                            }
                            onChange={(e) =>
                              handleContactFormInputChange(
                                "formFields.phoneField.visible",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          Visible
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Message Field
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={
                          contactFormData.formFields.messageField.placeholder
                        }
                        onChange={(e) =>
                          handleContactFormInputChange(
                            "formFields.messageField.placeholder",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Field placeholder"
                      />
                      <input
                        type="number"
                        value={contactFormData.formFields.messageField.rows}
                        onChange={(e) =>
                          handleContactFormInputChange(
                            "formFields.messageField.rows",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Number of rows"
                        min="1"
                        max="10"
                      />
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              contactFormData.formFields.messageField.required
                            }
                            onChange={(e) =>
                              handleContactFormInputChange(
                                "formFields.messageField.required",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          Required
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              contactFormData.formFields.messageField.visible
                            }
                            onChange={(e) =>
                              handleContactFormInputChange(
                                "formFields.messageField.visible",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          Visible
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button Configuration */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Submit Button Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={contactFormData.submitButton.text}
                      onChange={(e) =>
                        handleContactFormInputChange(
                          "submitButton.text",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Submit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Color
                    </label>
                    <select
                      value={contactFormData.submitButton.color}
                      onChange={(e) =>
                        handleContactFormInputChange(
                          "submitButton.color",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {buttonColorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages Configuration */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Messages Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Success Message
                    </label>
                    <input
                      type="text"
                      value={contactFormData.messages.successMessage}
                      onChange={(e) =>
                        handleContactFormInputChange(
                          "messages.successMessage",
                          e.target.value
                        )
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
                      value={contactFormData.messages.errorMessage}
                      onChange={(e) =>
                        handleContactFormInputChange(
                          "messages.errorMessage",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Submission failed"
                    />
                  </div>
                </div>
              </div>

              {/* Color Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Color Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Small Text Color
                    </label>
                    <select
                      value={contactFormData.colors.smallText}
                      onChange={(e) =>
                        handleContactFormInputChange(
                          "colors.smallText",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {textColorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Heading Color
                    </label>
                    <select
                      value={contactFormData.colors.mainHeading}
                      onChange={(e) =>
                        handleContactFormInputChange(
                          "colors.mainHeading",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {textColorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Contact Page Image
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      value={contactFormData.image?.alt || ""}
                      onChange={(e) =>
                        handleContactFormInputChange(
                          "image.alt",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact Support"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload New Image
                    </label>
                    <div className="flex space-x-2">
                      <input
                        key={fileInputKey}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={imageUploading}
                        className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          imageUploading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                      {imageFile && !imageUploading && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setFileInputKey((prev) => prev + 1); // Force re-render of file input
                          }}
                          className="px-3 py-2 text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                      {imageUploading && (
                        <div className="flex items-center px-3 py-2 text-blue-600 bg-blue-100 rounded-md">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Uploading...
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>

                  {/* Image Preview */}
                  {(imagePreview || contactFormData.image?.url) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Preview
                      </label>
                      <div className="border border-gray-300 rounded-lg p-4">
                        <img
                          src={
                            imagePreview ||
                            contactFormData.image?.url ||
                            "/images/contact-section.jpg"
                          }
                          alt={contactFormData.image?.alt || "Contact Support"}
                          className="max-w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              e.target.src
                            );
                            e.target.src = "/images/placeholder.jpg";
                          }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-600">
                            {imagePreview
                              ? "New upload preview"
                              : "Current image"}
                          </p>
                          {imagePreview && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              New Image Selected
                            </span>
                          )}
                        </div>
                        {imageFile && (
                          <p className="text-xs text-blue-600 mt-1">
                            File: {imageFile.name} (
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={contactFormData.isActive}
                    onChange={(e) =>
                      handleContactFormInputChange("isActive", e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (visible on website)
                  </span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                {editingContactFormId && (
                  <button
                    type="button"
                    onClick={cancelContactFormEdit}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    <FaTimes className="inline mr-2" />
                    Cancel
                  </button>
                )}
                <button
                  type={editingContactFormId ? "button" : "submit"}
                  onClick={
                    editingContactFormId
                      ? () => handleContactFormUpdate(editingContactFormId)
                      : undefined
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaSave className="inline mr-2" />
                  {editingContactFormId ? "Update" : "Create"} Contact Form
                  Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Existing Contact Form Configurations */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                Existing Contact Form Configurations
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {Array.isArray(contactForms) &&
                contactForms.map((contactForm) => (
                  <div key={contactForm._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {contactForm.smallText}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {contactForm.mainHeading}
                            </p>
                          </div>
                          {contactForm.isActive && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="text-gray-600 mb-2">
                          <span className="font-medium">Submit Button: </span>
                          <span
                            className={`${contactForm.submitButton.color} text-white px-2 py-1 rounded text-sm`}
                          >
                            {contactForm.submitButton.text}
                          </span>
                        </div>

                        <div className="text-gray-600">
                          <span className="font-medium">Success Message: </span>
                          <span>{contactForm.messages.successMessage}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => startContactFormEdit(contactForm)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() =>
                            handleContactFormToggleActive(
                              contactForm._id,
                              contactForm.isActive
                            )
                          }
                          className={`p-2 rounded-md transition-colors ${
                            contactForm.isActive
                              ? "text-yellow-600 hover:bg-yellow-100"
                              : "text-green-600 hover:bg-green-100"
                          }`}
                          title={
                            contactForm.isActive ? "Deactivate" : "Activate"
                          }
                        >
                          <FaCheck />
                        </button>

                        <button
                          onClick={() =>
                            handleContactFormDelete(contactForm._id)
                          }
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
        </>
      )}
    </div>
  );
}
