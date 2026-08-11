"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ArrowLeft,
  Info,
  ChevronRight,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "scheduleSummary" | "computeTI" | "taxPaid" | "computeTTI";

type AdvanceTaxRow = {
  id: string;
  date: string;
  bsr: string;
  serial: string;
  amount: number;
};

interface ITRReg21SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-21 -> itr-reg-21 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-21";

const DEFAULT_NAME = "Sanjay Sahu";
const DEFAULT_PAN = "SNSPS4827K";
const DEFAULT_MONTHLY_TDS = "6145";
const DEFAULT_BSR_CODE = "3697896";
const DEFAULT_TOTAL_ADVANCE_TAX = "1440000";

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

// Illustrative, non-editable Part B-TI figures - these mirror the reference
// portal's read-only computation summary; only the Tax Paid schedule below
// is the actual student-entered experiment.
const TI_SALARIES = 984000;
const TI_HOUSE_PROPERTY = 0;
const TI_CAPITAL_GAINS = 0;
const TI_GROSS_TOTAL = TI_SALARIES + TI_HOUSE_PROPERTY + TI_CAPITAL_GAINS;
const TI_DEDUCTIONS_VIA = 150000;
const TI_TOTAL_INCOME = TI_GROSS_TOTAL - TI_DEDUCTIONS_VIA;
const TTI_TAX_LIABILITY = 144000;

