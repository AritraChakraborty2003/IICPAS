"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const formatDateTime = (value) => {
  if (!value) return "N/A";
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

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const getPaymentBadgeClasses = (status) => {
  switch ((status || "").toLowerCase()) {
    case "paid":
    case "captured":
    case "completed":
    case "verified":
      return "bg-emerald-100 text-emerald-800";
    case "free":
      return "bg-sky-100 text-sky-800";
    case "failed":
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
};

const inferPaymentMode = (booking) => {
  if (booking.razorpay_payment_id || booking.razorpay_order_id) return "Razorpay";
  if (booking.utrNumber) return "UPI / Bank";
  if ((booking.paymentStatus || "").toLowerCase() === "free") return "Free";
  return "Manual / Pending";
};

export default function LiveBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `${API_URL}/api/bookings?category=live&hasLiveSession=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch live bookings:", error);
      toast.error("Failed to fetch live bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const paymentStatus = (booking.paymentStatus || "pending").toLowerCase();
      if (paymentFilter && paymentStatus !== paymentFilter) return false;

      if (!query) return true;

      const searchableValues = [
        booking.liveSessionId?.title,
        booking.title,
        booking.requesterName,
        booking.by,
        booking.phone,
        booking.whatsappNumber,
        booking.utrNumber,
        booking.razorpay_payment_id,
        booking.razorpay_order_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableValues.includes(query);
    });
  }, [bookings, paymentFilter, searchTerm]);

  const summary = useMemo(() => {
    const totalCollected = bookings.reduce(
      (sum, booking) => sum + Number(booking.paymentAmount || 0),
      0
    );

    return {
      total: bookings.length,
      paid: bookings.filter((booking) =>
        ["paid", "captured", "completed", "verified"].includes(
          (booking.paymentStatus || "").toLowerCase()
        )
      ).length,
      free: bookings.filter(
        (booking) => (booking.paymentStatus || "").toLowerCase() === "free"
      ).length,
      pending: bookings.filter((booking) =>
        ["pending", "initiated", "processing", ""].includes(
          (booking.paymentStatus || "").toLowerCase()
        )
      ).length,
      totalCollected,
    };
  }, [bookings]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Live Bookings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Record of all live session enrollments with payment and contact details.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchBookings}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-5">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm font-semibold text-blue-700">Total Enrollments</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{summary.total}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-sm font-semibold text-emerald-700">Paid</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{summary.paid}</p>
          </div>
          <div className="rounded-lg bg-sky-50 p-3">
            <p className="text-sm font-semibold text-sky-700">Free</p>
            <p className="mt-1 text-2xl font-bold text-sky-900">{summary.free}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-700">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{summary.pending}</p>
          </div>
          <div className="rounded-lg bg-violet-50 p-3">
            <p className="text-sm font-semibold text-violet-700">Collected</p>
            <p className="mt-1 text-2xl font-bold text-violet-900">
              {formatCurrency(summary.totalCollected)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by session, student, email, phone, UTR, payment id"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All payment status</option>
            <option value="paid">Paid</option>
            <option value="captured">Captured</option>
            <option value="verified">Verified</option>
            <option value="free">Free</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        {loading ? (
          <p className="text-gray-500">Loading live bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="text-gray-500">No live bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                    Live Session
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                    Enrolled Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                    Contact
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                    Payment
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                    Reference
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                    Enrolled On
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => {
                  const sessionTitle =
                    booking.liveSessionId?.title || booking.title || "Untitled Session";
                  const sessionDate =
                    booking.liveSessionId?.date || booking.date || booking.createdAt;
                  const paymentStatus = booking.paymentStatus || "pending";
                  const referenceId =
                    booking.utrNumber ||
                    booking.razorpay_payment_id ||
                    booking.razorpay_order_id ||
                    "N/A";

                  return (
                    <tr key={booking._id}>
                      <td className="px-3 py-3 text-sm">
                        <p className="font-semibold text-gray-900">{sessionTitle}</p>
                        <p className="text-xs text-gray-500">
                          Session date: {formatDateTime(sessionDate)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Booking ID: {String(booking._id).slice(-8).toUpperCase()}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <p className="font-medium text-gray-900">
                          {booking.requesterName || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">{booking.by || "N/A"}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        <p>{booking.phone || "No phone"}</p>
                        <p className="text-xs text-gray-500">
                          WhatsApp: {booking.whatsappNumber || booking.phone || "N/A"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPaymentBadgeClasses(
                            paymentStatus
                          )}`}
                        >
                          {paymentStatus}
                        </span>
                        <p className="mt-2 font-semibold text-gray-900">
                          {formatCurrency(booking.paymentAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Mode: {inferPaymentMode(booking)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{referenceId}</p>
                        <p className="text-xs text-gray-500">
                          Verified: {formatDateTime(booking.paymentVerifiedAt)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {formatDateTime(booking.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
