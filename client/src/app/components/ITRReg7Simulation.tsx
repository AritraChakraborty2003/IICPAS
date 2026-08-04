"use client";

import React, { useState } from "react";
import { FaIdCard, FaIdBadge, FaUserShield, FaUniversity, FaEye, FaEyeSlash } from "react-icons/fa";
import { CheckCircle2, ArrowLeft, KeyRound, ChevronDown } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "userId" | "password" | "dashboard" | "epay";

interface ITRReg7SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-7 -> itr-reg-7 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-7";

const DEFAULT_USER_ID = "NGHPR1812B";
const DEFAULT_PASSWORD = "Fin@123";
const DEFAULT_PROPRIETOR_NAME = "Raghavan Patil";
const DEFAULT_SECURE_MESSAGE = "Login";

const dashboardNavItems = [
  "Dashboard",
  "e-File",
  "Authorised Partners",
  "Services",
  "Pending Actions",
  "Grievances",
  "Help",
];

export default function ITRReg7Simulation({ onComplete }: ITRReg7SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const userId = findFieldValue(simConfig, /user|pan/i) || DEFAULT_USER_ID;
  const password = findFieldValue(simConfig, /password/i) || DEFAULT_PASSWORD;
  const proprietorName = findFieldValue(simConfig, /proprietor/i) || DEFAULT_PROPRIETOR_NAME;
  const secureMessage = findFieldValue(simConfig, /secure|message/i) || DEFAULT_SECURE_MESSAGE;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("userId");

  const [userIdInput, setUserIdInput] = useState("");
  const [userIdError, setUserIdError] = useState("");

  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [secureMsgConfirmed, setSecureMsgConfirmed] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [efileMenuOpen, setEfileMenuOpen] = useState(false);

  const resetAll = () => {
    setStep("userId");
    setUserIdInput("");
    setUserIdError("");
    setPasswordInput("");
    setShowPassword(false);
    setSecureMsgConfirmed(false);
    setPasswordError("");
    setEfileMenuOpen(false);
  };

  const handleUserIdContinue = () => {
    const trimmed = userIdInput.trim().toUpperCase();
    if (!trimmed) {
      setUserIdError("Please enter your User ID.");
      return;
    }
    if (requireCredentialValidation && trimmed !== userId.toUpperCase()) {
      setUserIdError("Invalid User ID. Please enter the User ID provided in the experiment brief.");
      return;
    }
    setUserIdError("");
    setStep("password");
  };

  const handlePasswordContinue = () => {
    if (!secureMsgConfirmed) {
      setPasswordError("Please confirm your secure access message before continuing.");
      return;
    }
    if (!passwordInput) {
      setPasswordError("Please enter your password.");
      return;
    }
    if (requireCredentialValidation && passwordInput !== password) {
      setPasswordError("Invalid password. Please enter the password provided in the experiment brief.");
      return;
    }
    setPasswordError("");
    setStep("dashboard");
  };

  const handleEpayTaxClick = () => {
    setEfileMenuOpen(false);
    setStep("epay");
  };

  // Clicking "New Payment" completes this exercise immediately - the actual
  // challan/payment flow is out of scope for this login-and-navigate exercise.
  const handleNewPayment = () => {
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
            <p className="text-white font-bold text-[15px]">New Payment Initiated!</p>
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
          {step === "dashboard" || step === "epay" ? (
            <div className="text-right">
              <p className="text-[12px] font-bold text-slate-700">{proprietorName} ▾</p>
              <p className="text-[10px] text-slate-400 cursor-default">Logout</p>
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-slate-500">
              Do not have an account?{" "}
              <span className="text-[#0f3a9a] font-bold cursor-default">Register</span>
            </p>
          )}
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {(step === "dashboard" || step === "epay"
            ? dashboardNavItems
            : ["Home", "Individual/HUF", "Company", "Non-Company", "Tax Professionals & Others", "Downloads", "Help"]
          ).map((item) => (
            <span
              key={item}
              onClick={item === "e-File" ? () => setEfileMenuOpen((v) => !v) : undefined}
              className={`relative px-4 py-2.5 uppercase tracking-wide border-r border-white/5 flex items-center gap-1 ${
                item === "e-File" ? "cursor-pointer hover:bg-[#152a4e]" : "cursor-default"
              }`}
            >
              {item}
              {item === "e-File" && <ChevronDown size={11} />}
              {item === "e-File" && efileMenuOpen && (
                <div className="absolute top-full left-0 mt-0 w-52 bg-white text-slate-700 text-[11px] font-semibold shadow-xl border border-slate-200 z-30 normal-case">
                  <div className="px-4 py-2.5 hover:bg-slate-50 cursor-default flex items-center justify-between">
                    Income Tax Returns <span>›</span>
                  </div>
                  <div className="px-4 py-2.5 hover:bg-slate-50 cursor-default flex items-center justify-between">
                    Income Tax Forms <span>›</span>
                  </div>
                  <div
                    onClick={handleEpayTaxClick}
                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-[#0f3a9a] font-bold"
                  >
                    e-Pay Tax <span>›</span>
                  </div>
                </div>
              )}
            </span>
          ))}
          {(step === "dashboard" || step === "epay") && (
            <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 08:59:53</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          {step === "userId" && (
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="w-full max-w-sm">
                <h3 className="text-[26px] font-bold text-[#0a2558] mb-5">Login</h3>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Enter your User ID <span className="text-red-500">*</span>
                </label>
                <input
                  value={userIdInput}
                  placeholder="PAN/ Aadhaar/ Other User ID"
                  onChange={(e) => {
                    setUserIdInput(e.target.value.toUpperCase());
                    setUserIdError("");
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 outline-none focus:border-blue-500 mb-3"
                />
                {userIdError && (
                  <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-3">
                    {userIdError}
                  </div>
                )}
                <button
                  onClick={handleUserIdContinue}
                  className="w-full bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] py-2.5 rounded cursor-pointer transition-colors mb-3"
                >
                  Continue ›
                </button>
                <button
                  onClick={resetAll}
                  className="w-full border border-slate-300 text-[#0f3a9a] font-bold text-[13px] py-2.5 rounded cursor-pointer hover:bg-slate-50 transition-colors mb-4"
                >
                  ‹ Back
                </button>
                <p className="text-[11px] font-bold text-slate-500 mb-2">
                  Other ways to access your account
                </p>
                <div className="flex items-center gap-2 text-[12px] text-slate-600 cursor-default">
                  <FaUniversity className="text-slate-400" size={14} />
                  Net Banking
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0 space-y-4 text-[11px] text-slate-600">
                <p className="text-[15px] font-semibold text-slate-500">
                  Know about your <span className="font-bold text-slate-800">User ID</span>
                </p>
                <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                  <FaIdCard className="text-[#0f3a9a] shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold text-slate-800 mb-0.5">PAN (Permanent Account Number)</p>
                    <p>
                      <span className="font-semibold">For Individuals</span> (Salaried employee,
                      Senior citizen, Self-employed, NRI)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                  <FaIdBadge className="text-[#0f3a9a] shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold text-slate-800 mb-0.5">Aadhaar Number</p>
                    <p>
                      <span className="font-semibold">For Individuals</span> (Salaried employee,
                      Senior citizen, Self-employed, NRI)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaUserShield className="text-[#0f3a9a] shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold text-slate-800 mb-0.5">Other User ID</p>
                    <p>
                      <span className="font-semibold">For Chartered Accountant, Tax Deductor</span>{" "}
                      and Collector, e-Return Intermediary, TIN 2.0 Stakeholders, External Agency,
                      ITDREIN
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "password" && (
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="w-full max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-slate-200 shrink-0" />
                  <div>
                    <h3 className="text-[22px] font-bold text-[#0a2558] leading-tight">Login</h3>
                    <p className="text-[11px] text-slate-500">PAN : {userId}</p>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-slate-700 mb-1">Secure Access Message</p>
                <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-[12px] text-slate-700 mb-2">
                  {secureMessage}
                </div>
                <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secureMsgConfirmed}
                    onChange={(e) => {
                      setSecureMsgConfirmed(e.target.checked);
                      setPasswordError("");
                    }}
                    className="h-4 w-4"
                  />
                  Please confirm your secure access message
                  <span className="text-red-500">*</span>
                </label>

                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Enter password for your e-Filing account
                </label>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password<span className="text-red-500">*</span>
                </label>
                <div className="relative mb-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-2 pr-9 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
                <p className="text-[11px] font-bold text-[#0f3a9a] mb-4 cursor-default">
                  Forgot Password?
                </p>

                {passwordError && (
                  <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-3">
                    {passwordError}
                  </div>
                )}

                <button
                  onClick={handlePasswordContinue}
                  className="w-full bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] py-2.5 rounded cursor-pointer transition-colors mb-3"
                >
                  Continue ›
                </button>
                <button
                  onClick={() => setStep("userId")}
                  className="w-full border border-slate-300 text-[#0f3a9a] font-bold text-[13px] py-2.5 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
              </div>

              <div className="hidden md:flex w-40 h-40 rounded-2xl bg-indigo-50 items-center justify-center shrink-0 mt-8">
                <KeyRound className="text-[#0f3a9a]" size={64} strokeWidth={1.5} />
              </div>
            </div>
          )}

          {step === "dashboard" && (
            <div>
              <h2 className="text-[28px] font-bold text-[#0a2558] mb-4">
                Welcome Back, {proprietorName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded p-4">
                  <p className="text-[12px] font-semibold text-slate-600 mb-2">
                    File your return for the year ended on 31-Mar
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    For Assessment Year 01-Apr-20XX to 31-Mar-20XX
                  </p>
                  <button className="bg-[#0f3a9a] text-white font-bold text-[12px] px-4 py-2 rounded cursor-default">
                    File Now
                  </button>
                  <ul className="mt-4 space-y-1.5 text-[11px] text-slate-600">
                    <li>{userId} Contact Details Update</li>
                    <li>Bank Account Update</li>
                    <li>Link Aadhaar to PAN Link</li>
                    <li>Your account is not secure with e-vault Secure Account</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded p-4 text-[12px] font-bold text-slate-700 cursor-default">
                    › Tax Deposit
                  </div>
                  <div className="border border-slate-200 rounded p-4 text-[12px] font-bold text-slate-700 cursor-default">
                    › Recent Filed Returns
                  </div>
                  <div className="border border-slate-200 rounded p-4 text-[12px] font-bold text-slate-700 cursor-default">
                    › Recent Forms Filed
                  </div>
                </div>
              </div>
              <div className="mt-4 border border-slate-200 rounded p-4 text-[11px] text-slate-600 max-w-sm">
                <p className="font-bold text-slate-800 mb-1">Activity Log</p>
                <p>Last log out 20XX</p>
                <p>Last log In 20XX</p>
              </div>
              <p className="mt-5 text-[11px] font-semibold text-slate-400">
                Open the <span className="text-[#0f3a9a] font-bold">e-File</span> menu above and
                select <span className="text-[#0f3a9a] font-bold">e-Pay Tax</span> to continue.
              </p>
            </div>
          )}

          {step === "epay" && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-1">2. e-Pay Tax</p>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[26px] font-bold text-[#0a2558]">e-Pay Tax</h2>
                <button
                  onClick={handleNewPayment}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[12px] px-5 py-2.5 rounded cursor-pointer transition-colors"
                >
                  + New Payment
                </button>
              </div>
              <p className="text-[11.5px] text-slate-600 mb-5 max-w-2xl">
                Please click on New Payment for tax payment through (i) Net Banking (ii) Debit
                Card (iii) Over the Counter (iv) NEFT/RTGS (v) Payment Gateway for these banks
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11.5px] font-semibold text-slate-500 mb-4">
                <span className="cursor-default">Saved Drafts</span>
                <span className="cursor-default">Generated Challans</span>
                <span className="text-[#0f3a9a] cursor-default">Payment History</span>
                <span className="cursor-default">Challan Status Inquiry (CSI) File</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold">
                      <th className="px-3 py-2 text-left border-b border-slate-200">CIN</th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">
                        Bank Reference Number
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">
                        Assessment Year
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">
                        Type of Payment
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">
                        Amount(₹)
                      </th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">
                        Payment Date &amp; Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                        No records found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
