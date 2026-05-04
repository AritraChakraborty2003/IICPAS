"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { getApiOrigin } from "@/lib/apiBase";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";

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
  price?: number | string;
  imageUrl?: string;
  thumbnail?: string;
  category?: string;
  landingPage?: LandingPageConfig;
};

type LeadFormState = {
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  company: string;
  message: string;
  receiveNotifications: boolean;
};

type NormalizedLeadValues = {
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  company: string;
  message: string;
};

type ValidationResult = NormalizedLeadValues | { error: string };

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
  whatsappNumber: "",
  company: "",
  message: "",
  receiveNotifications: true,
});

const MOBILE_NUMBER_REGEX = /^[6-9]\d{9}$/;
const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/i;

const normalizeMobileNumber = (value: string) =>
  value.replace(/\D/g, "").slice(0, 10);

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
      "Live Session",
    subheadline:
      draftLandingPage?.subheadline ||
      base.subheadline ||
      session?.subtitle ||
      session?.description ||
      "Register your interest and get updates.",
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

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61581453864987",
    icon: FaFacebook,
    bgClass: "bg-[#1877f2]",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/iicpa-institute",
    icon: FaLinkedin,
    bgClass: "bg-[#0a66c2]",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/iicpainstitute",
    icon: FaInstagram,
    bgClass: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@iicpainstitute",
    icon: FaYoutube,
    bgClass: "bg-[#ff0000]",
  },
  {
    label: "Twitter",
    href: "https://twitter.com/iicpainstitute",
    icon: FaTwitter,
    bgClass: "bg-[#111827]",
  },
] as const;

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
  const [paying, setPaying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const lastSavedLeadSignatureRef = useRef("");

  useEffect(() => {
    setSession(incomingSession);
  }, [incomingSession]);

  useEffect(() => {
    lastSavedLeadSignatureRef.current = "";
    setSubmitted(false);
  }, [sessionId]);

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
  const sessionPrice = Number(session?.price || 0);
  const payNowLabel = Number.isFinite(sessionPrice) && sessionPrice > 0
    ? `Pay Now ₹${sessionPrice.toLocaleString("en-IN")}`
    : "Enroll Now";

  const normalizeFormValues = (): ValidationResult => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = normalizeMobileNumber(form.phone);
    const whatsappNumber = form.whatsappNumber.trim()
      ? normalizeMobileNumber(form.whatsappNumber)
      : phone;

    if (!name || !email || !phone) {
      return {
        error: "Please enter your name, email, and phone number.",
      } as const;
    }

    if (!ALLOWED_EMAIL_REGEX.test(email)) {
      return {
        error:
          "Please enter a valid email address like user@gmail.com or info@company.com.",
      } as const;
    }

    if (!MOBILE_NUMBER_REGEX.test(phone)) {
      return {
        error:
          "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
      } as const;
    }

    if (form.whatsappNumber.trim() && !MOBILE_NUMBER_REGEX.test(whatsappNumber)) {
      return {
        error:
          "Please enter a valid 10-digit WhatsApp number starting with 6, 7, 8, or 9.",
      } as const;
    }

    return {
      name,
      email,
      phone,
      whatsappNumber,
      company: form.company.trim(),
      message: form.message.trim(),
    } as const;
  };

  const buildLeadPayload = (values: NormalizedLeadValues) => ({
    name: values.name,
    email: values.email,
    phone: values.phone,
    message:
      values.message || `Landing page enquiry for ${landingPage.headline}`,
    type: "live-session-landing",
    source: "live-session-landing-page",
    course: session?.title || "",
    landingPageSessionId: session?._id || sessionId || "",
    landingPageUrl: leadUrl,
    landingPageTitle: landingPage.headline,
    whatsappNumber: values.whatsappNumber,
    company: values.company,
  });

  const saveLeadRecord = async (
    values: NormalizedLeadValues,
    { force = false }: { force?: boolean } = {}
  ) => {
    const leadPayload = buildLeadPayload(values);
    const signature = JSON.stringify(leadPayload);

    if (!force && lastSavedLeadSignatureRef.current === signature) {
      return;
    }

    const response = await fetch(`${API_ORIGIN}/api/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadPayload),
    });

    if (!response.ok) {
      throw new Error("Unable to submit enquiry");
    }

    lastSavedLeadSignatureRef.current = signature;
  };

  const startPaidEnrollment = async (values: NormalizedLeadValues) => {
    const liveSessionId = session?._id || sessionId || "";
    if (!liveSessionId) {
      throw new Error("Live session is not available for payment");
    }

    if (!Number.isFinite(sessionPrice) || sessionPrice <= 0) {
      return;
    }

    if (!(window as any).Razorpay) {
      throw new Error("Razorpay checkout is not available right now");
    }

    const orderResponse = await fetch(`${API_ORIGIN}/api/test-payment/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        liveSessionId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        whatsappNumber: values.whatsappNumber,
        price: sessionPrice,
        paymentSource: "live-session-landing-page",
      }),
    });

    const orderJson = await orderResponse.json().catch(() => null);
    const orderData = orderJson?.data;

    if (!orderResponse.ok || !orderJson?.success || !orderData?.orderId) {
      throw new Error(orderJson?.message || "Failed to create payment order");
    }

    const razorpay = new (window as any).Razorpay({
      key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "IICPA Institute",
      description: session?.title || landingPage.headline,
      order_id: orderData.orderId,
      prefill: {
        name: values.name,
        email: values.email,
        contact: values.phone,
      },
      theme: {
        color: "#16a34a",
      },
      modal: {
        ondismiss: () => {
          setPaying(false);
        },
      },
      handler: async (response: any) => {
        try {
          const verificationResponse = await fetch(
            `${API_ORIGIN}/api/test-payment/verify-and-capture`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(response),
            }
          );
          const verificationJson = await verificationResponse.json().catch(
            () => null
          );

          if (!verificationResponse.ok || !verificationJson?.success) {
            throw new Error(
              verificationJson?.message || "Payment verification failed"
            );
          }

          setSubmitted(true);
          Swal.fire(
            "Success",
            "Payment successful. Your booking is confirmed.",
            "success"
          );
        } catch (verificationError) {
          console.error("Payment verification failed:", verificationError);
          Swal.fire(
            "Error",
            verificationError instanceof Error
              ? verificationError.message
              : "Payment verification failed. Please contact support.",
            "error"
          );
        } finally {
          setPaying(false);
        }
      },
    });

    razorpay.open();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (previewMode) return;

    try {
      setSubmitting(true);
      const values = normalizeFormValues();
      if ("error" in values) {
        throw new Error(values.error);
      }
      await saveLeadRecord(values, { force: true });

      setSubmitted(true);
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

  const handlePayNow = async () => {
    if (previewMode) return;

    try {
      setPaying(true);
      const values = normalizeFormValues();
      if ("error" in values) {
        throw new Error(values.error);
      }

      await saveLeadRecord(values);

      if (!Number.isFinite(sessionPrice) || sessionPrice <= 0) {
        setSubmitted(true);
        Swal.fire("Success", landingPage.thankYouText, "success");
        return;
      }

      await startPaidEnrollment(values);
    } catch (err) {
      Swal.fire(
        "Error",
        err instanceof Error ? err.message : "Unable to start payment",
        "error"
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        {showHeader ? (
          <Header
            forceVisible
            showMarquee={false}
            simple
            rightText="Easy. Simple. Clear."
          />
        ) : null}
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
        {showHeader ? (
          <Header
            forceVisible
            showMarquee={false}
            simple
            rightText="Easy. Simple. Clear."
          />
        ) : null}
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
          rightText="Easy. Simple. Clear."
        />
      ) : null}

      <aside
        className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 md:flex"
        aria-label="Social media links"
      >
        <div className="pointer-events-auto overflow-hidden rounded-l-2xl border border-slate-200/80 bg-white/90 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon, bgClass }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Follow us on ${label}`}
                title={label}
                className={`group flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-200 hover:-translate-x-1 hover:scale-105 ${bgClass}`}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </aside>

      <main className="w-full">
        <section className="overflow-hidden bg-white">
          <div className="relative w-full">
            <div className="relative aspect-[2400/1050] w-full overflow-hidden bg-slate-200">
              <img
                src={landingPage.heroImage}
                alt={landingPage.headline}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/20" />

              <div className="absolute inset-x-0 top-[56%] -translate-y-1/2">
                <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 text-center">
                  <div className="inline-flex flex-wrap items-stretch overflow-hidden rounded-lg shadow-[0_16px_40px_rgba(15,23,42,0.25)]">
                    <span className="bg-sky-800 px-4 py-2 text-xl font-extrabold leading-none text-white md:px-6 md:py-3 md:text-4xl">
                      {heroPrimaryText}
                    </span>
                    <span className="bg-green-600 px-4 py-2 text-xl font-extrabold leading-none text-white md:px-6 md:py-3 md:text-4xl">
                      {heroSecondaryText}
                    </span>
                  </div>
                  <div className="inline-flex flex-wrap items-stretch overflow-hidden rounded-lg shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
                    <span className="bg-sky-800 px-4 py-2 text-base font-bold leading-none text-white md:px-6 md:py-3 md:text-xl">
                      {landingPage.formLabel || "IICPA"}
                    </span>
                    <span className="bg-green-600 px-4 py-2 text-sm font-bold leading-none text-white md:px-6 md:py-3 md:text-lg">
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

                <form className="mt-6 space-y-4">
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
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={form.whatsappNumber}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          whatsappNumber: e.target.value,
                        }))
                      }
                      className="w-full rounded-none border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500"
                      placeholder="Optional"
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

                  {/* Receive notifications checkbox */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={form.receiveNotifications}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          receiveNotifications: e.target.checked,
                        }))
                      }
                      className="mt-0.5 h-4 w-4 accent-emerald-600"
                    />
                    <span className="text-sm leading-snug text-slate-700">
                      Receive latest notifications &amp; updates about this session via WhatsApp / Email
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={previewMode || paying || submitting}
                    className="mt-4 w-full rounded-none bg-emerald-600 px-4 py-3 text-sm font-bold uppercase tracking-[0.10em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handlePayNow}
                  >
                    {previewMode
                      ? "Pay Now"
                      : paying || submitting
                      ? "Processing..."
                      : payNowLabel}
                  </button>

                  {submitted ? (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {landingPage.thankYouText}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Send confirmation to enrollee
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={`https://wa.me/${form.whatsappNumber || form.phone}?text=${encodeURIComponent(`Hi ${form.name},%0AYour enrollment for *${session?.title || landingPage.headline}* is confirmed!%0AThank you for enrolling. Our team will reach out shortly with the session details.%0A%0A— IICPA Institute`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 rounded-none border border-emerald-600 bg-white px-3 py-2 text-center text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          📲 WhatsApp
                        </a>
                        <a
                          href={`mailto:${form.email}?subject=${encodeURIComponent(`Enrollment Confirmed – ${session?.title || landingPage.headline}`)}&body=${encodeURIComponent(`Hi ${form.name},\n\nYour enrollment for "${session?.title || landingPage.headline}" is confirmed.\n\nOur team will reach out shortly with session details.\n\nThank you,\nIICPA Institute`)}`}
                          className="flex-1 rounded-none border border-sky-600 bg-white px-3 py-2 text-center text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                        >
                          ✉️ Email
                        </a>
                      </div>
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
