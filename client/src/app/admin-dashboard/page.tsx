"use client";
import { getApiOrigin } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AlertsTab from "./AlertsTab";
import JobsAdminPanel from "./JobsAdminPanel";
import TestimonialAdmin from "./Course/TestimonialAdmin";
import NewsTab from "./NewsTab";
import StaffManagementTab from "./StaffManagementTab";
import EnquiriesTab from "./LeadsTab";
import Drawer from "react-modern-drawer";
import ManageMetaTags from "./Course/ManageMetaTags";
import BlogComponent from "./BlogComponent";
import CollegeTab from "./CollegeTab";
import CalendarTab from "./CalendarTab";
import AboutUsTab from "./AboutUsTab";
import AboutUsSectionTab from "./AboutUsSectionTab";
import ContactTab from "./ContactTab";
import FooterTab from "./FooterTab";
import YellowStatsStripTab from "./YellowStatsStripTab";
import NewsletterSectionTab from "./NewsletterSectionTab";
import NewsletterSubscriptionsTab from "./NewsletterSubscriptionsTab";
import HeroTab from "./HeroTab";
import WhyIICPATab from "./WhyIICPATab";
import StudentsTab from "./StudentsTab";
import PaymentsTab from "./PaymentsTab";
import { useRouter } from "next/navigation";
import "react-modern-drawer/dist/index.css";
import TopicsManager from "./Topic/TopicsManager";
import GuidesTab from "./GuidesTab";
import KitsTab from "./KitsTab";
import SpecialOffersTab from "./SpecialOffers/SpecialOffersTab";

import {
  FaBars,
  FaSignOutAlt,
  FaBell,
  FaCalendarAlt,
  FaLayerGroup,
  FaHome,
  FaBook,
  FaSyncAlt,
  FaUserGraduate,
  FaUsers,
  FaBriefcase,
  FaEnvelope,
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
  FaFileAlt,
  FaBoxes,
  FaCreditCard,
  FaShieldAlt,
  FaStar,
  FaChartBar,
  FaMapMarkerAlt,
  FaList,
  FaUserTie,
  FaArrowLeft,
  FaComments,
  FaUser,
  FaRobot,
  FaVolumeUp,
  FaChevronLeft,
  FaClipboardList,
  FaGraduationCap,
  FaCoins,
  FaFileInvoiceDollar,
  FaGift,
} from "react-icons/fa";
import CompanyTab from "./CompanyTab";
import CourseArea from "./CourseBuilder";
import ChapterScheduleTab from "./Course/ChapterScheduleTab";
import TopicScheduleTab from "./Course/TopicScheduleTab";
import CourseCategory from "./Course/CourseCategory";
import LiveSessionAdmin from "./Course/LiveSesionAdmin";
import TicketTab from "../components/TicketTab";
import RevisionTestsTab from "./RevisionTestsTab";
import CourseDisplayTab from "./CourseDisplayTab";
import IPLogsTab from "./IPLogsTab";
import IPWhitelistTab from "./IPWhitelistTab";
import DemoDigitalHubTab from "./DemoDigitalHubTab";
import FAQTab from "./FAQTab";
import CourseRatingApprovalTab from "./CourseRatingApprovalTab";
import MessagesTab from "./MessagesTab";
import BulkEmailTab from "./BulkEmailTab";
import ContactInfoTab from "./ContactInfoTab";
import AdminProfileTab from "./AdminProfileTab";
import ChatConversationsTab from "./ChatConversationsTab";
import ChatbotSettingsTab from "./ChatbotSettingsTab";
import QuizSoundSettingsTab from "./QuizSoundSettingsTab";
import PrivacyPolicyTab from "./PrivacyPolicyTab";
import EditPrivacyPolicyTab from "./EditPrivacyPolicyTab";
import RefundPolicyTab from "./RefundPolicyTab";
import EditRefundPolicyTab from "./EditRefundPolicyTab";
import TermsOfServiceTab from "./TermsOfServiceTab";
import EditTermsOfServiceTab from "./EditTermsOfServiceTab";
import TermsAndConditionsTab from "./TermsAndConditionsTab";
import EditTermsAndConditionsTab from "./EditTermsAndConditionsTab";
import CookiePolicyTab from "./CookiePolicyTab";
import EditCookiePolicyTab from "./EditCookiePolicyTab";
import ConfidentialityPolicyTab from "./ConfidentialityPolicyTab";
import DisclaimerPolicyTab from "./DisclaimerPolicyTab";
import IICPAReviewTab from "./IICPAReviewTab";
import EditConfidentialityPolicyTab from "./EditConfidentialityPolicyTab";
import EditDisclaimerPolicyTab from "./EditDisclaimerPolicyTab";
import EditIICPAReviewTab from "./EditIICPAReviewTab";
import TransactionsTab from "./TransactionsTab";
import IndividualRequestsTab from "./IndividualRequestsTab";
import AdmissionManagementTab from "./AdmissionManagementTab";
import UniversityCourseManagementTab from "./UniversityCourseManagementTab";
import CoinsTab from "./CoinsTab";
import BookingSettingsTab from "./BookingSettingsTab";
import AdminBookingsTab from "./AdminBookingsTab";
import InvoiceCompanySettingsTab from "./InvoiceCompanySettingsTab";
import QuotationTab from "./QuotationTab";
import LoginAccessControlTab from "./LoginAccessControlTab";
import JobSidebarMarqueeTab from "./JobSidebarMarqueeTab";
import LiveBookingsTab from "./LiveBookingsTab";
import OurPartnersTab from "./OurPartnersTab";
import ReferralCodeSettingsTab from "./ReferralCodeSettingsTab";

