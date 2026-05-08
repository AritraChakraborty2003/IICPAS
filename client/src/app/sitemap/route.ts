import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Use environment variable or default for base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://iicpa.in";

    // Define static pages based on your app structure
    const staticPages = [
      "",
      "/about",
      "/admin",
      "/admin-dashboard",
      "/blog",
      "/blogs",
      "/cancellation-refund-policy",
      "/center-dashboard",
      "/center-login",
      "/center-register",
      "/checkout",
      "/code",
      "/college-dashboard",
      "/company-dashboard",
      "/contact",
      "/cookies",
      "/course",
      "/courses",
      "/demo-digital-hub",
      "/digital-hub",
      "/disclaimer",
      "/failure",
      "/faq",
      "/gamification",
      "/gst-dashboard",
      "/gst-portal",
      "/gst-portal-exact",
      "/gst-simulation",
      "/gst-simulations",
      "/simulations/gst",
      "/simulations/gst/e-invoicing-1",
      "/simulations/gst/e-invoicing-3",
      "/simulations/gst/e-invoicing-4",
      "/simulations/gst/e-invoicing-1/invoice",
      "/help",
      "/home",
      "/iicpa-review",
      "/indiq-gst",
      "/jobs",
      "/join",
      "/live",
      "/live-session",
      "/login",
      "/partners",
      "/personal-dashboard",
      "/placements",
      "/practice",
      "/privacy",
      "/privacy-policy",
      "/profile",
      "/quotation",
      "/refund",
      "/register",
      "/resources",
      "/shipping-delivery",
      "/simulatx",
      "/student-dashboard",
      "/student-login",
      "/success",
      "/teacher-dashboard",
      "/teacher-login",
      "/teacher-register",
      "/team",
      "/team-dashboard",
      "/terms",
      "/terms-conditions",
      "/test",
      "/test-editor",
      "/test-footer-links",
      "/training",
      "/wishlist",
      "/confidentiality",
    ];

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map((page) => {
      const url = `${baseUrl}${page}`;
      const lastmod = new Date().toISOString().split("T")[0];

      // Set priority based on page importance
      let priority = "0.5";
      if (page === "") priority = "1.0"; // Home page
      else if (page === "/course" || page === "/courses") priority = "0.9";
      else if (page === "/about" || page === "/contact" || page === "/faq")
        priority = "0.8";
      else if (
        page.includes("dashboard") ||
        page.includes("login") ||
        page.includes("register")
      )
        priority = "0.3";

      // Set change frequency
      let changefreq = "monthly";
      if (page === "") changefreq = "weekly";
      else if (
        page === "/course" ||
        page === "/courses" ||
        page === "/blog" ||
        page === "/blogs"
      )
        changefreq = "weekly";
      else if (page.includes("dashboard")) changefreq = "daily";

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
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
