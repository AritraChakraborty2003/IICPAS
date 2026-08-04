"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaPhoneAlt,
  FaGlobe,
  FaMoon,
  FaTwitter,
  FaYoutube,
  FaFacebookF,
  FaCheckDouble,
  FaLink,
  FaFileInvoice,
  FaCalculator,
  FaMoneyBillWave,
  FaMoneyCheckAlt,
  FaBolt,
  FaShieldAlt,
  FaUserTie,
  FaHandHoldingUsd,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFlag,
  FaIdCard,
  FaFileAlt,
  FaCalendarAlt,
  FaInfoCircle,
  FaBell,
  FaDownload,
  FaPlayCircle,
} from "react-icons/fa";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "home" | "getStarted";

interface ITRReg1SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-1 -> itr-reg-1 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-1";

const DEFAULT_PAN = "AKSPA3663B";

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

const quickLinks = [
  { icon: FaCheckDouble, label: "e- Verify Return" },
  { icon: FaLink, label: "Link Aadhaar Status" },
  { icon: FaLink, label: "Link Aadhaar" },
  { icon: FaFileInvoice, label: "Income Tax Return (ITR) Status" },
  { icon: FaCalculator, label: "Income Tax Calculator" },
  { icon: FaMoneyBillWave, label: "e-Pay Tax" },
  { icon: FaMoneyCheckAlt, label: "Know Tax Payment Status" },
  { icon: FaBolt, label: "Instant E-PAN" },
  { icon: FaShieldAlt, label: "Authenticate notice/order issued by ITD" },
  { icon: FaUserTie, label: "Know Your AO" },
  { icon: FaHandHoldingUsd, label: "TDS On Cash Withdrawal" },
  { icon: FaClipboardCheck, label: "Verify Service Request" },
  { icon: FaExclamationTriangle, label: "Submit Information on Tax Evasion or Benami Property" },
  { icon: FaFlag, label: "Report Account Misuse" },
  { icon: FaIdCard, label: "Verify Your PAN" },
  { icon: FaFileAlt, label: "Know TAN Details" },
  { icon: FaCalendarAlt, label: "Tax Calendar" },
  { icon: FaInfoCircle, label: "Tax Information & services" },
  { icon: FaBell, label: "Comply to Notice" },
  { icon: FaDownload, label: "Download CSI File" },
];

const latestUpdates = [
  { date: "25-May-2023", tag: "News", text: "Excel Utility of ITR-3 for AY 20XX-XX is available for fi…" },
  { date: "03-May-2023", tag: "e-Campaign", text: "120 Days unverified campaign" },
  { date: "20-May-2023", tag: "News", text: "Income-tax Returns Form ITR 1 and ITR 4 are enabled at th…" },
  { date: "26-Apr-2023", tag: "e-Campaign", text: "120 Days unverified campaign" },
];

const successEnablers = [
  { value: "11,06,83,684", label: "Individual Registered Users" },
  { value: "6,47,637", label: "No. of returns verified (AY 23-24)" },
  { value: "7,55,412", label: "No. of returns filed (AY 23-24)" },
  { value: "3,384", label: "No. of verified ITRs (AY 23-24) processed" },
];

const thingsToKnowVideos = [
  "How to file Rectification Request for Return Data Correction",
  "Faceless Assessment and Video conferencing in faceless Assessment.",
  "Error Resolution - Linking Aadhaar with PAN",
  "Updated Income Tax Return (ITR U)",
];

const committedTaxpayers = [
  { count: "6148", label: "Platinum", color: "bg-sky-400" },
  { count: "15827", label: "Gold", color: "bg-amber-400" },
  { count: "2Lakh+", label: "Silver", color: "bg-slate-400" },
  { count: "32Lakhs+", label: "Bronze", color: "bg-orange-400" },
];

const footerColumns = [
  {
    heading: "About Us",
    links: [
      "About the Portal",
      "History of Direct Taxation",
      "Vision, Mission, Values",
      "Vision, Mission, Values (Hindi)",
      "Who We Are",
      "Right to Information",
      "Organization & Functions",
      "Media Reports",
      "e-Filing Calender 2022",
      "Tax Payer Charter",
      "Tax Payer Charter (Hindi)",
    ],
  },
  {
    heading: "Contact Us",
    links: ["Helpdesk Numbers", "Grievances", "View Grievance", "Feedback", "Help"],
  },
  {
    heading: "Using the Portal",
    links: ["Website Policies", "Accessibility Statement", "Site Map", "Browser Support"],
  },
  {
    heading: "Related Sites",
    links: ["Income Tax India", "Protean (previously NSDL)", "TRACES"],
  },
];

