"use client";
import { getApiOrigin } from "@/lib/apiBase";
import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useAuth } from "@/contexts/AuthContext";

const API = getApiOrigin();
const DEFAULT_REMINDER_TIME_ZONE = "Asia/Kolkata";
const DEFAULT_REMINDER_LEAD_TIME_MINUTES = 30;
const DEFAULT_REMINDER_BATCH_SIZE = 5;
const DEFAULT_REMINDER_BATCH_DELAY_SECONDS = 1;
const CONFIRMED_PAYMENT_STATUSES = new Set([
  "paid",
  "captured",
  "completed",
  "verified",
  "free",
]);
const CONFIRMED_BOOKING_STATUSES = new Set(["booked", "approved"]);

const getBookingLiveSessionId = (booking) =>
  String(booking?.liveSessionId?._id || booking?.liveSessionId || "");

const isConfirmedLiveEnrollment = (booking) => {
  const paymentStatus = String(booking?.paymentStatus || "").toLowerCase();
  const bookingStatus = String(booking?.status || "").toLowerCase();

  return (
    CONFIRMED_PAYMENT_STATUSES.has(paymentStatus) &&
    CONFIRMED_BOOKING_STATUSES.has(bookingStatus)
  );
};

const formatDateWithTimeZone = (value, timeZone = DEFAULT_REMINDER_TIME_ZONE) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }
};

const formatDateTimeWithTimeZone = (
  value,
  timeZone = DEFAULT_REMINDER_TIME_ZONE
) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }
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

