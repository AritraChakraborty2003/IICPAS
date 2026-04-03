"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash, FaCheck, FaTimes, FaShieldAlt, FaFileExcel, FaDownload } from "react-icons/fa";

interface Subsection {
  title?: string;
  content?: string;
  listItems?: string[];
}

interface Section {
  title: string;
  content: string;
  subsections: Subsection[];
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  businessHours: string;
}

interface TermsOfServiceData {
  _id: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TermsOfServiceTabProps {
  onEditPolicy?: (policyId: string) => void;
}

const TermsOfServiceTab = ({ onEditPolicy }: TermsOfServiceTabProps) => {
  const [termsOfService, setTermsOfService] = useState<TermsOfServiceData[]>([]);
  const [currentPolicy, setCurrentPolicy] = useState<TermsOfServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newListItem, setNewListItem] = useState("");
  const [newSubsectionTitle, setNewSubsectionTitle] = useState("");
  const [newSubsectionContent, setNewSubsectionContent] = useState("");

  useEffect(() => {
    fetchTermsOfService();
  }, []);

  const fetchTermsOfService = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/terms-of-service/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setTermsOfService(data.data);
        if (data.data.length > 0) {
          setCurrentPolicy(data.data[0]);
        }
      } else {
        toast.error("Failed to fetch terms of service");
      }
    } catch (error) {
      console.error("Error fetching terms of service:", error);
      toast.error("Error fetching terms of service");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPolicy) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/terms-of-service/admin/${currentPolicy._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentPolicy),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Terms of service updated successfully");
        setEditing(false);
        fetchTermsOfService();
      } else {
        toast.error(data.message || "Failed to update terms of service");
      }
    } catch (error) {
      console.error("Error updating terms of service:", error);
      toast.error("Error updating terms of service");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (policyId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/terms-of-service/admin/${policyId}/activate`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Terms of service activated successfully");
        fetchTermsOfService();
      } else {
        toast.error(data.message || "Failed to activate terms of service");
      }
    } catch (error) {
      console.error("Error activating terms of service:", error);
      toast.error("Error activating terms of service");
    }
  };

  const handleDelete = async (policyId: string) => {
    const policy = termsOfService.find(p => p._id === policyId);
    
    if (policy?.isActive) {
      toast.error("Cannot delete active terms of service. Please activate another version first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this terms of service? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/terms-of-service/admin/${policyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Terms of service deleted successfully");
        fetchTermsOfService();
      } else {
        toast.error(data.message || "Failed to delete terms of service");
      }
    } catch (error) {
      console.error("Error deleting terms of service:", error);
      toast.error("Error deleting terms of service");
    }
  };

  const addListItem = (sectionIndex: number, subsectionIndex: number) => {
    if (!newListItem.trim()) return;

    const updatedPolicy = { ...currentPolicy! };
    if (!updatedPolicy.sections[sectionIndex].subsections[subsectionIndex].listItems) {
      updatedPolicy.sections[sectionIndex].subsections[subsectionIndex].listItems = [];
    }
    updatedPolicy.sections[sectionIndex].subsections[subsectionIndex].listItems!.push(newListItem);
    setCurrentPolicy(updatedPolicy);
    setNewListItem("");
  };

  const removeListItem = (sectionIndex: number, subsectionIndex: number, itemIndex: number) => {
    const updatedPolicy = { ...currentPolicy! };
    updatedPolicy.sections[sectionIndex].subsections[subsectionIndex].listItems!.splice(itemIndex, 1);
    setCurrentPolicy(updatedPolicy);
  };

  const addSubsection = (sectionIndex: number) => {
    if (!newSubsectionTitle.trim()) return;

    const updatedPolicy = { ...currentPolicy! };
    updatedPolicy.sections[sectionIndex].subsections.push({
      title: newSubsectionTitle,
      content: newSubsectionContent,
      listItems: [],
    });
    setCurrentPolicy(updatedPolicy);
    setNewSubsectionTitle("");
    setNewSubsectionContent("");
  };

  const removeSubsection = (sectionIndex: number, subsectionIndex: number) => {
    const updatedPolicy = { ...currentPolicy! };
    updatedPolicy.sections[sectionIndex].subsections.splice(subsectionIndex, 1);
    setCurrentPolicy(updatedPolicy);
  };

  const exportToExcel = () => {
    if (!currentPolicy) {
      toast.error("No policy data to export");
      return;
    }

    try {
      // Create CSV content
      let csvContent = "Terms of Service Export\n\n";
      csvContent += `Title,${currentPolicy.title}\n`;
      csvContent += `Last Updated,${currentPolicy.lastUpdated}\n`;
      csvContent += `Email,${currentPolicy.contactInfo.email}\n`;
      csvContent += `Phone,${currentPolicy.contactInfo.phone}\n`;
      csvContent += `Address,${currentPolicy.contactInfo.address}\n`;
      csvContent += `Business Hours,${currentPolicy.contactInfo.businessHours}\n\n`;
      
      csvContent += "Sections\n";
      csvContent += "Section Title,Section Content,Subsection Title,Subsection Content,List Items\n";
      
      currentPolicy.sections.forEach((section, sectionIndex) => {
        if (section.subsections.length > 0) {
          section.subsections.forEach((subsection, subsectionIndex) => {
            const listItems = subsection.listItems?.join("; ") || "";
            csvContent += `"${section.title}","${section.content}","${subsection.title || ""}","${subsection.content || ""}","${listItems}"\n`;
          });
        } else {
          csvContent += `"${section.title}","${section.content}","","",""\n`;
        }
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `terms-of-service-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Terms of Service exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Error exporting to Excel");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service Management</h2>
            <p className="text-gray-600">Manage and edit your terms of service content</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
              title="Export to Excel"
            >
              <FaFileExcel className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => onEditPolicy && onEditPolicy("new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              title="Add New Policy"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add New Policy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Policy Versions List */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Versions</h3>
        <div className="space-y-3">
          {termsOfService.map((policy) => (
            <div
              key={policy._id}
              className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                policy.isActive 
                  ? "border-green-500 bg-green-50 shadow-md" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{policy.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {policy.lastUpdated} | Created: {new Date(policy.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditPolicy && onEditPolicy(policy._id)}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200"
                    title="Edit terms of service"
                  >
                    Edit
                  </button>
                  {policy.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaCheck className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivate(policy._id)}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200"
                      title="Activate terms of service"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(policy._id)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete terms of service"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Terms of Service */}
      {currentPolicy && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Terms of Service</h3>
          
          {/* Basic Information */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Title:</span>
                <span className="ml-2 text-gray-900">{currentPolicy.title}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                <span className="ml-2 text-gray-900">{currentPolicy.lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{currentPolicy.contactInfo.email}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Phone:</span>
                <span className="ml-2 text-gray-900">{currentPolicy.contactInfo.phone}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Address:</span>
                <span className="ml-2 text-gray-900">{currentPolicy.contactInfo.address}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Business Hours:</span>
                <span className="ml-2 text-gray-900">{currentPolicy.contactInfo.businessHours}</span>
              </div>
            </div>
          </div>

          {/* Terms of Service Content */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Terms of Service Content</h4>
            <div className="space-y-6">
              {currentPolicy.sections.map((section, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h5 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h5>
                  {section.content && (
                    <p className="text-gray-700 mb-3 leading-relaxed">{section.content}</p>
                  )}
                  {section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="ml-4 mb-3">
                      {subsection.title && (
                        <h6 className="text-md font-medium text-gray-800 mb-1">{subsection.title}</h6>
                      )}
                      {subsection.content && (
                        <p className="text-gray-600 mb-2 leading-relaxed">{subsection.content}</p>
                      )}
                      {subsection.listItems && subsection.listItems.length > 0 && (
                        <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                          {subsection.listItems.map((item, itemIndex) => (
                            <li key={itemIndex}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {currentPolicy && editing && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Terms of Service</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <FaTimes className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={currentPolicy.title}
                onChange={(e) => setCurrentPolicy({ ...currentPolicy, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter terms of service title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
              <input
                type="text"
                value={currentPolicy.lastUpdated}
                onChange={(e) => setCurrentPolicy({ ...currentPolicy, lastUpdated: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last updated date"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={currentPolicy.contactInfo.email}
                  onChange={(e) => setCurrentPolicy({
                    ...currentPolicy,
                    contactInfo: { ...currentPolicy.contactInfo, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={currentPolicy.contactInfo.phone}
                  onChange={(e) => setCurrentPolicy({
                    ...currentPolicy,
                    contactInfo: { ...currentPolicy.contactInfo, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={currentPolicy.contactInfo.address}
                  onChange={(e) => setCurrentPolicy({
                    ...currentPolicy,
                    contactInfo: { ...currentPolicy.contactInfo, address: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
                <input
                  type="text"
                  value={currentPolicy.contactInfo.businessHours}
                  onChange={(e) => setCurrentPolicy({
                    ...currentPolicy,
                    contactInfo: { ...currentPolicy.contactInfo, businessHours: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter business hours"
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            <h4 className="text-md font-semibold text-gray-900">Sections</h4>
            {currentPolicy.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const updatedPolicy = { ...currentPolicy };
                      updatedPolicy.sections[sectionIndex].title = e.target.value;
                      setCurrentPolicy(updatedPolicy);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter section title"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Content</label>
                  <textarea
                    value={section.content}
                    onChange={(e) => {
                      const updatedPolicy = { ...currentPolicy };
                      updatedPolicy.sections[sectionIndex].content = e.target.value;
                      setCurrentPolicy(updatedPolicy);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter section content"
                  />
                </div>

                {/* Subsections */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Subsections</h5>
                  {section.subsections.map((subsection, subsectionIndex) => (
                    <div key={subsectionIndex} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-medium text-gray-600">Subsection {subsectionIndex + 1}</h6>
                        <button
                          onClick={() => removeSubsection(sectionIndex, subsectionIndex)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove subsection"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Subsection Title</label>
                        <input
                          type="text"
                          value={subsection.title || ""}
                          onChange={(e) => {
                            const updatedPolicy = { ...currentPolicy };
                            updatedPolicy.sections[sectionIndex].subsections[subsectionIndex].title = e.target.value;
                            setCurrentPolicy(updatedPolicy);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter subsection title"
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Subsection Content</label>
                        <textarea
                          value={subsection.content || ""}
                          onChange={(e) => {
                            const updatedPolicy = { ...currentPolicy };
                            updatedPolicy.sections[sectionIndex].subsections[subsectionIndex].content = e.target.value;
                            setCurrentPolicy(updatedPolicy);
                          }}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter subsection content"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">List Items</label>
                        {subsection.listItems?.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center space-x-2 mb-1">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const updatedPolicy = { ...currentPolicy };
                                updatedPolicy.sections[sectionIndex].subsections[subsectionIndex].listItems![itemIndex] = e.target.value;
                                setCurrentPolicy(updatedPolicy);
                              }}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter list item"
                            />
                            <button
                              onClick={() => removeListItem(sectionIndex, subsectionIndex, itemIndex)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove list item"
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newListItem}
                            onChange={(e) => setNewListItem(e.target.value)}
                            placeholder="Add new list item"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => addListItem(sectionIndex, subsectionIndex)}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            title="Add list item"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newSubsectionTitle}
                      onChange={(e) => setNewSubsectionTitle(e.target.value)}
                      placeholder="Subsection title"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <textarea
                      value={newSubsectionContent}
                      onChange={(e) => setNewSubsectionContent(e.target.value)}
                      placeholder="Subsection content"
                      rows={2}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => addSubsection(sectionIndex)}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      title="Add subsection"
                    >
                      <FaPlus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsOfServiceTab;
