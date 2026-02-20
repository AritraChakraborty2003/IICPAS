import { cache } from "react";
import BlogDetailClient from "./BlogDetailClient";
import { getBlogSlug, normalizeBlogSlug } from "../../../lib/blogSlug";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

export const revalidate = 600;

const toCandidateSlugs = (blog = {}) => {
  const normalizedSlug = normalizeBlogSlug(blog?.slug || "");
  const normalizedTitle = normalizeBlogSlug(blog?.title || "");
  return Array.from(new Set([normalizedSlug, normalizedTitle].filter(Boolean)));
};

const extractBlogs = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.blogs)) return payload.blogs;
  return [];
};

const getBlogs = cache(async () => {
  const response = await fetch(`${API_BASE}/blogs`, {
    next: { revalidate, tags: ["blogs"] },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch blogs. Status: ${response.status}`);
  }

  const data = await response.json();
  return extractBlogs(data);
});

const findBlogBySlug = (blogs, slug) => {
  return blogs.find((blog) => {
    const candidates = toCandidateSlugs(blog);
    return candidates.some((candidate) => candidate === slug);
  });
};

export async function generateStaticParams() {
  try {
    const blogs = await getBlogs();
    const slugs = blogs.map((blog) => getBlogSlug(blog)).filter(Boolean);

    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Error fetching blog slugs for SSG:", error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const slug = normalizeBlogSlug(params.slug || "");

  try {
    const blogs = await getBlogs();
    const foundBlog = findBlogBySlug(blogs, slug);

    if (!foundBlog || foundBlog.status !== "active") {
      return {
        title: "Blog Post Not Found - IICPA Institute",
        description: "The requested blog post could not be found.",
      };
    }

    const seoTitle = `${foundBlog.title} - IICPA Institute`;
    const description = foundBlog.content
      ? foundBlog.content.replace(/<[^>]*>/g, "").slice(0, 160) + "..."
      : `Learn about ${foundBlog.title} at IICPA Institute. Professional accounting and finance training.`;

    const imageUrl = foundBlog.imageUrl
      ? foundBlog.imageUrl.startsWith("http")
        ? foundBlog.imageUrl
        : `https://iicpa.in${foundBlog.imageUrl}`
      : "https://iicpa.in/images/blog-default.jpg";

    return {
      title: seoTitle,
      description,
      keywords: foundBlog.category
        ? `${foundBlog.category}, accounting, finance, IICPA`
        : "accounting, finance, IICPA",
      openGraph: {
        title: seoTitle,
        description,
        type: "article",
        url: `https://iicpa.in/blogs/${slug}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: foundBlog.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle,
        description,
        images: [imageUrl],
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
  const slug = normalizeBlogSlug(params.slug || "");

  try {
    const blogs = await getBlogs();
    const foundBlog = findBlogBySlug(blogs, slug);
    const activeBlogs = blogs.filter((blog) => blog.status === "active");
    if (!foundBlog && process.env.NODE_ENV !== "production") {
      console.info(
        `[blogs] No exact slug match for "${slug}" among ${blogs.length} blogs`
      );
    }

    return (
      <BlogDetailClient blog={foundBlog} allBlogs={activeBlogs} slug={slug} />
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return <BlogDetailClient blog={null} allBlogs={[]} slug={slug} />;
  }
}
