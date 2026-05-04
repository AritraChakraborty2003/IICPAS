"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { getApiOrigin } from "@/lib/apiBase";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Swal from "sweetalert2";

type LandingPageConfig = {
  heroImage?: string;
  headline?: string;
  subheadline?: string;
  bodyContent?: string;
  authorName?: string;
  authorCode?: string;
  authorText?: string;
  ctaText?: string;
  formHeading?: string;
  formDescription?: string;
  formLabel?: string;
  thankYouText?: string;
};

type LiveSessionRecord = {
  _id?: string;
  title?: string;
  subtitle?: string;
  instructor?: string;
  description?: string;
  imageUrl?: string;
  thumbnail?: string;
  category?: string;
  landingPage?: LandingPageConfig;
};

type LeadFormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};

type LiveSessionLandingPageProps = {
  sessionId?: string;
  session?: LiveSessionRecord | null;
  draftLandingPage?: LandingPageConfig | null;
  previewMode?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  overrideTitle?: string;
  overrideUrl?: string;
};

const API_ORIGIN = getApiOrigin();

const emptyForm = (): LeadFormState => ({
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "",
});

const resolveLandingPage = (
  session: LiveSessionRecord | null,
  draftLandingPage?: LandingPageConfig | null,
  overrideTitle?: string
) => {
  const base = session?.landingPage || {};
  return {
    heroImage:
      draftLandingPage?.heroImage ||
      base.heroImage ||
      session?.imageUrl ||
      session?.thumbnail ||
      "/images/live-class.jpg",
    headline:
      draftLandingPage?.headline ||
      base.headline ||
      overrideTitle ||
      session?.title ||
      "Live Session Landing Page",
    subheadline:
      draftLandingPage?.subheadline ||
      base.subheadline ||
      session?.subtitle ||
      session?.description ||
      "Register your interest and get session updates in one place.",
    bodyContent:
      draftLandingPage?.bodyContent ||
      base.bodyContent ||
      session?.description ||
      "This landing page is designed to capture leads for your live session and guide prospects into the right funnel.",
    authorName:
      draftLandingPage?.authorName ||
      base.authorName ||
      session?.instructor ||
      "IICPA Faculty",
    authorCode: draftLandingPage?.authorCode || base.authorCode || "IICPA",
    authorText:
      draftLandingPage?.authorText ||
      base.authorText ||
      "Trusted by learners looking for practical finance and accounting guidance.",
    ctaText: draftLandingPage?.ctaText || base.ctaText || "Get Free Preview",
    formHeading:
      draftLandingPage?.formHeading || base.formHeading || "Enroll Now",
    formDescription:
      draftLandingPage?.formDescription ||
      base.formDescription ||
      "Share your details and we will connect you with the right live session team.",
    formLabel: draftLandingPage?.formLabel || base.formLabel || "Lead Form",
    thankYouText:
      draftLandingPage?.thankYouText ||
      base.thankYouText ||
      "Thank you. Our team will contact you shortly.",
  };
};

