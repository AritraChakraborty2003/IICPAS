"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";

import {
  FaBars,
  FaSignOutAlt,
  FaBell,
  FaCalendarAlt,
  FaClipboardList,
  FaBook,
  FaUserGraduate,
  FaChartBar,
  FaCog,
  FaUser,
} from "react-icons/fa";

// Import dashboard components
import TeacherProfileTab from "./TeacherProfileTab";
import TeacherCoursesTab from "./TeacherCoursesTab";
import TeacherStudentsTab from "./TeacherStudentsTab";
import TeacherAssignmentsTab from "./TeacherAssignmentsTab";
import TeacherAnalyticsTab from "./TeacherAnalyticsTab";
import TeacherCalendarTab from "./TeacherCalendarTab";
import TeacherSettingsTab from "./TeacherSettingsTab";
import { useAuthHeartbeat } from "../../lib/useAuthHeartbeat";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const tabs = [
  { id: "profile", label: "Profile", icon: <FaUser /> },
  { id: "courses", label: "My Courses", icon: <FaBook /> },
  { id: "students", label: "Students", icon: <FaUserGraduate /> },
  { id: "assignments", label: "Assignments", icon: <FaClipboardList /> },
  { id: "analytics", label: "Analytics", icon: <FaChartBar /> },
  { id: "calendar", label: "Calendar", icon: <FaCalendarAlt /> },
  { id: "settings", label: "Settings", icon: <FaCog /> },
];

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  qualification: string;
  bio: string;
  courses: string[];
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useAuthHeartbeat({
    enabled: !!teacher,
    heartbeatUrl: `${API_BASE}/api/auth/heartbeat`,
  });

  const fetchTeacherProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/teachers/profile`, {
        withCredentials: true,
      });
      setTeacher(response.data.teacher);
    } catch (err) {
      console.error("Error fetching teacher profile:", err);
      router.push("/teacher-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTeacherProfile();
  }, [fetchTeacherProfile]);

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE}/api/v1/teachers/logout`,
        {},
        { withCredentials: true }
      );
    } finally {
      router.push("/teacher-login");
    }
  };

  // SIDEBAR: scrollable, hidden scrollbar
  const renderSidebar = (isMobile = false) => (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="h-20 mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-600">IICPAS</span>
        </div>
        {teacher && (
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">
                {teacher.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {teacher.name}
            </h3>
            <p className="text-gray-600 text-xs">{teacher.specialization}</p>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (isMobile) setDrawerOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-2 rounded-md w-full text-left mb-1 transition-all ${
              activeTab === tab.id
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "hover:bg-gray-100 text-gray-800"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar - Desktop: fixed height, scrollable, hidden scrollbar */}
      <aside className="hidden lg:block w-70 min-h-screen bg-blue-200 border-r-1 border-blue-400 rounded-[1vmin] custom-scrollbar overflow-y-auto">
        {renderSidebar()}
      </aside>

      {/* Topbar - Right: Bell & Logout */}
      <div className="fixed top-4 right-4 z-50 flex gap-4 items-center">
        <div className="relative">
          <FaBell className="text-xl text-gray-700" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
            2
          </span>
        </div>
        <button
          onClick={logout}
          className="bg-red-100 text-red-600 px-3 py-1 rounded-md hover:bg-red-200 text-sm flex items-center gap-2"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>

      {/* Topbar - Left: Drawer for Mobile */}
      <div className="fixed top-4 left-4 lg:hidden z-50">
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-white p-2 shadow rounded-md"
        >
          <FaBars />
        </button>
      </div>

      {/* Drawer - Mobile Sidebar: scrollable, hidden scrollbar */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        direction="left"
        className="bg-white w-64 h-full custom-scrollbar"
      >
        <div className="h-full">{renderSidebar(true)}</div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-100 mt-4"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </Drawer>

      {/* Main Content: scrolls independently of sidebar */}
      <main className="flex-1 min-h-screen p-6 pt-20 overflow-y-auto custom-scrollbar">
        {activeTab === "profile" ? (
          <TeacherProfileTab teacher={teacher} onUpdate={fetchTeacherProfile} />
        ) : activeTab === "courses" ? (
          <TeacherCoursesTab teacher={teacher} />
        ) : activeTab === "students" ? (
          <TeacherStudentsTab teacher={teacher} />
        ) : activeTab === "assignments" ? (
          <TeacherAssignmentsTab teacher={teacher} />
        ) : activeTab === "analytics" ? (
          <TeacherAnalyticsTab teacher={teacher} />
        ) : activeTab === "calendar" ? (
          <TeacherCalendarTab teacher={teacher} />
        ) : activeTab === "settings" ? (
          <TeacherSettingsTab teacher={teacher} />
        ) : null}
      </main>
    </div>
  );
}
