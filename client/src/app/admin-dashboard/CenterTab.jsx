"use client";

import { getApiBase, getApiOrigin } from "@/lib/apiBase";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = getApiBase();
const API_ORIGIN = getApiOrigin();

const extractCenters = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.centers)) return payload.centers;
  if (Array.isArray(payload?.data?.centers)) return payload.data.centers;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function CenterTab() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fetch centers
  const fetchCenters = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/v1/centers/admin/all`);
      setCenters(extractCenters(res.data));
    } catch {
      toast.error("Failed to load centers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsHydrated(true);
    fetchCenters();
  }, []);

  // Approve Center
  const handleApproveCenter = async (id) => {
    try {
      await axios.patch(`${API}/v1/centers/admin/approve/${id}`);
      toast.success("Center approved");
      fetchCenters();
    } catch {
      toast.error("Approval failed");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Center Management</h2>
        <div className="text-sm text-gray-500">
          Total Centers: {centers.length}
        </div>
      </div>

      {/* Centers Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-gray-500">Loading centers...</p>
        ) : (
          <>
            <table className="min-w-full text-sm border">
              <thead className="bg-green-100">
                <tr>
                  <th className="py-2 px-4 border">Name</th>
                  <th className="py-2 px-4 border">Email</th>
                  <th className="py-2 px-4 border">Phone</th>
                  <th className="py-2 px-4 border">Type</th>
                  <th className="py-2 px-4 border">Location</th>
                  <th className="py-2 px-4 border">Document</th>
                  <th className="py-2 px-4 border">Status</th>
                  <th className="py-2 px-4 border">Registered</th>
                  <th className="py-2 px-4 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((center) => (
                  <tr key={center._id} className="text-center">
                    <td className="border px-4 py-2">{center.name}</td>
                    <td className="border px-4 py-2">{center.email}</td>
                    <td className="border px-4 py-2">{center.phone}</td>
                    <td className="border px-4 py-2">{center.type || "N/A"}</td>
                    <td className="border px-4 py-2">{center.location || "N/A"}</td>
                    <td className="border px-4 py-2">
                      {center.document ? (
                        <a
                          href={`${API_ORIGIN}/${center.document.replace(
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
                      <span
                        className={
                          center.status === "approved"
                            ? "bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold text-xs"
                            : "bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-bold text-xs"
                        }
                      >
                        {center.status}
                      </span>
                    </td>
                    <td className="border px-4 py-2">
                      {isHydrated && center.createdAt
                        ? new Date(center.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="border px-4 py-2">
                      {center.status === "not approved" ? (
                        <button
                          onClick={() => handleApproveCenter(center._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-green-600 font-medium">
                          Approved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {centers.length === 0 && (
              <div className="text-center text-gray-500 py-6">
                No centers found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
