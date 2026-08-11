"use client";

import React, { useState } from "react";
import {
  FaFileAlt,
  FaCalculator,
  FaMoneyBillWave,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "summary" | "personalInfo";

interface ITRReg13SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-13 -> itr-reg-13 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-13";

const DEFAULT_NAME = "Akhil Sharma";
const DEFAULT_FATHER_NAME = "Satya Sharma";
const DEFAULT_PAN = "AKSPA3663B";
const DEFAULT_DOB = "1996-07-04";
const DEFAULT_AADHAAR = "219763637854";
const DEFAULT_ADDRESS = "#36, Basavanagudi, Bengaluru - 560004";
const DEFAULT_MOBILE = "9876543210";
const DEFAULT_EMAIL = "akhilsharma@gmail.com";
const DEFAULT_NATURE_OF_EMPLOYMENT = "Others";
const DEFAULT_TAX_REGIME = "Old";

const dashboardNavItems = [
  "Dashboard",
  "e-File",
  "Authorised Partners",
  "Services",
  "Pending Actions",
  "Grievances",
  "Help",
];

const natureOfEmploymentOptions = [
  "Government",
  "Public Sector Undertaking",
  "Pensioners",
  "Others",
  "Not Applicable",
];

export default function ITRReg13Simulation({ onComplete }: ITRReg13SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const fatherName = findFieldValue(simConfig, /father/i) || DEFAULT_FATHER_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const dob = findFieldValue(simConfig, /dob|birth/i) || DEFAULT_DOB;
  const aadhaar = findFieldValue(simConfig, /aadhaar/i) || DEFAULT_AADHAAR;
  const address = findFieldValue(simConfig, /address/i) || DEFAULT_ADDRESS;
  const mobile = findFieldValue(simConfig, /mobile/i) || DEFAULT_MOBILE;
  const email = findFieldValue(simConfig, /email/i) || DEFAULT_EMAIL;
  const nature = findFieldValue(simConfig, /employ/i) || DEFAULT_NATURE_OF_EMPLOYMENT;
  const regime = findFieldValue(simConfig, /regime/i) || DEFAULT_TAX_REGIME;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;

  const [firstName, ...restName] = name.trim().split(/\s+/);
  const lastName = restName.join(" ");

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("summary");
  const [personalInfoConfirmed, setPersonalInfoConfirmed] = useState(false);

  const [secondaryAddressSame, setSecondaryAddressSame] = useState<"Yes" | "No">("Yes");
  const [natureInput, setNatureInput] = useState(DEFAULT_NATURE_OF_EMPLOYMENT);
  const [regimeInput, setRegimeInput] = useState<"Old" | "New">("Old");
  const [personalInfoError, setPersonalInfoError] = useState("");

  const resetAll = () => {
    setStep("summary");
    setPersonalInfoConfirmed(false);
    setSecondaryAddressSame("Yes");
    setNatureInput(DEFAULT_NATURE_OF_EMPLOYMENT);
    setRegimeInput("Old");
    setPersonalInfoError("");
  };

  const handlePersonalInfoConfirm = () => {
    const natureMatches = natureInput.toLowerCase() === nature.toLowerCase();
    const regimeMatches = regimeInput.toLowerCase() === regime.toLowerCase().slice(0, 3);
    if (requireCredentialValidation && (!natureMatches || !regimeMatches)) {
      setPersonalInfoError(
        "Selection does not match the experiment brief. Please re-check and try again."
      );
      return;
    }
    setPersonalInfoError("");
    setPersonalInfoConfirmed(true);
    setStep("summary");
  };

  const handleSubmitReturn = () => {
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
    resetAll();
  };

  const returnSummarySections = [
    {
      key: "personal",
      icon: FaFileAlt,
      label: "Personal Information (Mandatory)",
      desc: "Details of personal information, contact details, and bank account details",
      confirmed: personalInfoConfirmed,
      onClick: () => setStep("personalInfo"),
    },
    {
      key: "income",
      icon: FaCalculator,
      label: "Gross Total Income (Mandatory)",
      desc: "Please verify your income sources as collected from various sources and proceed",
      confirmed: false,
      onClick: undefined,
    },
    {
      key: "deductions",
      icon: FaMoneyBillWave,
      label: "Total Deductions (Mandatory)",
      desc: "Please verify your deduction details and proceed further",
      confirmed: false,
      onClick: undefined,
    },
    {
      key: "taxPaid",
      icon: FaMoneyCheckAlt,
      label: "Tax Paid",
      desc: "Please verify details of taxes paid by you in the last financial year and proceed further",
      confirmed: false,
      onClick: undefined,
    },
  ];

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
            <p className="text-white font-bold text-[15px]">Personal Information Confirmed Successfully!</p>
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
              className={`px-4 py-2.5 uppercase tracking-wide border-r border-white/5 cursor-default ${
                item === "e-File" ? "underline underline-offset-4" : ""
              }`}
            >
              {item}
            </span>
          ))}
          <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 14:59</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          {step === "summary" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">
                Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns{" "}
                <span className="text-slate-400 font-normal">›</span> ITR-1{" "}
                <span className="text-slate-400 font-normal">›</span> Validate Your Pre-Filled Data
              </p>
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-2">
                Let&apos;s validate your pre-filled return
              </h2>
              <p className="text-[12px] text-slate-600 mb-6 max-w-6xl">
                Income Tax return (ITR) is pre-filled based on the information available for
                pre-fill on e-Filing. There may be situations where such information may not be
                complete. Please verify each section against the AIS/TIS before finalising and
                submitting the ITR.
              </p>

              <div className="max-w-5xl border border-slate-200 rounded divide-y divide-slate-100 mb-6">
                {returnSummarySections.map(({ key, icon: Icon, label, desc, confirmed, onClick }) => (
                  <div
                    key={key}
                    onClick={onClick}
                    className={`flex items-center gap-4 p-4 ${
                      onClick ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
                    }`}
                  >
                    <Icon className="text-[#0f3a9a] shrink-0" size={22} />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#0a2558] flex items-center gap-2">
                        {label}
                        {confirmed && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#16a34a]">
                            <CheckCircle2 size={13} /> Confirmed
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">{desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-slate-700">
                        {confirmed ? pan : "—"}
                      </p>
                      <p className="text-[10.5px] text-[#0f3a9a] font-semibold">Modify if required</p>
                    </div>
                  </div>
                ))}
              </div>

              {personalInfoConfirmed && (
                <button
                  onClick={handleSubmitReturn}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm &amp; Proceed ›
                </button>
              )}
            </>
          )}

          {step === "personalInfo" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">
                Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns{" "}
                <span className="text-slate-400 font-normal">›</span> Personal Information
              </p>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-1">Personal Information</h2>
              <p className="text-[12px] text-slate-500 mb-1 max-w-5xl">
                Details of personal information, contact details, and bank account details.
              </p>
              <p className="text-[10.5px] text-red-500 font-semibold mb-4 text-right max-w-5xl">
                * Indicates mandatory fields
              </p>

              <div className="max-w-5xl border border-slate-200 rounded p-5 mb-5">
                <p className="text-[15px] font-bold text-[#0a2558] mb-4">Profile</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      First Name
                    </label>
                    <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                      {firstName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Middle Name
                    </label>
                    <p className="text-[12.5px] font-semibold text-slate-400 border-b border-slate-200 pb-1.5">
                      &nbsp;
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Last Name
                    </label>
                    <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                      {lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">PAN</label>
                    <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                      {pan}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Date of Birth
                    </label>
                    <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                      {dob}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Aadhaar Number
                    </label>
                    <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                      {aadhaar}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Mobile Number
                    </label>
                    <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                      {mobile}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Email ID
                    </label>
                    <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                      {email}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-slate-600 mb-1">Address</p>
                <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5 mb-4">
                  {address}
                </p>

                <p className="text-[12px] font-semibold text-slate-700 mb-2">
                  Is the secondary address same as primary address?
                </p>
                <div className="flex items-center gap-6 mb-5">
                  {(["Yes", "No"] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={secondaryAddressSame === option}
                        onChange={() => setSecondaryAddressSame(option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>

                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Nature of Employment <span className="text-red-500">*</span>
                </label>
                <select
                  value={natureInput}
                  onChange={(e) => {
                    setNatureInput(e.target.value);
                    setPersonalInfoError("");
                  }}
                  className="w-full md:w-72 border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 bg-white outline-none focus:border-blue-500 mb-5"
                >
                  {natureOfEmploymentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Tax Regime <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-6">
                  {(["Old", "New"] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={regimeInput === option}
                        onChange={() => {
                          setRegimeInput(option);
                          setPersonalInfoError("");
                        }}
                      />
                      Opting for {option} Tax Regime
                    </label>
                  ))}
                </div>

                {personalInfoError && (
                  <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mt-4">
                    {personalInfoError}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 max-w-5xl">
                <button
                  onClick={() => setStep("summary")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handlePersonalInfoConfirm}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm ›
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-auto shrink-0 flex items-start gap-2 bg-[#eff6ff] border-t border-[#bfdbfe] px-6 py-3 text-[11px] text-slate-600">
          <span>
            Father&apos;s Name on record: <span className="font-bold">{fatherName}</span> &mdash;
            all figures shown are pre-filled defaults for this simulation.
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
