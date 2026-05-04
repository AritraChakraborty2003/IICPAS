"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Clock,
  User,
  Play,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getBlogSlug } from "../../lib/blogSlug";
import LoginModal from "./LoginModal";

interface LiveClass {
  _id: string;
  title: string;
  subtitle?: string;
  instructor: string;
  instructorBio?: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  duration: number;
  maxParticipants: number;
  enrolledCount?: number;
  status: "upcoming" | "live" | "completed" | "active" | "inactive";
  meetingLink?: string;
  thumbnail?: string;
  imageUrl?: string;
  price: number;
  category: string;
  isEnrolled?: boolean;
  bookingId?: string;
}

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

const MOBILE_NUMBER_REGEX = /^[6-9]\d{9}$/;
const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/i;

const normalizeMobileNumber = (value: string) =>
  value.replace(/\D/g, "").slice(0, 10);

export default function LiveClassesDisplay() {
  const router = useRouter();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "upcoming" | "live" | "completed"
  >("upcoming");
  const [user, setUser] = useState<User | null>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<LiveClass | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingEnrollmentSession, setPendingEnrollmentSession] =
    useState<LiveClass | null>(null);
  const didLoginFromEnrollmentRef = useRef(false);
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState("");
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [enrollmentSuccessMessage, setEnrollmentSuccessMessage] = useState("");
  const [enrollmentForm, setEnrollmentForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsappNumber: "",
  });

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const getUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/v1/students/isstudent`, {
        withCredentials: true,
      });
      if (response.data?.student) {
        setUser(response.data.student);
        return response.data.student;
      }
      return null;
    } catch (error) {
      console.log("Not logged in or not a student");
      setUser(null);
      return null;
    }
  }, [API]);

  useEffect(() => {
    if ((window as any).Razorpay) {
      setIsRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsRazorpayReady(true);
    script.onerror = () => setIsRazorpayReady(false);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = await getUser();
      const studentBookingsPromise = currentUser?._id
        ? axios.get(`${API}/api/bookings`, {
            params: {
              studentId: currentUser._id,
              category: "live",
              hasLiveSession: true,
            },
          }).catch((error) => {
            console.warn("Failed to load live session bookings:", error);
            return { data: [] };
          })
        : Promise.resolve({ data: [] });

      try {
        const [liveSessionsResponse, blogsResponse, studentBookingsResponse] = await Promise.all([
          fetch(`${API}/api/live-sessions`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch(`${API}/api/blogs`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          studentBookingsPromise,
        ]);

        const studentBookings = Array.isArray(studentBookingsResponse.data)
          ? studentBookingsResponse.data
          : Array.isArray(studentBookingsResponse.data?.bookings)
          ? studentBookingsResponse.data.bookings
          : [];
        const bookingLookup = new Map<string, string>();
        studentBookings.forEach((booking: any) => {
          const liveSessionId =
            booking?.liveSessionId?._id || booking?.liveSessionId || "";
          if (!liveSessionId) return;
          bookingLookup.set(String(liveSessionId), String(booking._id));
        });

        if (liveSessionsResponse.ok) {
          const data = await liveSessionsResponse.json();

          const transformedClasses = data.map((session: any) => ({
            _id: session._id,
            title: session.title,
            subtitle: session.subtitle || session.category,
            instructor: session.instructor || "CA Instructor",
            instructorBio: session.instructorBio || "Expert CA Instructor",
            description: session.description || "Live class session",
            startTime: session.time ? session.time.split(" - ")[0] : "10:00",
            endTime: session.time ? session.time.split(" - ")[1] : "12:00",
            date: session.date,
            duration: session.duration || 120,
            maxParticipants: session.maxParticipants || 50,
            enrolledCount: session.enrolledCount || 0,
            status: session.status,
            meetingLink: session.link,
            thumbnail: session.thumbnail || "/images/live-class.jpg",
            imageUrl:
              session.imageUrl || session.thumbnail || "/images/live-class.jpg",
            price: session.price || 0,
            category: session.category || "CA Foundation",
            bookingId: bookingLookup.get(String(session._id)),
            isEnrolled: currentUser
              ? Boolean(
                  bookingLookup.get(String(session._id)) ||
                    (currentUser.enrolledLiveSessions || []).some(
                      (sessionId: any) =>
                        String(sessionId) === String(session._id)
                    )
                )
              : false,
          }));

          setLiveClasses(transformedClasses);
        }

        // Handle blogs response
        if (blogsResponse.ok) {
          const blogsData = await blogsResponse.json();
          // Filter only active blogs
          const activeBlogs = blogsData.filter(
            (blog: any) => blog.status === "active"
          );
          setBlogs(activeBlogs);
        } else {
          console.error(
            "Blogs API request failed with status:",
            blogsResponse.status
          );
          setBlogs([]);
        }

        if (!liveSessionsResponse.ok) {
          console.error(
            "Live sessions API request failed with status:",
            liveSessionsResponse.status
          );
          setLiveClasses([
            {
              _id: "1",
              title: "GST Updates & Compliance",
              instructor: "CA Rajesh Kumar",
              description: "Learn about the latest GST updates",
              startTime: "11:00 AM",
              endTime: "12:00 PM",
              date: "2025-01-15T00:00:00.000Z",
              duration: 60,
              maxParticipants: 50,
              enrolledCount: 0,
              status: "upcoming",
              price: 1500,
              category: "Taxation",
              isEnrolled: false,
            },
            {
              _id: "2",
              title: "TDS Computation Masterclass",
              instructor: "CA Priya Sharma",
              description: "Master TDS computation with practical examples",
              startTime: "2:00 PM",
              endTime: "3:30 PM",
              date: "2025-01-20T00:00:00.000Z",
              duration: 90,
              maxParticipants: 40,
              enrolledCount: 0,
              status: "upcoming",
              price: 2000,
              category: "Taxation",
              isEnrolled: false,
            },
          ]);
        }
      } catch (error: any) {
        console.error("Error fetching live classes:", error);
        setLiveClasses([
          {
            _id: "1",
            title: "Sample Live Session",
            instructor: "CA Expert",
            description: "Interactive live session",
            startTime: "10:00 AM",
            endTime: "11:00 AM",
            date: "2025-01-15T00:00:00.000Z",
            duration: 60,
            maxParticipants: 50,
            enrolledCount: 0,
            status: "upcoming",
            price: 1500,
            category: "General",
            isEnrolled: false,
          },
        ]);
      }
    };

    fetchData();
  }, [API, getUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Time TBD";
    const [hour, minute] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-100 text-red-800 border-red-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        );
      case "upcoming":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "active":
        return <Play className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleJoinSession = (session: LiveClass) => {
    if (!session.meetingLink) return;

    if (session.meetingLink.startsWith("http")) {
      window.open(session.meetingLink, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.href = session.meetingLink;
  };

  const filteredClasses = liveClasses.filter((session) => {
    if (selectedTab === "upcoming") {
      return session.status === "upcoming" || session.status === "active";
    }
    return session.status === selectedTab;
  });

  const openEnrollmentModal = (
    session: LiveClass,
    currentUser: User | null = user
  ) => {
    setSelectedSession(session);
    setEnrollmentSuccessMessage("");
    setEnrollmentForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone ? normalizeMobileNumber(currentUser.phone) : "",
      whatsappNumber: currentUser?.phone
        ? normalizeMobileNumber(currentUser.phone)
        : "",
    });
    setShowEnrollModal(true);
  };

  const updateSessionEnrollment = (
    sessionId: string,
    bookingId?: string | null
  ) => {
    setLiveClasses((prev) =>
      prev.map((session) =>
        session._id === sessionId
          ? {
              ...session,
              isEnrolled: true,
              bookingId: bookingId || session.bookingId,
              enrolledCount: (session.enrolledCount || 0) + 1,
            }
          : session
      )
    );

    setSelectedSession((prev) =>
      prev && prev._id === sessionId
        ? {
            ...prev,
            isEnrolled: true,
            bookingId: bookingId || prev.bookingId,
            enrolledCount: (prev.enrolledCount || 0) + 1,
          }
        : prev
    );
  };

  const buildInvoiceDownloadUrl = (bookingId: string) =>
    `${API}/api/test-payment/receipts/booking/${bookingId}/download`;

  const handleDownloadInvoice = async (session: LiveClass) => {
    if (!session.bookingId) {
      toast.error("Invoice is not available yet.");
      return;
    }

    setDownloadingInvoiceId(session._id);
    try {
      const response = await axios.get(
        buildInvoiceDownloadUrl(session.bookingId),
        {
          withCredentials: true,
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `Live-Session-Invoice-${String(session.bookingId)
        .slice(-8)
        .toUpperCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Failed to download live session invoice:", error);
      toast.error(
        error?.response?.data?.message ||
          "Unable to download invoice right now."
      );
    } finally {
      setDownloadingInvoiceId("");
    }
  };

  const promptLoginForEnrollment = (session: LiveClass) => {
    setSelectedSession(null);
    setPendingEnrollmentSession(session);
    didLoginFromEnrollmentRef.current = false;
    setEnrollmentSuccessMessage(
      "Please log in or register to enroll in this live session."
    );
    setShowLoginModal(true);
    toast.error("Please log in or register to enroll in this live session.");
  };

  const handleAuthSuccess = async () => {
    const currentUser = await getUser();
    const sessionToEnroll = pendingEnrollmentSession;

    if (sessionToEnroll && currentUser) {
      setPendingEnrollmentSession(null);
      openEnrollmentModal(sessionToEnroll, currentUser);
    }
  };

  useEffect(() => {
    if (!showEnrollModal || !selectedSession || !user) {
      if (showEnrollModal && selectedSession && !user) {
        void getUser();
      }
      return;
    }

    setEnrollmentForm((prev) => ({
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
      phone: prev.phone || (user.phone ? normalizeMobileNumber(user.phone) : ""),
      whatsappNumber:
        prev.whatsappNumber ||
        (user.phone ? normalizeMobileNumber(user.phone) : ""),
    }));
  }, [showEnrollModal, selectedSession, user]);

  const closeEnrollmentModal = () => {
    setShowEnrollModal(false);
    setSelectedSession(null);
    setPendingEnrollmentSession(null);
    setIsSubmittingEnrollment(false);
    setEnrollmentSuccessMessage("");
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    if (didLoginFromEnrollmentRef.current) {
      didLoginFromEnrollmentRef.current = false;
      return;
    }

    if (!user) {
      setPendingEnrollmentSession(null);
    }
  };

  const handleEnrollClick = async (session: LiveClass) => {
    if (session.status === "live" && session.isEnrolled && session.meetingLink) {
      handleJoinSession(session);
      return;
    }

    const draftKey = `iicpa-live-session-landing-draft:${session._id}`;
    router.push(
      `/live-session/landing/preview?draftKey=${encodeURIComponent(draftKey)}&sessionId=${encodeURIComponent(session._id)}`
    );
  };

  const handleEnrollmentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEnrollmentForm((prev) => ({
      ...prev,
      [name]:
        name === "phone" || name === "whatsappNumber"
          ? normalizeMobileNumber(value)
          : value,
    }));
  };

  const handleEnrollmentSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!selectedSession) return;
    const currentUser = user || (await getUser());
    if (!currentUser) {
      closeEnrollmentModal();
      promptLoginForEnrollment(selectedSession);
      return;
    }
    const normalizedEmail = enrollmentForm.email.trim().toLowerCase();
    const normalizedPhone = normalizeMobileNumber(enrollmentForm.phone);
    const normalizedWhatsappNumber = enrollmentForm.whatsappNumber.trim()
      ? normalizeMobileNumber(enrollmentForm.whatsappNumber)
      : normalizedPhone;

    if (
      !enrollmentForm.name.trim() ||
      !normalizedEmail ||
      !normalizedPhone
    ) {
      setEnrollmentSuccessMessage("Please fill in name, email, and phone.");
      return;
    }

    if (!ALLOWED_EMAIL_REGEX.test(normalizedEmail)) {
      setEnrollmentSuccessMessage(
        "Please enter a valid email address like user@gmail.com or info@company.com."
      );
      return;
    }

    if (!MOBILE_NUMBER_REGEX.test(normalizedPhone)) {
      setEnrollmentSuccessMessage(
        "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."
      );
      return;
    }

    if (
      enrollmentForm.whatsappNumber.trim() &&
      !MOBILE_NUMBER_REGEX.test(normalizedWhatsappNumber)
    ) {
      setEnrollmentSuccessMessage(
        "Please enter a valid 10-digit WhatsApp number starting with 6, 7, 8, or 9."
      );
      return;
    }

    setIsSubmittingEnrollment(true);
    try {
      if (selectedSession.price > 0) {
        if (!isRazorpayReady || !(window as any).Razorpay) {
          throw new Error("Razorpay checkout is not available right now");
        }

        const orderResponse = await axios.post(
          `${API}/api/test-payment/create-order`,
          {
            liveSessionId: selectedSession._id,
            studentId: currentUser._id,
            name: enrollmentForm.name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            whatsappNumber: normalizedWhatsappNumber,
            price: selectedSession.price,
            paymentSource: "live-session-page",
          }
        );

        const orderData = orderResponse.data?.data;
        if (!orderResponse.data?.success || !orderData?.orderId) {
          throw new Error(orderResponse.data?.message || "Failed to create payment order");
        }

        const razorpay = new (window as any).Razorpay({
          key:
            orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "IICPA Institute",
          description: selectedSession.title,
          order_id: orderData.orderId,
          prefill: {
            name: enrollmentForm.name.trim(),
            email: normalizedEmail,
            contact: normalizedPhone,
          },
          theme: {
            color: "#3cd664",
          },
          modal: {
            ondismiss: () => {
              setIsSubmittingEnrollment(false);
            },
          },
          handler: async (response: any) => {
            try {
              const verificationResponse = await axios.post(
                `${API}/api/test-payment/verify-and-capture`,
                response
              );

              if (!verificationResponse.data?.success) {
                throw new Error(
                  verificationResponse.data?.message || "Payment verification failed"
                );
              }

              updateSessionEnrollment(
                selectedSession._id,
                verificationResponse.data?.data?.bookingId
              );
              setEnrollmentSuccessMessage(
                "Payment successful. Your booking is confirmed."
              );
            } catch (verificationError: any) {
              console.error("Payment verification failed:", verificationError);
              setEnrollmentSuccessMessage(
                verificationError?.response?.data?.message ||
                  verificationError?.message ||
                  "Payment verification failed. Please contact support."
              );
            } finally {
              setIsSubmittingEnrollment(false);
            }
          },
        });

        razorpay.open();
        return;
      }

      const bookingResponse = await axios.post(`${API}/api/bookings`, {
        studentId: currentUser._id,
        liveSessionId: selectedSession._id,
        by: normalizedEmail,
        requesterName: enrollmentForm.name.trim(),
        phone: normalizedPhone,
        whatsappNumber: normalizedWhatsappNumber,
        title: selectedSession.title,
        hrs: Math.max(1, Math.ceil((selectedSession.duration || 60) / 60)),
        type: "individual",
        category: "live",
        status: "booked",
        paymentStatus: "free",
        date: selectedSession.date,
      });

      updateSessionEnrollment(
        selectedSession._id,
        bookingResponse.data?._id || bookingResponse.data?.bookingId
      );
      toast.success("Enrolled successfully");
      setEnrollmentSuccessMessage(
        "Enrolled successfully. Your invoice is ready for download."
      );
    } catch (error) {
      console.error("Failed to store enrollment:", error);
      setEnrollmentSuccessMessage(
        (error as any)?.response?.data?.message ||
          "Failed to complete enrollment. Please try again."
      );
      setIsSubmittingEnrollment(false);
    } finally {
      if (selectedSession.price <= 0) {
        setIsSubmittingEnrollment(false);
      }
    }
  };

  return (
    <div className="py-8 px-4">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto mb-8">
        {(["upcoming", "live", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedTab === tab
                ? "bg-white text-[#3cd664] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1 text-xs">
              (
              {
                liveClasses.filter((s) => {
                  if (tab === "upcoming")
                    return s.status === "upcoming" || s.status === "active";
                  return s.status === tab;
                }).length
              }
              )
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
        {filteredClasses.map((session) => (
          <motion.div
            key={session._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group"
          >
            {session.status === "live" && session.isEnrolled && !session.meetingLink && (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                You are enrolled, but the join link is not available yet.
              </div>
            )}

            <div className="flex justify-between items-start mb-3">
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                  session.status
                )}`}
              >
                {getStatusIcon(session.status)}
                <span>
                  {session.status.charAt(0).toUpperCase() +
                    session.status.slice(1)}
                </span>
              </div>

              {session.price > 0 && (
                <span className="bg-[#3cd664] text-white px-2 py-1 rounded-md text-sm font-semibold">
                  ₹{session.price.toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                  {session.title}
                </h3>
              </div>

              {session.instructor && (
                <div className="flex items-center">
                  <User className="w-3 h-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-600">
                    {session.instructor}
                  </span>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-600">
                  {formatDate(session.date)}
                </div>
                <div className="text-xs font-medium text-gray-700">
                  {formatTime(session.startTime)} -{" "}
                  {formatTime(session.endTime)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <div>
                  {session.enrolledCount || 0}/{session.maxParticipants}{" "}
                  enrolled
                </div>
                <div>{session.duration || 120}min</div>
              </div>

              {session.category && (
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                    {session.category}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                {session.isEnrolled ? (
                  <div className="space-y-2">
                    {session.status === "live" && session.meetingLink ? (
                      <button
                        type="button"
                        onClick={() => handleJoinSession(session)}
                        className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 flex items-center justify-center space-x-1"
                      >
                        <Video className="w-3 h-3" />
                        <span>Join Now</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 cursor-not-allowed flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Enrolled</span>
                      </button>
                    )}

                    {session.bookingId ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleDownloadInvoice(session);
                        }}
                        disabled={downloadingInvoiceId === session._id}
                        className="w-full rounded-lg border border-[#3cd664] bg-white px-3 py-2 text-sm font-medium text-[#1f7a3e] transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {downloadingInvoiceId === session._id
                          ? "Downloading..."
                          : "Download Invoice"}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void handleEnrollClick(session);
                    }}
                    disabled={false}
                    className="w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1 bg-[#3cd664] text-white hover:bg-[#33bb58]"
                  >
                    <Play className="w-3 h-3" />
                    <span>Enroll Now</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-500 flex items-center justify-center space-x-2 mt-6">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled</span>
      </div>

      {/* Moving Blogs Carousel Section */}
      {blogs.length > 0 && (
        <section className="py-20 bg-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Latest Blog Posts
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Stay updated with our latest insights and knowledge
              </p>
            </motion.div>

            {/* Moving Cards Container */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-8">
              <motion.div
                className="flex gap-8"
                animate={{
                  x: [0, -100 * Math.min(blogs.length, 10)],
                }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  width: `${Math.min(blogs.length, 10) * 360}px`,
                }}
              >
                {/* Duplicate cards for seamless loop */}
                {[...blogs.slice(0, 10), ...blogs.slice(0, 10)].map(
                  (blog, index) => {
                    // Generate fallback image based on blog title or use default
                    const getFallbackImage = (title: string) => {
                      const images = [
                        "/images/accounting.webp",
                        "/images/course.png",
                        "/images/live-class.jpg",
                        "/images/student.png",
                        "/images/university.png",
                        "/images/vr-student.jpg",
                      ];
                      const hash = title.split("").reduce((a, b) => {
                        a = (a << 5) - a + b.charCodeAt(0);
                        return a & a;
                      }, 0);
                      return images[Math.abs(hash) % images.length];
                    };

                    const imageUrl = blog.imageUrl?.startsWith("http")
                      ? blog.imageUrl
                      : blog.imageUrl
                      ? `${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:8080"
                        }${
                          blog.imageUrl.startsWith("/")
                            ? blog.imageUrl
                            : "/" + blog.imageUrl
                        }`
                      : getFallbackImage(blog.title);

                    return (
                      <motion.div
                        key={`${blog._id}-${index}`}
                        className="flex-shrink-0 w-80 bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105"
                        whileHover={{ y: -8 }}
                        onClick={() => {
                          const blogSlug = getBlogSlug(blog);
                          window.location.href = blogSlug
                            ? `/blogs/${blogSlug}`
                            : "/blogs";
                        }}
                      >
                        <div className="h-56 overflow-hidden rounded-t-3xl">
                          <img
                            src={imageUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-8">
                          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                            <span>📝</span>
                            <span>{blog.category || "General"}</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 mb-3">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            {blog.createdAt
                              ? new Date(blog.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "Recent"}
                          </p>
                          <div className="flex items-center text-green-600 text-sm font-semibold">
                            <span>Read More</span>
                            <motion.svg
                              className="w-5 h-5 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </motion.svg>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {showEnrollModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Enroll in Live Session
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedSession.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEnrollmentModal}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close enrollment modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {selectedSession.isEnrolled ? (
                <div className="mt-4 space-y-4">
                  {enrollmentSuccessMessage ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-medium text-green-700">
                      {enrollmentSuccessMessage}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-medium text-green-700">
                      Enrollment completed successfully.
                    </div>
                  )}

                  <div className={selectedSession.bookingId ? "flex gap-3" : ""}>
                    {selectedSession.bookingId ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleDownloadInvoice(selectedSession);
                        }}
                        disabled={downloadingInvoiceId === selectedSession._id}
                        className="flex-1 rounded-lg border border-[#3cd664] px-4 py-2.5 text-sm font-medium text-[#1f7a3e] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {downloadingInvoiceId === selectedSession._id
                          ? "Downloading..."
                          : "Download Invoice"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={closeEnrollmentModal}
                      className={
                        selectedSession.bookingId
                          ? "flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          : "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      }
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEnrollmentSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={enrollmentForm.name}
                      onChange={handleEnrollmentInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#3cd664] focus:ring-2 focus:ring-[#3cd664]/20"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={enrollmentForm.phone}
                      onChange={handleEnrollmentInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#3cd664] focus:ring-2 focus:ring-[#3cd664]/20"
                      placeholder="Enter your 10-digit mobile number"
                      inputMode="numeric"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={enrollmentForm.email}
                      onChange={handleEnrollmentInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#3cd664] focus:ring-2 focus:ring-[#3cd664]/20"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      name="whatsappNumber"
                      value={enrollmentForm.whatsappNumber}
                      onChange={handleEnrollmentInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#3cd664] focus:ring-2 focus:ring-[#3cd664]/20"
                      placeholder="Enter 10-digit WhatsApp number"
                      inputMode="numeric"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                    />
                  </div>

                  <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    Session Date: {formatDate(selectedSession.date)}
                  </div>

                  {selectedSession.price > 0 ? (
                    <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                      Pay now: ₹{selectedSession.price.toLocaleString()}
                    </div>
                  ) : null}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeEnrollmentModal}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEnrollment}
                      className="flex-1 rounded-lg bg-[#3cd664] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#33bb58] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmittingEnrollment
                        ? "Processing..."
                        : selectedSession.price > 0
                        ? `Pay ₹${selectedSession.price}`
                        : "Enroll Now"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={closeLoginModal}
        onLoginSuccess={() => {
          didLoginFromEnrollmentRef.current = true;
          setShowLoginModal(false);
          void handleAuthSuccess();
        }}
      />
    </div>
  );
}