export default function LiveSesionAdmin() {
  const [tab, setTab] = useState("list");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"
  const [sessions, setSessions] = useState([]);
  const [sessionBookings, setSessionBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [reminderForm, setReminderForm] = useState(
    getReminderDefaults(null, DEFAULT_REMINDER_TIME_ZONE)
  );
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [form, setForm] = useState({
    title: "",
    instructor: "",
    description: "",
    startTime: "",
    endTime: "",
    date: "",
    link: "",
    price: "",
    category: "",
    maxParticipants: "",
    thumbnail: "",
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const { hasPermission, user } = useAuth();

  // Helper function to check if token is valid
  const checkTokenValidity = () => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      showTokenError();
      return null;
    }

    try {
      // Decode JWT token to check expiration (without verification for timeout check)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp && payload.exp < currentTime) {
        showTokenError("Token has expired");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        return null;
      }

      return token;
    } catch (error) {
      console.error("Token validation error:", error);
      showTokenError("Invalid token format");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      return null;
    }
  };

  // Helper function to show token-related errors
  const showTokenError = (message) => {
    const errorMessage =
      message || "Authentication token not found. Please log in again.";
    Swal.fire({
      title: "Authentication Error",
      text: errorMessage,
      icon: "error",
      confirmButtonText: "Go to Login",
      timer: 5000,
      timerProgressBar: true,
      showCancelButton: false,
    }).then(() => {
      window.location.href = "/admin-login";
    });
  };

  useEffect(() => {
    fetchSessions();
    fetchSessionBookings();

    // Debug: Check authentication status
    console.log("🔍 Auth Debug - Component loaded");
    console.log(
      "🔍 Auth Debug - Token present:",
      !!localStorage.getItem("adminToken")
    );
    console.log(
      "🔍 Auth Debug - User data:",
      !!localStorage.getItem("adminUser")
    );
    console.log("🔍 Auth Debug - API Base:", API);
    console.log("🔍 Auth Debug - Environment:", process.env.NODE_ENV);
  }, []);

  const fetchSessions = async () => {
    try {
      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(`${API}/api/live-sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      } else if (res.status === 401) {
        showTokenError("Session expired. Please log in again.");
      } else {
        console.error("Fetch sessions failed:", res.status);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchSessionBookings = async () => {
    try {
      setBookingsLoading(true);
      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(
        `${API}/api/bookings?category=live&hasLiveSession=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSessionBookings(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        showTokenError("Session expired. Please log in again.");
      }
    } catch (err) {
      console.error("Fetch bookings error:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let thumbnailUrl = form.thumbnail;

    // If image is uploaded, upload it first
    if (uploadedImage) {
      try {
        const formData = new FormData();
        formData.append("image", uploadedImage);

        const token = checkTokenValidity();

        if (!token) {
          setLoading(false);
          return;
        }

        console.log(
          "Uploading image with token:",
          token ? "Token present" : "No token"
        );
        console.log("Upload URL:", `${API}/api/upload/image`);

        const uploadResponse = await fetch(`${API}/api/upload/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          console.log("Upload response:", uploadData);
          thumbnailUrl = uploadData.imageUrl || uploadData.relativePath;
          console.log("Using thumbnail URL:", thumbnailUrl);
          Swal.fire("Success!", "Image uploaded successfully!", "success");
        } else {
          // Handle different HTTP status codes
          let errorMessage = "Failed to upload image";

          try {
            const errorData = await uploadResponse.json();
            console.error("Upload failed:", errorData);

            if (uploadResponse.status === 401) {
              errorMessage = "Authentication failed. Please log in again.";
              // Clear the invalid token and redirect to login
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminUser");
              setTimeout(() => {
                window.location.href = "/admin-login";
              }, 2000);
            } else if (uploadResponse.status === 403) {
              errorMessage = "Access denied. Admin privileges required.";
            } else {
              errorMessage = errorData.error || errorMessage;
            }
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            if (uploadResponse.status === 401) {
              errorMessage = "Authentication failed. Please log in again.";
            }
          }

          Swal.fire("Error", errorMessage, "error");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        Swal.fire("Error", "Failed to upload image", "error");
        setLoading(false);
        return;
      }
    }

    const payload = {
      title: form.title,
      instructor: form.instructor,
      description: form.description,
      time: `${form.startTime} - ${form.endTime}`,
      date: form.date,
      link: form.link,
      price: Number(form.price),
      category: form.category,
      maxParticipants: Number(form.maxParticipants),
      thumbnail: thumbnailUrl,
    };

    const token = checkTokenValidity();
    if (!token) {
      setLoading(false);
      return;
    }

    const res = await fetch(
      `${API}/api/live-sessions${editId ? `/${editId}` : ""}`,
      {
        method: editId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      await fetchSessions();
      resetForm();
      setTab("list");
      Swal.fire(
        "Success!",
        editId
          ? "Session updated successfully!"
          : "Session created successfully!",
        "success"
      );
    } else {
      const errorData = await res.json();
      Swal.fire("Error", errorData.error || "Failed to save session", "error");
    }
    setLoading(false);
  };

  const formatTimeRange = (timeRange) => {
    if (!timeRange) return "";
    const [start, end] = timeRange.split(" - ");
    return `${formatTime(start)} – ${formatTime(end)}`;
  };

  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleEdit = (id) => {
    const session = sessions.find((s) => s._id === id);
    if (session) {
      const [startTime, endTime] = session.time.split(" - ");
      setForm({
        title: session.title,
        instructor: session.instructor || "",
        description: session.description || "",
        startTime,
        endTime,
        date: session.date.split("T")[0],
        link: session.link,
        price: session.price,
        category: session.category || "",
        maxParticipants: session.maxParticipants || "",
        thumbnail: session.thumbnail || "",
      });
      setEditId(id);
      setTab("create");
      setImagePreview(session.thumbnail || "");
      setUploadedImage(null);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete this session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (confirm.isConfirmed) {
      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(`${API}/api/live-sessions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchSessions();
        if (String(selectedSessionId) === String(id)) {
          setSelectedSessionId(null);
        }
        Swal.fire("Deleted!", "Session deleted.", "success");
      } else if (res.status === 401) {
        showTokenError("Session expired. Please log in again.");
      } else {
        Swal.fire("Error", "Failed to delete session", "error");
      }
    }
  };

  const toggleStatus = async (id) => {
    try {
      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(`${API}/api/live-sessions/toggle/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchSessions();
        Swal.fire("Success!", "Session status updated.", "success");
      } else if (res.status === 401) {
        showTokenError("Session expired. Please log in again.");
      } else {
        const error = await res.json();
        Swal.fire("Error!", error.error || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Toggle error:", error);
      Swal.fire("Error!", "Failed to update session status", "error");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      instructor: "",
      description: "",
      startTime: "",
      endTime: "",
      date: "",
      link: "",
      price: "",
      category: "",
      maxParticipants: "",
      thumbnail: "",
    });
    setEditId(null);
    setUploadedImage(null);
    setImagePreview("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);

      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear the URL input when file is uploaded
      setForm((f) => ({ ...f, thumbnail: "" }));

      console.log("File selected:", file.name, "Size:", file.size);
    }
  };

  // Bulk export functionality
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedSessions(sessions.map((s) => s._id));
    } else {
      setSelectedSessions([]);
    }
  };

  const handleSelectSession = (sessionId) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const exportToCSV = () => {
    if (selectedSessions.length === 0) {
      Swal.fire("Warning", "Please select sessions to export", "warning");
      return;
    }

    const selectedData = sessions.filter((s) =>
      selectedSessions.includes(s._id)
    );

    // Create CSV content
    const headers = ["Title", "Date", "Time", "Link", "Price", "Status"];
    const csvContent = [
      headers.join(","),
      ...selectedData.map((session) =>
        [
          `"${session.title}"`,
          new Date(session.date).toDateString(),
          `"${session.time}"`,
          `"${session.link}"`,
          session.price,
          session.status,
        ].join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `live-sessions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Swal.fire("Success", "Sessions exported successfully!", "success");
  };

  const bulkDelete = async () => {
    if (selectedSessions.length === 0) {
      Swal.fire("Warning", "Please select sessions to delete", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: `Delete ${selectedSessions.length} session(s)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (confirm.isConfirmed) {
      try {
        const token = checkTokenValidity();
        if (!token) return;

        const deletePromises = selectedSessions.map((id) =>
          fetch(`${API}/api/live-sessions/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        );

        await Promise.all(deletePromises);
        await fetchSessions();
        if (
          selectedSessionId &&
          selectedSessions.some(
            (sessionId) => String(sessionId) === String(selectedSessionId)
          )
        ) {
          setSelectedSessionId(null);
        }
        setSelectedSessions([]);
        Swal.fire(
          "Deleted!",
          `${selectedSessions.length} session(s) deleted.`,
          "success"
        );
      } catch (error) {
        Swal.fire("Error", "Failed to delete some sessions", "error");
      }
    }
  };

  const selectedSession = useMemo(
    () =>
      sessions.find((session) => String(session._id) === String(selectedSessionId)) ||
      null,
    [sessions, selectedSessionId]
  );

  useEffect(() => {
    if (!selectedSession) {
      setReminderForm(
        getReminderDefaults(null, user?.preferences?.timezone || DEFAULT_REMINDER_TIME_ZONE)
      );
      setReminderError("");
      return;
    }

    setReminderForm(
      getReminderDefaults(
        selectedSession,
        user?.preferences?.timezone || DEFAULT_REMINDER_TIME_ZONE
      )
    );
    setReminderError("");
  }, [selectedSession, user?.preferences?.timezone]);

  const filteredSessionBookings = useMemo(() => {
    if (!selectedSessionId) return sessionBookings;

    const selectedId = String(selectedSessionId);
    return sessionBookings.filter(
      (booking) =>
        isConfirmedLiveEnrollment(booking) &&
        getBookingLiveSessionId(booking) === selectedId
    );
  }, [sessionBookings, selectedSessionId]);

  const getBookingCountForSession = (sessionId) =>
    sessionBookings.filter(
      (booking) =>
        isConfirmedLiveEnrollment(booking) &&
        getBookingLiveSessionId(booking) === String(sessionId)
    ).length;

  const handleViewSessionBookings = (sessionId) => {
    setSelectedSessionId(sessionId);
    setTab("bookings");
  };

  const handleSaveReminderSettings = async () => {
    if (!selectedSession) return;

    const sessionStatus = String(selectedSession.status || "").toLowerCase();
    const reminderStatus = String(
      selectedSession.reminderSettings?.status || ""
    ).toLowerCase();

    if (sessionStatus !== "upcoming") {
      Swal.fire(
        "Reminder disabled",
        `Scheduling is only available for upcoming live sessions. This session is scheduled for ${formatDateWithTimeZone(
          selectedSession.date,
          reminderForm.timezone
        )}, ${formatTimeRange(selectedSession.time)}.`,
        "warning"
      );
      return;
    }

    if (reminderStatus === "sending" || reminderStatus === "sent") {
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

      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(`${API}/api/live-sessions/${selectedSession._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reminderSettings: {
            leadTimeMinutes,
            batchSize,
            batchDelaySeconds,
            timezone:
              reminderForm.timezone ||
              user?.preferences?.timezone ||
              DEFAULT_REMINDER_TIME_ZONE,
          },
        }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to save reminder settings";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // ignore parse issues
        }
        throw new Error(errorMessage);
      }

      await fetchSessions();
      Swal.fire("Success", "Reminder settings saved.", "success");
    } catch (error) {
      const errorMessage = error?.message || "Failed to save reminder settings";
      setReminderError(errorMessage);
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setSavingReminder(false);
    }
  };

  const handleEditBooking = async (booking) => {
    const result = await Swal.fire({
      title: "Edit booking",
      html: `
        <input id="booking-name" class="swal2-input" placeholder="Name" value="${booking.requesterName || ""}" />
        <input id="booking-email" class="swal2-input" placeholder="Email" value="${booking.by || ""}" />
        <input id="booking-phone" class="swal2-input" placeholder="Phone" value="${booking.phone || ""}" />
        <input id="booking-whatsapp" class="swal2-input" placeholder="WhatsApp" value="${booking.whatsappNumber || ""}" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => ({
        requesterName: document.getElementById("booking-name")?.value || "",
        by: document.getElementById("booking-email")?.value || "",
        phone: document.getElementById("booking-phone")?.value || "",
        whatsappNumber: document.getElementById("booking-whatsapp")?.value || "",
      }),
    });

    if (!result.isConfirmed) return;

    try {
      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(`${API}/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(result.value),
      });

      if (!res.ok) {
        throw new Error("Failed to update booking");
      }

      await fetchSessionBookings();
      Swal.fire("Success", "Booking updated successfully", "success");
    } catch (error) {
      console.error("Update booking error:", error);
      Swal.fire("Error", "Failed to update booking", "error");
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
      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(`${API}/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete booking");
      }

      await fetchSessionBookings();
      Swal.fire("Deleted", "Booking deleted successfully", "success");
    } catch (error) {
      console.error("Delete booking error:", error);
      Swal.fire("Error", "Failed to delete booking", "error");
    }
  };

  const reminderTimezone =
    selectedSession?.reminderSettings?.timezone ||
    user?.preferences?.timezone ||
    DEFAULT_REMINDER_TIME_ZONE;
  const reminderStatus = String(
    selectedSession?.reminderSettings?.status || ""
  ).toLowerCase();
  const reminderIsLocked = ["sending", "sent"].includes(reminderStatus);
  const reminderSchedulingDisabled =
    !selectedSession ||
    String(selectedSession?.status || "").toLowerCase() !== "upcoming" ||
    reminderIsLocked;
  const reminderSendAtLabel = selectedSession?.reminderSettings?.sendAt
    ? formatDateTimeWithTimeZone(
        selectedSession.reminderSettings.sendAt,
        reminderTimezone
      )
    : "";
  const reminderScheduleLabel = selectedSession
    ? `${formatDateWithTimeZone(selectedSession.date, reminderTimezone)} | ${formatTimeRange(
        selectedSession.time
      )}`
    : "";

  return (
    <div className="w-[75vw] mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl lg:text-3xl font-bold">Live Sessions</h1>
        {tab === "list" ? (
          <div className="flex items-center gap-4">
            <Button
              variant="outlined"
              sx={{ borderColor: "#0f265c", color: "#0f265c" }}
              onClick={() => {
                setSelectedSessionId(null);
                setTab("bookings");
              }}
            >
              View Bookings ({sessionBookings.length})
            </Button>
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Tooltip title="Card View">
                <IconButton
                  onClick={() => setViewMode("cards")}
                  sx={{
                    bgcolor: viewMode === "cards" ? "#0f265c" : "transparent",
                    color: viewMode === "cards" ? "white" : "gray",
                    "&:hover": {
                      bgcolor:
                        viewMode === "cards" ? "#0f265c" : "rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <ViewModuleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Table View">
                <IconButton
                  onClick={() => setViewMode("table")}
                  sx={{
                    bgcolor: viewMode === "table" ? "#0f265c" : "transparent",
                    color: viewMode === "table" ? "white" : "gray",
                    "&:hover": {
                      bgcolor:
                        viewMode === "table" ? "#0f265c" : "rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <ViewListIcon />
                </IconButton>
              </Tooltip>
            </div>

            {/* Bulk Actions */}
            {viewMode === "table" && selectedSessions.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={exportToCSV}
                  sx={{ borderColor: "#0f265c", color: "#0f265c" }}
                >
                  Export ({selectedSessions.length})
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={bulkDelete}
                >
                  Delete ({selectedSessions.length})
                </Button>
              </div>
            )}

            {hasPermission("manage_live_sessions") && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: "#0f265c",
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                }}
                onClick={() => {
                  setTab("create");
                  resetForm();
                }}
              >
                Add Live Session
              </Button>
            )}
          </div>
        ) : tab === "bookings" ? (
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              sx={{ borderColor: "#0f265c", color: "#0f265c" }}
              onClick={fetchSessionBookings}
            >
              Refresh Bookings
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#0f265c",
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
              }}
              onClick={() => {
                setSelectedSessionId(null);
                setTab("list");
              }}
            >
              ← Back to Sessions
            </Button>
          </div>
        ) : (
          <Button
            variant="contained"
            sx={{ bgcolor: "#0f265c", borderRadius: 2, fontWeight: 600, px: 3 }}
            onClick={() => {
              setTab("list");
              resetForm();
            }}
          >
            ← Back to Sessions
          </Button>
        )}
      </div>

      {tab === "list" && (
        <>
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sessions.map((s) => (
                <div
                  key={s._id}
                  className="bg-white p-5 rounded-xl shadow border-l-4 border-blue-400 relative"
                >
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      bgcolor: "#f4f4f4",
                    }}
                    component="a"
                    href={
                      s.link.startsWith("http") ? s.link : `https://${s.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>

                  <div className="text-lg font-semibold mb-1">{s.title}</div>
                  <div className="text-sm text-gray-500 mb-1">
                    <strong>Instructor:</strong>{" "}
                    {s.instructor || "Not specified"}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <strong>Category:</strong> {s.category || "General"}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    {new Date(s.date).toDateString()}, {formatTimeRange(s.time)}
                  </div>
                  <div className="text-sm mb-1">
                    <strong>Max Participants:</strong>{" "}
                    {s.maxParticipants || "Unlimited"}
                  </div>
                  <div className="text-sm mb-1">
                    <strong>Bookings:</strong> {getBookingCountForSession(s._id)}
                  </div>
                  <div className="text-sm mb-3">
                    <strong>Price:</strong> ₹{s.price}
                  </div>
                  {s.description && (
                    <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {s.description}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {hasPermission("manage_live_sessions") && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleEdit(s._id)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(s._id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="View enrolled users">
                        <IconButton onClick={() => handleViewSessionBookings(s._id)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={s.status !== "inactive"}
                        onChange={() => toggleStatus(s._id)}
                        color="success"
                      />
                      <span className="text-xs font-medium">
                        {s.status === "inactive" ? "Inactive" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={
                          selectedSessions.length === sessions.length &&
                          sessions.length > 0
                        }
                        indeterminate={
                          selectedSessions.length > 0 &&
                          selectedSessions.length < sessions.length
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Instructor
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Max Participants
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Bookings</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session._id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedSessions.includes(session._id)}
                          onChange={() => handleSelectSession(session._id)}
                        />
                      </TableCell>
                      <TableCell>{session.title}</TableCell>
                      <TableCell>
                        {session.instructor || "Not specified"}
                      </TableCell>
                      <TableCell>{session.category || "General"}</TableCell>
                      <TableCell>
                        {new Date(session.date).toDateString()}
                      </TableCell>
                      <TableCell>{formatTimeRange(session.time)}</TableCell>
                      <TableCell>
                        {session.maxParticipants || "Unlimited"}
                      </TableCell>
                      <TableCell>₹{session.price}</TableCell>
                      <TableCell>{getBookingCountForSession(session._id)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={session.status !== "inactive"}
                          onChange={() => toggleStatus(session._id)}
                          color="success"
                          size="small"
                        />
                        <span className="ml-2 text-xs">
                          {session.status === "inactive"
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {hasPermission("manage_live_sessions") && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(session._id)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(session._id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tab === "bookings" && (
        <>
          {selectedSessionId && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Viewing enrolled users
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedSession?.title || "Selected live session"}
                </p>
                <p className="text-sm text-gray-600">
                  {filteredSessionBookings.length} confirmed enrollment
                  {filteredSessionBookings.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="outlined"
                sx={{ borderColor: "#0f265c", color: "#0f265c" }}
                onClick={() => setSelectedSessionId(null)}
              >
                Show all bookings
              </Button>
            </div>
          )}

          {selectedSession && (
            <div
              className={`mb-4 rounded-2xl border px-4 py-4 shadow-sm ${
                reminderSchedulingDisabled
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reminder scheduler
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Send reminder before the live session
                  </h3>
                  <p className="text-sm text-slate-600">
                    {selectedSession.title || "Selected live session"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {reminderScheduleLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    Timezone: {reminderTimezone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reminder status
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {reminderStatus || "not scheduled"}
                  </p>
                  {reminderSendAtLabel ? (
                    <p className="text-xs text-slate-500">
                      Sends at {reminderSendAtLabel}
                    </p>
                  ) : null}
                  {selectedSession.reminderSettings?.recipientCount ? (
                    <p className="text-xs text-slate-500">
                      Confirmed recipients:{" "}
                      {selectedSession.reminderSettings.recipientCount}
                    </p>
                  ) : null}
                </div>
              </div>

              {reminderSchedulingDisabled ? (
                <div className="rounded-xl border border-amber-200 bg-amber-100 px-4 py-3 text-sm text-amber-900">
                  {reminderIsLocked
                    ? "This reminder is already sending or has already been sent."
                    : `Scheduling is disabled for this session because it is not upcoming. Live session date and time: ${reminderScheduleLabel}.`}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Send reminder before start (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      value={reminderForm.leadTimeMinutes}
                      onChange={(e) =>
                        setReminderForm((prev) => ({
                          ...prev,
                          leadTimeMinutes: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Chunk size
                    </label>
                    <div className="mb-2 flex gap-2">
                      {[5, 10].map((size) => (
                        <Button
                          key={size}
                          size="small"
                          variant={
                            Number(reminderForm.batchSize) === size
                              ? "contained"
                              : "outlined"
                          }
                          sx={{
                            minWidth: 72,
                            bgcolor:
                              Number(reminderForm.batchSize) === size
                                ? "#0f265c"
                                : "transparent",
                            borderColor: "#0f265c",
                            color:
                              Number(reminderForm.batchSize) === size
                                ? "white"
                                : "#0f265c",
                            "&:hover": {
                              bgcolor:
                                Number(reminderForm.batchSize) === size
                                  ? "#0b1e49"
                                  : "rgba(15, 38, 92, 0.04)",
                            },
                          }}
                          onClick={() =>
                            setReminderForm((prev) => ({
                              ...prev,
                              batchSize: String(size),
                            }))
                          }
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      value={reminderForm.batchSize}
                      onChange={(e) =>
                        setReminderForm((prev) => ({
                          ...prev,
                          batchSize: e.target.value,
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Default is 5 emails per batch.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Delay between batches (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      value={reminderForm.batchDelaySeconds}
                      onChange={(e) =>
                        setReminderForm((prev) => ({
                          ...prev,
                          batchDelaySeconds: e.target.value,
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Default is 1 second between batches.
                    </p>
                  </div>
                </div>
              )}

              {reminderError ? (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {reminderError}
                </p>
              ) : null}

              {!reminderSchedulingDisabled ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    Reminders go only to confirmed enrollments for this session.
                  </p>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#0f265c",
                      borderRadius: 2,
                      fontWeight: 600,
                      px: 3,
                    }}
                    onClick={handleSaveReminderSettings}
                    disabled={savingReminder}
                  >
                    {savingReminder ? "Saving..." : "Save reminder settings"}
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Payment</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Booked On</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredSessionBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {selectedSessionId
                        ? "No confirmed enrollments found for this session."
                        : "No live session bookings found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessionBookings.map((booking) => (
                    <TableRow key={booking._id} hover>
                      <TableCell>
                        <div className="font-medium">
                          {booking.liveSessionId?.title || booking.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.liveSessionId?.date
                            ? new Date(booking.liveSessionId.date).toDateString()
                            : booking.date
                            ? new Date(booking.date).toDateString()
                            : "Date not set"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {booking.studentId?.name || booking.requesterName || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.studentId?.email || booking.by || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium capitalize">
                          {booking.paymentStatus || "pending"}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{booking.paymentAmount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.paymentVerifiedAt
                          ? new Date(booking.paymentVerifiedAt).toLocaleString()
                          : new Date(booking.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {booking.phone ? (
                            <Tooltip title={booking.phone}>
                              <IconButton
                                size="small"
                                component="a"
                                href={`tel:${booking.phone}`}
                              >
                                <PhoneIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          {(booking.whatsappNumber || booking.phone) ? (
                            <Tooltip title={booking.whatsappNumber || booking.phone}>
                              <IconButton
                                size="small"
                                component="a"
                                href={`https://wa.me/${String(
                                  booking.whatsappNumber || booking.phone
                                ).replace(/[^\d]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          {booking.by ? (
                            <Tooltip title={booking.by}>
                              <IconButton
                                size="small"
                                component="a"
                                href={`mailto:${booking.by}`}
                              >
                                <EmailIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip title="Edit booking">
                            <IconButton
                              size="small"
                              onClick={() => handleEditBooking(booking)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete booking">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteBooking(booking._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tab === "create" && (
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          {[
            "title",
            "instructor",
            "description",
            "category",
            "date",
            "startTime",
            "endTime",
            "link",
            "price",
            "maxParticipants",
          ].map((name) => {
            const label =
              name === "title"
                ? "Class Title"
                : name === "instructor"
                ? "Instructor Name"
                : name === "description"
                ? "Description"
                : name === "category"
                ? "Category (e.g., CA Foundation, CA Intermediate)"
                : name === "date"
                ? "Date"
                : name === "startTime"
                ? "Start Time"
                : name === "endTime"
                ? "End Time"
                : name === "link"
                ? "Meeting Link"
                : name === "price"
                ? "Price (In Rupees)"
                : "Max Participants";

            const type =
              name === "date" || name.includes("Time")
                ? name.includes("Time")
                  ? "time"
                  : "date"
                : name === "price" || name === "maxParticipants"
                ? "number"
                : "text";

            const isTextarea = name === "description";

            return (
              <div
                key={name}
                className={name === "description" ? "md:col-span-2" : ""}
              >
                <label className="block font-semibold mb-2">{label}</label>
                {isTextarea ? (
                  <textarea
                    className="w-full border px-4 py-3 rounded-lg bg-gray-50 h-24 resize-none"
                    placeholder={label}
                    value={form[name]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [name]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    type={type}
                    className="w-full border px-4 py-3 rounded-lg bg-gray-50"
                    placeholder={label}
                    value={form[name]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [name]: e.target.value }))
                    }
                  />
                )}
              </div>
            );
          })}

          {/* Thumbnail Section */}
          <div className="md:col-span-2">
            <label className="block font-semibold mb-2">Thumbnail Image</label>
            <div className="space-y-4">
              {/* Image Upload Option */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full border px-4 py-3 rounded-lg bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>

              {/* OR Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-sm text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* URL Option */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  className="w-full border px-4 py-3 rounded-lg bg-gray-50"
                  placeholder="https://example.com/image.jpg"
                  value={form.thumbnail}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, thumbnail: e.target.value }));
                    // Clear file upload when URL is entered
                    if (e.target.value) {
                      setUploadedImage(null);
                      setImagePreview("");
                    }
                  }}
                />
              </div>

              {/* Image Preview */}
              {(imagePreview || form.thumbnail) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img
                      src={imagePreview || form.thumbnail}
                      alt="Thumbnail preview"
                      className="w-32 h-24 object-cover rounded border"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 mt-8">
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#0f265c",
                borderRadius: 2,
                fontWeight: 600,
                px: 5,
                py: 1.8,
                fontSize: 18,
              }}
              fullWidth
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : editId ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
