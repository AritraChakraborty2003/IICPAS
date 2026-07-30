"use client";

import React, { useState } from "react";
import {
  FaGlobe,
  FaChevronDown,
  FaBell,
  FaQuestionCircle,
} from "react-icons/fa";
import { CheckCircle2, RotateCcw, RefreshCw } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "select_period" | "view_returns" | "gstr3b_view";

interface GSTR1A14SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-14 -> gst-gstr-1a-14 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-14";

const DEFAULT_COMPANY_NAME = "HP Cements Private Limited";
const DEFAULT_GSTIN = "07GDLCF7228G1YK";

// GSTR-3B "Monthly Return" tiles. Experiment 1 only asks the learner to
// select June and open GSTR-3B via Prepare Online, so the values here are
// the auto-drafted figures shown once the tile opens - none of them are
// editable in this exercise.
const gstr3bTiles: {
  key: string;
  label: string;
  values: { label: string; value: string }[];
}[] = [
  {
    key: "outward",
    label: "3.1 Tax on outward and reverse charge inward supplies",
    values: [
      { label: "Integrated Tax", value: "12600" },
      { label: "Central Tax", value: "0" },
      { label: "State/UT Tax", value: "0" },
      { label: "CESS", value: "₹0.00" },
    ],
  },
  {
    key: "tds_tcs",
    label: "6.2 TDS/TCS Credit",
    values: [
      { label: "Integrated Tax", value: "₹0.00" },
      { label: "Central Tax", value: "₹0.00" },
      { label: "State/UT Tax", value: "₹0.00" },
      { label: "CESS", value: "₹0.00" },
    ],
  },
  {
    key: "eligible_itc",
    label: "4. Eligible ITC",
    values: [
      { label: "Integrated Tax", value: "₹0.00" },
      { label: "Central Tax", value: "₹0.00" },
      { label: "State/UT Tax", value: "₹0.00" },
      { label: "CESS", value: "₹0.00" },
    ],
  },
  {
    key: "exempt",
    label: "5. Exempt, nil and Non GST inward supplies",
    values: [
      { label: "Inter-state supplies", value: "₹0.00" },
      { label: "Intra-state supplies", value: "₹0.00" },
    ],
  },
  {
    key: "interest",
    label: "5.1 Interest and Late fee",
    values: [
      { label: "Integrated Tax", value: "₹0.00" },
      { label: "Central Tax", value: "₹0.00" },
      { label: "State/UT Tax", value: "₹0.00" },
      { label: "CESS", value: "₹0.00" },
    ],
  },
];