function LiveSessionLandingPage({
  sessionId,
  session: incomingSession = null,
  draftLandingPage = null,
  previewMode = false,
  showHeader = true,
  showFooter = true,
  className = "",
  overrideTitle,
  overrideUrl,
}: LiveSessionLandingPageProps) {
  const [session, setSession] = useState<LiveSessionRecord | null>(
    incomingSession
  );
  const [loading, setLoading] = useState(Boolean(sessionId && !incomingSession));
  const [error, setError] = useState("");
  const [form, setForm] = useState<LeadFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSession(incomingSession);
  }, [incomingSession]);

  useEffect(() => {
    if (!sessionId || incomingSession) return;

    let cancelled = false;
    const loadSession = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_ORIGIN}/api/live-sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error("Landing page session not found");
        }
        const data = await response.json();
        if (!cancelled) {
          setSession(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load page");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [incomingSession, sessionId]);

  const landingPage = useMemo(
    () => resolveLandingPage(session, draftLandingPage, overrideTitle),
    [session, draftLandingPage, overrideTitle]
  );

  const leadUrl = overrideUrl || (typeof window !== "undefined" ? window.location.href : "");
  const bodyParagraphs = landingPage.bodyContent
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const heroHeadlineWords = (landingPage.headline || session?.title || "Live Session")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const heroPrimaryText =
    heroHeadlineWords.length > 2
      ? heroHeadlineWords.slice(0, 2).join(" ")
      : heroHeadlineWords.join(" ") || "Live Session";
  const heroSecondaryText =
    heroHeadlineWords.length > 2
      ? heroHeadlineWords.slice(2).join(" ")
      : landingPage.subheadline || "Landing Page";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (previewMode) return;

    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim();
    const cleanPhone = form.phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      Swal.fire(
        "Missing details",
        "Please enter your name, email, and phone number.",
        "warning"
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        message:
          form.message.trim() ||
          `Landing page enquiry for ${landingPage.headline}`,
        type: "live-session-landing",
        source: "live-session-landing-page",
        course: session?.title || "",
        landingPageSessionId: session?._id || sessionId || "",
        landingPageUrl: leadUrl,
        landingPageTitle: landingPage.headline,
      };

      const response = await fetch(`${API_ORIGIN}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to submit enquiry");
      }

      setSubmitted(true);
      setForm(emptyForm());
      Swal.fire("Success", landingPage.thankYouText, "success");
    } catch (err) {
      Swal.fire(
        "Error",
        err instanceof Error ? err.message : "Unable to submit enquiry",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        {showHeader ? <Header forceVisible showMarquee={false} /> : null}
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-slate-600 shadow-sm">
            Loading landing page...
          </div>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        {showHeader ? <Header forceVisible showMarquee={false} /> : null}
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-red-700 shadow-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#eef4fb] text-slate-900 ${className}`}>
      {showHeader ? (
        <Header
          forceVisible
          showMarquee={false}
          simple
          rightText="Live Session Landing Page"
        />
      ) : null}

      <main className="w-full">
        <section className="overflow-hidden bg-white">
          <div className="relative w-full">
            <div className="relative aspect-[2400/1050] w-full overflow-hidden bg-slate-200">
              <img
                src={landingPage.heroImage}
                alt={landingPage.headline}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25" />

              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 text-center">
                  <div className="inline-flex flex-wrap items-stretch overflow-hidden rounded-lg shadow-[0_16px_40px_rgba(15,23,42,0.25)]">
                    <span className="bg-sky-800 px-4 py-2 text-xl font-extrabold leading-none text-white md:px-6 md:py-3 md:text-4xl">
                      {heroPrimaryText}
                    </span>
                    <span className="bg-orange-500 px-4 py-2 text-xl font-extrabold leading-none text-white md:px-6 md:py-3 md:text-4xl">
                      {heroSecondaryText}
                    </span>
                  </div>
                  <div className="inline-flex flex-wrap items-stretch overflow-hidden rounded-lg shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
                    <span className="bg-sky-800 px-4 py-2 text-base font-bold leading-none text-white md:px-6 md:py-3 md:text-xl">
                      {landingPage.formLabel || "IICPA"}
                    </span>
                    <span className="bg-orange-500 px-4 py-2 text-base font-bold leading-none text-white md:px-6 md:py-3 md:text-xl">
                      {landingPage.ctaText || "Get Free Preview"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 px-4 pb-5 md:px-8 md:pb-8">
                <div className="mx-auto max-w-5xl rounded-2xl bg-slate-900/80 px-5 py-4 text-white backdrop-blur-sm">
                  <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white p-2">
                      <img
                        src="/images/logo.png"
                        alt="IICPA Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-sm leading-7 text-white/90 md:text-base">
                      {landingPage.subheadline ||
                        bodyParagraphs[0] ||
                        "A clean landing page that captures interest and guides visitors into the right follow-up flow."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 border-t border-slate-100 lg:grid-cols-[1fr_0.95fr]">
            <div className="bg-[#f9fbfe] px-5 py-6 md:px-8 md:py-8">
              <div className="space-y-5">
                <div className="rounded-[1.5rem] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Author
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {landingPage.authorName}
                  </p>
                  <div className="mt-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    {landingPage.authorCode}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {landingPage.authorText}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    What you will see
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                    {bodyParagraphs.slice(0, 3).map((paragraph, index) => (
                      <p key={`${index}-${paragraph}`}>{paragraph}</p>
                    ))}
                    {!bodyParagraphs.length ? (
                      <p>
                        {session?.description ||
                          "This landing page is designed to capture leads and route them into the right follow-up flow."}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 md:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-[1.5rem] bg-white p-5 md:p-7">
                <div className="mx-auto mb-4 w-full max-w-[340px] rounded-none bg-[#175a84] px-6 py-5 text-center text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
                  <p className="text-lg font-medium">
                    {landingPage.formHeading}
                  </p>
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  {landingPage.formDescription}
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Name *
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, name: e.target.value }))
                      }
                      className="w-full rounded-none border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, email: e.target.value }))
                      }
                      className="w-full rounded-none border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500"
                      placeholder="Your email"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, phone: e.target.value }))
                      }
                      className="w-full rounded-none border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Company / Institute
                    </label>
                    <input
                      value={form.company}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, company: e.target.value }))
                      }
                      className="w-full rounded-none border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500"
                      placeholder="Optional"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={previewMode || submitting}
                    className="mt-2 w-full rounded-none bg-[#f4a261] px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#ef9552] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {previewMode
                      ? "Preview only"
                      : submitting
                      ? "Submitting..."
                      : landingPage.ctaText}
                  </button>

                  {submitted ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {landingPage.thankYouText}
                    </div>
                  ) : null}
                </form>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-[#0f8fb3] px-5 py-8 text-white md:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm leading-8 text-white/90 md:text-base">
                {landingPage.authorText ||
                  "This page is optimized for clean lead capture, strong trust signals, and a simple next step for visitors."}
              </p>
            </div>
          </div>
        </section>
      </main>

      {showFooter ? <Footer /> : null}
    </div>
  );
}

export default LiveSessionLandingPage;
