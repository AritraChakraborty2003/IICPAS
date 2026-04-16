"use client";
import { getApiOrigin } from "@/lib/apiBase";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  FaEdit,
  FaTrash,
  FaPhoneAlt,
  FaWhatsapp,
} from "react-icons/fa";

const API_URL = getApiOrigin();

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
  if (booking.razorpayPaymentId || booking.razorpayOrderId) return "Razorpay";
  if (booking.razorpay_payment_id || booking.razorpay_order_id) return "Razorpay";
  if (booking.utrNumber) return "UPI / Bank";
  if ((booking.paymentStatus || "").toLowerCase() === "free") return "Free";
  return "Manual / Pending";
};

const extractBookings = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractSessions = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  if (Array.isArray(payload?.data?.sessions)) return payload.data.sessions;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const DEFAULT_REMINDER_TIME_ZONE = "Asia/Kolkata";
const DEFAULT_REMINDER_LEAD_TIME_MINUTES = 30;
const DEFAULT_REMINDER_BATCH_SIZE = 5;
const DEFAULT_REMINDER_BATCH_DELAY_SECONDS = 1;

const formatSessionTimeRange = (session) => {
  if (!session) return "";
  const dateLabel = formatDateTime(session.date);
  const timeLabel = String(session.time || "").trim();
  return timeLabel ? `${dateLabel} | ${timeLabel}` : dateLabel;
};

const getReminderDefaults = (session, timeZone = DEFAULT_REMINDER_TIME_ZONE) => {
  const settings = session?.reminderSettings || {};

  return {
    leadTimeMinutes: String(
      settings.leadTimeMinutes ?? DEFAULT_REMINDER_LEAD_TIME_MINUTES
    ),
    batchSize: String(settings.batchSize ?? DEFAULT_REMINDER_BATCH_SIZE),
    batchDelaySeconds: String(
      settings.batchDelaySeconds ?? DEFAULT_REMINDER_BATCH_DELAY_SECONDS
    ),
    timezone: settings.timezone || timeZone || DEFAULT_REMINDER_TIME_ZONE,
  };
};

