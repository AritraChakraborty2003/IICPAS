"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Video, Clock, User, Play, CheckCircle } from "lucide-react";
import axios from "axios";
import { getBlogSlug } from "../../lib/blogSlug";

interface LiveClass {
  _id: string;
  title: string;
  subtitle?: string;
  instructor: string;
  instructorBio?: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  duration: number;
  maxParticipants: number;
  enrolledCount?: number;
  status: "upcoming" | "live" | "completed" | "active" | "inactive";
  meetingLink?: string;
  thumbnail?: string;
  imageUrl?: string;
  price: number;
  category: string;
  isEnrolled?: boolean;
}

interface User {
  _id: string;
  name?: string;
  email?: string;
}

export default function LiveClassesDisplay() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "upcoming" | "live" | "completed"
  >("upcoming");
  const [user, setUser] = useState<User | null>(null);
  const [blogs, setBlogs] = useState<any[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const getUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/v1/students/isstudent`, {
        withCredentials: true,
      });
      if (response.data?.student) {
        setUser(response.data.student);
        return response.data.student;
      }
      return null;
    } catch (error) {
      console.log("Not logged in or not a student");
      setUser(null);
      return null;
    }
  }, [API]);

  useEffect(() => {
    const fetchData = async () => {
      await getUser();

      try {
        const [liveSessionsResponse, blogsResponse] = await Promise.all([
          fetch(`${API}/api/live-sessions`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch(`${API}/api/blogs`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
        ]);

        if (liveSessionsResponse.ok) {
          const data = await liveSessionsResponse.json();

          const transformedClasses = data.map((session: any) => ({
            _id: session._id,
            title: session.title,
            subtitle: session.subtitle || session.category,
            instructor: session.instructor || "CA Instructor",
            instructorBio: session.instructorBio || "Expert CA Instructor",
            description: session.description || "Live class session",
            startTime: session.time ? session.time.split(" - ")[0] : "10:00",
            endTime: session.time ? session.time.split(" - ")[1] : "12:00",
            date: session.date,
            duration: session.duration || 120,
            maxParticipants: session.maxParticipants || 50,
            enrolledCount: session.enrolledCount || 0,
            status: session.status,
            meetingLink: session.link,
            thumbnail: session.thumbnail || "/images/live-class.jpg",
            imageUrl:
              session.imageUrl || session.thumbnail || "/images/live-class.jpg",
            price: session.price || 0,
            category: session.category || "CA Foundation",
            isEnrolled: user
              ? session.enrolledStudents?.some(
                  (student: any) => student._id === user._id
                )
              : false,
          }));

          setLiveClasses(transformedClasses);
        }

        // Handle blogs response
        if (blogsResponse.ok) {
          const blogsData = await blogsResponse.json();
          // Filter only active blogs
          const activeBlogs = blogsData.filter(
            (blog: any) => blog.status === "active"
          );
          setBlogs(activeBlogs);
        } else {
          console.error(
            "Blogs API request failed with status:",
            blogsResponse.status
          );
          setBlogs([]);
        }

        if (!liveSessionsResponse.ok) {
          console.error(
            "Live sessions API request failed with status:",
            liveSessionsResponse.status
          );
          setLiveClasses([
            {
              _id: "1",
              title: "GST Updates & Compliance",
              instructor: "CA Rajesh Kumar",
              description: "Learn about the latest GST updates",
              startTime: "11:00 AM",
              endTime: "12:00 PM",
              date: "2025-01-15T00:00:00.000Z",
              duration: 60,
              maxParticipants: 50,
              enrolledCount: 0,
              status: "upcoming",
              price: 1500,
              category: "Taxation",
              isEnrolled: false,
            },
            {
              _id: "2",
              title: "TDS Computation Masterclass",
              instructor: "CA Priya Sharma",
              description: "Master TDS computation with practical examples",
              startTime: "2:00 PM",
              endTime: "3:30 PM",
              date: "2025-01-20T00:00:00.000Z",
              duration: 90,
              maxParticipants: 40,
              enrolledCount: 0,
              status: "upcoming",
              price: 2000,
              category: "Taxation",
              isEnrolled: false,
            },
          ]);
        }
      } catch (error: any) {
        console.error("Error fetching live classes:", error);
        setLiveClasses([
          {
            _id: "1",
            title: "Sample Live Session",
            instructor: "CA Expert",
            description: "Interactive live session",
            startTime: "10:00 AM",
            endTime: "11:00 AM",
            date: "2025-01-15T00:00:00.000Z",
            duration: 60,
            maxParticipants: 50,
            enrolledCount: 0,
            status: "upcoming",
            price: 1500,
            category: "General",
            isEnrolled: false,
          },
        ]);
      }
    };

    fetchData();
  }, [API, getUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Time TBD";
    const [hour, minute] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-100 text-red-800 border-red-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        );
      case "upcoming":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "active":
        return <Play className="w-4 h-4" />;
      default:
        return <AlertOctagon className="w-4 h-4" />;
    }
  };

  const filteredClasses = liveClasses.filter((session) => {
    if (selectedTab === "upcoming") {
      return session.status === "upcoming" || session.status === "active";
    }
    return session.status === selectedTab;
  });

  return (
    <div className="py-8 px-4">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto mb-8">
        {(["upcoming", "live", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedTab === tab
                ? "bg-white text-[#3cd664] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1 text-xs">
              (
              {
                liveClasses.filter((s) => {
                  if (tab === "upcoming")
                    return s.status === "upcoming" || s.status === "active";
                  return s.status === tab;
                }).length
              }
              )
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
        {filteredClasses.map((session) => (
          <motion.div
            key={session._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex justify-between items-start mb-3">
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                  session.status
                )}`}
              >
                {getStatusIcon(session.status)}
                <span>
                  {session.status.charAt(0).toUpperCase() +
                    session.status.slice(1)}
                </span>
              </div>

              {session.price > 0 && (
                <span className="bg-[#3cd664] text-white px-2 py-1 rounded-md text-sm font-semibold">
                  ₹{session.price.toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                  {session.title}
                </h3>
              </div>

              {session.instructor && (
                <div className="flex items-center">
                  <User className="w-3 h-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-600">
                    {session.instructor}
                  </span>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-600">
                  {formatDate(session.date)}
                </div>
                <div className="text-xs font-medium text-gray-700">
                  {formatTime(session.startTime)} -{" "}
                  {formatTime(session.endTime)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <div>
                  {session.enrolledCount || 0}/{session.maxParticipants}{" "}
                  enrolled
                </div>
                <div>{session.duration || 120}min</div>
              </div>

              {session.category && (
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                    {session.category}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <button className="w-full bg-[#3cd664] text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-[#33bb58] transition-colors duration-200 flex items-center justify-center space-x-1">
                  {session.status === "live" ? (
                    <>
                      <Video className="w-3 h-3" />
                      <span>Join Session</span>
                    </>
                  ) : session.isEnrolled ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>Enrolled</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Enroll Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-500 flex items-center justify-center space-x-2 mt-6">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled</span>
      </div>

      {/* Moving Blogs Carousel Section */}
      {blogs.length > 0 && (
        <section className="py-20 bg-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Latest Blog Posts
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Stay updated with our latest insights and knowledge
              </p>
            </motion.div>

            {/* Moving Cards Container */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-8">
              <motion.div
                className="flex gap-8"
                animate={{
                  x: [0, -100 * Math.min(blogs.length, 10)],
                }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  width: `${Math.min(blogs.length, 10) * 360}px`,
                }}
              >
                {/* Duplicate cards for seamless loop */}
                {[...blogs.slice(0, 10), ...blogs.slice(0, 10)].map(
                  (blog, index) => {
                    // Generate fallback image based on blog title or use default
                    const getFallbackImage = (title: string) => {
                      const images = [
                        "/images/accounting.webp",
                        "/images/course.png",
                        "/images/live-class.jpg",
                        "/images/student.png",
                        "/images/university.png",
                        "/images/vr-student.jpg",
                      ];
                      const hash = title.split("").reduce((a, b) => {
                        a = (a << 5) - a + b.charCodeAt(0);
                        return a & a;
                      }, 0);
                      return images[Math.abs(hash) % images.length];
                    };

                    const imageUrl = blog.imageUrl?.startsWith("http")
                      ? blog.imageUrl
                      : blog.imageUrl
                      ? `${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:8080"
                        }${
                          blog.imageUrl.startsWith("/")
                            ? blog.imageUrl
                            : "/" + blog.imageUrl
                        }`
                      : getFallbackImage(blog.title);

                    return (
                      <motion.div
                        key={`${blog._id}-${index}`}
                        className="flex-shrink-0 w-80 bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105"
                        whileHover={{ y: -8 }}
                        onClick={() => {
                          const blogSlug = getBlogSlug(blog);
                          window.location.href = blogSlug
                            ? `/blogs/${blogSlug}`
                            : "/blogs";
                        }}
                      >
                        <div className="h-56 overflow-hidden rounded-t-3xl">
                          <img
                            src={imageUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-8">
                          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                            <span>📝</span>
                            <span>{blog.category || "General"}</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 mb-3">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            {blog.createdAt
                              ? new Date(blog.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "Recent"}
                          </p>
                          <div className="flex items-center text-green-600 text-sm font-semibold">
                            <span>Read More</span>
                            <motion.svg
                              className="w-5 h-5 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </motion.svg>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </motion.div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
