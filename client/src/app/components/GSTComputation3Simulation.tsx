"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  Globe,
  ChevronDown,
  User,
  Bell,
  Play
} from "lucide-react";

export default function GSTComputation3Simulation() {
  const [selectedReason, setSelectedReason] = useState<string>("other");
  const [showLedgerTable, setShowLedgerTable] = useState<boolean>(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<boolean>(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isPaymentsDropdownOpen, setIsPaymentsDropdownOpen] = useState(false);
  const [isExperimentStarted, setIsExperimentStarted] = useState<boolean>(false);

  const handleViewLedgerBalance = () => {
    setShowLedgerTable(true);
    // Show success overlay after a short delay so user sees table open first
    setTimeout(() => {
      setShowSuccessOverlay(true);
    }, 850);
  };

  const handleRetry = () => {
    setShowSuccessOverlay(false);
    setShowLedgerTable(false);
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
            <Play fill="white" size={13} />
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

      {/* Simulation Container */}
      <div className="w-full flex-1 flex flex-col">
        
        {/* Top Data Strip */}
        <div className="bg-[#f8fafc] px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between text-xs font-bold text-slate-700 select-none shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-extrabold text-[#0a2558]">GST Computation</span>
            <div className="flex items-center gap-2 bg-slate-200 rounded-full px-3 py-1 font-semibold text-[11px] text-slate-600">
              <span className="w-20 bg-slate-300 h-2 rounded-full overflow-hidden relative block">
                <span className="absolute left-0 top-0 bottom-0 bg-blue-600 rounded-full" style={{ width: "87%" }}></span>
              </span>
              <span>87%</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span>Language</span>
              <select className="border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-700 outline-none text-[11px]">
                <option>English</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm font-extrabold text-[#0a2558]">
            Challan Creation
          </div>
          
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded px-2.5 py-1 text-[11px] font-black">
            <span className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-white text-[9px]">★</span>
            <span>1880</span>
          </div>
        </div>

        {/* GST Portal Container */}
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
                  <User size={10} />
                  <span>Fincurious Cements Private Limited</span>
                  <span className="text-slate-400 font-normal">/</span>
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
                    Services <ChevronDown size={12} />
                  </button>
                  {isServicesMenuOpen && (
                    <div className="absolute left-0 top-full bg-white text-slate-800 border border-slate-200 shadow-xl z-30 w-48 py-1 rounded-b font-semibold text-[11px] animate-fadeIn">
                      <div className="relative">
                        <button
                          onClick={() => setIsPaymentsDropdownOpen(!isPaymentsDropdownOpen)}
                          className="w-full px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-left font-bold cursor-pointer"
                        >
                          Payments <ChevronDown size={11} className="-rotate-90" />
                        </button>
                        {isPaymentsDropdownOpen && (
                          <div className="absolute left-full top-0 bg-white border border-slate-200 shadow-xl w-48 py-1 rounded font-semibold text-[11px]">
                            <button className="w-full px-4 py-2 hover:bg-slate-100 text-left font-bold text-[#0a2558]">
                              Create Challan
                            </button>
                            <button className="w-full px-4 py-2 hover:bg-slate-100 text-left font-bold text-slate-600">
                              Challan History
                            </button>
                          </div>
                        )}
                      </div>
                      <button className="w-full px-4 py-2 hover:bg-slate-100 text-left">User Services</button>
                      <button className="w-full px-4 py-2 hover:bg-slate-100 text-left">Refunds</button>
                    </div>
                  )}
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
                <Bell size={12} className="cursor-pointer hover:text-white" />
              </div>
            </div>
          </div>

          {/* Breadcrumbs and Language strip */}
          <div className="bg-[#cbd5e1]/40 border-b border-[#cbd5e1]/60 px-5 py-2 select-none shrink-0">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="hover:underline cursor-pointer text-[#0f3a9a]">Dashboard</span>
                <span className="text-[#94a3b8] font-normal">&gt;</span>
                <span className="hover:underline cursor-pointer text-[#0f3a9a]">Payment</span>
                <span className="text-[#94a3b8] font-normal">&gt;</span>
                <span className="text-[#475569]">Reason for challan</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
                <Globe size={12} className="text-slate-500" />
                <span>English</span>
              </div>
            </div>
          </div>

          {/* Main Body Area */}
          <div className="w-full flex-1 bg-white p-5 flex flex-col justify-between">
            <div className="space-y-6 flex-1 w-full text-[11px] relative">
              
              {/* Reason For Challan Box */}
              <div className="bg-white border border-[#cbd5e1] rounded-none p-5 w-full shadow-none min-h-[340px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
                    <h2 className="text-[#0a2558] font-bold text-[14px]">Reason For Challan</h2>
                    <button className="bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white px-3 py-1 text-[10px] font-bold rounded-none shadow-none uppercase tracking-wide">
                      HELP ?
                    </button>
                  </div>

                  <div className="text-right text-[10px] text-red-500 font-semibold mb-4 pr-2">
                    <span className="text-red-500 font-bold">*</span> indicates mandatory fields
                  </div>

                  {/* Centered Radio Options Box */}
                  <div className="flex justify-center items-center py-6">
                    <div className="flex items-start gap-4">
                      <span className="text-[11px] font-bold text-slate-700 pt-0.5 text-right shrink-0">
                        Reason For Challan <span className="text-red-500 font-bold">*</span> :
                      </span>
                      <div className="flex flex-col gap-3 font-semibold text-slate-700 text-[11px]">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                          <input
                            type="radio"
                            name="reason"
                            value="monthly"
                            checked={selectedReason === "monthly"}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="h-4 w-4 accent-[#0a2558] cursor-pointer"
                          />
                          Monthly payment for quarterly return
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 border-2 border-red-500 px-2.5 py-0.5">
                          <input
                            type="radio"
                            name="reason"
                            value="other"
                            checked={selectedReason === "other"}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="h-4 w-4 accent-[#0a2558] cursor-pointer"
                          />
                          Any other payment
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Balance Ledger Table */}
                {showLedgerTable && (
                  <div className="px-6 pb-6 w-full overflow-x-auto select-none mt-4 animate-fadeIn">
                    <table className="w-full text-left border-collapse text-[10px] border border-[#cbd5e1]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-[#cbd5e1] text-slate-700 font-extrabold">
                          <th rowSpan={2} className="p-2 border-r border-[#cbd5e1] font-bold text-slate-700 text-left align-middle w-[220px]">Type of Ledger</th>
                          <th colSpan={5} className="p-1 border-b border-[#cbd5e1] text-center font-bold">Available Balance (₹)</th>
                        </tr>
                        <tr className="bg-slate-100 border-b border-[#cbd5e1] text-slate-700 font-extrabold text-right">
                          <th className="p-2 border-r border-[#cbd5e1]">Integrated Tax (₹)</th>
                          <th className="p-2 border-r border-[#cbd5e1]">Central Tax (₹)</th>
                          <th className="p-2 border-r border-[#cbd5e1]">State Tax (₹)</th>
                          <th className="p-2 border-r border-[#cbd5e1]">CESS (₹)</th>
                          <th className="p-2">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10.5px] text-slate-700 font-semibold">
                        <tr className="border-b border-[#cbd5e1]">
                          <td className="p-2.5 border-r border-[#cbd5e1] bg-slate-50/50 font-bold">Electronic Cash Ledger</td>
                          <td className="p-2.5 border-r border-[#cbd5e1] text-right">35322</td>
                          <td className="p-2.5 border-r border-[#cbd5e1] text-right">35335</td>
                          <td className="p-2.5 border-r border-[#cbd5e1] text-right">22935</td>
                          <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                          <td className="p-2.5 text-right text-blue-600 underline cursor-pointer font-bold">93592</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 border-r border-[#cbd5e1] bg-slate-50/50 font-bold">Electronic Credit Ledger</td>
                          <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                          <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                          <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                          <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                          <td className="p-2.5 text-right text-slate-600 font-bold">0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={handleViewLedgerBalance}
                    className="bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white px-4 py-2 font-bold text-[10px] rounded-none shadow-none transition-colors uppercase border-2 border-red-500 cursor-pointer"
                  >
                    VIEW LEDGER BALANCE ▼
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      className="bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white px-6 py-2 font-bold uppercase transition-all shadow-sm border-2 border-red-500 cursor-pointer"
                    >
                      PROCEED
                    </button>
                    <button
                      onClick={handleRetry}
                      className="bg-[#cbd5e1] hover:bg-slate-300 text-slate-700 px-6 py-2 font-bold uppercase transition-all shadow-sm cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>

              </div>

              {/* Note Section */}
              <div className="bg-[#f8fafc] border border-slate-200 p-4 font-semibold text-[10px] text-slate-600 leading-relaxed rounded space-y-2">
                <p className="font-bold text-slate-800 text-[11px] mb-1">Note: For taxpayer filing GSTR-3B on quarterly basis:</p>
                <p>1. To make payment for the first (M1) and second (M2) months of the quarter, please select reason as 'Monthly Payment for Quarterly Return' and the relevant period (financial year, month) and choose whether to pay through 35% challan or self-assessment challan.</p>
                <p>2. To make payment for the third month of the quarter (M3), please use 'Create Challan' option in payment Table-6 of Form GSTR-3B Quarterly. An auto-populated challan amounting to liabilities for the quarter net of credit utilization and existing cash balance can be generated and used to offset liabilities.</p>
                <p>
                  <span className="text-blue-600 underline cursor-pointer">Click here</span> for navigation to 'Return Dashboard' and prepare GSTR-3B Quarterly. Filing of GSTR-3B Quarterly available in the third month of the quarter is mandatory.
                </p>
                <p>*For adding cash to Electronic Cash Ledger, already established procedure may be followed.</p>
              </div>

            </div>

            {/* Inner Portal Footer */}
            <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 shrink-0 font-sans">
              <span>© 2022 Fincurious Simulation Software Designed & Developed by Fincurious</span>
              <span>Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+, Firefox 45+ and Safari 6+</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
