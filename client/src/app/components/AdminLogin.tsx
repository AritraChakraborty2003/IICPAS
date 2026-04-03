/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaEnvelope, FaLock, FaUser, FaUpload } from "react-icons/fa";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { toast } from "react-hot-toast";

const getApiBase = () => {
  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

  return rawBase.endsWith("/api")
    ? rawBase
    : `${rawBase.replace(/\/+$/, "")}/api`;
};

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async () => {
    if (!profileImage) {
      toast.error("Please select an image first");
      return;
    }

    setImageLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", profileImage);

      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Please login first to upload profile picture");
        return;
      }

      const response = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Profile image uploaded successfully!");
        setImagePreview(null);
        setProfileImage(null);
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error("Error uploading image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${getApiBase()}/employees/login`,
        { email, password }
      );

      const userData = response.data;
      
      // Store token and user data in localStorage
      localStorage.setItem("adminToken", userData.token);
      localStorage.setItem("adminUser", JSON.stringify(userData));
      
      toast.success("Login successful!");
      router.push("/admin-dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f4ff] via-white to-[#e8ffe8] px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <img
            src="/images/logo.png"
            alt="IICPA Logo"
            className="mx-auto h-14 mb-2"
          />
          <h2 className="text-2xl font-bold text-blue-900">Admin Login</h2>
        </div>

        {/* Profile Picture Section */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mx-auto">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser size={32} className="text-gray-500" />
              )}
            </div>
            {/* Upload Button */}
            <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
              <FaUpload size={12} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                aria-label="Upload profile picture"
                title="Upload profile picture"
              />
            </label>
          </div>
          
          {/* Upload Image Button */}
          {profileImage && (
            <div className="mt-3">
              <button
                onClick={handleImageUpload}
                disabled={imageLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {imageLoading ? "Uploading..." : "Upload Image"}
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 text-white py-2 rounded-lg hover:bg-blue-900 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Optional Links */}
        <div className="text-right mt-3">
          <a
            href="#"
            className="text-sm text-blue-600 hover:underline transition"
          >
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
}
