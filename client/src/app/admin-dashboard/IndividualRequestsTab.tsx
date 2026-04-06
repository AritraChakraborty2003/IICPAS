"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaEye,
  FaCheck,
  FaTimes,
  FaClock,
  FaSpinner,
  FaDownload,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaFileAlt,
} from "react-icons/fa";

interface TrainingRequest {
  _id: string;
  individualId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  individualName: string;
  individualEmail: string;
  individualPhone: string;
  training: string;
  category: string;
  resume: string;
  status: "pending" | "approved" | "rejected" | "in_progress" | "completed";
  adminNotes?: string;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const IndividualRequestsTab = () => {
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<TrainingRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const API_BASE =
    getApiBase();
  const API_ORIGIN = getApiOrigin();

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "all"
          ? `${API_BASE}/v1/individual/admin/training-requests`
          : `${API_BASE}/v1/individual/admin/training-requests?status=${statusFilter}`;

      const token = localStorage.getItem("adminToken");
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load training requests");
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: string,
    notes?: string
  ) => {
    try {
      setUpdating(requestId);
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${API_BASE}/v1/individual/admin/training-requests/${requestId}`,
        { status, adminNotes: notes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      toast.success(`Request ${status} successfully`);
      fetchRequests();
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request status");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <FaClock className="text-yellow-600" />;
      case "approved":
        return <FaCheck className="text-green-600" />;
      case "rejected":
        return <FaTimes className="text-red-600" />;
      case "in_progress":
        return <FaSpinner className="text-blue-600" />;
      case "completed":
        return <FaCheck className="text-purple-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2 text-gray-600">Loading training requests...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Individual Training Requests
          </h2>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={fetchRequests}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Individual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Training Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No training requests found
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FaUser className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.individualName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <FaEnvelope className="mr-1" />
                          {request.individualEmail}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <FaPhone className="mr-1" />
                          {request.individualPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{request.training}</div>
                      <div className="text-gray-500">
                        Category: {request.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">
                        {request.status.replace("_", " ")}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      {formatDate(request.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {request.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateRequestStatus(request._id, "approved")
                            }
                            disabled={updating === request._id}
                            className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                            title="Approve"
                          >
                            {updating === request._id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaCheck />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              updateRequestStatus(request._id, "rejected")
                            }
                            disabled={updating === request._id}
                            className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                            title="Reject"
                          >
                            {updating === request._id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTimes />
                            )}
                          </button>
                        </>
                      )}
                      {request.status === "approved" && (
                        <button
                          onClick={() =>
                            updateRequestStatus(request._id, "in_progress")
                          }
                          disabled={updating === request._id}
                          className="text-blue-600 hover:text-blue-900 p-1 disabled:opacity-50"
                          title="Start Training"
                        >
                          {updating === request._id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaSpinner />
                          )}
                        </button>
                      )}
                      {request.status === "in_progress" && (
                        <button
                          onClick={() =>
                            updateRequestStatus(request._id, "completed")
                          }
                          disabled={updating === request._id}
                          className="text-purple-600 hover:text-purple-900 p-1 disabled:opacity-50"
                          title="Complete"
                        >
                          {updating === request._id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaCheck />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Training Request Details
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.individualName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.individualEmail}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.individualPhone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-1 capitalize">
                      {selectedRequest.status.replace("_", " ")}
                    </span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Training
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.training}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.category}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Resume
                </label>
                <div className="mt-1 flex items-center">
                  <FaFileAlt className="mr-2 text-gray-400" />
                  <a
                    href={`${API_ORIGIN}${
                      selectedRequest.resume
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FaDownload className="mr-1" />
                    Download Resume
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Submitted
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedRequest.createdAt)}
                </p>
              </div>

              {selectedRequest.approvedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Approved By
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.approvedBy.name} (
                    {selectedRequest.approvedBy.email})
                  </p>
                  {selectedRequest.approvedAt && (
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedRequest.approvedAt)}
                    </p>
                  )}
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Notes
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.adminNotes}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Add Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add notes about this request..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              {selectedRequest.status === "pending" && (
                <>
                  <button
                    onClick={() =>
                      updateRequestStatus(
                        selectedRequest._id,
                        "approved",
                        adminNotes
                      )
                    }
                    disabled={updating === selectedRequest._id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating === selectedRequest._id
                      ? "Updating..."
                      : "Approve"}
                  </button>
                  <button
                    onClick={() =>
                      updateRequestStatus(
                        selectedRequest._id,
                        "rejected",
                        adminNotes
                      )
                    }
                    disabled={updating === selectedRequest._id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {updating === selectedRequest._id
                      ? "Updating..."
                      : "Reject"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualRequestsTab;
