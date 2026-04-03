"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import { FaEdit, FaSave, FaPlus, FaTrash, FaTimes, FaFileExcel } from "react-icons/fa";
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';

interface Subsection {
  title?: string;
  content?: string;
  listItems?: string[];
}

interface Section {
  title: string;
  content: string;
  subsections?: Subsection[];
  listItems?: string[];
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  businessHours?: string;
}

interface RefundPolicyData {
  _id?: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface RefundPolicyTabProps {
  onEditPolicy?: (policyId: string) => void;
}

const RefundPolicyTab = ({ onEditPolicy }: RefundPolicyTabProps) => {
  const [refundPolicies, setRefundPolicies] = useState<RefundPolicyData[]>([]);
  const [currentPolicy, setCurrentPolicy] = useState<RefundPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);

  useEffect(() => {
    fetchRefundPolicies();
  }, []);

  const fetchRefundPolicies = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/refund-policy/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setRefundPolicies(data.data);
        if (data.data.length > 0) {
          setCurrentPolicy(data.data[0]);
        }
      } else {
        toast.error("Failed to fetch refund policies");
      }
    } catch (error) {
      console.error("Error fetching refund policies:", error);
      toast.error("Error fetching refund policies");
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
      
      const response = await fetch(`${API_BASE}/refund-policy/admin/update/${currentPolicy._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentPolicy),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Refund policy updated successfully!");
        setEditing(false);
        fetchRefundPolicies();
      } else {
        toast.error(data.message || "Failed to update refund policy");
      }
    } catch (error) {
      console.error("Error updating refund policy:", error);
      toast.error("Error updating refund policy");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (policyId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/refund-policy/admin/activate/${policyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Refund policy activated successfully!");
        fetchRefundPolicies();
      } else {
        toast.error(data.message || "Failed to activate refund policy");
      }
    } catch (error) {
      console.error("Error activating refund policy:", error);
      toast.error("Error activating refund policy");
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!window.confirm("Are you sure you want to delete this refund policy?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/refund-policy/admin/delete/${policyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Refund policy deleted successfully!");
        fetchRefundPolicies();
      } else {
        toast.error(data.message || "Failed to delete refund policy");
      }
    } catch (error) {
      console.error("Error deleting refund policy:", error);
      toast.error("Error deleting refund policy");
    }
  };

  const addSection = () => {
    if (!currentPolicy) return;
    
    const newSection: Section = {
      title: "New Section",
      content: "Section content here...",
      subsections: [],
      listItems: []
    };

    setCurrentPolicy({
      ...currentPolicy,
      sections: [...currentPolicy.sections, newSection]
    });
  };

  const updateSection = (index: number, field: keyof Section, value: any) => {
    if (!currentPolicy) return;
    
    const updatedSections = [...currentPolicy.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    
    setCurrentPolicy({
      ...currentPolicy,
      sections: updatedSections
    });
  };

  const deleteSection = (index: number) => {
    if (!currentPolicy) return;
    
    const updatedSections = currentPolicy.sections.filter((_, i) => i !== index);
    setCurrentPolicy({
      ...currentPolicy,
      sections: updatedSections
    });
  };

  const addSubsection = (sectionIndex: number) => {
    if (!currentPolicy) return;
    
    const newSubsection: Subsection = {
      title: "New Subsection",
      content: "Subsection content here...",
      listItems: []
    };

    const updatedSections = [...currentPolicy.sections];
    updatedSections[sectionIndex].subsections = [
      ...(updatedSections[sectionIndex].subsections || []),
      newSubsection
    ];

    setCurrentPolicy({
      ...currentPolicy,
      sections: updatedSections
    });
  };

  const updateSubsection = (sectionIndex: number, subsectionIndex: number, field: keyof Subsection, value: any) => {
    if (!currentPolicy) return;
    
    const updatedSections = [...currentPolicy.sections];
    const subsections = [...(updatedSections[sectionIndex].subsections || [])];
    subsections[subsectionIndex] = { ...subsections[subsectionIndex], [field]: value };
    updatedSections[sectionIndex].subsections = subsections;

    setCurrentPolicy({
      ...currentPolicy,
      sections: updatedSections
    });
  };

  const deleteSubsection = (sectionIndex: number, subsectionIndex: number) => {
    if (!currentPolicy) return;
    
    const updatedSections = [...currentPolicy.sections];
    updatedSections[sectionIndex].subsections = updatedSections[sectionIndex].subsections?.filter((_, i) => i !== subsectionIndex);

    setCurrentPolicy({
      ...currentPolicy,
      sections: updatedSections
    });
  };

  const addListItem = (sectionIndex: number, subsectionIndex?: number) => {
    if (!currentPolicy) return;
    
    const updatedSections = [...currentPolicy.sections];
    
    if (subsectionIndex !== undefined) {
      // Add to subsection
      if (!updatedSections[sectionIndex].subsections) {
        updatedSections[sectionIndex].subsections = [];
      }
      updatedSections[sectionIndex].subsections![subsectionIndex].listItems = [
        ...(updatedSections[sectionIndex].subsections![subsectionIndex].listItems || []),
        "New list item"
      ];
    } else {
      // Add to section
      updatedSections[sectionIndex].listItems = [
        ...(updatedSections[sectionIndex].listItems || []),
        "New list item"
      ];
    }

    setCurrentPolicy({
      ...currentPolicy,
      sections: updatedSections
    });
  };

  const updateListItem = (sectionIndex: number, itemIndex: number, value: string, subsectionIndex?: number) => {
    if (!currentPolicy) return;
    
    const updatedSections = [...currentPolicy.sections];
    
    if (subsectionIndex !== undefined) {
      // Update subsection list item
      if (updatedSections[sectionIndex].subsections && updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
        updatedSections[sectionIndex].subsections![subsectionIndex].listItems![itemIndex] = value;
      }
    } else {
      // Update section list item
      if (updatedSections[sectionIndex].listItems) {
        updatedSections[sectionIndex].listItems![itemIndex] = value;
      }
    }

    setCurrentPolicy({
      ...currentPolicy,
      sections: updatedSections
    });
  };

  const deleteListItem = (sectionIndex: number, itemIndex: number, subsectionIndex?: number) => {
    if (!currentPolicy) return;
    
    const updatedSections = [...currentPolicy.sections];
    
    if (subsectionIndex !== undefined) {
      // Delete subsection list item
      if (updatedSections[sectionIndex].subsections && updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
        updatedSections[sectionIndex].subsections![subsectionIndex].listItems = 
          updatedSections[sectionIndex].subsections![subsectionIndex].listItems!.filter((_, i) => i !== itemIndex);
      }
    } else {
      // Delete section list item
      if (updatedSections[sectionIndex].listItems) {
        updatedSections[sectionIndex].listItems = updatedSections[sectionIndex].listItems!.filter((_, i) => i !== itemIndex);
      }
    }

    setCurrentPolicy({
      ...currentPolicy,
      sections: updatedSections
    });
  };

  const exportToExcel = async () => {
    try {
      if (!currentPolicy) {
        toast.error('No policy data to export');
        return;
      }

      // Prepare data for export
      const exportData = [
        ['Refund Policy Export'],
        ['Title', currentPolicy.title],
        ['Last Updated', currentPolicy.lastUpdated],
        ['Contact Email', currentPolicy.contactInfo.email],
        ['Contact Phone', currentPolicy.contactInfo.phone],
        ['Contact Address', currentPolicy.contactInfo.address],
        ['Business Hours', currentPolicy.contactInfo.businessHours || 'Not specified'],
        [''],
        ['Sections']
      ];

      // Add sections data
      currentPolicy.sections.forEach((section, index) => {
        exportData.push([`Section ${index + 1}: ${section.title}`]);
        exportData.push(['Content', section.content]);
        
        if (section.subsections && section.subsections.length > 0) {
          exportData.push(['Subsections:']);
          section.subsections.forEach((subsection, subIndex) => {
            exportData.push([`  ${subIndex + 1}. ${subsection.title || 'Untitled'}`]);
            if (subsection.content) {
              exportData.push(['     Content', subsection.content]);
            }
            if (subsection.listItems && subsection.listItems.length > 0) {
              exportData.push(['     List Items:']);
              subsection.listItems.forEach((item, itemIndex) => {
                exportData.push([`       ${itemIndex + 1}. ${item}`]);
              });
            }
          });
        }
        
        if (section.listItems && section.listItems.length > 0) {
          exportData.push(['List Items:']);
          section.listItems.forEach((item, itemIndex) => {
            exportData.push([`  ${itemIndex + 1}. ${item}`]);
          });
        }
        exportData.push(['']);
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Refund Policy');

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `refund-policy-${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      toast.success('Refund policy exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Refund Policy Management</h1>
            <p className="text-gray-600 mt-2">Manage refund policy content and settings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
            >
              <FaFileExcel />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => onEditPolicy && onEditPolicy("new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <FaPlus />
              <span>Add New Policy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Policy List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Refund Policy Versions</h3>
        <div className="space-y-2">
          {refundPolicies.map((policy) => (
            <div
              key={policy._id}
              className={`p-3 rounded-lg border cursor-pointer ${
                policy.isActive ? "border-green-500 bg-green-50" : "border-gray-200"
              }`}
              onClick={() => setCurrentPolicy(policy)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{policy.title}</h4>
                  <p className="text-sm text-gray-600">
                    Last updated: {policy.lastUpdated} | 
                    Created: {new Date(policy.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPolicy && onEditPolicy(policy._id!);
                    }}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200"
                    title="Edit refund policy"
                  >
                    Edit
                  </button>
                  {policy.isActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Active
                    </span>
                  )}
                  {!policy.isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivate(policy._id!);
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(policy._id!);
                    }}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200"
                    title="Delete refund policy"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Read Only View */}
      {currentPolicy && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Refund Policy</h2>
            
            {/* Basic Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <p className="text-lg font-medium text-gray-900">{currentPolicy.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                <p className="text-gray-900">{currentPolicy.lastUpdated}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{currentPolicy.contactInfo.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{currentPolicy.contactInfo.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{currentPolicy.contactInfo.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
                  <p className="text-gray-900">{currentPolicy.contactInfo.businessHours || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Policy Sections</h3>
              {currentPolicy.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">{section.title}</h4>
                  <p className="text-gray-600 leading-relaxed mb-4">{section.content}</p>

                  {/* Subsections */}
                  {section.subsections && section.subsections.length > 0 && (
                    <div className="ml-4 space-y-3">
                      {section.subsections.map((subsection, subsectionIndex) => (
                        <div key={subsectionIndex} className="border-l-2 border-gray-300 pl-4">
                          {subsection.title && (
                            <h5 className="font-medium text-gray-800 mb-2">{subsection.title}</h5>
                          )}
                          {subsection.content && (
                            <p className="text-gray-600 leading-relaxed mb-2">{subsection.content}</p>
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
                  )}

                  {/* Section List Items */}
                  {section.listItems && section.listItems.length > 0 && (
                    <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                      {section.listItems.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

    </div>
  );
};

export default RefundPolicyTab;