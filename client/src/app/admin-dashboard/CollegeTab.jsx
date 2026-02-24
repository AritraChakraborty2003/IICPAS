"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

// Use your backend API URL
const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

export default function CollegeTab() {
  const [activeTab, setActiveTab] = useState("colleges");
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [certRequests, setCertRequests] = useState([]);
  const [certLoading, setCertLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fetch colleges
  const fetchColleges = async () => {
    setCollegesLoading(true);
    try {
      const res = await axios.get(`${API}/college`);
      setColleges(res.data.colleges || []);
    } catch {
      toast.error("Failed to load colleges");
    } finally {
      setCollegesLoading(false);
    }
  };

  // Fetch certification requests
  const fetchCertRequests = async () => {
    setCertLoading(true);
    try {
      const res = await axios.get(`${API}/certification-requests`);
      setCertRequests(res.data || []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setCertLoading(false);
    }
  };

  useEffect(() => {
    setIsHydrated(true);
    fetchColleges();
    fetchCertRequests();
  }, []);

  // Approve College
  const handleApproveCollege = async (id) => {
    try {
      await axios.patch(`${API}/college/approve-college/${id}`);
      toast.success("College approved");
      fetchColleges();
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleToggleCollegeStatus = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to toggle active/inactive status for this college?"
    );
    if (!confirmed) return;

    try {
      const res = await axios.patch(`${API}/college/toggle-status/${id}`);
      toast.success(res.data?.message || "College status updated");
      fetchColleges();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update college status");
    }
  };

  const handleDeleteCollege = async (id) => {
    const confirmed = window.confirm(
      "Delete this college permanently? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API}/college/${id}`);
      toast.success(res.data?.message || "College deleted");
      fetchColleges();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete college");
    }
  };

  // Activate Certification Request
  const handleActivateCert = async (id) => {
    try {
      await axios.put(`${API}/certification-requests/${id}`, {
        status: "active",
      });
      toast.success("Activated");
      fetchCertRequests();
    } catch {
      toast.error("Failed to activate");
    }
  };

  // Get base URL for docs (e.g., http://localhost:8080)
  const BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, "") ||
    "http://localhost:8080";

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      {/* Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("colleges")}
            className={`px-4 py-1 rounded-full font-medium text-sm ${
              activeTab === "colleges"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-green-100"
            }`}
          >
            Colleges
          </button>
          <button
            onClick={() => setActiveTab("cert-requests")}
            className={`px-4 py-1 rounded-full font-medium text-sm ${
              activeTab === "cert-requests"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-green-100"
            }`}
          >
            Certification Requests
          </button>
        </div>
        <h2 className="text-2xl font-bold text-green-700">Admin Management</h2>
        <div></div>
      </div>

      {/* Colleges Table */}
      {activeTab === "colleges" && (
        <div className="overflow-x-auto">
          {collegesLoading ? (
            <p className="text-gray-500">Loading colleges...</p>
          ) : (
            <>
              <table className="min-w-full text-sm border">
                <thead className="bg-green-100">
                  <tr>
                    <th className="py-2 px-4 border">Name</th>
                    <th className="py-2 px-4 border">Email</th>
                    <th className="py-2 px-4 border">Phone</th>
                    <th className="py-2 px-4 border">Document</th>
                    <th className="py-2 px-4 border">Status</th>
                    <th className="py-2 px-4 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges.map((college) => (
                    <tr key={college._id} className="text-center">
                      <td className="border px-4 py-2">{college.name}</td>
                      <td className="border px-4 py-2">{college.email}</td>
                      <td className="border px-4 py-2">{college.phone}</td>
                      <td className="border px-4 py-2">
                        {college.document ? (
                          <a
                            href={`${BASE_URL}/${college.document.replace(
                              /^uploads[\/\\]?/,
                              "uploads/"
                            )}`}
                            target="_blank"
                            className="text-blue-600 underline"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="border px-4 py-2 capitalize">
                        {(() => {
                          const normalizedStatus = String(college.status || "").toLowerCase();
                          if (normalizedStatus === "approved") {
                            return (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold text-xs">
                                active
                              </span>
                            );
                          }
                          if (normalizedStatus === "inactive") {
                            return (
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-bold text-xs">
                                inactive
                              </span>
                            );
                          }
                          return (
                            <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-bold text-xs">
                              {college.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="border px-4 py-2">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {String(college.status || "").toLowerCase() ===
                            "not approved" && (
                            <button
                              onClick={() => handleApproveCollege(college._id)}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                          )}
                          {(String(college.status || "").toLowerCase() === "approved" ||
                            String(college.status || "").toLowerCase() === "inactive") && (
                            <button
                              onClick={() => handleToggleCollegeStatus(college._id)}
                              className={`text-white px-3 py-1 rounded ${
                                String(college.status || "").toLowerCase() ===
                                "approved"
                                  ? "bg-yellow-600 hover:bg-yellow-700"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {String(college.status || "").toLowerCase() ===
                              "approved"
                                ? "Set Inactive"
                                : "Set Active"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCollege(college._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {colleges.length === 0 && (
                <div className="text-center text-gray-500 py-6">
                  No colleges found.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Certification Requests Table */}
      {activeTab === "cert-requests" && (
        <div className="overflow-x-auto">
          {certLoading ? (
            <p className="text-gray-500">Loading certification requests...</p>
          ) : (
            <>
              <table className="min-w-full text-sm border">
                <thead className="bg-green-100">
                  <tr>
                    <th className="py-2 px-4 border">College</th>
                    <th className="py-2 px-4 border">Specialization</th>
                    <th className="py-2 px-4 border">Topics</th>
                    <th className="py-2 px-4 border">Document</th>
                    <th className="py-2 px-4 border">Status</th>
                    <th className="py-2 px-4 border">Requested At</th>
                    <th className="py-2 px-4 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certRequests.map((req) => (
                    <tr key={req._id} className="text-center">
                      <td className="border px-4 py-2">{req.college}</td>
                      <td className="border px-4 py-2">{req.specialization}</td>
                      <td className="border px-4 py-2">
                        {(req.topics || []).join(", ")}
                      </td>
                      <td className="border px-4 py-2">
                        {req.document ? (
                          <a
                            href={`${BASE_URL}/${req.document.replace(
                              /^uploads[\/\\]?/,
                              "uploads/"
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-4 py-2 capitalize">
                        <span
                          className={
                            req.status === "active"
                              ? "bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold text-xs"
                              : "bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-bold text-xs"
                          }
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="border px-4 py-2">
                        {isHydrated && req.createdAt
                          ? new Date(req.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {req.status === "pending" && (
                          <button
                            onClick={() => handleActivateCert(req._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Activate
                          </button>
                        )}
                        {req.status === "active" && (
                          <span className="text-green-600 font-medium">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {certRequests.length === 0 && (
                <div className="text-center text-gray-500 py-6">
                  No certification requests found.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
