"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaBook,
  FaVideo,
  FaNewspaper,
  FaUser,
  FaHeadset,
  FaCertificate,
  FaBars,
  FaTimes,
  FaQuoteLeft,
  FaPlay,
  FaSignOutAlt,
  FaFileAlt,
  FaQuestionCircle,
  FaComments,
  FaBell,
  FaShoppingCart,
  FaCoins,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import toast from "react-hot-toast";

import CertificatesTab from "../components/CertificateTab";
import CoursesTab from "../components/CourseTab";
import BuyCoursesTab from "../components/BuyCoursesTab";
import RevisionTab from "./RevisionTab.tsx";
import TicketTab from "../components/TicketTab";
import NewsTab from "./NewsTab";
import LiveClassTab from "../components/LiveClassTab";
import RecordedSessionTab from "./RecordedSessionTab";
import ProfileTab from "../components/ProfileTab";
import TestimonialTab from "./TestimonialTab";

function StudentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("buy-courses"); // Default to Buy Courses for new students
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [studentCoins, setStudentCoins] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(false); // Initialize as false to prevent initial blinking
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Ticket modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const getCoinsStorageKey = (studentId) => `student_coins_${studentId}`;

  // Sidebar tabs
  const tabs = [
    { id: "buy-courses", icon: <FaShoppingCart />, label: "Buy Courses" },
    { id: "courses", icon: <FaBook />, label: "Courses" },
    { id: "revision", icon: <FaBook />, label: "Assessment" },
    { id: "live", icon: <FaVideo />, label: "Live Class", dot: true },
    { id: "recorded", icon: <FaPlay />, label: "Recorded Sessions", dot: true },
    { id: "news", icon: <FaNewspaper />, label: "News" },
    { id: "testimonial", icon: <FaQuoteLeft />, label: "Testimonial" },
    { id: "support", icon: <FaHeadset />, label: "Support" },
    {
      id: "certificates",
      icon: <FaCertificate />,
      label: "Certificates",
      dot: true,
      dotColor: "green",
    },
  ];

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      [
        "buy-courses",
        "courses",
        "revision",
        "live",
        "recorded",
        "news",
        "testimonial",
        "support",
        "certificates",
        "profile",
      ].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Student auth check
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/isstudent`,
          { withCredentials: true }
        );
        // Authenticated: set student
        if (res.data && res.data.student) {
          const currentStudent = res.data.student;
          setStudent(currentStudent);

          if (currentStudent?._id && typeof window !== "undefined") {
            const storageKey = getCoinsStorageKey(currentStudent._id);
            const storedCoins = localStorage.getItem(storageKey);
            const parsedCoins =
              storedCoins !== null ? Number(storedCoins) : NaN;

            if (Number.isFinite(parsedCoins) && parsedCoins >= 0) {
              setStudentCoins(parsedCoins);
            } else {
              setStudentCoins(0);
              localStorage.setItem(storageKey, "0");
            }
          }

          // Update ticket form with student data
          setTicketForm({
            name: currentStudent.name || "",
            email: currentStudent.email || "",
            phone: currentStudent.phone || "",
            message: "",
          });
        } else {
          setStudentCoins(0);
          router.replace("/student-login");
        }
      } catch (err) {
        setStudentCoins(0);
        router.replace("/student-login");
      }
      // Remove finally block to prevent loading state changes
    };
    fetchStudent();
  }, [router]);

  // Handle ticket submission
  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, message } = ticketForm;

    if (!phone.trim() || !message.trim()) {
      return toast.error("Phone and Message are required.");
    }

    setSubmitting(true);
    try {
      console.log("Ticket data:", { name, email, phone, message });

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets`, {
        name,
        email,
        phone,
        message,
      });
      toast.success("Ticket submitted successfully!");
      setTicketForm((prev) => ({ ...prev, phone: "", message: "" }));
      setShowTicketModal(false);
    } catch (error) {
      console.error(
        "Error submitting ticket:",
        error.response?.data || error.message
      );
      toast.error("Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/logout`,
        {
          withCredentials: true,
        }
      );
      router.push("/student-login");
    } catch (err) {
      console.error("Logout error", err);
      toast.error("Logout failed");
    }
  };

  // Tab rendering with memoization to prevent re-renders
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "buy-courses":
        return <BuyCoursesTab />;
      case "courses":
        return <CoursesTab />;
      case "revision":
        return <RevisionTab />;
      case "live":
        return <LiveClassTab />;
      case "recorded":
        return <RecordedSessionTab />;
      case "news":
        return <NewsTab />;
      case "profile":
        return <ProfileTab student={student} />;
      case "testimonial":
        return <TestimonialTab student={student} />;
      case "support":
        return <TicketTab viewerType="student" />;
      case "certificates":
        return <CertificatesTab />;
      default:
        return <BuyCoursesTab />;
    }
  }, [activeTab, student]);

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div
        className={`${
          sidebarCollapsed ? "p-2" : "p-6 pb-4"
        } transition-all duration-300`}
      >
        <div
          className={`flex items-center justify-center ${
            sidebarCollapsed ? "mb-4" : "mb-6"
          }`}
        >
          <div
            className={`bg-white ${
              sidebarCollapsed ? "p-2" : "p-3"
            } rounded-lg shadow-lg`}
          >
            <img
              src="/images/logo.png"
              alt="IICPA Institute"
              className={`${
                sidebarCollapsed ? "h-8" : "h-12"
              } w-auto object-contain`}
            />
          </div>
        </div>
        {/* User Info */}
        {student && !sidebarCollapsed && (
          <div className="text-center mb-4 p-3 bg-blue-50 rounded-lg">
            <div
              onClick={() => setActiveTab("profile")}
              className="cursor-pointer hover:bg-blue-100 p-2 rounded-md transition-colors duration-200"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                  {student.image ? (
                    <img
                      src={`${API}/${student.image}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log(
                          "Sidebar profile image failed to load:",
                          `${API}/${student.image}`
                        );
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      student.image ? "hidden" : ""
                    }`}
                  >
                    <FaUser size={16} className="text-white" />
                  </div>
                </div>
                <p className="font-semibold text-blue-800">{student.name}</p>
              </div>
              <p className="text-sm text-blue-600 mt-1">Student</p>
            </div>
          </div>
        )}
        {/* Collapsed user profile */}
        {student && sidebarCollapsed && (
          <div className="flex justify-center mb-4">
            <div
              onClick={() => setActiveTab("profile")}
              className="cursor-pointer hover:bg-blue-100 p-2 rounded-full transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {student.image ? (
                  <img
                    src={`${API}/${student.image}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log(
                        "Sidebar profile image failed to load:",
                        `${API}`
                      );
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    student.image ? "hidden" : ""
                  }`}
                >
                  <FaUser size={14} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <nav
        className={`flex-1 overflow-y-auto ${
          sidebarCollapsed ? "px-1" : "px-3"
        } custom-scrollbar`}
      >
        {tabs.map((tab) => (
          <div key={tab.id}>
            <NavItem
              icon={tab.icon}
              label={sidebarCollapsed ? "" : tab.label}
              active={activeTab === tab.id}
              dot={tab.dot}
              dotColor={tab.dotColor}
              collapsed={sidebarCollapsed}
              onClick={() => {
                setActiveTab(tab.id);
                setIsDrawerOpen(false);
              }}
            />
          </div>
        ))}
      </nav>
    </div>
  );

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 min-h-screen sidebar-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
      }`}
    >
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block ${
          sidebarCollapsed ? "w-16" : "w-64"
        } h-screen fixed left-0 top-0 bg-gradient-to-b from-blue-100 to-blue-200 border-r border-blue-300 rounded-r-2xl shadow-xl overflow-y-auto custom-scrollbar z-50 transition-all duration-300 relative`}
      >
        <SidebarContent />
        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 h-9 w-9 rounded-full border border-blue-200 bg-white text-blue-600 shadow-md hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-center"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
        </button>
      </aside>
      {/* Mobile Drawer */}
      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        direction="left"
        className="lg:hidden"
        size="280px"
        enableOverlay={true}
        lockBackgroundScroll={true}
      >
        <div className="h-full">
          <SidebarContent />
        </div>
      </Drawer>
      {/* Main Content */}
      <main className="main-content bg-[#f5f6fa] min-h-screen lg:h-screen overflow-y-auto thin-scrollbar">
        {/* Fixed Header */}
        <div className="sticky top-0 z-40 bg-[#f5f6fa] border-b border-gray-200 p-2 md:p-3">
          <div className="flex justify-between items-center">
            <button
              className="lg:hidden p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              onClick={() => setIsDrawerOpen(true)}
            >
              <FaBars />
            </button>
            <input
              type="text"
              placeholder="Search for a topic"
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center gap-2 md:gap-3 ml-4">
              {/* Mobile coins button */}
              <button
                type="button"
                className="md:hidden p-2 bg-amber-100 text-amber-700 rounded-lg transition-colors"
                title={`Coins: ${studentCoins}`}
              >
                <FaCoins />
              </button>
              {/* Mobile logout button */}
              <button
                onClick={handleLogout}
                className="md:hidden p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                title="Logout"
              >
                <FaSignOutAlt />
              </button>
              {/* Desktop buttons */}
              <div className="hidden md:flex items-center gap-3">
                <button className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  Digital Hub
                </button>
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700"
                  title="Your coins"
                >
                  <FaCoins className="text-amber-500" />
                  <span>{studentCoins}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-2 md:p-3">
          {/* Back Button - Only show when not on courses tab */}

          {/* (optional: banners and prompts) */}
          {renderTabContent}
        </div>
      </main>

      {/* Floating Add Ticket Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setShowTicketModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
          title="Submit a Ticket"
        >
          <FaHeadset size={24} />
        </button>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-transparent bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                Submit a Ticket
              </h3>
              <button
                onClick={() => setShowTicketModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  value={ticketForm.name}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  value={ticketForm.email}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your phone number"
                  value={ticketForm.phone}
                  onChange={(e) =>
                    setTicketForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="Describe your issue or request..."
                  value={ticketForm.message}
                  onChange={(e) =>
                    setTicketForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={null}>
      <StudentDashboardContent />
    </Suspense>
  );
}

function NavItem({
  icon,
  label,
  active,
  dot,
  dotColor = "red",
  collapsed,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} ${
        collapsed ? "px-2 py-3" : "px-4 py-3"
      } rounded-lg w-full text-left mb-2 transition-all duration-200 group relative ${
        active
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md"
          : "hover:bg-blue-50 text-gray-700 hover:text-blue-700"
      }`}
      title={collapsed ? label : ""}
    >
      <span
        className={`${collapsed ? "text-xl" : "text-lg"} relative ${
          active ? "text-white" : "text-blue-500"
        }`}
      >
        {icon}
        {dot && (
          <span
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              dotColor === "green"
                ? "bg-green-500"
                : dotColor === "yellow"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
        )}
      </span>
      {!collapsed && <span className="font-medium break-words">{label}</span>}
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </button>
  );
}