export default function ITRReg1Simulation({ onComplete }: ITRReg1SimulationProps = {}) {
  const router = useRouter();
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("home");

  const [panInput, setPanInput] = useState("");
  const [panValidated, setPanValidated] = useState(false);
  const [panError, setPanError] = useState("");

  const [confirmChoice, setConfirmChoice] = useState<"yes" | "no" | null>(null);
  const [confirmError, setConfirmError] = useState("");

  const goToGetStarted = () => setStep("getStarted");

  const handleValidatePan = () => {
    const trimmed = panInput.trim().toUpperCase();
    if (!trimmed) {
      setPanError("Please enter a PAN.");
      return;
    }
    if (requireCredentialValidation && trimmed !== pan.toUpperCase()) {
      setPanError("Invalid PAN. Please enter the PAN provided in the experiment brief.");
      setPanValidated(false);
      return;
    }
    setPanError("");
    setPanValidated(true);
  };

  // Confirming "Individual taxpayer" and clicking Continue completes this
  // exercise immediately - there is no further step in this simulation.
  const handleConfirmContinue = () => {
    if (confirmChoice !== "yes") {
      setConfirmError('Please select "Yes" to confirm registration as Individual taxpayer.');
      return;
    }
    setConfirmError("");
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  const handleReturn = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) router.back();
    else window.close();
  };

  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans antialiased flex flex-col select-none relative">
      {/* START EXPERIMENT OVERLAY */}
      {!isExperimentStarted && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1.5px] z-40 flex items-center justify-center">
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
            <p className="text-white font-bold text-[15px]">Registration Successful!</p>
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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep("home")}>
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
          <div className="flex items-center gap-4 text-slate-600">
            <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold cursor-default">
              <FaPhoneAlt size={11} /> Call Us
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold cursor-default">
              <FaGlobe size={11} /> English
            </span>
            <span className="hidden lg:flex items-center gap-0.5 text-[11px] font-bold cursor-default">
              <span>A</span>
              <span className="text-[13px]">A+</span>
            </span>
            <FaMoon size={14} className="hidden lg:block text-slate-400 cursor-default" />
            <button
              onClick={() => setStep("home")}
              className="border border-[#0f3a9a] text-[#0f3a9a] text-[11px] font-bold px-4 py-2 rounded cursor-pointer hover:bg-[#0f3a9a]/5"
            >
              Login
            </button>
            <button
              onClick={goToGetStarted}
              className="bg-[#0f3a9a] text-white text-[11px] font-bold px-4 py-2 rounded border-2 border-red-500 cursor-pointer hover:bg-[#0a2558]"
            >
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
          <span className="ml-auto p-2.5 pr-4">
            <FaSearch size={11} />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        {step === "home" && (
          <div className="flex-1 w-full">
            {/* News ticker */}
            <div className="bg-[#fdf1e7] border-b border-[#f3d9be] px-5 py-2 text-[11px] font-semibold text-slate-700 truncate">
              2. Excel utilities of ITR 1 and ITR 4 for AY 20XX-XX are live now!! 3. CSI file
              download functionality has been enabled at e-filing portal.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 p-5">
              {/* Quick Links sidebar */}
              <div className="border border-slate-200 rounded">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-[15px] font-bold text-[#0a2558] relative inline-block">
                    Quick Links
                    <span className="absolute -bottom-1 left-0 h-[2px] w-8 bg-[#0f3a9a]" />
                  </h3>
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                  {quickLinks.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 px-4 py-2.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-default"
                    >
                      <Icon className="text-[#0f3a9a] shrink-0" size={14} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero + Latest Updates */}
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-5 items-center">
                  <div>
                    <h2 className="text-[26px] font-black text-[#0a2558] mb-2">e-Filing 2.0</h2>
                    <p className="text-slate-500 text-[13px] mb-4">
                      All features of the new portal that makes e-Filing easier for you!
                    </p>
                    <button className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[12px] px-5 py-2.5 rounded cursor-pointer transition-colors">
                      Guided tour of the portal
                    </button>
                    <div className="flex gap-1.5 mt-4">
                      {[0, 1, 2, 3].map((dot) => (
                        <span
                          key={dot}
                          className={`h-1.5 w-1.5 rounded-full ${
                            dot === 0 ? "bg-[#0f3a9a]" : "bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <img
                    src="/images/simulations/home-user-image.png"
                    alt="Taxpayer using e-Filing portal"
                    className="w-full max-w-[260px] justify-self-end object-contain"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[15px] font-bold text-[#0a2558] relative inline-block">
                      Latest Updates
                      <span className="absolute -bottom-1 left-0 h-[2px] w-8 bg-[#0f3a9a]" />
                    </h3>
                    <span className="text-[11px] font-bold text-[#0f3a9a] cursor-default">
                      View All
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {latestUpdates.map((update) => (
                      <div
                        key={update.date + update.text}
                        className="border border-slate-200 rounded p-3"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-500">
                            Date : {update.date}
                          </span>
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                              update.tag === "News"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {update.tag}
                          </span>
                        </div>
                        <p className="text-[12px] font-semibold text-slate-800">{update.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Success Enablers + Things To Know */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 px-5 pb-5">
              <div>
                <h3 className="text-[15px] font-bold text-[#0a2558] mb-4 relative inline-block">
                  Our Success Enablers
                  <span className="absolute -bottom-1 left-0 h-[2px] w-8 bg-[#0f3a9a]" />
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {successEnablers.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[18px] font-black text-slate-800">{stat.value}</p>
                      <p className="text-[10.5px] text-slate-500 font-semibold">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 text-[10.5px]">
                  <span className="text-slate-400 font-semibold">As on : 21-May-2023</span>
                  <span className="text-[#0f3a9a] font-bold cursor-default">View All</span>
                </div>
              </div>

              <div>
                <h3 className="text-[15px] font-bold text-[#0a2558] mb-3 relative inline-block">
                  Things To Know
                  <span className="absolute -bottom-1 left-0 h-[2px] w-8 bg-[#0f3a9a]" />
                </h3>
                <div className="flex gap-2 mb-3">
                  {["How to ...Videos", "Awareness Videos", "Brochures"].map((tab, idx) => (
                    <span
                      key={tab}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded border cursor-default ${
                        idx === 0
                          ? "border-[#0f3a9a] text-[#0f3a9a]"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {thingsToKnowVideos.map((title) => (
                    <div key={title} className="flex items-center gap-2.5">
                      <FaPlayCircle className="text-[#0f3a9a] shrink-0" size={22} />
                      <span className="text-[11.5px] font-semibold text-slate-700 underline">
                        {title}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-[#0f3a9a] cursor-default block mt-3">
                  View All
                </span>
              </div>
            </div>

            {/* Taxpayer Voices + Committed Taxpayers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 px-5 pb-8">
              <div>
                <h3 className="text-[15px] font-bold text-[#0a2558] mb-3 relative inline-block">
                  Taxpayer Voices<span className="text-[#0f3a9a]">#ITDindia</span>
                  <span className="absolute -bottom-1 left-0 h-[2px] w-8 bg-[#0f3a9a]" />
                </h3>
                <div className="flex items-start gap-2 text-[11.5px] text-slate-600 italic">
                  <FaTwitter className="text-sky-400 mt-0.5 shrink-0" size={13} />
                  <p>बहुत बहुत धन्यवाद मैडम, outstanding demand खत्म कर दी गई। Regards, Rakesh</p>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-2">21-May-2023</p>
              </div>

              <div className="bg-slate-50 rounded p-4">
                <h3 className="text-[15px] font-bold text-[#0a2558] mb-2 relative inline-block">
                  Our Committed Taxpayers
                  <span className="absolute -bottom-1 left-0 h-[2px] w-8 bg-[#0f3a9a]" />
                </h3>
                <p className="text-[11px] text-slate-600 mb-3">
                  To express gratitude towards committed taxpayers, the Income Tax Department has
                  started a unique appreciation initiative recognizing Platinum, Gold, Silver, and
                  Bronze category taxpayers.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {committedTaxpayers.map((badge) => (
                    <div key={badge.label} className="flex items-center gap-2.5">
                      <span
                        className={`h-8 w-8 rounded-full ${badge.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}
                      >
                        ★
                      </span>
                      <div>
                        <p className="text-[13px] font-black text-slate-800">{badge.count}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {badge.label} Certificate Winners
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "getStarted" && (
          <div className="flex-1 w-full px-6 py-6">
            <div className="flex items-center justify-between mb-8 max-w-2xl">
              {stepperItems.map((label, idx) => (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                        idx === 0
                          ? "border-[#0f3a9a] text-[#0f3a9a]"
                          : "border-slate-300 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        idx === 0 ? "text-[#0a2558]" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < stepperItems.length - 1 && (
                    <div className="flex-1 h-[2px] bg-slate-200 mx-1" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="max-w-xl border border-slate-200 rounded p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#0a2558] mb-1">Let&apos;s get started</h3>
              <p className="text-[11px] font-bold text-slate-500 mb-4">Register as</p>
              <div className="flex gap-2 mb-5">
                <span className="bg-[#0f3a9a] text-white text-[12px] font-bold px-4 py-1.5 rounded">
                  Taxpayer
                </span>
                <span className="border border-slate-300 text-slate-500 text-[12px] font-bold px-4 py-1.5 rounded">
                  Others
                </span>
              </div>

              <label className="block text-[12px] font-bold text-slate-700 mb-1">
                PAN <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3 mb-3">
                <input
                  value={panInput}
                  disabled={panValidated}
                  onChange={(e) => {
                    setPanInput(e.target.value.toUpperCase());
                    setPanError("");
                  }}
                  maxLength={10}
                  className="border border-slate-300 rounded px-3 py-2 text-[13px] font-semibold uppercase text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-100 w-52"
                />
                <button
                  onClick={handleValidatePan}
                  disabled={panValidated}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] disabled:opacity-60 text-white font-bold text-[12px] px-5 py-2 rounded cursor-pointer transition-colors"
                >
                  Validate
                </button>
              </div>

              {panError && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-600 mb-3">
                  {panError}
                </div>
              )}

              {panValidated && (
                <>
                  <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-[11.5px] text-green-700 font-semibold mb-4">
                    Success : PAN validated successfully.
                  </div>

                  <p className="text-[12px] font-semibold text-slate-700 mb-2">
                    Please confirm if you want to register as &quot;Individual taxpayer&quot;
                  </p>
                  <div className="flex items-center gap-6 mb-3">
                    <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmChoice === "yes"}
                        onChange={() => {
                          setConfirmChoice("yes");
                          setConfirmError("");
                        }}
                        className="h-4 w-4"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmChoice === "no"}
                        onChange={() => {
                          setConfirmChoice("no");
                          setConfirmError("");
                        }}
                        className="h-4 w-4"
                      />
                      No
                    </label>
                  </div>

                  <p className="text-[10.5px] text-slate-500 mb-4">
                    Note: Please ensure your Status is correct as details in subsequent screens
                    will be based on your Status.
                  </p>

                  {confirmError && (
                    <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-600 mb-3">
                      {confirmError}
                    </div>
                  )}

                  <button
                    onClick={handleConfirmContinue}
                    className="w-full bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] py-2.5 rounded cursor-pointer transition-colors"
                  >
                    Continue ›
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step === "home" ? (
          <div className="bg-[#0b1a30] text-white/70 mt-auto shrink-0">
            <div className="px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              {footerColumns.map((col) => (
                <div key={col.heading}>
                  <h4 className="text-white font-bold text-[12.5px] mb-3">{col.heading}</h4>
                  <ul className="space-y-2 text-[11px]">
                    {col.links.map((link) => (
                      <li key={link} className="cursor-default hover:text-white transition-colors">
                        {link}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="px-6 pb-4 flex items-center gap-3">
              <span className="text-[11px] font-bold text-white">Follow us on :</span>
              {[FaYoutube, FaTwitter, FaFacebookF].map((Icon, idx) => (
                <span
                  key={idx}
                  className="h-7 w-7 rounded border border-white/20 flex items-center justify-center cursor-default"
                >
                  <Icon size={12} />
                </span>
              ))}
            </div>
            <div className="border-t border-white/10 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <img
                  src="/images/simulations/satyamev-jayate.jpg"
                  alt="india.gov.in"
                  className="h-8 w-8 object-contain bg-white rounded-full p-0.5"
                />
                <div className="text-[10px]">
                  <p className="font-bold text-white">india.gov.in</p>
                  <p>national portal of india</p>
                </div>
              </div>
              <div className="text-[10px] text-right space-y-1">
                <p>Last reviewed and updated on : 26-May-2023</p>
                <p>
                  This site is best viewed in 1024 * 768 resolution with latest version of Chrome,
                  Firefox, Safari and Microsoft Edge.
                </p>
              </div>
            </div>
            <div className="px-6 pb-4 text-[10px] text-center md:text-left">
              Copyright @ Fincurious Innovations Sample, Ministry of Finance, Government of India.
              All Rights Reserved.
            </div>
          </div>
        ) : (
          <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto shrink-0">
            <span>© 2022 IICPA Simulation Software Designed &amp; Developed by IICPA</span>
            <span>
              Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+,
              Firefox 45+ and Safari 6+
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
