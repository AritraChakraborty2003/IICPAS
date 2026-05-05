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
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

type LandingPageConfig = {
  heroImage?: string;
  authorImage?: string;
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
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
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
    authorImage:
      draftLandingPage?.authorImage ||
      base.authorImage ||
      session?.imageUrl ||
      session?.thumbnail ||
      "",
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
    socialLinks: {
      facebook:
        draftLandingPage?.socialLinks?.facebook ??
        base.socialLinks?.facebook ??
        "",
      linkedin:
        draftLandingPage?.socialLinks?.linkedin ??
        base.socialLinks?.linkedin ??
        "",
      instagram:
        draftLandingPage?.socialLinks?.instagram ??
        base.socialLinks?.instagram ??
        "",
      youtube:
        draftLandingPage?.socialLinks?.youtube ??
        base.socialLinks?.youtube ??
        "",
      twitter:
        draftLandingPage?.socialLinks?.twitter ??
        base.socialLinks?.twitter ??
        "",
    },
  };
};

const DEFAULT_SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61581453864987",
  linkedin: "https://linkedin.com/company/iicpa-institute",
  instagram: "https://instagram.com/iicpainstitute",
  youtube: "https://youtube.com/@iicpainstitute",
  twitter: "https://twitter.com/iicpainstitute",
} as const;

const SOCIAL_LINK_META = [
  {
    key: "facebook" as const,
    label: "Facebook",
    icon: FaFacebook,
    bgClass: "bg-[#1877f2]",
  },
  {
    key: "linkedin" as const,
    label: "LinkedIn",
    icon: FaLinkedin,
    bgClass: "bg-[#0a66c2]",
  },
  {
    key: "instagram" as const,
    label: "Instagram",
    icon: FaInstagram,
    bgClass: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]",
  },
  {
    key: "youtube" as const,
    label: "YouTube",
    icon: FaYoutube,
    bgClass: "bg-[#ff0000]",
  },
  {
    key: "twitter" as const,
    label: "X",
    icon: FaXTwitter,
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
  const [bookingId, setBookingId] = useState("");
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
  const heroHeadlineText =
    (landingPage.headline || session?.title || "Live Session").trim() ||
    "Live Session";
  const authorImage = landingPage.authorImage || landingPage.heroImage;
  const sessionPrice = Number(session?.price || 0);
  const registerNowLabel =
    Number.isFinite(sessionPrice) && sessionPrice > 0
      ? `Register Now at ₹${sessionPrice.toLocaleString("en-IN")}`
      : "Register Now";
  const pageTopPadding = showHeader ? "pt-[56px] sm:pt-[64px]" : "";

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
    receiveNotifications: form.receiveNotifications,
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

          const newBookingId =
            verificationJson?.data?.bookingId ||
            verificationJson?.bookingId ||
            "";
          if (newBookingId) setBookingId(newBookingId);
          setSubmitted(true);
          Swal.fire(
            "Payment Confirmed! 🎉",
            "Your booking is confirmed. Check below to download your invoice or notify the enrollee.",
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
      <div className={`min-h-screen bg-slate-50 ${pageTopPadding} ${className}`}>
        {showHeader ? (
          <Header
            forceVisible
            showMarquee={false}
            simple
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
      <div className={`min-h-screen bg-slate-50 ${pageTopPadding} ${className}`}>
        {showHeader ? (
          <Header
            forceVisible
            showMarquee={false}
            simple
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
    <div
      className={`min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 ${pageTopPadding} ${className}`}
    >
      {showHeader ? (
        <Header
          forceVisible
          showMarquee={false}
          simple
        />
      ) : null}

      <main className="w-full">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
                <div className="relative aspect-[16/10] w-full sm:aspect-[4/3] lg:aspect-[5/3]">
                  <img
                    src={landingPage.heroImage}
                    alt={landingPage.headline}
                    className="absolute inset-0 h-full w-full object-contain object-center"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  {landingPage.formLabel || "IICPA"}
                </p>
                <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {heroHeadlineText}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  {landingPage.subheadline ||
                    bodyParagraphs[0] ||
                    "Register your interest and get updates about this live session."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#lead-form"
                  className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  {landingPage.ctaText || "Get Free Preview"}
                </a>
                {landingPage.authorName ? (
                  <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    {landingPage.authorName}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    {authorImage ? (
                      <img
                        src={authorImage}
                        alt={landingPage.authorName || "CA profile"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
                        CA
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                      CA Profile
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {landingPage.authorName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {landingPage.authorText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                  About this session
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

                <div className="mt-5 flex flex-wrap gap-2">
                  {SOCIAL_LINK_META.map(({ key, label, icon: Icon }) => {
                    const href = landingPage.socialLinks?.[key] || DEFAULT_SOCIAL_LINKS[key];
                    if (!href) return null;
                    return (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Follow us on ${label}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div id="lead-form" className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:mt-10">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                {landingPage.formHeading}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                {landingPage.formDescription}
              </p>
            </div>

            <form className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="Your email"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="Optional"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Company / Institute
                </label>
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, company: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  placeholder="Optional"
                />
              </div>

              <label className="md:col-span-2 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.receiveNotifications}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      receiveNotifications: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 accent-slate-900"
                />
                <span className="text-sm leading-6 text-slate-700">
                  Receive updates about this session by WhatsApp or email.
                </span>
              </label>

              <div className="md:col-span-2">
                <button
                  type="button"
                  disabled={previewMode || paying || submitting}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handlePayNow}
                >
                  {previewMode
                    ? "Register Now"
                    : paying || submitting
                    ? "Processing..."
                    : registerNowLabel}
                </button>
              </div>

              {submitted ? (
                <div className="md:col-span-2 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-800">
                    {landingPage.thankYouText}
                  </p>

                  {bookingId ? (
                    <a
                      href={`${API_ORIGIN}/api/test-payment/receipts/booking/${bookingId}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Download Invoice / Receipt
                    </a>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href={`https://wa.me/${form.whatsappNumber || form.phone}?text=${encodeURIComponent(`Hi ${form.name},\nYour enrollment for *${session?.title || landingPage.headline}* is confirmed!\n\nThank you for enrolling with IICPA Institute. Our team will reach out shortly with session details.\n\nFor any queries, reply to this message.\n\nIICPA Institute`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Send WhatsApp
                    </a>
                    <a
                      href={`mailto:${form.email}?subject=${encodeURIComponent(`Enrollment Confirmed - ${session?.title || landingPage.headline}`)}&body=${encodeURIComponent(`Hi ${form.name},\n\nYour enrollment for "${session?.title || landingPage.headline}" is confirmed!\n\nThank you for enrolling with IICPA Institute. Our team will reach out shortly with session details and your joining link.\n\nWarm regards,\nIICPA Institute Team`)}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Send Email
                    </a>
                  </div>
                </div>
              ) : null}
            </form>
          </div>

          <div className="mx-auto mt-8 max-w-3xl px-2 text-center text-sm leading-7 text-slate-500">
            {landingPage.authorText ||
              "This page is optimized for clean lead capture, strong trust signals, and a simple next step for visitors."}
          </div>
        </section>
      </main>

      {showFooter ? <Footer /> : null}
    </div>
  );
}

export default LiveSessionLandingPage;
