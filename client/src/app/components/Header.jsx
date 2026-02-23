"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import wishlistEventManager from "../../utils/wishlistEventManager";

import {
  Menu,
  X,
  LogOut,
  ShoppingCart,
  Trash2,
  User,
  ChevronDown,
  Settings,
  BookOpen,
  Star,
} from "lucide-react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import AlertMarquee from "./AlertMarquee";
import AdmissionModal from "./AdmissionModal";

const MySwal = withReactContent(Swal);

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Courses", href: "/course" },
  {
    name: "Placement",
    children: [
      { name: "Hire from us", href: "/placements/hire" },
      { name: "Apply for job", href: "/jobs" },
    ],
  },
  {
    name: "Join Us",
    children: [
      { name: "Practical Training", href: "/training/practical" },
      { name: "College on site training", href: "/join/college" },
      { name: "Corporate on site training", href: "/placements/hire" },
      { name: "Centres", href: "/center-login" },
    ],
  },
  {
    name: "Resources",
    children: [
      { name: "Blogs", href: "/blogs" },
      { name: "Contact", href: "/contact" },
      { name: "About", href: "/about" },
      { name: "Demo Digital Hub", href: "/demo-digital-hub" },
      { name: "FAQ", href: "/faq" },
    ],
  },
  { name: "Live Session", href: "/live-session" },
];

