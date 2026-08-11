"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, ArrowLeft, Info } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step =
  | "selectStatus"
  | "chooseForm"
  | "itrIntro"
  | "reasonForFiling"
  | "selectSchedule"
  | "scheduleSummary";

type ScheduleCategory = "general" | "income" | "deduction" | "tax" | "others";

type ScheduleItem = {
  id: string;
  label: string;
  title: string;
  desc: string;
  category: ScheduleCategory;
  mandatory?: boolean;
};

interface ITRReg18SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-18 -> itr-reg-18 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-18";

const DEFAULT_NAME = "Sanjay Sahu";
const DEFAULT_PAN = "SNSPS4827K";
const DEFAULT_STATUS = "Individual";
const DEFAULT_ITR_FORM = "ITR-2";
const DEFAULT_REASON = "Taxable income is more than basic exemption limit";
const DEFAULT_REQUIRED_INCOME_SCHEDULES =
  "Schedule S,Schedule HP,Schedule CG,Schedule OS";

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

const itrFormDescriptions: Record<string, string> = {
  "ITR-1":
    "For individuals being a resident (other than not ordinarily resident) having total income upto ₹ 50 lakh, having Income from Salaries, one house property, other sources (Interest etc.), and agricultural income upto ₹ 5,000.",
  "ITR-2": "For Individuals and HUFs not having income from profits and gains of business or profession.",
  "ITR-3": "For individuals and HUFs having income from profits and gains of business or profession.",
  "ITR-4":
    "For Individuals, HUFs and Firms (other than LLP) being a resident having total income upto ₹ 50 lakh and having income from business and profession which is computed under sections 44AD, 44ADA or 44AE.",
};

const scheduleCatalog: ScheduleItem[] = [
  {
    id: "partAGen",
    label: "Part A-Gen",
    title: "Schedule Part A - General Information",
    desc: "Details of personal information and filing status",
    category: "general",
    mandatory: true,
  },
  {
    id: "scheduleS",
    label: "Schedule S",
    title: "Income from Salary",
    desc: "Details of income chargeable under the head Salaries",
    category: "income",
  },
  {
    id: "scheduleHP",
    label: "Schedule HP",
    title: "Income from House Property",
    desc: "Details of income chargeable under the head House Property",
    category: "income",
  },
  {
    id: "scheduleCG",
    label: "Schedule CG",
    title: "Capital Gains",
    desc: "Details of Capital Gains",
    category: "income",
  },
  {
    id: "scheduleOS",
    label: "Schedule OS",
    title: "Income from Other Sources",
    desc: "Details of income chargeable under the head Other Sources",
    category: "income",
  },
  {
    id: "scheduleVIA",
    label: "Schedule VI-A",
    title: "Deductions under Chapter VI-A",
    desc: "Details of deductions from total income under Chapter VI-A",
    category: "deduction",
  },
  {
    id: "scheduleTDS",
    label: "Schedule TDS",
    title: "TDS/TCS Details",
    desc: "Details of Tax Deducted / Collected at Source",
    category: "tax",
  },
  {
    id: "scheduleIT",
    label: "Schedule IT",
    title: "Advance Tax and Self Assessment Tax",
    desc: "Details of payments of Advance Tax and Self Assessment Tax",
    category: "tax",
  },
  {
    id: "scheduleEI",
    label: "Schedule EI",
    title: "Exempt Income",
    desc: "Details of income not forming part of total income",
    category: "others",
  },
  {
    id: "scheduleAL",
    label: "Schedule AL",
    title: "Assets and Liabilities",
    desc: "Details of Assets and Liabilities at the end of the year",
    category: "others",
  },
];

const scheduleCategoryTabs: { key: ScheduleCategory; label: string }[] = [
  { key: "general", label: "General" },
  { key: "income", label: "Income" },
  { key: "deduction", label: "Deduction" },
  { key: "tax", label: "Tax" },
  { key: "others", label: "Others" },
];

const documentsList = [
  "Form 16",
  "House rent receipt",
  "Investment premium payment receipts - LIC, ULIP etc.",
];