const makeRowId = () => `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyAdvanceTaxRow = (): AdvanceTaxRow => ({
  id: makeRowId(),
  date: "",
  bsr: "",
  serial: "",
  amount: 0,
});

const formatINR = (value: number) => Math.round(value || 0).toLocaleString("en-IN");

export default function ITRReg21Simulation({ onComplete }: ITRReg21SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  // Admin-configured (Simulation Manager) TDS/advance-tax brief - drives the
  // displayed reference figures and the validation check on the Tax Paid
  // schedule below. Never hardcoded.
  const monthlyTdsRaw = findFieldValue(simConfig, /tds.*month|monthly tds/i) || DEFAULT_MONTHLY_TDS;
  const monthlyTds = Number(monthlyTdsRaw.replace(/[^0-9.]/g, "")) || 0;
  const annualTds = monthlyTds * 12;
  const expectedBsrCode = findFieldValue(simConfig, /bsr/i) || DEFAULT_BSR_CODE;
  const expectedAdvanceTaxRaw =
    findFieldValue(simConfig, /advance tax|self.assessment tax|total tax(es)? paid/i) ||
    DEFAULT_TOTAL_ADVANCE_TAX;
  const expectedAdvanceTax = Number(expectedAdvanceTaxRaw.replace(/[^0-9.]/g, "")) || 0;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("scheduleSummary");

  const [tiConfirmed, setTiConfirmed] = useState(false);
  const [taxPaidConfirmed, setTaxPaidConfirmed] = useState(false);
  const [ttiConfirmed, setTtiConfirmed] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  const [advanceTaxRows, setAdvanceTaxRows] = useState<AdvanceTaxRow[]>([emptyAdvanceTaxRow()]);
  const [taxPaidError, setTaxPaidError] = useState("");

  const resetAll = () => {
    setStep("scheduleSummary");
    setTiConfirmed(false);
    setTaxPaidConfirmed(false);
    setTtiConfirmed(false);
    setScheduleError("");
    setAdvanceTaxRows([emptyAdvanceTaxRow()]);
    setTaxPaidError("");
  };

  const totalAdvanceTax = useMemo(
    () => advanceTaxRows.reduce((acc, row) => acc + (row.amount || 0), 0),
    [advanceTaxRows]
  );
  const totalTaxesPaid = annualTds + (taxPaidConfirmed ? totalAdvanceTax : 0);
  const refundDue = totalTaxesPaid - TTI_TAX_LIABILITY;

  const updateAdvanceTaxRow = (idx: number, patch: Partial<AdvanceTaxRow>) => {
    setAdvanceTaxRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const handleConfirmTI = () => {
    setTiConfirmed(true);
    setStep("scheduleSummary");
  };

  const handleConfirmTaxPaid = () => {
    const incomplete = advanceTaxRows.some(
      (row) => !row.date.trim() || !row.bsr.trim() || !row.serial.trim() || row.amount <= 0
    );
    if (incomplete) {
      setTaxPaidError("Please fill all the challan details (date, BSR code, serial number and amount) for every row.");
      return;
    }
    if (requireCredentialValidation) {
      const amountMatches = totalAdvanceTax === expectedAdvanceTax;
      const bsrMatches = advanceTaxRows.every((row) => row.bsr.trim() === expectedBsrCode.trim());
      if (!amountMatches || !bsrMatches) {
        setTaxPaidError(
          "Entered challan details do not match the experiment brief. Please re-check the BSR code and advance tax amounts and try again."
        );
        return;
      }
    }
    setTaxPaidError("");
    setTaxPaidConfirmed(true);
    setStep("scheduleSummary");
  };

  const handleConfirmTTI = () => {
    setTtiConfirmed(true);
    setStep("scheduleSummary");
  };

  const handleProceedToVerification = () => {
    if (!tiConfirmed || !taxPaidConfirmed || !ttiConfirmed) {
      setScheduleError("Please confirm all the schedules below before proceeding to verification.");
      return;
    }
    setScheduleError("");
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
    resetAll();
  };

  const breadcrumbFor = (leaf: string) =>
    `Dashboard › Filing Returns for A.Y. 2024-25 › ITR-2 › Schedules${leaf ? ` › ${leaf}` : ""}`;

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
            <p className="text-white font-bold text-[15px]">Taxes Paid Verified &amp; Schedules Confirmed!</p>
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
          {step === "scheduleSummary" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">{breadcrumbFor("")}</p>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[26px] font-bold text-[#0a2558]">Schedules Summary</h2>
                <p className="text-[11px] font-bold text-[#16a34a]">You are almost there</p>
              </div>
              <p className="text-[12px] text-slate-500 mb-5">
                Verify the taxes paid (TDS deducted and advance tax paid during the year) and
                confirm each schedule below before proceeding to verification.
              </p>

              <div className="w-full border border-slate-200 rounded divide-y divide-slate-100 mb-4">
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

                <div className="flex items-center gap-4 p-4">
                  <span className="shrink-0 h-9 w-9 rounded bg-[#0f3a9a] flex items-center justify-center text-[12px] font-bold text-white">
                    S
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#0a2558]">Schedule Salary</p>
                    <p className="text-[11px] text-slate-500">Details of income from salaries</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16a34a] shrink-0">
                    <CheckCircle2 size={16} />
                    Confirmed
                  </span>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <span className="shrink-0 h-9 w-9 rounded bg-[#0f3a9a] flex items-center justify-center text-[11px] font-bold text-white">
                    HP
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#0a2558]">Schedule House Property</p>
                    <p className="text-[11px] text-slate-500">Details of house property owned / co-owned</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16a34a] shrink-0">
                    <CheckCircle2 size={16} />
                    Confirmed
                  </span>
                </div>

                <div
                  className={`flex items-center gap-4 p-4 ${
                    !tiConfirmed ? "border-2 border-[#0f3a9a] rounded" : ""
                  }`}
                >
                  <span className="shrink-0 h-9 w-9 rounded bg-[#0f3a9a] flex items-center justify-center text-[11px] font-bold text-white">
                    TI
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#0a2558]">Part B - TI</p>
                    <p className="text-[11px] text-slate-500">Computation of Total Income</p>
                  </div>
                  {tiConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16a34a] shrink-0">
                      <CheckCircle2 size={16} />
                      Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => setStep("computeTI")}
                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0f3a9a] shrink-0 cursor-pointer hover:underline"
                    >
                      Provide your confirmation
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div
                  className={`flex items-center gap-4 p-4 ${
                    tiConfirmed && !taxPaidConfirmed ? "border-2 border-[#0f3a9a] rounded" : ""
                  } ${!tiConfirmed ? "opacity-40" : ""}`}
                >
                  <span className="shrink-0 h-9 w-9 rounded bg-[#0f3a9a] flex items-center justify-center text-[11px] font-bold text-white">
                    TP
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#0a2558]">Tax Paid</p>
                    <p className="text-[11px] text-slate-500">
                      Details of Tax Deducted at Source from Salary, Tax collected at Source,
                      payments of Self-Assessment Tax and Advance Tax
                    </p>
                  </div>
                  {taxPaidConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16a34a] shrink-0">
                      <CheckCircle2 size={16} />
                      Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => tiConfirmed && setStep("taxPaid")}
                      disabled={!tiConfirmed}
                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0f3a9a] shrink-0 cursor-pointer hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:no-underline"
                    >
                      Provide your confirmation
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div
                  className={`flex items-center gap-4 p-4 rounded-b ${
                    taxPaidConfirmed && !ttiConfirmed ? "border-2 border-[#0f3a9a] rounded" : ""
                  } ${!taxPaidConfirmed ? "opacity-40" : ""}`}
                >
                  <span className="shrink-0 h-9 w-9 rounded bg-[#0f3a9a] flex items-center justify-center text-[10px] font-bold text-white">
                    TTI
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#0a2558]">Part B - TTI</p>
                    <p className="text-[11px] text-slate-500">Computation of Tax on total income</p>
                  </div>
                  {ttiConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#16a34a] shrink-0">
                      <CheckCircle2 size={16} />
                      Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => taxPaidConfirmed && setStep("computeTTI")}
                      disabled={!taxPaidConfirmed}
                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0f3a9a] shrink-0 cursor-pointer hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:no-underline"
                    >
                      Provide your confirmation
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {scheduleError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4">
                  {scheduleError}
                </div>
              )}

              <button
                onClick={handleProceedToVerification}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Proceed To Verification ›
              </button>
            </>
          )}

          {step === "computeTI" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">{breadcrumbFor("Part B - TI")}</p>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-1">Part B - TI</h2>
              <p className="text-[11px] text-slate-500 mb-6">Computation of Total Income</p>

              <div className="w-full border border-slate-200 rounded divide-y divide-slate-100 mb-6">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">1. Salaries (6 of Schedule S)</p>
                    <p className="text-[11px] text-[#0f3a9a] font-semibold">View Schedule Salary</p>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(TI_SALARIES)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">
                      2. Income from house property (enter nil if loss) (3 of Schedule HP)
                    </p>
                    <p className="text-[11px] text-[#0f3a9a] font-semibold">View Schedule House Property</p>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(TI_HOUSE_PROPERTY)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="text-[13px] font-bold text-slate-800">3. Capital gains</p>
                  <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(TI_CAPITAL_GAINS)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4 bg-[#eff6ff]">
                  <p className="text-[13.5px] font-bold text-[#0a2558]">9. Gross Total Income</p>
                  <p className="text-[14px] font-bold text-[#0a2558]">₹ {formatINR(TI_GROSS_TOTAL)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="text-[13px] font-bold text-slate-800">
                    11. Deductions under Chapter VI-A
                  </p>
                  <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(TI_DEDUCTIONS_VIA)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4 bg-slate-50">
                  <p className="text-[14px] font-bold text-slate-800">12. Total Income (9 &minus; 11)</p>
                  <p className="text-[15px] font-bold text-slate-800">₹ {formatINR(TI_TOTAL_INCOME)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("scheduleSummary")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back to Schedules
                </button>
                <button
                  onClick={handleConfirmTI}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm
                </button>
              </div>
            </>
          )}

          {step === "taxPaid" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">{breadcrumbFor("Tax Paid")}</p>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-1">Tax Paid</h2>
              <p className="text-[11px] text-slate-400 mb-6">
                <span className="text-red-500">*</span> Verify TDS deducted by the employer and add the
                advance tax / self-assessment tax challan details
              </p>

              <div className="w-full border border-slate-200 rounded divide-y divide-slate-100 mb-6">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">
                      TDS 1 - Tax Deducted at Source from Salary
                    </p>
                    <p className="text-[11px] text-slate-500">As per Form-16 issued by Employer</p>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(annualTds)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">
                      TDS 2 - Tax Deducted at Source on Income
                    </p>
                    <p className="text-[11px] text-slate-500">As per FORM 16A issued by Deductor(s)</p>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">₹ 0</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">Tax Collected at Source (TCS)</p>
                    <p className="text-[11px] text-slate-500">As per Form 27D issued by the Collector(s)</p>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">₹ 0</p>
                </div>
              </div>

              <div className="w-full border border-slate-200 rounded p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-bold text-[#0a2558]">Advance Tax and Self Assessment Tax</p>
                  <p className="text-[14px] font-bold text-[#0a2558]">₹ {formatINR(totalAdvanceTax)}</p>
                </div>

                <div className="space-y-3 mb-3">
                  {advanceTaxRows.map((row, idx) => (
                    <div key={row.id} className="flex flex-wrap items-end gap-4 border border-slate-200 rounded p-3">
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateAdvanceTaxRow(idx, { date: e.target.value })}
                          className="w-full border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                          BSR Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={row.bsr}
                          onChange={(e) => updateAdvanceTaxRow(idx, { bsr: e.target.value })}
                          className="w-full border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                          Challan Serial Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={row.serial}
                          onChange={(e) => updateAdvanceTaxRow(idx, { serial: e.target.value })}
                          className="w-full border border-slate-300 rounded px-2.5 py-2 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                        />
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
                            onChange={(e) => updateAdvanceTaxRow(idx, { amount: Number(e.target.value) || 0 })}
                            className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAdvanceTaxRows((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="inline-flex items-center gap-1 border border-red-200 text-red-600 font-semibold text-[11.5px] px-3 py-2 rounded cursor-pointer hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAdvanceTaxRows((prev) => [...prev, emptyAdvanceTaxRow()])}
                  className="inline-flex items-center gap-1.5 border border-[#0f3a9a] text-[#0f3a9a] font-bold text-[12px] px-4 py-1.5 rounded cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <PlusCircle size={13} />
                  Add Details
                </button>
              </div>

              <div className="w-full border border-slate-200 rounded p-5 mb-4 bg-[#eff6ff]">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-[#0a2558]">Total Taxes Paid</p>
                  <p className="text-[15px] font-bold text-[#0a2558]">
                    ₹ {formatINR(annualTds + totalAdvanceTax)}
                  </p>
                </div>
              </div>

              {taxPaidError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4">
                  {taxPaidError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setTaxPaidError("");
                    setStep("scheduleSummary");
                  }}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back to Schedules
                </button>
                <button
                  onClick={handleConfirmTaxPaid}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm
                </button>
              </div>
            </>
          )}

          {step === "computeTTI" && (
            <>
              <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-2">{breadcrumbFor("Part B - TTI")}</p>
              <h2 className="text-[24px] font-bold text-[#0a2558] mb-1">Part B - TTI</h2>
              <p className="text-[11px] text-slate-500 mb-6">Computation of Tax on total income</p>

              <div className="w-full border border-slate-200 rounded divide-y divide-slate-100 mb-6">
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="text-[13px] font-bold text-slate-800">1. Total Income</p>
                  <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(TI_TOTAL_INCOME)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="text-[13px] font-bold text-slate-800">2. Tax Payable on Total Income</p>
                  <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(TTI_TAX_LIABILITY)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="text-[13px] font-bold text-slate-800">3. Total Taxes Paid (TDS + Advance Tax)</p>
                  <p className="text-[13px] font-bold text-slate-800">₹ {formatINR(totalTaxesPaid)}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4 bg-[#eff6ff]">
                  <p className="text-[14px] font-bold text-[#0a2558]">
                    {refundDue >= 0 ? "4. Refund (3 − 2)" : "4. Balance Tax Payable (2 − 3)"}
                  </p>
                  <p className="text-[15px] font-bold text-[#0a2558]">₹ {formatINR(Math.abs(refundDue))}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("scheduleSummary")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back to Schedules
                </button>
                <button
                  onClick={handleConfirmTTI}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Confirm
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
