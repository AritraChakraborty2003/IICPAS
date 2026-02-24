"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FaBars,
  FaTachometerAlt,
  FaBookOpen,
  FaUserGraduate,
  FaMoneyBill,
  FaUsers,
  FaUserTie,
  FaChartBar,
  FaLayerGroup,
  FaUniversity,
  FaBoxOpen,
  FaFileInvoiceDollar,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaTicketAlt,
  FaUserCircle,
  FaShoppingCart,
  FaArrowLeft,
} from "react-icons/fa";

// Import tab content components
import DashboardTab from "./Dashboard";
import GuideTab from "./GuideTab";
import StudentsTab from "./StudentsTab";
import PaymentsTab from "./PaymentsTab";
import JobSeekersTab from "./JobSeekersTab";
import LeadsTab from "./LeadsTab";
import AnalyticsTab from "./AnalyticsTab";
import TeamTab from "./TeamTab";
import BatchesTab from "./BatchesTab";
import CollegesTab from "./CollegesTab";
import KitsTab from "./KitsTab";
import OrdersInvoicesTab from "./OrdersInvoicesTab";
import OrdersTab from "./OrdersTab";
import TrainingTab from "./TrainingTab";
import CalendarTab from "./CalendarTab";
import TicketTab from "./TicketTab";
import ProfileTab from "./ProfileTab";
import Header from "./Header";
import { useAuthHeartbeat } from "../../lib/useAuthHeartbeat";

// Sidebar tabs config (icon for each)
const tabs = [
  { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { id: "guide", label: "Guide", icon: <FaBookOpen /> },
  { id: "students", label: "Students", icon: <FaUserGraduate /> },
  { id: "payments", label: "Payments", icon: <FaMoneyBill /> },
  { id: "jobseekers", label: "Job Seekers", icon: <FaUserTie /> },
  { id: "leads", label: "Leads", icon: <FaUsers /> },
  { id: "analytics", label: "Analytics", icon: <FaChartBar /> },
  { id: "team", label: "Team", icon: <FaUsers /> },
  { id: "batches", label: "Batches", icon: <FaLayerGroup /> },
  { id: "colleges", label: "Colleges", icon: <FaUniversity /> },
  { id: "kits", label: "Kits", icon: <FaBoxOpen /> },
  { id: "orders", label: "Orders", icon: <FaShoppingCart /> },
  {
    id: "orders-invoices",
    label: "Orders & Invoices",
    icon: <FaFileInvoiceDollar />,
  },
  { id: "training", label: "Training", icon: <FaChalkboardTeacher /> },
  { id: "calendar", label: "Calendar", icon: <FaCalendarAlt /> },
  { id: "raise-ticket", label: "Raise Ticket", icon: <FaTicketAlt /> },
  { id: "profile", label: "Profile", icon: <FaUserCircle /> },
];

// Tab content renderer
function renderTabContent(tabId, center) {
  switch (tabId) {
    case "dashboard":
      return <DashboardTab />;
    case "guide":
      return <GuideTab />;
    case "students":
      return <StudentsTab />;
    case "payments":
      return <PaymentsTab />;
    case "jobseekers":
      return <JobSeekersTab />;
    case "leads":
      return <LeadsTab />;
    case "analytics":
      return <AnalyticsTab />;
    case "team":
      return <TeamTab />;
    case "batches":
      return <BatchesTab />;
    case "colleges":
      return <CollegesTab />;
    case "kits":
      return center ? <KitsTab center={center} /> : <div>Loading...</div>;
    case "orders":
      return center ? <OrdersTab center={center} /> : <div>Loading...</div>;
    case "orders-invoices":
      return <OrdersInvoicesTab />;
    case "training":
      return <TrainingTab />;
    case "calendar":
      return <CalendarTab />;
    case "raise-ticket":
      return <TicketTab />;
    case "profile":
      return <ProfileTab />;
    default:
      return <DashboardTab />;
  }
}

export default function CenterDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [center, setCenter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useAuthHeartbeat({
    enabled: !!center,
    heartbeatUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/heartbeat`,
  });

  useEffect(() => {
    // Check if center is authenticated
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");

        if (!process.env.NEXT_PUBLIC_API_URL) {
          console.error("API URL not configured");
          throw new Error("API URL not configured");
        }

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/centers/iscenter`,
          {
            withCredentials: true,
            timeout: 5000, // 5 second timeout
          }
        );

        console.log("Auth response:", res.data);

        if (res.data.center) {
          console.log("Center data loaded:", res.data.center);
          setCenter(res.data.center);
        } else {
          console.log("No center data found, redirecting to login");
          router.push("/center-login");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        console.error("Error details:", error.response?.data || error.message);

        // If it's a network error or timeout, show a more specific message
        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          console.error("API timeout or connection error");
        }

        router.push("/center-login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/centers/logout`,
        {
          withCredentials: true,
        }
      );
      router.push("/center-login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleBack = () => {
    setActiveTab("dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading center dashboard...</p>
        </div>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
          <p className="mt-2 text-sm text-gray-500">
            If you're not redirected automatically, please check your
            connection.
          </p>
        </div>
      </div>
    );
  }

  // Sidebar as component so you can reuse it in both desktop and drawer
  const Sidebar = (
    <div className="h-screen flex flex-col">
      <div className="flex items-center gap-2 mb-8 px-4">
        <img
          src="https://fincurious.in/favicon.ico"
          alt="Logo"
          className="h-8 w-8"
        />
        <span className="font-bold text-lg">IICPA</span>
        <span className="ml-auto">
          <i className="fas fa-lock" />
        </span>
      </div>
      <div className="mb-10 px-4">
        <div className="font-semibold">{center?.name || "Center"}</div>
        <div className="text-sm text-[#e0e7ff]">{center?.email}</div>
      </div>
      <nav className="flex-1 flex flex-col gap-2 text-base overflow-y-auto px-2 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSidebarOpen(false); // also close drawer on mobile
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
              activeTab === tab.id
                ? "bg-white text-[#3866c6] font-bold shadow"
                : "hover:bg-[#274087] font-medium"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f5f7fa] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-70 bg-blue-400 border-r-1 border-blue-500 rounded-[1vmin] text-white h-full overflow-y-auto z-20 shadow custom-scrollbar">
        {Sidebar}
      </aside>

      {/* Drawer for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30 flex md:hidden">
          <div className="w-64 bg-[#3866c6] text-white h-full">{Sidebar}</div>
          <div
            className="flex-1"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <Header
          center={center}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content (scrollable area) */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {/* Back Button - Only show when not on dashboard home */}
          {activeTab !== "dashboard" && (
            <div className="p-6 pb-0">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
              >
                <FaArrowLeft className="text-sm" />
                Back to Dashboard
              </button>
            </div>
          )}
          {renderTabContent(activeTab, center)}
        </div>
      </div>
    </div>
  );
}
