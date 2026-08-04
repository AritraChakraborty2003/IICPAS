"use client";

import React, { useMemo, useState } from "react";
import { FaUniversity, FaCreditCard, FaMoneyCheckAlt, FaExchangeAlt, FaGlobe } from "react-icons/fa";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "taxApplicable" | "taxBreakup" | "paymentDetails";

interface ITRReg8SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-8 -> itr-reg-8 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-8";

const DEFAULT_PAN = "NGHPR1812B";
const DEFAULT_ASSESSMENT_YEAR = "20XX-XX";
const DEFAULT_MINOR_HEAD = "Self Assessment Tax(300)";

const stepperItems = ["Add Tax Applicable Details", "Add Tax Break Up Details", "Add Payment Details"];

const paymentModes = [
  { label: "Net Banking", icon: FaUniversity },
  { label: "Debit Card", icon: FaCreditCard },
  { label: "Over the Counter", icon: FaMoneyCheckAlt },
  { label: "NEFT/RTGS", icon: FaExchangeAlt },
  { label: "Payment Gateway", icon: FaGlobe },
];

const breakupFields: [string, string][] = [
  ["tax", "(a) Tax"],
  ["surcharge", "(b) Surcharge"],
  ["cess", "(c) Cess"],
  ["interest", "(d) Interest"],
  ["penalty", "(e) Penalty"],
  ["others", "(f) Others"],
];

