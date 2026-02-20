"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function CoinsTab() {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

  const [form, setForm] = useState({
    quizCompleteCoins: 10,
    testimonialApprovedCoins: 3,
    purchaseSuccessCoins: 20,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE}/coins/settings`, {
          withCredentials: true,
        });
        if (response.data?.settings) {
          setForm({
            quizCompleteCoins: response.data.settings.quizCompleteCoins ?? 10,
            testimonialApprovedCoins:
              response.data.settings.testimonialApprovedCoins ?? 3,
            purchaseSuccessCoins:
              response.data.settings.purchaseSuccessCoins ?? 20,
          });
        }
      } catch (error) {
        toast.error("Failed to load coin settings");
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
      toast.success("Coin settings updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">Loading coin settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Coins Settings</h2>
      <p className="text-sm text-gray-600 mb-6">
        Configure how many coins students earn for each event.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quiz Completion Coins
          </label>
          <input
            type="number"
            min="0"
            value={form.quizCompleteCoins}
            onChange={(e) => handleChange("quizCompleteCoins", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Testimonial Approval Coins
          </label>
          <input
            type="number"
            min="0"
            value={form.testimonialApprovedCoins}
            onChange={(e) =>
              handleChange("testimonialApprovedCoins", e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Purchase Success Coins
          </label>
          <input
            type="number"
            min="0"
            value={form.purchaseSuccessCoins}
            onChange={(e) =>
              handleChange("purchaseSuccessCoins", e.target.value)
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