export default function GSTR1A14Simulation({
  onComplete,
}: GSTR1A14SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /gstin/i) || DEFAULT_GSTIN;

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  // Experiment 1 is only about searching for June and opening GSTR-3B via
  // Prepare Online, so the simulation opens straight on the File Returns
  // search screen instead of the GST portal welcome dashboard.
  const [step, setStep] = useState<Step>("select_period");
  const [financialYear, setFinancialYear] = useState("20XX-XX");
  const [quarter, setQuarter] = useState("Quarter 1 (Apr - Jun)");
  const [period, setPeriod] = useState("Select");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleSearchClick = () => {
    if (period === "June") setStep("view_returns");
  };

  const handleRetry = () => {
    setStep("select_period");
    setPeriod("Select");
    setShowSuccessOverlay(false);
  };

  // Reaching the GSTR-3B - Monthly Return view is the entire exercise, so
  // opening it via "Prepare Online" is what marks this experiment complete.
  const handlePrepareOnline = () => {
    setStep("gstr3b_view");
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
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-white cursor-pointer hover:text-slate-200">
            <span>{companyName}</span>
            <FaChevronDown size={9} />
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer">
            <FaBell size={12} className="text-slate-200" />
          </div>
        </div>
      </div>
      <div className="bg-[#1e3b6a] px-4 text-xs font-bold flex flex-wrap items-center shadow-md">
        {[
          { label: "Dashboard", hasDropdown: false },
          { label: "Services", hasDropdown: true },
          { label: "GST Law", hasDropdown: false },
          { label: "Downloads", hasDropdown: true },
          { label: "Search Taxpayer", hasDropdown: true },
          { label: "Help and Taxpayer Facilities", hasDropdown: false },
          { label: "e-Invoice", hasDropdown: false },
        ].map((item) => (
          <button
            key={item.label}
            className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide flex items-center gap-1"
          >
            {item.label}
            {item.hasDropdown && <FaChevronDown size={9} />}
          </button>
        ))}
      </div>
    </div>
  );

  const breadcrumb = (steps: string[]) => (
    <div className="bg-[#cbd5e1]/40 border-b border-[#cbd5e1]/60 px-5 py-2 select-none shrink-0">
      <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600">
        <div className="flex items-center gap-1.5">
          {steps.map((label, idx) => (
            <React.Fragment key={label}>
              {idx > 0 && <span className="text-[#94a3b8] font-normal">&gt;</span>}
              {idx === steps.length - 1 ? (
                <span className="text-[#475569]">{label}</span>
              ) : (
                <span
                  className="hover:underline cursor-pointer text-[#0f3a9a]"
                  onClick={() => {
                    if (label === "Dashboard" || label === "Returns") setStep("select_period");
                    if (label === "GSTR3B") setStep("gstr3b_view");
                  }}
                >
                  {label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
          <FaGlobe size={12} className="text-slate-500" />
          <span>English</span>
        </div>
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

      {/* STEP 1: File Returns search form */}
      {step === "select_period" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns"])}

          <div className="flex-1 p-5">
            <div className="bg-white border border-[#cbd5e1] rounded-none p-5 w-full text-[11px]">
              <div className="border-b border-slate-200 pb-2.5 mb-2">
                <h2 className="text-[#0a2558] font-bold text-[14px]">File Returns</h2>
              </div>

              <div className="bg-[#fcf8e3] border border-[#faebcc] p-3 text-[#8a6d3b] text-[10.5px] leading-relaxed mb-4">
                GSTR-2A can now be downloaded in excel/CSV format for your reference and
                further use. Nil return for GSTR-3B &amp; GSTR-1 can now be filed through
                SMS.
              </div>

              <div className="text-right text-[10px] text-red-500 font-semibold mb-4 pr-2">
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
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                  >
                    <option value="Select">Select</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={handleSearchClick}
                    disabled={period !== "June"}
                    className={`w-full py-2 text-[11px] uppercase font-bold transition-all ${
                      period === "June"
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
          {footer}
        </div>
      )}

      {/* STEP 2: Returns grid */}
      {step === "view_returns" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns"])}

          <div className="flex-1 p-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[11px]">
              {/* GSTR1 */}
              <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[170px]">
                <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                  Details of outward supplies of goods or services
                  <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR1</div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-[#0c5f86]">
                  Status - Filed
                </div>
                <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-extrabold px-5 py-1.5 uppercase text-[9.5px] cursor-not-allowed"
                  >
                    View
                  </button>
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-extrabold px-4 py-1.5 uppercase text-[9.5px] cursor-not-allowed"
                  >
                    Download
                  </button>
                </div>
              </div>

              {/* GSTR1A */}
              <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[170px]">
                <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                  Amendment of outward supplies of goods or services for current tax period
                  <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR-1A</div>
                </div>
                <div className="flex-1" />
                <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-extrabold px-5 py-1.5 uppercase text-[9.5px] cursor-not-allowed"
                  >
                    Prepare Online
                  </button>
                </div>
              </div>

              {/* GSTR2A */}
              <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[170px]">
                <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                  Auto Drafted details (For view only)
                  <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR2A</div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                  (Auto Drafted)
                </div>
                <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-extrabold px-4 py-1.5 uppercase text-[9.5px] cursor-not-allowed"
                  >
                    View
                  </button>
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-extrabold px-4 py-1.5 uppercase text-[9.5px] cursor-not-allowed"
                  >
                    Download
                  </button>
                </div>
              </div>

              {/* GSTR2B */}
              <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[170px]">
                <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                  Auto - drafted ITC Statement
                  <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR2B</div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                  (ITC Statement)
                </div>
                <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-extrabold px-4 py-1.5 uppercase text-[9.5px] cursor-not-allowed"
                  >
                    View
                  </button>
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-extrabold px-4 py-1.5 uppercase text-[9.5px] cursor-not-allowed"
                  >
                    Download
                  </button>
                </div>
              </div>

              {/* GSTR3B - the target tile */}
              <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[170px]">
                <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                  Monthly Return
                  <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR3B</div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                  Due Date - Jul 20 20XX
                </div>
                <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                  <button
                    onClick={handlePrepareOnline}
                    className="bg-white border-2 border-red-500 hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 uppercase text-[9.5px] cursor-pointer"
                  >
                    Prepare Online
                  </button>
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-extrabold px-3 py-1.5 uppercase text-[9.5px] cursor-not-allowed"
                  >
                    Prepare Offline
                  </button>
                </div>
              </div>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 3: GSTR-3B - Monthly Return view (completion) */}
      {step === "gstr3b_view" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR3B"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <h2 className="text-[#0a2558] font-bold text-[14px]">GSTR-3B - Monthly Return</h2>

            <div className="bg-white border border-[#cbd5e1] p-4 flex items-center justify-between">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 text-[11px]">
                <div>
                  <span className="font-bold text-slate-500">GSTIN</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">{gstin}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Legal Name</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">{companyName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Status</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-red-500">Not Filed</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">FY</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">2024-25</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Return Period</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">June</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Due Date</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">Jul 20 20XX</span>
                </div>
              </div>
              <FaQuestionCircle className="text-emerald-500 shrink-0" size={26} />
            </div>

            <div className="bg-[#fcf8e3] border border-[#faebcc] p-3 text-[#8a6d3b] text-[10.5px] leading-relaxed">
              Please click on a box (tile) and enter relevant details therein. Save and
              close the box to enter relevant details. Once you have filled up the
              information relating to a tile, you will see gross (summary) figures on the
              tiles. You may review by clicking on Preview button. You can click on Back
              button to go to previous screen anytime. Data saved by you will not be
              deleted.
            </div>

            <div className="bg-[#e0f2fe] border border-[#bae6fd] px-3 py-2 text-[#0369a1] text-[10.5px] font-semibold flex items-center justify-between">
              <span>
                You have not filed GSTR-1 of the selected tax period. Please file the same
                to have auto-drafted liabilities in GSTR-3B from form GSTR-1.
              </span>
            </div>

            <div className="text-right">
              <a className="text-[#0f3a9a] font-extrabold text-[10.5px] hover:underline cursor-pointer">
                Help Manual
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gstr3bTiles.map((tile) => (
                <div
                  key={tile.key}
                  className="bg-white border border-[#cbd5e1] flex flex-col rounded overflow-hidden shadow-sm"
                >
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[10.5px] leading-snug min-h-[56px] flex items-center">
                    {tile.label}
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    {tile.values.map((v) => (
                      <div key={v.label}>
                        <div className="text-slate-500 font-semibold">{v.label}</div>
                        <div className="text-slate-800 font-bold">{v.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1e3b6a] text-white">
              <div className="text-center font-bold text-[11px] py-2 border-b border-white/10">
                Important Message
              </div>
              <div className="p-4 text-[10.5px] leading-relaxed space-y-1">
                <p>Once you have filled the relevant tables, please follow the following steps for filing:-</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Please click on &apos;Save GSTR3B&apos; on the summary page.</li>
                  <li>You may download and preview/save the draft GSTR-3B.</li>
                  <li>Click on &apos;Proceed to payment&apos; to offset your liabilities.</li>
                  <li>
                    In case of insufficient cash balance to set off the liabilities, challan
                    creation facility has been provided on the same screen.
                  </li>
                  <li>After setting off liabilities, GSTR-3B can be filed by attaching DSC/EVC.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                onClick={() => setStep("view_returns")}
                className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer"
              >
                Back
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                GSTR-3B System Computed (PDF)
              </button>
              <button
                disabled
                className="bg-[#0f3a9a]/40 text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Save GSTR3B
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Preview Draft GSTR-3B
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}
    </div>
  );
}
