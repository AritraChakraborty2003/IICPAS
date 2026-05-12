"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Layers3,
  Save,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiBase } from "@/lib/apiBase";

const API_BASE = getApiBase();

const SIZE_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];
const MODE_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const emptyForm = {
  mode: "online",
  size: 10,
};

export default function BatchManagerTab() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchBatches = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await axios.get(`${API_BASE}/batch-manager`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(Array.isArray(response.data?.batches) ? response.data.batches : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openCreateModal = () => {
    setEditingBatch(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setForm({
      mode: batch.mode || "online",
      size: Number(batch.size) || 10,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBatch(null);
    setForm(emptyForm);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("adminToken");
    setSaving(true);

    try {
      const payload = {
        mode: form.mode,
        size: Number(form.size),
      };

      if (editingBatch?._id) {
        await axios.put(`${API_BASE}/batch-manager/${editingBatch._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Batch updated successfully");
      } else {
        await axios.post(`${API_BASE}/batch-manager`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Batch created successfully");
      }

      closeModal();
      fetchBatches();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batch) => {
    const confirmDelete = window.confirm(
      `Delete ${String(batch.mode || "").toUpperCase()} batch of size ${batch.size}?`
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("adminToken");
    try {
      await axios.delete(`${API_BASE}/batch-manager/${batch._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Batch deleted successfully");
      fetchBatches();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete batch");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading batch manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            <Layers3 className="h-4 w-4" />
            Batch Manager
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Manage online and offline batches
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Add, edit, and remove batches with a mode and size selector. These
            records are stored in the backend and available after reload.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Batch
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Saved Batches</h2>
        </div>

        {batches.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            No batches found. Add your first batch to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Mode
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map((batch) => (
                  <tr key={batch._id} className="bg-white">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          batch.mode === "online"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {String(batch.mode || "").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {batch.size}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {batch.updatedAt
                        ? new Date(batch.updatedAt).toLocaleString("en-IN")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(batch)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                          title="Edit batch"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(batch)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete batch"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-gray-100 px-6 py-5">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingBatch ? "Edit Batch" : "Add Batch"}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Choose the batch mode and size.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Mode
                </label>
                <select
                  value={form.mode}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, mode: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Size
                </label>
                <select
                  value={form.size}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      size: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {saving ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Batch
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
