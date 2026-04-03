"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import { FaSave, FaPlus, FaTrash, FaTimes, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";

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
}

interface CookiePolicyData {
  _id?: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface EditCookiePolicyTabProps {
  onBack: () => void;
  policyId?: string;
}

const EditCookiePolicyTab = ({ onBack, policyId }: EditCookiePolicyTabProps) => {
  const [cookiePolicy, setCookiePolicy] = useState<CookiePolicyData>({
    title: "",
    lastUpdated: "",
    sections: [],
    contactInfo: {
      email: "",
      phone: "",
      address: "",
    },
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newListItem, setNewListItem] = useState("");
  const [newSubsectionTitle, setNewSubsectionTitle] = useState("");
  const [newSubsectionContent, setNewSubsectionContent] = useState("");

  useEffect(() => {
    if (policyId && policyId !== "new") {
      fetchCookiePolicy();
    } else {
      setLoading(false);
    }
  }, [policyId]);

  const fetchCookiePolicy = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/cookie-policy/admin/${policyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setCookiePolicy(data.data);
      } else {
        toast.error("Failed to fetch cookie policy");
      }
    } catch (error) {
      console.error("Error fetching cookie policy:", error);
      toast.error("Error fetching cookie policy");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const isNewPolicy = !policyId || policyId === "new";
      const url = isNewPolicy 
        ? `${API_BASE}/cookie-policy/admin/create`
        : `${API_BASE}/cookie-policy/admin/update/${policyId}`;
      
      const method = isNewPolicy ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cookiePolicy),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(isNewPolicy ? "Cookie policy created successfully!" : "Cookie policy updated successfully!");
        onBack();
      } else {
        toast.error(data.message || "Failed to save cookie policy");
      }
    } catch (error) {
      console.error("Error saving cookie policy:", error);
      toast.error("Error saving cookie policy");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setCookiePolicy({
      ...cookiePolicy,
      sections: [
        ...cookiePolicy.sections,
        {
          title: "",
          content: "",
          subsections: [],
          listItems: []
        }
      ]
    });
  };

  const updateSection = (index: number, field: keyof Section, value: any) => {
    const updatedSections = [...cookiePolicy.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setCookiePolicy({ ...cookiePolicy, sections: updatedSections });
  };

  const deleteSection = (index: number) => {
    const updatedSections = cookiePolicy.sections.filter((_, i) => i !== index);
    setCookiePolicy({ ...cookiePolicy, sections: updatedSections });
  };

  const addSubsection = (sectionIndex: number) => {
    const updatedSections = [...cookiePolicy.sections];
    if (!updatedSections[sectionIndex].subsections) {
      updatedSections[sectionIndex].subsections = [];
    }
    updatedSections[sectionIndex].subsections!.push({
      title: newSubsectionTitle,
      content: newSubsectionContent,
      listItems: []
    });
    
    setCookiePolicy({ ...cookiePolicy, sections: updatedSections });
    setNewSubsectionTitle("");
    setNewSubsectionContent("");
  };

  const updateSubsection = (sectionIndex: number, subsectionIndex: number, field: keyof Subsection, value: any) => {
    const updatedSections = [...cookiePolicy.sections];
    updatedSections[sectionIndex].subsections![subsectionIndex] = {
      ...updatedSections[sectionIndex].subsections![subsectionIndex],
      [field]: value
    };
    setCookiePolicy({ ...cookiePolicy, sections: updatedSections });
  };

  const deleteSubsection = (sectionIndex: number, subsectionIndex: number) => {
    const updatedSections = [...cookiePolicy.sections];
    updatedSections[sectionIndex].subsections!.splice(subsectionIndex, 1);
    setCookiePolicy({ ...cookiePolicy, sections: updatedSections });
  };

  const addListItem = (sectionIndex: number, subsectionIndex?: number) => {
    const updatedSections = [...cookiePolicy.sections];
    
    if (subsectionIndex !== undefined) {
      if (!updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
        updatedSections[sectionIndex].subsections![subsectionIndex].listItems = [];
      }
      updatedSections[sectionIndex].subsections![subsectionIndex].listItems!.push(newListItem);
    } else {
      if (!updatedSections[sectionIndex].listItems) {
        updatedSections[sectionIndex].listItems = [];
      }
      updatedSections[sectionIndex].listItems!.push(newListItem);
    }
    
    setCookiePolicy({ ...cookiePolicy, sections: updatedSections });
    setNewListItem("");
  };

  const removeListItem = (sectionIndex: number, itemIndex: number, subsectionIndex?: number) => {
    const updatedSections = [...cookiePolicy.sections];
    
    if (subsectionIndex !== undefined) {
      updatedSections[sectionIndex].subsections![subsectionIndex].listItems!.splice(itemIndex, 1);
    } else {
      updatedSections[sectionIndex].listItems!.splice(itemIndex, 1);
    }
    
    setCookiePolicy({ ...cookiePolicy, sections: updatedSections });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {policyId ? "Edit Cookie Policy" : "Create New Cookie Policy"}
            </h2>
            <p className="text-gray-600">Configure your cookie policy content</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <FaSave className="w-4 h-4" />
          {saving ? "Saving..." : "Save Policy"}
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={cookiePolicy.title}
              onChange={(e) => setCookiePolicy({ ...cookiePolicy, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cookie Policy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
            <input
              type="text"
              value={cookiePolicy.lastUpdated}
              onChange={(e) => setCookiePolicy({ ...cookiePolicy, lastUpdated: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="January 2025"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={cookiePolicy.contactInfo.email}
              onChange={(e) => setCookiePolicy({
                ...cookiePolicy,
                contactInfo: { ...cookiePolicy.contactInfo, email: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="privacy@iicpa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={cookiePolicy.contactInfo.phone}
              onChange={(e) => setCookiePolicy({
                ...cookiePolicy,
                contactInfo: { ...cookiePolicy.contactInfo, phone: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={cookiePolicy.contactInfo.address}
              onChange={(e) => setCookiePolicy({
                ...cookiePolicy,
                contactInfo: { ...cookiePolicy.contactInfo, address: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Education Street, Learning City, LC 12345"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Policy Sections</h3>
          <button
            onClick={addSection}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaPlus className="w-4 h-4" />
            Add Section
          </button>
        </div>

        <div className="space-y-6">
          {cookiePolicy.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-md font-semibold text-gray-900">Section {sectionIndex + 1}</h4>
                <button
                  onClick={() => deleteSection(sectionIndex)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete section"
                  aria-label="Delete section"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(sectionIndex, "title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter section title"
                    aria-label="Section title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Content</label>
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(sectionIndex, "content", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter section content"
                    aria-label="Section content"
                  />
                </div>

                {/* Subsections */}
                {section.subsections && section.subsections.length > 0 && (
                  <div className="ml-4 space-y-4">
                    <h5 className="text-sm font-semibold text-gray-700">Subsections</h5>
                    {section.subsections.map((subsection, subsectionIndex) => (
                      <div key={subsectionIndex} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h6 className="text-sm font-medium text-gray-700">Subsection {subsectionIndex + 1}</h6>
                          <button
                            onClick={() => deleteSubsection(sectionIndex, subsectionIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete subsection"
                            aria-label="Delete subsection"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Subsection Title</label>
                            <input
                              type="text"
                              value={subsection.title || ""}
                              onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, "title", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter subsection title"
                              aria-label="Subsection title"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Subsection Content</label>
                            <textarea
                              value={subsection.content || ""}
                              onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, "content", e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter subsection content"
                              aria-label="Subsection content"
                            />
                          </div>

                          {/* List Items */}
                          {subsection.listItems && subsection.listItems.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">List Items</label>
                              <ul className="space-y-1">
                                {subsection.listItems.map((item, itemIndex) => (
                                  <li key={itemIndex} className="flex items-center gap-2">
                                    <span className="text-gray-600">{itemIndex + 1}.</span>
                                    <input
                                      type="text"
                                      value={item}
                                      onChange={(e) => {
                                        const updatedItems = [...subsection.listItems!];
                                        updatedItems[itemIndex] = e.target.value;
                                        updateSubsection(sectionIndex, subsectionIndex, "listItems", updatedItems);
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Enter list item"
                                      aria-label="List item"
                                    />
                                    <button
                                      onClick={() => removeListItem(sectionIndex, itemIndex, subsectionIndex)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Remove list item"
                                      aria-label="Remove list item"
                                    >
                                      <FaTimes className="w-3 h-3" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Add List Item */}
                          <div>
                            <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newListItem}
                                  onChange={(e) => setNewListItem(e.target.value)}
                                  placeholder="Add new list item"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  aria-label="New list item"
                                />
                                <button
                                  onClick={() => addListItem(sectionIndex, subsectionIndex)}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  title="Add list item"
                                  aria-label="Add list item"
                                >
                                  <FaPlus className="w-4 h-4" />
                                </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Subsection */}
                <div className="ml-4 p-3 border border-dashed border-gray-300 rounded-lg">
                  <div className="mb-3">
                    <input
                      type="text"
                      value={newSubsectionTitle}
                      onChange={(e) => setNewSubsectionTitle(e.target.value)}
                      placeholder="Subsection title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />
                    <textarea
                      value={newSubsectionContent}
                      onChange={(e) => setNewSubsectionContent(e.target.value)}
                      placeholder="Subsection content"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => addSubsection(sectionIndex)}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Subsection
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default EditCookiePolicyTab;
