"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { FaStar, FaTrash, FaShoppingCart, FaHeart } from "react-icons/fa";
import Swal from "sweetalert2";
import wishlistEventManager from "../../utils/wishlistEventManager";

interface Course {
  _id: string;
  title: string;
  image: string;
  price: number;
  description?: string;
  category?: string;
  level?: string;
  rating?: number;
  reviews?: number;
}

interface Student {
  _id: string;
  name?: string;
  email?: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [wishlistCourses, setWishlistCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/v1/students/isstudent`, {
        withCredentials: true,
      });
      const studentData = res.data.student;
      setStudent(studentData);

      // Fetch wishlist
      const wishlistRes = await axios.get(
        `${API}/api/v1/students/get-wishlist/${studentData._id}`,
        { withCredentials: true }
      );
      const wishlistIDs = wishlistRes.data.wishlist || [];

      const allCourses = await axios.get(`${API}/api/courses?lite=true`);
      const courseList = allCourses.data.courses || allCourses.data;

      const filteredWishlistCourses = courseList.filter((c: Course) =>
        wishlistIDs.includes(c._id)
      );

      setWishlistCourses(filteredWishlistCourses);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setStudent(null);
      setWishlistCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (courseId: string) => {
    const result = await Swal.fire({
      title: "Remove from Wishlist?",
      text: "Are you sure you want to remove this course from your wishlist?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.post(
          `${API}/api/v1/students/remove-wishlist/${student?._id}`,
          { courseId },
          { withCredentials: true }
        );
        fetchWishlist();

        // Notify other components of the change
        if (student) {
          wishlistEventManager.notifyChange(student._id, courseId, "removed");
        }

        Swal.fire("Removed!", "Course removed from wishlist.", "success");
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        Swal.fire("Error", "Failed to remove item.", "error");
      }
    }
  };

  const handleAddToCart = async (courseId: string) => {
    if (!student) {
      Swal.fire(
        "Login Required",
        "Please login to add items to cart.",
        "warning"
      );
      return;
    }

    try {
      await axios.post(
        `${API}/api/v1/students/add-to-cart/${student?._id}`,
        { courseId, sessionType: "recorded" },
        { withCredentials: true }
      );
      Swal.fire("Added!", "Course added to cart.", "success");
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      Swal.fire("Error", "Failed to add to cart.", "error");
    }
  };

  const handleBuyNow = async (course: Course) => {
    if (!student) {
      Swal.fire(
        "Login Required",
        "Please login to proceed with payment.",
        "warning"
      );
      return;
    }

    try {
      // Create payment record
      const response = await axios.post(
        `${API}/api/v1/payments/create`,
        {
          courseId: course._id,
          amount: course.price,
        },
        { withCredentials: true }
      );

      Swal.fire({
        title: "Payment Record Created",
        text: "Please complete UPI payment and upload screenshot for verification.",
        icon: "success",
        confirmButtonText: "Go to Course",
      }).then(() => {
        const courseId = course.title.toLowerCase().replace(/\s+/g, "-");
        router.push(`/course/${courseId}`);
      });
    } catch (error) {
      console.error("Payment error:", error);
      Swal.fire(
        "Payment Failed",
        "Something went wrong while creating payment record.",
        "error"
      );
    }
  };

  const handleClearWishlist = async () => {
    const result = await Swal.fire({
      title: "Clear entire wishlist?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API}/api/v1/students/clear-wishlist/${student?._id}`,
          {
            withCredentials: true,
          }
        );
        fetchWishlist();
        Swal.fire("Cleared!", "Your wishlist has been emptied.", "success");
      } catch (error) {
        console.error("Error clearing wishlist:", error);
        Swal.fire("Error", "Failed to clear wishlist.", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            {/* Star Icon */}
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg
                className="w-12 h-12 text-blue-600"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                <path
                  d="M17 11h-2v-2h2v2zm0 4h-2v-2h2v2zm-4-4h-2v-2h2v2zm0 4h-2v-2h2v2z"
                  fill="white"
                />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              My Wishlist
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Login to view and manage your favorite courses
            </p>

            {/* Login Button */}
            <button
              onClick={() => router.push("/student-login?redirect=wishlist")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition-colors text-lg font-semibold mb-8"
            >
              Login to Continue
            </button>

            {/* Demo Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Demo Student Credentials:
              </h3>
              <div className="text-sm text-blue-700 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                    student@test.com
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Password:</span>
                  <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                    test123
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-4">
                (If demo doesn't work, please register a new account)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Wishlist
            </h1>
            <p className="text-gray-600">
              {wishlistCourses.length}{" "}
              {wishlistCourses.length === 1 ? "course" : "courses"} in your
              wishlist
            </p>
          </div>

          {wishlistCourses.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <FaTrash />
              Clear All
            </button>
          )}
        </div>

        {/* Wishlist Content */}
        {wishlistCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaHeart className="text-4xl text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Start adding courses to your wishlist!
            </p>
            <button
              onClick={() => router.push("/course")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistCourses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
              >
                {/* Course Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={
                      course.image?.startsWith("http")
                        ? course.image
                        : `${API}${course.image}`
                    }
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Remove from Wishlist Button */}
                  <button
                    onClick={() => handleRemoveFromWishlist(course._id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Remove from Wishlist"
                  >
                    <FaHeart className="text-red-500 text-sm" />
                  </button>
                </div>

                {/* Course Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  {course.category && (
                    <p className="text-sm text-blue-600 mb-2">
                      {course.category}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-green-600">
                      ₹{course.price?.toLocaleString()}
                    </span>

                    {course.rating && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <FaStar className="text-sm" />
                        <span className="text-sm font-medium">
                          {course.rating}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(course._id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FaShoppingCart />
                      Add to Cart
                    </button>

                    <button
                      onClick={() => handleBuyNow(course)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
