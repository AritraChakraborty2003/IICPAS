"use client";

import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Phone,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  BriefcaseBusiness,
  UserCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiBase } from "@/lib/apiBase";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;
const CHATBOT_OPEN_EVENT = "iicpa:open-chatbot";
const CHATBOT_OPEN_SESSION_KEY = "iicpa_chatbot_open_pending";

const normalizePhoneNumber = (value: string) =>
  value.replace(/\D/g, "").slice(0, 10);

export default function HomepageWhatsAppGate() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [intent, setIntent] = useState<"hire" | "learn" | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const leadRecordIdRef = useRef<string | null>(null);
  const leadRecordSignatureRef = useRef("");

  const apiBase = useMemo(() => getApiBase(), []);
  const leadApiBase = useMemo(() => `${apiBase}/leads`, [apiBase]);

  useEffect(() => {
    if (step === "otp") {
      otpInputRef.current?.focus();
      return;
    }

    phoneInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [secondsLeft]);

  // Bypass gate if student or admin is already logged in
  useEffect(() => {
    const checkLoginState = async () => {
      if (typeof window === "undefined") return;

      // 0. Check session storage first
      const isSessionVerified = sessionStorage.getItem("iicpa_whatsapp_verified") === "true";
      if (isSessionVerified) {
        setIsVerified(true);
        return;
      }

      // 1. Check if admin / superadmin is logged in
      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) {
        setIsVerified(true);
        return;
      }

      // 2. Check if student is logged in
      try {
        const response = await axios.get(`${apiBase}/v1/students/isstudent`, {
          withCredentials: true,
          validateStatus: (status) => status === 200 || status === 401,
        });
        if (response.status === 200 && response.data?.student) {
          setIsVerified(true);
        }
      } catch (error) {
        console.warn("HomepageWhatsAppGate: Auth check skipped/failed", error);
      }
    };

    void checkLoginState();
  }, [apiBase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpenGate = () => {
      setIsOpen(true);
    };
    window.addEventListener("iicpa:open-whatsapp-gate", handleOpenGate);
    return () => {
      window.removeEventListener("iicpa:open-whatsapp-gate", handleOpenGate);
    };
  }, []);

  const canSendOtp = phone.length === 10 && !sendingOtp && secondsLeft === 0;
  const canVerifyOtp =
    phone.length === 10 && otp.length === OTP_LENGTH && !verifyingOtp;

  const getIntentLabel = (currentIntent: "hire" | "learn") =>
    currentIntent === "hire" ? "Hire" : "Learn";

  const buildLeadPayload = (currentPhone: string, currentIntent: "hire" | "learn") => {
    const leadType = getIntentLabel(currentIntent);

    return {
      name: `${leadType} Lead`,
      email: "",
      phone: currentPhone,
      whatsappNumber: currentPhone,
      company: "",
      message: `${leadType} lead captured from the homepage WhatsApp gate`,
      type: leadType,
      source: "homepage-whatsapp-gate",
    };
  };

  const saveLeadRecord = async (currentPhone: string, currentIntent: "hire" | "learn") => {
    const leadPayload = buildLeadPayload(currentPhone, currentIntent);
    const signature = JSON.stringify(leadPayload);

    if (
      leadRecordIdRef.current &&
      leadRecordSignatureRef.current === signature
    ) {
      return;
    }

    const isUpdating = Boolean(leadRecordIdRef.current);
    const response = await axios.request({
      method: isUpdating ? "put" : "post",
      url: isUpdating ? `${leadApiBase}/${leadRecordIdRef.current}` : leadApiBase,
      data: leadPayload,
    });

    const savedLead = response.data?.lead;
    if (savedLead?._id) {
      leadRecordIdRef.current = savedLead._id;
    }
    leadRecordSignatureRef.current = signature;
  };

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();

    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSendingOtp(true);
    try {
      if (intent) {
        try {
          await saveLeadRecord(phone, intent);
        } catch (leadError) {
          console.error("Failed to save homepage lead:", leadError);
        }
      }

      await axios.post(`${apiBase}/v1/students/homepage-gate/send-otp`, {
        phone,
      });
      setStep("otp");
      setOtp("");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      toast.success("OTP sent on WhatsApp");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to send WhatsApp OTP"
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();

    if (phone.length !== 10) {
      toast.error("Please enter a valid phone number.");
      setStep("phone");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await axios.post(
        `${apiBase}/v1/students/homepage-gate/verify-otp`,
        {
          phone,
          otp,
        }
      );

      if (!response.data?.verified) {
        throw new Error("Verification failed");
      }

      setIsVerified(true);
      try {
        window.sessionStorage.setItem(CHATBOT_OPEN_SESSION_KEY, "true");
        window.sessionStorage.setItem("iicpa_whatsapp_verified", "true");
      } catch (storageError) {
        console.error("Error storing chatbot open state:", storageError);
      }
      window.dispatchEvent(new Event(CHATBOT_OPEN_EVENT));
      toast.success(response.data?.message || "Verification successful");

      const targetUrl = window.sessionStorage.getItem("iicpa_whatsapp_target_url");
      if (targetUrl) {
        window.sessionStorage.removeItem("iicpa_whatsapp_target_url");
        window.location.href = targetUrl;
      } else {
        setIsOpen(false);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "OTP verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(normalizePhoneNumber(value));
  };

  const handleChooseIntent = (nextIntent: "hire" | "learn") => {
    setIntent(nextIntent);
    setStep("phone");
    setPhone("");
    setOtp("");
  };

  const handleBackToChoice = () => {
    setIntent(null);
    setStep("phone");
    setPhone("");
    setOtp("");
    setSecondsLeft(0);
  };

  if (!isOpen || isVerified || isDismissed) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/12 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="homepage-whatsapp-gate-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-[92vw] max-w-[620px] overflow-hidden rounded-[28px] border border-white/15 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close verification modal"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="bg-gradient-to-r from-[#0f5132] via-[#16a34a] to-[#22c55e] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/75">
                IICPA Access
              </p>
              <h2
                id="homepage-whatsapp-gate-title"
                className="mt-1 text-2xl font-semibold"
              >
                {intent === "hire"
                  ? "Hire Top Finance Talents"
                  : intent === "learn"
                    ? "Upgrade skills for high-salary jobs"
                    : "Choose your path"}
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-[26rem] text-sm text-white/80">
            {intent === "hire"
              ? "Start hiring with IICPA and unlock qualified talent through WhatsApp verification."
              : intent === "learn"
                ? "Explore job-ready skills and continue with WhatsApp verification."
                : "Select the card that matches what you want to do."}
          </p>
        </div>

        <div className="p-6 sm:p-7">
          {!intent ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleChooseIntent("hire")}
                  className="group overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between bg-gradient-to-r from-[#0f5132] to-[#16a34a] px-4 py-4 text-white">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                        Employers
                      </p>
                      <h3 className="mt-1 max-w-[11rem] text-[0.95rem] font-semibold leading-tight sm:text-[1.1rem]">
                        Hire Top Finance
                        <span className="block">Talents</span>
                      </h3>
                    </div>
                    <BriefcaseBusiness className="h-7 w-7 text-white/90" />
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm leading-6 text-slate-600">
                      Find vetted talent, post openings, and hire faster with
                      trusted support.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      Continue
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleChooseIntent("learn")}
                  className="group overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between bg-gradient-to-r from-[#16a34a] to-[#22c55e] px-4 py-4 text-white">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                        Job seekers
                      </p>
                      <h3 className="mt-1 max-w-[10rem] text-[0.95rem] font-semibold leading-tight sm:text-[1.1rem]">
                        Upgrade Skills
                        <span className="block">for High Salary Jobs</span>
                      </h3>
                    </div>
                    <UserCheck className="h-6 w-6 text-white/90" />
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-[13px] leading-5 text-slate-600">
                      Learn in-demand skills, build visibility, and get verified quickly.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
                      Continue
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              </div>

              <p className="pt-1 text-center text-xs leading-5 text-slate-500">
                Select one option to continue with WhatsApp verification.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                <span className={step === "phone" ? "text-emerald-700" : ""}>
                  Phone
                </span>
                <span className="h-px flex-1 mx-3 bg-slate-200" />
                <span className={step === "otp" ? "text-emerald-700" : ""}>
                  OTP
                </span>
              </div>

              <form onSubmit={step === "phone" ? handleSendOtp : handleVerifyOtp}>
                {step === "phone" ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      Phone number
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!canSendOtp}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {sendingOtp ? "Sending OTP..." : "Send WhatsApp OTP"}
                      {!sendingOtp && <ArrowRight className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToChoice}
                      className="w-full text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
                    >
                      Back to options
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        OTP sent to
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        +91 {phone}
                      </p>
                    </div>

                    <label className="block text-sm font-semibold text-slate-700">
                      Enter OTP
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <Smartphone className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        ref={otpInputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={OTP_LENGTH}
                        value={otp}
                        onChange={(e) =>
                          setOtp(
                            e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)
                          )
                        }
                        placeholder="Enter 6-digit OTP"
                        className="w-full bg-transparent text-base tracking-[0.35em] text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("phone");
                          setOtp("");
                        }}
                        className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                      >
                        Change number
                      </button>
                      <button
                        type="button"
                        disabled={secondsLeft > 0 || sendingOtp}
                        onClick={async () => {
                          if (phone.length !== 10) {
                            toast.error("Please enter a valid 10-digit mobile number.");
                            setStep("phone");
                            return;
                          }

                          setSendingOtp(true);
                          try {
                            await axios.post(
                              `${apiBase}/v1/students/homepage-gate/send-otp`,
                              { phone }
                            );
                            setSecondsLeft(RESEND_COOLDOWN_SECONDS);
                            toast.success("OTP resent on WhatsApp");
                          } catch (error: any) {
                            toast.error(
                              error?.response?.data?.message ||
                              "Failed to resend WhatsApp OTP"
                            );
                          } finally {
                            setSendingOtp(false);
                          }
                        }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        <RefreshCw className="h-4 w-4" />
                        {secondsLeft > 0
                          ? `Resend in ${secondsLeft}s`
                          : sendingOtp
                            ? "Resending..."
                            : "Resend OTP"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={!canVerifyOtp}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {verifyingOtp ? "Verifying..." : "Verify OTP"}
                      {!verifyingOtp && <ShieldCheck className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToChoice}
                      className="w-full text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
                    >
                      Back to options
                    </button>
                  </div>
                )}
              </form>

              <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                We use WhatsApp OTP to keep access secure and fast.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