// All available modules with their permissions (unused - replaced by NAVIGATION_GROUPS)
/*
const ALL_MODULES = [
  { id: "course-category", label: "Course Category", icon: <FaBook /> },
  { id: "course", label: "Course", icon: <FaLayerGroup /> },
  { id: "course-display", label: "Course Display", icon: <FaEye /> },
  { id: "live-session", label: "Live Session", icon: <FaCalendarAlt /> },
  {
    id: "newsletter-subscriptions",
    label: "Newsletter Subscriptions",
    icon: <FaEnvelope />,
  },
  { id: "enquiries", label: "Enquiries", icon: <FaEnvelope /> },
  { id: "messages", label: "Messages", icon: <FaComments /> },
  {
    id: "chat-conversations",
    label: "Chatbot Conversations",
    icon: <FaComments />,
  },
  { id: "chatbot-settings", label: "Chatbot Settings", icon: <FaRobot /> },
  { id: "privacy-policy", label: "Privacy Policy", icon: <FaShieldAlt /> },
  { id: "refund-policy", label: "Refund Policy", icon: <FaShieldAlt /> },
  { id: "terms-of-service", label: "Terms of Service", icon: <FaShieldAlt /> },
  {
    id: "terms-and-conditions",
    label: "Terms & Conditions",
    icon: <FaShieldAlt />,
  },
  { id: "cookie-policy", label: "Cookie Policy", icon: <FaShieldAlt /> },
  {
    id: "confidentiality-policy",
    label: "Confidentiality Policy",
    icon: <FaShieldAlt />,
  },
  {
    id: "disclaimer-policy",
    label: "Disclaimer Policy",
    icon: <FaShieldAlt />,
  },
  { id: "iicpa-review", label: "IICPA Review", icon: <FaShieldAlt /> },
  { id: "jobs", label: "Jobs", icon: <FaBriefcase /> },
  { id: "news", label: "News", icon: <FaNewspaper /> },
  { id: "students", label: "Students", icon: <FaUserGraduate /> },
  { id: "payments", label: "Payments", icon: <FaCreditCard /> },
  { id: "transactions", label: "Transactions", icon: <FaCreditCard /> },
  { id: "staff", label: "Staff Management", icon: <FaUsers /> },
  { id: "companies", label: "Companies", icon: <FaStarOfDavid /> },
  { id: "colleges", label: "Colleges", icon: <FaUniversity /> },
  { id: "calendar", label: "Calendar", icon: <FaCalendarAlt /> },
  { id: "team", label: "Our Team", icon: <FaUsers /> },
  { id: "topics", label: "Training Topics", icon: <FaBook /> },
  { id: "guides", label: "Guides & Resources", icon: <FaFileAlt /> },
  { id: "kits", label: "Kit Stock", icon: <FaBoxes /> },
  { id: "revision-tests", label: "Revision Tests", icon: <FaSyncAlt /> },
  { id: "support", label: "Support Requests", icon: <FaEnvelope /> },
  { id: "audit", label: "IP Logs", icon: <FaShieldAlt /> },
  { id: "course-ratings", label: "Course Rating Approval", icon: <FaStar /> },
  {
    id: "center-location",
    label: "Center Locations",
    icon: <FaMapMarkerAlt />,
  },
  {
    id: "special-offers",
    label: "Special Offers",
    icon: <FaStar />,
  },
];
*/

