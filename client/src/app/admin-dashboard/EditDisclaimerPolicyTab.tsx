"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import { FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";

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

interface DisclaimerPolicyData {
  _id: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditDisclaimerPolicyTabProps {
  onBack: () => void;
  policyId: string;
}

const EditDisclaimerPolicyTab = ({ onBack, policyId }: EditDisclaimerPolicyTabProps) => {
  const [policy, setPolicy] = useState<DisclaimerPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (policyId === "new") {
      // Create new policy
      setPolicy({
        _id: "",
        title: "Disclaimer Policy",
        lastUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        sections: [
          {
            title: "Introduction",
            content: "This Disclaimer Policy outlines the terms and conditions for using IICPA Institute's services and website.",
            subsections: []
          }
        ],
        contactInfo: {
          email: "privacy@iicpa.com",
          phone: "+91 98765 43210",
          address: "123 Education Street, Learning City, LC 12345"
        },
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setLoading(false);
    } else {
      fetchPolicy();
    }
  }, [policyId]);

  const fetchPolicy = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/disclaimer-policy/admin/${policyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setPolicy(data.data);
      } else {
        toast.error("Failed to fetch disclaimer policy");
      }
    } catch (error) {
      console.error("Error fetching disclaimer policy:", error);
      toast.error("Error fetching disclaimer policy");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!policy) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      let response;
      if (policyId === "new") {
        // Create new policy
        response = await fetch(`${API_BASE}/disclaimer-policy/admin/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(policy),
        });
      } else {
        // Update existing policy
        response = await fetch(`${API_BASE}/disclaimer-policy/admin/update/${policyId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(policy),
        });
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(policyId === "new" ? "Disclaimer policy created successfully!" : "Disclaimer policy updated successfully!");
        onBack();
      } else {
        toast.error(data.message || "Failed to save disclaimer policy");
      }
    } catch (error) {
      console.error("Error saving disclaimer policy:", error);
      toast.error("Error saving disclaimer policy");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    if (!policy) return;
    const newSection: Section = {
      title: "New Section",
      content: "Section content...",
      subsections: []
    };
    setPolicy({
      ...policy,
      sections: [...policy.sections, newSection]
    });
  };

  const updateSection = (index: number, field: string, value: string) => {
    if (!policy) return;
    const updatedSections = [...policy.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setPolicy({ ...policy, sections: updatedSections });
  };

  const deleteSection = (index: number) => {
    if (!policy) return;
    const updatedSections = policy.sections.filter((_, i) => i !== index);
    setPolicy({ ...policy, sections: updatedSections });
  };

  const addSubsection = (sectionIndex: number) => {
    if (!policy) return;
    const updatedSections = [...policy.sections];
    if (!updatedSections[sectionIndex].subsections) {
      updatedSections[sectionIndex].subsections = [];
    }
    updatedSections[sectionIndex].subsections!.push({
      title: "New Subsection",
      content: "Subsection content...",
      listItems: []
    });
    setPolicy({ ...policy, sections: updatedSections });
  };

  const updateSubsection = (sectionIndex: number, subsectionIndex: number, field: string, value: string | string[]) => {
    if (!policy) return;
    const updatedSections = [...policy.sections];
    if (updatedSections[sectionIndex].subsections) {
      updatedSections[sectionIndex].subsections![subsectionIndex] = {
        ...updatedSections[sectionIndex].subsections![subsectionIndex],
        [field]: value
      };
      setPolicy({ ...policy, sections: updatedSections });
    }
  };

  const deleteSubsection = (sectionIndex: number, subsectionIndex: number) => {
    if (!policy) return;
    const updatedSections = [...policy.sections];
    if (updatedSections[sectionIndex].subsections) {
      updatedSections[sectionIndex].subsections = updatedSections[sectionIndex].subsections!.filter((_, i) => i !== subsectionIndex);
      setPolicy({ ...policy, sections: updatedSections });
    }
  };

  const addListItem = (sectionIndex: number, subsectionIndex: number) => {
    if (!policy) return;
    const updatedSections = [...policy.sections];
    if (updatedSections[sectionIndex].subsections) {
      if (!updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
        updatedSections[sectionIndex].subsections![subsectionIndex].listItems = [];
      }
      updatedSections[sectionIndex].subsections![subsectionIndex].listItems!.push("New list item");
      setPolicy({ ...policy, sections: updatedSections });
    }
  };

  const updateListItem = (sectionIndex: number, subsectionIndex: number, itemIndex: number, value: string) => {
    if (!policy) return;
    const updatedSections = [...policy.sections];
    if (updatedSections[sectionIndex].subsections && updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
      updatedSections[sectionIndex].subsections![subsectionIndex].listItems![itemIndex] = value;
      setPolicy({ ...policy, sections: updatedSections });
    }
  };

  const deleteListItem = (sectionIndex: number, subsectionIndex: number, itemIndex: number) => {
    if (!policy) return;
    const updatedSections = [...policy.sections];
    if (updatedSections[sectionIndex].subsections && updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
      updatedSections[sectionIndex].subsections![subsectionIndex].listItems = updatedSections[sectionIndex].subsections![subsectionIndex].listItems!.filter((_, i) => i !== itemIndex);
      setPolicy({ ...policy, sections: updatedSections });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">Policy not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <FaTimes />
          <span>Back</span>
        </button>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <FaSave />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {policyId === "new" ? "Create New Disclaimer Policy" : "Edit Disclaimer Policy"}
        </h2>

        {/* Basic Information */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={policy.title}
              onChange={(e) => setPolicy({ ...policy, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
            <input
              type="text"
              value={policy.lastUpdated}
              onChange={(e) => setPolicy({ ...policy, lastUpdated: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={policy.contactInfo.email}
                onChange={(e) => setPolicy({ ...policy, contactInfo: { ...policy.contactInfo, email: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="text"
                value={policy.contactInfo.phone}
                onChange={(e) => setPolicy({ ...policy, contactInfo: { ...policy.contactInfo, phone: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={policy.contactInfo.address}
                onChange={(e) => setPolicy({ ...policy, contactInfo: { ...policy.contactInfo, address: e.target.value } })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
            <button
              onClick={addSection}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <FaPlus />
              <span>Add Section</span>
            </button>
          </div>

          {policy.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-md font-medium text-gray-800">Section {sectionIndex + 1}</h4>
                <button
                  onClick={() => deleteSection(sectionIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(sectionIndex, "title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Content</label>
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(sectionIndex, "content", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Subsections */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="text-sm font-medium text-gray-700">Subsections</h5>
                    <button
                      onClick={() => addSubsection(sectionIndex)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <FaPlus />
                      <span>Add</span>
                    </button>
                  </div>

                  {section.subsections?.map((subsection, subsectionIndex) => (
                    <div key={subsectionIndex} className="border border-gray-100 rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="text-xs font-medium text-gray-600">Subsection {subsectionIndex + 1}</h6>
                        <button
                          onClick={() => deleteSubsection(sectionIndex, subsectionIndex)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Subsection Title</label>
                          <input
                            type="text"
                            value={subsection.title || ""}
                            onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, "title", e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Subsection Content</label>
                          <textarea
                            value={subsection.content || ""}
                            onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, "content", e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* List Items */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-medium text-gray-600">List Items</label>
                            <button
                              onClick={() => addListItem(sectionIndex, subsectionIndex)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center space-x-1"
                            >
                              <FaPlus />
                              <span>Add</span>
                            </button>
                          </div>

                          {subsection.listItems?.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => updateListItem(sectionIndex, subsectionIndex, itemIndex, e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => deleteListItem(sectionIndex, subsectionIndex, itemIndex)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditDisclaimerPolicyTab;
