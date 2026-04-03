"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaBoxes,
  FaChartBar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSort,
  FaFilter,
} from "react-icons/fa";

const API_BASE = getApiBase();

const KitsTab = () => {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKit, setEditingKit] = useState(null);
  const [stats, setStats] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("module");
  const [formData, setFormData] = useState({
    module: "",
    labClassroom: 0,
    recorded: 0,
    labPlusLive: 0,
    description: "",
    category: "other",
    price: 0,
    supplier: "",
  });

  const categories = [
    {
      value: "accounting",
      label: "Accounting",
      color: "bg-blue-100 text-blue-800",
    },
    { value: "excel", label: "Excel", color: "bg-green-100 text-green-800" },
    {
      value: "taxation",
      label: "Taxation",
      color: "bg-purple-100 text-purple-800",
    },
    { value: "gst", label: "GST", color: "bg-orange-100 text-orange-800" },
    {
      value: "office",
      label: "Office Tools",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "finance",
      label: "Finance",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "communication",
      label: "Communication",
      color: "bg-pink-100 text-pink-800",
    },
    { value: "other", label: "Other", color: "bg-gray-100 text-gray-800" },
  ];

  useEffect(() => {
    fetchKits();
    fetchStats();
  }, []);

  const fetchKits = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/v1/kits`);
      setKits(response.data);
    } catch (error) {
      console.error("Error fetching kits:", error);
      Swal.fire("Error", "Failed to fetch kits", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/v1/kits/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingKit) {
        await axios.put(`${API_BASE}/v1/kits/${editingKit._id}`, formData);
        Swal.fire("Success", "Kit updated successfully", "success");
      } else {
        await axios.post(`${API_BASE}/v1/kits`, formData);
        Swal.fire("Success", "Kit created successfully", "success");
      }

      setShowForm(false);
      setEditingKit(null);
      resetForm();
      fetchKits();
      fetchStats();
    } catch (error) {
      console.error("Error saving kit:", error);
      const message = error.response?.data?.message || "Failed to save kit";
      Swal.fire("Error", message, "error");
    }
  };

  const handleEdit = (kit) => {
    setEditingKit(kit);
    setFormData({
      module: kit.module,
      labClassroom: kit.labClassroom,
      recorded: kit.recorded,
      labPlusLive: kit.labPlusLive,
      description: kit.description || "",
      category: kit.category,
      price: kit.price,
      supplier: kit.supplier || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the kit.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/v1/kits/${id}`);
        Swal.fire("Deleted!", "Kit has been deleted.", "success");
        fetchKits();
        fetchStats();
      } catch (error) {
        console.error("Error deleting kit:", error);
        Swal.fire("Error", "Failed to delete kit", "error");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.put(`${API_BASE}/v1/kits/${id}/toggle-status`);
      fetchKits();
      fetchStats();
    } catch (error) {
      console.error("Error toggling status:", error);
      Swal.fire("Error", "Failed to toggle status", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      module: "",
      labClassroom: 0,
      recorded: 0,
      labPlusLive: 0,
      description: "",
      category: "other",
      price: 0,
      supplier: "",
    });
  };

  const getCategoryLabel = (category) => {
    return categories.find((cat) => cat.value === category)?.label || category;
  };

  const getCategoryColor = (category) => {
    return (
      categories.find((cat) => cat.value === category)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getStockStatus = (kit) => {
    const total = kit.labClassroom + kit.recorded + kit.labPlusLive;
    if (total === 0)
      return { status: "out", color: "text-red-600", bg: "bg-red-50" };
    if (total < 5)
      return { status: "low", color: "text-orange-600", bg: "bg-orange-50" };
    return { status: "good", color: "text-green-600", bg: "bg-green-50" };
  };

  const filteredAndSortedKits = kits
    .filter(
      (kit) => filterCategory === "all" || kit.category === filterCategory
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "module":
          return a.module.localeCompare(b.module);
        case "category":
          return a.category.localeCompare(b.category);
        case "total":
          const totalA = a.labClassroom + a.recorded + a.labPlusLive;
          const totalB = b.labClassroom + b.recorded + b.labPlusLive;
          return totalB - totalA;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Kit Stock Management
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingKit(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FaPlus size={16} />
          Add Kit
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <FaBoxes className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Kits</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalKits}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Kits</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.activeKits}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-orange-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.lowStockKits}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <FaChartBar className="text-purple-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalStock.labClassroom +
                    stats.totalStock.recorded +
                    stats.totalStock.labPlusLive}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <FaSort className="text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="module">Sort by Module</option>
              <option value="category">Sort by Category</option>
              <option value="total">Sort by Total Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-md flex items-center justify-center z-50"
          style={{ backdropFilter: "blur(6px)" }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-semibold mb-4">
              {editingKit ? "Edit Kit" : "Add New Kit"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module Name *
                  </label>
                  <input
                    type="text"
                    value={formData.module}
                    onChange={(e) =>
                      setFormData({ ...formData, module: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab (Classroom) Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.labClassroom}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        labClassroom: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recorded Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.recorded}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recorded: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LabPlus (Live) Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.labPlusLive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        labPlusLive: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingKit(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingKit ? "Update Kit" : "Create Kit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kits Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab (Classroom)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LabPlus (Live)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedKits.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No kits found. Create your first kit!
                  </td>
                </tr>
              ) : (
                filteredAndSortedKits.map((kit) => {
                  const total =
                    kit.labClassroom + kit.recorded + kit.labPlusLive;
                  const stockStatus = getStockStatus(kit);

                  return (
                    <tr key={kit._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {kit.module}
                          </div>
                          {kit.description && (
                            <div className="text-sm text-gray-500">
                              {kit.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                            kit.category
                          )}`}
                        >
                          {getCategoryLabel(kit.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kit.labClassroom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kit.recorded}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {kit.labPlusLive}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                        >
                          {total}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(kit._id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            kit.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {kit.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(kit)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(kit._id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KitsTab;
