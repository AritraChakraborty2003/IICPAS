"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaFileExcel } from "react-icons/fa";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

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

interface ConfidentialityPolicyData {
  _id: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfidentialityPolicyTabProps {
  onEditPolicy?: (policyId: string) => void;
}

const ConfidentialityPolicyTab = ({ onEditPolicy }: ConfidentialityPolicyTabProps) => {
  const [confidentialityPolicies, setConfidentialityPolicies] = useState<ConfidentialityPolicyData[]>([]);
  const [currentPolicy, setCurrentPolicy] = useState<ConfidentialityPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchConfidentialityPolicies();
  }, []);

  const fetchConfidentialityPolicies = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/confidentiality-policy/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setConfidentialityPolicies(data.data);
        if (data.data.length > 0) {
          setCurrentPolicy(data.data[0]);
        }
      } else {
        toast.error("Failed to fetch confidentiality policies");
      }
    } catch (error) {
      console.error("Error fetching confidentiality policies:", error);
      toast.error("Error fetching confidentiality policies");
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
      
      const response = await fetch(`${API_BASE}/confidentiality-policy/admin/update/${currentPolicy._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentPolicy),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Confidentiality policy updated successfully!");
        setEditing(false);
        fetchConfidentialityPolicies();
      } else {
        toast.error(data.message || "Failed to update confidentiality policy");
      }
    } catch (error) {
      console.error("Error updating confidentiality policy:", error);
      toast.error("Error updating confidentiality policy");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (policyId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/confidentiality-policy/admin/activate/${policyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Confidentiality policy activated successfully!");
        fetchConfidentialityPolicies();
      } else {
        toast.error(data.message || "Failed to activate confidentiality policy");
      }
    } catch (error) {
      console.error("Error activating confidentiality policy:", error);
      toast.error("Error activating confidentiality policy");
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!confirm("Are you sure you want to delete this confidentiality policy?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/confidentiality-policy/admin/delete/${policyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Confidentiality policy deleted successfully!");
        fetchConfidentialityPolicies();
      } else {
        toast.error(data.message || "Failed to delete confidentiality policy");
      }
    } catch (error) {
      console.error("Error deleting confidentiality policy:", error);
      toast.error("Error deleting confidentiality policy");
    }
  };

  const exportToExcel = async () => {
    try {
      const exportData = [
        ["Title", "Last Updated", "Sections Count", "Status", "Created At"],
        ...confidentialityPolicies.map(policy => [
          policy.title,
          policy.lastUpdated,
          policy.sections.length,
          policy.isActive ? "Active" : "Inactive",
          new Date(policy.createdAt).toLocaleDateString()
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Confidentiality Policy');

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `confidentiality-policy-${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success('Confidentiality policy exported successfully!');
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Confidentiality Policy Management</h2>
        <div className="flex space-x-2">
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

      {/* Policy Versions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Confidentiality Policy Versions</h3>
        <div className="space-y-4">
          {confidentialityPolicies.map((policy) => (
            <div
              key={policy._id}
              className={`border rounded-lg p-4 ${
                policy.isActive ? "border-green-500 bg-green-50" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{policy.title}</h4>
                  <p className="text-sm text-gray-600">
                    Last updated: {policy.lastUpdated} | Created: {new Date(policy.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Sections: {policy.sections.length}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditPolicy && onEditPolicy(policy._id)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    Edit
                  </button>
                  {policy.isActive ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivate(policy._id)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(policy._id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Policy Preview */}
      {currentPolicy && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Current Confidentiality Policy</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{currentPolicy.title}</h4>
              <p className="text-sm text-gray-600">Last updated: {currentPolicy.lastUpdated}</p>
            </div>
            <div className="space-y-3">
              {currentPolicy.sections.slice(0, 3).map((section, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-medium text-gray-800">{section.title}</h5>
                  <p className="text-sm text-gray-600 line-clamp-2">{section.content}</p>
                </div>
              ))}
              {currentPolicy.sections.length > 3 && (
                <p className="text-sm text-gray-500">
                  ... and {currentPolicy.sections.length - 3} more sections
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfidentialityPolicyTab;
