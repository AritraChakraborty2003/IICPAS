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
import { useRouter } from "next/navigation";
import {
  buildLiveSessionLandingDraftKey,
  clearLiveSessionLandingDraft,
  readLiveSessionLandingDraft,
  writeLiveSessionLandingDraft,
} from "@/lib/liveSessionLandingDraft";

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

const buildAuthorProfile = (profile = {}, fallback = {}) => ({
  image: profile.image || profile.authorImage || fallback.image || "",
  name: profile.name || profile.authorName || fallback.name || "",
  code: profile.code || profile.authorCode || fallback.code || "IICPA",
  text: profile.text || profile.authorText || fallback.text || "",
});

const normalizeAuthorProfiles = (landingPage = {}, session = {}) => {
  const fallback = {
    image:
      landingPage.authorImage ||
      session.imageUrl ||
      session.thumbnail ||
      "",
    name: landingPage.authorName || session.instructor || "",
    code: landingPage.authorCode || "IICPA",
    text: landingPage.authorText || "",
  };

  const profiles = Array.isArray(landingPage.authorProfiles)
    ? landingPage.authorProfiles.map((profile) =>
        buildAuthorProfile(profile, fallback)
      )
    : [];

  if (profiles.length === 0) {
    profiles.push(buildAuthorProfile({}, fallback));
  }

  return profiles;
};

const getAuthorLayout = (landingPage = {}) =>
  landingPage.authorLayout === "two-per-line" ? "two-per-line" : "stack";

const extractCourses = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractChapters = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.chapters)) return payload.chapters;
  if (Array.isArray(payload?.data?.chapters)) return payload.data.chapters;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const resolveObjectId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return "";
};

const getLandingPageDefaults = (landingPage = {}, session = {}) => {
  const authorProfiles = normalizeAuthorProfiles(landingPage, session);
  const firstProfile = authorProfiles[0] || buildAuthorProfile();

  return {
    heroImage:
      landingPage.heroImage ||
      session.imageUrl ||
      session.thumbnail ||
      "/images/live-class.jpg",
    mobileHeroImage: landingPage.mobileHeroImage || "",
    authorProfiles,
    authorLayout: getAuthorLayout(landingPage),
    authorImage: firstProfile.image || "",
    headline: landingPage.headline || session.title || "",
    subheadline:
      landingPage.subheadline ||
      session.subtitle ||
      session.description ||
      "",
    bodyContent: landingPage.bodyContent || session.description || "",
    authorName: firstProfile.name || session.instructor || "",
    authorCode: firstProfile.code || "IICPA",
    authorText: firstProfile.text || "",
    ctaText: landingPage.ctaText || "Get Free Preview",
    formHeading: landingPage.formHeading || "Enroll Now",
    formDescription:
      landingPage.formDescription ||
      "Share your details and our team will reach out shortly.",
    formLabel: landingPage.formLabel || "Lead Form",
    thankYouText:
      landingPage.thankYouText ||
      "Thank you. Our team will contact you shortly.",
    socialLinks: {
      facebook: landingPage.socialLinks?.facebook || "",
      linkedin: landingPage.socialLinks?.linkedin || "",
      instagram: landingPage.socialLinks?.instagram || "",
      youtube: landingPage.socialLinks?.youtube || "",
      twitter: landingPage.socialLinks?.twitter || "",
    },
  };
};

const getLandingPageDraft = (form, heroImageFallback = "") => {
  const authorProfiles = normalizeAuthorProfiles(form.landingPage, form);
  const firstProfile = authorProfiles[0] || buildAuthorProfile();

  return {
    heroImage:
      form.landingPage.heroImage || heroImageFallback || form.thumbnail || "",
    mobileHeroImage: form.landingPage.mobileHeroImage || "",
    authorProfiles,
    authorLayout: getAuthorLayout(form.landingPage),
    authorImage: firstProfile.image || "",
    headline: form.landingPage.headline || form.title || "",
    subheadline:
      form.landingPage.subheadline || form.description || "",
    bodyContent:
      form.landingPage.bodyContent || form.description || "",
    authorName: firstProfile.name || form.instructor || "",
    authorCode: firstProfile.code || "IICPA",
    authorText: firstProfile.text || "",
    ctaText: form.landingPage.ctaText || "Get Free Preview",
    formHeading: form.landingPage.formHeading || "Enroll Now",
    formDescription:
      form.landingPage.formDescription ||
      "Share your details and our team will reach out shortly.",
    formLabel: form.landingPage.formLabel || "Lead Form",
    thankYouText:
      form.landingPage.thankYouText ||
      "Thank you. Our team will contact you shortly.",
    socialLinks: {
      facebook: form.landingPage.socialLinks?.facebook || "",
      linkedin: form.landingPage.socialLinks?.linkedin || "",
      instagram: form.landingPage.socialLinks?.instagram || "",
      youtube: form.landingPage.socialLinks?.youtube || "",
      twitter: form.landingPage.socialLinks?.twitter || "",
    },
  };
};

