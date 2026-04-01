"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaQuoteLeft,
  FaUser,
  FaBriefcase,
  FaImage,
  FaCheck,
  FaTimes,
  FaStar,
} from "react-icons/fa";
import StarRating from "./StarRating";

export default function TestimonialTab({ student }) {
  const [testimonials, setTestimonials] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    name: student?.name || "",
    designation: "",
    message: "",
    rating: 5,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (student?.name) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name?.trim() ? prev.name : student.name,
      }));
    }
  }, [student]);

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(`${API_BASE}/testimonials/student`, {
        withCredentials: true,
      });
      const studentTestimonials = Array.isArray(response.data)
        ? response.data
        : [];
      setTestimonials(studentTestimonials);
      if (!studentTestimonials.length) {
        setShowForm(true);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to fetch testimonials");
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({
      ...prev,
      rating: rating,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.designation.trim() ||
      !formData.message.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("designation", formData.designation);
      submitData.append("message", formData.message);
      submitData.append("rating", formData.rating);

      if (formData.image) {
        submitData.append("image", formData.image);
      }

      await axios.post(`${API_BASE}/testimonials/submit`, submitData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        "Testimonial submitted successfully! It will be reviewed by admin."
      );
      setFormData({
        name: student?.name || "",
        designation: "",
        message: "",
        rating: 5,
        image: null,
      });
      setImagePreview(null);
      setShowForm(false);
      fetchTestimonials();
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      toast.error("Failed to submit testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: student?.name || "",
      designation: "",
      message: "",
      rating: 5,
      image: null,
    });
    setImagePreview(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaQuoteLeft className="text-2xl" />
              <div>
                <h2 className="text-2xl font-bold">Share Your Experience</h2>
                <p className="text-blue-100">
                  Help others by sharing your learning journey
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {showForm ? "Cancel" : "Write Testimonial"}
            </button>
          </div>
        </div>

        {/* Testimonial Form */}
        {showForm && (
          <div className="p-6 border-b">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaUser className="inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaBriefcase className="inline mr-2" />
                    Designation/Position *
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="e.g., Student, Software Engineer, Manager"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaQuoteLeft className="inline mr-2" />
                  Your Experience *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Share your experience with IICPA Institute. How has it helped you in your career or learning journey?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaStar className="inline mr-2" />
                  Rate Your Experience *
                </label>
                <div className="flex items-center space-x-2">
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={handleRatingChange}
                    interactive={true}
                    size="text-xl"
                  />
                  <span className="text-sm text-gray-600 ml-2">
                    ({formData.rating} out of 5 stars)
                  </span>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaImage className="inline mr-2" />
                  Profile Photo (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-full mb-4"
                          onError={(e) => {
                            e.target.src = "/images/placeholder.jpg";
                          }}
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FaImage className="text-2xl text-gray-400" />
                        </div>
                        <p className="text-gray-600 mb-2">
                          Click to upload photo
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, JPEG up to 5MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>Submit Testimonial</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Testimonials */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            My Testimonials
          </h3>

          {testimonials.length === 0 ? (
            <div className="text-center py-12">
              <FaQuoteLeft className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No results found</p>
              <p className="text-gray-400 text-sm">
                Share your experience to help others!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial._id}
                  className={`border rounded-lg p-4 ${
                    testimonial.status
                      ? "border-green-200 bg-green-50"
                      : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {testimonial.image ? (
                        <img
                          src={`${API_BASE.replace("/api", "")}/${
                            testimonial.image
                          }`}
                          alt={testimonial.name}
                          className="w-12 h-12 object-cover rounded-full"
                          onError={(e) => {
                            e.target.src = "/images/placeholder.jpg";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 font-semibold">
                            {testimonial.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {testimonial.designation}
                          </p>
                          {/* Star Rating Display */}
                          <div className="mt-1">
                            <StarRating
                              rating={testimonial.rating || 5}
                              interactive={false}
                              size="text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {testimonial.status ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheck className="mr-1" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <FaTimes className="mr-1" />
                              Pending Review
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 italic">
                        "{testimonial.message}"
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted on{" "}
                        {new Date(testimonial.createdAt).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(testimonial.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-t p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FaQuoteLeft className="text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">How it works</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Submit your testimonial using the form above</li>
                <li>• Our admin team will review your submission</li>
                <li>
                  • Once approved, your testimonial will appear on our website
                </li>
                <li>• You can track the status of your submissions here</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