// Website Settings modules (unused - replaced by NAVIGATION_GROUPS)
/*
const WEBSITE_SETTINGS_MODULES = [
  { id: "hero", label: "Hero Section", icon: <FaHome /> },
  { id: "why-iicpa", label: "WhyIICPA Section", icon: <FaStar /> },
  { id: "about-us", label: "About Us Section", icon: <FaBook /> },
  {
    id: "about-us-section",
    label: "About Us Section Management",
    icon: <FaUserTie />,
  },
  { id: "contact", label: "Contact Section", icon: <FaEnvelope /> },
  {
    id: "contact-info",
    label: "Contact Information",
    icon: <FaMapMarkerAlt />,
  },
  { id: "footer", label: "Footer Section", icon: <FaList /> },
  {
    id: "yellow-stats-strip",
    label: "Stats Strip Section",
    icon: <FaChartBar />,
  },
  {
    id: "newsletter-section",
    label: "Newsletter Section",
    icon: <FaEnvelope />,
  },
  { id: "blogs", label: "Blogs", icon: <FaBlogger /> },
  { id: "testimonials", label: "Testimonials", icon: <FaQuoteRight /> },
  { id: "meta", label: "Manage Metatags", icon: <FaTags /> },
  { id: "alert", label: "Alert", icon: <FaBell /> },
  { id: "ip-whitelist", label: "IP Whitelisting", icon: <FaShieldAlt /> },
  { id: "demo-digital-hub", label: "Demo Digital Hub", icon: <FaBook /> },
  { id: "faq", label: "FAQ", icon: <FaUserTie /> },
  { id: "bulk-email", label: "Bulk Email", icon: <FaEnvelope /> },
];
*/

