"use client";
import { getApiBase } from "@/lib/apiBase";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = getApiBase();

const sanitizePercent = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Number(parsed.toFixed(2))));
};

export default function BookingSettingsTab() {
  const [form, setForm] = useState({
    singleCourseBookingPercent: 10,
    groupPackageBookingPercent: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("adminToken");
      try {
        const response = await axios.get(`${API_BASE}/booking-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const settings = response.data?.settings || {};
        setForm({
          singleCourseBookingPercent: sanitizePercent(
            settings.singleCourseBookingPercent,
            10
          ),
          groupPackageBookingPercent: sanitizePercent(
            settings.groupPackageBookingPercent,
            5
          ),
        });
      } catch (error) {
        toast.error("Failed to load booking settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("adminToken");
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/booking-settings`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking settings saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">Loading booking settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Settings</h2>
      <p className="text-sm text-gray-600 mb-6">
        Configure booking/pre-booking advance percentages for courses and group packages.
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Single Course Booking Percentage
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.singleCourseBookingPercent}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                singleCourseBookingPercent: sanitizePercent(event.target.value),
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Group Package Booking Percentage
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.groupPackageBookingPercent}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                groupPackageBookingPercent: sanitizePercent(event.target.value),
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
