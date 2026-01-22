"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  Calendar,
  Clock,
  User,
  Tag,
  ArrowLeft,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

const slugify = (value = "") =>
  decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const toCandidateSlugs = (item = {}) => {
  const rawSlug = (item.slug || "").toString();
  const rawTitle = (item.title || "").toString();
  const candidates = [
    slugify(rawSlug),
    slugify(rawTitle),
    rawSlug.trim().toLowerCase(),
    rawTitle.trim().toLowerCase().replace(/\s+/g, "-"),
  ].filter(Boolean);
  return Array.from(new Set(candidates));
};

const extractBlogs = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.blogs)) return payload.blogs;
  return [];
};

export default function BlogDetailClient({ blog, allBlogs, slug }) {
  const [resolvedBlog, setResolvedBlog] = useState(blog);
  const [resolvedAllBlogs, setResolvedAllBlogs] = useState(allBlogs || []);
  const [loadingFallback, setLoadingFallback] = useState(false);

  const isValid =
    resolvedBlog && resolvedBlog.status && resolvedBlog.status.toLowerCase() === "active";

  // Client-side fallback: re-fetch if SSR miss
  useEffect(() => {
    if (isValid) return;
    let cancelled = false;
    const fetchBlogs = async () => {
      try {
        setLoadingFallback(true);
        const res = await fetch(`${API_BASE}/blogs`, { cache: "no-store" });
        const data = await res.json();
        const blogs = extractBlogs(data);
        const found = blogs.find((b) => {
          const candidates = toCandidateSlugs(b);
          return candidates.some(
            (c) =>
              c === slug ||
              c.replace(/-+/g, "-") === slug ||
              slug.replace(/-+/g, "-") === c ||
              c.includes(slug) ||
              slug.includes(c)
          );
        });
        if (!cancelled) {
          setResolvedBlog(found || null);
          setResolvedAllBlogs(
            blogs.filter(
              (b) => b.status && b.status.toString().trim().toLowerCase() === "active"
            )
          );
        }
      } catch (err) {
        console.error("Client fallback fetch failed:", err);
        if (!cancelled) setResolvedBlog(null);
      } finally {
        if (!cancelled) setLoadingFallback(false);
      }
    };
    fetchBlogs();
    return () => {
      cancelled = true;
    };
  }, [isValid, slug]);

  const blogToRender = useMemo(() => {
    if (isValid) return resolvedBlog;
    if (resolvedBlog && resolvedBlog.status?.toLowerCase() === "active")
      return resolvedBlog;
    return null;
  }, [isValid, resolvedBlog]);

  const tags = useMemo(() => {
    if (!blogToRender) return [];
    const raw =
      blogToRender.tags ||
      blogToRender.keywords ||
      blogToRender.category ||
      "";
    if (Array.isArray(raw)) return raw.filter(Boolean).slice(0, 8);
    if (typeof raw === "string")
      return raw
        .split(/[,|]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8);
    return [];
  }, [blogToRender]);

  // TOC generation
  const { tocItems, contentWithAnchors } = useMemo(() => {
    const headings = [];
    let content = blogToRender.content || "";
    const headingRegex = /<(h2|h3)>(.*?)<\/\1>/gi;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (!text) continue;
      headings.push({ id: slugify(text), text, level: match[1] });
    }
    if (headings.length) {
      content = content.replace(headingRegex, (_, tag, inner) => {
        const clean = inner.replace(/<[^>]*>/g, "").trim();
        const id = slugify(clean);
        return `<${tag} id="${id}">${inner}</${tag}>`;
      });
    }
    return { tocItems: headings, contentWithAnchors: content };
  }, [blogToRender]);

  const categoriesList = useMemo(
    () =>
      [...new Set(resolvedAllBlogs.map((b) => b.category).filter(Boolean))].slice(
        0,
        10
      ),
    [resolvedAllBlogs]
  );

  // Show fallback
  if (!blogToRender) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          {loadingFallback ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading article...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-6">📝</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Article Not Found
              </h1>
              <p className="text-gray-600 mb-8">
                The blog post you're looking for doesn't exist or has been
                removed.
              </p>
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Blogs
              </Link>
            </div>
          )}
        </div>
        <Footer />
      </>
    );
  }

  // Helper data with defensive coercion
  const safeTitle = blogToRender.title || "Untitled Article";
  const safeAuthor = blogToRender.author || "";
  const rawContent = blogToRender.content;
  const safeContent =
    typeof rawContent === "string"
      ? rawContent
      : rawContent != null
      ? String(rawContent)
      : "";
  const rawImage = blogToRender.imageUrl
    ? String(blogToRender.imageUrl)
    : "";
  const imageUrl = rawImage.startsWith("http")
    ? rawImage
    : rawImage
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${
        rawImage.startsWith("/") ? rawImage : "/" + rawImage
      }`
    : "/images/blog-default.jpg";

  return (
    <>
      <Header />
      <section className="relative bg-[#f8f7fb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-16">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-purple-600 transition">
              Home
            </Link>
            <span>›</span>
            <Link href="/blogs" className="hover:text-purple-600 transition">
              Blogs
            </Link>
            <span>›</span>
            <span className="line-clamp-1 text-gray-600">{blogToRender.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr,280px] gap-6">
            {/* TOC */}
            <div className="hidden lg:block">
              <div className="sticky top-28 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 text-purple-700 font-semibold mb-4">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-purple-300 text-[10px]">
                    ☰
                  </span>
                  Table of Contents
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  {(tocItems.length ? tocItems : [{ id: "top", text: blogToRender.title, level: "h2" }]).map(
                    (item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={clsx(
                          "pl-2 py-1 rounded-md border-l-2 transition",
                          item.level === "h2"
                            ? "border-purple-300 text-gray-800 hover:text-purple-700"
                            : "border-purple-100 text-gray-500 hover:text-purple-600"
                        )}
                      >
                        {item.text}
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div>
              <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                    <Tag className="w-3 h-3" />
                    {blogToRender.category || "General"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {blogToRender.createdAt
                      ? new Date(blogToRender.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recent"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {Math.max(1, Math.ceil((safeContent || "").length / 500))} min read
                  </span>
                  {blogToRender.author && (
                    <span className="inline-flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      {blogToRender.author}
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3 mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                    {blogToRender.title}
                  </h1>
                  <button className="p-3 rounded-full border border-purple-100 text-purple-600 hover:bg-purple-50 transition">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mb-6">
                    <span className="font-semibold">Tags:</span>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 rounded-full text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl overflow-hidden mb-8 border border-gray-100">
                  <img
                    src={imageUrl}
                    alt={blogToRender.title}
                    className="w-full max-h-[520px] object-cover"
                    loading="eager"
                  />
                </div>

                <div
                  className="prose prose-lg max-w-none text-gray-800 prose-img:rounded-2xl prose-img:border prose-img:border-gray-100 prose-headings:scroll-mt-32"
                  dangerouslySetInnerHTML={{
                    __html: contentWithAnchors || blogToRender.content,
                  }}
                />
              </div>
            </div>

            {/* Right sidebar */}
            <div className="hidden lg:flex flex-col gap-6">
              <div className="sticky top-28 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Search Blogs
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search blogs..."
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                      Search
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Recent Posts
                  </h3>
                  <div className="flex flex-col gap-3">
                    {resolvedAllBlogs
                      .filter((post) => post._id !== blogToRender._id)
                      .slice(0, 6)
                      .map((post) => (
                        <Link
                          key={post._id}
                          href={`/blogs/${slugify(post.slug || post.title)}`}
                          className="text-sm text-gray-700 hover:text-purple-700 line-clamp-2"
                        >
                          {post.title}
                        </Link>
                      ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600" />
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoriesList.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
