"use client";

import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaArrowLeft,
  FaUser,
  FaBell,
  FaGlobe,
  FaChevronDown
} from "react-icons/fa";
import { CheckCircle2, RotateCcw } from "lucide-react";

type Step = "select_period" | "view_returns" | "gstr1a_dashboard";

interface GSTR1A1SimulationProps {
  onComplete?: () => void;
}

export default function GSTR1A1Simulation({
  onComplete,
}: GSTR1A1SimulationProps = {}) {
  const [currentStep, setCurrentStep] = useState<Step>("select_period");
  const [financialYear, setFinancialYear] = useState("2024-25");
  const [quarter, setQuarter] = useState("Quarter 1 (Apr - Jun)");
  const [period, setPeriod] = useState("select");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isExperimentStarted, setIsExperimentStarted] = useState(false);

  useEffect(() => {
    if (currentStep === "gstr1a_dashboard") {
      const timer = setTimeout(() => {
        setShowSuccessOverlay(true);
        onComplete?.();
      }, 850);
      return () => clearTimeout(timer);
    } else {
      setShowSuccessOverlay(false);
    }
  }, [currentStep]);

  const handleSearchClick = () => {
    if (period === "June") {
      setCurrentStep("view_returns");
    }
  };

  const handlePrepareOnlineClick = () => {
    setCurrentStep("gstr1a_dashboard");
  };

  const handleRetry = () => {
    // Reset to step 1
    setCurrentStep("select_period");
    setPeriod("select");
    setShowSuccessOverlay(false);
  };

  const cards = [
    { code: "4A, 4B, 6B, 6C - B2B, SEZ, DE Invoices", count: 0 },
    { code: "5 - B2C (Large) Invoices", count: 0 },
    { code: "6A - Exports Invoices", count: 0 },
    { code: "7 - B2C (Others)", count: 0 },
    { code: "8A, 8B, 8C, 8D - Nil Rated Supplies", count: 0 },
    { code: "9B - Credit / Debit Notes (Registered)", count: 0 },
    { code: "9B - Credit / Debit Notes (Unregistered)", count: 0 },
    { code: "11A(1), 11A(2) - Tax Liability (Advances Received)", count: 0 },
    { code: "11B(1), 11B(2) - Adjustment of Advances", count: 0 },
    { code: "12 - HSN-wise summary of outward supplies", count: 0 },
    { code: "13 - Documents Issued", count: 0 },
    { code: "14 - Supplies made through ECO", count: 0 },
  ];

  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans antialiased flex flex-col select-none relative">
      
      {/* START EXPERIMENT OVERLAY */}
      {!isExperimentStarted && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1.5px] z-40 flex items-center justify-center">
          <button
            onClick={() => setIsExperimentStarted(true)}
            className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white px-8 py-3.5 rounded font-bold uppercase tracking-wider text-sm shadow-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer z-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="white"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-play"
            >
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
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


      {/* Experiment Instruction Banner */}
      <div className="bg-[#e0f2fe] border-b border-[#bae6fd] px-6 py-2.5 text-[11px] font-bold text-[#0369a1] select-none shrink-0">
        Experiment I - Select GSTR-1A option after logging in.
      </div>

      {/* Portal Container */}
      <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
        
        {/* Blue GST Header */}
        <div className="bg-[#0a2558] text-white w-full select-none shrink-0">
          <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="/images/simulations/satyamev-jayate.jpg"
                alt="Satyamev Jayate emblem"
                className="h-10 w-10 object-contain bg-white rounded-full p-0.5"
              />
              <div>
                <h1 className="text-base font-black uppercase tracking-wider leading-tight">Goods and Services Tax</h1>
                <p className="text-[9px] text-slate-300 uppercase tracking-widest font-bold">Government of India</p>
              </div>
            </div>

            <div className="flex flex-col items-end text-right">
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-300">
                <span className="hover:underline cursor-pointer">Skip to Main Content</span>
                <span>|</span>
                <span className="cursor-pointer hover:text-white">A+</span>
                <span className="cursor-pointer hover:text-white">A</span>
                <span className="cursor-pointer hover:text-white">A-</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-extrabold text-white bg-white/10 px-2 py-0.5 rounded">
                <FaUser size={10} className="mr-1" />
                <span>IICPA Private Limited</span>
                <span className="text-slate-400 font-normal mx-1">/</span>
                <span className="text-emerald-400">07GDLCF7228G1YK</span>
              </div>
            </div>
          </div>

          {/* GST Main Navigation Menu */}
          <div className="bg-[#1e3b6a] px-4 text-xs font-bold flex flex-wrap items-center justify-between relative shadow-md">
            <div className="flex flex-wrap items-center">
              <button className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide">
                Dashboard
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsServicesMenuOpen(!isServicesMenuOpen)}
                  className={`px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 flex items-center gap-1 uppercase tracking-wide cursor-pointer ${
                    isServicesMenuOpen ? "bg-[#152a4e]" : ""
                  }`}
                >
                  Services <FaChevronDown size={10} className="ml-1" />
                </button>
              </div>
              <button className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide">
                GST Law
              </button>
              <button className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide">
                Downloads
              </button>
              <button className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide">
                Search Taxpayer
              </button>
              <button className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide">
                Help and Taxpayer Facilities
              </button>
              <button className="px-4 py-3 hover:bg-[#152a4e] transition-colors uppercase tracking-wide">
                e-Invoice
              </button>
            </div>
            
            <div className="py-2.5 px-2 flex items-center gap-1.5 text-slate-300">
              <FaBell size={12} className="cursor-pointer hover:text-white" />
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="bg-[#cbd5e1]/40 border-b border-[#cbd5e1]/60 px-5 py-2 select-none shrink-0">
          <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="hover:underline cursor-pointer text-[#0f3a9a]">Dashboard</span>
              <span className="text-[#94a3b8] font-normal">&gt;</span>
              <span className="hover:underline cursor-pointer text-[#0f3a9a]">Returns</span>
              {currentStep === "gstr1a_dashboard" && (
                <>
                  <span className="text-[#94a3b8] font-normal">&gt;</span>
                  <span className="text-[#475569]">GSTR-1A</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
              <FaGlobe size={12} className="text-slate-500" />
              <span>English</span>
            </div>
          </div>
        </div>

        {/* Main Body Area */}
        <div className="w-full flex-1 bg-white p-5 flex flex-col justify-between">
          
          {/* STEP 1: Select Period Form */}
          {currentStep === "select_period" && (
            <div className="space-y-6 flex-1 w-full text-[11px]">
              
              {/* File Returns Card */}
              <div className="bg-white border border-[#cbd5e1] rounded-none p-5 w-full shadow-none">
                <div className="border-b border-slate-200 pb-2.5 mb-2">
                  <h2 className="text-[#0a2558] font-bold text-[14px]">File Returns</h2>
                </div>
                
                <div className="bg-[#fcf8e3] border border-[#faebcc] p-3 text-[#8a6d3b] text-[10.5px] leading-relaxed mb-4">
                  GSTR-2A can now be downloaded in excel/CSV format for your reference and further use. Nil return for GSTR-3B & GSTR-1 can now be filed through SMS.
                </div>

                <div className="text-right text-[10px] text-red-500 font-semibold mb-4 pr-2">
                  <span className="text-red-500 font-bold">*</span> Indicates Mandatory Fields
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">Financial Year <span className="text-red-500">*</span></label>
                    <select
                      value={financialYear}
                      onChange={(e) => setFinancialYear(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    >
                      <option value="2024-25">2024-25</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">Quarter <span className="text-red-500">*</span></label>
                    <select
                      value={quarter}
                      onChange={(e) => setQuarter(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    >
                      <option value="Quarter 1 (Apr - Jun)">Quarter 1 (Apr - Jun)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">Period <span className="text-red-500">*</span></label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    >
                      <option value="select">select</option>
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
          )}

          {/* STEP 2: Returns Grid with Red-bordered PREPARE ONLINE for GSTR-1A */}
          {currentStep === "view_returns" && (
            <div className="space-y-6 flex-1 w-full text-[11px] animate-fadeIn">
              
              {/* Back Button */}
              <div>
                <button
                  onClick={() => setCurrentStep("select_period")}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold uppercase text-[10px]"
                >
                  <FaArrowLeft size={10} /> Back
                </button>
              </div>

              {/* Grid of returns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* GSTR1 */}
                <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Details of outward supplies of goods or services
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR1</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                    Due Date - Jul 11 20XX
                  </div>
                  <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                    <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 uppercase text-[9.5px]">
                      Prepare Online
                    </button>
                    <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 uppercase text-[9.5px]">
                      Prepare Offline
                    </button>
                  </div>
                </div>

                {/* GSTR-1A (RED BORDER ON PREPARE ONLINE) */}
                <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Amendment of outward supplies of goods or services for current tax period
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR-1A</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                    (Amendment Details)
                  </div>
                  <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                    <button
                      onClick={handlePrepareOnlineClick}
                      className="bg-white border-2 border-red-500 hover:bg-slate-50 text-slate-700 font-extrabold px-5 py-1.5 uppercase text-[9.5px] cursor-pointer"
                    >
                      Prepare Online
                    </button>
                  </div>
                </div>

                {/* GSTR2A */}
                <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Auto Drafted details (For view only)
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR2A</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                    (Auto Drafted)
                  </div>
                  <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                    <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
                      View
                    </button>
                    <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
                      Download
                    </button>
                  </div>
                </div>

                {/* GSTR2B */}
                <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Auto - drafted ITC Statement
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR2B</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                    (ITC Statement)
                  </div>
                  <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                    <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
                      View
                    </button>
                    <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
                      Download
                    </button>
                  </div>
                </div>

                {/* GSTR3B */}
                <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Monthly Return
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR3B</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                    Due Date - Jul 20 20XX
                  </div>
                  <div className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 justify-center">
                    <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 uppercase text-[9.5px]">
                      Prepare Online
                    </button>
                    <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 uppercase text-[9.5px]">
                      Prepare Offline
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* STEP 3: GSTR-1A Dashboard */}
          {currentStep === "gstr1a_dashboard" && (
            <div className="space-y-6 flex-1 w-full text-[11px] animate-fadeIn">
              
              {/* Heading */}
              <div className="bg-white border border-[#cbd5e1] p-4 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#0a2558] uppercase">
                  GSTR-1A - Amendment of outward supplies of goods or services for current tax period
                </h3>
                <div className="flex gap-2">
                  <button className="bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white text-[10px] px-3 py-1 font-bold uppercase">
                    Help
                  </button>
                  <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] px-3 py-1 font-bold uppercase">
                    Reset
                  </button>
                </div>
              </div>

              {/* Add Record Details Grid */}
              <div className="bg-white border border-[#cbd5e1] p-5">
                <h4 className="font-extrabold text-[#0a2558] mb-4 text-[12px] uppercase">
                  Add Record Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cards.map((card, idx) => (
                    <div
                      key={idx}
                      className="border border-[#cbd5e1] hover:border-slate-400 bg-white transition-all flex flex-col min-h-[120px] rounded overflow-hidden shadow-sm"
                    >
                      <div className="bg-[#1e3b6a] text-white p-3 flex justify-between items-start min-h-[60px]">
                        <span className="font-extrabold text-[10px] leading-snug max-w-[85%]">
                          {card.code}
                        </span>
                        <FaCheckCircle className="text-emerald-400 shrink-0 bg-white rounded-full p-[1px] mt-0.5" size={13} />
                      </div>
                      <div className="flex-1 p-3 flex items-center justify-center bg-slate-50/50">
                        <div className="text-xl font-black text-[#0a2558]">
                          {card.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Inner Portal Footer */}
          <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto shrink-0 font-sans">
            <span>© 2022 IICPA Simulation Software Designed & Developed by IICPA</span>
            <span>Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+, Firefox 45+ and Safari 6+</span>
          </div>

        </div>
      </div>
    </div>
  );
}
