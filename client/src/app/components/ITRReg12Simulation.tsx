"use client";

import React, { useState } from "react";
import {
  FaFileAlt,
  FaCalculator,
  FaMoneyBillWave,
  FaMoneyCheckAlt,
  FaBalanceScale,
  FaInfoCircle,
} from "react-icons/fa";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "selectStatus" | "chooseForm" | "itrIntro" | "reasonForFiling" | "returnBreakup";

interface ITRReg12SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-12 -> itr-reg-12 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-12";

const DEFAULT_PAN = "AKSPA3663B";
const DEFAULT_NAME = "Akhil Sharma";
const DEFAULT_STATUS = "Individual";
const DEFAULT_ITR_FORM = "ITR-1";
const DEFAULT_REASON = "Taxable income is more than basic exemption limit";

const dashboardNavItems = [
  "Dashboard",
  "e-File",
  "Authorised Partners",
  "Services",
  "Pending Actions",
  "Grievances",
  "Help",
];

const returnBreakupSections = [
  { icon: FaFileAlt, label: "Personal Information", desc: "Details of personal information, contact details, and bank account details" },
  { icon: FaCalculator, label: "Gross Total Income (Mandatory)", desc: "Please verify your income sources as collected from various sources and proceed" },
  { icon: FaMoneyBillWave, label: "Total Deductions (Mandatory)", desc: "Please verify your deduction details and proceed further" },
  { icon: FaMoneyCheckAlt, label: "Tax Paid", desc: "Please verify details of taxes paid by you in the last financial year and proceed further" },
  { icon: FaBalanceScale, label: "Tax Liability", desc: "Verify your tax liability details" },
];

export default function ITRReg12Simulation({ onComplete }: ITRReg12SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const status = findFieldValue(simConfig, /status/i) || DEFAULT_STATUS;
  const itrForm = findFieldValue(simConfig, /itr form|form/i) || DEFAULT_ITR_FORM;
  const reason = findFieldValue(simConfig, /reason/i) || DEFAULT_REASON;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug.
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

  const resetAll = () => {
    setStep("selectStatus");
    setStatusInput(DEFAULT_STATUS);
    setStatusError("");
    setItrFormInput(DEFAULT_ITR_FORM);
    setFormError("");
    setReasonInput("");
    setReasonError("");
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
    setStep("returnBreakup");
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

              <button
                onClick={handleStatusContinue}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
              >
                Continue ›
              </button>
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
                    For individuals being a resident (other than not ordinarily resident) having
                    total income upto ₹ 50 lakh, having Income from Salaries, one house
                    property, other sources (Interest etc.), and agricultural income upto ₹
                    5,000.
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
                For individuals being a resident (other than not ordinarily resident) having total
                income upto ₹ 50 lakh, having Income from Salaries, one house property, other
                sources (Interest etc.), and agricultural income upto ₹ 5,000.
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
            </>
          )}

          {step === "reasonForFiling" && (
            <>
              <h2 className="text-[20px] font-bold text-[#0a2558] mb-5 max-w-2xl">
                Are you filing the income tax return for any of the following reasons?
              </h2>

              <div className="max-w-2xl space-y-4 mb-5">
                <label
                  className={`flex items-start gap-2.5 border rounded px-4 py-3.5 cursor-pointer ${
                    reasonInput === DEFAULT_REASON ? "border-[#0f3a9a] bg-blue-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    className="mt-0.5"
                    checked={reasonInput === DEFAULT_REASON}
                    onChange={() => {
                      setReasonInput(DEFAULT_REASON);
                      setReasonError("");
                    }}
                  />
                  <span className="text-[12.5px] font-semibold text-slate-700">
                    Taxable income is more than basic exemption limit
                  </span>
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

          {step === "returnBreakup" && (
            <>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-5">
                {itrFormInput} Return Summary
              </h2>

              <div className="max-w-2xl border border-slate-200 rounded divide-y divide-slate-100 mb-6">
                {returnBreakupSections.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-4 p-4">
                    <Icon className="text-[#0f3a9a] shrink-0" size={22} />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#0a2558]">{label}</p>
                      <p className="text-[11px] text-slate-500">{desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-slate-700">₹ 0</p>
                      <p className="text-[10.5px] text-[#0f3a9a] font-semibold">Modify if required</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("reasonForFiling")}
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
          <FaInfoCircle className="text-[#0f3a9a] shrink-0 mt-0.5" size={14} />
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
