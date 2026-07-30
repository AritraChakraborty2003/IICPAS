"use client";

import React, { useState } from "react";
import { FaGlobe, FaChevronDown } from "react-icons/fa";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "portal_dashboard" | "return_dashboard" | "file_returns";

interface GSTR1A21SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-21 -> gst-gstr-1a-21 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-21";

const DEFAULT_COMPANY_NAME = "Finmoto Private Limited";
const DEFAULT_GSTIN = "23AAACR5055K2ZE";

const navItems = [
  "Dashboard",
  "Services",
  "GST Law",
  "Downloads",
  "Search Taxpayer",
  "Help and Taxpayer Facilities",
  "e-Invoice",
];

const returnsCalendarRows: { label: string; statuses: string[] }[] = [
  { label: "GSTR-1 / IFF", statuses: ["Filed", "Filed", "Filed", "Filed", "To be Filed"] },
  { label: "GSTR-3B", statuses: ["Filed", "Filed", "Filed", "Filed", "To be Filed"] },
];

export default function GSTR1A21Simulation({
  onComplete,
}: GSTR1A21SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /gstin/i) || DEFAULT_GSTIN;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [step, setStep] = useState<Step>("portal_dashboard");
  const [financialYear, setFinancialYear] = useState("20XX-XX");
  const [quarter, setQuarter] = useState("Quarter 1 (Apr - Jun)");
  const [period, setPeriod] = useState("select");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleRetry = () => {
    setStep("portal_dashboard");
    setPeriod("select");
    setShowSuccessOverlay(false);
  };

  const handleSearch = () => {
    if (period !== "May") return;
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  const navHeader = (
    <div className="bg-[#0a2558] text-white w-full select-none shrink-0">
      <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/images/simulations/satyamev-jayate.jpg"
            alt="Satyamev Jayate emblem"
            className="h-10 w-10 object-contain bg-white rounded-full p-0.5"
          />
          <div>
            <h1 className="text-base font-black uppercase tracking-wider leading-tight">
              Goods and Services Tax
            </h1>
            <p className="text-[9px] text-slate-300 uppercase tracking-widest font-bold">
              Government of India
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-white cursor-pointer hover:text-slate-200 self-start md:self-auto">
          <span>{companyName}</span>
          <FaChevronDown size={9} />
        </div>
      </div>
      <div className="bg-[#1e3b6a] px-4 text-xs font-bold flex flex-wrap items-center shadow-md">
        {navItems.map((item) => (
          <button
            key={item}
            className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  const footer = (
    <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto shrink-0">
      <span>© 2022 IICPA Simulation Software Designed &amp; Developed by IICPA</span>
      <span>
        Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+,
        Firefox 45+ and Safari 6+
      </span>
    </div>
  );

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

      {/* SUCCESS OVERLAY (GREEN TICK & RETRY BUTTON) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] animate-fadeIn">
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_15px_45px_rgba(71,198,90,0.4)] animate-scaleIn">
              <CheckCircle2 className="text-white" size={90} strokeWidth={2.5} />
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-md bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.3)] transition-all hover:bg-[#c90f15] hover:scale-105 cursor-pointer"
            >
              <RotateCcw size={14} />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Admin-configured (Simulation Manager) experiment brief - not
          rendered at all if the admin hasn't set a banner for this slug. */}
      {bannerText && (
        <div className="bg-[#e0f2fe] border-b border-[#bae6fd] px-6 py-2.5 text-[11px] font-bold text-[#0369a1] select-none shrink-0">
          {bannerText}
        </div>
      )}

      <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
        {navHeader}

        <div className="bg-[#cbd5e1]/40 border-b border-[#cbd5e1]/60 px-5 py-2 select-none shrink-0">
          <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span
                className="hover:underline cursor-pointer text-[#0f3a9a]"
                onClick={() => setStep("portal_dashboard")}
              >
                Dashboard
              </span>
              {step === "file_returns" && (
                <>
                  <span className="text-[#94a3b8] font-normal">&gt;</span>
                  <span className="text-[#475569]">Returns</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
              <FaGlobe size={12} className="text-slate-500" />
              <span>English</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Post-login GST Common Portal dashboard */}
        {(step === "portal_dashboard" || step === "return_dashboard") && (
          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-[13px] font-bold text-[#0a2558]">
                  Welcome {companyName} to GST Common Portal
                </h2>

                <div className="bg-white border border-[#cbd5e1] p-4">
                  <h3 className="text-[12px] font-extrabold text-slate-700 mb-3">
                    Returns Calendar (Last 5 return periods)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10.5px] border-collapse">
                      <tbody>
                        {returnsCalendarRows.map((row) => (
                          <tr key={row.label}>
                            <td className="bg-[#1e3b6a] text-white font-bold px-3 py-2.5 whitespace-nowrap">
                              {row.label}
                            </td>
                            {row.statuses.map((status, idx) => (
                              <td
                                key={idx}
                                className={`px-3 py-2.5 text-center font-bold text-white ${
                                  status === "Filed" ? "bg-[#34d399]" : "bg-[#f59e0b]"
                                }`}
                              >
                                {status}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-slate-300 rounded px-3 py-2 text-[10.5px] font-semibold text-slate-600">
                  You can navigate to your chosen page through navigation panel given below
                </div>

                <div className="border border-slate-300 rounded px-3 py-2.5 text-[10.5px] italic text-slate-600">
                  Your address of Principal Place of Business is not Geocoded in our records.
                  Kindly click on continue to update the Geocoded Address. Please note that the
                  existing address of the Principal Place of Business appearing in the GST
                  system/Registration Certificate will not be impacted.{" "}
                  <span className="text-[#0f3a9a] font-bold cursor-pointer hover:underline">
                    Continue
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setStep("return_dashboard")}
                    className={`font-bold uppercase text-[11px] px-4 py-2 rounded transition-colors ${
                      step === "return_dashboard"
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-[#1e3b6a] hover:bg-[#152a4e] text-white cursor-pointer"
                    }`}
                    disabled={step === "return_dashboard"}
                  >
                    Return Dashboard &gt;
                  </button>
                  <button
                    disabled
                    className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-4 py-2 rounded cursor-not-allowed"
                  >
                    Create Challan &gt;
                  </button>
                  <button
                    disabled
                    className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-4 py-2 rounded cursor-not-allowed"
                  >
                    View Notice(s) and Order(s) &gt;
                  </button>
                </div>

                {step === "return_dashboard" && (
                  <div className="space-y-3 pt-1 animate-fadeIn">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled
                        className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-4 py-2 rounded cursor-not-allowed"
                      >
                        Annual Return &gt;
                      </button>
                      <button
                        disabled
                        className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-4 py-2 rounded cursor-not-allowed"
                      >
                        Report ITC Reversal Opening Balance &gt;
                      </button>
                    </div>
                    <button
                      disabled
                      className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-4 py-2 rounded cursor-not-allowed"
                    >
                      Report RCM ITC Opening Balance &gt;
                    </button>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-700">Else Go to &gt;&gt;</span>
                      <button
                        onClick={() => setStep("file_returns")}
                        className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-4 py-2 rounded cursor-pointer transition-colors"
                      >
                        Continue to Dashboard &gt;
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 text-[11px]">
                <div className="text-right text-slate-500 font-semibold">
                  Currently logged in from IP: 1.1.1.1
                </div>
                <div className="bg-white border border-[#cbd5e1] p-4">
                  <div className="font-extrabold text-slate-800">{companyName}</div>
                  <div className="text-slate-500 font-semibold">{gstin}</div>
                  <div className="mt-2 text-[#0f3a9a] font-bold cursor-pointer hover:underline">
                    View Profile
                  </div>
                </div>
                <div className="bg-white border border-[#cbd5e1] p-4 space-y-2">
                  <div className="font-extrabold text-slate-700 mb-1">Quick Links</div>
                  <div className="text-[#0f3a9a] font-bold cursor-pointer hover:underline">
                    Check Cash Balance
                  </div>
                  <div className="text-[#0f3a9a] font-bold cursor-pointer hover:underline">
                    Liability Ledger
                  </div>
                  <div className="text-[#0f3a9a] font-bold cursor-pointer hover:underline">
                    Credit Ledger
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: File Returns - period selector */}
        {step === "file_returns" && (
          <div className="flex-1 p-5 animate-fadeIn">
            <div className="bg-white border border-[#cbd5e1] rounded-none p-5 w-full max-w-3xl">
              <div className="border-b border-slate-200 pb-2.5 mb-4">
                <h2 className="text-[#0a2558] font-bold text-[14px]">File Returns</h2>
              </div>

              <div className="bg-[#fcf8e3] border border-[#faebcc] p-3 text-[#8a6d3b] text-[10.5px] leading-relaxed mb-4">
                GSTR-2A can now be downloaded in excel/CSV format for your reference and further
                use. Nil return for GSTR-3B &amp; GSTR-1 can now be filed through SMS.
              </div>

              <div className="text-right text-[10px] text-red-500 font-semibold mb-4">
                <span className="text-red-500 font-bold">*</span> Indicates Mandatory Fields
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Financial Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                  >
                    <option value="20XX-XX">20XX-XX</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Quarter <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                  >
                    <option value="Quarter 1 (Apr - Jun)">Quarter 1 (Apr - Jun)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Period <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full border-2 border-red-500 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                  >
                    <option value="select">select</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={handleSearch}
                    disabled={period !== "May"}
                    className={`w-full py-2 text-[11px] uppercase font-bold transition-all ${
                      period === "May"
                        ? "bg-[#0c5f86] text-white hover:bg-[#0a4f70] border-2 border-red-500 cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                    }`}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-2 font-extrabold text-[#0c5f86] text-[10.5px]">
                <p className="cursor-pointer hover:underline">1. Report ITC Reversal Opening Balance</p>
                <p className="cursor-pointer hover:underline">2. Report RCM ITC Opening Balance</p>
              </div>
            </div>
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}
