"use client";
import { getApiBase } from "@/lib/apiBase";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ReferralCodeSettingsTab() {
  const API_BASE = getApiBase();

  const [form, setForm] = useState({
    referralSignupCoins: 50,
    referralUsageDiscountPercent: 0,
    referralUsageCoins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE}/coins/settings`, {
          withCredentials: true,
        });
        const settings = response.data?.settings || {};
        setForm({
          referralSignupCoins: Number(settings.referralSignupCoins ?? 50),
          referralUsageDiscountPercent: Number(
            settings.referralUsageDiscountPercent ?? 0
          ),
          referralUsageCoins: Number(settings.referralUsageCoins ?? 0),
        });
      } catch {
        toast.error("Failed to load referral settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [API_BASE]);

  const handleChange = (key, value) => {
    const parsed = Number(value);
    setForm((prev) => ({
      ...prev,
      [key]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/coins/settings`, form, {
        withCredentials: true,
      });
      toast.success("Referral settings updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">Loading referral settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Referral Code Settings
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Configure student referral reward coins and checkout discount values.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Signup Reward Coins (Referrer)
          </label>
          <input
            type="number"
            min="0"
            value={form.referralSignupCoins}
            onChange={(e) => handleChange("referralSignupCoins", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            First Purchase Discount (%) for Referred Student
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.referralUsageDiscountPercent}
            onChange={(e) =>
              handleChange("referralUsageDiscountPercent", e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            First Purchase Coins for Referred Student
          </label>
          <input
            type="number"
            min="0"
            value={form.referralUsageCoins}
            onChange={(e) => handleChange("referralUsageCoins", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Referral Settings"}
        </button>
      </form>
    </div>
  );
}
