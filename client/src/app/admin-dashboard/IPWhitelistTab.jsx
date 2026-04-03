"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaShieldAlt,
} from "react-icons/fa";

const API_BASE = getApiBase();

export default function IPWhitelistTab() {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedIP, setSelectedIP] = useState(null);
  const [formData, setFormData] = useState({
    ipAddress: "",
    description: "",
    status: "Active",
  });

  // Fetch IPs on component mount
  useEffect(() => {
    fetchIPs();
  }, []);

  const fetchIPs = async () => {
    try {
      setLoading(true);
      // Always show mock data for now since backend API is not working
      setIps([
        {
          _id: "1",
          ipAddress: "192.168.1.100",
          description: "Office Network",
          status: "Active",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          ipAddress: "10.0.0.50",
          description: "Home Office",
          status: "Active",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "3",
          ipAddress: "172.16.0.25",
          description: "Branch Office",
          status: "Inactive",
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error fetching IPs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      ipAddress: "",
      description: "",
      status: "Active",
    });
    setShowAddForm(true);
  };

  const handleEdit = (ip) => {
    setSelectedIP(ip);
    setFormData({
      ipAddress: ip.ipAddress,
      description: ip.description,
      status: ip.status,
    });
    setShowEditForm(true);
  };

  const handleDelete = async (ipId, ipAddress) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete IP address ${ipAddress}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/ip-whitelist/${ipId}`);

        Swal.fire({
          title: "Deleted!",
          text: "IP address has been deleted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        fetchIPs();
      } catch (error) {
        console.error("Error deleting IP:", error);

        Swal.fire({
          title: "Error!",
          text: "Failed to delete IP address. Please try again.",
          icon: "error",
          confirmButtonColor: "#3085d6",
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditForm) {
        await axios.put(`${API_BASE}/ip-whitelist/${selectedIP._id}`, formData);
        toast.success("IP updated successfully!");
        setShowEditForm(false);
        setSelectedIP(null);
        setFormData({
          ipAddress: "",
          description: "",
          status: "Active",
        });
      } else {
        await axios.post(`${API_BASE}/ip-whitelist`, formData);
        toast.success("IP added successfully!");
        setShowAddForm(false);
        setFormData({
          ipAddress: "",
          description: "",
          status: "Active",
        });
      }
      fetchIPs();
    } catch (error) {
      console.error("Error saving IP:", error);
      toast.error("Failed to save IP");
    }
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {showAddForm
              ? "Add IP Address"
              : showEditForm
              ? "Edit IP Address"
              : "IP Whitelisting"}
          </h1>
          <p className="text-gray-600 mt-1">
            {showAddForm
              ? "Add a new IP address to the whitelist"
              : showEditForm
              ? "Edit the selected IP address"
              : "Manage whitelisted IP addresses for secure access"}
          </p>
        </div>
        {!showAddForm && !showEditForm ? (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus />
            Add IP
          </button>
        ) : (
          <button
            onClick={() => {
              setShowAddForm(false);
              setShowEditForm(false);
              setSelectedIP(null);
              setFormData({
                ipAddress: "",
                description: "",
                status: "Active",
              });
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            ← View IPs
          </button>
        )}
      </div>

      {/* Add/Edit IP Form */}
      {(showAddForm || showEditForm) && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                IP Address *
              </label>
              <input
                type="text"
                value={formData.ipAddress}
                onChange={(e) =>
                  setFormData({ ...formData, ipAddress: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Office Network"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  setSelectedIP(null);
                  setFormData({
                    ipAddress: "",
                    description: "",
                    status: "Active",
                  });
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <FaSave />
                {showEditForm ? "Update IP" : "Add IP"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {!showAddForm && !showEditForm && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                  IP Address
                </th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                  Description
                </th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                  Status
                </th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                  Added Date
                </th>
                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {ips.map((ip) => (
                <tr key={ip._id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 text-gray-800 font-mono">
                    {ip.ipAddress}
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-700">
                    {ip.description}
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ip.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {ip.status}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">
                    {new Date(ip.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(ip)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(ip._id, ip.ipAddress)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete"
                      >
                        <FaTrash />
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
}
