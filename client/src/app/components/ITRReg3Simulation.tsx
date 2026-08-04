"use client";

import React, { useState } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

interface ITRReg3SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-3 -> itr-reg-3 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-3";

const DEFAULT_MOBILE = "9876543210";
const DEFAULT_EMAIL = "akhil.sharma@example.com";
const DEFAULT_ADDRESS = "123, MG Road, Bengaluru, Karnataka, 560001";
const DEFAULT_PASSWORD = "Akhil@123";

const navItems = [
  "Home",
  "Individual/HUF",
  "Company",
  "Non-Company",
  "Tax Professionals & Others",
  "Downloads",
  "Help",
];

const stepperItems = ["Get Started", "Fill Details", "Verify Details", "Secure Your Account"];

export default function ITRReg3Simulation({ onComplete }: ITRReg3SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const mobile = findFieldValue(simConfig, /mobile/i) || DEFAULT_MOBILE;
  const email = findFieldValue(simConfig, /email/i) || DEFAULT_EMAIL;
  const address = findFieldValue(simConfig, /address/i) || DEFAULT_ADDRESS;
  const password = findFieldValue(simConfig, /password/i) || DEFAULT_PASSWORD;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const [mobileInput, setMobileInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [detailsError, setDetailsError] = useState("");

  const resetForm = () => {
    setMobileInput("");
    setEmailInput("");
    setAddressInput("");
    setPasswordInput("");
    setConfirmPasswordInput("");
    setDetailsError("");
  };

  const handleContinue = () => {
    if (
      !mobileInput.trim() ||
      !emailInput.trim() ||
      !addressInput.trim() ||
      !passwordInput ||
      !confirmPasswordInput
    ) {
      setDetailsError("Please fill all mandatory fields.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setDetailsError("Password and Confirm Password do not match.");
      return;
    }
    if (requireCredentialValidation) {
      const mismatch =
        mobileInput.trim() !== mobile.trim() ||
        emailInput.trim().toLowerCase() !== email.trim().toLowerCase() ||
        addressInput.trim().toLowerCase() !== address.trim().toLowerCase() ||
        passwordInput !== password;
      if (mismatch) {
        setDetailsError(
          "Details entered do not match the experiment brief. Please re-check and try again."
        );
        return;
      }
    }
    setDetailsError("");
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
    resetForm();
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
            <p className="text-white font-bold text-[15px]">Contact Details Saved!</p>
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
          <div className="flex items-center gap-3">
            <button className="border border-[#0f3a9a] text-[#0f3a9a] text-[11px] font-bold px-4 py-2 rounded cursor-default">
              Login
            </button>
            <button className="bg-[#0f3a9a] text-white text-[11px] font-bold px-4 py-2 rounded border-2 border-red-500 cursor-default">
              Register
            </button>
          </div>
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {navItems.map((item) => (
            <span
              key={item}
              className="px-4 py-2.5 uppercase tracking-wide border-r border-white/5 cursor-default"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          <div className="flex items-center justify-between mb-8 max-w-2xl">
            {stepperItems.map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                      idx === 0
                        ? "bg-[#22c55e] text-white border-[#22c55e]"
                        : idx === 1
                        ? "border-[#0f3a9a] text-[#0f3a9a]"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {idx === 0 ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      idx <= 1 ? "text-[#0a2558]" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < stepperItems.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-1 ${
                      idx === 0 ? "bg-[#22c55e]" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="max-w-xl border border-slate-200 rounded p-6 shadow-sm">
            <p className="text-[13px] font-bold text-[#0a2558] mb-4">
              Registering as - Individual
            </p>
            <div className="flex gap-4 mb-4 text-[12px] font-bold">
              <span className="text-slate-400 cursor-default">Basic Details</span>
              <span className="text-[#0f3a9a] border-b-2 border-[#0f3a9a] pb-1">
                Contact Details
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Primary Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={mobileInput}
                  maxLength={10}
                  onChange={(e) => {
                    setMobileInput(e.target.value.replace(/\D/g, ""));
                    setDetailsError("");
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Primary Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setDetailsError("");
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={addressInput}
                  rows={2}
                  onChange={(e) => {
                    setAddressInput(e.target.value);
                    setDetailsError("");
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <p className="text-[12px] font-bold text-[#0a2558] pt-2">Password Details</p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Set Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setDetailsError("");
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => {
                    setConfirmPasswordInput(e.target.value);
                    setDetailsError("");
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {detailsError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                  {detailsError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={resetForm}
                  className="flex-1 border border-slate-300 text-slate-600 font-bold text-[13px] py-2.5 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] py-2.5 rounded cursor-pointer transition-colors"
                >
                  Continue ›
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto shrink-0">
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
