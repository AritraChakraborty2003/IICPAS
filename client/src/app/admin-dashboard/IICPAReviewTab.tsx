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

interface IICPAReviewData {
  _id: string;
  title: string;
  lastUpdated: string;
  sections: Section[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IICPAReviewTabProps {
  onEditReview?: (reviewId: string) => void;
}

const IICPAReviewTab = ({ onEditReview }: IICPAReviewTabProps) => {
  const [iicpaReviews, setIicpaReviews] = useState<IICPAReviewData[]>([]);
  const [currentReview, setCurrentReview] = useState<IICPAReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchIICPAReviews();
  }, []);

  const fetchIICPAReviews = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/iicpa-review/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setIicpaReviews(data.data);
        if (data.data.length > 0) {
          setCurrentReview(data.data[0]);
        }
      } else {
        toast.error("Failed to fetch IICPA Reviews");
      }
    } catch (error) {
      console.error("Error fetching IICPA Reviews:", error);
      toast.error("Error fetching IICPA Reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentReview) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/iicpa-review/admin/update/${currentReview._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentReview),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("IICPA Review updated successfully!");
        setEditing(false);
        fetchIICPAReviews();
      } else {
        toast.error(data.message || "Failed to update IICPA Review");
      }
    } catch (error) {
      console.error("Error updating IICPA Review:", error);
      toast.error("Error updating IICPA Review");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (reviewId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/iicpa-review/admin/activate/${reviewId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("IICPA Review activated successfully!");
        fetchIICPAReviews();
      } else {
        toast.error(data.message || "Failed to activate IICPA Review");
      }
    } catch (error) {
      console.error("Error activating IICPA Review:", error);
      toast.error("Error activating IICPA Review");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this IICPA Review?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/iicpa-review/admin/delete/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("IICPA Review deleted successfully!");
        fetchIICPAReviews();
      } else {
        toast.error(data.message || "Failed to delete IICPA Review");
      }
    } catch (error) {
      console.error("Error deleting IICPA Review:", error);
      toast.error("Error deleting IICPA Review");
    }
  };

  const exportToExcel = async () => {
    try {
      const exportData = [
        ["Title", "Last Updated", "Sections Count", "Status", "Created At"],
        ...iicpaReviews.map(review => [
          review.title,
          review.lastUpdated,
          review.sections.length,
          review.isActive ? "Active" : "Inactive",
          new Date(review.createdAt).toLocaleDateString()
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'IICPA Review');

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `iicpa-review-${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success('IICPA Review exported successfully!');
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
        <h2 className="text-2xl font-bold text-gray-900">IICPA Review Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <FaFileExcel />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => onEditReview && onEditReview("new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FaPlus />
            <span>Add New Review</span>
          </button>
        </div>
      </div>

      {/* Review Versions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">IICPA Review Versions</h3>
        <div className="space-y-4">
          {iicpaReviews.map((review) => (
            <div
              key={review._id}
              className={`border rounded-lg p-4 ${
                review.isActive ? "border-green-500 bg-green-50" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{review.title}</h4>
                  <p className="text-sm text-gray-600">
                    Last updated: {review.lastUpdated} | Created: {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Sections: {review.sections.length}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditReview && onEditReview(review._id)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    Edit
                  </button>
                  {review.isActive ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivate(review._id)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review._id)}
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

      {/* Current Review Preview */}
      {currentReview && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Current IICPA Review</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{currentReview.title}</h4>
              <p className="text-sm text-gray-600">Last updated: {currentReview.lastUpdated}</p>
            </div>
            <div className="space-y-3">
              {currentReview.sections.slice(0, 3).map((section, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-medium text-gray-800">{section.title}</h5>
                  <p className="text-sm text-gray-600 line-clamp-2">{section.content}</p>
                </div>
              ))}
              {currentReview.sections.length > 3 && (
                <p className="text-sm text-gray-500">
                  ... and {currentReview.sections.length - 3} more sections
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IICPAReviewTab;
