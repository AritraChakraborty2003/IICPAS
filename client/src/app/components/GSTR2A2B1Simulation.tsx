"use client";

import React, { useState } from "react";
import {
  FaArrowLeft,
  FaUser,
  FaBell,
  FaGlobe,
  FaChevronDown,
  FaInfoCircle,
  FaChevronUp,
  FaChevronRight,
  FaDownload
} from "react-icons/fa";
import { CheckCircle2, RotateCcw } from "lucide-react";

type Step = "select_period" | "view_returns" | "gstr2b_statement" | "gstr2b_all_tables";

interface GSTR2A2B1SimulationProps {
  onComplete?: () => void;
}

export default function GSTR2A2B1Simulation({
  onComplete,
}: GSTR2A2B1SimulationProps = {}) {
  const [currentStep, setCurrentStep] = useState<Step>("select_period");
  const [financialYear, setFinancialYear] = useState("2024-25");
  const [quarter, setQuarter] = useState("Quarter 1 (Apr - Jun)");
  const [period, setPeriod] = useState("select");
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  React.useEffect(() => {
    if (currentStep === "gstr2b_all_tables") {
      const timer = setTimeout(() => {
        setShowSuccessOverlay(true);
        onComplete?.();
      }, 850);
      return () => clearTimeout(timer);
    } else {
      setShowSuccessOverlay(false);
    }
  }, [currentStep]);

  const handleRetry = () => {
    setCurrentStep("select_period");
    setPeriod("select");
    setShowSuccessOverlay(false);
  };

  const handleSearchClick = () => {
    if (period === "June") {
      setCurrentStep("view_returns");
    }
  };

  const handleViewGstr2bClick = () => {
    setCurrentStep("gstr2b_statement");
  };

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

      {/* SUCCESS OVERLAY */}
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

      {/* Portal Container */}
      <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col relative">
        
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
                Downloads <FaChevronDown size={10} className="inline ml-1" />
              </button>
              <button className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide">
                Search Taxpayer <FaChevronDown size={10} className="inline ml-1" />
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
              {currentStep === "gstr2b_statement" && (
                <>
                  <span className="text-[#94a3b8] font-normal">&gt;</span>
                  <span className="text-[#475569]">GSTR-2B</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
              <FaGlobe size={12} className="text-slate-500" />
              <span>English</span>
            </div>
          </div>
        </div>

        {/* Main Body Area Inside Portal */}
        <div className="w-full flex-1 bg-white p-5 flex flex-col justify-between">
          
          {/* STEP 1: Select Period Form */}
          {currentStep === "select_period" && (
            <div className="space-y-6 flex-1 w-full text-[11px]">
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
                      <option value="2024-25">20XX-XX</option>
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
                      className={`w-full py-1.5 text-[11.5px] uppercase font-bold transition-all ${
                        period === "June"
                          ? "bg-[#1e3b6a] text-white hover:bg-[#152a4e] border-[1.5px] border-red-600 cursor-pointer"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-300"
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

          {/* STEP 2: Returns Grid with Red-bordered VIEW for GSTR-2B */}
          {currentStep === "view_returns" && (
            <div className="space-y-6 flex-1 w-full text-[11px] animate-fadeIn p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
                
                {/* GSTR1 */}
                <div className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Details of outward supplies of goods or services
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR1</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-[#0a2558]">
                    Due Date - Jul 11 20XX
                  </div>
                  <div className="p-3 bg-white flex gap-2 justify-center">
                    <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-3 py-1.5 uppercase text-[9.5px] shadow-sm">
                      Prepare Online
                    </button>
                    <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-3 py-1.5 uppercase text-[9.5px] shadow-sm">
                      Prepare Offline
                    </button>
                  </div>
                </div>

                {/* GSTR2A */}
                <div className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Auto Drafted details (For view only)
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR2A</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                    
                  </div>
                  <div className="p-3 bg-white flex gap-2 justify-center">
                    <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-5 py-1.5 uppercase text-[9.5px] shadow-sm">
                      View
                    </button>
                    <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-3 py-1.5 uppercase text-[9.5px] shadow-sm">
                      Download
                    </button>
                  </div>
                </div>

                {/* GSTR2B (RED BORDER ON VIEW) */}
                <div className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Auto - drafted ITC Statement
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR2B</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-slate-500">
                    
                  </div>
                  <div className="p-3 bg-white flex gap-2 justify-center">
                    <button 
                      onClick={handleViewGstr2bClick}
                      className="bg-[#1e3b6a] border-[1.5px] border-red-500 hover:bg-[#152a4e] text-white font-extrabold px-5 py-1.5 uppercase text-[9.5px] shadow-sm cursor-pointer"
                    >
                      View
                    </button>
                    <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-3 py-1.5 uppercase text-[9.5px] shadow-sm">
                      Download
                    </button>
                  </div>
                </div>

                {/* GSTR3B */}
                <div className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[11px] text-center">
                    Monthly Return
                    <div className="text-[9.5px] font-medium text-slate-300 mt-1">GSTR3B</div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center flex-1 text-center font-bold text-[#0a2558]">
                    Due Date - Jul 20 20XX
                  </div>
                  <div className="p-3 bg-white flex gap-2 justify-center">
                    <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-3 py-1.5 uppercase text-[9.5px] shadow-sm">
                      Prepare Online
                    </button>
                    <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-3 py-1.5 uppercase text-[9.5px] shadow-sm">
                      Prepare Offline
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: GSTR-2B ITC Statement */}
          {currentStep === "gstr2b_statement" && (
            <div className="space-y-4 flex-1 w-full text-[10.5px] animate-fadeIn p-2">
              
              {/* Header Box */}
              <div className="border border-slate-200 bg-white">
                <div className="bg-[#15b7b9] text-white font-extrabold p-2.5 px-4 flex justify-between items-center text-xs">
                  <span>GSTR-2B- AUTO-DRAFTED ITC STATEMENT</span>
                  <FaChevronUp size={12} />
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 text-slate-700 bg-slate-50/50">
                  <div className="space-y-1 font-bold">
                    <p>GSTIN - 07GDLCF7228G1YK</p>
                    <p>Financial Year - 2024-25</p>
                  </div>
                  <div className="space-y-1 font-bold text-center">
                    <p>IICPA Private Limited</p>
                    <p>Return Period - June</p>
                  </div>
                  <div className="space-y-1 font-bold text-right">
                    <p>IICPA Private Limited</p>
                    <p>Generation date - June</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between border-b-2 border-slate-200 mt-4">
                <div className="flex gap-6 px-4">
                  <button className="pb-2 font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wide">
                    Summary
                  </button>
                  <button 
                    onClick={() => setCurrentStep("gstr2b_all_tables")}
                    className="pb-2 font-bold text-[#0c5f86] border-b-[2.5px] border-red-500 uppercase tracking-wide cursor-pointer"
                  >
                    All Tables
                  </button>
                </div>
                <div className="px-4 pb-2">
                  <span className="text-[#0c5f86] font-bold cursor-pointer hover:underline">View Advisory</span>
                </div>
              </div>

              {/* Sub-tabs and Help */}
              <div className="flex justify-between items-center mt-3">
                <div className="flex rounded border border-[#0c5f86] overflow-hidden bg-white">
                  <button className="bg-[#0c5f86] text-white px-5 py-1.5 font-bold text-[10.5px]">
                    ITC available
                  </button>
                  <button className="text-[#0c5f86] px-5 py-1.5 font-bold hover:bg-slate-50 text-[10.5px]">
                    ITC not available
                  </button>
                </div>
                <button className="bg-[#1e3b6a] text-white px-3 py-1 font-bold flex items-center gap-1.5 text-[10px] rounded">
                  HELP <FaInfoCircle size={10} />
                </button>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded mt-3 overflow-hidden bg-white">
                <table className="w-full text-left text-[10.5px]">
                  <thead className="bg-[#e2f1f8] text-[#0a2558]">
                    <tr>
                      <th className="p-2.5 font-extrabold w-12 text-center border-b border-slate-200">S.NO.</th>
                      <th className="p-2.5 font-extrabold border-b border-slate-200">Heading <span className="text-[#0c5f86] cursor-pointer ml-1">[Expand All <FaChevronDown className="inline w-2 h-2"/>]</span></th>
                      <th className="p-2.5 font-extrabold text-center border-b border-slate-200">GSTR-3B table</th>
                      <th className="p-2.5 font-extrabold text-right border-b border-slate-200">Integrated<br/>Tax (₹)</th>
                      <th className="p-2.5 font-extrabold text-right border-b border-slate-200">Central<br/>Tax (₹)</th>
                      <th className="p-2.5 font-extrabold text-right border-b border-slate-200">State/UT<br/>Tax (₹)</th>
                      <th className="p-2.5 font-extrabold text-right border-b border-slate-200">Cess (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {/* Part A Header */}
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td className="p-2 font-bold text-center">Part A</td>
                      <td colSpan={6} className="p-2 font-bold">ITC Available - Credit may be claimed in relevant headings in GSTR-3B</td>
                    </tr>
                    
                    {/* Part A Rows */}
                    <tr className="border-b border-slate-100 bg-white">
                      <td className="p-2 text-center font-semibold">I</td>
                      <td className="p-2 font-semibold">All other ITC - Supplies from registered persons <FaChevronUp className="inline ml-1 w-2 h-2"/></td>
                      <td className="p-2 text-center font-bold">4(A)(5) <FaInfoCircle className="inline text-slate-400 w-2.5 h-2.5"/></td>
                      <td className="p-2 text-right">₹ NaN</td>
                      <td className="p-2 text-right">₹ NaN</td>
                      <td className="p-2 text-right">₹ NaN</td>
                      <td className="p-2 text-right">0.00</td>
                    </tr>
                    
                    {/* Expanded sub-rows */}
                    <tr className="border-b border-slate-100 bg-white text-[#0c5f86]">
                      <td className="p-1.5"></td>
                      <td className="p-1.5 pl-8 font-semibold hover:underline cursor-pointer">B2B - Invoices</td>
                      <td className="p-1.5 text-center"></td>
                      <td className="p-1.5 text-right text-slate-800">₹ NaN</td>
                      <td className="p-1.5 text-right text-slate-800">₹ NaN</td>
                      <td className="p-1.5 text-right text-slate-800">₹ NaN</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-white text-[#0c5f86]">
                      <td className="p-1.5"></td>
                      <td className="p-1.5 pl-8 font-semibold hover:underline cursor-pointer">B2B - Debit notes</td>
                      <td className="p-1.5 text-center"></td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-white text-[#0c5f86]">
                      <td className="p-1.5"></td>
                      <td className="p-1.5 pl-8 font-semibold hover:underline cursor-pointer">B2B - Invoices (Amendment)</td>
                      <td className="p-1.5 text-center"></td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-white text-[#0c5f86]">
                      <td className="p-1.5"></td>
                      <td className="p-1.5 pl-8 font-semibold hover:underline cursor-pointer">B2B - Debit notes (Amendment)</td>
                      <td className="p-1.5 text-center"></td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                      <td className="p-1.5 text-right text-slate-800">0.00</td>
                    </tr>

                    {/* Other Part A sections collapsed */}
                    <tr className="border-b border-slate-100 bg-white">
                      <td className="p-2 text-center font-semibold">II</td>
                      <td className="p-2 font-semibold">Inward Supplies from ISD <FaChevronDown className="inline ml-1 w-2 h-2 text-slate-400"/></td>
                      <td className="p-2 text-center font-bold">4(A)(4) <FaInfoCircle className="inline text-slate-400 w-2.5 h-2.5"/></td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-white">
                      <td className="p-2 text-center font-semibold">III</td>
                      <td className="p-2 font-semibold">Inward Supplies liable for reverse charge <FaChevronDown className="inline ml-1 w-2 h-2 text-slate-400"/></td>
                      <td className="p-2 text-center font-bold">3.1(d)<br/>4(A)(3) <FaInfoCircle className="inline text-slate-400 w-2.5 h-2.5"/></td>
                      <td className="p-2 text-right align-top">0.00</td>
                      <td className="p-2 text-right align-top">0.00</td>
                      <td className="p-2 text-right align-top">0.00</td>
                      <td className="p-2 text-right align-top">0.00</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-white">
                      <td className="p-2 text-center font-semibold">IV</td>
                      <td className="p-2 font-semibold">Import of Goods <FaChevronDown className="inline ml-1 w-2 h-2 text-slate-400"/></td>
                      <td className="p-2 text-center font-bold">4(A)(1) <FaInfoCircle className="inline text-slate-400 w-2.5 h-2.5"/></td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                    </tr>

                    {/* Part B Header */}
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td className="p-2 font-bold text-center">Part B</td>
                      <td colSpan={6} className="p-2 font-bold">ITC Reversal - Credit may be reversed in relevant headings in GSTR-3B</td>
                    </tr>

                    <tr className="border-b border-slate-200 bg-white">
                      <td className="p-2 text-center font-semibold">I</td>
                      <td className="p-2 font-semibold">Others <FaChevronDown className="inline ml-1 w-2 h-2 text-slate-400"/></td>
                      <td className="p-2 text-center font-bold">4(B)(2) <FaInfoCircle className="inline text-slate-400 w-2.5 h-2.5"/></td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                      <td className="p-2 text-right">0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 mt-8 mb-4">
                <button 
                  onClick={() => setCurrentStep("view_returns")}
                  className="bg-white border border-[#1e3b6a] text-[#1e3b6a] hover:bg-slate-50 font-extrabold px-6 py-2 uppercase text-[10px] rounded-sm transition-colors"
                >
                  Back to Dashboard
                </button>
                <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-6 py-2 uppercase text-[10px] rounded-sm transition-colors shadow-sm">
                  Download GSTR-2B Summary (PDF)
                </button>
                <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white font-extrabold px-6 py-2 uppercase text-[10px] rounded-sm transition-colors shadow-sm">
                  Download GSTR-2B Details (Excel)
                </button>
              </div>

            </div>
          )}

          {/* STEP 4: GSTR-2B All Tables */}
          {currentStep === "gstr2b_all_tables" && (
            <div className="space-y-4 flex-1 w-full text-[10.5px] animate-fadeIn p-2">
              
              {/* Header Box */}
              <div className="border border-slate-200 bg-white">
                <div className="bg-[#15b7b9] text-white font-extrabold p-2.5 px-4 flex justify-between items-center text-xs">
                  <span>GSTR-2B- AUTO-DRAFTED ITC STATEMENT</span>
                  <FaChevronUp size={12} />
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 text-slate-700 bg-slate-50/50">
                  <div className="space-y-1 font-bold">
                    <p>GSTIN- 07GDLCF7228G1YK</p>
                    <p>Financial Year - 2024-25</p>
                  </div>
                  <div className="space-y-1 font-bold text-center">
                    <p>IICPA Private Limited</p>
                    <p>Return Period - June</p>
                  </div>
                  <div className="space-y-1 font-bold text-right">
                    <p>IICPA Private Limited</p>
                    <p>Generation date - June</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between border-b-2 border-slate-200 mt-4">
                <div className="flex gap-6 px-4">
                  <button className="pb-2 font-bold text-[#0c5f86] uppercase tracking-wide cursor-pointer">
                    Summary
                  </button>
                  <button className="pb-2 font-bold text-[#0c5f86] border-b-[2.5px] border-[#0c5f86] uppercase tracking-wide">
                    All Tables
                  </button>
                </div>
                <div className="px-4 pb-2">
                  <span className="text-[#0c5f86] font-bold cursor-pointer hover:underline">View Advisory</span>
                </div>
              </div>

              {/* Sub-tabs and Help */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-4 px-2">
                  <span className="text-[#0c5f86] font-bold cursor-pointer hover:underline">Supplier wise Details</span>
                  <span className="bg-[#1e3b6a] text-white px-3 py-1 font-bold rounded-sm">Document Details</span>
                </div>
                <div className="px-2">
                  <span className="text-[#0c5f86] font-bold flex items-center gap-1 cursor-pointer hover:underline">Download Excel <FaDownload size={10} /></span>
                </div>
              </div>

              {/* Filter and Title */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="bg-slate-200 rounded px-3 py-1 flex items-center gap-2">
                  <span className="font-bold text-slate-800">Select table to view details</span>
                  <FaChevronDown size={10} className="text-slate-600" />
                </div>
                <div className="font-extrabold text-[#333333] text-[12px]">
                  Taxable inward supplies received from registered person - B2B
                </div>
                <div>
                  <button className="bg-white border border-slate-400 text-slate-800 px-3 py-1 font-bold flex items-center gap-1.5 text-[10px] rounded shadow-sm">
                    HELP <FaInfoCircle size={10} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded mt-4 overflow-hidden bg-white">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-[#f1f5f9] text-[#333333]">
                    <tr>
                      <th className="p-2.5 font-extrabold border-b border-slate-200 text-center">S.NO.</th>
                      <th className="p-2.5 font-extrabold border-b border-slate-200">GSTIN of supplier <FaChevronUp className="inline w-2 h-2 text-slate-400"/></th>
                      <th className="p-2.5 font-extrabold border-b border-slate-200">Trade/legal<br/>name <FaChevronUp className="inline w-2 h-2 text-slate-400"/></th>
                      <th className="p-2.5 font-extrabold border-b border-slate-200">Invoice number <FaChevronUp className="inline w-2 h-2 text-slate-400"/></th>
                      <th className="p-2.5 font-extrabold border-b border-slate-200">Invoice type <FaChevronUp className="inline w-2 h-2 text-slate-400"/></th>
                      <th className="p-2.5 font-extrabold border-b border-slate-200">Invoice<br/>Date <FaChevronUp className="inline w-2 h-2 text-slate-400"/></th>
                      <th className="p-2.5 font-extrabold border-b border-slate-200 text-right">Invoice<br/>Value (₹) <FaChevronUp className="inline w-2 h-2 text-slate-400"/></th>
                      <th className="p-2.5 font-extrabold border-b border-slate-200">Place of<br/>supply <FaChevronUp className="inline w-2 h-2 text-slate-400"/></th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 font-semibold">
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2.5 text-center">1</td>
                      <td className="p-2.5">07HSDCM8272H2YC</td>
                      <td className="p-2.5">Metro Supplier Private Limited</td>
                      <td className="p-2.5 text-[#0c5f86] cursor-pointer">ME...8922 <FaChevronDown className="inline w-2 h-2 ml-1"/></td>
                      <td className="p-2.5">Regular</td>
                      <td className="p-2.5">1st June</td>
                      <td className="p-2.5 text-right">1888000</td>
                      <td className="p-2.5">Karnataka</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2.5 text-center">1</td>
                      <td className="p-2.5">07LNSFA2282M1ZK</td>
                      <td className="p-2.5">Ambu Cements</td>
                      <td className="p-2.5 text-[#0c5f86] cursor-pointer">AC289/AA/11 <FaChevronDown className="inline w-2 h-2 ml-1"/></td>
                      <td className="p-2.5">Regular</td>
                      <td className="p-2.5">15th June</td>
                      <td className="p-2.5 text-right">2816000</td>
                      <td className="p-2.5">Karnataka</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2.5 text-center">1</td>
                      <td className="p-2.5">29PDSFB2910N2YC</td>
                      <td className="p-2.5">Bangalore Steel Company</td>
                      <td className="p-2.5 text-[#0c5f86] cursor-pointer">BSC/22281 <FaChevronDown className="inline w-2 h-2 ml-1"/></td>
                      <td className="p-2.5">Regular</td>
                      <td className="p-2.5">25th June</td>
                      <td className="p-2.5 text-right">1593000</td>
                      <td className="p-2.5">Karnataka</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end mt-4 px-2">
                <button 
                  onClick={() => setCurrentStep("view_returns")}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-1.5 font-bold rounded-sm shadow-sm"
                >
                  Back
                </button>
              </div>

            </div>
          )}

          {/* Large Inner Portal Footer */}
          <div className="bg-[#1e3b6a] text-white/80 w-full mt-auto shrink-0 font-sans relative">
            {/* Scroll to top button */}
            <div className="absolute right-6 -top-3 bg-[#0a2558] rounded p-1.5 cursor-pointer shadow-md">
              <FaChevronUp size={12} className="text-white" />
            </div>

            <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-6 gap-6 text-[10px] leading-relaxed">
              {/* Col 1 */}
              <div>
                <h3 className="text-[#38bdf8] font-bold text-[11px] mb-3">About GST</h3>
                <ul className="space-y-2 font-medium">
                  <li className="hover:text-white cursor-pointer transition-colors">GST Council Structure</li>
                  <li className="hover:text-white cursor-pointer transition-colors">GST History</li>
                </ul>
              </div>

              {/* Col 2 */}
              <div>
                <h3 className="text-[#38bdf8] font-bold text-[11px] mb-3">Website Policies</h3>
                <ul className="space-y-2 font-medium">
                  <li className="hover:text-white cursor-pointer transition-colors">Website Policy</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Terms and Conditions</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Hyperlink Policy</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Disclaimer</li>
                </ul>
              </div>

              {/* Col 3 */}
              <div>
                <h3 className="text-[#38bdf8] font-bold text-[11px] mb-3">Related Sites</h3>
                <ul className="space-y-2 font-medium">
                  <li className="hover:text-white cursor-pointer transition-colors">Central Board of Indirect Taxes and Customs</li>
                  <li className="hover:text-white cursor-pointer transition-colors">State Tax Websites</li>
                  <li className="hover:text-white cursor-pointer transition-colors">National Portal</li>
                </ul>
              </div>

              {/* Col 4 (No Header) */}
              <div className="pt-7">
                <ul className="space-y-2 font-medium">
                  <li className="hover:text-white cursor-pointer transition-colors">System Requirements</li>
                  <li className="hover:text-white cursor-pointer transition-colors">User Manuals, Videos</li>
                  <li className="hover:text-white cursor-pointer transition-colors">GST Media</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Site Map</li>
                </ul>
              </div>

              {/* Col 5 */}
              <div>
                <h3 className="text-[#38bdf8] font-bold text-[11px] mb-3">Important Links</h3>
                <ul className="space-y-2 font-medium">
                  <li className="hover:text-white cursor-pointer transition-colors">Laws, Rules & Rates</li>
                </ul>
              </div>

              {/* Col 6 */}
              <div>
                <h3 className="text-[#38bdf8] font-bold text-[11px] mb-3">Contact Us</h3>
                <div className="space-y-3 font-medium">
                  <div>
                    <p className="text-white/60">Help Desk Number:</p>
                    <p>0120-4888999</p>
                  </div>
                  <div>
                    <p className="text-white/60">Log/Track Your Issue:</p>
                    <p className="hover:text-white cursor-pointer transition-colors">Grievance Redressal Portal for GST</p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 cursor-pointer">f</div>
                    <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 cursor-pointer">y</div>
                    <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 cursor-pointer">t</div>
                    <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 cursor-pointer">in</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright Strip */}
            <div className="border-t border-white/10 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between text-[10px] text-white/70 font-medium">
              <span>© 2022-23 IICPA Simulation Software</span>
              <span>Designed & Developed by IICPA Private Limited</span>
            </div>

            {/* Browser Support Strip */}
            <div className="bg-[#152a4e] px-8 py-3.5 text-[9.5px] text-white/60 font-medium w-full">
              Site best viewed at 1024 x 768 resolution in Internet Explorer 10+, Google Chrome 49+, Firefox 45+ and Safari 6+
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
