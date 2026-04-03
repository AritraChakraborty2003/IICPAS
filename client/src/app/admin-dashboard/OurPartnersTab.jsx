"use client";
import { getApiBase } from "@/lib/apiBase";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Marquee from "react-fast-marquee";
import toast from "react-hot-toast";
import { FaImage, FaUpload } from "react-icons/fa";
import {
  DEFAULT_OUR_PARTNERS_SETTINGS,
  normalizeOurPartnersSettings,
} from "@/components/ourPartnersConfig";

const API_BASE = getApiBase();

export default function OurPartnersTab() {
  const [form, setForm] = useState(DEFAULT_OUR_PARTNERS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("adminToken");
      try {
        const response = await axios.get(`${API_BASE}/our-partners-settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setForm(normalizeOurPartnersSettings(response.data?.settings));
      } catch (error) {
        toast.error("Failed to load our partners settings");
        setForm(DEFAULT_OUR_PARTNERS_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const previewItems = useMemo(() => {
    const items = form.items?.length
      ? form.items
      : DEFAULT_OUR_PARTNERS_SETTINGS.items;
    return [...items, ...items];
  }, [form.items]);

  const handleItemChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", logoUrl: "" }].slice(0, 20),
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleLogoUpload = async (file, index) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    setUploadingIndex(index);
    try {
      const response = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await response.json();
      handleItemChange(index, "logoUrl", data.imageUrl);
      toast.success("Partner logo uploaded successfully");
    } catch (error) {
      console.error("Partner logo upload failed:", error);
      toast.error("Failed to upload partner logo");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("adminToken");
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/our-partners-settings`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Our partners settings saved");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save our partners settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDummy = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    const confirmed = window.confirm(
      "This will remove the current partner data and replace it with the default dummy partner list. Continue?"
    );

    if (!confirmed) {
      return;
    }

    const defaultSettings = {
      ...DEFAULT_OUR_PARTNERS_SETTINGS,
      items: DEFAULT_OUR_PARTNERS_SETTINGS.items.map((item) => ({ ...item })),
    };

    setResetting(true);
    try {
      await axios.post(`${API_BASE}/our-partners-settings`, defaultSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm(defaultSettings);
      toast.success("Dummy partner data restored");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to restore dummy partner data"
      );
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading our partners settings...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={handleSave} className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Our Partners</h2>
        <p className="mb-6 text-sm text-gray-600">
          Manage partner names and logos used on the homepage marquee and the jobs page sidebar.
        </p>

        <div className="mb-5 flex items-center gap-3">
          <input
            id="our-partners-enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, enabled: event.target.checked }))
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="our-partners-enabled"
            className="text-sm font-semibold text-gray-700"
          >
            Enable partner marquees
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Scroll Duration (seconds)
            </label>
            <input
              type="number"
              min="8"
              max="60"
              value={form.durationSeconds}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  durationSeconds: Math.max(
                    8,
                    Math.min(60, Number(event.target.value) || 18)
                  ),
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Partner Items</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDummy}
                disabled={resetting || saving}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetting ? "Restoring..." : "Reset To Dummy"}
              </button>
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Add Partner
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {form.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[minmax(0,1fr)_180px_88px]"
              >
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Company Name
                  </label>
                  <input
                    type="text"
                    maxLength={64}
                    value={item.name}
                    onChange={(event) =>
                      handleItemChange(index, "name", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Logo
                  </label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400">
                    <FaUpload />
                    {uploadingIndex === index ? "Uploading..." : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleLogoUpload(file, index);
                        }
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <div className="mt-2 flex h-16 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.name || "Partner logo"}
                        className="max-h-12 max-w-full object-contain"
                      />
                    ) : (
                      <span className="flex items-center gap-2 text-xs text-gray-400">
                        <FaImage />
                        No logo
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={form.items.length <= 1}
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Homepage Preview
          </p>
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef7ff_100%)]">
            <div className="border-b border-slate-200 px-6 py-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-700">
                {form.title}
              </p>
            </div>
            <Marquee
              speed={55}
              gradient={false}
              pauseOnHover
              className="px-2 py-5"
            >
              {previewItems.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="mx-3 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm"
                >
                  {item.logoUrl ? (
                    <img
                      src={item.logoUrl}
                      alt={item.name}
                      className="h-8 w-8 rounded-full object-contain"
                    />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                  )}
                  <span className="text-sm font-semibold text-slate-700">
                    {item.name}
                  </span>
                </div>
              ))}
            </Marquee>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Jobs Preview
          </p>
          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-3">
            <div className="mb-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {form.title}
              </p>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-[24px] bg-white">
              <div
                className="absolute inset-x-0 top-0 animate-[jobsSidebarMarquee_linear_infinite]"
                style={{ animationDuration: `${form.durationSeconds}s` }}
              >
                {previewItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="px-2 py-2.5">
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-4 text-center shadow-sm">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.name}
                          className="mx-auto h-14 w-full max-w-[120px] object-contain"
                        />
                      ) : (
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.25)]">
                          <FaImage className="h-4 w-4" />
                        </div>
                      )}
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/85 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes jobsSidebarMarquee {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
}
