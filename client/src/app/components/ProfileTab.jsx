"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Upload, User } from "lucide-react";
import StudentInvoicesTab from "./StudentInvoicesTab";

const studentSectionTabs = [
  { id: "profile", label: "Profile" },
  { id: "invoices", label: "Invoices" },
  { id: "courses", label: "Courses" },
  { id: "testimonial", label: "Testimonials" },
  { id: "support", label: "Tickets" },
];

const MAX_PROFILE_IMAGE_BYTES = 900 * 1024;

export default function ProfileTab({ onImageUpdated }) {
  const router = useRouter();
  const API =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api\/?$/, "") ||
    "http://localhost:8080";
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    `${API.replace(/\/+$/, "")}/api`;
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [profileCourses, setProfileCourses] = useState([]);
  const [profileTestimonials, setProfileTestimonials] = useState([]);
  const [profileTickets, setProfileTickets] = useState([]);
  const [student, setStudent] = useState({
    _id: "",
    id: "",
    name: "",
    email: "",
    phone: "",
    image: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const getStudentImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "";
    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath.replace(/^http:\/\//i, "https://");
    }
    const sanitized = imagePath.replace(/\\/g, "/").replace(/^\.\//, "");
    const normalizedPath = sanitized.startsWith("/") ? sanitized : `/${sanitized}`;
    return `${API.replace(/\/+$/, "")}${normalizedPath}`;
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });

  const loadImageElement = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = src;
    });

  const canvasToBlob = (canvas, type, quality) =>
    new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });

  const compressProfileImage = async (file) => {
    if (file.size <= MAX_PROFILE_IMAGE_BYTES) {
      return file;
    }

    const imageDataUrl = await readFileAsDataUrl(file);
    const image = await loadImageElement(imageDataUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    const maxDimension = 1200;
    const largestSide = Math.max(image.width, image.height);
    const initialScale = largestSide > maxDimension ? maxDimension / largestSide : 1;
    let width = Math.max(1, Math.floor(image.width * initialScale));
    let height = Math.max(1, Math.floor(image.height * initialScale));

    for (let scaleStep = 0; scaleStep < 6; scaleStep += 1) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (let quality = 0.9; quality >= 0.4; quality -= 0.1) {
        const blob = await canvasToBlob(canvas, "image/jpeg", quality);
        if (blob && blob.size <= MAX_PROFILE_IMAGE_BYTES) {
          const baseName = file.name.replace(/\.[^.]+$/, "");
          return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }

      width = Math.max(1, Math.floor(width * 0.82));
      height = Math.max(1, Math.floor(height * 0.82));
    }

    throw new Error("Image is too large. Please choose a smaller file.");
  };

  // Fetch student data on mount
  useEffect(() => {
    const fetchProfileCourses = async (studentId) => {
      try {
        const response = await axios.get(
          `${API}/api/courses/student-courses/${studentId}`,
          {
            withCredentials: true,
          }
        );

        const courses = Array.isArray(response.data?.courses)
          ? response.data.courses
          : Array.isArray(response.data)
          ? response.data
          : [];

        setProfileCourses(courses);
      } catch (error) {
        setProfileCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    const fetchProfileTestimonials = async () => {
      try {
        const response = await axios.get(`${API_BASE}/testimonials/student`, {
          withCredentials: true,
        });
        const testimonials = Array.isArray(response.data) ? response.data : [];
        setProfileTestimonials(testimonials);
      } catch (error) {
        setProfileTestimonials([]);
      } finally {
        setTestimonialsLoading(false);
      }
    };

    const fetchProfileTickets = async () => {
      try {
        const response = await axios.get(`${API_BASE}/tickets`, {
          withCredentials: true,
        });
        const tickets = Array.isArray(response.data) ? response.data : [];
        setProfileTickets(tickets);
      } catch (error) {
        setProfileTickets([]);
      } finally {
        setTicketsLoading(false);
      }
    };

    const fetchStudent = async () => {
      try {
        const res = await axios.get(
          `${API}/api/v1/students/isstudent`,
          { withCredentials: true }
        );

        console.log(res);
        const currentStudent = res.data.student;
        setStudent({
          _id: currentStudent._id || "",
          id: currentStudent.id || "",
          name: currentStudent.name,
          email: currentStudent.email,
          phone: currentStudent.phone || "",
          image: currentStudent.image || "",
        });
        if (currentStudent?._id) {
          fetchProfileCourses(currentStudent._id);
        } else {
          setCoursesLoading(false);
          setProfileCourses([]);
        }
        fetchProfileTestimonials();
        fetchProfileTickets();
      } catch (err) {
        console.error("Auth check failed:", err);
        setCoursesLoading(false);
        setTestimonialsLoading(false);
        setTicketsLoading(false);
        router.push("/student-login");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [API, API_BASE, router]);

  const handleLogout = async () => {
    try {
      await axios.get(
        `${API}/api/v1/students/logout`,
        {
          withCredentials: true,
        }
      );
      router.push("/student-login");
    } catch (err) {
      console.error("Logout error", err);
      alert("Logout failed");
    }
  };

  // Handle image change
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be 5MB or less");
        return;
      }
      try {
        setError("");
        const optimizedFile = await compressProfileImage(file);
        setProfileImage(optimizedFile);
        const preview = await readFileAsDataUrl(optimizedFile);
        setImagePreview(preview);
      } catch (compressionError) {
        setError(compressionError.message || "Unable to process selected image");
      }
    }
  };

  // Handle profile image upload
  const handleImageUpload = async () => {
    if (!profileImage) {
      setError("Please select an image first");
      return;
    }

    setImageLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("profileImage", profileImage);

      const uploadUrl = "/api/student/profile-image";
      let responseData = null;
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      for (const method of ["post"]) {
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            const axiosRes = await axios({
              method,
              url: uploadUrl,
              data: formData,
              withCredentials: true,
              timeout: 30000,
              headers: { Accept: "application/json" },
            });
            responseData = axiosRes?.data;
            break;
          } catch (axiosErr) {
            const status = axiosErr?.response?.status;
            const isNetworkError = !axiosErr?.response;

            if (isNetworkError && attempt < 3) {
              await delay(300 * attempt);
              continue;
            }

            throw axiosErr;
          }
        }

        if (responseData) break;
      }

      if (responseData?.student?.image) {
        setStudent((prev) => ({ ...prev, image: responseData.student.image }));
        if (typeof onImageUpdated === "function") {
          onImageUpdated(responseData.student.image);
        }
        setImagePreview(null);
        setProfileImage(null);
        setMessage("Profile image updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(responseData?.message || "Profile image updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Image upload error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      const statusCode = err.response?.status;
      if (statusCode === 413) {
        setError("Failed to upload image: File too large for server limit. Please choose a smaller image.");
        return;
      }
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Upload failed";
      const isNetworkError =
        err.code === "ERR_NETWORK" ||
        String(serverMessage).toLowerCase().includes("failed to fetch") ||
        String(serverMessage).toLowerCase().includes("network error");
      setError(
        isNetworkError
          ? "Failed to upload image: Network request failed. Check API URL/CORS/HTTPS configuration."
          : `Failed to upload image: ${serverMessage}`
      );
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  const renderSimpleList = (loadingState, items, getLabel) => {
    if (loadingState) {
      return <p className="text-sm text-gray-500">Loading...</p>;
    }

    if (!Array.isArray(items) || items.length === 0) {
      return <p className="text-sm text-gray-500">No results found</p>;
    }

    return (
      <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
        {items.map((item, index) => (
          <li key={item?._id || `item-${index}`}>{getLabel(item, index)}</li>
        ))}
      </ol>
    );
  };

  const renderRightContent = () => {
    switch (activeSection) {
      case "invoices":
        return <StudentInvoicesTab />;
      case "courses":
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Courses</h4>
            {renderSimpleList(coursesLoading, profileCourses, (course) => course?.title || "Untitled Course")}
          </div>
        );
      case "testimonial":
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Testimonials</h4>
            {renderSimpleList(
              testimonialsLoading,
              profileTestimonials,
              (testimonial) =>
                testimonial?.message?.trim() || testimonial?.name || "Testimonial"
            )}
          </div>
        );
      case "support":
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Tickets</h4>
            {renderSimpleList(
              ticketsLoading,
              profileTickets,
              (ticket) =>
                ticket?.message?.trim() || `${ticket?.name || "Ticket"} (${ticket?.email || "No email"})`
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Profile Information
              </h3>
              <p className="text-sm text-blue-600">
                Your profile information is managed by the system. Only your
                profile image can be changed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Full Name
                </label>
                <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                  {student.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Email Address
                </label>
                <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                  {student.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Phone Number
                </label>
                <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                  {student.phone || "Not provided"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Student ID
                </label>
                <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                  {student.id || "Not available"}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                Need to update your information?
              </h4>
              <p className="text-sm text-yellow-700">
                Contact the administration team to update your name, email, or
                phone number.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen lg:flex-row gap-6 px-6 pt-4 pb-10 font-sans">
      {/* Left Sidebar */}
      <div className="w-full lg:w-1/4 bg-white border rounded-xl shadow-md p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : student.image ? (
                <img
                  src={getStudentImageUrl(student.image)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-gray-500" />
              )}
            </div>
            {/* Upload Button */}
            <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
              <Upload size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Image Button */}
          {profileImage && (
            <div className="w-full">
              <button
                onClick={handleImageUpload}
                disabled={imageLoading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {imageLoading ? "Uploading..." : "Upload Image"}
              </button>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="w-full p-2 bg-green-100 text-green-800 text-sm rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="w-full p-2 bg-red-100 text-red-800 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-blue-700">{student.name}</h2>
            <p className="text-sm text-gray-700">{student.email}</p>
            <p className="text-sm text-gray-800 font-semibold">
              {student.phone}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-600 mt-4 border px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Right Content */}
      <div className="w-full lg:w-3/4 bg-white rounded-xl shadow-md">
        <div className="p-6">
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-2 overflow-x-auto pb-3">
              {studentSectionTabs.map((tab) => {
                const isCurrent = tab.id === activeSection;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (!isCurrent) {
                        setActiveSection(tab.id);
                      }
                    }}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {renderRightContent()}
        </div>
      </div>
    </div>
  );
}
