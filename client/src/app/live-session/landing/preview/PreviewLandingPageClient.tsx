"use client";

import LiveSessionLandingPage from "@/components/LiveSessionLandingPage";
import { getApiOrigin } from "@/lib/apiBase";
import {
  type LiveSessionLandingDraft,
  readLiveSessionLandingDraft,
} from "@/lib/liveSessionLandingDraft";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy } from "lucide-react";

const API_ORIGIN = getApiOrigin();

type SessionLike = {
  _id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  instructor?: string;
  imageUrl?: string;
  thumbnail?: string;
  category?: string;
  landingPage?: Record<string, any>;
};

const buildAuthorProfile = (profile = {}, fallback = {}) => ({
  image: profile.image || profile.authorImage || fallback.image || "",
  name: profile.name || profile.authorName || fallback.name || "",
  code: profile.code || profile.authorCode || fallback.code || "IICPA",
  text: profile.text || profile.authorText || fallback.text || "",
});

const normalizeAuthorProfiles = (landingPage = {}, session: SessionLike = {}) => {
  const fallback = {
    image:
      landingPage.authorImage ||
      session.imageUrl ||
      session.thumbnail ||
      "",
    name: landingPage.authorName || session.instructor || "",
    code: landingPage.authorCode || "IICPA",
    text: landingPage.authorText || "",
  };

  const profiles = Array.isArray(landingPage.authorProfiles)
    ? landingPage.authorProfiles.map((profile) =>
        buildAuthorProfile(profile, fallback)
      )
    : [];

  if (profiles.length === 0) {
    profiles.push(buildAuthorProfile({}, fallback));
  }

  return profiles;
};

const getAuthorLayout = (landingPage = {}) =>
  landingPage.authorLayout === "two-per-line" ? "two-per-line" : "stack";

const getLandingPageDefaults = (
  landingPage: Record<string, any> = {},
  session: SessionLike = {}
) => {
  const authorProfiles = normalizeAuthorProfiles(landingPage, session);
  const firstProfile = authorProfiles[0] || buildAuthorProfile();

  return {
    heroImage:
      landingPage.heroImage ||
      session.imageUrl ||
      session.thumbnail ||
      "/images/live-class.jpg",
    authorProfiles,
    authorLayout: getAuthorLayout(landingPage),
    authorImage: firstProfile.image || "",
    headline: landingPage.headline || session.title || "",
    subheadline:
      landingPage.subheadline ||
      session.subtitle ||
      session.description ||
      "",
    bodyContent: landingPage.bodyContent || session.description || "",
    authorName: firstProfile.name || session.instructor || "",
    authorCode: firstProfile.code || "IICPA",
    authorText: firstProfile.text || "",
    ctaText: landingPage.ctaText || "Get Free Preview",
    formHeading: landingPage.formHeading || "Enroll Now",
    formDescription:
      landingPage.formDescription ||
      "Share your details and our team will reach out shortly.",
    formLabel: landingPage.formLabel || "Lead Form",
    thankYouText:
      landingPage.thankYouText ||
      "Thank you. Our team will contact you shortly.",
  };
};

const getDraftSession = (draft: LiveSessionLandingDraft | null) => {
  const form = draft?.form || {};
  return {
    _id: draft?.editId || "draft",
    title: form.title || "Live Session Landing Page",
    instructor: form.instructor || "",
    description: form.description || "",
    price: Number(form.price || 0),
    imageUrl:
      draft?.imagePreview ||
      form.thumbnail ||
      form.landingPage?.heroImage ||
      "/images/live-class.jpg",
    thumbnail:
      draft?.imagePreview ||
      form.thumbnail ||
      form.landingPage?.heroImage ||
      "/images/live-class.jpg",
    category: form.category || "",
    landingPage: getLandingPageDefaults(
      form.landingPage || {},
      {
        title: form.title,
        subtitle: form.description,
        description: form.description,
        instructor: form.instructor,
        imageUrl: draft?.imagePreview || form.thumbnail,
        thumbnail: draft?.imagePreview || form.thumbnail,
      }
    ),
  };
};

export default function PreviewLandingPageClient() {
  const searchParams = useSearchParams();
  const draftKey = searchParams.get("draftKey") || "";
  const sessionId = searchParams.get("sessionId") || "";
  const isAdminPreview = searchParams.get("adminPreview") === "1";
  const [draft, setDraft] = useState<LiveSessionLandingDraft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        if (draftKey) {
          const stored = readLiveSessionLandingDraft(draftKey);
          if (stored) {
            if (!cancelled) setDraft(stored);
            return;
          }
        }

        if (!sessionId) {
          if (!cancelled) setDraft(null);
          return;
        }

        const response = await fetch(`${API_ORIGIN}/api/live-sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error("Preview session not found");
        }
        const session = await response.json();
        if (!cancelled) {
          setDraft({
            editId: session._id,
            form: {
              title: session.title || "",
              instructor: session.instructor || "",
              description: session.description || "",
              startTime: session.time?.split(" - ")?.[0] || "",
              endTime: session.time?.split(" - ")?.[1] || "",
              date: session.date ? String(session.date).slice(0, 10) : "",
              link: session.link || "",
              price: String(session.price || ""),
              category: session.category || "",
              maxParticipants: String(session.maxParticipants || ""),
              thumbnail: session.thumbnail || "",
              courseId: session.courseId?._id || session.courseId || "",
              chapterId: session.chapterId?._id || session.chapterId || "",
              landingPage: getLandingPageDefaults(session.landingPage || {}, session),
            },
            imagePreview: session.imageUrl || session.thumbnail || "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setDraft(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [draftKey, sessionId]);

  const session = useMemo(() => {
    if (!draft) return null;
    return getDraftSession(draft);
  }, [draft]);

  const draftLandingPage = draft?.form
    ? getLandingPageDefaults(draft.form.landingPage || {}, {
        title: draft.form.title,
        subtitle: draft.form.description,
        description: draft.form.description,
        instructor: draft.form.instructor,
        imageUrl: draft.imagePreview || draft.form.thumbnail,
        thumbnail: draft.imagePreview || draft.form.thumbnail,
      })
    : null;

  const adminPreviewAction = isAdminPreview ? (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
        } catch {
          window.prompt("Copy preview link", window.location.href);
        }
      }}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 hover:text-slate-950"
      aria-label="Copy preview link"
      title="Copy preview link"
    >
      <Copy className="h-4 w-4" />
    </button>
  ) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          Loading preview...
        </div>
      </div>
    );
  }

  if (!draft && !sessionId) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-slate-600 shadow-sm">
            Preview data is missing. Please open the preview from the admin editor again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <LiveSessionLandingPage
        sessionId={sessionId || draft?.editId || undefined}
        session={session}
        draftLandingPage={draftLandingPage}
        showHeader
        showFooter={false}
        overrideTitle={draft?.form?.title || ""}
        overrideUrl={typeof window !== "undefined" ? window.location.href : ""}
        adminPreviewAction={adminPreviewAction}
      />
    </div>
  );
}