const dataUrlToFile = async (dataUrl, fileName, mimeType) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, {
    type: mimeType || blob.type || "application/octet-stream",
  });
};

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

const uploadImageFile = async (file, token, apiBase = API) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${apiBase}/api/upload/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Failed to upload image";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Fall back to the default error message.
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.imageUrl || data.relativePath || "";
};

export default function LiveSesionAdmin({ draftKey = "" } = {}) {
  const router = useRouter();
  const [tab, setTab] = useState("list");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"
  const [sessions, setSessions] = useState([]);
  const [sessionBookings, setSessionBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [reminderSessionId, setReminderSessionId] = useState("");
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
    courseId: "",
    chapterId: "",
    landingPage: getLandingPageDefaults(),
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [landingHeroUploading, setLandingHeroUploading] = useState(false);
  const [authorProfileUploadingIndex, setAuthorProfileUploadingIndex] = useState(null);
  const { hasPermission, user } = useAuth();
  const landingDraftKey = editId
    ? buildLiveSessionLandingDraftKey(editId)
    : draftKey || buildLiveSessionLandingDraftKey("new");

  const selectedCourse = useMemo(
    () =>
      courses.find(
        (course) => String(course?._id) === String(form.courseId)
      ) || null,
    [courses, form.courseId]
  );

  const selectedChapter = useMemo(
    () =>
      chapters.find(
        (chapter) => String(chapter?._id) === String(form.chapterId)
      ) || null,
    [chapters, form.chapterId]
  );

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
    fetchCourses();

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

  useEffect(() => {
    if (!form.courseId) {
      setChapters([]);
      return;
    }

    fetchChaptersForCourse(form.courseId);
  }, [form.courseId]);

  useEffect(() => {
    if (!draftKey) return;

    let cancelled = false;
    const storedDraft = readLiveSessionLandingDraft(draftKey);

    const hydrateDraft = async () => {
      if (!storedDraft?.form) return;

      const nextForm = {
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
        courseId: "",
        chapterId: "",
        landingPage: getLandingPageDefaults(),
        ...storedDraft.form,
        landingPage: getLandingPageDefaults(
          storedDraft.form?.landingPage || {},
          storedDraft.form
        ),
      };

      setForm(nextForm);
      setEditId(storedDraft.editId || null);
      setTab(storedDraft.tab || "create");
      setImagePreview(storedDraft.imagePreview || "");

      if (
        storedDraft.imagePreview?.startsWith("data:") &&
        storedDraft.uploadedImageName
      ) {
        try {
          const restoredFile = await dataUrlToFile(
            storedDraft.imagePreview,
            storedDraft.uploadedImageName,
            storedDraft.uploadedImageType
          );
          if (!cancelled) {
            setUploadedImage(restoredFile);
          }
        } catch (error) {
          console.warn("Failed to restore uploaded landing image:", error);
          if (!cancelled) {
            setUploadedImage(null);
          }
        }
      } else if (!cancelled) {
        setUploadedImage(null);
      }
    };

    hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, [draftKey]);

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

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(`${API}/api/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCourses(extractCourses(data));
      } else if (res.status === 401) {
        showTokenError("Session expired. Please log in again.");
      } else {
        console.error("Fetch courses failed:", res.status);
      }
    } catch (err) {
      console.error("Fetch courses error:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchChaptersForCourse = async (courseId) => {
    if (!courseId) {
      setChapters([]);
      return;
    }

    try {
      setLoadingChapters(true);
      const token = checkTokenValidity();
      if (!token) return;

      const res = await fetch(`${API}/api/chapters/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setChapters(extractChapters(data));
      } else if (res.status === 401) {
        showTokenError("Session expired. Please log in again.");
      } else {
        setChapters([]);
        console.error("Fetch chapters failed:", res.status);
      }
    } catch (err) {
      console.error("Fetch chapters error:", err);
      setChapters([]);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let thumbnailUrl = form.thumbnail;

    // If image is uploaded, upload it first
    if (uploadedImage) {
      try {
        const token = checkTokenValidity();

        if (!token) {
          setLoading(false);
          return;
        }

        thumbnailUrl = await uploadImageFile(uploadedImage, token);
        Swal.fire("Success!", "Image uploaded successfully!", "success");
      } catch (error) {
        console.error("Image upload failed:", error);
        Swal.fire("Error", error.message || "Failed to upload image", "error");
        setLoading(false);
        return;
      }
    }

    let landingHeroImageUrl = form.landingPage.heroImage;
    let landingMobileHeroImageUrl = form.landingPage.mobileHeroImage;
    if (
      landingHeroImageUrl &&
      landingHeroImageUrl.startsWith("data:image/") &&
      landingHeroImageUrl.includes(";base64,")
    ) {
      try {
        const token = checkTokenValidity();
        if (!token) {
          setLoading(false);
          return;
        }

        const fileName = `landing-hero-${Date.now()}.png`;
        const mimeType = landingHeroImageUrl.match(/^data:(image\/[^;]+);base64,/)?.[1];
        const restoredFile = await dataUrlToFile(
          landingHeroImageUrl,
          fileName,
          mimeType
        );
        landingHeroImageUrl = await uploadImageFile(restoredFile, token);
      } catch (error) {
        console.error("Landing hero image upload failed:", error);
        Swal.fire("Error", error.message || "Failed to upload landing hero image", "error");
        setLoading(false);
        return;
      }
    }

    if (
      landingMobileHeroImageUrl &&
      landingMobileHeroImageUrl.startsWith("data:image/") &&
      landingMobileHeroImageUrl.includes(";base64,")
    ) {
      try {
        const token = checkTokenValidity();
        if (!token) {
          setLoading(false);
          return;
        }

        const fileName = `landing-mobile-hero-${Date.now()}.png`;
        const mimeType = landingMobileHeroImageUrl.match(/^data:(image\/[^;]+);base64,/)?.[1];
        const restoredFile = await dataUrlToFile(
          landingMobileHeroImageUrl,
          fileName,
          mimeType
        );
        landingMobileHeroImageUrl = await uploadImageFile(restoredFile, token);
      } catch (error) {
        console.error("Landing mobile hero image upload failed:", error);
        Swal.fire("Error", error.message || "Failed to upload mobile hero image", "error");
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
      courseId: form.courseId || "",
      chapterId: form.chapterId || "",
      landingPage: getLandingPageDraft(
        {
          ...form,
          landingPage: {
            ...form.landingPage,
            heroImage: landingHeroImageUrl || form.landingPage.heroImage,
            mobileHeroImage:
              landingMobileHeroImageUrl || form.landingPage.mobileHeroImage,
          },
        },
        thumbnailUrl
      ),
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
      clearLiveSessionLandingDraft(landingDraftKey);
      clearLiveSessionLandingDraft(buildLiveSessionLandingDraftKey("new"));
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

  const persistLandingDraft = () => {
    writeLiveSessionLandingDraft(landingDraftKey, {
      editId: editId || "",
      tab,
      form: {
        ...form,
        landingPage: getLandingPageDraft(form, imagePreview || form.thumbnail),
      },
      imagePreview: imagePreview || form.thumbnail || "",
      uploadedImageName: uploadedImage?.name || "",
      uploadedImageType: uploadedImage?.type || "",
    });
    return landingDraftKey;
  };

  const handlePreviewLandingPage = () => {
    const currentDraftKey = persistLandingDraft();
    const returnTo = `/admin-dashboard?tab=live-session&draftKey=${encodeURIComponent(
      currentDraftKey
    )}`;
    const previewUrl = `/live-session/landing/preview?draftKey=${encodeURIComponent(
      currentDraftKey
    )}&sessionId=${encodeURIComponent(editId || "")}&returnTo=${encodeURIComponent(
      returnTo
    )}&adminPreview=1`;
    router.push(previewUrl);
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
        courseId: resolveObjectId(session.courseId),
        chapterId: resolveObjectId(session.chapterId),
        landingPage: getLandingPageDefaults(session.landingPage, session),
      });
      setEditId(id);
      setTab("create");
      setImagePreview(session.thumbnail || "");
      setUploadedImage(null);
      setLandingHeroUploading(false);
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
        if (String(reminderSessionId) === String(id)) {
          setReminderSessionId("");
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
    clearLiveSessionLandingDraft(landingDraftKey);
    clearLiveSessionLandingDraft(buildLiveSessionLandingDraftKey("new"));
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
      courseId: "",
      chapterId: "",
      landingPage: getLandingPageDefaults(),
    });
    setEditId(null);
    setUploadedImage(null);
    setImagePreview("");
    setLandingHeroUploading(false);
    setAuthorProfileUploadingIndex(null);
  };

  const updateLandingPageField = (field, value) => {
    setForm((current) => ({
      ...current,
        landingPage: {
          ...current.landingPage,
          [field]: value,
        },
      }));
  };

  const updateAuthorProfileField = (index, field, value) => {
    setForm((current) => {
      const profiles = normalizeAuthorProfiles(current.landingPage, current);
      const nextProfiles = profiles.map((profile, profileIndex) =>
        profileIndex === index ? { ...profile, [field]: value } : profile
      );
      const primary = nextProfiles[0] || buildAuthorProfile();
      return {
        ...current,
        landingPage: {
          ...current.landingPage,
          authorProfiles: nextProfiles,
          authorImage: primary.image || "",
          authorName: primary.name || "",
          authorCode: primary.code || "IICPA",
          authorText: primary.text || "",
        },
      };
    });
  };

  const addAuthorProfile = () => {
    setForm((current) => {
      const profiles = normalizeAuthorProfiles(current.landingPage, current);
      const nextProfiles = [...profiles, buildAuthorProfile()];
      return {
        ...current,
        landingPage: {
          ...current.landingPage,
          authorProfiles: nextProfiles,
        },
      };
    });
  };

  const removeAuthorProfile = (index) => {
    setForm((current) => {
      const profiles = normalizeAuthorProfiles(current.landingPage, current);
      const nextProfiles = profiles.filter((_, profileIndex) => profileIndex !== index);
      const normalized = nextProfiles.length > 0 ? nextProfiles : [buildAuthorProfile()];
      const primary = normalized[0] || buildAuthorProfile();
      return {
        ...current,
        landingPage: {
          ...current.landingPage,
          authorProfiles: normalized,
          authorImage: primary.image || "",
          authorName: primary.name || "",
          authorCode: primary.code || "IICPA",
          authorText: primary.text || "",
        },
      };
    });
  };

  const setAuthorLayout = (layout) => {
    setForm((current) => ({
      ...current,
      landingPage: {
        ...current.landingPage,
        authorLayout: layout,
      },
    }));
  };

  const handleLandingHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = checkTokenValidity();
    if (!token) return;

    try {
      setLandingHeroUploading(true);
      const uploadedUrl = await uploadImageFile(file, token);
      updateLandingPageField("heroImage", uploadedUrl);
      Swal.fire("Success!", "Hero image uploaded successfully!", "success");
    } catch (error) {
      console.error("Landing hero image upload failed:", error);
      Swal.fire(
        "Error",
        error.message || "Failed to upload hero image",
        "error"
      );
    } finally {
      setLandingHeroUploading(false);
      e.target.value = "";
    }
  };

  const handleLandingMobileHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = checkTokenValidity();
    if (!token) return;

    try {
      setLandingHeroUploading(true);
      const uploadedUrl = await uploadImageFile(file, token);
      updateLandingPageField("mobileHeroImage", uploadedUrl);
      Swal.fire("Success!", "Mobile hero image uploaded successfully!", "success");
    } catch (error) {
      console.error("Landing mobile hero image upload failed:", error);
      Swal.fire(
        "Error",
        error.message || "Failed to upload mobile hero image",
        "error"
      );
    } finally {
      setLandingHeroUploading(false);
      e.target.value = "";
    }
  };

  const handleAuthorProfileImageUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = checkTokenValidity();
    if (!token) return;

    try {
      setAuthorProfileUploadingIndex(index);
      const uploadedUrl = await uploadImageFile(file, token);
      updateAuthorProfileField(index, "image", uploadedUrl);
      Swal.fire("Success!", "CA card image uploaded successfully!", "success");
    } catch (error) {
      console.error("Landing author image upload failed:", error);
      Swal.fire(
        "Error",
        error.message || "Failed to upload CA card image",
        "error"
      );
    } finally {
      setAuthorProfileUploadingIndex(null);
      e.target.value = "";
    }
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
    const headers = [
      "Title",
      "Course",
      "Chapter",
      "Date",
      "Time",
      "Link",
      "Price",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...selectedData.map((session) =>
        [
          `"${session.title}"`,
          `"${session.courseId?.title || session.courseTitle || ""}"`,
          `"${session.chapterId?.title || session.chapterTitle || ""}"`,
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
        if (
          reminderSessionId &&
          selectedSessions.some(
            (sessionId) => String(sessionId) === String(reminderSessionId)
          )
        ) {
          setReminderSessionId("");
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

  const reminderTargetSession = useMemo(() => {
    if (reminderSessionId) {
      return (
        sessions.find(
          (session) => String(session._id) === String(reminderSessionId)
        ) || null
      );
    }

    return selectedSession || null;
  }, [sessions, reminderSessionId, selectedSession]);

  useEffect(() => {
    if (!reminderTargetSession) {
      setReminderForm(
        getReminderDefaults(null, user?.preferences?.timezone || DEFAULT_REMINDER_TIME_ZONE)
      );
      setReminderError("");
      return;
    }

    setReminderForm(
      getReminderDefaults(
        reminderTargetSession,
        user?.preferences?.timezone || DEFAULT_REMINDER_TIME_ZONE
      )
    );
    setReminderError("");
  }, [reminderTargetSession, user?.preferences?.timezone]);

  useEffect(() => {
    if (selectedSessionId) {
      setReminderSessionId(String(selectedSessionId));
    }
  }, [selectedSessionId]);

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
    if (!reminderTargetSession) {
      Swal.fire(
        "Select a session",
        "Choose a live session from the dropdown before saving reminder settings.",
        "info"
      );
      return;
    }

    const sessionStatus = String(reminderTargetSession.status || "").toLowerCase();
    const reminderStatus = String(
      reminderTargetSession.reminderSettings?.status || ""
    ).toLowerCase();

    if (sessionStatus !== "upcoming") {
      Swal.fire(
        "Reminder disabled",
        `Scheduling is only available for upcoming live sessions. This session is scheduled for ${formatDateWithTimeZone(
          reminderTargetSession.date,
          reminderForm.timezone
        )}, ${formatTimeRange(reminderTargetSession.time)}.`,
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

      const res = await fetch(
        `${API}/api/live-sessions/${reminderTargetSession._id}`,
        {
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
        }
      );

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
    reminderTargetSession?.reminderSettings?.timezone ||
    user?.preferences?.timezone ||
    DEFAULT_REMINDER_TIME_ZONE;
  const reminderStatus = String(
    reminderTargetSession?.reminderSettings?.status || ""
  ).toLowerCase();
  const reminderIsLocked = ["sending", "sent"].includes(reminderStatus);
  const reminderSchedulingDisabled =
    !reminderTargetSession ||
    String(reminderTargetSession?.status || "").toLowerCase() !== "upcoming" ||
    reminderIsLocked;
  const reminderSendAtLabel = reminderTargetSession?.reminderSettings?.sendAt
    ? formatDateTimeWithTimeZone(
        reminderTargetSession.reminderSettings.sendAt,
        reminderTimezone
      )
    : "";
  const reminderScheduleLabel = reminderTargetSession
    ? `${formatDateWithTimeZone(reminderTargetSession.date, reminderTimezone)} | ${formatTimeRange(
        reminderTargetSession.time
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
        ) : tab === "create" ? (
          <div className="flex flex-wrap items-center gap-3">
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
            {editId ? (
              <Button
                variant="outlined"
                component="a"
                href={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/live-session/landing/${editId}`
                    : `/live-session/landing/${editId}`
                }
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderColor: "#16a34a",
                  color: "#16a34a",
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Open Public Page
              </Button>
            ) : null}
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
                    <strong>Course:</strong>{" "}
                    {s.courseId?.title || s.courseTitle || "Unassigned"}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <strong>Chapter:</strong>{" "}
                    {s.chapterId?.title || s.chapterTitle || "Unassigned"}
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
                    <TableCell sx={{ fontWeight: "bold" }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Chapter</TableCell>
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
                      <TableCell>
                        {session.courseId?.title || session.courseTitle || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        {session.chapterId?.title || session.chapterTitle || "Unassigned"}
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
          <div
            className={`mb-4 rounded-2xl border px-4 py-4 shadow-sm ${
              reminderSchedulingDisabled
                ? "border-amber-200 bg-amber-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reminder scheduler
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Send reminder before the live session
                </h3>
                <p className="text-sm text-slate-600">
                  {reminderTargetSession?.title ||
                    "Select a live session from the dropdown"}
                </p>
                <p className="text-sm text-slate-600">
                  {reminderScheduleLabel ||
                    "Choose a session to view its date and time."}
                </p>
                <p className="text-xs text-slate-500">
                  Timezone: {reminderTimezone}
                </p>
              </div>

              <div className="w-full md:max-w-sm">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Session to schedule
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={reminderSessionId}
                  disabled={Boolean(selectedSessionId)}
                  onChange={(e) => setReminderSessionId(e.target.value)}
                >
                  <option value="">Select a live session</option>
                  {sessions.map((session) => (
                    <option key={session._id} value={session._id}>
                      {session.title} •{" "}
                      {formatDateWithTimeZone(session.date, reminderTimezone)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedSessionId
                    ? "This view is pinned to the selected session."
                    : "The selected session controls the reminder timing and status."}
                </p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
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
                {reminderTargetSession?.reminderSettings?.recipientCount ? (
                  <p className="text-xs text-slate-500">
                    Confirmed recipients:{" "}
                    {reminderTargetSession.reminderSettings.recipientCount}
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                {reminderSchedulingDisabled ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-100 px-4 py-3 text-sm text-amber-900">
                    {reminderIsLocked
                      ? "This reminder is already sending or has already been sent."
                      : reminderTargetSession
                      ? `Scheduling is disabled for this session because it is not upcoming. Live session date and time: ${reminderScheduleLabel}.`
                      : "Select a live session to enable scheduling. The reminder inputs will stay disabled until you choose one."}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    This session is upcoming, so the reminder inputs below are enabled.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Send reminder before start (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  value={reminderForm.leadTimeMinutes}
                  disabled={reminderSchedulingDisabled}
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
                      disabled={reminderSchedulingDisabled}
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  value={reminderForm.batchSize}
                  disabled={reminderSchedulingDisabled}
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  value={reminderForm.batchDelaySeconds}
                  disabled={reminderSchedulingDisabled}
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

            {reminderError ? (
              <p className="mt-3 text-sm font-medium text-red-600">
                {reminderError}
              </p>
            ) : null}

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
                disabled={savingReminder || reminderSchedulingDisabled}
              >
                {savingReminder ? "Saving..." : "Save reminder settings"}
              </Button>
            </div>
          </div>

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
          <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <label className="block font-semibold mb-2">Course</label>
                <select
                  className="w-full border px-4 py-3 rounded-lg bg-gray-50"
                  value={form.courseId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      courseId: e.target.value,
                      chapterId: "",
                    }))
                  }
                >
                  <option value="">
                    {loadingCourses ? "Loading courses..." : "Select course"}
                  </option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title || course.name || course.slug || course._id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Chapter</label>
                <select
                  className="w-full border px-4 py-3 rounded-lg bg-gray-50 disabled:bg-gray-100"
                  value={form.chapterId}
                  disabled={!form.courseId || loadingChapters}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      chapterId: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    {!form.courseId
                      ? "Choose a course first"
                      : loadingChapters
                      ? "Loading chapters..."
                      : "Select chapter"}
                  </option>
                  {chapters.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>
                      {chapter.title}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Chapters are loaded from the selected course.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Available Chapters
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedCourse
                      ? `Click a chapter to attach it to this live session.`
                      : "Select a course to view its chapters."}
                  </p>
                </div>
                {selectedCourse ? (
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {selectedCourse.title || selectedCourse.name || "Selected course"}
                  </div>
                ) : null}
                {selectedChapter ? (
                  <div className="mt-2 text-xs text-slate-500">
                    Selected chapter: {selectedChapter.title}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                {!form.courseId ? (
                  <p className="text-sm text-slate-500">
                    Choose a course to load its chapters.
                  </p>
                ) : loadingChapters ? (
                  <p className="text-sm text-slate-500">Loading chapters...</p>
                ) : chapters.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No chapters found for this course.
                  </p>
                ) : (
                  chapters.map((chapter) => {
                    const isActive = String(chapter._id) === String(form.chapterId);

                    return (
                      <button
                        key={chapter._id}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            chapterId: chapter._id,
                          }))
                        }
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-green-500 bg-green-50"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="font-medium text-slate-800">
                          {chapter.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {chapter.order !== undefined && chapter.order !== null
                            ? `Chapter order: ${chapter.order}`
                            : "Saved chapter"}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

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

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  Landing Page Builder
                </p>
                <p className="text-sm text-slate-500">
                  Configure the public lead page that will be shared for Google lead capture.
                </p>
              </div>
              <Button
                variant="outlined"
                sx={{ borderColor: "#0f265c", color: "#0f265c" }}
                onClick={handlePreviewLandingPage}
              >
                Preview
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <label className="block font-semibold mb-1">
                      Hero Image
                    </label>
                    <p className="text-sm text-slate-500">
                      Upload an image or paste a URL for the landing-page hero.
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Note: Recommended desktop banner size is 2400 x 1050 px.
                    </p>
                  </div>
                  {landingHeroUploading ? (
                    <span className="text-sm font-medium text-slate-500">
                      Uploading...
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Hero Image File
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLandingHeroImageUpload}
                      className="w-full border px-4 py-3 rounded-lg bg-white"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Supported formats: JPG, PNG, GIF. The image is uploaded immediately.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">
                      Hero Image URL
                    </label>
                    <input
                      type="text"
                      className="w-full border px-4 py-3 rounded-lg bg-white"
                      placeholder="https://example.com/image.jpg"
                      value={form.landingPage.heroImage || ""}
                      onChange={(e) =>
                        updateLandingPageField("heroImage", e.target.value)
                      }
                    />
                  </div>

                  {form.landingPage.heroImage && (
                    <div className="lg:col-span-2">
                      <label className="block font-semibold mb-2">
                        Hero Image Preview
                      </label>
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <img
                          src={form.landingPage.heroImage}
                          alt="Hero preview"
                          className="h-40 w-full max-w-xl rounded-lg object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="lg:col-span-2 mt-2 rounded-lg border border-dashed border-slate-300 bg-white p-4">
                    <div className="mb-3">
                      <label className="block font-semibold mb-1">
                        Mobile Hero Banner
                      </label>
                      <p className="text-sm text-slate-500">
                        Upload a separate mobile banner for phones.
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Note: Recommended mobile banner size is 1080 x 1350 px (4:5).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Mobile Banner File
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLandingMobileHeroImageUpload}
                          className="w-full border px-4 py-3 rounded-lg bg-white"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          JPG, PNG, GIF supported. The image is uploaded immediately.
                        </p>
                      </div>

                      <div>
                        <label className="block font-semibold mb-2">
                          Mobile Banner URL
                        </label>
                        <input
                          type="text"
                          className="w-full border px-4 py-3 rounded-lg bg-white"
                          placeholder="https://example.com/mobile-image.jpg"
                          value={form.landingPage.mobileHeroImage || ""}
                          onChange={(e) =>
                            updateLandingPageField("mobileHeroImage", e.target.value)
                          }
                        />
                      </div>

                      {form.landingPage.mobileHeroImage && (
                        <div className="lg:col-span-2">
                          <label className="block font-semibold mb-2">
                            Mobile Banner Preview
                          </label>
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <img
                              src={form.landingPage.mobileHeroImage}
                              alt="Mobile hero preview"
                              className="h-40 w-full max-w-xs rounded-lg object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <label className="block font-semibold mb-1">
                      CA Profiles
                    </label>
                    <p className="text-sm text-slate-500">
                      Add one or more CA profiles and choose how they appear in the preview.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={form.landingPage.authorLayout || "stack"}
                      onChange={(e) => setAuthorLayout(e.target.value)}
                    >
                      <option value="stack">One per line</option>
                      <option value="two-per-line">Two per line</option>
                    </select>
                    <button
                      type="button"
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                      onClick={addAuthorProfile}
                    >
                      Add Profile
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {normalizeAuthorProfiles(form.landingPage, form).map((profile, index) => (
                    <div
                      key={`author-profile-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          Profile {index + 1}
                        </p>
                        {normalizeAuthorProfiles(form.landingPage, form).length > 1 ? (
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600"
                            onClick={() => removeAuthorProfile(index)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Upload Image File
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAuthorProfileImageUpload(index, e)}
                            className="w-full rounded-lg border px-4 py-3 bg-white"
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            JPG, PNG, GIF supported. The image uploads immediately.
                          </p>
                          {authorProfileUploadingIndex === index ? (
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              Uploading...
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label className="block font-semibold mb-2">
                            Image URL
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border px-4 py-3 bg-white"
                            placeholder="https://example.com/ca-photo.jpg"
                            value={profile.image || ""}
                            onChange={(e) =>
                              updateAuthorProfileField(index, "image", e.target.value)
                            }
                          />
                        </div>

                        {(profile.image || profile.name || profile.text) && (
                          <div className="lg:col-span-2">
                            <label className="block font-semibold mb-2">
                              Profile Preview
                            </label>
                            <div className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                                <div className="mx-auto h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:mx-0 sm:h-20 sm:w-20">
                                  {(profile.image || profile.authorImage) ? (
                                    <img
                                      src={profile.image || profile.authorImage}
                                      alt="CA card preview"
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  ) : null}
                                </div>

                                <div className="text-center sm:text-left">
                                  <h3 className="text-base font-bold leading-tight text-slate-900">
                                    {profile.name || "CA Name"}
                                  </h3>
                                  <div className="mt-1.5 inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-semibold text-sky-800">
                                    {profile.code || "CA"}
                                  </div>
                                  <p
                                    className="mt-1.5 text-[10px] leading-4 text-slate-600 sm:text-[11px] sm:leading-5"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitBoxOrient: "vertical",
                                      WebkitLineClamp: 2,
                                      overflow: "hidden",
                                    }}
                                  >
                                    {profile.text ||
                                      "Short CA description or trust statement."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block font-semibold mb-2">
                            CA Name
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border px-4 py-3 bg-white"
                            placeholder="CA Name"
                            value={profile.name || ""}
                            onChange={(e) =>
                              updateAuthorProfileField(index, "name", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-2">
                            CA Code
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border px-4 py-3 bg-white"
                            placeholder="IICPA"
                            value={profile.code || ""}
                            onChange={(e) =>
                              updateAuthorProfileField(index, "code", e.target.value)
                            }
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block font-semibold mb-2">
                            CA Description
                          </label>
                          <textarea
                            className="w-full min-h-24 rounded-lg border px-4 py-3 bg-white"
                            placeholder="A short CA bio or trust statement"
                            value={profile.text || ""}
                            onChange={(e) =>
                              updateAuthorProfileField(index, "text", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {[
                { field: "headline", label: "Hero Headline", type: "text" },
                { field: "subheadline", label: "Hero Subheadline", type: "text" },
                { field: "ctaText", label: "CTA Text", type: "text" },
                { field: "formHeading", label: "Form Heading", type: "text" },
                { field: "formLabel", label: "Form Label", type: "text" },
              ].map(({ field, label, type }) => (
                <div key={field}>
                  <label className="block font-semibold mb-2">{label}</label>
                  <input
                    type={type}
                    className="w-full border px-4 py-3 rounded-lg bg-gray-50"
                    value={form.landingPage[field] || ""}
                    placeholder={label}
                    onChange={(e) => updateLandingPageField(field, e.target.value)}
                  />
                </div>
              ))}

              <div className="lg:col-span-2">
                <label className="block font-semibold mb-2">Hero / Body Content</label>
                <textarea
                  className="w-full border px-4 py-3 rounded-lg bg-gray-50 min-h-32"
                  value={form.landingPage.bodyContent || ""}
                  placeholder="Add the content that appears below the hero section"
                  onChange={(e) => updateLandingPageField("bodyContent", e.target.value)}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block font-semibold mb-2">Form Description</label>
                <textarea
                  className="w-full border px-4 py-3 rounded-lg bg-gray-50 min-h-24"
                  value={form.landingPage.formDescription || ""}
                  placeholder="Explain what the visitor gets after sharing details"
                  onChange={(e) =>
                    updateLandingPageField("formDescription", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Thank You Text</label>
                <input
                  type="text"
                  className="w-full border px-4 py-3 rounded-lg bg-gray-50"
                  value={form.landingPage.thankYouText || ""}
                  placeholder="Thank you message"
                  onChange={(e) =>
                    updateLandingPageField("thankYouText", e.target.value)
                  }
                />
              </div>

              {/* Social Media Links */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold mb-1">Social Media Links</p>
                <p className="text-sm text-slate-500 mb-4">
                  These links appear as icons on the landing page sidebar. Leave blank to hide a platform.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage", emoji: "🔵" },
                    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourcompany", emoji: "🔷" },
                    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle", emoji: "📸" },
                    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel", emoji: "🔴" },
                    { key: "twitter", label: "X (Twitter)", placeholder: "https://twitter.com/yourhandle", emoji: "⬛" },
                  ].map(({ key, label, placeholder, emoji }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {emoji} {label}
                      </label>
                      <input
                        type="url"
                        className="w-full border px-3 py-2 rounded-lg bg-white text-sm"
                        placeholder={placeholder}
                        value={form.landingPage.socialLinks?.[key] || ""}
                        onChange={(e) =>
                          updateLandingPageField("socialLinks", {
                            ...form.landingPage.socialLinks,
                            [key]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:col-span-2">
                Fields `name`, `email`, and `phone` are included in the public lead form by default.
              </div>
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
