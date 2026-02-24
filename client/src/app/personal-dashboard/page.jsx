"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import {
  FaSignOutAlt,
  FaBars,
  FaChalkboardTeacher,
  FaFileUpload,
  FaTachometerAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { PlusCircle, X } from "lucide-react";
import BookingCalendar from "./BookingCalendar";
import TicketRaise from "./IndividualTicketRaiseAndList";
import IndividualProfile from "./IndividualProfile";
import DashboardOverview from "./DashboardOverview";
import { useAuthHeartbeat } from "../../lib/useAuthHeartbeat";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

const IndividualDashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Ticket modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useAuthHeartbeat({
    enabled: !!user,
    heartbeatUrl: `${API}/auth/heartbeat`,
  });

  useEffect(() => {
    const verifyIndividual = async () => {
      try {
        const res = await axios.get(`${API}/v1/individual/profile-valid`, {
          withCredentials: true,
        });

        const userData = res.data.user || res.data.individual;
        setUser(userData);

        // Update ticket form with user data
        if (userData && userData.name && userData.email) {
          setTicketForm((prev) => ({
            ...prev,
            name: userData.name,
            email: userData.email,
          }));
        }

        setLoading(false);
      } catch (err) {
        toast.error("Unauthorized. Please login.");
        router.push("/training/practical");
      }
    };

    verifyIndividual();
  }, [router]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API}/v1/individual/logout`,
        {},
        { withCredentials: true }
      );
      toast.success("Logged out");
      router.push("/training/practical");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  // Handle ticket submission
  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, message } = ticketForm;

    if (!phone.trim() || !message.trim()) {
      return toast.error("Phone and Message are required.");
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/tickets`, { name, email, phone, message });
      toast.success("Ticket raised successfully!");
      setTicketForm((prev) => ({ ...prev, phone: "", message: "" }));
      setShowTicketModal(false);
    } catch (error) {
      toast.error("Failed to raise ticket.");
      console.error("Error submitting ticket:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setActiveTab("dashboard");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "training-request":
        return <BookingCalendar />;
      case "Tickets":
        return <TicketRaise />;
      case "Profile":
        return <IndividualProfile />;
      default:
        return <DashboardOverview />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-medium">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-white shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            className="text-xl text-gray-700 md:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <FaBars />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            Individual Dashboard
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
        >
          <FaSignOutAlt className="inline mr-1" /> Logout
        </button>
      </div>

      {/* Drawer (Mobile) */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        direction="left"
        className="w-64 bg-white p-4"
      >
        <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
      </Drawer>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar (Desktop) */}
        <div className="hidden md:block w-64 bg-gray-50 border-r p-4">
          <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 min-h-screen">
          {/* Back Button - Only show when not on dashboard */}
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
          {renderTabContent()}
        </main>
      </div>

      {/* Floating Add Ticket Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <button
          onClick={() => setShowTicketModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
          title="Add New Ticket"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-transparent bg-opacity-10 backdrop-blur-[6px] flex items-center justify-center z-50 p-4">
          <div className="bg-gray-300 bg-opacity-30 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-700 custom-scrollbar">
            <div className="flex justify-between items-center p-5 bg-blue-900 bg-opacity-50 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">
                Raise a New Ticket
              </h3>
              <button
                onClick={() => setShowTicketModal(false)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 bg-opacity-70 text-white"
                  value={ticketForm.name}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 bg-opacity-70 text-white"
                  value={ticketForm.email}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 bg-opacity-70 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  placeholder="Your contact number"
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
                  Message *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 bg-opacity-70 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 bg-opacity-90 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
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
};

const Sidebar = ({ setActiveTab, activeTab }) => {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: FaTachometerAlt,
      color: "text-blue-600",
    },
    {
      id: "training-request",
      label: "Training Request",
      icon: FaChalkboardTeacher,
      color: "text-green-600",
    },
    {
      id: "Tickets",
      label: "Messages",
      icon: FaFileUpload,
      color: "text-orange-600",
    },
    {
      id: "Profile",
      label: "Profile",
      icon: () => <span className="text-xl">👤</span>,
      color: "text-purple-600",
    },
  ];

  return (
    <ul className="space-y-6 text-sm font-medium">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id}>
            <button
              className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? `${item.color} bg-white shadow-sm`
                  : "text-gray-700 hover:text-gray-900 hover:bg-white"
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="text-xl" />
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default IndividualDashboardPage;
