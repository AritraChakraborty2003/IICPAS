"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTrash, FaCheck, FaFileExcel } from "react-icons/fa";
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

interface CookiePolicyTabProps {
  onEditPolicy?: (policyId: string) => void;
}

const CookiePolicyTab = ({ onEditPolicy }: CookiePolicyTabProps) => {
  const [cookiePolicies, setCookiePolicies] = useState<CookiePolicyData[]>([]);
  const [currentPolicy, setCurrentPolicy] = useState<CookiePolicyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCookiePolicies();
  }, []);

  const fetchCookiePolicies = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/cookie-policy/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setCookiePolicies(data.data);
        if (data.data.length > 0) {
          setCurrentPolicy(data.data[0]);
        }
      } else {
        toast.error("Failed to fetch cookie policies");
      }
    } catch (error) {
      console.error("Error fetching cookie policies:", error);
      toast.error("Error fetching cookie policies");
    } finally {
      setLoading(false);
    }
  };


  const handleActivate = async (policyId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/cookie-policy/admin/activate/${policyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Cookie policy activated successfully!");
        fetchCookiePolicies();
      } else {
        toast.error(data.message || "Failed to activate cookie policy");
      }
    } catch (error) {
      console.error("Error activating cookie policy:", error);
      toast.error("Error activating cookie policy");
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!confirm("Are you sure you want to delete this cookie policy?")) return;
    
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/cookie-policy/admin/delete/${policyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Cookie policy deleted successfully!");
        fetchCookiePolicies();
      } else {
        toast.error(data.message || "Failed to delete cookie policy");
      }
    } catch (error) {
      console.error("Error deleting cookie policy:", error);
      toast.error("Error deleting cookie policy");
    }
  };

  const exportToExcel = () => {
    if (!currentPolicy) return;
    
    const data = [
      ["Cookie Policy Export"],
      ["Title", currentPolicy.title],
      ["Last Updated", currentPolicy.lastUpdated],
      ["Active", currentPolicy.isActive ? "Yes" : "No"],
      ["Created At", currentPolicy.createdAt],
      ["Updated At", currentPolicy.updatedAt],
      [""],
      ["Contact Information"],
      ["Email", currentPolicy.contactInfo.email],
      ["Phone", currentPolicy.contactInfo.phone],
      ["Address", currentPolicy.contactInfo.address],
      [""],
      ["Sections"]
    ];

    currentPolicy.sections.forEach((section, index) => {
      data.push([`Section ${index + 1}: ${section.title}`]);
      data.push(["Content", section.content]);
      
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((subsection, subIndex) => {
          if (subsection.title) {
            data.push([`  Subsection ${subIndex + 1}: ${subsection.title}`]);
          }
          if (subsection.content) {
            data.push(["  Content", subsection.content]);
          }
          if (subsection.listItems && subsection.listItems.length > 0) {
            subsection.listItems.forEach((item, itemIndex) => {
              data.push([`    ${itemIndex + 1}.`, item]);
            });
          }
        });
      }
      
      if (section.listItems && section.listItems.length > 0) {
        section.listItems.forEach((item, itemIndex) => {
          data.push([`  ${itemIndex + 1}.`, item]);
        });
      }
      data.push([""]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cookie Policy");
    
    const fileName = `cookie-policy-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success("Cookie policy exported to Excel successfully!");
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cookie Policy Management</h2>
          <p className="text-gray-600">Manage and edit your cookie policy content</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FaFileExcel className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => onEditPolicy && onEditPolicy("new")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Add New Policy
          </button>
        </div>
      </div>

      {/* Policy Versions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Versions</h3>
        <div className="space-y-3">
          {cookiePolicies.map((policy) => (
            <div
              key={policy._id}
              className={`p-4 rounded-lg border-2 ${
                policy.isActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900">{policy.title}</h4>
                  <p className="text-sm text-gray-600">
                    Last updated: {policy.lastUpdated} | Created: {new Date(policy.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditPolicy && onEditPolicy(policy._id!)}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200"
                    title="Edit cookie policy"
                  >
                    Edit
                  </button>
                  {policy.isActive && (
                    <span className="flex items-center gap-1 text-green-600">
                      <FaCheck className="w-4 h-4" />
                      Active
                    </span>
                  )}
                  <button
                    onClick={() => handleActivate(policy._id!)}
                    disabled={policy.isActive}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {policy.isActive ? "Active" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(policy._id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete policy"
                    aria-label="Delete policy"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Cookie Policy */}
      {currentPolicy && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Cookie Policy</h3>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {currentPolicy.title}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {currentPolicy.lastUpdated}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {currentPolicy.contactInfo.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {currentPolicy.contactInfo.phone}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {currentPolicy.contactInfo.address}
                </div>
              </div>
            </div>
          </div>

          {/* Cookie Policy Content */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Cookie Policy Content</h4>
            <div className="space-y-6">
              {currentPolicy.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {section.title}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section Content</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px]">
                      {section.content}
                    </div>
                  </div>

                  {/* Subsections */}
                  {section.subsections && section.subsections.length > 0 && (
                    <div className="ml-4 space-y-4">
                      {section.subsections.map((subsection, subsectionIndex) => (
                        <div key={subsectionIndex} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subsection Title</label>
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700">
                              {subsection.title || ""}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subsection Content</label>
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 min-h-[60px]">
                              {subsection.content || ""}
                            </div>
                          </div>

                          {/* List Items */}
                          {subsection.listItems && subsection.listItems.length > 0 && (
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">List Items</label>
                              <ul className="space-y-1">
                                {subsection.listItems.map((item, itemIndex) => (
                                  <li key={itemIndex} className="flex items-center gap-2">
                                    <span className="text-gray-600">{itemIndex + 1}.</span>
                                    <div className="flex-1 px-2 py-1 border border-gray-300 rounded bg-white text-gray-700">
                                      {item}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookiePolicyTab;
