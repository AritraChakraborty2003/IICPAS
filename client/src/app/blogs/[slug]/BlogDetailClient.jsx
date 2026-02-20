"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Calendar, Clock, User, Tag, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

const slugify = (value = "") =>
  decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function BlogDetailClient({ blog, allBlogs }) {
  const blogToRender = useMemo(() => {
    if (!blog) return null;
    if (!blog.status) return null;
    return blog.status.toLowerCase() === "active" ? blog : null;
  }, [blog]);

  const resolvedAllBlogs = useMemo(() => {
    if (!Array.isArray(allBlogs)) return [];
    return allBlogs.filter(
      (item) => item?.status && item.status.toString().trim().toLowerCase() === "active"
    );
  }, [allBlogs]);

  const tags = useMemo(() => {
    if (!blogToRender) return [];
    const raw =
      blogToRender.tags ||
      blogToRender.keywords ||
      blogToRender.category ||
      "";

    if (Array.isArray(raw)) return raw.filter(Boolean).slice(0, 8);

    if (typeof raw === "string") {
      return raw
        .split(/[,|]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8);
    }

    return [];
  }, [blogToRender]);

  const { contentWithAnchors } = useMemo(() => {
    if (!blogToRender || !blogToRender.content) {
      return { contentWithAnchors: "" };
    }

    let content = blogToRender.content || "";
    const headingRegex = /<(h2|h3)>(.*?)<\/\1>/gi;
    const headings = [];

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
        return `<${tag} id=\"${id}\">${inner}</${tag}>`;
      });
    }

    return { contentWithAnchors: content };
  }, [blogToRender]);

  const categoriesList = useMemo(() => {
    const list = resolvedAllBlogs.map((item) => item?.category).filter(Boolean);
    return [...new Set(list)].slice(0, 10);
  }, [resolvedAllBlogs]);

  if (!blogToRender) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-6">📝</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-8">
              The blog post you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Blogs
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const rawContent = blogToRender.content;
  const safeContent =
    typeof rawContent === "string"
      ? rawContent
      : rawContent != null
      ? String(rawContent)
      : "";

  const rawImage = blogToRender.imageUrl ? String(blogToRender.imageUrl) : "";
  const imageUrl = rawImage.startsWith("http")
    ? rawImage
    : rawImage
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${
        rawImage.startsWith("/") ? rawImage : `/${rawImage}`
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

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6">
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
                  <Image
                    src={imageUrl}
                    alt={blogToRender.title}
                    width={1200}
                    height={700}
                    className="w-full max-h-[520px] object-cover"
                    sizes="(max-width: 1024px) 100vw, 900px"
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
