"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = getApiBase();
const API_URL = getApiOrigin();

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const extractBookings = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function AdminBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [itemType, setItemType] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    const token = localStorage.getItem("adminToken");
    try {
      const params = {};
      if (status) params.status = status;
      if (itemType) params.itemType = itemType;
      const response = await axios.get(`${API_BASE}/v1/course-bookings/admin`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(extractBookings(response.data));
    } catch (error) {
      toast.error("Failed to fetch bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status, itemType]);

  const summary = useMemo(() => {
    const total = bookings.length;
    const fullyPaid = bookings.filter((entry) => entry.status === "fully_paid").length;
    const pending = bookings.filter((entry) => entry.paymentStatus !== "paid").length;
    return { total, fullyPaid, pending };
  }, [bookings]);

  const handleSendInvoice = async (id) => {
    const token = localStorage.getItem("adminToken");
    try {
      await axios.post(
        `${API_BASE}/v1/course-bookings/${id}/send-invoice`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Invoice sent");
      fetchBookings();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send invoice");
    }
  };

  const handleDownloadInvoice = async (id) => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/course-bookings/admin/${id}/invoice`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Booking-Invoice-${String(id).slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const blob = error?.response?.data;
      if (blob instanceof Blob) {
        try {
          const text = await blob.text();
          const parsed = JSON.parse(text);
          toast.error(parsed?.message || "Failed to download invoice");
          return;
        } catch {
          // fall through to generic error
        }
      }
      toast.error(error?.response?.data?.message || "Failed to download invoice");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Monitor pre-booking records, remaining balances, and invoice status.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-sm">
            <p className="text-blue-700 font-semibold">Total</p>
            <p className="text-xl font-bold text-blue-900">{summary.total}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-sm">
            <p className="text-emerald-700 font-semibold">Fully Paid</p>
            <p className="text-xl font-bold text-emerald-900">{summary.fullyPaid}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-sm">
            <p className="text-amber-700 font-semibold">Pending/Failed</p>
            <p className="text-xl font-bold text-amber-900">{summary.pending}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <select
          value={itemType}
          onChange={(event) => setItemType(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All item types</option>
          <option value="single_course">Single Course</option>
          <option value="group_package">Group Package</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All status</option>
          <option value="prebooked">Prebooked</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="fully_paid">Fully Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={fetchBookings}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        {loading ? (
          <p className="text-gray-500">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Student</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Paid</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Remaining</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Updated</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="px-3 py-3 text-sm">
                      <p className="font-semibold text-gray-900">{booking.itemTitle}</p>
                      <p className="text-xs text-gray-500">
                        {booking.itemType === "group_package" ? "Group Package" : "Single Course"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <p className="font-medium text-gray-900">
                        {booking.studentId?.name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.studentEmail || booking.studentId?.email || "N/A"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm text-emerald-700 font-semibold">
                      {formatCurrency(booking.paidAmount)}
                    </td>
                    <td className="px-3 py-3 text-sm text-amber-700 font-semibold">
                      {formatCurrency(booking.remainingAmount)}
                    </td>
                    <td className="px-3 py-3 text-sm capitalize">{booking.status}</td>
                    <td className="px-3 py-3 text-sm">{formatDate(booking.updatedAt)}</td>
                    <td className="px-3 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendInvoice(booking._id)}
                          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50"
                        >
                          Send Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(booking._id)}
                          className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Download
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
    </div>
  );
}
