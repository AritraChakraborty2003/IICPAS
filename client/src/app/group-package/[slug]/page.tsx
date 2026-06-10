import React from "react";
import { Metadata } from "next";
import GroupPackageClient from "./GroupPackageClient";

interface GroupPackageData {
  _id?: string;
  groupName?: string;
  slug?: string;
  level?: string;
  description?: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  [key: string]: unknown;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SITE_URL = "https://iicpa.in";

const sanitizeSlug = (rawSlug: string) => {
  try {
    return decodeURIComponent(rawSlug).trim();
  } catch {
    return rawSlug.trim();
  }
};

async function getGroupPackage(
  rawSlug: string
): Promise<GroupPackageData | null> {
  const slug = sanitizeSlug(rawSlug);
  if (!slug) return null;

  const base = API_BASE.replace(/\/$/, "");
  const candidates = [
    `${base}/api/group-pricing/slug/${encodeURIComponent(slug)}`,
    `${base}/api/group-pricing/${encodeURIComponent(slug)}`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
      const payload = await response.json();
      if (payload && typeof payload === "object") {
        return payload as GroupPackageData;
      }
    } catch (error) {
      console.error("Error fetching group package data:", error);
    }
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getGroupPackage(slug);

  if (!pkg) {
    return {
      title: "Course Package - IICPA Institute",
      description:
        "Explore our course packages with syllabus, pricing, and enrollment options. Join IICPA Institute's comprehensive accounting and finance programs.",
      keywords:
        "course package, accounting courses, finance training, course bundle, IICPA Institute",
      robots: { index: true, follow: true },
    };
  }

  const groupName = pkg.groupName || "Course Package";
  const plainDescription = pkg.description
    ? pkg.description.replace(/<[^>]*>/g, "").trim().substring(0, 160)
    : "Explore this course package with detailed syllabus, pricing, and enrollment options at IICPA Institute.";

  const metaTitle = pkg.metaTitle?.trim()
    ? pkg.metaTitle
    : `${groupName} - IICPA Institute`;
  const metaDescription = pkg.metaDescription?.trim()
    ? pkg.metaDescription
    : plainDescription;
  const keywords = pkg.metaKeywords?.trim()
    ? pkg.metaKeywords
    : `${groupName.toLowerCase()}, ${
        pkg.level || "professional"
      } level, course package, course syllabus, course pricing, IICPA Institute`;

  const image = pkg.image
    ? pkg.image.startsWith("http")
      ? pkg.image
      : `${SITE_URL}${pkg.image.startsWith("/") ? "" : "/"}${pkg.image}`
    : `${SITE_URL}/images/og-default.jpg`;

  const pageUrl = `${SITE_URL}/group-package/${encodeURIComponent(
    pkg.slug || sanitizeSlug(slug)
  )}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: pageUrl,
      siteName: "IICPA Institute",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${groupName} - Course Package`,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function GroupPackagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <GroupPackageClient slug={sanitizeSlug(slug)} />;
}
