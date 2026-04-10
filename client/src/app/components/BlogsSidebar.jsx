"use client";

import { TrendingUp, Users, Calendar, Tag, BookOpen } from "lucide-react";
import Link from "next/link";
import { getBlogSlug } from "../../lib/blogSlug";
import { getApiOrigin, getFallbackImage } from "../../lib/blogUtils";

const API_ORIGIN = getApiOrigin();

export default function BlogsSidebar({
  blogs,
  selectedCategory,
  onCategoryChange,
}) {
  // Get unique categories
  const categories = [
    "all",
    ...new Set(blogs.map((blog) => blog.category).filter(Boolean)),
  ];

  // Get category counts
  const categoryCounts = categories.map((category) => ({
    name: category,
    count:
      category === "all"
        ? blogs.length
        : blogs.filter((blog) => blog.category === category).length,
  }));

  // Get recent blogs
  const recentBlogs = blogs
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Get popular categories (top 5 by count)
  const popularCategories = categoryCounts
    .filter((cat) => cat.name !== "all")
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Blog Statistics */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Blog Statistics
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-gray-900">
              {blogs.length}
            </div>
            <div className="text-sm text-gray-600">Total Articles</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-gray-900">
              {categories.length - 1}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-gray-900">
              {blogs.reduce(
                (total, blog) => total + Math.ceil(blog.content.length / 500),
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Read Time</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-gray-900">
              {new Set(blogs.map((blog) => blog.author)).size}
            </div>
            <div className="text-sm text-gray-600">Authors</div>
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-500" />
          Categories
        </h3>

        <div className="space-y-3">
          {categoryCounts.map((category) => (
            <button
              key={category.name}
              onClick={() => onCategoryChange(category.name)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
                selectedCategory === category.name
                  ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg transform scale-105"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="capitalize font-medium">
                  {category.name === "all" ? "All Posts" : category.name}
                </span>
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    selectedCategory === category.name
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {category.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Categories */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Popular Categories
        </h3>

        <div className="space-y-3">
          {popularCategories.map((category, index) => (
            <div
              key={category.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <span className="text-gray-700 capitalize font-medium">
                  {category.name}
                </span>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {category.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          Recent Articles
        </h3>

        <div className="space-y-4">
          {recentBlogs.map((blog) => {
            const imageUrl = blog.imageUrl?.startsWith("http")
              ? blog.imageUrl
              : blog.imageUrl
              ? `${API_ORIGIN}${
                  blog.imageUrl.startsWith("/")
                    ? blog.imageUrl
                    : "/" + blog.imageUrl
                }`
              : getFallbackImage(blog.title);
            const blogSlug = getBlogSlug(blog);
            const blogHref = blogSlug ? `/blogs/${blogSlug}` : "/blogs";

            return (
              <Link key={blog._id} href={blogHref} className="group flex gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-500/20 transition-all duration-300">
                  <img
                    src={imageUrl}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = getFallbackImage(blog.title);
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {blog.createdAt
                      ? new Date(blog.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "Recent"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
        <p className="text-sm opacity-90 mb-4">
          Get the latest articles delivered right to your inbox.
        </p>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button className="w-full bg-white text-green-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200">
            Subscribe
          </button>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
