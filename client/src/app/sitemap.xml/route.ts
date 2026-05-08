import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // Use environment variable or default for base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://iicpa.in";

    // Define API base URL
    const API_BASE =
      process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

    // Define static pages based on your app structure
    const staticPages = [
      {
        url: "",
        priority: "1.0",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/about",
        priority: "0.8",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/admin",
        priority: "0.3",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/admin-dashboard",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/blog",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/blogs",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/cancellation-refund-policy",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/center-dashboard",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/center-login",
        priority: "0.3",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/center-register",
        priority: "0.3",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/checkout",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/code",
        priority: "0.5",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/college-dashboard",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/company-dashboard",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/contact",
        priority: "0.8",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/cookies",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/course",
        priority: "0.9",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/courses",
        priority: "0.9",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/demo-digital-hub",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/digital-hub",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/disclaimer",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/failure",
        priority: "0.2",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/faq",
        priority: "0.8",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/gamification",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/gst-dashboard",
        priority: "0.5",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/gst-portal",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/gst-portal-exact",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/gst-simulation",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/gst-simulations",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/simulations/gst",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/simulations/gst/e-invoicing-1",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/simulations/gst/e-invoicing-1/invoice",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/help",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/home",
        priority: "0.8",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/iicpa-review",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/indiq-gst",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/jobs",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/join",
        priority: "0.7",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/live",
        priority: "0.6",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/live-session",
        priority: "0.6",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/login",
        priority: "0.5",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/partners",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/personal-dashboard",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/placements",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/practice",
        priority: "0.6",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/privacy",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/privacy-policy",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/profile",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/refund",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/register",
        priority: "0.5",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/resources",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/shipping-delivery",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/simulatx",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/student-dashboard",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/student-login",
        priority: "0.3",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/success",
        priority: "0.2",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/teacher-dashboard",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/teacher-login",
        priority: "0.3",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/teacher-register",
        priority: "0.3",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/team",
        priority: "0.6",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/team-dashboard",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/terms",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/terms-conditions",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/test",
        priority: "0.5",
        changefreq: "monthly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/test-editor",
        priority: "0.3",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/test-footer-links",
        priority: "0.2",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/training",
        priority: "0.7",
        changefreq: "weekly",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/wishlist",
        priority: "0.5",
        changefreq: "daily",
        lastmod: new Date().toISOString().split("T")[0],
      },
      {
        url: "/confidentiality",
        priority: "0.4",
        changefreq: "yearly",
        lastmod: new Date().toISOString().split("T")[0],
      },
    ];

    // Try to fetch dynamic content (courses, blogs, etc.)
    let dynamicPages: any[] = [];

    try {
      // Fetch courses
      const coursesResponse = await axios.get(`${API_BASE}/courses`, {
        timeout: 5000, // 5 second timeout
      });

      if (coursesResponse.data && Array.isArray(coursesResponse.data)) {
        const coursePages = coursesResponse.data.map((course: any) => ({
          url: `/course/${
            course.slug ||
            course.title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
          }`,
          priority: "0.8",
          changefreq: "weekly",
          lastmod: course.updatedAt
            ? new Date(course.updatedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        }));
        dynamicPages = [...dynamicPages, ...coursePages];
      }
    } catch (error) {
      console.log("Could not fetch courses for sitemap:", error);
    }

    try {
      // Fetch blogs
      const blogsResponse = await axios.get(`${API_BASE}/blogs`, {
        timeout: 5000,
      });

      if (blogsResponse.data && Array.isArray(blogsResponse.data)) {
        const blogPages = blogsResponse.data.map((blog: any) => ({
          url: `/blogs/${
            blog.slug ||
            blog.title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
          }`,
          priority: "0.6",
          changefreq: "monthly",
          lastmod: blog.updatedAt
            ? new Date(blog.updatedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        }));
        dynamicPages = [...dynamicPages, ...blogPages];
      }
    } catch (error) {
      console.log("Could not fetch blogs for sitemap:", error);
    }

    // Combine static and dynamic pages
    const allPages = [...staticPages, ...dynamicPages];

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
    .map((page) => {
      const url = `${baseUrl}${page.url}`;
      return `  <url>
    <loc>${url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    })
    .join("\n")}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
