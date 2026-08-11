"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ArrowLeft,
  Info,
  Download,
  RotateCcw,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "selectSchedule" | "scheduleSummary";

type ScheduleCategory = "general" | "income" | "deduction" | "tax" | "others";

type ScheduleItem = {
  id: string;
  label: string;
  title: string;
  desc: string;
  category: ScheduleCategory;
  mandatory?: boolean;
};

interface ITRReg19SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-19 -> itr-reg-19 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-19";

const DEFAULT_NAME = "Sanjay Sahu";
const DEFAULT_PAN = "SNSPS4827K";
const DEFAULT_ITR_FORM = "ITR-2";
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
    label: "S",
    title: "Schedule Salary",
    desc: "Details of salary income",
    category: "income",
  },
  {
    id: "scheduleHP",
    label: "HP",
    title: "Schedule House Property",
    desc: "Details of house property owned / co-owned",
    category: "income",
  },
  {
    id: "scheduleCG",
    label: "CG",
    title: "Schedule Capital Gains",
    desc: "Details of capital asset transferred",
    category: "income",
  },
  {
    id: "schedule112A",
    label: "112A",
    title: "Schedule 112A",
    desc: "Details of long-term capital gain on sale of specified securities covered under Section 112A",
    category: "income",
  },
  {
    id: "scheduleOS",
    label: "OS",
    title: "Schedule Other Sources",
    desc: "Details of income from other sources",
    category: "income",
  },
  {
    id: "scheduleVIA",
    label: "VI-A",
    title: "Schedule VI-A",
    desc: "Details of deductions from total income under Chapter VI-A",
    category: "deduction",
  },
  {
    id: "scheduleTDS",
    label: "TDS",
    title: "Schedule TDS",
    desc: "Details of Tax Deducted / Collected at Source",
    category: "tax",
  },
  {
    id: "scheduleIT",
    label: "IT",
    title: "Schedule IT",
    desc: "Details of payments of Advance Tax and Self Assessment Tax",
    category: "tax",
  },
  {
    id: "scheduleTR",
    label: "TR",
    title: "Schedule Tax Relief under section 90, 90A or 91",
    desc: "Summary of tax relief claimed for taxes paid outside India",
    category: "tax",
  },
  {
    id: "scheduleEI",
    label: "EI",
    title: "Schedule EI",
    desc: "Details of income not forming part of total income",
    category: "others",
  },
  {
    id: "scheduleAL",
    label: "AL",
    title: "Schedule AL",
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

export default function ITRReg19Simulation({ onComplete }: ITRReg19SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const itrForm = findFieldValue(simConfig, /itr form|form/i) || DEFAULT_ITR_FORM;
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
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("selectSchedule");

  const [selectedSchedules, setSelectedSchedules] = useState<Record<string, boolean>>({
    partAGen: true,
  });
  const [activeCategory, setActiveCategory] = useState<ScheduleCategory>("general");
  const [scheduleError, setScheduleError] = useState("");
  const [mismatchHighlight, setMismatchHighlight] = useState(false);
  const [confirmedSchedules, setConfirmedSchedules] = useState<Record<string, boolean>>({});

  const resetAll = () => {
    setStep("selectSchedule");
    setSelectedSchedules({ partAGen: true });
    setActiveCategory("general");
    setScheduleError("");
    setMismatchHighlight(false);
    setConfirmedSchedules({});
  };

  const toggleSchedule = (item: ScheduleItem) => {
    if (item.mandatory) return;
    setSelectedSchedules((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    setScheduleError("");
    setMismatchHighlight(false);
  };

  const selectedIncomeLabels = useMemo(
    () =>
      scheduleCatalog
        .filter((item) => item.category === "income" && selectedSchedules[item.id])
        .map((item) => `Schedule ${item.label}`),
    [selectedSchedules]
  );

  // Income-category items whose selected state disagrees with the
  // admin-configured brief - only populated once a mismatch is flagged, so
  // students see exactly which checkboxes to fix instead of a generic error.
  const requiredIncomeIdSet = useMemo(
    () =>
      new Set(
        requiredIncomeSchedules.map((label) => label.trim().toLowerCase())
      ),
    [requiredIncomeSchedules]
  );
  const mismatchedIncomeIds = useMemo(() => {
    if (!mismatchHighlight) return new Set<string>();
    return new Set(
      scheduleCatalog
        .filter((item) => item.category === "income")
        .filter((item) => {
          const isRequired = requiredIncomeIdSet.has(`schedule ${item.label}`.toLowerCase());
          const isSelected = !!selectedSchedules[item.id];
          return isRequired !== isSelected;
        })
        .map((item) => item.id)
    );
  }, [mismatchHighlight, requiredIncomeIdSet, selectedSchedules]);

  const handleScheduleContinue = () => {
    if (selectedIncomeLabels.length === 0) {
      setMismatchHighlight(false);
      setScheduleError(
        "Please select at-least one schedule from Income category in order to proceed further."
      );
      return;
    }
    if (requireCredentialValidation) {
      const selectedSorted = [...selectedIncomeLabels].sort().join("|").toLowerCase();
      const requiredSorted = [...requiredIncomeSchedules].sort().join("|").toLowerCase();
      if (selectedSorted !== requiredSorted) {
        setMismatchHighlight(true);
        setScheduleError("Selection does not match the experiment brief. Please re-check and try again.");
        return;
      }
    }
    setMismatchHighlight(false);
    setScheduleError("");
    setStep("scheduleSummary");
  };

  const selectedScheduleSummary = scheduleCatalog.filter((item) => selectedSchedules[item.id]);
  const allConfirmed = selectedScheduleSummary.every((item) => confirmedSchedules[item.id]);

  const handleConfirmSchedule = (item: ScheduleItem) => {
    setConfirmedSchedules((prev) => ({ ...prev, [item.id]: true }));
  };

  const handleDownloadJson = () => {
    const payload = {
      name,
      pan,
      itrForm,
      schedules: selectedScheduleSummary.map((item) => ({
        code: item.label,
        title: item.title,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${itrForm.toLowerCase()}-schedules-summary.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleProceedToVerification = () => {
    if (!allConfirmed) return;
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
    resetAll();
  };

  const totalSelectedCount = Object.values(selectedSchedules).filter(Boolean).length;
  const categoryCount = (category: ScheduleCategory) =>
    scheduleCatalog.filter((item) => item.category === category && selectedSchedules[item.id]).length;

  const breadcrumb = `Dashboard › Filing Returns for A.Y. 2024-25 › ${itrForm} › Schedule Selection`;

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
            <p className="text-white font-bold text-[15px]">
              {itrForm} Schedules Submitted for Verification!
            </p>
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
          <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 14:59</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">{breadcrumb}</p>

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
                  disabled
                  title="Not available in this simulation"
                  className="border border-slate-200 text-slate-300 font-bold text-[13px] px-6 py-2 rounded cursor-not-allowed"
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
              <div className="flex items-center justify-between max-w-4xl mb-1">
                <h2 className="text-[26px] font-bold text-[#0a2558]">Schedules Summary</h2>
                <p className="text-[11px] font-bold text-[#16a34a]">You are almost there</p>
              </div>
              <p className="text-[12px] text-slate-500 mb-5 max-w-2xl">
                Provide your confirmation for each schedule below before proceeding to
                verification.
              </p>

              <div className="max-w-4xl border border-slate-200 rounded divide-y divide-slate-100 mb-4">
                {selectedScheduleSummary.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <span className="shrink-0 h-9 px-2 rounded bg-[#0f3a9a] flex items-center justify-center text-[10px] font-bold text-white">
                      {item.label}
                    </span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#0a2558]">
                        {item.title}
                        {item.mandatory && (
                          <span className="text-slate-400 font-semibold"> (Mandatory)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    {confirmedSchedules[item.id] ? (
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16a34a] shrink-0">
                        <CheckCircle2 size={16} />
                        Confirmed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConfirmSchedule(item)}
                        className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0f3a9a] shrink-0 cursor-pointer hover:underline"
                      >
                        Provide your confirmation
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep("selectSchedule")}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0f3a9a] mb-6 cursor-pointer hover:underline"
              >
                <PlusCircle size={14} />
                Add more Schedules
              </button>

              <div className="max-w-4xl flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setStep("selectSchedule")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <p className="text-[11px] text-slate-500 flex-1 min-w-[180px]">
                  Do you want to download a JSON copy of the schedules selected before proceeding?
                </p>
                <button
                  onClick={resetAll}
                  className="inline-flex items-center gap-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-[13px] px-5 py-2 rounded cursor-pointer transition-colors"
                >
                  <RotateCcw size={14} />
                  Retry
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-5 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <Download size={14} />
                  Download JSON
                </button>
                <button
                  onClick={handleProceedToVerification}
                  disabled={!allConfirmed}
                  title={allConfirmed ? undefined : "Provide your confirmation for every schedule to proceed"}
                  className={`font-bold text-[13px] px-6 py-2 rounded transition-colors ${
                    allConfirmed
                      ? "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                      : "border border-slate-200 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  Proceed To Verification ›
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
