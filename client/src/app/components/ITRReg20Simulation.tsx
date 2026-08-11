"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ArrowLeft,
  Info,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "scheduleSummary" | "salaryPreview" | "salaryBreakdown" | "employerForm";

type BreakupRow = { id: string; nature: string; amount: number };

type Employer = {
  id: string;
  name: string;
  tan: string;
  address: string;
  town: string;
  state: string;
  pin: string;
  zip: string;
  natureOfEmployer: string;
  a: BreakupRow[];
  b: BreakupRow[];
  c: BreakupRow[];
  d: BreakupRow[];
  e: number;
  f: number;
};

interface ITRReg20SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-20 -> itr-reg-20 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-20";

const DEFAULT_NAME = "Sanjay Sahu";
const DEFAULT_PAN = "SNSPS4827K";
const DEFAULT_EMPLOYER_NAME = "Fincurious Innovations Pvt Ltd";
const DEFAULT_EMPLOYER_ADDRESS = "#142, DVG Road";
const DEFAULT_EMPLOYER_TOWN = "Bengaluru";
const DEFAULT_EMPLOYER_STATE = "Karnataka";
const DEFAULT_EMPLOYER_PIN = "560028";
const DEFAULT_NATURE_OF_EMPLOYER = "Others";
const DEFAULT_MONTHLY_BASIC_SALARY = "66000";

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

