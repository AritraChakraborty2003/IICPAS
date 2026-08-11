"use client";

import React, { useState } from "react";
import {
  FaFileAlt,
  FaCalculator,
  FaMoneyBillWave,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { CheckCircle2, ArrowLeft, Info } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "summary" | "taxLiability" | "payment";

interface ITRReg17SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-17 -> itr-reg-17 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-17";

const DEFAULT_NAME = "Akhil Sharma";
const DEFAULT_PAN = "AKSPA3663B";
const DEFAULT_ASSESSMENT_YEAR = "2024-25";
const DEFAULT_EMAIL = "akhilsharma@gmail.com";
const DEFAULT_GROSS_TOTAL_INCOME = "495000";
const DEFAULT_BALANCE_TAX_PAYABLE = "4492";
const DEFAULT_BSR_CODE = "0510904";
const DEFAULT_CHALLAN_SERIAL_NO = "24030800012345";
const ITR_TYPE = "ITR-1";

const dashboardNavItems = [
  "Dashboard",
  "e-File",
  "Authorised Partners",
  "Services",
  "Pending Actions",
  "Grievances",
  "Help",
];

const taxComputationRows = [
  { label: "i. Tax Payable on Total Income", value: "₹ 0" },
  { label: "ii. Rebate u/s 87A", value: "₹ 0" },
  { label: "iii. Tax Payable after Rebate", value: "₹ 0" },
  { label: "iv. Health and Education Cess at 4%", value: "₹ 0" },
  { label: "v. Total Tax & Cess", value: "₹ 0" },
];

const interestFeeRows = [
  { label: "viii. Interest u/s 234A", value: "₹ 0" },
  { label: "ix. Interest u/s 234B", value: "₹ 0" },
  { label: "x. Interest u/s 234C", value: "₹ 0" },
  { label: "xi. Fee u/s 234F", value: "₹ 0" },
];

export default function ITRReg17Simulation({ onComplete }: ITRReg17SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const assessmentYear = findFieldValue(simConfig, /assessment/i) || DEFAULT_ASSESSMENT_YEAR;
  const email = findFieldValue(simConfig, /email/i) || DEFAULT_EMAIL;
  const grossTotalIncomeDisplay =
    findFieldValue(simConfig, /gross.*income/i) || DEFAULT_GROSS_TOTAL_INCOME;
  const balanceTaxPayableDisplay =
    findFieldValue(simConfig, /balance.*tax|tax.*payable/i) || DEFAULT_BALANCE_TAX_PAYABLE;
  const bsrCode = findFieldValue(simConfig, /bsr/i) || DEFAULT_BSR_CODE;
  const challanSerialNo = findFieldValue(simConfig, /challan/i) || DEFAULT_CHALLAN_SERIAL_NO;

  const grossTotalIncome = Number(grossTotalIncomeDisplay) || 0;
  const balanceTaxPayable = Number(balanceTaxPayableDisplay) || 0;

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [step, setStep] = useState<Step>("summary");
  const [taxLiabilityConfirmed, setTaxLiabilityConfirmed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"none" | "paid" | "later">("none");

  const [reliefInput, setReliefInput] = useState("");
  const [showBankModal, setShowBankModal] = useState(false);

  const resetAll = () => {
    setStep("summary");
    setTaxLiabilityConfirmed(false);
    setPaymentStatus("none");
    setReliefInput("");
    setShowBankModal(false);
  };

  const handleConfirmTaxLiability = () => {
    setTaxLiabilityConfirmed(true);
    setStep("payment");
  };

  const handlePayLater = () => {
    setPaymentStatus("later");
    setSuccessMessage(
      "Return confirmed with Pay Later selected. Interest may apply on the balance tax payable."
    );
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  const handlePayNow = () => {
    setShowBankModal(true);
  };

  const handleMakePayment = () => {
    setShowBankModal(false);
    setPaymentStatus("paid");
    setSuccessMessage(`Payment of ₹ ${balanceTaxPayable.toLocaleString("en-IN")} completed successfully!`);
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
      value: `₹ ${grossTotalIncome.toLocaleString("en-IN")}`,
      onClick: undefined,
    },
    {
      key: "deductions",
      icon: FaMoneyBillWave,
      label: "Total Deductions (Mandatory)",
      desc: "Please verify your deduction details and proceed further",
      confirmed: true,
      value: "₹ 0",
      onClick: undefined,
    },
    {
      key: "taxLiability",
      icon: FaMoneyCheckAlt,
      label: "Tax Liability",
      desc: "Please verify your tax liability details and proceed further",
      confirmed: taxLiabilityConfirmed,
      value:
        paymentStatus === "paid"
          ? "Paid"
          : paymentStatus === "later"
          ? "Pending Payment"
          : `₹ ${balanceTaxPayable.toLocaleString("en-IN")}`,
      onClick: () => setStep("taxLiability"),
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
          <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_15px_45px_rgba(71,198,90,0.4)] animate-scaleIn">
              <CheckCircle2 className="text-white" size={90} strokeWidth={2.5} />
            </div>
            <p className="text-white font-bold text-[15px]">{successMessage}</p>
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

      {/* SIMULATED FINC DUMMY BANK GATEWAY MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
          <div className="w-full max-w-md bg-white rounded shadow-2xl">
            <div className="px-6 pt-5 pb-2 border-b border-slate-100">
              <h3 className="text-[16px] font-bold text-[#0a2558]">Finc Dummy Bank</h3>
              <p className="text-[11px] text-slate-500">Simulated payment gateway</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-500 font-semibold">Amount Payable</span>
                <span className="font-bold text-slate-800">
                  ₹ {balanceTaxPayable.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-500 font-semibold">BSR Code</span>
                <span className="font-bold text-slate-800">{bsrCode}</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-500 font-semibold">Challan Serial Number</span>
                <span className="font-bold text-slate-800">{challanSerialNo}</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1">
                <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <p>Please note down the BSR Code &amp; Challan Serial Number for your records.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-5 border-t border-slate-200 px-6 py-3">
              <button
                onClick={() => setShowBankModal(false)}
                className="text-[#0f3a9a] font-bold text-[12.5px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleMakePayment}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[12.5px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Make Payment
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
          <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 14:48</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          {step === "summary" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">
                Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns{" "}
                <span className="text-slate-400 font-normal">›</span> {ITR_TYPE}{" "}
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
                      <p className="text-[10.5px] text-[#0f3a9a] font-semibold">
                        {onClick ? "Modify if required" : " "}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {taxLiabilityConfirmed && paymentStatus !== "none" && (
                <button
                  disabled
                  title="Not available in this simulation"
                  className="border border-slate-200 text-slate-300 font-bold text-[13px] px-6 py-2 rounded cursor-not-allowed"
                >
                  Preview &amp; Submit Return
                </button>
              )}
            </>
          )}

          {step === "taxLiability" && (
            <div className="max-w-3xl">
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">
                Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns{" "}
                <span className="text-slate-400 font-normal">›</span> {ITR_TYPE}{" "}
                <span className="text-slate-400 font-normal">›</span> Verify Your Tax Liability
              </p>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-1">
                Verify your tax liability details
              </h2>
              <p className="text-[12px] text-slate-500 mb-5">
                Please verify your tax liability details and proceed further
              </p>

              <div className="border border-slate-200 rounded p-5 mb-4">
                <p className="text-[14px] font-bold text-[#0a2558] mb-4">Computation of Income</p>
                <div className="space-y-2.5 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Gross Total Income</span>
                    <span className="font-bold text-slate-800">
                      ₹ {grossTotalIncome.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Total Deductions</span>
                    <span className="font-bold text-slate-800">(-) ₹ 0</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-[#0a2558]">Total Income</span>
                    <span className="font-black text-[#0a2558]">
                      ₹ {grossTotalIncome.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-5 mb-4">
                <div className="space-y-2.5 text-[12.5px]">
                  {taxComputationRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-slate-700">{row.label}</span>
                      <span className="font-bold text-slate-800">{row.value}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-slate-700">
                      vi. Relief u/s 89{" "}
                      <span className="text-slate-400">
                        (Please ensure to submit Form 10E to claim this relief)
                      </span>
                    </span>
                    <div className="flex items-center gap-1 border border-slate-300 rounded px-2 py-1 w-32 shrink-0">
                      <span className="text-slate-400 text-[12px]">₹</span>
                      <input
                        type="number"
                        value={reliefInput}
                        onChange={(e) => setReliefInput(e.target.value)}
                        className="w-full text-[12px] text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-[#0a2558]">vii. Balance Tax After Relief</span>
                    <span className="font-black text-[#0a2558]">₹ 0</span>
                  </div>

                  {interestFeeRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-slate-700">{row.label}</span>
                      <span className="font-bold text-slate-800">{row.value}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-[#0a2558]">Total Interest and Fee</span>
                    <span className="font-black text-[#0a2558]">₹ 0.00</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#bfdbfe] bg-[#eff6ff] rounded p-5 mb-6">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#bfdbfe]">
                  <span className="text-[15px] font-bold text-[#0a2558]">
                    Total Tax, Fee and Interest
                  </span>
                  <span className="text-[20px] font-black text-[#0a2558]">0</span>
                </div>
                <div className="space-y-2 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Balance Tax After Relief</span>
                    <span className="font-bold text-slate-800">₹ 0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Total Interest and Fee Payable</span>
                    <span className="font-bold text-slate-800">₹ 0</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#bfdbfe]">
                    <span className="font-bold text-[#0a2558]">Total Tax, Fee and Interest</span>
                    <span className="font-black text-[#0a2558]">
                      ₹ {balanceTaxPayable.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep("summary")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back to Summary
                </button>
                <button
                  onClick={handleConfirmTaxLiability}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="max-w-2xl">
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">
                Dashboard <span className="text-slate-400 font-normal">›</span> Filing Returns{" "}
                <span className="text-slate-400 font-normal">›</span> {ITR_TYPE}{" "}
                <span className="text-slate-400 font-normal">›</span> Balance Tax Payable
              </p>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-5">
                Your Tax Liability Summary
              </h2>

              <div className="border border-[#fde68a] bg-[#fffbeb] rounded p-5 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#92400e]">Balance Tax Payable</p>
                  <p className="text-[11px] text-[#92400e]">
                    Pay Now (recommended) or Pay Later. Opting Pay Later can lead to interest on
                    tax payable.
                  </p>
                </div>
                <p className="text-[20px] font-black text-[#92400e] shrink-0">
                  ₹ {balanceTaxPayable.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePayLater}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Pay Later
                </button>
                <button
                  onClick={handlePayNow}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Pay Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* india.gov.in government portal footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 w-full shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/images/simulations/satyamev-jayate.jpg"
                alt="india.gov.in"
                className="h-8 w-8 object-contain rounded-full"
              />
              <div className="text-[10px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-700">india.gov.in</p>
                <p>national portal of india</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              PAN: <span className="font-bold">{pan}</span> &middot; A.Y. {assessmentYear} &middot;{" "}
              {email}
            </p>
          </div>
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