export default function LiveBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [reminderForm, setReminderForm] = useState(
    getReminderDefaults(null, DEFAULT_REMINDER_TIME_ZONE)
  );
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderError, setReminderError] = useState("");

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
      setBookings(extractBookings(response.data));
    } catch (error) {
      console.error("Failed to fetch live bookings:", error);
      toast.error("Failed to fetch live bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API_URL}/api/live-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(extractSessions(response.data));
    } catch (error) {
      console.error("Failed to fetch live sessions:", error);
      toast.error("Failed to fetch live sessions");
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!sessions.length) {
      setSelectedSessionId("");
      return;
    }

    const selectedExists = sessions.some(
      (session) => String(session._id) === String(selectedSessionId)
    );
    if (selectedExists) return;

    const preferredSession =
      sessions.find((session) => String(session.status || "").toLowerCase() === "upcoming") ||
      sessions[0];
    setSelectedSessionId(String(preferredSession?._id || ""));
  }, [sessions, selectedSessionId]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return (
      sessions.find((session) => String(session._id) === String(selectedSessionId)) ||
      null
    );
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    setReminderForm(
      getReminderDefaults(
        selectedSession,
        DEFAULT_REMINDER_TIME_ZONE
      )
    );
    setReminderError("");
  }, [selectedSession]);

  const reminderTimezone =
    selectedSession?.reminderSettings?.timezone || DEFAULT_REMINDER_TIME_ZONE;
  const reminderStatus = String(
    selectedSession?.reminderSettings?.status || ""
  ).toLowerCase();
  const reminderIsLocked = ["sending", "sent"].includes(reminderStatus);
  const reminderSchedulingDisabled =
    !selectedSession ||
    String(selectedSession?.status || "").toLowerCase() !== "upcoming" ||
    reminderIsLocked;
  const reminderSendAtLabel = selectedSession?.reminderSettings?.sendAt
    ? formatDateTime(selectedSession.reminderSettings.sendAt)
    : "";
  const reminderScheduleLabel = selectedSession
    ? formatSessionTimeRange(selectedSession)
    : "";

  const handleSaveReminderSettings = async () => {
    if (!selectedSession) {
      Swal.fire(
        "Select a session",
        "Choose a live session before saving reminder settings.",
        "info"
      );
      return;
    }

    const sessionStatus = String(selectedSession.status || "").toLowerCase();
    if (sessionStatus !== "upcoming") {
      Swal.fire(
        "Reminder disabled",
        `Scheduling is only available for upcoming live sessions. This session is scheduled for ${reminderScheduleLabel}.`,
        "warning"
      );
      return;
    }

    if (reminderIsLocked) {
      Swal.fire(
        "Reminder locked",
        "This reminder is already sending or has already been sent.",
        "info"
      );
      return;
    }

    const leadTimeMinutes = Math.trunc(Number(reminderForm.leadTimeMinutes));
    const batchSize = Math.trunc(Number(reminderForm.batchSize));
    const batchDelaySeconds = Math.trunc(Number(reminderForm.batchDelaySeconds));

    if (!Number.isFinite(leadTimeMinutes) || leadTimeMinutes < 1) {
      setReminderError("Lead time must be at least 1 minute.");
      return;
    }

    if (!Number.isFinite(batchSize) || batchSize < 1) {
      setReminderError("Chunk size must be at least 1.");
      return;
    }

    if (!Number.isFinite(batchDelaySeconds) || batchDelaySeconds < 0) {
      setReminderError("Batch delay cannot be negative.");
      return;
    }

    try {
      setSavingReminder(true);
      setReminderError("");

      const token = localStorage.getItem("adminToken");
      const res = await axios.patch(
        `${API_URL}/api/live-sessions/${selectedSession._id}`,
        {
          reminderSettings: {
            leadTimeMinutes,
            batchSize,
            batchDelaySeconds,
            timezone: reminderTimezone,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.data) {
        throw new Error("Failed to save reminder settings");
      }

      await fetchSessions();
      toast.success("Reminder settings saved");
    } catch (error) {
      console.error("Save reminder settings error:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to save reminder settings";
      setReminderError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSavingReminder(false);
    }
  };

  const handleEditBooking = async (booking) => {
    const result = await Swal.fire({
      title: "Edit booking",
      html: `
        <input id="booking-name" class="swal2-input" placeholder="Name" value="${booking.studentId?.name || booking.requesterName || ""}" />
        <input id="booking-email" class="swal2-input" placeholder="Email" value="${booking.studentId?.email || booking.by || ""}" />
        <input id="booking-phone" class="swal2-input" placeholder="Phone" value="${booking.studentId?.phone || booking.phone || ""}" />
        <input id="booking-whatsapp" class="swal2-input" placeholder="WhatsApp" value="${booking.whatsappNumber || booking.phone || booking.studentId?.phone || ""}" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => ({
        requesterName: document.getElementById("booking-name")?.value || "",
        by: document.getElementById("booking-email")?.value || "",
        phone: document.getElementById("booking-phone")?.value || "",
        whatsappNumber:
          document.getElementById("booking-whatsapp")?.value || "",
      }),
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(`${API_URL}/api/bookings/${booking._id}`, result.value, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking updated successfully");
      fetchBookings();
    } catch (error) {
      console.error("Update booking error:", error);
      toast.error("Failed to update booking");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const confirm = await Swal.fire({
      title: "Delete this booking?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${API_URL}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking deleted successfully");
      fetchBookings();
    } catch (error) {
      console.error("Delete booking error:", error);
      toast.error("Failed to delete booking");
    }
  };

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const paymentStatus = (booking.paymentStatus || "pending").toLowerCase();
      if (paymentFilter && paymentStatus !== paymentFilter) return false;

      if (!query) return true;

      const searchableValues = [
        booking.studentId?.name,
        booking.studentId?.email,
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchBookings}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Refresh bookings
            </button>
            <button
              type="button"
              onClick={fetchSessions}
              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              {sessionsLoading ? "Loading sessions..." : "Refresh sessions"}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reminder scheduler
              </p>
              <h3 className="text-lg font-semibold text-slate-900">
                Send WhatsApp reminder before the live session
              </h3>
              <p className="text-sm text-slate-600">
                Choose a live session, set the reminder lead time, chunk size,
                and delay between batches.
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Session:</span>{" "}
                {selectedSession?.title || "Select a live session"}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Date and time:</span>{" "}
                {reminderScheduleLabel || "Select a session to show date and time."}
              </p>
              <p className="text-xs text-slate-500">
                Timezone: {reminderTimezone}
              </p>
            </div>

            <div className="w-full lg:max-w-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Session to schedule
              </label>
              <select
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Select a live session</option>
                {sessions.map((session) => (
                  <option key={session._id} value={session._id}>
                    {session.title} • {formatSessionTimeRange(session)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Pick the live session you want to schedule a reminder for.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reminder status
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {reminderStatus || "not scheduled"}
              </p>
              {reminderSendAtLabel ? (
                <p className="text-xs text-slate-500">Sends at {reminderSendAtLabel}</p>
              ) : null}
              {selectedSession?.reminderSettings?.recipientCount ? (
                <p className="text-xs text-slate-500">
                  Confirmed recipients: {selectedSession.reminderSettings.recipientCount}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
              {reminderSchedulingDisabled ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {reminderIsLocked
                    ? "This reminder is already sending or has already been sent."
                    : selectedSession
                    ? `Scheduling is disabled for this session because it is not upcoming. Live session date and time: ${reminderScheduleLabel}.`
                    : "Select a live session to enable scheduling. The reminder inputs will stay disabled until you choose one."}
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  This session is upcoming, so the reminder inputs below are enabled.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Send reminder before start (minutes)
              </label>
              <input
                type="number"
                min="1"
                disabled={reminderSchedulingDisabled}
                value={reminderForm.leadTimeMinutes}
                onChange={(event) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    leadTimeMinutes: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Chunk size
              </label>
              <div className="mb-2 flex gap-2">
                {[5, 10].map((size) => (
                  <button
                    key={size}
                    type="button"
                    disabled={reminderSchedulingDisabled}
                    onClick={() =>
                      setReminderForm((prev) => ({
                        ...prev,
                        batchSize: String(size),
                      }))
                    }
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      Number(reminderForm.batchSize) === size
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                disabled={reminderSchedulingDisabled}
                value={reminderForm.batchSize}
                onChange={(event) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    batchSize: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Default chunk size is 5 emails per batch.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Delay between batches (seconds)
              </label>
              <input
                type="number"
                min="0"
                disabled={reminderSchedulingDisabled}
                value={reminderForm.batchDelaySeconds}
                onChange={(event) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    batchDelaySeconds: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Default delay is 1 second between batches.
              </p>
            </div>
          </div>

          {reminderError ? (
            <p className="mt-3 text-sm font-medium text-red-600">{reminderError}</p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-600">
              Reminders go only to confirmed enrollments for the selected live
              session.
            </p>
            <button
              type="button"
              onClick={handleSaveReminderSettings}
              disabled={savingReminder || reminderSchedulingDisabled}
              className="rounded-lg bg-[#0f265c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0b1e49] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {savingReminder ? "Saving..." : "Save reminder settings"}
            </button>
          </div>
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
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                    Actions
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
                    booking.razorpayPaymentId ||
                    booking.razorpayOrderId ||
                    booking.razorpay_payment_id ||
                    booking.razorpay_order_id ||
                    "N/A";
                  const phoneNumber = String(booking.phone || "").trim();
                  const whatsappNumber = String(
                    booking.whatsappNumber || booking.phone || ""
                  )
                    .trim()
                    .replace(/[^\d]/g, "");

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
                          {booking.studentId?.name || booking.requesterName || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.studentId?.email || booking.by || "N/A"}
                        </p>
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
                      <td className="px-3 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {phoneNumber ? (
                            <a
                              href={`tel:${phoneNumber}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                              title="Call"
                            >
                              <FaPhoneAlt size={14} />
                            </a>
                          ) : null}
                          {whatsappNumber ? (
                            <a
                              href={`https://wa.me/${whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50"
                              title="WhatsApp"
                            >
                              <FaWhatsapp size={16} />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleEditBooking(booking)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50"
                            title="Edit booking"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(booking._id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            title="Delete booking"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
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
