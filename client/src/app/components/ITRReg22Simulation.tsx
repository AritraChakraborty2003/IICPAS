"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ArrowLeft,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "returnSummary" | "verificationMethod" | "eVerify";
type VerificationOption = "everify" | "later" | "itrv" | "";
type EVerifyMode = "aadhaarOtp" | "dsc";

interface ITRReg22SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-22 -> itr-reg-22 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-22";

const DEFAULT_NAME = "Sanjay Sahu";
const DEFAULT_PAN = "SPXPA3669C";
const DEFAULT_ITR_TYPE = "ITR-2";
const DEFAULT_ASSESSMENT_YEAR = "2024-25";
const DEFAULT_OTP = "363639";

const dashboardNavItems = [
  "Dashboard",
  "e-File",
  "Authorised Partners",
  "Services",
  "AIS",
  "Pending Actions",
  "Grievances",
  "Help",
];

const OTP_LENGTH = 6;

export default function ITRReg22Simulation({ onComplete }: ITRReg22SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const itrType = findFieldValue(simConfig, /itr.*type|form/i) || DEFAULT_ITR_TYPE;
  const assessmentYear = findFieldValue(simConfig, /assessment year/i) || DEFAULT_ASSESSMENT_YEAR;
  // Admin-configured (Simulation Manager) Aadhaar OTP - drives the validation
  // check on the Verify OTP dialog below. Never hardcoded.
  const expectedOtp = findFieldValue(simConfig, /otp/i) || DEFAULT_OTP;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("returnSummary");

  const [verificationOption, setVerificationOption] = useState<VerificationOption>("everify");
  const [verificationError, setVerificationError] = useState("");

  const [eVerifyMode, setEVerifyMode] = useState<EVerifyMode>("aadhaarOtp");
  const [eVerifyError, setEVerifyError] = useState("");

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = useMemo(() => otpDigits.join(""), [otpDigits]);

  const resetAll = () => {
    setStep("returnSummary");
    setVerificationOption("everify");
    setVerificationError("");
    setEVerifyMode("aadhaarOtp");
    setEVerifyError("");
    setShowOtpModal(false);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setOtpVisible(false);
    setOtpError("");
  };

  const handleProceedToVerification = () => {
    setStep("verificationMethod");
  };

  const handleVerificationContinue = () => {
    if (!verificationOption) {
      setVerificationError("Please select a verification method to continue.");
      return;
    }
    if (verificationOption !== "everify") {
      setVerificationError(
        "This experiment requires instant verification. Please select \"e-Verify Now\" to continue."
      );
      return;
    }
    setVerificationError("");
    setStep("eVerify");
  };

  const handleEVerifyContinue = () => {
    if (eVerifyMode !== "aadhaarOtp") {
      setEVerifyError(
        "Please select \"I would like to verify using OTP on mobile number registered with Aadhaar\" to continue."
      );
      return;
    }
    setEVerifyError("");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setShowOtpModal(true);
  };

  const handleOtpDigitChange = (idx: number, raw: string) => {
    const digit = raw.replace(/[^0-9]/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < OTP_LENGTH - 1) {
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleValidateOtp = () => {
    if (otpValue.length < OTP_LENGTH) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }
    if (requireCredentialValidation && otpValue !== expectedOtp) {
      setOtpError("The OTP entered is invalid. Please try again.");
      return;
    }
    setOtpError("");
    setShowOtpModal(false);
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

      {/* VERIFY OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded shadow-2xl overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-[18px] font-bold text-[#0a2558] mb-4">Verify OTP</h3>
              <p className="text-[12px] text-slate-600 mb-3">
                Please enter OTP which has been sent to your Mobile number registered with
                Aadhaar.
              </p>
              <label className="block text-[11.5px] font-semibold text-slate-600 mb-1.5">
                OTP<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type={otpVisible ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-11 text-center border border-slate-300 rounded text-[15px] font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setOtpVisible((v) => !v)}
                  className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={otpVisible ? "Hide OTP" : "Show OTP"}
                >
                  {otpVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {otpError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mt-4">
                  {otpError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-6 bg-slate-50 px-6 py-3.5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-[13px] font-bold text-[#0f3a9a] cursor-pointer hover:underline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleValidateOtp}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
              >
                Validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS OVERLAY (GREEN TICK & RETURN BUTTON) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] animate-fadeIn">
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_15px_45px_rgba(71,198,90,0.4)] animate-scaleIn">
              <CheckCircle2 className="text-white" size={90} strokeWidth={2.5} />
            </div>
            <p className="text-white font-bold text-[15px]">Return Verified &amp; e-Filed Successfully!</p>
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
            <p className="text-[12px] font-bold text-slate-700">{name} ▾</p>
            <p className="text-[10px] text-slate-400 cursor-default">Individual</p>
          </div>
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {dashboardNavItems.map((item) => (
            <span
              key={item}
              className={`px-4 py-2.5 uppercase tracking-wide border-r border-white/5 cursor-default ${
                item === "Dashboard" ? "underline underline-offset-4" : ""
              }`}
            >
              {item}
            </span>
          ))}
          <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 14:53</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          {step === "returnSummary" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-4">
                Dashboard &rsaquo; Filing Returns for A.Y. {assessmentYear} &rsaquo; {itrType} &rsaquo; View
                &amp; Submit Your Return
              </p>

              <div className="max-w-3xl border border-slate-200 rounded p-5 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center">
                    <span className="h-7 w-7 rounded-full bg-[#16a34a] flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={16} />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 mx-2">Validate Return</span>
                    <span className="h-px w-8 bg-[#16a34a]" />
                  </div>
                  <div className="flex items-center">
                    <span className="h-7 w-7 rounded-full bg-[#16a34a] flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={16} />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 mx-2">Preview and Submit</span>
                    <span className="h-px w-8 bg-[#0f3a9a]" />
                  </div>
                  <div className="flex items-center">
                    <span className="h-7 w-7 rounded border-2 border-[#0f3a9a] flex items-center justify-center text-[11px] font-bold text-[#0f3a9a]">
                      3
                    </span>
                    <span className="text-[11px] font-bold text-[#0a2558] ml-2">Verify and Submit</span>
                  </div>
                </div>

                <h2 className="text-[20px] font-bold text-slate-800 mb-3">{itrType}</h2>

                <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded px-4 py-3.5 mb-5">
                  <CheckCircle2 className="text-[#16a34a] shrink-0" size={20} />
                  <div>
                    <p className="text-[13px] font-bold text-[#166534]">Validation Successful!</p>
                    <p className="text-[11.5px] text-[#15803d]">No errors were found.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-5 py-2 rounded cursor-default"
                  >
                    ‹ Preview Return
                  </button>
                  <button
                    type="button"
                    className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-5 py-2 rounded cursor-default"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={handleProceedToVerification}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-5 py-2 rounded cursor-pointer transition-colors"
                  >
                    Proceed to Verification
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "verificationMethod" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-4">
                Dashboard &rsaquo; Filing Returns for A.Y. {assessmentYear} &rsaquo; {itrType} &rsaquo; Complete
                Your Verification
              </p>
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-1">Complete your Verification</h2>
              <p className="text-[12px] text-slate-500 mb-5">
                Select a Verification method below to finish filing
              </p>

              <div className="max-w-3xl border border-slate-200 rounded divide-y divide-slate-100 mb-4">
                <label className="flex items-start gap-3 p-4 cursor-pointer">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={verificationOption === "everify"}
                    onChange={() => {
                      setVerificationOption("everify");
                      setVerificationError("");
                    }}
                  />
                  <div>
                    <p className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                      e-Verify Now
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    </p>
                    <p className="text-[11.5px] text-slate-500">
                      Instant e-Verification via Aadhaar OTP/Prevalidated Bank Account/ Prevalidated
                      Demat Account
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 cursor-pointer">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={verificationOption === "later"}
                    onChange={() => {
                      setVerificationOption("later");
                      setVerificationError("");
                    }}
                  />
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">e-Verify Later</p>
                    <p className="text-[11.5px] text-slate-500">
                      You can submit the return now and e-Verify within 120 days of submission
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 cursor-pointer">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={verificationOption === "itrv"}
                    onChange={() => {
                      setVerificationOption("itrv");
                      setVerificationError("");
                    }}
                  />
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">Verify via ITR-V</p>
                    <p className="text-[11.5px] text-slate-500">
                      You can submit the return now and verify the return by sending a signed ITR-V
                      to the CPC, Bengaluru by Normal/Speed Post within 120 days
                    </p>
                  </div>
                </label>
              </div>

              {verificationError && (
                <div className="max-w-3xl rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4">
                  {verificationError}
                </div>
              )}

              <div className="max-w-3xl flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep("returnSummary")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleVerificationContinue}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "eVerify" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-4">e-File &rsaquo; e-Verify</p>
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-5">e-Verify</h2>

              <div className="max-w-3xl border border-slate-200 rounded p-5 mb-5">
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">PAN</p>
                    <p className="text-[13px] font-semibold text-slate-800">{pan}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">ITR</p>
                    <p className="text-[13px] font-semibold text-slate-800">{itrType}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">Assessment Year</p>
                    <p className="text-[13px] font-semibold text-slate-800">{assessmentYear}</p>
                  </div>
                </div>

                <p className="text-[13px] font-bold text-slate-800 mb-3">How do you want to e-verify?</p>

                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex-1 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={eVerifyMode === "aadhaarOtp"}
                        onChange={() => {
                          setEVerifyMode("aadhaarOtp");
                          setEVerifyError("");
                        }}
                      />
                      <span className="text-[12.5px] font-semibold text-slate-800">
                        I would like to verify using OTP on mobile number registered with Aadhaar
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={eVerifyMode === "dsc"}
                        onChange={() => {
                          setEVerifyMode("dsc");
                          setEVerifyError("");
                        }}
                      />
                      <span className="text-[12.5px] font-semibold text-slate-800">
                        I would like to verify using Digital Signature Certificate (DSC)
                      </span>
                    </label>

                    <p className="text-[12px] text-slate-500 pt-1">Generate electronic verification code (EVC)</p>
                    <label className="flex items-center gap-2.5 pl-1 opacity-50 cursor-not-allowed">
                      <input type="radio" disabled />
                      <span className="text-[12.5px] font-semibold text-slate-600">Through Net Banking</span>
                    </label>
                    <label className="flex items-center gap-2.5 pl-1 opacity-50 cursor-not-allowed">
                      <input type="radio" disabled />
                      <span className="text-[12.5px] font-semibold text-slate-600">Through Bank Account</span>
                    </label>
                    <label className="flex items-center gap-2.5 pl-1 opacity-50 cursor-not-allowed">
                      <input type="radio" disabled />
                      <span className="text-[12.5px] font-semibold text-slate-600">Through Demat Account</span>
                    </label>
                    <label className="flex items-center gap-2.5 pl-1 opacity-50 cursor-not-allowed">
                      <input type="radio" disabled />
                      <span className="text-[12.5px] font-semibold text-slate-600">
                        I already have an Electronic Verification Code (EVC)
                      </span>
                    </label>
                  </div>

                  <div className="flex-1 space-y-3 text-[11px] text-slate-500">
                    <div className="flex items-start gap-1.5">
                      <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
                      <span>
                        Kindly select appropriate mode of verification as prescribed in rule 12(3)
                        of IT rules.
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
                      <span>
                        You can generate EVC through Bank ATM. To generate EVC through Bank ATM,
                        visit your Bank ATM and select &ldquo;Generate EVC for Income Tax
                        Filing&rdquo;.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {eVerifyError && (
                <div className="max-w-3xl rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4">
                  {eVerifyError}
                </div>
              )}

              <div className="max-w-3xl flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep("verificationMethod")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleEVerifyContinue}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Continue ›
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-auto shrink-0 flex items-start gap-2 bg-[#eff6ff] border-t border-[#bfdbfe] px-6 py-3 text-[11px] text-slate-600">
          <Info className="text-[#0f3a9a] shrink-0 mt-0.5" size={14} />
          <span>
            PAN on record: <span className="font-bold">{pan}</span> &mdash; all figures shown are
            pre-filled defaults for this simulation.
          </span>
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
