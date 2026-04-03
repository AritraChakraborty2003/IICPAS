"use client";
import { getApiBase } from "@/lib/apiBase";

import { useEffect, useState } from "react";
import { FiMail } from "react-icons/fi";
import {
  FaWhatsapp,
  FaUserPlus,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaFileExcel,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

const API = `${getApiBase()}/leads`;

export default function AdmissionManagementTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    assignedTo: "",
    scheduledDate: "",
    scheduledTime: "",
    name: "",
    email: "",
    phone: "",
    course: "",
    message: "",
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(API);
      const data = await res.json();
      // Filter only admission course leads
      const admissionLeads = data.leads.filter(
        (lead) => lead.type === "Admission Course"
      );
      setLeads(admissionLeads);
    } catch (error) {
      console.error("Failed to fetch admission leads:", error);
      toast.error("Failed to fetch admission leads");
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (leadId, updateData) => {
    try {
      const res = await fetch(`${API}/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        toast.success("Lead updated successfully");
        fetchLeads();
        return true;
      } else {
        toast.error("Failed to update lead");
        return false;
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
      return false;
    }
  };

  const deleteLead = async (leadId) => {
    try {
      const res = await fetch(`${API}/${leadId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Lead deleted successfully");
        fetchLeads();
        return true;
      } else {
        toast.error("Failed to delete lead");
        return false;
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
      return false;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAssign = (lead) => {
    setSelectedLead(lead);
    setFormData({
      ...formData,
      assignedTo: lead.assignedTo || "",
    });
    setShowAssignModal(true);
  };

  const handleSchedule = (lead) => {
    setSelectedLead(lead);
    setFormData({
      ...formData,
      scheduledDate: lead.scheduledDate
        ? new Date(lead.scheduledDate).toISOString().split("T")[0]
        : "",
      scheduledTime: lead.scheduledTime || "",
    });
    setShowScheduleModal(true);
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      course: lead.course || "",
      message: lead.message || "",
      assignedTo: lead.assignedTo || "",
      scheduledDate: lead.scheduledDate
        ? new Date(lead.scheduledDate).toISOString().split("T")[0]
        : "",
      scheduledTime: lead.scheduledTime || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = (lead) => {
    setSelectedLead(lead);
    setShowDeleteModal(true);
  };

  const handleSaveAssign = async () => {
    if (
      await updateLead(selectedLead._id, { assignedTo: formData.assignedTo })
    ) {
      setShowAssignModal(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (
      await updateLead(selectedLead._id, {
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
      })
    ) {
      setShowScheduleModal(false);
    }
  };

  const handleSaveEdit = async () => {
    if (await updateLead(selectedLead._id, formData)) {
      setShowEditModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (await deleteLead(selectedLead._id)) {
      setShowDeleteModal(false);
    }
  };

  const closeModals = () => {
    setShowAssignModal(false);
    setShowScheduleModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedLead(null);
    setFormData({
      assignedTo: "",
      scheduledDate: "",
      scheduledTime: "",
      name: "",
      email: "",
      phone: "",
      course: "",
      message: "",
    });
  };

  const exportToExcel = () => {
    if (leads.length === 0) {
      toast.error("No admission leads to export");
      return;
    }

    try {
      // Prepare data for Excel export
      const excelData = leads.map((lead, index) => ({
        "S.No": index + 1,
        Name: lead.name || "",
        Phone: lead.phone || "",
        Email: lead.email || "",
        Course: lead.course || "",
        Message: lead.message || "",
        "Assigned To": lead.assignedTo || "",
        "Scheduled Date": lead.scheduledDate
          ? new Date(lead.scheduledDate).toLocaleDateString()
          : "",
        "Scheduled Time": lead.scheduledTime || "",
        "Created Date": lead.createdAt
          ? new Date(lead.createdAt).toLocaleDateString()
          : "",
        "Created Time": lead.createdAt
          ? new Date(lead.createdAt).toLocaleTimeString()
          : "",
        "Updated Date": lead.updatedAt
          ? new Date(lead.updatedAt).toLocaleDateString()
          : "",
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 8 }, // S.No
        { wch: 20 }, // Name
        { wch: 15 }, // Phone
        { wch: 25 }, // Email
        { wch: 20 }, // Course
        { wch: 40 }, // Message
        { wch: 20 }, // Assigned To
        { wch: 15 }, // Scheduled Date
        { wch: 15 }, // Scheduled Time
        { wch: 15 }, // Created Date
        { wch: 15 }, // Created Time
        { wch: 15 }, // Updated Date
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Admission Leads");

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `admission_leads_export_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success(
        `${leads.length} admission leads exported to Excel successfully!`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export admission leads to Excel");
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header + Export Button */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-3">
        <h2 className="text-3xl font-bold text-gray-800">
          🎓 Admission Management
        </h2>
        <div className="flex gap-3 items-center">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
            title="Export to Excel"
          >
            <FaFileExcel className="text-lg" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="text-left px-4 py-3 border-b">S.No</th>
              <th className="text-left px-4 py-3 border-b">Name</th>
              <th className="text-left px-4 py-3 border-b">Phone</th>
              <th className="text-left px-4 py-3 border-b">Email</th>
              <th className="text-left px-4 py-3 border-b">Course</th>
              <th className="text-left px-4 py-3 border-b">Assigned To</th>
              <th className="text-left px-4 py-3 border-b">Scheduled</th>
              <th className="text-left px-4 py-3 border-b">Created Date</th>
              <th className="text-left px-4 py-3 border-b">Contact</th>
              <th className="text-left px-4 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  className="text-center py-4 italic text-gray-500"
                >
                  No admission leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead, index) => (
                <tr key={lead._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{index + 1}</td>
                  <td className="px-4 py-3 border-b">{lead.name}</td>
                  <td className="px-4 py-3 border-b">{lead.phone}</td>
                  <td className="px-4 py-3 border-b">{lead.email}</td>
                  <td className="px-4 py-3 border-b">{lead.course || "-"}</td>
                  <td className="px-4 py-3 border-b">
                    {lead.assignedTo || "-"}
                  </td>
                  <td className="px-4 py-3 border-b">
                    {lead.scheduledDate && lead.scheduledTime ? (
                      <div className="text-xs">
                        <div>
                          {new Date(lead.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {lead.scheduledTime}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 border-b">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex gap-3 text-blue-600">
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          title="Email"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiMail className="text-lg hover:text-blue-800 transition-colors" />
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(
                            /\D/g,
                            ""
                          )}`}
                          title="WhatsApp"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaWhatsapp className="text-lg hover:text-green-600 transition-colors" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssign(lead)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Assign"
                      >
                        <FaUserPlus className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleSchedule(lead)}
                        className="p-1 text-green-600 hover:text-green-800 transition-colors"
                        title="Schedule"
                      >
                        <FaCalendarAlt className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleEdit(lead)}
                        className="p-1 text-yellow-600 hover:text-yellow-800 transition-colors"
                        title="Edit"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Lead</h3>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to:
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter staff member name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssign}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <FaSave />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Schedule Follow-up</h3>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date:
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time:
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <FaSave />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Admission Lead</h3>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone:
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course:
                </label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) =>
                    setFormData({ ...formData, course: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned To:
                </label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter staff member name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date:
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Time:
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message:
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
              >
                <FaSave />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Delete Lead
              </h3>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-700">
                Are you sure you want to delete this admission lead? This action
                cannot be undone.
              </p>
              {selectedLead && (
                <div className="mt-2 p-3 bg-gray-100 rounded-md">
                  <p>
                    <strong>Name:</strong> {selectedLead.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedLead.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedLead.phone}
                  </p>
                  <p>
                    <strong>Course:</strong> {selectedLead.course}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <FaTrash />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
