"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  Globe,
  ChevronDown,
  User,
  Bell,
  Play,
  Info
} from "lucide-react";

type Step = "dashboard_overlay" | "dashboard_active" | "reason_for_challan";

export default function GSTComputation3Simulation() {
  const [currentStep, setCurrentStep] = useState<Step>("dashboard_overlay");
  const [selectedReason, setSelectedReason] = useState<string>("other");
  const [showLedgerTable, setShowLedgerTable] = useState<boolean>(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<boolean>(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isPaymentsDropdownOpen, setIsPaymentsDropdownOpen] = useState(false);

  const handleCreateChallanNav = () => {
    setCurrentStep("reason_for_challan");
    setIsPaymentsDropdownOpen(false);
    setIsServicesMenuOpen(false);
  };

  const handleGoToDashboard = () => {
    setCurrentStep("dashboard_active");
    setShowLedgerTable(false);
    setShowSuccessOverlay(false);
  };

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
      {currentStep === "dashboard_overlay" && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1.5px] z-40 flex items-center justify-center">
          <button
            onClick={() => setCurrentStep("dashboard_active")}
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
                  <span>IICPA Private Limited</span>
                  <span className="text-slate-400 font-normal">/</span>
                  <span className="text-emerald-400">07GDLCF7228G1YK</span>
                </div>
              </div>
            </div>

            {/* GST Main Navigation Menu */}
            <div className="bg-[#1e3b6a] px-4 text-xs font-bold flex flex-wrap items-center justify-between relative shadow-md">
              <div className="flex flex-wrap items-center">
                <button
                  onClick={handleGoToDashboard}
                  className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setIsServicesMenuOpen(!isServicesMenuOpen)}
                  className={`px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 flex items-center gap-1 uppercase tracking-wide cursor-pointer ${
                    isServicesMenuOpen ? "bg-[#152a4e]" : ""
                  }`}
                >
                  Services <ChevronDown size={12} />
                </button>
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

            {/* Services Sub-Navigation Menu Bar */}
            {isServicesMenuOpen && (
              <div className="relative z-[9999] flex select-none items-center gap-6 border-b border-[#cbd5e1] bg-[#f1f3f7] px-5 py-2 text-[11px] font-bold text-[#0a2558]">
                <span className="cursor-pointer hover:text-blue-700">Registration</span>
                <span className="cursor-pointer hover:text-blue-700">Ledgers</span>
                <span className="cursor-pointer hover:text-blue-700">Returns</span>

                <button
                  onClick={() => setIsPaymentsDropdownOpen(!isPaymentsDropdownOpen)}
                  className="flex cursor-pointer items-center gap-1 border-2 border-red-500 bg-white px-2.5 py-0.5 font-bold text-[#0a2558] hover:bg-slate-50"
                >
                  Payments
                </button>

                <span className="cursor-pointer hover:text-blue-700">User Services</span>
                <span className="cursor-pointer hover:text-blue-700">Refunds</span>
                <span className="cursor-pointer hover:text-blue-700">e-Way Bill System</span>
                <span className="cursor-pointer hover:text-blue-700">Track Application Status</span>

                {isPaymentsDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-[99999] mt-2 w-full grid grid-cols-2 gap-x-12 gap-y-3 border-y border-slate-300 bg-white p-5 pl-[220px] pr-24 text-[11px] font-bold shadow-lg">
                    <div className="flex flex-col gap-3 text-left">
                      <button
                        onClick={handleCreateChallanNav}
                        className="w-fit cursor-pointer border-2 border-red-500 bg-white px-3 py-1.5 text-left font-bold text-blue-900 hover:bg-slate-50"
                      >
                        Create Challan
                      </button>
                      <button className="w-fit cursor-not-allowed text-left text-blue-900 opacity-80" disabled>
                        Challan History
                      </button>
                      <button className="w-fit cursor-not-allowed text-left text-blue-900 opacity-80" disabled>
                        Instalment Calendar
                      </button>
                    </div>
                    <div className="flex flex-col justify-start gap-3 pt-1.5 text-left">
                      <button className="w-fit cursor-not-allowed text-left text-blue-900 opacity-80" disabled>
                        Saved Challans
                      </button>
                      <button className="w-fit cursor-not-allowed text-left text-blue-900 opacity-80" disabled>
                        Application for Deferred Payment/Payment in Instalments
                      </button>
                      <button className="w-fit cursor-not-allowed text-left text-blue-900 opacity-80" disabled>
                        Grievance against Payment(GST PMT-07)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Breadcrumbs and Language strip */}
          <div className="bg-[#cbd5e1]/40 border-b border-[#cbd5e1]/60 px-5 py-2 select-none shrink-0">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="hover:underline cursor-pointer text-[#0f3a9a]" onClick={handleGoToDashboard}>Dashboard</span>
                {currentStep === "reason_for_challan" && (
                  <>
                    <span className="text-[#94a3b8] font-normal">&gt;</span>
                    <span className="hover:underline cursor-pointer text-[#0f3a9a]">Payment</span>
                    <span className="text-[#94a3b8] font-normal">&gt;</span>
                    <span className="text-[#475569]">Reason for challan</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
                <Globe size={12} className="text-slate-500" />
                <span>English</span>
              </div>
            </div>
          </div>

          {/* Main Body Area */}
          <div className="w-full flex-1 bg-white p-5 flex flex-col justify-between">
            {currentStep !== "reason_for_challan" ? (
              <div className="flex flex-1 flex-col w-full text-[11px]">
                {/* Top Info Bar (Last logged in & IP) */}
                <div className="flex items-center justify-between px-1 py-2 text-[11px] text-[#333] w-full">
                  <span>Last logged in on <strong>19/05/2026 08:26</strong></span>
                  <span>Currently logged in from IP: <strong>223.233.68.198</strong></span>
                </div>

                {/* Dashboard Flex Layout */}
                <div className="flex flex-col lg:flex-row gap-6 mt-4 pb-4 mx-auto w-full max-w-[1200px]">

                  {/* Left Panel */}
                  <div className="flex-1 flex flex-col items-center">
                    <h2 className="text-[15px] font-medium text-[#1e3a8a] text-center w-full">
                      Welcome IICPA Private Limited to GST Common Portal
                    </h2>

                    <p className="font-bold text-[#333] text-[11px] text-center mt-3 mb-5">
                      Return filing preference (Apr-Jun 2026) : Monthly (
                      <span className="text-[#1e3a8a] cursor-pointer hover:underline font-normal">Change</span>)
                    </p>

                    <h3 className="text-[13px] font-bold text-[#333] text-center mb-3">
                      Returns Calendar (Last 5 return periods)
                    </h3>

                    <div className="border border-[#1e3b6a] max-w-[700px] w-full mb-6">
                      <table className="w-full text-center border-collapse text-[11px] font-bold table-fixed">
                        <tbody>
                          <tr className="border-b border-white h-[70px]">
                            <td className="bg-[#1e3b6a] text-white border-r border-white w-[110px] px-2 align-middle">GSTR-1 / IFF</td>
                            <td className="bg-[#34b484] text-white border-r border-white px-2 align-middle">Feb - 2026<br /><span className="font-normal text-[10px]">Filed</span></td>
                            <td className="bg-[#34b484] text-white border-r border-white px-2 align-middle">Mar - 2026<br /><span className="font-normal text-[10px]">Filed</span></td>
                            <td className="bg-[#34b484] text-white border-r border-white px-2 align-middle">Apr - 2026<br /><span className="font-normal text-[10px]">Filed</span></td>
                            <td className="bg-[#34b484] text-white border-r border-white px-2 align-middle">May - 2026<br /><span className="font-normal text-[10px]">Filed</span></td>
                            <td className="bg-amber-500 text-white px-2 align-middle">Jun - 2026<br /><span className="font-normal text-[10px]">To be Filed</span></td>
                          </tr>
                          <tr className="h-[70px]">
                            <td className="bg-[#1e3b6a] text-white border-r border-white px-2 align-middle">GSTR-3B</td>
                            <td className="bg-[#34b484] text-white border-r border-white px-2 align-middle">Feb - 2026<br /><span className="font-normal text-[10px]">Filed</span></td>
                            <td className="bg-[#34b484] text-white border-r border-white px-2 align-middle">Mar - 2026<br /><span className="font-normal text-[10px]">Filed</span></td>
                            <td className="bg-[#34b484] text-white border-r border-white px-2 align-middle">Apr - 2026<br /><span className="font-normal text-[10px]">Filed</span></td>
                            <td className="bg-[#34b484] text-white border-r border-white px-2 align-middle">May - 2026<br /><span className="font-normal text-[10px]">Filed</span></td>
                            <td className="bg-amber-500 text-white px-2 align-middle">Jun - 2026<br /><span className="font-normal text-[10px]">To be Filed</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Navigation Note */}
                    <div className="border border-[#777] py-1.5 px-6 text-[11px] text-slate-800 bg-white italic text-center w-full max-w-[500px] mb-6">
                      You can navigate to your chosen page through navigation panel given below
                    </div>

                    {/* Warning Alert Box */}
                    <div className="border border-[#777] p-3.5 bg-white text-[11px] text-slate-800 flex items-start gap-2 max-w-[650px] font-bold italic mb-6 shadow-sm">
                      <p className="leading-relaxed text-left w-full relative pl-1 pr-4">
                        A facility is provided to you to Geocode the existing business addresses
                        saved in GST system. Kindly click on Continue to update the Geocoded
                        Addresses. Please note that the existing addresses appearing in the GST
                        system/Registration Certificate will not be impacted.
                        <span className="text-[#1e3a8a] font-bold ml-1 hover:underline cursor-pointer not-italic inline-flex items-center">
                          Continue
                          <span className="flex items-center justify-center border border-[#1e3a8a] rounded-full w-3 h-3 ml-1">
                            <Info size={9} className="text-[#1e3a8a]" />
                          </span>
                        </span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-2">
                      <button className="px-5 py-2.5 bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-between gap-3 min-w-[190px]">
                        RETURN DASHBOARD <span className="text-white text-xs">&gt;</span>
                      </button>
                      <button
                        onClick={handleCreateChallanNav}
                        className="px-5 py-2.5 bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-between gap-3 min-w-[190px]"
                      >
                        CREATE CHALLAN <span className="text-white text-xs">&gt;</span>
                      </button>
                      <button className="px-5 py-2.5 bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-between gap-3 min-w-[230px]">
                        VIEW NOTICE(S) AND ORDER(S) <span className="text-white text-xs">&gt;</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Side Widgets Panel */}
                  <div className="w-full lg:w-[300px] flex flex-col gap-6 text-[13px] bg-white shrink-0 mt-4 lg:mt-0">
                    <div className="flex flex-col gap-1.5">
                      <h4 className="font-extrabold text-[#333] text-[13px] leading-snug">IICPA PRIVATE LIMITED</h4>
                      <p className="font-extrabold text-[#333] text-[13px] mt-2 mb-2">07GDLCF7228G1YK</p>
                      <hr className="border-slate-300 w-full mb-1" />
                      <button className="text-left text-[#1e3a8a] hover:underline flex items-center gap-1 cursor-pointer w-fit text-[13px]">
                        View Profile
                        <div className="bg-[#1e3a8a] rounded-full w-[14px] h-[14px] flex items-center justify-center ml-0.5">
                          <span className="text-white text-[9px] leading-none font-bold">&gt;</span>
                        </div>
                      </button>
                    </div>

                    <div className="mt-2">
                      <h4 className="font-medium text-[#1e3a8a] text-[15px] text-center mb-5">Quick Links</h4>
                      <div className="flex flex-col gap-3.5 text-[#1e3a8a] text-[13px]">
                        <span className="hover:underline cursor-pointer">Check Cash Balance</span>
                        <span className="hover:underline cursor-pointer">Liability ledger</span>
                        <span className="hover:underline cursor-pointer">Credit ledger</span>
                        <span className="hover:underline cursor-pointer leading-tight">Electronic Credit Reversal and Re-<br />claimed Statement</span>
                        <span className="hover:underline cursor-pointer leading-tight">Negative Liability Statement -<br />Regular Taxpayers</span>
                        <span className="hover:underline cursor-pointer">RCM Liability/ITC Statement</span>
                        <span className="hover:underline cursor-pointer">Application for Unbarring Returns</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )}

            {/* Inner Portal Footer */}
            <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 shrink-0 font-sans">
              <span>© 2022 IICPA Simulation Software Designed & Developed by IICPA</span>
              <span>Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+, Firefox 45+ and Safari 6+</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
