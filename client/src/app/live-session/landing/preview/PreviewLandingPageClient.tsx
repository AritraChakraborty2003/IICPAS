"use client";

import LiveSessionLandingPage from "@/components/LiveSessionLandingPage";
import { getApiOrigin } from "@/lib/apiBase";
import {
  readLiveSessionLandingDraft,
} from "@/lib/liveSessionLandingDraft";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const API_ORIGIN = getApiOrigin();

const getLandingPageDefaults = (landingPage = {}, session = {}) => ({
  heroImage:
    landingPage.heroImage ||
    session.imageUrl ||
    session.thumbnail ||
    "/images/live-class.jpg",
  headline: landingPage.headline || session.title || "",
  subheadline:
    landingPage.subheadline ||
    session.subtitle ||
    session.description ||
    "",
  bodyContent: landingPage.bodyContent || session.description || "",
  authorName: landingPage.authorName || session.instructor || "",
  authorCode: landingPage.authorCode || "IICPA",
  authorText: landingPage.authorText || "",
  ctaText: landingPage.ctaText || "Get Free Preview",
  formHeading: landingPage.formHeading || "Start your enquiry",
  formDescription:
    landingPage.formDescription ||
    "Share your details and our team will reach out shortly.",
  formLabel: landingPage.formLabel || "Lead Form",
  thankYouText:
    landingPage.thankYouText ||
    "Thank you. Our team will contact you shortly.",
});

const getDraftSession = (draft) => {
  const form = draft?.form || {};
  return {
    _id: draft?.editId || "draft",
    title: form.title || "Live Session Landing Page",
    instructor: form.instructor || "",
    description: form.description || "",
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftKey = searchParams.get("draftKey") || "";
  const sessionId = searchParams.get("sessionId") || "";
  const returnTo =
    searchParams.get("returnTo") || "/admin-dashboard?tab=live-session";
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        if (draftKey) {
          const stored = readLiveSessionLandingDraft(draftKey);
          if (!cancelled) setDraft(stored);
          return;
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
      <button
        type="button"
        onClick={() => router.replace(returnTo)}
        className="fixed right-5 top-24 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 hover:text-slate-950"
        aria-label="Close preview"
        title="Close preview"
      >
        <X className="h-5 w-5" />
      </button>

      <LiveSessionLandingPage
        sessionId={draft ? undefined : sessionId || undefined}
        session={session}
        draftLandingPage={draftLandingPage}
        previewMode
        showHeader
        showFooter={false}
        overrideTitle={draft?.form?.title || ""}
        overrideUrl={typeof window !== "undefined" ? window.location.href : ""}
      />
    </div>
  );
}
