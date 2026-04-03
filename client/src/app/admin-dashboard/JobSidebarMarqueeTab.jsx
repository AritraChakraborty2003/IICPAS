"use client";
import { getApiBase } from "@/lib/apiBase";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  DEFAULT_JOB_SIDEBAR_MARQUEE,
  JOB_SIDEBAR_ICON_OPTIONS,
  getJobSidebarIconComponent,
  normalizeJobSidebarMarqueeSettings,
} from "@/components/jobSidebarMarqueeConfig";

const API_BASE = getApiBase();

export default function JobSidebarMarqueeTab() {
  const [form, setForm] = useState(DEFAULT_JOB_SIDEBAR_MARQUEE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("adminToken");
      try {
        const response = await axios.get(`${API_BASE}/job-sidebar-marquee-settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setForm(normalizeJobSidebarMarqueeSettings(response.data?.settings));
      } catch (error) {
        toast.error("Failed to load jobs sidebar marquee settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const previewItems = useMemo(() => {
    const items = form.items?.length ? form.items : DEFAULT_JOB_SIDEBAR_MARQUEE.items;
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
      items: [...prev.items, { icon: "briefcase", label: "New Item" }].slice(0, 12),
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("adminToken");
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/job-sidebar-marquee-settings`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Jobs sidebar marquee saved");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save jobs sidebar marquee"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading jobs sidebar marquee settings...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={handleSave} className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Jobs Sidebar Marquee
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Configure the vertical icon rail shown on the far right side of the public jobs page.
        </p>

        <div className="mb-5 flex items-center gap-3">
          <input
            id="jobs-sidebar-enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, enabled: event.target.checked }))
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="jobs-sidebar-enabled"
            className="text-sm font-semibold text-gray-700"
          >
            Enable marquee on jobs page
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

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Subtitle
          </label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, subtitle: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Marquee Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {form.items.map((item, index) => (
              <div
                key={`${item.icon}-${index}`}
                className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[160px_minmax(0,1fr)_88px]"
              >
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Icon
                  </label>
                  <select
                    value={item.icon}
                    onChange={(event) =>
                      handleItemChange(index, "icon", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {JOB_SIDEBAR_ICON_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Label
                  </label>
                  <input
                    type="text"
                    maxLength={24}
                    value={item.label}
                    onChange={(event) =>
                      handleItemChange(index, "label", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Preview
        </p>
        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-3">
          <div className="mb-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {form.title}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">{form.subtitle}</p>
          </div>

          <div className="relative h-[520px] overflow-hidden rounded-[24px] bg-white">
            <div
              className="absolute inset-x-0 top-0 animate-[jobsSidebarMarquee_linear_infinite]"
              style={{ animationDuration: `${form.durationSeconds}s` }}
            >
              {previewItems.map((item, index) => {
                const Icon = getJobSidebarIconComponent(item.icon);
                return (
                  <div key={`${item.icon}-${item.label}-${index}`} className="px-3 py-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center shadow-sm">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-700">
                        {item.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
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
    </div>
  );
}
