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

interface TermsAndConditionsData {
  _id: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TermsAndConditionsTabProps {
  onEditPolicy?: (policyId: string) => void;
}

const TermsAndConditionsTab = ({ onEditPolicy }: TermsAndConditionsTabProps) => {
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditionsData[]>([]);
  const [currentPolicy, setCurrentPolicy] = useState<TermsAndConditionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newListItem, setNewListItem] = useState("");
  const [newSubsectionTitle, setNewSubsectionTitle] = useState("");
  const [newSubsectionContent, setNewSubsectionContent] = useState("");

  useEffect(() => {
    fetchTermsAndConditions();
  }, []);

  const fetchTermsAndConditions = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/terms-and-conditions/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setTermsAndConditions(data.data);
        if (data.data.length > 0) {
          setCurrentPolicy(data.data[0]);
        }
      } else {
        toast.error("Failed to fetch terms and conditions");
      }
    } catch (error) {
      console.error("Error fetching terms and conditions:", error);
      toast.error("Error fetching terms and conditions");
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
      const response = await fetch(`${API_BASE}/terms-and-conditions/admin/update/${currentPolicy._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentPolicy),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Terms and conditions updated successfully");
        setEditing(false);
        fetchTermsAndConditions();
      } else {
        toast.error(data.message || "Failed to update terms and conditions");
      }
    } catch (error) {
      console.error("Error updating terms and conditions:", error);
      toast.error("Error updating terms and conditions");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (policyId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/terms-and-conditions/admin/activate/${policyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Terms and conditions activated successfully");
        fetchTermsAndConditions();
      } else {
        toast.error(data.message || "Failed to activate terms and conditions");
      }
    } catch (error) {
      console.error("Error activating terms and conditions:", error);
      toast.error("Error activating terms and conditions");
    }
  };

  const handleDelete = async (policyId: string) => {
    const policy = termsAndConditions.find(p => p._id === policyId);
    
    if (policy?.isActive) {
      toast.error("Cannot delete active terms and conditions. Please activate another version first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this terms and conditions? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/terms-and-conditions/admin/delete/${policyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Terms and conditions deleted successfully");
        fetchTermsAndConditions();
      } else {
        toast.error(data.message || "Failed to delete terms and conditions");
      }
    } catch (error) {
      console.error("Error deleting terms and conditions:", error);
      toast.error("Error deleting terms and conditions");
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
      let csvContent = "Terms and Conditions Export\n\n";
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
      link.setAttribute('download', `terms-and-conditions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Terms and Conditions exported successfully");
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms & Conditions Management</h2>
            <p className="text-gray-600">Manage and edit your terms and conditions content</p>
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
          {termsAndConditions.map((policy) => (
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
                    title="Edit terms and conditions"
                  >
                    Edit
                  </button>
                  {policy.isActive && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaCheck className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  )}
                  {!policy.isActive && (
                    <button
                      onClick={() => handleActivate(policy._id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      title="Activate this version"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(policy._id)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete terms and conditions"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Terms and Conditions */}
      {currentPolicy && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Terms & Conditions</h3>
          
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

          {/* Terms and Conditions Content */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Terms & Conditions Content</h4>
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
    </div>
  );
};

export default TermsAndConditionsTab;
