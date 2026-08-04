"use client";

import React, { useState } from "react";
import { ChevronDown, CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "dashboard" | "assessmentYear" | "startFiling" | "selectStatus";

interface ITRReg11SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-11 -> itr-reg-11 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-11";

const DEFAULT_PAN = "AKSPA3663B";
const DEFAULT_NAME = "Akhil Sharma";
const DEFAULT_EMAIL = "akhilsharma@gmail.com";
const DEFAULT_ASSESSMENT_YEAR = "2025-26";
const DEFAULT_STATUS = "Individual";

const dashboardNavItems = [
  "Dashboard",
  "e-File",
  "Authorised Partners",
  "Services",
  "Pending Actions",
  "Grievances",
  "Help",
];

export default function ITRReg11Simulation({ onComplete }: ITRReg11SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const email = findFieldValue(simConfig, /email/i) || DEFAULT_EMAIL;
  const assessmentYear = findFieldValue(simConfig, /assessment/i) || DEFAULT_ASSESSMENT_YEAR;
  const status = findFieldValue(simConfig, /status/i) || DEFAULT_STATUS;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("dashboard");

  const [efileMenuOpen, setEfileMenuOpen] = useState(false);

  const [assessmentYearInput, setAssessmentYearInput] = useState("");
  const [filingMode, setFilingMode] = useState<"Online" | "Offline" | "">("");
  const [assessmentYearError, setAssessmentYearError] = useState("");

  const [statusInput, setStatusInput] = useState(DEFAULT_STATUS);
  const [statusError, setStatusError] = useState("");

  const resetAll = () => {
    setStep("dashboard");
    setEfileMenuOpen(false);
    setAssessmentYearInput("");
    setFilingMode("");
    setAssessmentYearError("");
    setStatusInput(DEFAULT_STATUS);
    setStatusError("");
  };

  const goToFileIncomeTaxReturn = () => {
    setEfileMenuOpen(false);
    setStep("assessmentYear");
  };

  const handleAssessmentYearContinue = () => {
    if (!assessmentYearInput || !filingMode) {
      setAssessmentYearError("Please select Assessment Year and Mode of Filing.");
      return;
    }
    if (
      requireCredentialValidation &&
      (assessmentYearInput !== assessmentYear || filingMode !== "Online")
    ) {
      setAssessmentYearError(
        "Selection does not match the experiment brief. Please re-check and try again."
      );
      return;
    }
    setAssessmentYearError("");
    setStep("startFiling");
  };

  const handleStartNewFiling = () => setStep("selectStatus");

  const handleStatusContinue = () => {
    if (!statusInput) {
      setStatusError("Please select the status applicable to you.");
      return;
    }
    if (requireCredentialValidation && statusInput !== status) {
      setStatusError("Selection does not match the experiment brief. Please re-check and try again.");
      return;
    }
    setStatusError("");
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
            <p className="text-white font-bold text-[15px]">Return Initiated Successfully!</p>
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
            <p className="text-[10px] text-slate-400 cursor-default">Logout</p>
          </div>
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {dashboardNavItems.map((item) => (
            <span
              key={item}
              onClick={item === "e-File" ? () => setEfileMenuOpen((v) => !v) : undefined}
              className={`relative px-4 py-2.5 uppercase tracking-wide border-r border-white/5 flex items-center gap-1 ${
                item === "e-File" ? "cursor-pointer hover:bg-[#152a4e]" : "cursor-default"
              } ${item === "Dashboard" ? "underline underline-offset-4" : ""}`}
            >
              {item}
              {item === "e-File" && <ChevronDown size={11} />}
              {item === "e-File" && efileMenuOpen && (
                <div className="absolute top-full left-0 mt-0 w-56 bg-white text-slate-700 text-[11px] font-semibold shadow-xl border border-slate-200 z-30 normal-case">
                  <div
                    onClick={goToFileIncomeTaxReturn}
                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-[#0f3a9a] font-bold"
                  >
                    Income Tax Returns <span>›</span>
                  </div>
                  <div className="px-4 py-2.5 hover:bg-slate-50 cursor-default flex items-center justify-between">
                    Income Tax Forms <span>›</span>
                  </div>
                  <div className="px-4 py-2.5 hover:bg-slate-50 cursor-default flex items-center justify-between">
                    e-Pay Tax <span>›</span>
                  </div>
                </div>
              )}
            </span>
          ))}
          <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 14:59</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          {step === "dashboard" && (
            <>
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-5">Welcome Back, {name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                      › Recent Filed Returns
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-4">
                  <p className="text-[12px] font-bold text-[#0a2558] mb-3">Activity Log</p>
                  <div className="space-y-2 text-[12px] font-bold text-slate-700">
                    <div className="border border-slate-200 rounded p-3 cursor-default">
                      › Recent Forms Filed
                    </div>
                    <div className="border border-slate-200 rounded p-3 text-[11.5px] font-normal text-slate-500 cursor-default">
                      <p>Last log In 20XX</p>
                      <p>Last Password Change 20XX</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[11px] font-semibold text-slate-400">
                Open the <span className="text-[#0f3a9a] font-bold">e-File</span> menu above and
                select <span className="text-[#0f3a9a] font-bold">Income Tax Returns</span> to
                continue.
              </p>
            </>
          )}

          {step === "assessmentYear" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">
                Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns for
                Current A.Y.
              </p>
              <h2 className="text-[28px] font-bold text-[#0a2558] mb-1">Income Tax Return</h2>
              <p className="text-[10.5px] text-red-500 font-semibold mb-4 text-right max-w-3xl">
                * Indicates mandatory fields
              </p>

              <div className="flex flex-col md:flex-row gap-6 max-w-3xl">
                <div className="flex-1 border border-slate-200 rounded p-6">
                  <label className="block text-[12px] font-bold text-slate-700 mb-2">
                    Select Assessment year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assessmentYearInput}
                    onChange={(e) => {
                      setAssessmentYearInput(e.target.value);
                      setAssessmentYearError("");
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 bg-white outline-none focus:border-blue-500 mb-4"
                  >
                    <option value="">Select</option>
                    <option value={assessmentYear}>{assessmentYear}</option>
                  </select>

                  <div className="flex items-center gap-6 mb-2">
                    <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={filingMode === "Online"}
                        onChange={() => {
                          setFilingMode("Online");
                          setAssessmentYearError("");
                        }}
                      />
                      Online
                    </label>
                    <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={filingMode === "Offline"}
                        onChange={() => {
                          setFilingMode("Offline");
                          setAssessmentYearError("");
                        }}
                      />
                      Offline
                    </label>
                  </div>

                  {assessmentYearError && (
                    <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mt-3">
                      {assessmentYearError}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-72 shrink-0 bg-[#eff6ff] border border-[#bfdbfe] rounded p-4 text-[11.5px] text-slate-700">
                  <p className="font-bold text-[#0a2558] mb-1">Information</p>
                  <p>
                    If you select offline mode, you will need to upload the ITR form prepared
                    using offline utility in the next step
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 max-w-3xl">
                <button
                  onClick={() => setStep("dashboard")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleAssessmentYearContinue}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Continue ›
                </button>
              </div>
            </>
          )}

          {step === "startFiling" && (
            <>
              <h2 className="text-[28px] font-bold text-[#0a2558] mb-4">Income Tax Return</h2>
              <p className="text-[12px] text-slate-600 mb-2 max-w-3xl">
                Resume Filing will help you start from the point you paused last time. Any update
                to the profile information will not be reflected in case of resume filing.
              </p>
              <p className="text-[12px] text-slate-600 mb-5 max-w-3xl">
                It&apos;s suggested to start new filing 30 minutes after the changes done to the
                profile information. Saved draft will be deleted in case user selects to start new
                filing.
              </p>

              <div className="max-w-3xl border border-slate-200 rounded">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                  <p className="text-[13px] font-bold text-[#0a2558]">
                    To file a fresh Income Tax Return
                  </p>
                </div>
                <div className="p-5 flex items-center justify-between gap-4">
                  <p className="text-[12px] text-slate-600">
                    Income Tax Return is the form in which tax payer files information about his
                    income and tax thereon to the Fincurious Innovations Sample.
                  </p>
                  <button
                    onClick={handleStartNewFiling}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[12px] px-5 py-2.5 rounded cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                  >
                    Start New Filing
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "selectStatus" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">
                Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns for
                Current A.Y.
              </p>
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-2 max-w-2xl">
                Please select the status applicable to you to proceed further
              </h2>
              <p className="text-[12px] text-slate-500 mb-5 max-w-2xl">
                Based on your last year&apos;s data we have pre-selected a status applicable to
                you. You may change the status if it is not applicable to you.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mb-5">
                {["Individual", "HUF", "Others"].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-2.5 border rounded px-4 py-3.5 cursor-pointer ${
                      statusInput === option ? "border-[#0f3a9a] bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={statusInput === option}
                      onChange={() => {
                        setStatusInput(option);
                        setStatusError("");
                      }}
                    />
                    <span className="text-[12.5px] font-semibold text-slate-700">{option}</span>
                  </label>
                ))}
              </div>

              {statusError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4 max-w-2xl">
                  {statusError}
                </div>
              )}

              <div className="flex items-center gap-3 max-w-2xl">
                <button
                  onClick={() => setStep("startFiling")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleStatusContinue}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Continue ›
                </button>
              </div>
            </>
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
