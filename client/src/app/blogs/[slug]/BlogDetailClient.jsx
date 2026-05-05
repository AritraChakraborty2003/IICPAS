"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Calendar, Clock, User, Tag, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { getBlogSlug } from "../../../lib/blogSlug";

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

  const relatedPosts = useMemo(() => {
    return resolvedAllBlogs
      .filter((post) => post?._id && post._id !== blogToRender?._id)
      .slice(0, 6);
  }, [resolvedAllBlogs, blogToRender]);

  if (!blogToRender) {
    return (
      <>
        <Header topOffset={40} />
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

  const getImageUrl = (item) => {
    const value = item?.imageUrl ? String(item.imageUrl) : "";
    if (!value) return "/images/blog-default.jpg";
    if (value.startsWith("http")) return value;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return `${base}${value.startsWith("/") ? value : `/${value}`}`;
  };

  const handleShare = async () => {
    const currentUrl =
      typeof window !== "undefined" ? window.location.href : "/blogs";

    try {
      if (navigator.share) {
        await navigator.share({
          title: blogToRender.title,
          text: "Check out this article",
          url: currentUrl,
        });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <>
      <Header topOffset={40} />
      <section className="relative bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_40%),radial-gradient(circle_at_top_left,rgba(34,197,94,0.1),transparent_35%)]" />
        <div className="relative max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-16">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-emerald-600 transition">
              Home
            </Link>
            <span>›</span>
            <Link href="/blogs" className="hover:text-emerald-600 transition">
              Blogs
            </Link>
            <span>›</span>
            <span className="line-clamp-1 text-slate-600">{blogToRender.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
            <article className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-5 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 mb-5">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-medium">
                  <Tag className="w-3 h-3" />
                  {blogToRender.category || "General"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {blogToRender.createdAt
                    ? new Date(blogToRender.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recent"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {Math.max(1, Math.ceil((safeContent || "").length / 500))} min read
                </span>
                {blogToRender.author && (
                  <span className="inline-flex items-center gap-1">
                    <User className="w-4 h-4 text-slate-400" />
                    {blogToRender.author}
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-4 mb-7">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight max-w-4xl">
                  {blogToRender.title}
                </h1>
                <button
                  onClick={handleShare}
                  className="shrink-0 p-3 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Share article"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 mb-6">
                  <span className="font-semibold text-slate-800">Tags:</span>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-slate-100 rounded-full text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-3xl overflow-hidden mb-8 border border-slate-200 shadow-sm bg-slate-50 p-2">
                <Image
                  src={imageUrl}
                  alt={blogToRender.title}
                  width={1200}
                  height={700}
                  className="w-full h-auto object-contain rounded-2xl"
                  sizes="(max-width: 1024px) 100vw, 980px"
                />
              </div>

              <div
                className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:text-emerald-700 hover:prose-a:text-emerald-600 prose-img:rounded-2xl prose-img:border prose-img:border-slate-200 prose-headings:scroll-mt-32"
                dangerouslySetInnerHTML={{
                  __html: contentWithAnchors || blogToRender.content,
                }}
              />
            </article>

            <aside className="space-y-5 lg:sticky lg:top-28">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Our Articles
                </h3>
                <div className="space-y-4">
                  {relatedPosts.map((post) => (
                    <Link
                      key={post._id}
                      href={`/blogs/${getBlogSlug(post)}`}
                      className="group flex gap-3"
                    >
                      <div className="relative h-16 w-20 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <Image
                          src={getImageUrl(post)}
                          alt={post.title || "Blog image"}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="80px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition line-clamp-2">
                          {post.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Recent"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl text-white p-5 shadow-lg">
                <p className="text-sm uppercase tracking-wide text-white/80 mb-2">
                  Explore More
                </p>
                <h4 className="text-lg font-semibold leading-snug mb-4">
                  Read more industry-focused blogs from IICPA.
                </h4>
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-4 py-2 rounded-xl hover:bg-emerald-50 transition"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                  View All Blogs
                </Link>
              </div>
            </aside>

            <div className="lg:hidden mt-2">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  More Articles
                </h3>
                <div className="space-y-3">
                  {relatedPosts.slice(0, 4).map((post) => (
                    <Link
                      key={post._id}
                      href={`/blogs/${getBlogSlug(post)}`}
                      className="block text-sm font-medium text-slate-700 hover:text-emerald-700 line-clamp-2"
                    >
                      {post.title}
                    </Link>
                  ))}
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
