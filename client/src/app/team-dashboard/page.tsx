"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Drawer from "react-modern-drawer";
import axios from "axios";
import { useRouter } from "next/navigation";
import "react-modern-drawer/dist/index.css";

import {
  FaBars,
  FaSignOutAlt,
  FaBell,
  FaCalendarAlt,
  FaClipboardList,
  FaLayerGroup,
  FaHome,
  FaBook,
  FaSyncAlt,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUserShield,
  FaUsers,
  FaBriefcase,
  FaEnvelope,
  FaBlog,
  FaQuoteRight,
  FaTags,
  FaUniversity,
  FaStarOfDavid,
  FaBlogger,
  FaNewspaper,
  FaCog,
  FaChevronDown,
  FaChevronRight,
  FaEye,
  FaTasks,
  FaChartLine,
  FaFileAlt,
  FaComments,
  FaArrowLeft,
} from "react-icons/fa";

// Team-specific modules
const TEAM_MODULES = [
  { id: "dashboard", label: "Dashboard", icon: <FaHome /> },
  { id: "tasks", label: "My Tasks", icon: <FaTasks /> },
  { id: "content", label: "Content Management", icon: <FaFileAlt /> },
  { id: "courses", label: "Course Management", icon: <FaBook /> },
  { id: "students", label: "Student Management", icon: <FaUserGraduate /> },
  { id: "communications", label: "Communications", icon: <FaComments /> },
  { id: "reports", label: "Reports & Analytics", icon: <FaChartLine /> },
  { id: "calendar", label: "Calendar", icon: <FaCalendarAlt /> },
  { id: "support", label: "Support Requests", icon: <FaEnvelope /> },
];

// Content Management sub-modules
const CONTENT_SUBMODULES = [
  { id: "blogs", label: "Blogs", icon: <FaBlogger /> },
  { id: "testimonials", label: "Testimonials", icon: <FaQuoteRight /> },
  { id: "news", label: "News", icon: <FaNewspaper /> },
  { id: "about", label: "About Us", icon: <FaBook /> },
];

// Course Management sub-modules
const COURSE_SUBMODULES = [
  { id: "course-category", label: "Categories", icon: <FaLayerGroup /> },
  { id: "course", label: "Courses", icon: <FaBook /> },
  { id: "class-management", label: "Class Management", icon: <FaCalendarAlt /> },
  { id: "live-session", label: "Live Sessions", icon: <FaChalkboardTeacher /> },
  { id: "topics", label: "Training Topics", icon: <FaStarOfDavid /> },
];

function TeamDashboardContent() {
  const { user, hasPermission, canAccess, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const router = useRouter();

  // Filter modules based on user permissions
  const getAccessibleModules = () => {
    if (!user) return [];

    return TEAM_MODULES.filter((module) => {
      if (module.id === "dashboard") return true; // Always accessible
      return canAccess(module.id);
    });
  };

  const getAccessibleContentModules = () => {
    if (!user) return [];
    return CONTENT_SUBMODULES.filter((module) => canAccess(module.id));
  };

  const getAccessibleCourseModules = () => {
    if (!user) return [];
    return COURSE_SUBMODULES.filter((module) => canAccess(module.id));
  };

  const handleLogout = async () => {
    await logout();
    router.push("/team");
  };

  const handleBack = () => {
    setActiveTab("dashboard");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Team Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Welcome Card */}
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome, {user?.name}!
                </h3>
                <p className="text-gray-600 text-sm">
                  Role: {user?.role}
                </p>
                <p className="text-gray-600 text-sm">
                  Access Level: Team Member
                </p>
              </div>

              {/* Quick Stats */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Tasks:</span>
                    <span className="font-semibold text-blue-600">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Reviews:</span>
                    <span className="font-semibold text-orange-600">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Today:</span>
                    <span className="font-semibold text-green-600">8</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Course content updated
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Blog post published
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Student inquiry received
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "tasks":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Task management interface will be implemented here.</p>
            </div>
          </div>
        );

      case "content":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Content Management</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAccessibleContentModules().map((module) => (
                <div
                  key={module.id}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => setActiveTab(module.id)}
                >
                  <div className="flex items-center">
                    <div className="text-blue-600 mr-3">{module.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900">{module.label}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "courses":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Course Management</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAccessibleCourseModules().map((module) => (
                <div
                  key={module.id}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => setActiveTab(module.id)}
                >
                  <div className="flex items-center">
                    <div className="text-blue-600 mr-3">{module.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900">{module.label}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {TEAM_MODULES.find(m => m.id === activeTab)?.label || "Module"}
            </h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">
                This module is under development. Please check back later.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 mr-3"
                title="Open Menu"
              >
                <FaBars className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <FaUsers className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Team Dashboard</h1>
                  <p className="text-sm text-gray-600">IICPA Institute</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="Notifications"
              >
                <FaBell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50"
                  title="Logout"
                >
                  <FaSignOutAlt className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
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
          {renderContent()}
        </main>

        {/* Sidebar Drawer */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          direction="left"
          className="bg-white"
          size={280}
        >
          <div className="p-4">
            <div className="flex items-center mb-6">
              <FaUsers className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Team Menu</h2>
            </div>

            <nav className="space-y-2">
              {getAccessibleModules().map((module) => (
                <div key={module.id}>
                  {module.id === "content" ? (
                    <div>
                      <button
                        onClick={() => setContentOpen(!contentOpen)}
                        className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors ${
                          activeTab === module.id || activeTab.startsWith("content")
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">{module.icon}</span>
                          {module.label}
                        </div>
                        {contentOpen ? <FaChevronDown /> : <FaChevronRight />}
                      </button>
                      {contentOpen && (
                        <div className="ml-6 mt-2 space-y-1">
                          {getAccessibleContentModules().map((subModule) => (
                            <button
                              key={subModule.id}
                              onClick={() => {
                                setActiveTab(subModule.id);
                                setDrawerOpen(false);
                              }}
                              className={`w-full flex items-center p-2 rounded-md text-left text-sm transition-colors ${
                                activeTab === subModule.id
                                  ? "bg-blue-50 text-blue-600"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <span className="mr-2">{subModule.icon}</span>
                              {subModule.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : module.id === "courses" ? (
                    <div>
                      <button
                        onClick={() => setCourseOpen(!courseOpen)}
                        className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors ${
                          activeTab === module.id || activeTab.startsWith("course")
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">{module.icon}</span>
                          {module.label}
                        </div>
                        {courseOpen ? <FaChevronDown /> : <FaChevronRight />}
                      </button>
                      {courseOpen && (
                        <div className="ml-6 mt-2 space-y-1">
                          {getAccessibleCourseModules().map((subModule) => (
                            <button
                              key={subModule.id}
                              onClick={() => {
                                setActiveTab(subModule.id);
                                setDrawerOpen(false);
                              }}
                              className={`w-full flex items-center p-2 rounded-md text-left text-sm transition-colors ${
                                activeTab === subModule.id
                                  ? "bg-blue-50 text-blue-600"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <span className="mr-2">{subModule.icon}</span>
                              {subModule.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveTab(module.id);
                        setDrawerOpen(false);
                      }}
                      className={`w-full flex items-center p-3 rounded-md text-left transition-colors ${
                        activeTab === module.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="mr-3">{module.icon}</span>
                      {module.label}
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </Drawer>
      </div>
    </ProtectedRoute>
  );
}

export default TeamDashboardContent;