const faqList = [
  "Do I need to file Income Tax Returns for this year?",
  "I don't have a Form-16, can I still file my returns?",
  "Can somebody else file income tax return on my behalf?",
];

const helpCards = [
  { title: "How to prevalidate Bank Account?", link: "View more" },
  { title: "Step by step guide to filing house rent…", link: "View more" },
  { title: "Rent Control Act 1952 - For Urban Areas", link: "Refer Circular" },
];

export default function ITRReg18Simulation({ onComplete }: ITRReg18SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const status = findFieldValue(simConfig, /status/i) || DEFAULT_STATUS;
  const itrForm = findFieldValue(simConfig, /itr form|form/i) || DEFAULT_ITR_FORM;
  // Admin-configured (Simulation Manager) reason text - drives both the
  // rendered label and the validation check, never hardcoded.
  const reason = findFieldValue(simConfig, /reason/i) || DEFAULT_REASON;
  const requiredIncomeSchedulesRaw =
    findFieldValue(simConfig, /schedule/i) || DEFAULT_REQUIRED_INCOME_SCHEDULES;
  const requiredIncomeSchedules = useMemo(
    () =>
      requiredIncomeSchedulesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [requiredIncomeSchedulesRaw]
  );
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("selectStatus");

  const [statusInput, setStatusInput] = useState(DEFAULT_STATUS);
  const [statusError, setStatusError] = useState("");

  const [itrFormInput, setItrFormInput] = useState(DEFAULT_ITR_FORM);
  const [formError, setFormError] = useState("");

  const [reasonInput, setReasonInput] = useState("");
  const [reasonError, setReasonError] = useState("");

  const [selectedSchedules, setSelectedSchedules] = useState<Record<string, boolean>>({
    partAGen: true,
  });
  const [activeCategory, setActiveCategory] = useState<ScheduleCategory>("general");
  const [scheduleError, setScheduleError] = useState("");

  const resetAll = () => {
    setStep("selectStatus");
    setStatusInput(DEFAULT_STATUS);
    setStatusError("");
    setItrFormInput(DEFAULT_ITR_FORM);
    setFormError("");
    setReasonInput("");
    setReasonError("");
    setSelectedSchedules({ partAGen: true });
    setActiveCategory("general");
    setScheduleError("");
  };

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
    setStep("chooseForm");
  };

  const handleProceedWithForm = () => {
    if (!itrFormInput) {
      setFormError("Please select the ITR Form you need to file.");
      return;
    }
    if (requireCredentialValidation && itrFormInput !== itrForm) {
      setFormError("Selection does not match the experiment brief. Please re-check and try again.");
      return;
    }
    setFormError("");
    setStep("itrIntro");
  };

  const handleReasonContinue = () => {
    if (!reasonInput) {
      setReasonError("Please select the reason for filing.");
      return;
    }
    if (requireCredentialValidation && reasonInput !== reason) {
      setReasonError("Selection does not match the experiment brief. Please re-check and try again.");
      return;
    }
    setReasonError("");
    setStep("selectSchedule");
  };

  const toggleSchedule = (item: ScheduleItem) => {
    if (item.mandatory) return;
    setSelectedSchedules((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    setScheduleError("");
  };

  const selectedIncomeLabels = useMemo(
    () =>
      scheduleCatalog
        .filter((item) => item.category === "income" && selectedSchedules[item.id])
        .map((item) => item.label),
    [selectedSchedules]
  );

  const handleScheduleContinue = () => {
    if (selectedIncomeLabels.length === 0) {
      setScheduleError("Please select at-least one schedule from Income category in order to proceed further.");
      return;
    }
    if (requireCredentialValidation) {
      const selectedSorted = [...selectedIncomeLabels].sort().join("|").toLowerCase();
      const requiredSorted = [...requiredIncomeSchedules].sort().join("|").toLowerCase();
      if (selectedSorted !== requiredSorted) {
        setScheduleError("Selection does not match the experiment brief. Please re-check and try again.");
        return;
      }
    }
    setScheduleError("");
    setStep("scheduleSummary");
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

  const breadcrumb =
    step === "selectStatus"
      ? "Dashboard › Filing Returns for Current A.Y."
      : step === "chooseForm"
      ? "Dashboard › Filing Returns"
      : "Dashboard › Filing Returns › " + itrFormInput;

  const totalSelectedCount = Object.values(selectedSchedules).filter(Boolean).length;
  const categoryCount = (category: ScheduleCategory) =>
    scheduleCatalog.filter((item) => item.category === category && selectedSchedules[item.id]).length;

  const selectedScheduleSummary = scheduleCatalog.filter((item) => selectedSchedules[item.id]);

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
            <p className="text-white font-bold text-[15px]">{itrFormInput} Filed Successfully!</p>
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
            <p className="text-[10px] text-slate-400 cursor-default">
              {step === "selectStatus" ? "Logout" : statusInput}
            </p>
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
          <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">{breadcrumb}</p>

          {step === "selectStatus" && (
            <>
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

              <div className="flex items-center gap-3">
                <button
                  disabled
                  title="Not available in this simulation"
                  className="border border-slate-200 text-slate-300 font-bold text-[13px] px-6 py-2 rounded cursor-not-allowed"
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

          {step === "chooseForm" && (
            <>
              <h2 className="text-[28px] font-bold text-[#0a2558] mb-5">Income Tax Returns</h2>
              <p className="text-[15px] font-semibold text-slate-700 mb-5">
                You need to choose an ITR Form to proceed
              </p>

              <div className="flex flex-col md:flex-row gap-8 max-w-3xl">
                <div>
                  <p className="text-[12px] font-semibold text-slate-600 mb-2">
                    Help me decide which ITR Form to file
                  </p>
                  <button
                    disabled
                    className="border border-slate-300 text-slate-400 font-bold text-[12px] px-5 py-2 rounded cursor-not-allowed"
                  >
                    Proceed ›
                  </button>
                </div>

                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-[#0f3a9a] underline mb-1 cursor-default">
                    Show Summary Immovable Property Sale Transaction Data
                  </p>
                  <p className="text-[12px] font-semibold text-slate-600 mb-2">
                    I know which ITR Form I need to file
                  </p>
                  <select
                    value={itrFormInput}
                    onChange={(e) => {
                      setItrFormInput(e.target.value);
                      setFormError("");
                    }}
                    className="w-56 border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 bg-white outline-none focus:border-blue-500 mb-3"
                  >
                    {["ITR-1", "ITR-2", "ITR-3", "ITR-4"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <p className="text-[12px] text-slate-600 mb-4 max-w-md">
                    {itrFormDescriptions[itrFormInput]}
                  </p>

                  {formError && (
                    <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-3 max-w-md">
                      {formError}
                    </div>
                  )}

                  <button
                    onClick={handleProceedWithForm}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-5 py-2.5 rounded cursor-pointer transition-colors"
                  >
                    Proceed With {itrFormInput}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep("selectStatus")}
                className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors mt-8"
              >
                ‹ Back
              </button>
            </>
          )}

          {step === "itrIntro" && (
            <>
              <h2 className="text-[28px] font-bold text-[#0a2558] mb-2">
                {itrFormInput} - (Income Tax Return {itrFormInput.replace("ITR-", "")})
              </h2>
              <p className="text-[12px] text-slate-600 mb-5 max-w-2xl">
                {itrFormDescriptions[itrFormInput]}
              </p>

              <div className="flex items-center gap-3 mb-8 max-w-lg">
                {["Validate your Returns breakup (Pre-filled)", "Confirm your Return Summary", "Verify & Submit your Return"].map(
                  (label, idx) => (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center gap-1.5 w-24 text-center">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-[13px] border-2 border-slate-300 text-slate-400">
                          {idx + 1}
                        </div>
                        <span className="text-[9.5px] font-semibold text-slate-500">{label}</span>
                      </div>
                      {idx < 2 && <div className="flex-1 h-[2px] bg-slate-200" />}
                    </React.Fragment>
                  )
                )}
              </div>

              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => setStep("chooseForm")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={() => setStep("reasonForFiling")}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Let&apos;s Get Started ›
                </button>
              </div>

              <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-6 mb-8">
                <div>
                  <p className="text-[14px] font-bold text-[#0a2558] mb-3">
                    Documents list to help you file faster
                  </p>
                  <ul className="space-y-2 text-[12px] text-[#0f3a9a] font-semibold">
                    {documentsList.map((doc) => (
                      <li key={doc} className="cursor-default">
                        {doc}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11.5px] text-[#0f3a9a] font-bold mt-3 cursor-default">View more</p>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#0a2558] mb-3">
                    Frequently Asked Questions (FAQ)
                  </p>
                  <ul className="space-y-2 text-[12px] text-[#0f3a9a] font-semibold">
                    {faqList.map((faq) => (
                      <li key={faq} className="cursor-default">
                        {faq}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11.5px] text-[#0f3a9a] font-bold mt-3 cursor-default">View more</p>
                </div>
              </div>

              <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-6 mb-8">
                {helpCards.map((card) => (
                  <div key={card.title} className="bg-slate-50 rounded p-4">
                    <p className="text-[12.5px] font-semibold text-slate-700 mb-2">{card.title}</p>
                    <p className="text-[11.5px] text-[#0f3a9a] font-bold cursor-default">{card.link}</p>
                  </div>
                ))}
              </div>

              <div className="max-w-4xl border-t border-slate-200 pt-4 text-[10px] text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/simulations/satyamev-jayate.jpg"
                    alt="india.gov.in"
                    className="h-6 w-6 object-contain rounded-full"
                  />
                  <div className="leading-tight">
                    <p className="font-bold text-slate-700">india.gov.in</p>
                    <p>national portal of india</p>
                  </div>
                </div>
                <p>
                  Feedback | Website Policies | Accessibility Statement | Site Map | Browser
                  Support | CoBrowse Help
                </p>
                <p>Last reviewed and updated on : 16-Apr-2024</p>
              </div>
              <p className="max-w-4xl text-[10px] text-slate-400 mt-2">
                This site is best viewed in 1024 * 768 resolution with latest version of Chrome,
                Firefox, Safari and Internet Explorer.
              </p>
            </>
          )}

          {step === "reasonForFiling" && (
            <>
              <h2 className="text-[20px] font-bold text-[#0a2558] mb-1 max-w-2xl">
                Please answer the following question to proceed further
              </h2>
              <p className="text-[13px] font-semibold text-slate-600 mb-5 max-w-2xl">
                Are you filing the income tax return for any of the following reasons?
              </p>

              <div className="max-w-2xl space-y-4 mb-5">
                <label
                  className={`flex items-start gap-2.5 border rounded px-4 py-3.5 cursor-pointer ${
                    reasonInput === reason ? "border-[#0f3a9a] bg-blue-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    className="mt-0.5"
                    checked={reasonInput === reason}
                    onChange={() => {
                      setReasonInput(reason);
                      setReasonError("");
                    }}
                  />
                  <span className="text-[12.5px] font-semibold text-slate-700">{reason}</span>
                </label>

                <label className="flex items-start gap-2.5 border border-slate-200 rounded px-4 py-3.5 cursor-pointer">
                  <input
                    type="radio"
                    className="mt-0.5"
                    checked={reasonInput === "proviso"}
                    onChange={() => {
                      setReasonInput("proviso");
                      setReasonError("");
                    }}
                  />
                  <div className="text-[12.5px] font-semibold text-slate-700">
                    <p className="mb-2">
                      Filing return of income due to fulfilling any one or more below mentioned
                      conditions as per Seventh Proviso to section 139(1):
                    </p>
                    <ul className="space-y-1.5 font-normal text-[11.5px] text-slate-600">
                      <li>
                        ▢ Deposited amount or aggregate of amounts exceeding ₹ 1 crore in
                        one or more current accounts during the previous year;
                      </li>
                      <li>
                        ▢ Incurred expenditure of an amount or aggregate of amount exceeding ₹
                        2 lakhs for travel to a foreign country for yourself or for any other person;
                      </li>
                      <li>
                        ▢ Incurred expenditure of amount or aggregate of amount exceeding ₹ 1
                        lakh on consumption of electricity during the previous year
                      </li>
                    </ul>
                  </div>
                </label>
              </div>

              {reasonError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4 max-w-2xl">
                  {reasonError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("itrIntro")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleReasonContinue}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Continue ›
                </button>
              </div>
            </>
          )}

          {step === "selectSchedule" && (
            <>
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-1">Select Schedule</h2>
              <p className="text-[12px] text-slate-500 mb-1 max-w-2xl">
                Select the schedule which are applicable to you (Mandatory schedules are
                pre-selected)
              </p>
              <p className="text-[12px] font-semibold text-slate-700 mb-4">
                Total {totalSelectedCount} {totalSelectedCount === 1 ? "schedule is" : "schedules are"} selected
              </p>

              <div className="max-w-4xl flex flex-col md:flex-row border border-slate-200 rounded overflow-hidden mb-4">
                <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50">
                  {scheduleCategoryTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveCategory(tab.key)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-[12.5px] font-semibold cursor-pointer border-l-4 ${
                        activeCategory === tab.key
                          ? "border-l-[#0f3a9a] bg-white text-[#0f3a9a]"
                          : "border-l-transparent text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tab.label}
                      <span className="text-slate-400">{categoryCount(tab.key)}</span>
                    </button>
                  ))}
                </div>

                <div className="flex-1 p-4">
                  <div className="flex items-start gap-2 bg-[#eff6ff] border border-[#bfdbfe] rounded px-3 py-2.5 text-[11px] text-[#0f3a9a] mb-4">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Note - Please select at-least one schedule from Income category in order to
                      proceed further
                    </span>
                  </div>

                  <div className="space-y-3">
                    {scheduleCatalog
                      .filter((item) => item.category === activeCategory)
                      .map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 border rounded px-3 py-3 ${
                            item.mandatory ? "cursor-not-allowed bg-slate-50" : "cursor-pointer"
                          } ${selectedSchedules[item.id] ? "border-[#0f3a9a]" : "border-slate-200"}`}
                        >
                          <input
                            type="checkbox"
                            checked={!!selectedSchedules[item.id]}
                            disabled={item.mandatory}
                            onChange={() => toggleSchedule(item)}
                            className="mt-1"
                          />
                          <span
                            className={`shrink-0 h-9 px-2 rounded flex items-center justify-center text-[10px] font-bold text-white text-center ${
                              selectedSchedules[item.id] ? "bg-[#0f3a9a]" : "bg-slate-300"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="flex-1">
                            <span className="block text-[12.5px] font-bold text-slate-800">
                              {item.title}
                              {item.mandatory && (
                                <span className="text-slate-400 font-semibold"> (Mandatory)</span>
                              )}
                            </span>
                            <span className="block text-[11px] text-slate-500">{item.desc}</span>
                          </span>
                          <span className="text-[10.5px] text-[#0f3a9a] font-semibold shrink-0 cursor-default">
                            Learn More: Show
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>

              {scheduleError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4 max-w-4xl">
                  {scheduleError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("reasonForFiling")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleScheduleContinue}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Continue ›
                </button>
              </div>
            </>
          )}

          {step === "scheduleSummary" && (
            <>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-1">
                Summary of Schedules Selected
              </h2>
              <p className="text-[12px] text-slate-500 mb-5 max-w-2xl">
                Individual schedule questions have been skipped for this simulation. Review the
                schedules selected below and submit your return.
              </p>

              <div className="max-w-2xl border border-slate-200 rounded divide-y divide-slate-100 mb-6">
                {selectedScheduleSummary.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <span className="shrink-0 h-9 px-2 rounded bg-[#0f3a9a] flex items-center justify-center text-[10px] font-bold text-white">
                      {item.label}
                    </span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#0a2558]">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("selectSchedule")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleSubmitReturn}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Preview &amp; Submit Return ›
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
