/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = getApiBase();
const API_ORIGIN = getApiOrigin();

const extractCompanies = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.companies)) return payload.companies;
  if (Array.isArray(payload?.data?.companies)) return payload.data.companies;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const CompanyTab = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API}/companies`);
      setCompanies(extractCompanies(res.data));
    } catch {
      toast.error("Failed to fetch companies");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.put(`${API}/companies/approve/${id}`);
      toast.success("Company approved");
      fetchCompanies();
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleToggleStatus = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to toggle active/inactive status for this company?"
    );
    if (!confirmed) return;

    try {
      const res = await axios.patch(`${API}/companies/toggle-status/${id}`);
      toast.success(res.data?.message || "Company status updated");
      fetchCompanies();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update company status"
      );
    }
  };

  const handleDeleteCompany = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this company permanently? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API}/companies/${id}`);
      toast.success(res.data?.message || "Company deleted");
      fetchCompanies();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete company");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-xl font-bold text-green-700">View Companies</h3>
      {companies.length === 0 ? (
        <p>No companies yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-green-100 text-left">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Document</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((comp: any) => (
                <tr key={comp._id}>
                  <td className="p-2 border">{comp.fullName}</td>
                  <td className="p-2 border">{comp.email}</td>
                  <td className="p-2 border">{comp.phone}</td>
                  <td className="p-2 border">
                    {comp.documentPath ? (
                      <a
                        href={`${API_ORIGIN}/${comp.documentPath.replace(
                          /\\/g,
                          "/"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="text-gray-400">Not Uploaded</span>
                    )}
                  </td>
                  <td className="p-2 border">
                    {(() => {
                      const normalizedStatus = String(comp.status || "").toLowerCase();
                      const isActive = normalizedStatus === "approved";
                      const isInactive = normalizedStatus === "inactive";
                      const label = isActive
                        ? "active"
                        : isInactive
                        ? "inactive"
                        : comp.status;
                      const badgeClass = isActive
                        ? "bg-green-200 text-green-700"
                        : isInactive
                        ? "bg-gray-200 text-gray-700"
                        : "bg-yellow-100 text-yellow-600";
                      return (
                        <span className={`px-2 py-1 rounded text-xs ${badgeClass}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-2 border">
                    <div className="flex items-center gap-2 flex-wrap">
                      {String(comp.status || "").toLowerCase() !== "approved" &&
                        String(comp.status || "").toLowerCase() !== "inactive" && (
                          <button
                            onClick={() => handleApprove(comp._id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                          >
                            Approve
                          </button>
                        )}
                      {(String(comp.status || "").toLowerCase() === "approved" ||
                        String(comp.status || "").toLowerCase() === "inactive") && (
                        <button
                          onClick={() => handleToggleStatus(comp._id)}
                          className={`px-3 py-1 text-sm text-white rounded ${
                            String(comp.status || "").toLowerCase() === "approved"
                              ? "bg-yellow-600"
                              : "bg-blue-600"
                          }`}
                        >
                          {String(comp.status || "").toLowerCase() === "approved"
                            ? "Set Inactive"
                            : "Set Active"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCompany(comp._id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyTab;