export default function Header({ showMarquee = true, topOffset }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartDrawer, setCartDrawer] = useState(false);
  const [student, setStudent] = useState(null);
  const [cartCourses, setCartCourses] = useState([]);
  const [wishlistCourses, setWishlistCourses] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [selectedAdmissionCourse, setSelectedAdmissionCourse] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  const isDashboardPage =
    pathname.includes("-dashboard") || pathname.includes("/dashboard");
  if (isDashboardPage) return null;

  const fetchStudentAndCart = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) {
        setIsAdmin(true);
        setStudent(null);
        setCartCourses([]);
        setWishlistCourses([]);
        return;
      } else {
        setIsAdmin(false);
      }

      const res = await axios.get(`${API}/api/v1/students/isstudent`, {
        withCredentials: true,
      });
      const studentData = res.data.student;

      // Check if student data exists before proceeding
      if (!studentData) {
        setStudent(null);
        setCartCourses([]);
        setWishlistCourses([]);
        return;
      }

      setStudent(studentData);
      const cartRes = await axios.get(
        `${API}/api/v1/cart/get/${studentData._id}`,
        {
          withCredentials: true,
        }
      );
      const cartItems = cartRes.data.cart || [];

      const wishlistRes = await axios.get(
        `${API}/api/v1/students/get-wishlist/${studentData._id}`,
        { withCredentials: true }
      );
      const wishlistIDs = wishlistRes.data.wishlist || [];

      const allCourses = await axios.get(`${API}/api/courses`);
      const courseList = allCourses.data.courses || allCourses.data;

      // Process cart courses using new cart structure
      const processedCartCourses = cartItems
        .map((cartItem) => {

          // New cart API returns: { courseId, course, sessionType, quantity }
          const course = cartItem.course;
          const sessionType = cartItem.sessionType || "recorded";
          const quantity = cartItem.quantity || 1;

          if (!course) {
            return null;
          }

          // Get pricing based on session type
          let displayPrice = 0;
          if (sessionType === "recorded") {
            displayPrice =
              course.pricing?.recordedSession?.finalPrice ||
              course.pricing?.recordedSession?.price ||
              course.price ||
              0;
          } else if (sessionType === "live") {
            displayPrice =
              course.pricing?.liveSession?.finalPrice ||
              course.pricing?.liveSession?.price ||
              course.price *
                (course?.pricing?.liveSession?.priceMultiplier || 1.5) ||
              0;
          }

          const processedItem = {
            ...course,
            sessionType,
            quantity,
            price: displayPrice, // Override the price with the correct one
          };
          return processedItem;
        })
        .filter(Boolean); // Remove null entries
      setCartCourses(processedCartCourses);
      setWishlistCourses(courseList.filter((c) => wishlistIDs.includes(c._id)));
    } catch (error) {
      console.error("Error in fetchStudentAndCart:", error);
      console.error("Error response:", error.response?.data);

      // Handle 401 Unauthorized errors gracefully
      if (error.response?.status === 401) {
      }

      setStudent(null);
      setCartCourses([]);
      setWishlistCourses([]);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchStudentAndCart();
  }, []);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = (event) => {
      fetchStudentAndCart();
      if (event?.detail?.openDrawer) {
        setCartDrawer(true);
      }
    };

    const handleOpenCartDrawer = () => {
      fetchStudentAndCart();
      setCartDrawer(true);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("openCartDrawer", handleOpenCartDrawer);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("openCartDrawer", handleOpenCartDrawer);
    };
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add("drawer-open");
    } else {
      document.body.classList.remove("drawer-open");
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, [drawerOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest(".profile-dropdown")) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileDropdown]);

  const handleLogout = async () => {
    try {
      await axios.get(`${API}/api/v1/students/logout`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setStudent(null);
      setCartCourses([]);
      setWishlistCourses([]);
      setShowProfileDropdown(false);
      window.location.href = "/";
    }
  };

  const handleBuyNow = async (courseId, sessionType = "recorded") => {
    if (!student) {
      window.location.href = "/student-login";
      return;
    }
    try {
      const response = await axios.post(
        `${API}/api/v1/cart/add/${student._id}`,
        { courseId, sessionType },
        { withCredentials: true }
      );
      if (response.data.success) {
        MySwal.fire({
          title: "Added to Cart!",
          text: "Course added to cart successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchStudentAndCart();
      }
    } catch (error) {
      MySwal.fire({
        title: "Error!",
        text: "Failed to add course to cart",
        icon: "error",
      });
    }
  };

  const handleRemoveFromCart = async (courseId, sessionType = "recorded") => {
    try {
      const response = await axios.delete(
        `${API}/api/v1/cart/remove/${student._id}`,
        {
          data: { courseId, sessionType },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        MySwal.fire({
          title: "Removed!",
          text: "Course removed from cart",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchStudentAndCart();
      }
    } catch (error) {
      MySwal.fire({
        title: "Error!",
        text: "Failed to remove course from cart",
        icon: "error",
      });
    }
  };

  const handleRemoveFromWishlist = async (courseId) => {
    try {
      const response = await axios.delete(
        `${API}/api/v1/students/remove-from-wishlist/${student._id}/${courseId}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        MySwal.fire({
          title: "Removed!",
          text: "Course removed from wishlist",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchStudentAndCart();
      }
    } catch (error) {
      MySwal.fire({
        title: "Error!",
        text: "Failed to remove course from wishlist",
        icon: "error",
      });
    }
  };

  const handleAddToWishlist = async (courseId) => {
    if (!student) {
      window.location.href = "/student-login";
      return;
    }
    try {
      const response = await axios.post(
        `${API}/api/v1/students/add-to-wishlist/${student._id}`,
        { courseId },
        { withCredentials: true }
      );
      if (response.data.success) {
        MySwal.fire({
          title: "Added to Wishlist!",
          text: "Course added to wishlist successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchStudentAndCart();
      }
    } catch (error) {
      MySwal.fire({
        title: "Error!",
        text: "Failed to add course to wishlist",
        icon: "error",
      });
    }
  };

  const handleBuyNowFromCart = async () => {
    if (cartCourses.length === 0) {
      MySwal.fire({
        title: "Cart Empty!",
        text: "Add courses to cart first",
        icon: "warning",
      });
      return;
    }
    setCartDrawer(false);
    window.location.href = "/checkout";
  };

  const handleAdmissionClick = (course) => {
    setSelectedAdmissionCourse(course);
    setShowAdmissionModal(true);
  };

  const headerTop = topOffset ?? (showMarquee ? "40px" : "0px");

  return (
    <>
      {showMarquee && <AlertMarquee />}
      <header
        className="fixed left-0 w-full z-40 bg-white shadow-lg"
        style={{ top: headerTop }}
      >
        <div className="w-full px-2 md:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-sm font-bold text-[#003057] flex-shrink-0"
          >
            <img src="/images/logo.png" alt="IICPA Logo" className="h-10" />
          </Link>

          {/* Navigation - Desktop Only */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((item) =>
              item.children ? (
                <div key={item.name} className="relative group">
                  <button className="flex items-center gap-1 py-1.5 px-2 hover:text-green-600 hover:bg-green-50 rounded-md text-sm">
                    {item.name}
                    <svg
                      className="w-2.5 h-2.5 transition-transform group-hover:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div className="absolute left-0 top-full w-56 pt-2 z-50 opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all">
                    <div className="bg-white shadow-xl rounded-lg border border-gray-100 overflow-hidden">
                    {item.children.map((child) =>
                      child.isHeader ? (
                        <div
                          key={child.name}
                          className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 cursor-default"
                        >
                          {child.name}
                        </div>
                      ) : child.href ? (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-3 py-2.5 text-xs hover:bg-green-50"
                        >
                          {child.name}
                        </Link>
                      ) : (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-3 py-2.5 text-xs hover:bg-green-50"
                        >
                          {child.name}
                        </Link>
                      )
                    )}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`py-1.5 px-2 hover:text-green-600 hover:bg-green-50 rounded-md text-sm ${
                    pathname === item.href ? "text-green-600 bg-green-50" : ""
                  }`}
                >
                  {item.name}
                </Link>
              )
            )}
          </nav>

          {/* Right side - Desktop Only */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            {/* Cart Icon - Show for all users */}
            <button
              onClick={() => setCartDrawer(true)}
              className="relative p-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            >
              <ShoppingCart size={18} />
              {cartCourses.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {(() => {
                    const count = cartCourses.reduce(
                      (total, item) => total + (item.quantity || 1),
                      0
                    );
                    return count;
                  })()}
                </span>
              )}
            </button>

            {isAdmin ? (
              <Link
                href="/admin-dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                Admin Dashboard
              </Link>
            ) : student ? (
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md text-sm"
                >
                  <User size={18} />
                  <span>{student.name}</span>
                  <ChevronDown size={14} />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-lg border">
                    <Link
                      href="/student-dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-green-50"
                    >
                      <Settings size={14} />
                      Dashboard
                    </Link>
                    <Link
                      href="/student-dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-green-50"
                    >
                      <BookOpen size={14} />
                      My Courses
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Register Now
                </Link>
                <Link
                  href="/student-login"
                  className="border border-green-600 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-sm"
                >
                  Digital Hub
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-800 p-1.5 hover:bg-gray-100 rounded-md flex-shrink-0 ml-2"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        direction="right"
        className="lg:hidden mobile-drawer-overlay"
        size={280}
      >
        <div className="h-full bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <img src="/images/logo.png" alt="IICPA Logo" className="h-6" />
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-4 py-4 mobile-drawer-scroll">
            {navLinks.map((item) =>
              item.children ? (
                <div key={item.name} className="mb-2">
                  <div className="font-medium text-gray-700 py-2 px-3 bg-gray-50 rounded-md mb-1 text-sm">
                    {item.name}
                  </div>
                  <div className="ml-4 space-y-1">
                    {item.children.map((child) =>
                      child.isHeader ? (
                        <div
                          key={child.name}
                          className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 cursor-default rounded-md"
                        >
                          {child.name}
                        </div>
                      ) : child.href ? (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setDrawerOpen(false)}
                          className="mobile-nav-item block text-xs text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md py-2 px-3 w-full text-left"
                        >
                          {child.name}
                        </Link>
                      ) : (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setDrawerOpen(false)}
                          className="mobile-nav-item block text-xs text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md"
                        >
                          {child.name}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`mobile-nav-item block text-xs rounded-md mb-1 ${
                    pathname === item.href
                      ? "text-green-600 bg-green-50 font-medium"
                      : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  {item.name}
                </Link>
              )
            )}
          </div>

          {/* User Actions */}
          <div className="border-t p-4 space-y-2">
            {isAdmin ? (
              <Link
                href="/admin-dashboard"
                onClick={() => setDrawerOpen(false)}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center text-sm"
              >
                Admin Dashboard
              </Link>
            ) : student ? (
              <>
                <Link
                  href="/student-dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
                >
                  <User size={16} />
                  <span>{student.name}</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setDrawerOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md w-full text-left text-sm"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setDrawerOpen(false)}
                  className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center text-sm"
                >
                  Register Now
                </Link>
                <Link
                  href="/student-login"
                  onClick={() => setDrawerOpen(false)}
                  className="block w-full border border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-center text-sm"
                >
                  Digital Hub
                </Link>
              </>
            )}
          </div>
        </div>
      </Drawer>

      {/* Cart Drawer */}
      <Drawer
        open={cartDrawer}
        onClose={() => setCartDrawer(false)}
        direction="right"
        size={320}
      >
        <div className="h-full bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-base font-semibold">Shopping Cart</h2>
            <button
              onClick={() => setCartDrawer(false)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartCourses.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart
                  size={40}
                  className="mx-auto text-gray-400 mb-4"
                />
                <p className="text-gray-500 text-sm">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartCourses.map((course) => (
                  <div key={course._id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          course.image
                            ? course.image.startsWith("http")
                              ? course.image
                              : course.image.startsWith("/uploads/")
                              ? `${API}${course.image}`
                              : course.image.startsWith("/")
                              ? course.image
                              : `${API}/${course.image}`
                            : "/images/a1.jpeg"
                        }
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/images/a1.jpeg";
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-xs line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1">
                          {course.sessionType === "recorded"
                            ? "Recorded Session"
                            : "Live Session"}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-green-600 font-semibold text-xs">
                            ₹{course.price}
                          </p>
                          {course.quantity > 1 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              Qty: {course.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveFromCart(course._id, course.sessionType)
                        }
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartCourses.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Total:</span>
                <span className="text-green-600 font-bold text-sm">
                  ₹
                  {cartCourses.reduce(
                    (sum, course) =>
                      sum + course.price * (course.quantity || 1),
                    0
                  )}
                </span>
              </div>
              <button
                onClick={handleBuyNowFromCart}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium text-sm"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </Drawer>

      {/* Admission Modal */}
      <AdmissionModal
        isOpen={showAdmissionModal}
        onClose={() => {
          setShowAdmissionModal(false);
          setSelectedAdmissionCourse("");
        }}
        selectedCourse={selectedAdmissionCourse}
      />
    </>
  );
}
