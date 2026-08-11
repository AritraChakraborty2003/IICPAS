"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, ArrowLeft, Info } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "preview" | "everify" | "dashboard";

interface ITRReg16SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-16 -> itr-reg-16 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-16";

const DEFAULT_NAME = "Akhil Sharma";
const DEFAULT_PAN = "AKSPA3663B";
const DEFAULT_ASSESSMENT_YEAR = "2024-25";
const DEFAULT_EMAIL = "akhilsharma@gmail.com";
const DEFAULT_OTP = "363639";
const ITR_TYPE = "ITR-1";

const stepperItems = ["Validate Return", "Confirm your Return Summary", "Verify and Submit"];
const verifySubSteps = ["Preview and Submit", "Verify your Return"];

const verificationOptions = [
  { value: "otp-mobile-aadhaar", label: "I would like to verify using OTP on mobile number registered with Aadhaar" },
  { value: "dsc", label: "I would like to verify using Digital Signature Certificate (DSC)" },
];

const evcOptions = [
  { value: "evc-net-banking", label: "Through Net Banking" },
  { value: "evc-bank-account", label: "Through Bank Account" },
  { value: "evc-demat", label: "Through Demat Account" },
];

const existingCodeOptions = [
  { value: "evc-existing", label: "I already have an Electronic Verification Code (EVC)" },
  { value: "otp-existing", label: "I already have an OTP on Mobile number registered with Aadhaar" },
];

const footerLinks = [
  "Feedback",
  "Website Policies",
  "Accessibility Statement",
  "Site Map",
  "Browser Support",
  "CoBrowse Help",
];

