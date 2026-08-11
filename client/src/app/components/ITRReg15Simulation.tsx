"use client";

import React, { useMemo, useState } from "react";
import {
  FaFileAlt,
  FaCalculator,
  FaMoneyBillWave,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "summary" | "deductions";

interface ITRReg15SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-15 -> itr-reg-15 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-15";

const DEFAULT_NAME = "Akhil Sharma";
const DEFAULT_PAN = "AKSPA3663B";
const DEFAULT_SPOUSE_NAME = "Ameya Sharma";
const DEFAULT_GROSS_TOTAL_INCOME = "5208000";
const DEFAULT_LIC_PREMIUM = "240000";
const DEFAULT_MEDICAL_PREMIUM = "60000";

const SECTION_80C_LIMIT = 150000;
const SECTION_80D_LIMIT = 25000;

const dashboardNavItems = [
  "Dashboard",
  "e-File",
  "Authorised Partners",
  "Services",
  "Pending Actions",
  "Grievances",
  "Help",
];

export default function ITRReg15Simulation({ onComplete }: ITRReg15SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const spouseName = findFieldValue(simConfig, /spouse|wife/i) || DEFAULT_SPOUSE_NAME;
  const grossTotalIncomeDisplay =
    findFieldValue(simConfig, /gross.*income/i) || DEFAULT_GROSS_TOTAL_INCOME;
  const expectedLicPremium = findFieldValue(simConfig, /lic/i) || DEFAULT_LIC_PREMIUM;
  const expectedMedicalPremium =
    findFieldValue(simConfig, /medical/i) || DEFAULT_MEDICAL_PREMIUM;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("summary");
  const [deductionsConfirmed, setDeductionsConfirmed] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  const [licInput, setLicInput] = useState("");
  const [medicalInput, setMedicalInput] = useState("");
  const [deductionsError, setDeductionsError] = useState("");

  const licAmount = parseFloat(licInput) || 0;
  const medicalAmount = parseFloat(medicalInput) || 0;
  const eligible80C = Math.min(licAmount, SECTION_80C_LIMIT);
  const eligible80D = Math.min(medicalAmount, SECTION_80D_LIMIT);
  const totalDeductions = useMemo(
    () => eligible80C + eligible80D,
    [eligible80C, eligible80D]
  );

  const resetAll = () => {
    setStep("summary");
    setDeductionsConfirmed(false);
    setConfirmedTotal(0);
    setLicInput("");
    setMedicalInput("");
    setDeductionsError("");
  };

  const handleDeductionsConfirm = () => {
    if (!licInput || !medicalInput) {
      setDeductionsError(
        "Please enter the LIC Premium and Medical Insurance Premium to proceed."
      );
      return;
    }
    if (
      requireCredentialValidation &&
      (licInput.trim() !== expectedLicPremium.trim() ||
        medicalInput.trim() !== expectedMedicalPremium.trim())
    ) {
      setDeductionsError(
        "Amounts entered do not match the experiment brief. Please re-check and try again."
      );
      return;
    }
    setDeductionsError("");
    setConfirmedTotal(totalDeductions);
    setDeductionsConfirmed(true);
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
      confirmed: true,
      value: pan,
      onClick: undefined,
    },
    {
      key: "income",
      icon: FaCalculator,
      label: "Gross Total Income (Mandatory)",
      desc: "Please verify your income sources as collected from various sources and proceed",
      confirmed: true,
      value: `₹ ${Number(grossTotalIncomeDisplay).toLocaleString("en-IN")}`,
      onClick: undefined,
    },
    {
      key: "deductions",
      icon: FaMoneyBillWave,
      label: "Total Deductions (Mandatory)",
      desc: "Please verify your deduction details and proceed further",
      confirmed: deductionsConfirmed,
      value: deductionsConfirmed ? `₹ ${confirmedTotal.toLocaleString("en-IN")}` : "₹ 0",
      onClick: () => setStep("deductions"),
    },
    {
      key: "taxPaid",
      icon: FaMoneyCheckAlt,
      label: "Tax Paid",
      desc: "Please verify details of taxes paid by you in the last financial year and proceed further",
      confirmed: false,
      value: "₹ 0",
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
            <p className="text-white font-bold text-[15px]">Total Deductions Confirmed Successfully!</p>
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
                {returnSummarySections.map(({ key, icon: Icon, label, desc, confirmed, value, onClick }) => (
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
                      <p className="text-[13px] font-bold text-slate-700">{value}</p>
                      <p className="text-[10.5px] text-[#0f3a9a] font-semibold">Modify if required</p>
                    </div>
                  </div>
                ))}
              </div>

              {deductionsConfirmed && (
                <button
                  onClick={handleSubmitReturn}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm &amp; Proceed ›
                </button>
              )}
            </>
          )}

          {step === "deductions" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">
                Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns{" "}
                <span className="text-slate-400 font-normal">›</span> Total Deductions
              </p>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-1">Total Deductions</h2>
              <p className="text-[12px] text-slate-500 mb-1 max-w-5xl">
                Verify each deduction claimed under Chapter VI-A and enter the confirmed amounts
                below.
              </p>
              <p className="text-[10.5px] text-red-500 font-semibold mb-4 text-right max-w-5xl">
                * Indicates mandatory fields
              </p>

              <div className="max-w-5xl space-y-4 mb-5">
                {/* Section 80C */}
                <div className="border border-slate-200 rounded p-5">
                  <p className="text-[14px] font-bold text-[#0a2558] mb-4">
                    Deductions under Section 80C
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Nature of Investment
                      </label>
                      <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                        Life Insurance Corporation (LIC) Premium
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Policy Holder
                      </label>
                      <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                        Self
                      </p>
                    </div>
                  </div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                    LIC Premium Paid (Annual) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 border border-slate-300 rounded px-2.5 py-1.5 w-full md:w-56 mb-2">
                    <span className="text-slate-400 text-[12px]">₹</span>
                    <input
                      type="number"
                      value={licInput}
                      onChange={(e) => {
                        setLicInput(e.target.value);
                        setDeductionsError("");
                      }}
                      className="w-full text-[12px] text-slate-800 outline-none"
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    Eligible for deduction u/s 80C up to ₹1,50,000
                  </p>
                  {licInput && (
                    <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2 text-[11.5px] text-slate-700">
                      <span>Eligible Deduction u/s 80C</span>
                      <span className="font-bold">₹ {eligible80C.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>

                {/* Section 80D */}
                <div className="border border-slate-200 rounded p-5">
                  <p className="text-[14px] font-bold text-[#0a2558] mb-4">
                    Deductions under Section 80D
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Nature of Insurance
                      </label>
                      <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                        Medical Insurance Premium
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Insured
                      </label>
                      <p className="text-[12.5px] font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                        Spouse ({spouseName})
                      </p>
                    </div>
                  </div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                    Medical Insurance Premium Paid (Annual) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 border border-slate-300 rounded px-2.5 py-1.5 w-full md:w-56 mb-2">
                    <span className="text-slate-400 text-[12px]">₹</span>
                    <input
                      type="number"
                      value={medicalInput}
                      onChange={(e) => {
                        setMedicalInput(e.target.value);
                        setDeductionsError("");
                      }}
                      className="w-full text-[12px] text-slate-800 outline-none"
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    Eligible for deduction u/s 80D up to ₹25,000 (self &amp; family, non-senior
                    citizen)
                  </p>
                  {medicalInput && (
                    <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2 text-[11.5px] text-slate-700">
                      <span>Eligible Deduction u/s 80D</span>
                      <span className="font-bold">₹ {eligible80D.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border border-[#bfdbfe] bg-[#eff6ff] rounded px-4 py-3.5">
                  <span className="text-[13px] font-bold text-[#0a2558]">Total Deductions</span>
                  <span className="text-[15px] font-black text-[#0a2558]">
                    ₹ {totalDeductions.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {deductionsError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4 max-w-5xl">
                  {deductionsError}
                </div>
              )}

              <div className="flex items-center gap-3 max-w-5xl">
                <button
                  onClick={() => setStep("summary")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleDeductionsConfirm}
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
