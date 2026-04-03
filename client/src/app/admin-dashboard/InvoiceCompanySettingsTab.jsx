"use client";
import { getApiBase } from "@/lib/apiBase";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = getApiBase();

const DEFAULT_FORM = {
  companyName: "",
  legalName: "",
  email: "",
  phone: "",
  website: "",
  gstin: "",
  cin: "",
  pan: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  invoicePrefix: "BK",
  supportEmail: "",
  supportPhone: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  invoiceNotes: "",
};

export default function InvoiceCompanySettingsTab() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("adminToken");
      try {
        const response = await axios.get(`${API_BASE}/invoice-company-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm({ ...DEFAULT_FORM, ...(response.data?.settings || {}) });
      } catch (error) {
        toast.error("Failed to load invoice company settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("adminToken");
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/invoice-company-settings`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Invoice company settings saved");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save invoice company settings"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">Loading invoice company settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Invoice Company Settings
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Configure company and tax details used in generated invoices.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Legal Name
            </label>
            <input
              type="text"
              value={form.legalName}
              onChange={(e) => handleChange("legalName", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Website
            </label>
            <input
              type="text"
              value={form.website}
              onChange={(e) => handleChange("website", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Invoice Prefix
            </label>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={(e) => handleChange("invoicePrefix", e.target.value)}
              placeholder="BK"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Tax Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                GSTIN
              </label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => handleChange("gstin", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CIN
              </label>
              <input
                type="text"
                value={form.cin}
                onChange={(e) => handleChange("cin", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                PAN
              </label>
              <input
                type="text"
                value={form.pan}
                onChange={(e) => handleChange("pan", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={form.addressLine1}
              onChange={(e) => handleChange("addressLine1", e.target.value)}
              placeholder="Address Line 1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.addressLine2}
              onChange={(e) => handleChange("addressLine2", e.target.value)}
              placeholder="Address Line 2"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="City"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
              placeholder="State"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.pincode}
              onChange={(e) => handleChange("pincode", e.target.value)}
              placeholder="Pincode"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              placeholder="Country"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Support & Bank Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => handleChange("supportEmail", e.target.value)}
              placeholder="Support Email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.supportPhone}
              onChange={(e) => handleChange("supportPhone", e.target.value)}
              placeholder="Support Phone"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              placeholder="Bank Name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => handleChange("accountName", e.target.value)}
              placeholder="Account Name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value)}
              placeholder="Account Number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.ifsc}
              onChange={(e) => handleChange("ifsc", e.target.value)}
              placeholder="IFSC"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.upiId}
              onChange={(e) => handleChange("upiId", e.target.value)}
              placeholder="UPI ID"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Invoice Notes
          </label>
          <textarea
            value={form.invoiceNotes}
            onChange={(e) => handleChange("invoiceNotes", e.target.value)}
            rows={3}
            placeholder="Optional note to show on invoice"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Invoice Settings"}
        </button>
      </form>
    </div>
  );
}