// Grouped navigation structure
const NAVIGATION_GROUPS = [
  {
    id: "course-management",
    label: "Course Management",
    icon: <FaBook />,
    items: [
      {
        id: "course-category",
        label: "Course Category",
        icon: <FaLayerGroup />,
      },
      { id: "course", label: "Course", icon: <FaBook /> },
      { id: "course-display", label: "Course Display", icon: <FaEye /> },
      {
        id: "chapter-schedule",
        label: "Chapter Schedule",
        icon: <FaCalendarAlt />,
      },
      {
        id: "topic-schedule",
        label: "Topic Schedule",
        icon: <FaCalendarAlt />,
      },
      { id: "topics", label: "Training Topics", icon: <FaBook /> },
      { id: "guides", label: "Guides & Resources", icon: <FaFileAlt /> },
      { id: "kits", label: "Kit Stock", icon: <FaBoxes /> },
      {
        id: "course-ratings",
        label: "Course Rating Approval",
        icon: <FaStar />,
      },
      { id: "revision-tests", label: "Revision Tests", icon: <FaSyncAlt /> },
      {
        id: "quiz-sound-settings",
        label: "Quiz Sound Settings",
        icon: <FaVolumeUp />,
      },
    ],
  },
  {
    id: "session-management",
    label: "Session Management",
    icon: <FaCalendarAlt />,
    items: [
      { id: "live-session", label: "Live Session", icon: <FaCalendarAlt /> },
      {
        id: "live-bookings",
        label: "Live Bookings",
        icon: <FaClipboardList />,
      },
      { id: "calendar", label: "Calendar", icon: <FaCalendarAlt /> },
    ],
  },
  {
    id: "user-management",
    label: "User Management",
    icon: <FaUsers />,
    items: [
      { id: "students", label: "Students", icon: <FaUserGraduate /> },
      { id: "staff", label: "Staff Management", icon: <FaUsers /> },
      { id: "colleges", label: "Colleges", icon: <FaUniversity /> },
      { id: "companies", label: "Companies", icon: <FaStarOfDavid /> },
      { id: "team", label: "Our Team", icon: <FaUsers /> },
      {
        id: "individual-requests",
        label: "Individual Requests",
        icon: <FaUser />,
      },
      {
        id: "jobs-post-management",
        label: "Jobs Post Management",
        icon: <FaBriefcase />,
      },
    ],
  },
  {
    id: "content-management",
    label: "Content Management",
    icon: <FaFileAlt />,
    items: [
      { id: "blogs", label: "Blogs", icon: <FaBlogger /> },
      { id: "testimonials", label: "Testimonials", icon: <FaQuoteRight /> },
      { id: "faq", label: "FAQ", icon: <FaUserTie /> },
      { id: "about-us", label: "About Us Section", icon: <FaBook /> },
      { id: "our-partners", label: "Our Partners", icon: <FaUsers /> },
      {
        id: "about-us-section",
        label: "About Us Section Management",
        icon: <FaUserTie />,
      },
      { id: "why-iicpa", label: "WhyIICPA Section", icon: <FaStar /> },
    ],
  },
  {
    id: "website-settings",
    label: "Website Settings",
    icon: <FaCog />,
    items: [
      { id: "hero", label: "Hero Section", icon: <FaHome /> },
      { id: "contact", label: "Contact Section", icon: <FaEnvelope /> },
      {
        id: "contact-info",
        label: "Contact Information",
        icon: <FaMapMarkerAlt />,
      },
      { id: "footer", label: "Footer Section", icon: <FaList /> },
      {
        id: "yellow-stats-strip",
        label: "Stats Strip Section",
        icon: <FaChartBar />,
      },
      {
        id: "newsletter-section",
        label: "Newsletter Section",
        icon: <FaEnvelope />,
      },
      { id: "alert", label: "Alert", icon: <FaBell /> },
      { id: "demo-digital-hub", label: "Demo Digital Hub", icon: <FaBook /> },
      {
        id: "center-location",
        label: "Center Locations",
        icon: <FaMapMarkerAlt />,
      },
      {
        id: "job-sidebar-marquee",
        label: "Jobs Sidebar Marquee",
        icon: <FaBriefcase />,
      },
      {
        id: "referral-code-settings",
        label: "Referral Code",
        icon: <FaGift />,
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: <FaEnvelope />,
    items: [
      { id: "enquiries", label: "Enquiries", icon: <FaEnvelope /> },
      { id: "messages", label: "Messages", icon: <FaComments /> },
      { id: "bulk-email", label: "Bulk Email", icon: <FaEnvelope /> },
      {
        id: "newsletter-subscriptions",
        label: "Newsletter Subscriptions",
        icon: <FaEnvelope />,
      },
      {
        id: "chat-conversations",
        label: "Chat Conversations",
        icon: <FaComments />,
      },
      { id: "chatbot-settings", label: "Chatbot Settings", icon: <FaRobot /> },
    ],
  },
  {
    id: "system-management",
    label: "System Management",
    icon: <FaShieldAlt />,
    items: [
      { id: "payments", label: "Payments", icon: <FaCreditCard /> },
      { id: "transactions", label: "Transactions", icon: <FaCreditCard /> },
      { id: "coins", label: "Coins", icon: <FaCoins /> },
      {
        id: "invoice-company-settings",
        label: "Invoice Company Settings",
        icon: <FaFileAlt />,
      },
      {
        id: "quotation",
        label: "Quotation Studio",
        icon: <FaFileInvoiceDollar />,
      },
      { id: "tickets", label: "Tickets", icon: <FaComments /> },
      { id: "audit", label: "IP Logs", icon: <FaShieldAlt /> },
      { id: "ip-whitelist", label: "IP Whitelisting", icon: <FaShieldAlt /> },
      { id: "meta", label: "Manage Metatags", icon: <FaTags /> },
      { id: "special-offers", label: "Special Offers", icon: <FaStar /> },
      { id: "support", label: "Support Requests", icon: <FaEnvelope /> },
      {
        id: "master-login-access",
        label: "Master Login Access",
        icon: <FaShieldAlt />,
      },
    ],
  },
  {
    id: "admission-management",
    label: "Admission Management",
    icon: <FaUserGraduate />,
    items: [
      {
        id: "admission-leads",
        label: "Admission Leads",
        icon: <FaClipboardList />,
      },
      {
        id: "university-course-management",
        label: "University Course Management",
        icon: <FaGraduationCap />,
      },
    ],
  },
  {
    id: "booking-operations",
    label: "Booking Operations",
    icon: <FaCreditCard />,
    items: [
      {
        id: "booking-settings",
        label: "Booking Settings",
        icon: <FaCog />,
      },
      {
        id: "bookings",
        label: "Bookings",
        icon: <FaClipboardList />,
      },
    ],
  },
];

function AdminDashboardContent() {
  const { user, canAccess, logout, isPrivilegedAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      "course-management": true,
      "session-management": false,
      "user-management": false,
      "content-management": false,
      "website-settings": false,
      communication: false,
      "system-management": false,
      "admission-management": false,
      "booking-operations": false,
    }
  );
  const router = useRouter();

  // Set default active tab to first accessible module only if no tab is selected
  useEffect(() => {
    if (activeTab === "") {
      // Find the first accessible item from the first expanded group
      const firstExpandedGroup = NAVIGATION_GROUPS.find(
        (group) => expandedGroups[group.id]
      );
      if (firstExpandedGroup) {
        const firstAccessibleItem = firstExpandedGroup.items.find((item) => {
          if (!user) return false;
          if (isPrivilegedAdmin(user)) return true;
          return canAccess(item.id);
        });
        if (firstAccessibleItem) {
          setActiveTab(firstAccessibleItem.id);
        }
      }
    }
  }, [activeTab, user, expandedGroups, canAccess]);

  const handleLogout = async () => {
    await logout();
    router.push("/admin");
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    setActiveTab("");
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // SIDEBAR: scrollable, hidden scrollbar
  const renderSidebar = (isMobile = false) => (
    <div className="h-full flex flex-col">
      <div className={`p-6 pb-4 ${!isMobile ? "relative" : ""}`}>
        {/* Collapse/Expand Button - Desktop Only */}
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-4 right-2 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors z-10"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <FaChevronRight className="text-gray-600 text-sm" />
            ) : (
              <FaChevronLeft className="text-gray-600 text-sm" />
            )}
          </button>
        )}

        <div
          className={`flex items-center justify-center mb-6 ${
            sidebarCollapsed && !isMobile ? "px-2" : ""
          }`}
        >
          <div className="bg-white p-3 rounded-lg shadow-lg">
            <img
              src="/images/logo.png"
              alt="IICPA Institute"
              className={`${
                sidebarCollapsed && !isMobile ? "h-8 w-8" : "h-12 w-auto"
              } object-contain`}
            />
          </div>
        </div>

        {/* User Info */}
        {(!sidebarCollapsed || isMobile) && (
          <div
            className="text-center mb-4 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => {
              setActiveTab("profile");
              if (isMobile) setDrawerOpen(false);
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                {user?.image ? (
                  <img
                    src={`${
                      getApiOrigin()
                    }${user.image}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const sibling = target.nextElementSibling as HTMLElement;
                      if (sibling) sibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    user?.image ? "hidden" : ""
                  }`}
                >
                  <FaUser size={16} className="text-white" />
                </div>
              </div>
              <div className="text-left">
                <p className="font-semibold text-blue-800">{user?.name}</p>
                <p className="text-sm text-blue-600">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 custom-scrollbar">
        {/* Grouped Navigation */}
        {NAVIGATION_GROUPS.map((group) => {
          // Filter group items based on user permissions
          const accessibleGroupItems = group.items.filter((item) => {
            if (!user) return false;
            if (isPrivilegedAdmin(user)) return true;
            return canAccess(item.id);
          });

          // Skip group if no accessible items
          if (accessibleGroupItems.length === 0) return null;

          const isGroupExpanded = expandedGroups[group.id];
          const hasActiveItem = accessibleGroupItems.some(
            (item) => activeTab === item.id
          );

          return (
            <div key={group.id} className="mb-2">
              {/* Group Header */}
              <button
                onClick={() => {
                  if (!isMobile) toggleGroup(group.id);
                  if (isMobile) {
                    setActiveTab(group.items[0].id);
                    setDrawerOpen(false);
                  }
                }}
                className={`flex items-center ${
                  sidebarCollapsed && !isMobile
                    ? "justify-center px-2"
                    : "justify-between gap-3 px-4"
                } py-3 rounded-lg w-full text-left transition-all duration-200 ${
                  hasActiveItem
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md"
                    : "hover:bg-blue-50 text-gray-700 hover:text-blue-700"
                }`}
                title={sidebarCollapsed && !isMobile ? group.label : ""}
              >
                <div
                  className={`flex items-center ${
                    sidebarCollapsed && !isMobile ? "" : "gap-3"
                  }`}
                >
                  <span
                    className={`text-lg ${
                      hasActiveItem ? "text-white" : "text-blue-500"
                    }`}
                  >
                    {group.icon}
                  </span>
                  {(!sidebarCollapsed || isMobile) && (
                    <span className="font-medium">{group.label}</span>
                  )}
                </div>
                {(!sidebarCollapsed || isMobile) && (
                  <span
                    className={`text-sm transition-transform duration-200 ${
                      hasActiveItem ? "text-white" : "text-blue-500"
                    }`}
                  >
                    {isGroupExpanded ? <FaChevronDown /> : <FaChevronRight />}
                  </span>
                )}
              </button>

              {/* Group Items */}
              {(!sidebarCollapsed || isMobile) && isGroupExpanded && (
                <div className="ml-6 mt-2 space-y-1">
                  {accessibleGroupItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (isMobile) setDrawerOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-200 ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold shadow-md"
                          : "hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          activeTab === item.id ? "text-white" : "text-blue-400"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="bg-gray-50 admin-dashboard" data-admin-dashboard>
      {/* Sidebar - Desktop: fixed position, scrollable, hidden scrollbar */}
      <aside
        className={`hidden lg:block ${
          sidebarCollapsed ? "w-20" : "w-70"
        } h-screen fixed left-0 top-0 bg-gradient-to-b from-blue-100 to-blue-200 border-r border-blue-300 rounded-r-2xl shadow-xl overflow-y-auto custom-scrollbar z-50 transition-all duration-300`}
      >
        {renderSidebar()}
      </aside>

      {/* Topbar - Right: Bell & Logout */}
      <div className="fixed top-4 right-4 z-50 flex gap-4 items-center">
        <div className="relative">
          <div className="bg-white p-2 rounded-full shadow-md">
            <FaBell className="text-xl text-gray-700" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
              3
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 text-sm flex items-center gap-2 font-medium shadow-md transition-all duration-200"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>

      {/* Topbar - Left: Drawer for Mobile */}
      <div className="fixed top-4 left-4 lg:hidden z-50">
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-white p-3 shadow-lg rounded-lg hover:bg-gray-50 transition-colors"
          title="Open menu"
        >
          <FaBars className="text-gray-700" />
        </button>
      </div>

      {/* Drawer - Mobile Sidebar: scrollable, hidden scrollbar */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        direction="left"
        className="bg-gradient-to-b from-blue-100 to-blue-200 w-64 h-full custom-scrollbar"
      >
        <div className="h-full">{renderSidebar(true)}</div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 mt-4 mx-3 mb-3 rounded-lg transition-colors"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </Drawer>

      {/* Main Content: scrolls independently of sidebar */}
      <main
        className={`min-h-screen p-6 pt-8 overflow-y-auto relative transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-70"
        }`}
      >
        {/* Back Button - Only show when not on dashboard home */}
        {activeTab !== "" && (
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2 font-medium shadow-md transition-all duration-200 border border-gray-200"
            >
              <FaArrowLeft className="text-sm" />
              Back
            </button>
          </div>
        )}

        {/* Permission-based content rendering */}
        {activeTab === "live-session" ? (
          <LiveSessionAdmin />
        ) : activeTab === "live-bookings" ? (
          <LiveBookingsTab />
        ) : activeTab === "enquiries" ? (
          <EnquiriesTab />
        ) : activeTab === "support" ? (
          <TicketTab viewerType="admin" />
        ) : activeTab === "calendar" ? (
          <CalendarTab />
        ) : activeTab === "companies" ? (
          <CompanyTab />
        ) : activeTab === "meta" ? (
          <ManageMetaTags />
        ) : activeTab === "hero" ? (
          <HeroTab />
        ) : activeTab === "why-iicpa" ? (
          <WhyIICPATab />
        ) : activeTab === "about-us" ? (
          <AboutUsTab />
        ) : activeTab === "about-us-section" ? (
          <AboutUsSectionTab />
        ) : activeTab === "contact" ? (
          <ContactTab />
        ) : activeTab === "footer" ? (
          <FooterTab />
        ) : activeTab === "yellow-stats-strip" ? (
          <YellowStatsStripTab />
        ) : activeTab === "newsletter-section" ? (
          <NewsletterSectionTab />
        ) : activeTab === "newsletter-subscriptions" ? (
          <NewsletterSubscriptionsTab />
        ) : activeTab === "colleges" ? (
          <CollegeTab />
        ) : activeTab === "blogs" ? (
          <BlogComponent />
        ) : activeTab === "course-category" ? (
          <CourseCategory />
        ) : activeTab === "students" ? (
          <StudentsTab />
        ) : activeTab === "payments" ? (
          <PaymentsTab />
        ) : activeTab === "transactions" ? (
          <TransactionsTab />
        ) : activeTab === "coins" ? (
          <CoinsTab />
        ) : activeTab === "invoice-company-settings" ? (
          <InvoiceCompanySettingsTab />
        ) : activeTab === "quotation" ? (
          <QuotationTab />
        ) : activeTab === "job-sidebar-marquee" ? (
          <JobSidebarMarqueeTab />
        ) : activeTab === "referral-code-settings" ? (
          <ReferralCodeSettingsTab />
        ) : activeTab === "our-partners" ? (
          <OurPartnersTab />
        ) : activeTab === "booking-settings" ? (
          <BookingSettingsTab />
        ) : activeTab === "bookings" ? (
          <AdminBookingsTab />
        ) : activeTab === "jobs" ? (
          <JobsAdminPanel />
        ) : activeTab === "jobs-post-management" ? (
          <JobsAdminPanel />
        ) : activeTab === "staff" ? (
          <StaffManagementTab />
        ) : activeTab === "team" ? (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Our Team</h2>
            <p className="text-gray-600">
              Team management view is not wired in this dashboard yet. You can
              grant and manage access for this module from Staff Management.
            </p>
          </div>
        ) : activeTab === "alert" ? (
          <AlertsTab />
        ) : activeTab === "ip-whitelist" ? (
          <IPWhitelistTab />
        ) : activeTab === "demo-digital-hub" ? (
          <DemoDigitalHubTab />
        ) : activeTab === "faq" ? (
          <FAQTab />
        ) : activeTab === "news" ? (
          <NewsTab />
        ) : activeTab === "testimonials" ? (
          <TestimonialAdmin />
        ) : activeTab === "course" ? (
          <CourseArea />
        ) : activeTab === "course-display" ? (
          <CourseDisplayTab />
        ) : activeTab === "chapter-schedule" ? (
          <ChapterScheduleTab onBack={handleBack} />
        ) : activeTab === "topic-schedule" ? (
          <TopicScheduleTab onBack={handleBack} />
        ) : activeTab === "revision-tests" ? (
          <RevisionTestsTab />
        ) : activeTab === "topics" ? (
          <TopicsManager />
        ) : activeTab === "guides" ? (
          <GuidesTab />
        ) : activeTab === "kits" ? (
          <KitsTab />
        ) : activeTab === "audit" ? (
          <IPLogsTab />
        ) : activeTab === "course-ratings" ? (
          <CourseRatingApprovalTab />
        ) : activeTab === "center-location" ? (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              Center Location Management
            </h2>
            <p className="text-gray-600">
              Center location management functionality will be implemented here.
            </p>
          </div>
        ) : activeTab === "special-offers" ? (
          <SpecialOffersTab onBack={handleBack} />
        ) : activeTab === "messages" ? (
          <MessagesTab />
        ) : activeTab === "chat-conversations" ? (
          <ChatConversationsTab />
        ) : activeTab === "chatbot-settings" ? (
          <ChatbotSettingsTab />
        ) : activeTab === "quiz-sound-settings" ? (
          <QuizSoundSettingsTab />
        ) : activeTab === "privacy-policy" ? (
          <PrivacyPolicyTab
            onEditPolicy={(policyId) =>
              setActiveTab(`edit-privacy-policy-${policyId}`)
            }
          />
        ) : activeTab.startsWith("edit-privacy-policy") ? (
          <EditPrivacyPolicyTab
            onBack={() => setActiveTab("privacy-policy")}
            policyId={activeTab.replace("edit-privacy-policy-", "")}
          />
        ) : activeTab === "refund-policy" ? (
          <RefundPolicyTab
            onEditPolicy={(policyId) =>
              setActiveTab(`edit-refund-policy-${policyId}`)
            }
          />
        ) : activeTab.startsWith("edit-refund-policy") ? (
          <EditRefundPolicyTab
            onBack={() => setActiveTab("refund-policy")}
            policyId={activeTab.replace("edit-refund-policy-", "")}
          />
        ) : activeTab === "terms-of-service" ? (
          <TermsOfServiceTab
            onEditPolicy={(policyId) =>
              setActiveTab(`edit-terms-of-service-${policyId}`)
            }
          />
        ) : activeTab.startsWith("edit-terms-of-service") ? (
          <EditTermsOfServiceTab
            onBack={() => setActiveTab("terms-of-service")}
            policyId={activeTab.replace("edit-terms-of-service-", "")}
          />
        ) : activeTab === "terms-and-conditions" ? (
          <TermsAndConditionsTab
            onEditPolicy={(policyId) =>
              setActiveTab(`edit-terms-and-conditions-${policyId}`)
            }
          />
        ) : activeTab.startsWith("edit-terms-and-conditions") ? (
          <EditTermsAndConditionsTab
            onBack={() => setActiveTab("terms-and-conditions")}
            policyId={activeTab.replace("edit-terms-and-conditions-", "")}
          />
        ) : activeTab === "cookie-policy" ? (
          <CookiePolicyTab
            onEditPolicy={(policyId) =>
              setActiveTab(`edit-cookie-policy-${policyId}`)
            }
          />
        ) : activeTab.startsWith("edit-cookie-policy") ? (
          <EditCookiePolicyTab
            onBack={() => setActiveTab("cookie-policy")}
            policyId={activeTab.replace("edit-cookie-policy-", "")}
          />
        ) : activeTab === "confidentiality-policy" ? (
          <ConfidentialityPolicyTab
            onEditPolicy={(policyId) =>
              setActiveTab(`edit-confidentiality-policy-${policyId}`)
            }
          />
        ) : activeTab.startsWith("edit-confidentiality-policy") ? (
          <EditConfidentialityPolicyTab
            onBack={() => setActiveTab("confidentiality-policy")}
            policyId={activeTab.replace("edit-confidentiality-policy-", "")}
          />
        ) : activeTab === "disclaimer-policy" ? (
          <DisclaimerPolicyTab
            onEditPolicy={(policyId) =>
              setActiveTab(`edit-disclaimer-policy-${policyId}`)
            }
          />
        ) : activeTab.startsWith("edit-disclaimer-policy") ? (
          <EditDisclaimerPolicyTab
            onBack={() => setActiveTab("disclaimer-policy")}
            policyId={activeTab.replace("edit-disclaimer-policy-", "")}
          />
        ) : activeTab === "iicpa-review" ? (
          <IICPAReviewTab
            onEditReview={(reviewId) =>
              setActiveTab(`edit-iicpa-review-${reviewId}`)
            }
          />
        ) : activeTab.startsWith("edit-iicpa-review") ? (
          <EditIICPAReviewTab
            onBack={() => setActiveTab("iicpa-review")}
            reviewId={activeTab.replace("edit-iicpa-review-", "")}
          />
        ) : activeTab === "bulk-email" ? (
          <BulkEmailTab />
        ) : activeTab === "contact-info" ? (
          <ContactInfoTab />
        ) : activeTab === "profile" ? (
          <AdminProfileTab />
        ) : activeTab === "individual-requests" ? (
          <IndividualRequestsTab />
        ) : activeTab === "master-login-access" ? (
          <LoginAccessControlTab />
        ) : activeTab === "admission-leads" ? (
          <AdmissionManagementTab />
        ) : activeTab === "university-course-management" ? (
          <UniversityCourseManagementTab />
        ) : activeTab === "" ? (
          <div>
            {/* Welcome Message */}
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">
                Welcome to Admin Dashboard
              </h2>
              <p className="text-gray-500">
                Please select a module from the sidebar to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-600 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-500">
              You don&apos;t have permission to access this module.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Wrap the dashboard with ProtectedRoute
export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
