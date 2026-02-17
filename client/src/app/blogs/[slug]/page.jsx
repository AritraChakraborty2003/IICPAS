// app/blogs/[slug]/page.js

import BlogHero from "./BlogHero";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AccountingQuiz from "./AccountingQuiz";
import BlogDetailClient from "./BlogDetailClient";
import axios from "axios";
import { Metadata } from "next";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

// Render blog pages dynamically so new posts start working immediately
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// Normalize titles and incoming slugs consistently
const slugify = (value = "") =>
  decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-") // normalize fancy dashes
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const toCandidateSlugs = (blog = {}) => {
  const rawSlug = (blog.slug || "").toString();
  const rawTitle = (blog.title || "").toString();
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

// Generate static params for pre-render (when available)
export async function generateStaticParams() {
  try {
    const res = await axios.get(`${API_BASE}/blogs`);
    const blogs = extractBlogs(res.data);
    const slugs = blogs
      .map((b) => slugify(b.slug || b.title || ""))
      .filter(Boolean);
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Error fetching blog slugs for SSG:", error);
  }
  return [];
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }) {
  const slug = slugify(params.slug || "");

  try {
    const res = await axios.get(`${API_BASE}/blogs`, { timeout: 8000 });
    const blogs = extractBlogs(res.data);
    const foundBlog = blogs.find((b) => {
      const candidates = toCandidateSlugs(b);
      return candidates.includes(slug);
    });

    if (!foundBlog || foundBlog.status !== "active") {
      return {
        title: "Blog Post Not Found - IICPA Institute",
        description: "The requested blog post could not be found.",
      };
    }

    // Create dynamic SEO title based on blog heading
    const seoTitle = `${foundBlog.title} - IICPA Institute`;

    // Generate description from content (first 160 characters)
    const description = foundBlog.content
      ? foundBlog.content.replace(/<[^>]*>/g, "").substring(0, 160) + "..."
      : `Learn about ${foundBlog.title} at IICPA Institute. Professional accounting and finance training.`;

    return {
      title: seoTitle,
      description: description,
      keywords: foundBlog.category
        ? `${foundBlog.category}, accounting, finance, IICPA`
        : "accounting, finance, IICPA",
      openGraph: {
        title: seoTitle,
        description: description,
        type: "article",
        url: `https://iicpa.in/blogs/${slug}`,
        images: foundBlog.imageUrl
          ? [
              {
                url: foundBlog.imageUrl.startsWith("http")
                  ? foundBlog.imageUrl
                  : `https://iicpa.in${foundBlog.imageUrl}`,
                width: 1200,
                height: 630,
                alt: foundBlog.title,
              },
            ]
          : [
              {
                url: "https://iicpa.in/images/blog-default.jpg",
                width: 1200,
                height: 630,
                alt: "IICPA Institute Blog",
              },
            ],
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle,
        description: description,
        images: foundBlog.imageUrl
          ? [
              foundBlog.imageUrl.startsWith("http")
                ? foundBlog.imageUrl
                : `https://iicpa.in${foundBlog.imageUrl}`,
            ]
          : ["https://iicpa.in/images/blog-default.jpg"],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Blog Post - IICPA Institute",
      description: "Professional accounting and finance training blog post.",
    };
  }
}

export default async function BlogDetail({ params }) {
  const slug = slugify(params.slug || "");

  try {
    const res = await axios.get(`${API_BASE}/blogs`, { timeout: 8000 });
    const blogs = extractBlogs(res.data);
    const foundBlog = blogs.find((b) => {
      const candidates = toCandidateSlugs(b);
      return candidates.includes(slug);
    });

    // Store all active blogs for related articles
    const activeBlogs = blogs.filter((b) => b.status === "active");

    return (
      <BlogDetailClient blog={foundBlog} allBlogs={activeBlogs} slug={slug} />
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return <BlogDetailClient blog={null} allBlogs={[]} slug={slug} />;
  }
}