export default function ITRReg16Simulation({ onComplete }: ITRReg16SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const assessmentYear = findFieldValue(simConfig, /assessment/i) || DEFAULT_ASSESSMENT_YEAR;
  const email = findFieldValue(simConfig, /email/i) || DEFAULT_EMAIL;
  const expectedOtp = findFieldValue(simConfig, /otp/i) || DEFAULT_OTP;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("preview");

  const [selectedVerification, setSelectedVerification] = useState("otp-mobile-aadhaar");
  const [everifyError, setEverifyError] = useState("");

  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [agreeAadhaar, setAgreeAadhaar] = useState(false);
  const [aadhaarModalError, setAadhaarModalError] = useState("");

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const resetAll = () => {
    setStep("preview");
    setSelectedVerification("otp-mobile-aadhaar");
    setEverifyError("");
    setShowAadhaarModal(false);
    setAgreeAadhaar(false);
    setAadhaarModalError("");
    setShowOtpModal(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
  };

  const handleProceedToVerification = () => {
    setStep("everify");
  };

  const handleEverifyContinue = () => {
    if (selectedVerification !== "otp-mobile-aadhaar") {
      setEverifyError(
        "This mode of verification is not available in this simulation. Please select “I would like to verify using OTP on mobile number registered with Aadhaar” to continue."
      );
      return;
    }
    setEverifyError("");
    setAgreeAadhaar(false);
    setAadhaarModalError("");
    setShowAadhaarModal(true);
  };

  const handleGenerateAadhaarOtp = () => {
    if (!agreeAadhaar) {
      setAadhaarModalError("Please agree to validate your Aadhaar Details to continue.");
      return;
    }
    setAadhaarModalError("");
    setShowAadhaarModal(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
    setShowOtpModal(true);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setOtpError("");
    if (digit && index < otpDigits.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleValidateOtp = () => {
    const enteredOtp = otpDigits.join("");
    if (enteredOtp.length < 6) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }
    if (requireCredentialValidation && enteredOtp !== expectedOtp.trim()) {
      setOtpError("Incorrect OTP entered. Please check the OTP provided in the experiment brief and try again.");
      return;
    }
    setOtpError("");
    setShowOtpModal(false);
    setStep("dashboard");
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
    resetAll();
  };

  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans antialiased flex flex-col select-none relative">
      {/* START EXPERIMENT OVERLAY */}
      {!isExperimentStarted && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-[1.5px] z-40 flex items-center justify-center">
          <button
            onClick={() => setIsExperimentStarted(true)}
            className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white px-8 py-3.5 rounded font-bold uppercase tracking-wider text-sm shadow-md hover:scale-105 transition-all cursor-pointer z-50"
          >
            Start Experiment
          </button>
        </div>
      )}

      {/* SUCCESS OVERLAY (GREEN TICK & RETURN BUTTON) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] animate-fadeIn">
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_15px_45px_rgba(71,198,90,0.4)] animate-scaleIn">
              <CheckCircle2 className="text-white" size={90} strokeWidth={2.5} />
            </div>
            <p className="text-white font-bold text-[15px]">Your return has been e-Verified successfully!</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReturn}
                className="inline-flex items-center gap-2 rounded-md bg-[#0f3a9a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(15,58,154,0.35)] transition-all hover:bg-[#0a2558] hover:scale-105 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AADHAAR OTP CONSENT MODAL */}
      {showAadhaarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
          <div className="w-full max-w-md bg-white rounded shadow-2xl">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <Info className="text-slate-700" size={34} strokeWidth={1.5} />
              <p className="text-[12.5px] text-slate-700">
                One time password (OTP) will be sent via text message(SMS) to the number
                registered with Aadhaar.
              </p>
              <label className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeAadhaar}
                  onChange={(e) => {
                    setAgreeAadhaar(e.target.checked);
                    setAadhaarModalError("");
                  }}
                />
                I agree to validate my Aadhaar Details <span className="text-red-500">*</span>
              </label>
              {aadhaarModalError && (
                <div className="w-full rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                  {aadhaarModalError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-5 border-t border-slate-200 px-6 py-3">
              <button
                onClick={() => setShowAadhaarModal(false)}
                className="text-[#0f3a9a] font-bold text-[12.5px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAadhaarOtp}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[12.5px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Generate Aadhaar OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
          <div className="w-full max-w-md bg-white rounded shadow-2xl">
            <div className="px-6 pt-5 pb-2">
              <h3 className="text-[18px] font-bold text-[#0a2558]">Verify OTP</h3>
            </div>
            <div className="px-6 pb-4">
              <p className="text-[12px] text-slate-600 mb-3">
                Please enter OTP which has been sent to your Mobile number registered with
                Aadhaar.
              </p>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                OTP<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="h-10 w-10 border border-slate-300 rounded text-center text-[14px] font-bold text-slate-800 outline-none focus:border-blue-500"
                  />
                ))}
              </div>
              {otpError && (
                <div className="mt-3 rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                  {otpError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-5 border-t border-slate-200 px-6 py-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setStep("everify");
                }}
                className="text-[#0f3a9a] font-bold text-[12.5px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleValidateOtp}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[12.5px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin-configured (Simulation Manager) experiment brief - not
          rendered at all if the admin hasn't set a banner for this slug. */}
      {bannerText && (
        <div className="bg-[#e0f2fe] border-b border-[#bae6fd] px-6 py-2.5 text-[11px] font-bold text-[#0369a1] select-none shrink-0 whitespace-pre-line">
          {bannerText}
        </div>
      )}

      {/* Portal header */}
      <div className="w-full select-none shrink-0 border-b border-slate-200">
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/simulations/satyamev-jayate.jpg"
              alt="Satyamev Jayate emblem"
              className="h-10 w-10 object-contain rounded-full"
            />
            <div>
              <h1 className="text-lg font-bold text-[#0a2558] leading-tight">
                e-Filing{" "}
                <span className="text-red-500 font-semibold italic text-sm">
                  Anywhere Anytime
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold">
                Income Tax Department, Government of India
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-bold text-slate-700">
              {step === "dashboard" ? name : ""} ▾
            </p>
            <p className="text-[10px] text-slate-400 cursor-default">Logout</p>
          </div>
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {["Dashboard", "e-File", "Authorised Partners", "Services", "Pending Actions", "Grievances", "Help"].map(
            (item) => (
              <span
                key={item}
                className="px-4 py-2.5 uppercase tracking-wide border-r border-white/5 cursor-default"
              >
                {item}
              </span>
            )
          )}
          <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 89:49</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-4">
            Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns for
            Curent A.Y. 2022-23 <span className="text-slate-400 font-normal">›</span> ITR-1{" "}
            <span className="text-slate-400 font-normal">›</span> Validate Your Pre-filled Data{" "}
            <span className="text-slate-400 font-normal">›</span> Preview &amp; Submit Your
            Return <span className="text-slate-400 font-normal">›</span> Rectify Errors
          </p>

          <div className="flex items-center justify-between mb-4 max-w-2xl">
            {stepperItems.map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                      idx < 2
                        ? "bg-[#22c55e] text-white border-[#22c55e]"
                        : "border-[#0f3a9a] text-[#0f3a9a]"
                    }`}
                  >
                    {idx < 2 ? "✓" : idx + 1}
                  </div>
                  <span className="text-[10px] font-bold text-center max-w-[90px] text-[#0a2558]">
                    {label}
                  </span>
                </div>
                {idx < stepperItems.length - 1 && (
                  <div className="flex-1 h-[2px] mx-1 bg-[#22c55e]" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-slate-50 rounded-md p-4 mb-6 max-w-md">
            <div className="flex items-center justify-between">
              {verifySubSteps.map((label, idx) => (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                        idx === 0
                          ? "bg-[#22c55e] text-white border-[#22c55e]"
                          : "border-[#0f3a9a] text-[#0f3a9a]"
                      }`}
                    >
                      {idx === 0 ? "✓" : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold text-[#0a2558] text-center max-w-[90px]">
                      {label}
                    </span>
                  </div>
                  {idx < verifySubSteps.length - 1 && (
                    <div className="flex-1 h-[2px] mx-1 bg-[#22c55e]" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {step === "preview" && (
            <div className="max-w-3xl">
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-4">{ITR_TYPE}</h2>
              <div className="border border-[#bbf7d0] bg-[#f0fdf4] rounded p-5 mb-6 flex items-center gap-4">
                <CheckCircle2 className="text-[#22c55e] shrink-0" size={34} />
                <div>
                  <p className="text-[14px] font-bold text-[#166534]">Validation Successful!</p>
                  <p className="text-[11.5px] text-[#166534]">No errors were found.</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  disabled
                  title="Not available in this simulation"
                  className="border border-slate-200 text-slate-300 font-bold text-[13px] px-6 py-2 rounded cursor-not-allowed"
                >
                  ‹ Preview Return
                </button>
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    title="Not available in this simulation"
                    className="border border-slate-200 text-slate-300 font-bold text-[13px] px-6 py-2 rounded cursor-not-allowed"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={handleProceedToVerification}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                  >
                    Proceed to Verification
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "everify" && (
            <div className="max-w-4xl">
              <h2 className="text-[28px] font-bold text-[#0a2558] mb-5">e-Verify</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-5 border-b border-slate-200">
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold mb-0.5">PAN</p>
                  <p className="text-[13px] font-bold text-slate-800">{pan}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold mb-0.5">ITR</p>
                  <p className="text-[13px] font-bold text-slate-800">{ITR_TYPE}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold mb-0.5">
                    Assessment Year
                  </p>
                  <p className="text-[13px] font-bold text-slate-800">{assessmentYear}</p>
                </div>
              </div>

              <p className="text-[13px] font-bold text-slate-800 mb-4">
                How do you want to e-verify?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">
                <div className="space-y-3">
                  {verificationOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 text-[12.5px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="everify-mode"
                        checked={selectedVerification === opt.value}
                        onChange={() => {
                          setSelectedVerification(opt.value);
                          setEverifyError("");
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}

                  <p className="text-[12.5px] font-semibold text-slate-700 pt-1">
                    Generate electronic verification code (EVC)
                  </p>
                  <div className="pl-1 space-y-3">
                    {evcOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2.5 text-[12.5px] font-semibold text-slate-700 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="everify-mode"
                          checked={selectedVerification === opt.value}
                          onChange={() => {
                            setSelectedVerification(opt.value);
                            setEverifyError("");
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>

                  {existingCodeOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 text-[12.5px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="everify-mode"
                        checked={selectedVerification === opt.value}
                        onChange={() => {
                          setSelectedVerification(opt.value);
                          setEverifyError("");
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-2 text-[11px] text-slate-500">
                    <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <p>
                      Kindly select appropriate mode of verification as prescribed in rule 12(3)
                      of IT rules.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-500">
                    <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <p>
                      You can generate EVC through Bank ATM. To generate EVC through Bank ATM,
                      follow below steps.
                      <br />
                      1. Visit your bank&apos;s ATM and swipe your ATM card.
                    </p>
                  </div>
                </div>
              </div>

              {everifyError && (
                <div className="mt-5 rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 max-w-2xl">
                  {everifyError}
                </div>
              )}

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setStep("preview")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleEverifyContinue}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Continue ›
                </button>
              </div>
            </div>
          )}

          {step === "dashboard" && (
            <div className="max-w-3xl">
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-5">Welcome Back, {name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border border-slate-200 rounded p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-14 w-14 rounded-full bg-slate-200 shrink-0" />
                    <div className="text-[11.5px] text-slate-700 space-y-0.5">
                      <p className="font-bold">{pan}</p>
                      <p>XXXXXXXXXXXX</p>
                      <p>XXXXXXXXX</p>
                      <p>{email}</p>
                    </div>
                  </div>
                  <div className="text-[11.5px] space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Contact Details</span>
                      <span className="text-[#0f3a9a] font-bold cursor-default">Update</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Bank Account</span>
                      <span className="text-[#0f3a9a] font-bold cursor-default">Update</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Your account is</span>
                      <span className="text-[#0f3a9a] font-bold cursor-default">
                        Secure Account
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-4">
                  <p className="text-[12px] font-semibold text-slate-600 mb-3">
                    File your return for the year ended on 31-Mar
                  </p>
                  <button className="bg-[#0f3a9a] text-white font-bold text-[12px] px-4 py-2 rounded cursor-default mb-4">
                    File Now
                  </button>
                  <div className="space-y-2 text-[12px] font-bold text-slate-700">
                    <div className="border border-slate-200 rounded p-3 cursor-default">
                      › Tax Deposit
                    </div>
                    <div className="border border-slate-200 rounded p-3 cursor-default">
                      › View Filed Returns
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* india.gov.in government portal footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 w-full shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <img
                src="/images/simulations/satyamev-jayate.jpg"
                alt="india.gov.in"
                className="h-8 w-8 object-contain rounded-full"
              />
              <div className="text-[10px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-700">india.gov.in</p>
                <p>national portal of india</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10.5px] text-[#0f3a9a] font-semibold">
              {footerLinks.map((link, idx) => (
                <React.Fragment key={link}>
                  <span className="cursor-default">{link}</span>
                  {idx < footerLinks.length - 1 && <span className="text-slate-300">|</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <p className="text-[10px] text-slate-500">
              Copyright © Income Tax Department, Ministry of Finance, Simulation. All Rights
              Reserved
            </p>
            <div className="text-[10px] text-slate-500 md:text-right">
              <p>Last reviewed and updated on : 14-Apr-2022</p>
              <p>
                This site is best viewed in 1024 * 768 resolution with latest version of Chrome,
                Firefox, Safari and Internet Explorer.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <span>© 2022 IICPA Simulation Software Designed &amp; Developed by IICPA</span>
          <span>
            Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+,
            Firefox 45+ and Safari 6+
          </span>
        </div>
      </div>
    </div>
  );
}
