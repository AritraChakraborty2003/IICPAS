"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import {
  FaSave,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaPlus,
  FaMinus,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function FooterTab() {
  const { user } = useAuth();
  const [footerEntries, setFooterEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    companyInfo: {
      name: "",
      tagline: "",
      contact: {
        phone: "",
        email: "",
        address: "",
      },
    },
    footerLinks: {
      companyPolicies: [],
      generalLinks: [],
    },
    socialLinks: [],
    bottomBar: {
      copyright: "",
      legalLinks: [],
    },
    colors: {
      background: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
      accent: "text-[#3cd664]",
      text: "text-white",
      textSecondary: "text-gray-300",
    },
  });
  const [newLinks, setNewLinks] = useState({
    companyPolicies: { name: "", href: "" },
    generalLinks: { name: "", href: "" },
  });
  const [newSocialLink, setNewSocialLink] = useState({
    platform: "",
    href: "",
    icon: "",
  });
  const [newLegalLink, setNewLegalLink] = useState({ name: "", href: "" });
  const [activeLinkSection, setActiveLinkSection] = useState("companyPolicies");

  const socialIcons = [
    { value: "FaFacebook", label: "Facebook" },
    { value: "FaTwitter", label: "Twitter" },
    { value: "FaLinkedin", label: "LinkedIn" },
    { value: "FaInstagram", label: "Instagram" },
    { value: "FaYoutube", label: "YouTube" },
    { value: "FaWhatsapp", label: "WhatsApp" },
    { value: "FaTelegram", label: "Telegram" },
    { value: "FaDiscord", label: "Discord" },
  ];

  const linkSections = [
    { key: "companyPolicies", label: "Company Policies" },
    { key: "generalLinks", label: "General Links" },
  ];

  const colorOptions = [
    { value: "text-white", label: "White" },
    { value: "text-[#3cd664]", label: "Green" },
    { value: "text-blue-500", label: "Blue" },
    { value: "text-purple-500", label: "Purple" },
    { value: "text-yellow-500", label: "Yellow" },
    { value: "text-red-500", label: "Red" },
    { value: "text-gray-300", label: "Gray" },
    { value: "text-gray-400", label: "Dark Gray" },
  ];

  const backgroundOptions = [
    {
      value: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
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
    { value: "bg-gray-900", label: "Dark Solid" },
    { value: "bg-blue-900", label: "Blue Solid" },
  ];

  useEffect(() => {
    if (user) {
      fetchFooterEntries();
    }
  }, [user]);

  const fetchFooterEntries = async () => {
    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/footer/all`, {
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
      setFooterEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching footer entries:", error);
      toast.error("Failed to fetch Footer content");
      setFooterEntries([]);
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

  const handleLinkAdd = (section) => {
    const linkData = newLinks[section];
    if (
      linkData &&
      linkData.name &&
      linkData.href &&
      linkData.name.trim() &&
      linkData.href.trim()
    ) {
      setFormData((prev) => ({
        ...prev,
        footerLinks: {
          ...prev.footerLinks,
          [section]: [...(prev.footerLinks[section] || []), { ...linkData }],
        },
      }));
      setNewLinks((prev) => ({
        ...prev,
        [section]: { name: "", href: "" },
      }));
    }
  };

  const handleLinkRemove = (section, index) => {
    setFormData((prev) => ({
      ...prev,
      footerLinks: {
        ...prev.footerLinks,
        [section]: (prev.footerLinks[section] || []).filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const handleSocialLinkAdd = () => {
    if (
      newSocialLink.platform.trim() &&
      newSocialLink.href.trim() &&
      newSocialLink.icon.trim()
    ) {
      setFormData((prev) => ({
        ...prev,
        socialLinks: [...prev.socialLinks, { ...newSocialLink }],
      }));
      setNewSocialLink({ platform: "", href: "", icon: "" });
    }
  };

  const handleSocialLinkRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const handleLegalLinkAdd = () => {
    if (newLegalLink.name.trim() && newLegalLink.href.trim()) {
      setFormData((prev) => ({
        ...prev,
        bottomBar: {
          ...prev.bottomBar,
          legalLinks: [...prev.bottomBar.legalLinks, { ...newLegalLink }],
        },
      }));
      setNewLegalLink({ name: "", href: "" });
    }
  };

  const handleLegalLinkRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      bottomBar: {
        ...prev.bottomBar,
        legalLinks: prev.bottomBar.legalLinks.filter((_, i) => i !== index),
      },
    }));
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

      const response = await fetch(`${API_BASE}/footer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Footer content created successfully!");
        fetchFooterEntries();
        resetForm();
      } else {
        toast.error("Failed to create Footer content");
      }
    } catch (error) {
      toast.error("Error creating Footer content");
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

      const response = await fetch(`${API_BASE}/footer/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Footer content updated successfully!");
        fetchFooterEntries();
        setEditingId(null);
        resetForm();
      } else {
        toast.error("Failed to update Footer content");
      }
    } catch (error) {
      toast.error("Error updating Footer content");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Footer content?"))
      return;

    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/footer/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Footer content deleted successfully!");
        fetchFooterEntries();
      } else {
        toast.error("Failed to delete Footer content");
      }
    } catch (error) {
      toast.error("Error deleting Footer content");
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

      const response = await fetch(`${API_BASE}/footer/activate/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Footer content activated successfully!");
        fetchFooterEntries();
      } else {
        toast.error("Failed to activate Footer content");
      }
    } catch (error) {
      toast.error("Error activating Footer content");
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
      companyInfo: {
        name: "",
        tagline: "",
        contact: {
          phone: "",
          email: "",
          address: "",
        },
      },
      footerLinks: {
        courses: [],
        resources: [],
        company: [],
        support: [],
      },
      socialLinks: [],
      bottomBar: {
        copyright: "",
        legalLinks: [],
      },
      colors: {
        background: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
        accent: "text-[#3cd664]",
        text: "text-white",
        textSecondary: "text-gray-300",
      },
    });
    setNewLinks({
      courses: { name: "", href: "" },
      resources: { name: "", href: "" },
      company: { name: "", href: "" },
      support: { name: "", href: "" },
    });
    setNewSocialLink({ platform: "", href: "", icon: "" });
    setNewLegalLink({ name: "", href: "" });
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
          Footer Section Management
        </h1>
        <p className="text-gray-600">
          Manage your website's Footer section content and styling
        </p>
      </div>

      {/* Create New Footer Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Footer Content" : "Create New Footer Content"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.name}
                  onChange={(e) =>
                    handleInputChange("companyInfo.name", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="IICPA Institute"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline
                </label>
                <textarea
                  value={formData.companyInfo.tagline}
                  onChange={(e) =>
                    handleInputChange("companyInfo.tagline", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Company tagline"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-3">
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.companyInfo.contact.phone}
                    onChange={(e) =>
                      handleInputChange(
                        "companyInfo.contact.phone",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.companyInfo.contact.email}
                    onChange={(e) =>
                      handleInputChange(
                        "companyInfo.contact.email",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="info@iicpa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.companyInfo.contact.address}
                    onChange={(e) =>
                      handleInputChange(
                        "companyInfo.contact.address",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="123 Education Street, Learning City, LC 12345"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Footer Links
            </h3>
            <div className="space-y-4">
              {linkSections.map((section) => (
                <div
                  key={section.key}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h4 className="font-medium text-gray-700 mb-3">
                    {section.label}
                  </h4>
                  <div className="space-y-2">
                    {(formData.footerLinks[section.key] || []).map(
                      (link, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={link.name}
                            onChange={(e) => {
                              const newLinks = [
                                ...(formData.footerLinks[section.key] || []),
                              ];
                              newLinks[index].name = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                footerLinks: {
                                  ...prev.footerLinks,
                                  [section.key]: newLinks,
                                },
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Link name"
                          />
                          <input
                            type="text"
                            value={link.href}
                            onChange={(e) => {
                              const newLinks = [
                                ...(formData.footerLinks[section.key] || []),
                              ];
                              newLinks[index].href = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                footerLinks: {
                                  ...prev.footerLinks,
                                  [section.key]: newLinks,
                                },
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Link URL"
                          />
                          <button
                            type="button"
                            onClick={() => handleLinkRemove(section.key, index)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                          >
                            <FaMinus />
                          </button>
                        </div>
                      )
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newLinks[section.key]?.name || ""}
                        onChange={(e) =>
                          setNewLinks((prev) => ({
                            ...prev,
                            [section.key]: {
                              ...(prev[section.key] || { name: "", href: "" }),
                              name: e.target.value,
                            },
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add link name"
                      />
                      <input
                        type="text"
                        value={newLinks[section.key]?.href || ""}
                        onChange={(e) =>
                          setNewLinks((prev) => ({
                            ...prev,
                            [section.key]: {
                              ...(prev[section.key] || { name: "", href: "" }),
                              href: e.target.value,
                            },
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add link URL"
                      />
                      <button
                        type="button"
                        onClick={() => handleLinkAdd(section.key)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Social Links
            </h3>
            <div className="space-y-2">
              {formData.socialLinks.map((social, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={social.platform}
                    onChange={(e) => {
                      const newSocials = [...formData.socialLinks];
                      newSocials[index].platform = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        socialLinks: newSocials,
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Platform name"
                  />
                  <input
                    type="text"
                    value={social.href}
                    onChange={(e) => {
                      const newSocials = [...formData.socialLinks];
                      newSocials[index].href = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        socialLinks: newSocials,
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Social URL"
                  />
                  <select
                    value={social.icon}
                    onChange={(e) => {
                      const newSocials = [...formData.socialLinks];
                      newSocials[index].icon = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        socialLinks: newSocials,
                      }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {socialIcons.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSocialLinkRemove(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                  >
                    <FaMinus />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSocialLink.platform}
                  onChange={(e) =>
                    setNewSocialLink((prev) => ({
                      ...prev,
                      platform: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add platform"
                />
                <input
                  type="text"
                  value={newSocialLink.href}
                  onChange={(e) =>
                    setNewSocialLink((prev) => ({
                      ...prev,
                      href: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add URL"
                />
                <select
                  value={newSocialLink.icon}
                  onChange={(e) =>
                    setNewSocialLink((prev) => ({
                      ...prev,
                      icon: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Icon</option>
                  {socialIcons.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSocialLinkAdd}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Bottom Bar
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Copyright Text
                </label>
                <input
                  type="text"
                  value={formData.bottomBar.copyright}
                  onChange={(e) =>
                    handleInputChange("bottomBar.copyright", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="IICPA Institute. All rights reserved."
                />
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Legal Links</h4>
                <div className="space-y-2">
                  {formData.bottomBar.legalLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => {
                          const newLinks = [...formData.bottomBar.legalLinks];
                          newLinks[index].name = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            bottomBar: {
                              ...prev.bottomBar,
                              legalLinks: newLinks,
                            },
                          }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Link name"
                      />
                      <input
                        type="text"
                        value={link.href}
                        onChange={(e) => {
                          const newLinks = [...formData.bottomBar.legalLinks];
                          newLinks[index].href = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            bottomBar: {
                              ...prev.bottomBar,
                              legalLinks: newLinks,
                            },
                          }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Link URL"
                      />
                      <button
                        type="button"
                        onClick={() => handleLegalLinkRemove(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                      >
                        <FaMinus />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newLegalLink.name}
                      onChange={(e) =>
                        setNewLegalLink((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add legal link name"
                    />
                    <input
                      type="text"
                      value={newLegalLink.href}
                      onChange={(e) =>
                        setNewLegalLink((prev) => ({
                          ...prev,
                          href: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add legal link URL"
                    />
                    <button
                      type="button"
                      onClick={handleLegalLinkAdd}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                    >
                      <FaPlus />
                    </button>
                  </div>
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
              {editingId ? "Update" : "Create"} Footer Content
            </button>
          </div>
        </form>
      </div>

      {/* Existing Footer Contents */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Existing Footer Contents</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {Array.isArray(footerEntries) &&
            footerEntries.map((entry) => (
              <div key={entry._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {entry.companyInfo.name}
                      </h3>
                      {entry.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="text-gray-600 mb-2">
                      <span className="font-medium">Contact: </span>
                      {entry.companyInfo.contact.phone},{" "}
                      {entry.companyInfo.contact.email}
                    </div>

                    <div className="text-gray-600">
                      <span className="font-medium">Social Links: </span>
                      {entry.socialLinks.length} platforms
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
