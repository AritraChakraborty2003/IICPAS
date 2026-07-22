"use client";

import React, { useState } from "react";
import {
  Globe,
  ChevronDown,
  User,
  Bell,
  Info,
  ChevronUp,
  Play,
  CheckCircle2,
  Menu,
  Video,
  FlaskConical,
  Moon
} from "lucide-react";
import Link from "next/link";

interface ChallanRecord {
  cpin: string;
  createdOn: string;
  amount: number;
  mode: string;
  expiryDate: string;
  depositDate: string;
  depositStatus: string;
}

interface GSTChallanHistorySimulationProps {
  onComplete?: () => void;
}

export default function GSTChallanHistorySimulation({
  onComplete,
}: GSTChallanHistorySimulationProps = {}) {
  const [isStarted, setIsStarted] = useState(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isPaymentsDropdownOpen, setIsPaymentsDropdownOpen] = useState(false);
  const [searchType, setSearchType] = useState<"cpin" | "date">("cpin");
  const [cpinInput, setCpinInput] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<keyof ChallanRecord>("createdOn");
  const [sortAsc, setSortAsc] = useState(true);

  // Mock initial data
  const initialRecords: ChallanRecord[] = [
    {
      cpin: "09240518776210",
      createdOn: "18/05/2026",
      amount: 100000,
      mode: "E-Payment",
      expiryDate: "02/06/2026",
      depositDate: "19/05/2026",
      depositStatus: "Paid",
    },
    {
      cpin: "09240510887352",
      createdOn: "10/05/2026",
      amount: 50000,
      mode: "E-Payment",
      expiryDate: "25/05/2026",
      depositDate: "11/05/2026",
      depositStatus: "Paid",
    }
  ];

  const [records, setRecords] = useState<ChallanRecord[]>(initialRecords);

  const handleSearch = () => {
    if (!cpinInput.trim()) return;
    
    // Add the searched CPIN as a new record if it doesn't exist
    const exists = records.some((r) => r.cpin === cpinInput);
    if (!exists) {
      const newRecord: ChallanRecord = {
        cpin: cpinInput,
        createdOn: new Date().toLocaleDateString("en-GB"),
        amount: 100000, // default search mock amount
        mode: "E-Payment",
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
        depositDate: new Date().toLocaleDateString("en-GB"),
        depositStatus: "Paid",
      };
      setRecords([newRecord, ...records]);
    }
    setShowResults(true);
  };

  const handleSort = (field: keyof ChallanRecord) => {
    const isAsc = sortField === field ? !sortAsc : true;
    setSortField(field);
    setSortAsc(isAsc);

    const sorted = [...records].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (typeof valA === "number" && typeof valB === "number") {
        return isAsc ? valA - valB : valB - valA;
      }
      return isAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    setRecords(sorted);
  };

  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans antialiased flex flex-col justify-between select-none">
      
      {/* Main Content Area: Portal Full-Width */}
      <div className="flex-1 bg-white flex flex-col justify-between relative overflow-hidden">
        
        {/* Start Experiment overlay */}
        {!isStarted && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <button
              onClick={() => setIsStarted(true)}
              className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white px-8 py-3.5 rounded font-bold uppercase tracking-wider text-sm shadow-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play fill="white" size={13} />
              Start Experiment
            </button>
          </div>
        )}

        {/* Top Accessibility Bar */}
        <div className="bg-[#0b1a30] px-5 py-1 flex items-center justify-end text-[10px] text-white/80 font-medium w-full border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="hover:underline cursor-pointer">Skip to Main Content</span>
            <span className="text-white/20">|</span>
            <span className="cursor-pointer font-bold hover:text-blue-200">A+</span>
            <span className="cursor-pointer font-bold hover:text-blue-200">A</span>
            <span className="cursor-pointer font-bold hover:text-blue-200">A-</span>
          </div>
        </div>

            {/* Inner GST Portal Header */}
            <div className="bg-[#0a2558] px-5 py-3 flex items-center justify-between border-b border-[#0f172a] w-full">
              <div className="flex items-center gap-3.5">
                <img
                  src="/images/simulations/satyamev-jayate.jpg"
                  alt="Satyamev Jayate emblem"
                  className="h-10 w-10 object-contain bg-white rounded-full p-0.5 shrink-0"
                />
                <div>
                  <h1 className="text-white font-extrabold text-[19px] tracking-wide leading-none">
                    Goods and Services Tax
                  </h1>
                  <p className="text-[#93c5fd] text-[9px] font-bold tracking-widest mt-1">
                    GOVERNMENT OF INDIA
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-white text-[11px] font-medium">
                <div className="flex items-center gap-1 hover:text-blue-200 cursor-pointer">
                  <User size={13} />
                  <span className="font-bold">IICPA Private Limited</span>
                  <ChevronDown size={11} />
                </div>
                <div className="relative cursor-pointer hover:scale-105 transition-transform shrink-0">
                  <Bell size={15} />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#10b981] text-white font-black text-[8px] rounded-full h-3.5 w-3.5 flex items-center justify-center">
                    0
                  </span>
                </div>
              </div>
            </div>

            {/* Inner Portal Navigation Menu */}
            <div className="bg-[#2c4f7c] px-5 py-2.5 overflow-x-auto whitespace-nowrap scrollbar-none w-full">
              <div className="flex items-center gap-8 text-white text-[12px] font-semibold">
                <span className="cursor-pointer hover:text-blue-100 transition-colors">Dashboard</span>
                <span
                  onClick={() => setIsServicesMenuOpen(!isServicesMenuOpen)}
                  className="cursor-pointer px-2 py-0.5 text-white inline-flex items-center gap-1 hover:bg-white/10 select-none"
                >
                  Services <span className="text-[9px]">▼</span>
                </span>
                <span className="cursor-pointer hover:text-blue-100 transition-colors">GST Law</span>
                <span className="cursor-pointer hover:text-blue-100 transition-colors">Downloads</span>
                <span className="cursor-pointer hover:text-blue-100 transition-colors">Search Taxpayer</span>
                <span className="cursor-pointer hover:text-blue-100 transition-colors">Help and Taxpayer Facilities</span>
                <span className="cursor-pointer hover:text-blue-100 transition-colors">e-Invoice</span>
              </div>
            </div>

            {/* Services Sub-Navigation Menu Bar */}
            {isServicesMenuOpen && (
              <div className="bg-[#f1f3f7] px-5 py-2 border-b border-[#cbd5e1] w-full flex items-center gap-6 text-[11px] text-[#0a2558] font-bold relative select-none z-[9999]">
                <span className="cursor-pointer hover:text-blue-700">Registration</span>
                <span className="cursor-pointer hover:text-blue-700">Ledgers</span>
                <span className="cursor-pointer hover:text-blue-700">Returns</span>
                
                {/* Payments Sub-Menu Item with Hover/Click Dropdown */}
                <div
                  onMouseEnter={() => setIsPaymentsDropdownOpen(true)}
                  onMouseLeave={() => setIsPaymentsDropdownOpen(false)}
                >
                  <button
                    onClick={() => setIsPaymentsDropdownOpen(!isPaymentsDropdownOpen)}
                    className="cursor-pointer px-2.5 py-0.5 text-[#0a2558] font-bold flex items-center gap-1 bg-white hover:bg-slate-50 outline-none"
                  >
                    Payments
                  </button>
                  
                  {isPaymentsDropdownOpen && (
                    <div className="absolute left-0 right-0 w-full mt-2 bg-white border-y border-slate-300 shadow-lg p-5 pl-[220px] pr-24 z-[99999] text-[11px] grid grid-cols-2 gap-x-12 gap-y-3 font-bold select-none">
                      {/* Left Column */}
                      <div className="flex flex-col gap-3 text-left">
                        <button className="w-fit text-left text-blue-900 hover:text-blue-700 cursor-not-allowed opacity-60">
                          Create Challan
                        </button>
                        <button className="w-fit text-left text-blue-900 hover:text-blue-700 cursor-not-allowed opacity-60">
                          Challan History
                        </button>
                        <button className="w-fit text-left text-blue-900 hover:text-blue-700 cursor-not-allowed opacity-60">
                          Saved Challans
                        </button>
                      </div>
                      {/* Right Column */}
                      <div className="flex flex-col gap-3 text-left">
                        <button className="w-fit text-left text-blue-900 hover:text-blue-700 cursor-not-allowed opacity-60">
                          Grievance against Payment
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <span className="cursor-pointer hover:text-blue-700">User Services</span>
                <span className="cursor-pointer hover:text-blue-700">Refunds</span>
                <span className="cursor-pointer hover:text-blue-700">e-Way Bill System</span>
                <span className="cursor-pointer hover:text-blue-700">Track Application Status</span>
              </div>
            )}

            {/* Dashboard Breadcrumb */}
            <div className="bg-[#f1f5f9] px-5 py-2 border-b border-[#cbd5e1] w-full">
              <div className="text-xs font-bold text-[#1e3a8a] flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span className="hover:underline cursor-pointer">Dashboard</span>
                  <span className="text-[#94a3b8] font-normal">&gt;</span>
                  <span className="hover:underline cursor-pointer">Payment</span>
                  <span className="text-[#94a3b8] font-normal">&gt;</span>
                  <span className="text-[#475569]">Create Challan</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
                  <Globe size={12} className="text-slate-500" />
                  <span>English</span>
                </div>
              </div>
            </div>

            {/* Main Body Area */}
            <div className="w-full flex-1 bg-white p-5 flex flex-col justify-between">
              
              <div className="space-y-6 flex-1 w-full text-[11px] select-none">
                {/* Tabs Header */}
                <div className="flex border-b border-slate-200">
                  <button className="px-5 py-2 border-b-2 border-transparent text-slate-500 font-bold hover:text-slate-700 cursor-not-allowed">
                    Create Challan
                  </button>
                  <button className="px-5 py-2 border-b-2 border-transparent text-slate-500 font-bold hover:text-slate-700 cursor-not-allowed">
                    Saved Challan
                  </button>
                  <button className="px-5 py-2 border-b-2 border-[#10b981] text-[#0a2558] font-extrabold uppercase tracking-wide">
                    Challan History
                  </button>
                </div>

                {/* Content Box */}
                <div className="bg-white border border-[#cbd5e1] rounded-none p-5 w-full shadow-none flex flex-col justify-between">
                  <div>
                    {/* Search Form Header & Radios */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                      <div className="flex items-center gap-6 font-bold text-slate-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="searchType"
                            value="cpin"
                            checked={searchType === "cpin"}
                            onChange={() => setSearchType("cpin")}
                            className="h-4 w-4 accent-[#0a2558]"
                          />
                          Search By CPIN
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer opacity-70">
                          <input
                            type="radio"
                            name="searchType"
                            value="date"
                            checked={searchType === "date"}
                            onChange={() => setSearchType("date")}
                            className="h-4 w-4 accent-[#0a2558]"
                            disabled
                          />
                          Search By Date
                        </label>
                      </div>
                      
                      <div className="text-[10px] text-red-500 font-semibold md:text-right">
                        <span className="text-red-500 font-bold">*</span> indicates mandatory fields
                      </div>
                    </div>

                    {/* Search Inputs & Actions */}
                    <div className="border-t border-slate-100 pt-6 pb-4 flex flex-col md:flex-row md:items-end gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-slate-700">
                          CPIN <span className="text-red-500 font-bold">*</span>
                        </span>
                        <input
                          type="text"
                          placeholder="Enter CPIN"
                          value={cpinInput}
                          onChange={(e) => setCpinInput(e.target.value.replace(/\D/g, "").slice(0, 14))}
                          className="border border-[#cbd5e1] px-3 py-1.5 text-xs outline-none focus:border-[#0a2558] font-bold w-full md:w-64 tracking-widest text-[#0a2558]"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSearch}
                          disabled={cpinInput.length < 10}
                          className={`px-6 py-2 font-bold uppercase transition-all shadow-sm ${
                            cpinInput.length >= 10
                              ? "bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white cursor-pointer"
                              : "bg-[#cbd5e1] text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Search
                        </button>
                        <button
                          disabled={!showResults}
                          className={`px-6 py-2 font-bold uppercase transition-all shadow-sm ${
                            showResults
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              : "bg-[#cbd5e1] text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Download As CSV
                        </button>
                      </div>
                    </div>

                    {/* Results Table */}
                    <div className="mt-6 border border-[#cbd5e1] overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-[#cbd5e1] font-bold text-slate-700">
                            <th
                              onClick={() => handleSort("cpin")}
                              className="p-3 border-r border-[#cbd5e1] cursor-pointer hover:bg-slate-200 select-none whitespace-nowrap"
                            >
                              CPIN <span className="text-[8px] text-slate-400">⇅</span>
                            </th>
                            <th className="p-3 border-r border-[#cbd5e1] whitespace-nowrap">Created On</th>
                            <th
                              onClick={() => handleSort("amount")}
                              className="p-3 border-r border-[#cbd5e1] cursor-pointer hover:bg-slate-200 text-right select-none whitespace-nowrap"
                            >
                              Amount (₹) <span className="text-[8px] text-slate-400">⇅</span>
                            </th>
                            <th className="p-3 border-r border-[#cbd5e1] whitespace-nowrap">Mode</th>
                            <th className="p-3 border-r border-[#cbd5e1] whitespace-nowrap">Expiry Date</th>
                            <th
                              onClick={() => handleSort("depositDate")}
                              className="p-3 border-r border-[#cbd5e1] cursor-pointer hover:bg-slate-200 select-none whitespace-nowrap"
                            >
                              Deposit Date <span className="text-[8px] text-slate-400">⇅</span>
                            </th>
                            <th className="p-3 whitespace-nowrap">Deposit Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-[10.5px] text-slate-700 font-semibold">
                          {showResults ? (
                            records.map((r, i) => (
                              <tr key={i} className="border-b border-[#cbd5e1] hover:bg-slate-50">
                                <td className="p-3 border-r border-[#cbd5e1] text-[#0a2558] font-bold tracking-wider">{r.cpin}</td>
                                <td className="p-3 border-r border-[#cbd5e1]">{r.createdOn}</td>
                                <td className="p-3 border-r border-[#cbd5e1] text-right font-bold">{r.amount.toLocaleString("en-IN")}</td>
                                <td className="p-3 border-r border-[#cbd5e1]">{r.mode}</td>
                                <td className="p-3 border-r border-[#cbd5e1]">{r.expiryDate}</td>
                                <td className="p-3 border-r border-[#cbd5e1]">{r.depositDate}</td>
                                <td className="p-3 text-emerald-600 font-bold">{r.depositStatus}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-400 font-medium italic bg-slate-50/50">
                                Please enter CPIN and click Search to query Challan History records.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Note Section */}
                {!isNotesCollapsed && (
                  <div className="bg-[#f8fafc] border border-sky-200 p-4 text-[10px] text-slate-700 mt-6 relative leading-relaxed flex items-start gap-3 shadow-none">
                    <Info size={14} className="text-[#2c4f7c] shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p>
                        If amount is deducted from bank account and not reflected in electronic cash ledger, you may raise grievance under{" "}
                        <span className="font-bold text-[#0a2558]">"Services&gt;Payments&gt;Grievance against payment(GST PMT-07)"</span>
                      </p>
                      <p>
                        <span className="font-bold">*Awaiting Bank Confirmation:</span> For e-payment mode of payment, if the maker has made a transaction and checker approval is not communicated by bank to GST System.
                      </p>
                      <p>
                        <span className="font-bold">*Await Bank Clearance:</span> For OTC mode of payment, if bank has acknowledged the challan but remittance confirmation is not communicated by bank to GST System.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsNotesCollapsed(true)}
                      className="text-slate-400 hover:text-slate-600 absolute top-2 right-2 cursor-pointer"
                    >
                      <ChevronUp size={14} />
                    </button>
                  </div>
                )}
                
                {isNotesCollapsed && (
                  <div className="flex justify-end mt-2 pr-1">
                    <button
                      onClick={() => setIsNotesCollapsed(false)}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[#0a2558] px-3 py-1 font-bold text-[9px] cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      Show Notes <ChevronDown size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Portal Footer Bar */}
            <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
              <span>© 2026 Goods and Services Tax Network</span>
              <span>Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+, Firefox 45+ and Safari 6+</span>
            </div>
      </div>

      {/* Outer Shell: Bottom control bar with NEXT button */}
      <div className="bg-[#1e293b] px-6 py-4 flex items-center justify-between border-t border-slate-800 w-full select-none shrink-0">
        <span className="text-[11px] text-slate-400 font-semibold italic">GST Computation Simulation #4</span>
        <button
          onClick={() => {
            setIsCompleted(true);
            onComplete?.();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[12px] uppercase px-8 py-2.5 shadow-md tracking-wider cursor-pointer transition-transform active:scale-95"
        >
          Next
        </button>
      </div>

      {/* Completion Success Modal */}
      {isCompleted && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 p-8 max-w-md w-full shadow-2xl space-y-6 text-center select-none">
            <div className="flex justify-center">
              <CheckCircle2 size={54} className="text-emerald-500 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-white font-black text-xl tracking-tight">Simulation Completed!</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Congratulations! You have successfully completed the GST Computation & Challan History simulation.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/simulations/gst">
                <span className="w-full block bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition-all">
                  Back to Hub
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