export default function ITRReg8Simulation({ onComplete }: ITRReg8SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const assessmentYear = findFieldValue(simConfig, /assessment/i) || DEFAULT_ASSESSMENT_YEAR;
  const minorHead = findFieldValue(simConfig, /minor/i) || DEFAULT_MINOR_HEAD;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("taxApplicable");

  const [assessmentYearInput, setAssessmentYearInput] = useState("");
  const [minorHeadInput, setMinorHeadInput] = useState("");
  const [taxApplicableError, setTaxApplicableError] = useState("");

  const [amounts, setAmounts] = useState<Record<string, string>>({
    tax: "",
    surcharge: "",
    cess: "",
    interest: "",
    penalty: "",
    others: "",
  });
  const [breakupError, setBreakupError] = useState("");

  const [paymentMode, setPaymentMode] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const total = useMemo(
    () => Object.values(amounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0),
    [amounts]
  );

  const resetAll = () => {
    setStep("taxApplicable");
    setAssessmentYearInput("");
    setMinorHeadInput("");
    setTaxApplicableError("");
    setAmounts({ tax: "", surcharge: "", cess: "", interest: "", penalty: "", others: "" });
    setBreakupError("");
    setPaymentMode("");
    setPaymentError("");
  };

  const handleTaxApplicableContinue = () => {
    if (!assessmentYearInput || !minorHeadInput) {
      setTaxApplicableError("Please select Assessment Year and Type of Payment (Minor Head).");
      return;
    }
    if (
      requireCredentialValidation &&
      (assessmentYearInput !== assessmentYear || minorHeadInput !== minorHead)
    ) {
      setTaxApplicableError(
        "Selection does not match the experiment brief. Please re-check and try again."
      );
      return;
    }
    setTaxApplicableError("");
    setStep("taxBreakup");
  };

  const handleBreakupContinue = () => {
    if (total <= 0) {
      setBreakupError("Please enter at least one tax break-up amount.");
      return;
    }
    setBreakupError("");
    setStep("paymentDetails");
  };

  const handleMakePayment = () => {
    if (!paymentMode) {
      setPaymentError("Please select a payment mode.");
      return;
    }
    setPaymentError("");
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
    resetAll();
  };

  const activeStepIndex = step === "taxApplicable" ? 0 : step === "taxBreakup" ? 1 : 2;

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
            <p className="text-white font-bold text-[15px]">Payment Submitted Successfully!</p>
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
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-4">
            Dashboard <span className="text-slate-400 font-normal">›</span> e-Pay Tax
          </p>

          <div className="flex items-center justify-between mb-6 max-w-2xl">
            {stepperItems.map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                      idx < activeStepIndex
                        ? "bg-[#22c55e] text-white border-[#22c55e]"
                        : idx === activeStepIndex
                        ? "border-[#0f3a9a] text-[#0f3a9a]"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {idx < activeStepIndex ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-bold text-center max-w-[90px] ${
                      idx <= activeStepIndex ? "text-[#0a2558]" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < stepperItems.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-1 ${
                      idx < activeStepIndex ? "bg-[#22c55e]" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center justify-between max-w-3xl mb-4">
            <div>
              <h2 className="text-[26px] font-bold text-[#0a2558]">New Payment</h2>
              <p className="text-[11px] text-slate-500">PAN: {pan}</p>
            </div>
            <span className="text-[10.5px] text-red-500 font-semibold">
              * Indicates the mandatory fields
            </span>
          </div>

          <div className="max-w-3xl border border-slate-200 rounded p-6 shadow-sm">
            {step === "taxApplicable" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Assessment Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assessmentYearInput}
                      onChange={(e) => {
                        setAssessmentYearInput(e.target.value);
                        setTaxApplicableError("");
                      }}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 bg-white outline-none focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="20XX-XX">20XX-XX</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Type of Payment (Minor Head) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={minorHeadInput}
                      onChange={(e) => {
                        setMinorHeadInput(e.target.value);
                        setTaxApplicableError("");
                      }}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 bg-white outline-none focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Advance Tax (100)">Advance Tax (100)</option>
                      <option value="Self Assessment Tax(300)">Self Assessment Tax(300)</option>
                    </select>
                  </div>
                </div>

                {minorHeadInput && (
                  <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-[11.5px] text-slate-700 mb-4">
                    Tax Applicable (Major Head) is{" "}
                    <span className="font-bold">Income Tax (Other than Companies)(0021)</span>
                  </div>
                )}

                {taxApplicableError && (
                  <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4">
                    {taxApplicableError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={resetAll}
                    className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    ‹ Back
                  </button>
                  <button
                    onClick={handleTaxApplicableContinue}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === "taxBreakup" && (
              <>
                <div className="space-y-4 mb-4">
                  {breakupFields.map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <label className="text-[12px] font-semibold text-slate-700">{label}</label>
                      <div className="flex items-center gap-1.5 border border-slate-300 rounded px-2.5 py-1.5 w-48">
                        <span className="text-slate-400 text-[12px]">₹</span>
                        <input
                          type="number"
                          value={amounts[key]}
                          onChange={(e) => {
                            setAmounts((prev) => ({ ...prev, [key]: e.target.value }));
                            setBreakupError("");
                          }}
                          className="w-full text-[12px] text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3 mb-4">
                  <span className="text-[12px] font-bold text-slate-700">
                    Total (a + b + c + d + e + f)
                  </span>
                  <span className="text-[13px] font-black text-slate-800">
                    ₹ {total.toLocaleString("en-IN")}
                  </span>
                </div>

                {breakupError && (
                  <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4">
                    {breakupError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep("taxApplicable")}
                    className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    ‹ Back
                  </button>
                  <button
                    onClick={handleBreakupContinue}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === "paymentDetails" && (
              <>
                <p className="text-[13px] font-bold text-[#0a2558] mb-4">Select Payment Mode</p>
                <div className="space-y-2.5 mb-5">
                  {paymentModes.map(({ label, icon: Icon }) => (
                    <label
                      key={label}
                      className="flex items-center gap-3 border border-slate-200 rounded px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={paymentMode === label}
                        onChange={() => {
                          setPaymentMode(label);
                          setPaymentError("");
                        }}
                      />
                      <Icon className="text-[#0f3a9a]" size={14} />
                      <span className="text-[12px] font-semibold text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>

                {paymentError && (
                  <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4">
                    {paymentError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep("taxBreakup")}
                    className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    ‹ Back
                  </button>
                  <button
                    onClick={handleMakePayment}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                  >
                    Make Payment
                  </button>
                </div>
              </>
            )}
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
