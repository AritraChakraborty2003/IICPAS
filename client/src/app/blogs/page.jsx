"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  User,
  ArrowRight,
  Eye,
  Clock,
  Tag,
  BookOpen,
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Star,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BlogsSidebar from "../components/BlogsSidebar";
import { getBlogSlug } from "../../lib/blogSlug";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [blogsPerPage] = useState(15);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await axios.get(`${API_BASE}/blogs`);
        // Filter only blogs that have status === "active"
        const activeBlogs = (res.data || []).filter(
          (blog) => blog.status === "active"
        );
        setBlogs(activeBlogs);
        setFilteredBlogs(activeBlogs);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setBlogs([]);
        setFilteredBlogs([]);
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  // Filter blogs based on search term and category
  useEffect(() => {
    let filtered = blogs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (blog) =>
          blog.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredBlogs(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, selectedCategory, blogs]);

  // Get unique categories
  const categories = [
    "all",
    ...new Set(blogs.map((blog) => blog.category).filter(Boolean)),
  ];

  // Get paginated blogs
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);

  // Calculate total pages
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blogs...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        {/* Enhanced Hero Section */}
        <section className="relative pt-24 pb-8 sm:pt-28 sm:pb-12 md:pt-32 md:pb-16 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-green-100/30 to-blue-100/30 rounded-full blur-3xl"
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-green-100/30 rounded-full blur-3xl"
              animate={{
                y: [0, 20, 0],
                x: [0, -10, 0],
                scale: [1, 0.9, 1],
              }}
              transition={{
                duration: 10,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                ease: "linear",
                repeat: Infinity,
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Our{" "}
              <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 bg-clip-text text-transparent">
                Knowledge Hub
              </span>
            </motion.h1>

            <motion.p
              className="text-sm lg:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Discover insights, trends, and inspiration from our expert team
            </motion.p>

            {/* Advanced Search and Filter Controls */}
            <motion.div
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* Search Bar */}
              <div className="relative mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search articles, authors, or topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  {searchTerm && (
                    <motion.button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      ×
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl px-4 py-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        viewMode === "grid"
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-white/80 backdrop-blur-md text-gray-500 border border-gray-200 hover:bg-white"
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        viewMode === "list"
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-white/80 backdrop-blur-md text-gray-500 border border-gray-200 hover:bg-white"
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600 bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200">
                  Showing {currentBlogs.length} of {filteredBlogs.length}{" "}
                  articles
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Blog Grid Section */}
        <section className="relative pt-8 pb-20 bg-white overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6">
            {/* Layout with Sidebar */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="lg:sticky lg:top-24">
                  <BlogsSidebar
                    blogs={blogs}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {filteredBlogs.length === 0 ? (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {searchTerm || selectedCategory !== "all"
                        ? "No Results Found"
                        : "No Blogs Yet"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || selectedCategory !== "all"
                        ? "Try adjusting your search term or category filter"
                        : "Check back soon for amazing content!"}
                    </p>
                    {(searchTerm || selectedCategory !== "all") && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                        }}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg"
                      >
                        Clear Filters
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <div
                    className={`${
                      viewMode === "grid"
                        ? "grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
                        : "space-y-2"
                    }`}
                  >
                    {currentBlogs.map((blog, index) => {
                      // Generate fallback image based on blog title or use default
                      const getFallbackImage = (title) => {
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
                      const blogSlug = getBlogSlug(blog);
                      const blogHref = blogSlug ? `/blogs/${blogSlug}` : "/blogs";

                      return viewMode === "grid" ? (
                        <motion.div
                          key={blog._id}
                          className="group relative bg-white rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden transform-gpu hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.05,
                          }}
                          whileHover={{
                            scale: 1.01,
                          }}
                        >
                          {/* Glassmorphism Background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-xl" />

                          {/* Image Container with Advanced Effects */}
                          <motion.div
                            className="relative overflow-hidden h-40"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <img
                              src={imageUrl}
                              alt={blog.title}
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                              onError={(e) => {
                                e.target.src = getFallbackImage(blog.title);
                              }}
                            />

                            {/* Multi-layer Gradient Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Floating Date Badge */}
                            <motion.div
                              className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-gray-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 shadow-lg border border-white/20"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Calendar size={16} className="text-green-500" />
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
                            </motion.div>

                            {/* Category Badge */}
                            <motion.div
                              className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 shadow-lg"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Tag size={14} />
                              <span>{blog.category || "General"}</span>
                            </motion.div>

                            {/* Reading Time Badge */}
                            <motion.div
                              className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1"
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: 0.1 + index * 0.05,
                              }}
                            >
                              <Clock size={14} />
                              <span>
                                {Math.ceil(blog.content.length / 500)} min read
                              </span>
                            </motion.div>

                            {/* Interactive Read More Overlay */}
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500"
                              initial={{ scale: 0.5, rotate: -180 }}
                              whileHover={{ scale: 1, rotate: 0 }}
                            >
                              <motion.div
                                className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/30"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <BookOpen
                                  size={32}
                                  className="text-green-500 mx-auto"
                                />
                                <p className="text-sm font-semibold text-gray-800 mt-2">
                                  Read Article
                                </p>
                              </motion.div>
                            </motion.div>
                          </motion.div>

                          {/* Enhanced Content Container */}
                          <div className="relative p-3 flex flex-col justify-between flex-1 min-h-[160px]">
                            {/* Blog Meta */}
                            <motion.div
                              className="mb-2"
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.4,
                                delay: 0.1 + index * 0.05,
                              }}
                            >
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <div className="inline-flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {blog.createdAt
                                      ? new Date(
                                          blog.createdAt
                                        ).toLocaleDateString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "Recent"}
                                  </span>
                                </div>
                                <div className="inline-flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {Math.ceil(blog.content.length / 500)} min
                                    read
                                  </span>
                                </div>
                              </div>
                            </motion.div>

                            {/* Enhanced Title */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.4,
                                delay: 0.15 + index * 0.05,
                              }}
                            >
                              <Link
                                href={blogHref}
                                className="text-base font-bold leading-tight mb-1 text-gray-900 hover:text-transparent hover:bg-gradient-to-r hover:from-green-600 hover:to-blue-600 hover:bg-clip-text transition-all duration-300 group-hover:underline decoration-2 underline-offset-4 line-clamp-2"
                              >
                                {blog.title}
                              </Link>
                            </motion.div>

                            {/* Enhanced Content Preview */}
                            <motion.p
                              className="text-gray-600 text-xs leading-relaxed mb-2 flex-1 line-clamp-2"
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.4,
                                delay: 0.2 + index * 0.05,
                              }}
                            >
                              {blog.content
                                .replace(/<[^>]+>/g, "")
                                .slice(0, 100)}
                              {blog.content.length > 100 && "..."}
                            </motion.p>

                            {/* Enhanced Read More Button */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.4,
                                delay: 0.25 + index * 0.05,
                              }}
                            >
                              <Link
                                href={blogHref}
                                className="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                              >
                                <span>Read Article →</span>
                              </Link>
                            </motion.div>
                          </div>

                          {/* Decorative Elements */}
                          <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-gradient-to-tr from-blue-400/20 to-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                      ) : (
                        // List View Mode
                        <motion.div
                          key={blog._id}
                          className="group relative bg-white rounded-xl shadow-md border border-gray-100/50 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.03,
                          }}
                        >
                          <div className="flex flex-col md:flex-row">
                            {/* Image Container for List View */}
                            <div className="relative md:w-60 h-40 md:h-full overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={blog.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  e.target.src = getFallbackImage(blog.title);
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              {/* Date Badge */}
                              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-semibold px-3 py-1 rounded-xl">
                                <Calendar className="inline w-3 h-3 mr-1" />
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
                              </div>

                              {/* Category Badge */}
                              <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-xl">
                                <Tag className="inline w-3 h-3 mr-1" />
                                {blog.category || "General"}
                              </div>
                            </div>

                            {/* Content Container for List View */}
                            <div className="flex-1 p-6">
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                <div className="inline-flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {blog.createdAt
                                      ? new Date(
                                          blog.createdAt
                                        ).toLocaleDateString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "Recent"}
                                  </span>
                                </div>
                                <div className="inline-flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {Math.ceil(blog.content.length / 500)} min
                                    read
                                  </span>
                                </div>
                              </div>

                              <Link
                                href={blogHref}
                                className="text-xl md:text-2xl font-bold leading-tight mb-4 text-gray-900 hover:text-transparent hover:bg-gradient-to-r hover:from-green-600 hover:to-blue-600 hover:bg-clip-text transition-all duration-500 block"
                              >
                                {blog.title}
                              </Link>

                              <p className="text-gray-600 mb-4 leading-relaxed">
                                {blog.content
                                  .replace(/<[^>]+>/g, "")
                                  .slice(0, 200)}
                                {blog.content.length > 200 && "..."}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {Math.ceil(blog.content.length / 500)} min
                                      read
                                    </span>
                                  </div>
                                </div>

                                <Link
                                  href={blogHref}
                                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                >
                                  <span>Read More</span>
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    className="flex items-center justify-center gap-2 mt-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    {/* Previous Button */}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-lg"
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-2">
                      {pageNumbers.map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                            currentPage === pageNum
                              ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg"
                              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-lg"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-lg"
                      }`}
                    >
                      Next
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-gpu {
          transform-style: preserve-3d;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .hover\\:shadow-3xl:hover {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </>
  );
}
