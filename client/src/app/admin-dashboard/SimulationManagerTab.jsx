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
  FaKey,
  FaSync,
} from "react-icons/fa";

const API_BASE = getApiBase();

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
});

const SimulationManagerTab = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    username: "",
    password: "",
    requireCredentialValidation: true,
    isActive: true,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/simulation-configs`,
        authHeaders()
      );
      setConfigs(response.data);
    } catch (error) {
      console.error("Error fetching simulation configs:", error);
      Swal.fire("Error", "Failed to fetch simulation configurations", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      name: "",
      username: "",
      password: "",
      requireCredentialValidation: true,
      isActive: true,
    });
  };

  const openAddForm = () => {
    setEditingConfig(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (config) => {
    setEditingConfig(config);
    setFormData({
      slug: config.slug,
      name: config.name,
      username: config.credentials?.username || "",
      password: config.credentials?.password || "",
      requireCredentialValidation: config.requireCredentialValidation !== false,
      isActive: config.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const payload = {
      name: formData.name,
      credentials: {
        username: formData.username,
        password: formData.password,
      },
      requireCredentialValidation: formData.requireCredentialValidation,
      isActive: formData.isActive,
    };

    try {
      setSaving(true);
      if (editingConfig) {
        await axios.put(
          `${API_BASE}/simulation-configs/${editingConfig._id}`,
          payload,
          authHeaders()
        );
        Swal.fire("Success", "Simulation credentials updated", "success");
      } else {
        await axios.post(
          `${API_BASE}/simulation-configs`,
          { ...payload, slug: formData.slug },
          authHeaders()
        );
        Swal.fire("Success", "Simulation added", "success");
      }
      setShowForm(false);
      setEditingConfig(null);
      resetForm();
      fetchConfigs();
    } catch (error) {
      console.error("Error saving simulation config:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to save simulation config",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config) => {
    const result = await Swal.fire({
      title: "Delete simulation?",
      text: `This will remove the configuration for "${config.name}". The simulation page will fall back to its default credentials.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it",
    });
    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        `${API_BASE}/simulation-configs/${config._id}`,
        authHeaders()
      );
      Swal.fire("Deleted", "Simulation config removed", "success");
      fetchConfigs();
    } catch (error) {
      console.error("Error deleting simulation config:", error);
      Swal.fire("Error", "Failed to delete simulation config", "error");
    }
  };

  const handleToggle = async (config, field) => {
    try {
      await axios.put(
        `${API_BASE}/simulation-configs/${config._id}`,
        { [field]: !config[field] },
        authHeaders()
      );
      fetchConfigs();
    } catch (error) {
      console.error("Error updating simulation config:", error);
      Swal.fire("Error", "Failed to update simulation config", "error");
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Simulation Manager
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the login credentials shown on each simulation page. Changes
            apply immediately — students see the updated credentials in the
            login banner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfigs}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaSync /> Refresh
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FaPlus /> Add Simulation
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          Loading simulations...
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-center text-gray-500">
          No simulations configured yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Simulation
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Username
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Password
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  Validate Credentials
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  Active
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((config) => (
                <tr key={config._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">
                      {config.name}
                    </div>
                    <div className="text-xs text-gray-400">{config.slug}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700">
                    {config.credentials?.username}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-700">
                        {visiblePasswords[config._id]
                          ? config.credentials?.password
                          : "••••••••"}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(config._id)}
                        className="text-gray-400 hover:text-gray-600"
                        title={
                          visiblePasswords[config._id]
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {visiblePasswords[config._id] ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        handleToggle(config, "requireCredentialValidation")
                      }
                      className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.requireCredentialValidation
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                      title={
                        config.requireCredentialValidation
                          ? "Login requires the configured credentials"
                          : "Login accepts any input"
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.requireCredentialValidation
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(config, "isActive")}
                      className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={config.isActive ? "Active" : "Inactive"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEditForm(config)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit credentials"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(config)}
                        className="text-red-500 hover:text-red-700"
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <FaKey className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {editingConfig
                  ? `Edit — ${editingConfig.name}`
                  : "Add Simulation"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingConfig && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    Slug (must match the simulation page)
                  </label>
                  <input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="e.g. gst-e-invoicing-2"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Simulation Name
                </label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Login Username
                </label>
                <input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Login Password
                </label>
                <input
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.requireCredentialValidation}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        requireCredentialValidation: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Validate credentials on login
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingConfig(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingConfig ? "Save Changes" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationManagerTab;
