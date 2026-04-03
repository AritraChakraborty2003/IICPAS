"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import { FaSave, FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa";
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

interface EditRefundPolicyTabProps {
  onBack: () => void;
  policyId?: string;
}

const EditRefundPolicyTab = ({ onBack, policyId }: EditRefundPolicyTabProps) => {
  const [refundPolicy, setRefundPolicy] = useState<RefundPolicyData>({
    title: "",
    lastUpdated: "",
    sections: [],
    contactInfo: {
      email: "",
      phone: "",
      address: "",
      businessHours: ""
    },
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (policyId && policyId !== "new") {
      fetchRefundPolicy();
    } else {
      setLoading(false);
    }
  }, [policyId]);

  const fetchRefundPolicy = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      let url;
      if (policyId) {
        // Fetch specific policy by ID
        url = `${API_BASE}/refund-policy/admin/${policyId}`;
      } else {
        // Fetch active policy or first available policy
        url = `${API_BASE}/refund-policy/admin/all`;
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        if (policyId) {
          // Single policy response
          setRefundPolicy(data.data);
        } else {
          // Array of policies response - use the first one or active one
          if (data.data && data.data.length > 0) {
            const activePolicy = data.data.find(policy => policy.isActive) || data.data[0];
            setRefundPolicy(activePolicy);
          } else {
            // No policies exist, set default values
            setRefundPolicy({
              title: "Refund Policy",
              lastUpdated: "January 2025",
              sections: [],
              contactInfo: {
                email: "refunds@iicpa.com",
                phone: "+91 98765 43210",
                address: "",
                businessHours: "Monday - Friday, 9:00 AM - 6:00 PM (IST)"
              },
              isActive: true
            });
          }
        }
      } else {
        toast.error("Failed to fetch refund policy");
      }
    } catch (error) {
      console.error("Error fetching refund policy:", error);
      toast.error("Error fetching refund policy");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      let url;
      let method;
      
      const isNewPolicy = !policyId || policyId === "new";
      
      if (isNewPolicy) {
        // Create new policy
        url = `${API_BASE}/refund-policy/admin/create`;
        method = "POST";
      } else {
        // Update existing policy
        const id = policyId || refundPolicy._id;
        url = `${API_BASE}/refund-policy/admin/update/${id}`;
        method = "PUT";
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(refundPolicy),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(isNewPolicy ? "Refund policy created successfully!" : "Refund policy updated successfully!");
        onBack();
      } else {
        toast.error(data.message || "Failed to save refund policy");
      }
    } catch (error) {
      console.error("Error saving refund policy:", error);
      toast.error("Error saving refund policy");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setRefundPolicy({
      ...refundPolicy,
      sections: [
        ...refundPolicy.sections,
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
    const updatedSections = [...refundPolicy.sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setRefundPolicy({ ...refundPolicy, sections: updatedSections });
  };

  const deleteSection = (index: number) => {
    const updatedSections = refundPolicy.sections.filter((_, i) => i !== index);
    setRefundPolicy({ ...refundPolicy, sections: updatedSections });
  };

  const addSubsection = (sectionIndex: number) => {
    const updatedSections = [...refundPolicy.sections];
    if (!updatedSections[sectionIndex].subsections) {
      updatedSections[sectionIndex].subsections = [];
    }
    updatedSections[sectionIndex].subsections!.push({
      title: "",
      content: "",
      listItems: []
    });
    setRefundPolicy({ ...refundPolicy, sections: updatedSections });
  };

  const updateSubsection = (sectionIndex: number, subsectionIndex: number, field: keyof Subsection, value: any) => {
    const updatedSections = [...refundPolicy.sections];
    if (!updatedSections[sectionIndex].subsections) {
      updatedSections[sectionIndex].subsections = [];
    }
    updatedSections[sectionIndex].subsections![subsectionIndex] = {
      ...updatedSections[sectionIndex].subsections![subsectionIndex],
      [field]: value
    };
    setRefundPolicy({ ...refundPolicy, sections: updatedSections });
  };

  const deleteSubsection = (sectionIndex: number, subsectionIndex: number) => {
    const updatedSections = [...refundPolicy.sections];
    updatedSections[sectionIndex].subsections = updatedSections[sectionIndex].subsections?.filter((_, i) => i !== subsectionIndex);
    setRefundPolicy({ ...refundPolicy, sections: updatedSections });
  };

  const addListItem = (sectionIndex: number, subsectionIndex?: number) => {
    if (subsectionIndex !== undefined) {
      // Add to subsection
      const updatedSections = [...refundPolicy.sections];
      if (!updatedSections[sectionIndex].subsections) {
        updatedSections[sectionIndex].subsections = [];
      }
      if (!updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
        updatedSections[sectionIndex].subsections![subsectionIndex].listItems = [];
      }
      updatedSections[sectionIndex].subsections![subsectionIndex].listItems!.push("");
      setRefundPolicy({ ...refundPolicy, sections: updatedSections });
    } else {
      // Add to section
      const updatedSections = [...refundPolicy.sections];
      if (!updatedSections[sectionIndex].listItems) {
        updatedSections[sectionIndex].listItems = [];
      }
      updatedSections[sectionIndex].listItems!.push("");
      setRefundPolicy({ ...refundPolicy, sections: updatedSections });
    }
  };

  const updateListItem = (sectionIndex: number, itemIndex: number, value: string, subsectionIndex?: number) => {
    if (subsectionIndex !== undefined) {
      // Update subsection list item
      const updatedSections = [...refundPolicy.sections];
      if (updatedSections[sectionIndex].subsections && updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
        updatedSections[sectionIndex].subsections![subsectionIndex].listItems![itemIndex] = value;
      }
      setRefundPolicy({ ...refundPolicy, sections: updatedSections });
    } else {
      // Update section list item
      const updatedSections = [...refundPolicy.sections];
      if (updatedSections[sectionIndex].listItems) {
        updatedSections[sectionIndex].listItems![itemIndex] = value;
      }
      setRefundPolicy({ ...refundPolicy, sections: updatedSections });
    }
  };

  const deleteListItem = (sectionIndex: number, itemIndex: number, subsectionIndex?: number) => {
    if (subsectionIndex !== undefined) {
      // Delete subsection list item
      const updatedSections = [...refundPolicy.sections];
      if (updatedSections[sectionIndex].subsections && updatedSections[sectionIndex].subsections![subsectionIndex].listItems) {
        updatedSections[sectionIndex].subsections![subsectionIndex].listItems = 
          updatedSections[sectionIndex].subsections![subsectionIndex].listItems!.filter((_, i) => i !== itemIndex);
      }
      setRefundPolicy({ ...refundPolicy, sections: updatedSections });
    } else {
      // Delete section list item
      const updatedSections = [...refundPolicy.sections];
      if (updatedSections[sectionIndex].listItems) {
        updatedSections[sectionIndex].listItems = updatedSections[sectionIndex].listItems!.filter((_, i) => i !== itemIndex);
      }
      setRefundPolicy({ ...refundPolicy, sections: updatedSections });
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2 transition-colors"
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {policyId ? "Edit Refund Policy" : "Create Refund Policy"}
            </h2>
            <p className="text-gray-600">Configure your refund policy content</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 disabled:opacity-50 transition-colors"
          >
            <FaSave />
            <span>{saving ? "Saving..." : "Save Policy"}</span>
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={refundPolicy.title}
              onChange={(e) => setRefundPolicy({ ...refundPolicy, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter policy title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Updated
            </label>
            <input
              type="text"
              value={refundPolicy.lastUpdated}
              onChange={(e) => setRefundPolicy({ ...refundPolicy, lastUpdated: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., January 2025"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={refundPolicy.contactInfo.email}
              onChange={(e) => setRefundPolicy({
                ...refundPolicy,
                contactInfo: { ...refundPolicy.contactInfo, email: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="refunds@iicpa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="text"
              value={refundPolicy.contactInfo.phone}
              onChange={(e) => setRefundPolicy({
                ...refundPolicy,
                contactInfo: { ...refundPolicy.contactInfo, phone: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={refundPolicy.contactInfo.address}
              onChange={(e) => setRefundPolicy({
                ...refundPolicy,
                contactInfo: { ...refundPolicy.contactInfo, address: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter full address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Hours
            </label>
            <input
              type="text"
              value={refundPolicy.contactInfo.businessHours || ""}
              onChange={(e) => setRefundPolicy({
                ...refundPolicy,
                contactInfo: { ...refundPolicy.contactInfo, businessHours: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Monday - Friday, 9:00 AM - 6:00 PM"
            />
          </div>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Policy Sections</h3>
          <button
            onClick={addSection}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <FaPlus />
            <span>Add Section</span>
          </button>
        </div>

        <div className="space-y-6">
          {refundPolicy.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-md font-medium text-gray-900">Section {sectionIndex + 1}</h4>
                <button
                  onClick={() => deleteSection(sectionIndex)}
                  className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200"
                  title="Delete section"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(sectionIndex, "title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter section title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Content
                  </label>
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(sectionIndex, "content", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter section content"
                  />
                </div>

                {/* Subsections */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Subsections
                    </label>
                    <button
                      onClick={() => addSubsection(sectionIndex)}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200"
                    >
                      <FaPlus className="inline mr-1" />
                      Add Subsection
                    </button>
                  </div>

                  {section.subsections && section.subsections.map((subsection, subsectionIndex) => (
                    <div key={subsectionIndex} className="ml-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-sm font-medium text-gray-800">Subsection {subsectionIndex + 1}</h5>
                        <button
                          onClick={() => deleteSubsection(sectionIndex, subsectionIndex)}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200"
                          title="Delete subsection"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Subsection Title
                          </label>
                          <input
                            type="text"
                            value={subsection.title || ""}
                            onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, "title", e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter subsection title"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Subsection Content
                          </label>
                          <textarea
                            value={subsection.content || ""}
                            onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, "content", e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Enter subsection content"
                          />
                        </div>

                        {/* Subsection List Items */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-gray-700">
                              List Items
                            </label>
                            <button
                              onClick={() => addListItem(sectionIndex, subsectionIndex)}
                              className="px-1 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                            >
                              <FaPlus className="inline mr-1" />
                              Add Item
                            </button>
                          </div>

                          {subsection.listItems && subsection.listItems.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center space-x-2 mb-1">
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => updateListItem(sectionIndex, itemIndex, e.target.value, subsectionIndex)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter list item"
                              />
                              <button
                                onClick={() => deleteListItem(sectionIndex, itemIndex, subsectionIndex)}
                                className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded hover:bg-red-200"
                                title="Delete list item"
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

                {/* Section List Items */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Section List Items
                    </label>
                    <button
                      onClick={() => addListItem(sectionIndex)}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200"
                    >
                      <FaPlus className="inline mr-1" />
                      Add Item
                    </button>
                  </div>

                  {section.listItems && section.listItems.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateListItem(sectionIndex, itemIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter list item"
                      />
                      <button
                        onClick={() => deleteListItem(sectionIndex, itemIndex)}
                        className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200"
                        title="Delete list item"
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
  );
};

export default EditRefundPolicyTab;
