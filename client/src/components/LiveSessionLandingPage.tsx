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
      draftLandingPage?.formHeading || base.formHeading || "Start your enquiry",
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
    <div className={`min-h-screen bg-[#f6f8fc] text-slate-900 ${className}`}>
      {showHeader ? <Header forceVisible showMarquee={false} /> : null}

      <main className="overflow-hidden">
        <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-cyan-400 blur-3xl" />
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-orange-500 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 md:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                IICPA Live Session
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                  {landingPage.headline}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/80 md:text-lg">
                  {landingPage.subheadline}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                    Author
                  </p>
                  <p className="mt-2 text-2xl font-bold">{landingPage.authorName}</p>
                  <div className="mt-3 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {landingPage.authorCode}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    {landingPage.authorText}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                    Session
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {session?.title || "Live Session"}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    {bodyParagraphs[0] || "Lead capture page for live session promotion."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white p-4 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
              <div className="overflow-hidden rounded-[1.5rem]">
                <img
                  src={landingPage.heroImage}
                  alt={landingPage.headline}
                  className="h-56 w-full object-cover md:h-64"
                />
              </div>

              <div className="-mt-10 rounded-[1.5rem] bg-white px-5 pb-5 pt-12">
                <div className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {landingPage.formLabel}
                </div>
                <h2 className="mt-4 text-2xl font-bold">{landingPage.formHeading}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
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
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
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
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
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
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
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
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, message: e.target.value }))
                      }
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
                      placeholder="Tell us what you are looking for"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={previewMode || submitting}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
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
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
                What this page covers
              </p>
              <div className="mt-4 space-y-4 text-sm leading-8 text-slate-600">
                {bodyParagraphs.map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Lead capture focus
              </p>
              <h3 className="mt-3 text-2xl font-bold">Built for Google lead generation</h3>
              <p className="mt-3 text-sm leading-8 text-white/70">
                The form captures name, email, phone, and optional context so your team can follow up on session interest quickly.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-white/80">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Captures live-session interest from a shareable public URL
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Tags submissions for the existing lead pipeline
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Reuses the same content for admin preview and public publish
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showFooter ? <Footer /> : null}
    </div>
  );
}

export default LiveSessionLandingPage;