const STATE_OPTIONS = [
  "Andhra Pradesh",
  "Bihar",
  "Delhi",
  "Gujarat",
  "Karnataka",
  "Kerala",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

const NATURE_OF_EMPLOYER_OPTIONS = [
  "Central Govt.",
  "State Govt.",
  "Public Sector Undertaking (PSU)",
  "Pensioners - Central Govt.",
  "Pensioners - State Govt.",
  "Pensioners - PSU",
  "Pensioners - Others",
  "Others",
];

const NATURE_OF_SALARY_OPTIONS = [
  "Basic Salary",
  "Dearness Allowance (DA)",
  "House Rent Allowance (HRA)",
  "Conveyance Allowance",
  "Medical Allowance",
  "Leave Travel Allowance (LTA)",
  "Bonus / Ex-gratia",
  "Overtime Allowance",
  "Other Allowances",
];

const NATURE_OF_PERQUISITE_OPTIONS = [
  "Rent-free / concessional accommodation",
  "Motor car provided by employer",
  "Interest-free / concessional loans",
  "Free / concessional education",
  "Gift, voucher or token",
  "Club membership / facilities",
  "Other Perquisites",
];

const NATURE_OF_PROFIT_OPTIONS = [
  "Compensation on termination of employment",
  "Payment from unrecognised provident fund",
  "Payment from unrecognised superannuation fund",
  "Sum received under Keyman insurance policy",
  "Any other sum received from employer",
  "Other Profits in lieu of Salary",
];

const NATURE_OF_RETIREMENT_OPTIONS = [
  "Withdrawal from notified retirement benefit account",
  "Interest / accretion in notified retirement benefit account",
  "Other income from notified retirement benefit account",
];

const makeRowId = () => `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyRow = (): BreakupRow => ({ id: makeRowId(), nature: "", amount: 0 });

const createEmptyDraft = (): Employer => ({
  id: "",
  name: "",
  tan: "",
  address: "",
  town: "",
  state: "",
  pin: "",
  zip: "",
  natureOfEmployer: "",
  a: [emptyRow()],
  b: [emptyRow()],
  c: [emptyRow()],
  d: [],
  e: 0,
  f: 0,
});

const sumRows = (rows: BreakupRow[]) => rows.reduce((acc, row) => acc + (row.amount || 0), 0);

const employerGrossSalary = (employer: Employer) =>
  sumRows(employer.a) + sumRows(employer.b) + sumRows(employer.c) + sumRows(employer.d) + employer.e + employer.f;

const formatINR = (value: number) => Math.round(value || 0).toLocaleString("en-IN");

export default function ITRReg20Simulation({ onComplete }: ITRReg20SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  // Admin-configured (Simulation Manager) employer/salary brief - drives
  // both the displayed experiment banner and the validation check on the
  // "Add details of breakup" form. Never hardcoded.
  const employerName = findFieldValue(simConfig, /employer name/i) || DEFAULT_EMPLOYER_NAME;
  const employerAddress = findFieldValue(simConfig, /employer address/i) || DEFAULT_EMPLOYER_ADDRESS;
  const employerTown = findFieldValue(simConfig, /town|city/i) || DEFAULT_EMPLOYER_TOWN;
  const employerState = findFieldValue(simConfig, /state/i) || DEFAULT_EMPLOYER_STATE;
  const employerPin = findFieldValue(simConfig, /pin/i) || DEFAULT_EMPLOYER_PIN;
  const natureOfEmployerExpected =
    findFieldValue(simConfig, /nature of employer/i) || DEFAULT_NATURE_OF_EMPLOYER;
  const monthlyBasicSalaryRaw =
    findFieldValue(simConfig, /basic salary|monthly salary|salary.*month/i) ||
    DEFAULT_MONTHLY_BASIC_SALARY;
  const monthlyBasicSalary = Number(monthlyBasicSalaryRaw.replace(/[^0-9.]/g, "")) || 0;
  const expectedAnnualSalary = monthlyBasicSalary * 12;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("scheduleSummary");

  const [salaryConfirmed, setSalaryConfirmed] = useState(false);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [allowancesExempt, setAllowancesExempt] = useState(0);
  const [reliefU89A, setReliefU89A] = useState(0);
  const [deductionsU16, setDeductionsU16] = useState(0);
  const [showAllowances, setShowAllowances] = useState(false);
  const [showDeductions, setShowDeductions] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  const [draft, setDraft] = useState<Employer>(createEmptyDraft());
  const [draftError, setDraftError] = useState("");

  const resetAll = () => {
    setStep("scheduleSummary");
    setSalaryConfirmed(false);
    setEmployers([]);
    setAllowancesExempt(0);
    setReliefU89A(0);
    setDeductionsU16(0);
    setShowAllowances(false);
    setShowDeductions(false);
    setScheduleError("");
    setDraft(createEmptyDraft());
    setDraftError("");
  };

  const totalGrossSalary = useMemo(
    () => employers.reduce((acc, employer) => acc + employerGrossSalary(employer), 0),
    [employers]
  );
  const netSalary = totalGrossSalary - allowancesExempt - reliefU89A;
  const incomeChargeable = netSalary - deductionsU16;

  const openAddEmployer = () => {
    setDraft(createEmptyDraft());
    setDraftError("");
    setStep("employerForm");
  };

  const updateDraftRows = (
    key: "a" | "b" | "c" | "d",
    updater: (rows: BreakupRow[]) => BreakupRow[]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: updater(prev[key]) }));
  };

  const handleCancelEmployer = () => {
    setDraft(createEmptyDraft());
    setDraftError("");
    setStep("salaryBreakdown");
  };

  const handleAddEmployer = () => {
    if (
      !draft.name.trim() ||
      !draft.address.trim() ||
      !draft.town.trim() ||
      !draft.state ||
      !draft.pin.trim() ||
      !draft.natureOfEmployer
    ) {
      setDraftError("Please fill all the mandatory fields marked with *.");
      return;
    }
    const grossSalary = employerGrossSalary(draft);
    if (grossSalary <= 0) {
      setDraftError("Please provide the breakup of salary as per Section 17(1) before proceeding.");
      return;
    }
    if (requireCredentialValidation) {
      const nameMatches = draft.name.trim().toLowerCase() === employerName.trim().toLowerCase();
      const amountMatches = grossSalary === expectedAnnualSalary;
      if (!nameMatches || !amountMatches) {
        setDraftError(
          "Entered details do not match the experiment brief. Please re-check the employer name and salary breakup and try again."
        );
        return;
      }
    }
    setDraftError("");
    setEmployers((prev) => [...prev, { ...draft, id: makeRowId() }]);
    setDraft(createEmptyDraft());
    setStep("salaryBreakdown");
  };

  const handleRemoveEmployer = (id: string) => {
    setEmployers((prev) => prev.filter((employer) => employer.id !== id));
  };

  const handleConfirmSchedule = () => {
    if (employers.length === 0) {
      setScheduleError("Please add at-least one employer before confirming this schedule.");
      return;
    }
    setScheduleError("");
    setSalaryConfirmed(true);
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
    resetAll();
  };

  const breadcrumb = "Dashboard › Filing Returns for A.Y. 2024-25 › ITR-2 › Schedule Salary";

  const renderBreakupSection = (
    key: "a" | "b" | "c" | "d",
    letter: string,
    heading: string,
    natureLabel: string,
    natureOptions: string[],
    allowAdd = true
  ) => {
    const rows = draft[key];
    const total = sumRows(rows);
    return (
      <div className="w-full border-t border-slate-200 pt-5 mb-2">
        <p className="text-[14px] font-bold text-[#0a2558] mb-3">
          {letter}. {heading}
        </p>
        <div className="flex items-center justify-between bg-[#eff6ff] border border-[#bfdbfe] rounded px-4 py-3 mb-4">
          <span className="text-[12px] text-slate-700 flex items-center gap-1.5">
            As per Form-16 <Info size={12} className="text-slate-400" /> / AIS (Annual
            Information Statement) <Info size={12} className="text-slate-400" />
          </span>
          <span className="text-[13px] font-bold text-slate-800">₹ {formatINR(total)}</span>
        </div>

        {rows.length > 0 && (
          <>
            <p className="text-[12px] text-slate-600 mb-3">Please provide the breakup of the above value</p>
            <div className="space-y-3 mb-3">
              {rows.map((row, idx) => (
                <div key={row.id} className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      {natureLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={row.nature}
                        onChange={(e) =>
                          updateDraftRows(key, (list) =>
                            list.map((r, i) => (i === idx ? { ...r, nature: e.target.value } : r))
                          )
                        }
                        className="flex-1 border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 bg-white outline-none focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        {natureOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraftRows(key, (list) => list.filter((_, i) => i !== idx))
                        }
                        className="inline-flex items-center gap-1 border border-red-200 text-red-600 font-semibold text-[11.5px] px-3 py-2 rounded cursor-pointer hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="w-40">
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">Amount</label>
                    <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                      <span className="px-2.5 py-2 text-[12px] text-slate-500 bg-slate-50 border-r border-slate-300">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={row.amount || ""}
                        onChange={(e) =>
                          updateDraftRows(key, (list) =>
                            list.map((r, i) =>
                              i === idx ? { ...r, amount: Number(e.target.value) || 0 } : r
                            )
                          )
                        }
                        className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {allowAdd && (
          <>
            <p className="text-[12px] text-slate-600 mb-2">Do you want to add more breakup values?</p>
            <button
              type="button"
              onClick={() => updateDraftRows(key, (list) => [...list, emptyRow()])}
              className="inline-flex items-center gap-1.5 border border-[#0f3a9a] text-[#0f3a9a] font-bold text-[12px] px-4 py-1.5 rounded cursor-pointer hover:bg-blue-50 transition-colors mb-4"
            >
              <PlusCircle size={13} />
              Add Another
            </button>
          </>
        )}

        <div className="flex items-center justify-between text-[12.5px] font-bold text-slate-700 mb-1">
          <span>Total</span>
          <span>{formatINR(total)}</span>
        </div>
      </div>
    );
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
            <p className="text-white font-bold text-[15px]">Schedule Salary Confirmed!</p>
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
            <p className="text-[10px] text-slate-400 cursor-default">Individual</p>
          </div>
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {dashboardNavItems.map((item) => (
            <span
              key={item}
              className={`px-4 py-2.5 uppercase tracking-wide border-r border-white/5 cursor-default ${
                item === "Dashboard" ? "underline underline-offset-4" : ""
              }`}
            >
              {item}
            </span>
          ))}
          <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 14:53</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">{breadcrumb}</p>

          {step === "scheduleSummary" && (
            <>
              <div className="flex items-center justify-between max-w-4xl mb-1">
                <h2 className="text-[26px] font-bold text-[#0a2558]">Schedules Summary</h2>
                <p className="text-[11px] font-bold text-[#16a34a]">You are almost there</p>
              </div>
              <p className="text-[12px] text-slate-500 mb-5 max-w-2xl">
                Provide your confirmation for each schedule below before proceeding to
                verification.
              </p>

              <div className="max-w-4xl border border-slate-200 rounded divide-y divide-slate-100 mb-4">
                <div className="flex items-center gap-4 p-4">
                  <span className="shrink-0 h-9 px-2 rounded bg-[#0f3a9a] flex items-center justify-center text-[10px] font-bold text-white text-center">
                    Part
                    <br />
                    A-Gen
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#0a2558]">
                      Part A - General Information <span className="text-slate-400 font-semibold">(Mandatory)</span>
                    </p>
                    <p className="text-[11px] text-slate-500">Details of personal information and filing status</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16a34a] shrink-0">
                    <CheckCircle2 size={16} />
                    Confirmed
                  </span>
                </div>

                <div className="flex items-center gap-4 p-4 border-2 border-[#0f3a9a] rounded-b">
                  <span className="shrink-0 h-9 w-9 rounded bg-[#0f3a9a] flex items-center justify-center text-[12px] font-bold text-white">
                    S
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#0a2558]">Schedule Salary</p>
                    <p className="text-[11px] text-slate-500">Details of income from salaries</p>
                  </div>
                  {salaryConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16a34a] shrink-0">
                      <CheckCircle2 size={16} />
                      Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => setStep("salaryPreview")}
                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0f3a9a] shrink-0 cursor-pointer hover:underline"
                    >
                      Provide your confirmation
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {step === "salaryPreview" && (
            <>
              <div className="max-w-3xl border border-slate-200 rounded p-6 mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-bold text-slate-800">
                    6. Income Chargeable under the head &lsquo;Salaries&rsquo; ( 4 &minus; 5 )
                  </p>
                  <p className="text-[16px] font-bold text-slate-800">{incomeChargeable}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("scheduleSummary")}
                  className="inline-flex items-center gap-1.5 border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Schedules
                </button>
                <button
                  onClick={() => setStep("salaryBreakdown")}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm
                </button>
              </div>
            </>
          )}

          {step === "salaryBreakdown" && (
            <>
              <div className="max-w-4xl flex items-center justify-between mb-3">
                <p className="text-[12px] text-slate-500">Provide the details of income from salaries</p>
                <div className="flex items-center gap-4">
                  <button className="text-[11.5px] font-bold text-[#0f3a9a] cursor-default">Expand All</button>
                  <button className="text-[11.5px] font-bold text-[#0f3a9a] cursor-default">Collapse All</button>
                </div>
              </div>

              <div className="max-w-4xl border border-slate-200 rounded mb-4">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <ChevronDown size={16} className="text-slate-500" />
                    <p className="text-[15px] font-bold text-[#0a2558]">1. Gross Salary</p>
                  </div>

                  {employers.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {employers.map((employer) => (
                        <div
                          key={employer.id}
                          className="flex items-center gap-3 border border-slate-200 rounded px-4 py-3"
                        >
                          <div className="flex-1">
                            <p className="text-[12.5px] font-bold text-slate-800">{employer.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {employer.town}, {employer.state} &mdash; {employer.natureOfEmployer}
                            </p>
                          </div>
                          <p className="text-[13px] font-bold text-slate-700 shrink-0">
                            ₹ {formatINR(employerGrossSalary(employer))}
                          </p>
                          <button
                            onClick={() => handleRemoveEmployer(employer.id)}
                            className="inline-flex items-center gap-1 border border-red-200 text-red-600 font-semibold text-[11px] px-2.5 py-1.5 rounded cursor-pointer hover:bg-red-50 transition-colors shrink-0"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[12px] text-slate-600 mb-2">Do you want to add more employers?</p>
                  <button
                    onClick={openAddEmployer}
                    className="inline-flex items-center gap-1.5 border border-[#0f3a9a] text-[#0f3a9a] font-bold text-[12px] px-4 py-1.5 rounded cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <PlusCircle size={13} />
                    Add Another
                  </button>
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <p className="text-[14px] font-bold text-slate-800">2. Total Gross Salary from all Employers</p>
                  <p className="text-[14px] font-bold text-slate-800">{formatINR(totalGrossSalary)}</p>
                </div>

                <div className="border-b border-slate-100">
                  <button
                    onClick={() => setShowAllowances((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
                      {showAllowances ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      3. Allowances to the extent exempt u/s 10
                      <Info size={13} className="text-slate-400" />
                    </span>
                    <span className="text-[14px] font-bold text-slate-800">₹ {formatINR(allowancesExempt)}</span>
                  </button>
                  {showAllowances && (
                    <div className="px-5 pb-4">
                      <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                        Total Allowances Exempt
                      </label>
                      <div className="flex items-center border border-slate-300 rounded overflow-hidden w-52">
                        <span className="px-2.5 py-2 text-[12px] text-slate-500 bg-slate-50 border-r border-slate-300">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={allowancesExempt || ""}
                          onChange={(e) => setAllowancesExempt(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <p className="text-[13px] font-bold text-slate-700">
                    3a. Less : Income claimed for relief from taxation u/s 89A
                  </p>
                  <div className="flex items-center border border-slate-300 rounded overflow-hidden w-40 bg-white">
                    <span className="px-2.5 py-2 text-[12px] text-slate-500 bg-slate-50 border-r border-slate-300">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={reliefU89A || ""}
                      onChange={(e) => setReliefU89A(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#eff6ff]">
                  <p className="text-[14px] font-bold text-slate-800">4. Net Salary ( 2 &minus; 3 &minus; 3a )</p>
                  <p className="text-[14px] font-bold text-slate-800">{formatINR(netSalary)}</p>
                </div>

                <div>
                  <button
                    onClick={() => setShowDeductions((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
                      {showDeductions ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      5. Deductions u/s 16
                    </span>
                    <span className="text-[14px] font-bold text-slate-800">₹ {formatINR(deductionsU16)}</span>
                  </button>
                  {showDeductions && (
                    <div className="px-5 pb-4">
                      <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                        Total Deductions (Standard deduction, entertainment allowance, professional tax)
                      </label>
                      <div className="flex items-center border border-slate-300 rounded overflow-hidden w-52">
                        <span className="px-2.5 py-2 text-[12px] text-slate-500 bg-slate-50 border-r border-slate-300">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={deductionsU16 || ""}
                          onChange={(e) => setDeductionsU16(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="max-w-4xl border border-slate-200 rounded p-5 mb-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-slate-800">
                    6. Income Chargeable under the head &lsquo;Salaries&rsquo; ( 4 &minus; 5 )
                  </p>
                  <p className="text-[15px] font-bold text-slate-800">{formatINR(incomeChargeable)}</p>
                </div>
              </div>

              {scheduleError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4 max-w-4xl">
                  {scheduleError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("salaryPreview")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleConfirmSchedule}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm Schedule ›
                </button>
              </div>
            </>
          )}

          {step === "employerForm" && (
            <>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-1">Add details of breakup</h2>
              <p className="text-[11px] text-slate-400 mb-6">
                <span className="text-red-500">*</span> Indicates mandatory fields
              </p>

              <div className="w-full border border-slate-200 rounded p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      Name of Employer <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      TAN of Employer (mandatory if tax is deducted)
                    </label>
                    <input
                      value={draft.tan}
                      onChange={(e) => setDraft((prev) => ({ ...prev, tan: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      Address of Employer <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={draft.address}
                      onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      Town/City <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={draft.town}
                      onChange={(e) => setDraft((prev) => ({ ...prev, town: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={draft.state}
                      onChange={(e) => setDraft((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 bg-white outline-none focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      {STATE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                        Pin Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={draft.pin}
                        onChange={(e) => setDraft((prev) => ({ ...prev, pin: e.target.value }))}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">Zip Code</label>
                      <input
                        value={draft.zip}
                        onChange={(e) => setDraft((prev) => ({ ...prev, zip: e.target.value }))}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      Nature of Employer <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={draft.natureOfEmployer}
                      onChange={(e) => setDraft((prev) => ({ ...prev, natureOfEmployer: e.target.value }))}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 bg-white outline-none focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      {NATURE_OF_EMPLOYER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {renderBreakupSection("a", "a", "Salary as per Section 17(1)", "Nature of Salary", NATURE_OF_SALARY_OPTIONS)}
                {renderBreakupSection(
                  "b",
                  "b",
                  "Value of perquisites as per section 17(2)",
                  "Nature of Perquisites",
                  NATURE_OF_PERQUISITE_OPTIONS
                )}
                {renderBreakupSection(
                  "c",
                  "c",
                  "Profit in lieu of salary as per section 17(3)",
                  "Nature of Profit in lieu of salary",
                  NATURE_OF_PROFIT_OPTIONS
                )}

                <div className="max-w-3xl border-t border-slate-200 pt-5 mb-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-bold text-slate-800 max-w-md">
                      d. Income from retirement benefit account maintained in a notified country u/s 89A
                    </p>
                    <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(sumRows(draft.d))}</p>
                  </div>
                  {draft.d.length > 0 && (
                    <div className="space-y-3 mb-3">
                      {draft.d.map((row, idx) => (
                        <div key={row.id} className="flex flex-wrap items-end gap-4">
                          <div className="flex-1 min-w-[220px]">
                            <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                              Nature of Income
                            </label>
                            <div className="flex items-center gap-2">
                              <select
                                value={row.nature}
                                onChange={(e) =>
                                  updateDraftRows("d", (list) =>
                                    list.map((r, i) => (i === idx ? { ...r, nature: e.target.value } : r))
                                  )
                                }
                                className="flex-1 border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 bg-white outline-none focus:border-blue-500"
                              >
                                <option value="">Select</option>
                                {NATURE_OF_RETIREMENT_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraftRows("d", (list) => list.filter((_, i) => i !== idx))
                                }
                                className="inline-flex items-center gap-1 border border-red-200 text-red-600 font-semibold text-[11.5px] px-3 py-2 rounded cursor-pointer hover:bg-red-50 transition-colors shrink-0"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="w-40">
                            <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">Amount</label>
                            <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                              <span className="px-2.5 py-2 text-[12px] text-slate-500 bg-slate-50 border-r border-slate-300">
                                ₹
                              </span>
                              <input
                                type="number"
                                value={row.amount || ""}
                                onChange={(e) =>
                                  updateDraftRows("d", (list) =>
                                    list.map((r, i) =>
                                      i === idx ? { ...r, amount: Number(e.target.value) || 0 } : r
                                    )
                                  )
                                }
                                className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => updateDraftRows("d", (list) => [...list, emptyRow()])}
                    className="inline-flex items-center gap-1.5 border border-[#0f3a9a] text-[#0f3a9a] font-bold text-[12px] px-4 py-1.5 rounded cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <PlusCircle size={13} />
                    Add Another
                  </button>
                </div>

                <div className="max-w-3xl border-t border-slate-200 pt-5 flex items-center justify-between gap-4 mb-2">
                  <p className="text-[13px] font-bold text-slate-800 max-w-md">
                    e. Income from retirement benefit account maintained in a country &ldquo;other than
                    notified country u/s 89A&rdquo;
                  </p>
                  <div className="flex items-center border border-slate-300 rounded overflow-hidden w-40 shrink-0">
                    <span className="px-2.5 py-2 text-[12px] text-slate-500 bg-slate-50 border-r border-slate-300">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={draft.e || ""}
                      onChange={(e) => setDraft((prev) => ({ ...prev, e: Number(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="max-w-3xl border-t border-slate-200 pt-5 flex items-center justify-between gap-4 mb-5">
                  <p className="text-[13px] font-bold text-slate-800 max-w-md flex items-center gap-1.5">
                    f. Income taxable during the previous year on which relief u/s 89A was claimed in any
                    earlier previous year.
                    <Info size={13} className="text-slate-400 shrink-0" />
                  </p>
                  <div className="flex items-center border border-slate-300 rounded overflow-hidden w-40 shrink-0">
                    <span className="px-2.5 py-2 text-[12px] text-slate-500 bg-slate-50 border-r border-slate-300">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={draft.f || ""}
                      onChange={(e) => setDraft((prev) => ({ ...prev, f: Number(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded px-5 py-4 flex items-center justify-between mb-2">
                  <p className="text-[14px] font-bold text-[#0a2558]">Gross Salary ( a + b + c + d + e + f )</p>
                  <p className="text-[15px] font-bold text-[#0a2558]">₹ {formatINR(employerGrossSalary(draft))}</p>
                </div>
              </div>

              {draftError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4 max-w-3xl">
                  {draftError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelEmployer}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmployer}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Add
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
