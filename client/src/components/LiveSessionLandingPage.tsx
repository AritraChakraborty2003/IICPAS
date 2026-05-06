"use client";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { getApiOrigin } from "@/lib/apiBase";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Script from "next/script";
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
  authorProfiles?: Array<{
    image?: string;
    name?: string;
    code?: string;
    text?: string;
  }>;
  authorLayout?: "stack" | "two-per-line";
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
  adminPreviewAction?: ReactNode;
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

const buildAuthorProfile = (
  profile: Partial<{
    image?: string;
    name?: string;
    code?: string;
    text?: string;
    authorImage?: string;
    authorName?: string;
    authorCode?: string;
    authorText?: string;
  }> = {},
  fallback: {
    image?: string;
    name?: string;
    code?: string;
    text?: string;
  } = {}
) => ({
  image: profile.image || profile.authorImage || fallback.image || "",
  name: profile.name || profile.authorName || fallback.name || "",
  code: profile.code || profile.authorCode || fallback.code || "IICPA",
  text: profile.text || profile.authorText || fallback.text || "",
});

const normalizeAuthorProfiles = (
  landingPage: LandingPageConfig | Record<string, any> = {},
  session: LiveSessionRecord | null = null
) => {
  const fallback = {
    image:
      landingPage.authorImage ||
      session?.imageUrl ||
      session?.thumbnail ||
      "",
    name: landingPage.authorName || session?.instructor || "",
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

const resolveLandingPage = (
  session: LiveSessionRecord | null,
  draftLandingPage?: LandingPageConfig | null,
  overrideTitle?: string
) => {
  const base = session?.landingPage || {};
  const authorProfiles = normalizeAuthorProfiles(
    draftLandingPage || base,
    session
  );
  const firstProfile = authorProfiles[0] || buildAuthorProfile();
  return {
    heroImage:
      draftLandingPage?.heroImage ||
      base.heroImage ||
      session?.imageUrl ||
      session?.thumbnail ||
      "/images/live-class.jpg",
    authorImage: firstProfile.image,
    authorProfiles,
    authorLayout:
      draftLandingPage?.authorLayout === "two-per-line" ||
      base.authorLayout === "two-per-line"
        ? "two-per-line"
        : "stack",
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
    authorName: firstProfile.name || "IICPA Faculty",
    authorCode: firstProfile.code || "IICPA",
    authorText:
      firstProfile.text ||
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
  adminPreviewAction,
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
  const authorProfiles = landingPage.authorProfiles?.length
    ? landingPage.authorProfiles
    : normalizeAuthorProfiles(landingPage, session);
  const authorGridClass =
    landingPage.authorLayout === "two-per-line"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
      : "grid grid-cols-1 gap-4";
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
    <div className={`min-h-screen bg-[#eef4fb] text-slate-900 ${pageTopPadding} ${className}`}>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      {showHeader ? (
        <Header
          forceVisible
          showMarquee={false}
          simple
        />
      ) : null}

      <aside
        className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 md:flex"
        aria-label="Social media links"
      >
        <div className="pointer-events-auto overflow-hidden rounded-l-2xl border border-slate-200/80 bg-white/90 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            {SOCIAL_LINK_META.map(({ key, label, icon: Icon, bgClass }) => {
              const href =
                landingPage.socialLinks?.[key] ||
                DEFAULT_SOCIAL_LINKS[key];
              if (!href) return null;
              return (
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
              );
            })}
          </div>
        </div>
      </aside>

      <main className="w-full">
        <section className="overflow-hidden bg-white">
          <div className="relative w-full">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-200 sm:aspect-[2400/1050]">
              <img
                src={landingPage.heroImage}
                alt={landingPage.headline}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 flex items-center justify-center px-4 sm:justify-start sm:px-10 lg:px-16">
                <div className="mx-auto w-full max-w-[94vw] sm:mx-0 sm:max-w-5xl">
                  <div className="hidden sm:flex sm:flex-col sm:items-start sm:gap-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/12 px-4 py-2 text-sm font-medium text-emerald-100 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      {landingPage.ctaText || "Get Free Preview"}
                    </div>
                  </div>

                  {adminPreviewAction ? (
                    <div className="mt-4 flex justify-center sm:justify-start">
                      {adminPreviewAction}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-0 border-t border-slate-100 lg:mt-0 lg:grid-cols-[1fr_0.95fr]">
            <div className="bg-[#f9fbfe] px-5 py-6 md:px-8 md:py-8">
              <div className="space-y-5">
                <div className="rounded-[1.75rem] border border-emerald-500/15 bg-[#1f6b93] px-5 py-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:px-6 sm:py-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <div className="inline-flex rounded-full bg-[#0f4f72] px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-white sm:text-[11px]">
                      {landingPage.formLabel || "Workshop Registration Form"}
                    </div>
                    <div className="inline-flex rounded-full bg-emerald-400 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-white sm:text-[11px]">
                      {landingPage.ctaText || "Register Now @ ₹19"}
                    </div>
                  </div>
                  <h1 className="max-w-4xl text-left text-3xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-4xl lg:text-[3rem]">
                    {landingPage.headline}
                  </h1>
                  {landingPage.subheadline ? (
                    <p className="mt-3 max-w-4xl text-left text-sm leading-6 text-white/92 sm:text-base sm:leading-7">
                      {landingPage.subheadline}
                    </p>
                  ) : null}
                </div>

                <div className={authorGridClass}>
                  {authorProfiles.map((profile, index) => {
                    const profileImage = profile.image || authorImage;
                    return (
                      <div key={`${profile.name || "profile"}-${index}`} className="rounded-[1.2rem] bg-white p-3.5 sm:p-4">
                        <div className="mt-0 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                          <div className="mx-auto h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:mx-0 sm:h-20 sm:w-20">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt={profile.name || "CA profile"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-emerald-100 text-sm font-bold text-slate-500">
                                CA
                              </div>
                            )}
                          </div>

                          <div className="text-center sm:text-left">
                            <p className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
                              {profile.name || "CA Name"}
                            </p>
                            <div className="mt-1.5 inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-semibold text-sky-800 sm:text-[10px]">
                              {profile.code || "CA"}
                            </div>
                            <p
                              className="mt-1.5 text-[10px] leading-4 text-slate-600 sm:text-[11px] sm:leading-5"
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                                overflow: "hidden",
                              }}
                            >
                              {profile.text ||
                                "Short CA description or trust statement."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[1.5rem] bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-600">
                    About this session
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                    {bodyParagraphs.map((paragraph, index) => (
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

            <div className="bg-white px-4 py-5 md:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-[1.35rem] border border-slate-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] md:p-7 md:shadow-none">
                <div className="mx-auto mb-4 w-full max-w-full rounded-[1rem] bg-[#175a84] px-5 py-3.5 text-center text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] sm:max-w-[340px] sm:rounded-none sm:px-6 sm:py-5">
                  <p className="text-base font-semibold tracking-[-0.02em] sm:text-lg sm:font-medium">
                    {landingPage.formHeading}
                  </p>
                </div>

                <p className="text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-7">
                  {landingPage.formDescription}
                </p>

                <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:mb-2 sm:text-sm">
                      Name *
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, name: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:rounded-none sm:bg-white sm:py-3"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:mb-2 sm:text-sm">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, email: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:rounded-none sm:bg-white sm:py-3"
                      placeholder="Your email"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:mb-2 sm:text-sm">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, phone: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:rounded-none sm:bg-white sm:py-3"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:mb-2 sm:text-sm">
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:rounded-none sm:bg-white sm:py-3"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:mb-2 sm:text-sm">
                      Company / Institute
                    </label>
                    <input
                      value={form.company}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, company: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:rounded-none sm:bg-white sm:py-3"
                      placeholder="Optional"
                    />
                  </div>

                  {/* Receive notifications checkbox */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:bg-slate-100 sm:px-4 sm:py-3">
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
                    <span className="text-[13px] leading-snug text-slate-700 sm:text-sm">
                      Receive latest notifications &amp; updates about this session via WhatsApp / Email
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={previewMode || paying || submitting}
                    className="mt-4 w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-none sm:font-semibold sm:shadow-none"
                    onClick={handlePayNow}
                  >
                    {previewMode
                      ? "Register Now"
                      : paying || submitting
                      ? "Processing..."
                      : registerNowLabel}
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
                    {[
                      { label: "UPI", className: "border-slate-200 text-slate-700" },
                      { label: "VISA", className: "border-blue-200 text-blue-700" },
                      {
                        label: "Mastercard",
                        className: "border-orange-200 text-orange-600",
                      },
                      { label: "RuPay", className: "border-indigo-200 text-indigo-700" },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className={`inline-flex items-center rounded-full border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${item.className}`}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>

                  {submitted ? (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {landingPage.thankYouText}
                      </div>

                      {bookingId ? (
                        <a
                          href={`${API_ORIGIN}/api/test-payment/receipts/booking/${bookingId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 sm:rounded-none sm:font-bold sm:uppercase sm:tracking-wide"
                        >
                          ⬇ Download Invoice / Receipt
                        </a>
                      ) : null}

                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Send confirmation to enrollee
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={`https://wa.me/${form.whatsappNumber || form.phone}?text=${encodeURIComponent(`Hi ${form.name},\nYour enrollment for *${session?.title || landingPage.headline}* is confirmed! 🎉\n\nThank you for enrolling with IICPA Institute. Our team will reach out shortly with session details.\n\nFor any queries, reply to this message.\n\n— IICPA Institute`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 rounded-xl border border-emerald-600 bg-white px-3 py-2 text-center text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:rounded-none"
                        >
                          📲 WhatsApp
                        </a>
                        <a
                          href={`mailto:${form.email}?subject=${encodeURIComponent(`Enrollment Confirmed – ${session?.title || landingPage.headline}`)}&body=${encodeURIComponent(`Hi ${form.name},\n\nYour enrollment for "${session?.title || landingPage.headline}" is confirmed!\n\nThank you for enrolling with IICPA Institute. Our team will reach out shortly with session details and your joining link.\n\nFor invoice/receipt, please visit your student dashboard or reply to this email.\n\nWarm regards,\nIICPA Institute Team`)}`}
                          className="flex-1 rounded-xl border border-sky-600 bg-white px-3 py-2 text-center text-xs font-semibold text-sky-700 transition hover:bg-sky-50 sm:rounded-none"
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
