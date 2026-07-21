"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  RotateCcw,
  Info,
  ChevronDown,
  User,
  Bell,
  ArrowRight,
  Printer,
  Download,
  Play,
  AlertCircle,
  Globe,
  Menu,
  Video,
  FlaskConical,
  Moon
} from "lucide-react";
import Link from "next/link";
import {
  useSimulationConfig,
  findFieldValue,
  type SimulationCredConfig,
} from "@/lib/useSimulationConfig";

type Step = "reason_for_challan_overlay" | "reason_for_challan" | "create_challan" | "payment_selection" | "receipt";

interface TaxRow {
  head: string;
  tax: number;
  interest: number;
  penalty: number;
  fees: number;
  other: number;
}

// /simulations/gst/gst-computation-2 -> gst-gst-computation-2 (matches the
// slug derivation used by the course editor's Quick Inserts and the admin
// Simulation Manager, so credentials/banner text set there apply here).
const SIMULATION_SLUG = "gst-gst-computation-2";

const DEFAULT_EXPERIMENT = {
  description:
    "Generate Challan and make payment for the month of November with following Tax Components:",
  cgst: 35300,
  sgst: 35300,
  igst: 22900,
};

const parseAmount = (value: string): number | null => {
  const parsed = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// Merge the admin/course-editor config (Simulation Manager slug config or the
// per-insert ?simCfg override) onto the hardcoded defaults. The banner
// instructions come from "Banner Text"; the tax amounts come from
// credential fields labeled "CGST" / "SGST" / "IGST".
function buildExperimentBanner(config: SimulationCredConfig | null) {
  return {
    description: config?.bannerText || DEFAULT_EXPERIMENT.description,
    cgst: parseAmount(findFieldValue(config, /cgst/i)) ?? DEFAULT_EXPERIMENT.cgst,
    sgst: parseAmount(findFieldValue(config, /sgst/i)) ?? DEFAULT_EXPERIMENT.sgst,
    igst: parseAmount(findFieldValue(config, /igst/i)) ?? DEFAULT_EXPERIMENT.igst,
  };
}

export default function GSTComputation2Simulation() {
  const [currentStep, setCurrentStep] = useState<Step>("reason_for_challan_overlay");
  const [progress, setProgress] = useState(87);
  const [paymentMode, setPaymentMode] = useState<"E-Payment" | "OTC" | "NEFT">("E-Payment");
  const [errorMessage, setErrorMessage] = useState("");
  const [cpin, setCpin] = useState("");
  const [hoveredCalendarCell, setHoveredCalendarCell] = useState<string | null>(null);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isPaymentsDropdownOpen, setIsPaymentsDropdownOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [showLedgerTable, setShowLedgerTable] = useState(false);

  // Admin-configured values (per-insert ?simCfg override from the course
  // editor, or the slug config from the Simulation Manager) replace the
  // hardcoded experiment instructions/amounts when available.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const experiment = useMemo(() => buildExperimentBanner(simConfig), [simConfig]);

  // Payment Selection States
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [isTermsChecked, setIsTermsChecked] = useState<boolean>(false);
  const [paymentSelectionErrorMessage, setPaymentSelectionErrorMessage] = useState("");

  // Form values
  const [cgst, setCgst] = useState<TaxRow>({ head: "CGST (0005)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
  const [sgst, setSgst] = useState<TaxRow>({ head: "SGST (0006)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
  const [igst, setIgst] = useState<TaxRow>({ head: "IGST (0008)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
  const [cess, setCess] = useState<TaxRow>({ head: "Cess (0009)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });

  // Calculate totals
  const cgstTotal = cgst.tax + cgst.interest + cgst.penalty + cgst.fees + cgst.other;
  const sgstTotal = sgst.tax + sgst.interest + sgst.penalty + sgst.fees + sgst.other;
  const igstTotal = igst.tax + igst.interest + igst.penalty + igst.fees + igst.other;
  const cessTotal = cess.tax + cess.interest + cess.penalty + cess.fees + cess.other;

  const totalTax = cgst.tax + sgst.tax + igst.tax + cess.tax;
  const totalInterest = cgst.interest + sgst.interest + igst.interest + cess.interest;
  const totalPenalty = cgst.penalty + sgst.penalty + igst.penalty + cess.penalty;
  const totalFees = cgst.fees + sgst.fees + igst.fees + cess.fees;
  const totalOther = cgst.other + sgst.other + igst.other + cess.other;
  const grandTotal = cgstTotal + sgstTotal + igstTotal + cessTotal;

  useEffect(() => {
    if (currentStep === "reason_for_challan_overlay") {
      setProgress(87);
    } else if (currentStep === "reason_for_challan") {
      setProgress(90);
    } else if (currentStep === "create_challan") {
      setProgress(92);
    } else if (currentStep === "payment_selection") {
      setProgress(95);
    } else if (currentStep === "receipt") {
      setProgress(100);
    }
  }, [currentStep]);

  const handleStartExperiment = () => {
    setCurrentStep("reason_for_challan");
  };

  const handleCreateChallanNav = () => {
    setCurrentStep("reason_for_challan");
    setSelectedReason("");
    setShowLedgerTable(false);
  };

  const handleProceedFromReason = () => {
    if (selectedReason) {
      setCurrentStep("create_challan");
    }
  };

  const handleCancel = () => {
    setCurrentStep("reason_for_challan");
    setErrorMessage("");
    setSelectedReason("");
    setShowLedgerTable(false);
  };

  const handleGenerateChallan = () => {
    // Expected values validation against the admin-configured (or default) amounts
    if (igst.tax !== experiment.igst || cgst.tax !== experiment.cgst || sgst.tax !== experiment.sgst) {
      setErrorMessage(
        `Incorrect liability entries! Please input: IGST Tax = ${experiment.igst.toLocaleString(
          "en-IN"
        )}, CGST Tax = ${experiment.cgst.toLocaleString("en-IN")}, SGST Tax = ${experiment.sgst.toLocaleString(
          "en-IN"
        )}.`
      );
      return;
    }
    
    if (totalInterest > 0 || totalPenalty > 0 || totalFees > 0 || totalOther > 0 || cess.tax > 0) {
      setErrorMessage("Please set all other Tax, Interest, Penalty, Fees, and Cess inputs to 0.");
      return;
    }

    if (paymentMode !== "E-Payment") {
      setErrorMessage("Please select E-Payment mode to generate the Challan online.");
      return;
    }

    // Generate random 14-digit CPIN
    const generatedCpin = "CLN" + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setCpin(generatedCpin);
    setErrorMessage("");
    setCurrentStep("payment_selection");
  };

  const handleMakePayment = () => {
    if (!selectedBank) {
      setPaymentSelectionErrorMessage("Please select a bank to proceed with the payment.");
      return;
    }
    if (!isTermsChecked) {
      setPaymentSelectionErrorMessage("Please agree to the Terms and Conditions to proceed.");
      return;
    }
    setPaymentSelectionErrorMessage("");
    setCurrentStep("receipt");
  };

  const handleReset = () => {
    setCurrentStep("reason_for_challan_overlay");
    setCgst({ head: "CGST (0005)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
    setSgst({ head: "SGST (0006)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
    setIgst({ head: "IGST (0008)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
    setCess({ head: "Cess (0009)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
    setPaymentMode("E-Payment");
    setErrorMessage("");
    setSelectedBank("");
    setIsTermsChecked(false);
    setPaymentSelectionErrorMessage("");
  };

  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getExpiryDate = () => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 15);
    const dd = String(expiry.getDate()).padStart(2, "0");
    const mm = String(expiry.getMonth() + 1).padStart(2, "0");
    const yyyy = expiry.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const calendarHoverConfig: Record<string, { label: string; date: string; bg: string }> = {
    gstr1_feb: { label: "Filed on :", date: "11/3/2026", bg: "bg-[#e6fcf5] text-[#065f46]" },
    gstr3b_feb: { label: "Filed on :", date: "20/3/2026", bg: "bg-[#e6fcf5] text-[#065f46]" },
    gstr1_mar: { label: "Filed on :", date: "11/4/2026", bg: "bg-[#e6fcf5] text-[#065f46]" },
    gstr3b_mar: { label: "Filed on :", date: "20/4/2026", bg: "bg-[#e6fcf5] text-[#065f46]" },
    gstr1_apr: { label: "Filed on :", date: "11/5/2026", bg: "bg-[#e6fcf5] text-[#065f46]" },
    gstr3b_apr: { label: "Filed on :", date: "20/5/2026", bg: "bg-[#e6fcf5] text-[#065f46]" },
    gstr1_may: { label: "Filed on :", date: "11/6/2026", bg: "bg-[#e6fcf5] text-[#065f46]" },
    gstr3b_may: { label: "Filed on :", date: "20/6/2026", bg: "bg-[#e6fcf5] text-[#065f46]" },
    gstr1_jun: { label: "Due date :", date: "11/7/2026", bg: "bg-[#fffbef] text-[#7c5e10]" },
    gstr3b_jun: { label: "Due date :", date: "20/7/2026", bg: "bg-[#fffbef] text-[#7c5e10]" },
  };

  const renderCalendarCell = (
    cellKey: string,
    normalText: "Filed" | "To be Filed",
    normalBg: string,
    hasRightBorder: boolean = true
  ) => {
    const isHovered = hoveredCalendarCell === cellKey;
    const config = calendarHoverConfig[cellKey];
    
    return (
      <td
        onMouseEnter={() => setHoveredCalendarCell(cellKey)}
        onMouseLeave={() => setHoveredCalendarCell(null)}
        className={`p-2.5 text-center font-semibold transition-all duration-200 cursor-pointer ${
          hasRightBorder ? "border-r border-white" : ""
        } ${isHovered ? config.bg : `${normalBg} text-white`}`}
      >
        {isHovered ? (
          <div className="flex flex-col items-center justify-center text-[9px] leading-tight py-0.5">
            <span>{config.label}</span>
            <span className="font-bold">{config.date}</span>
          </div>
        ) : (
          normalText
        )}
      </td>
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans antialiased flex flex-col select-none">
      
      {/* Simulation Container wrapping everything - full width, top attached */}
      <div className="w-full flex-1 flex flex-col">


        {/* Instruction Section */}
        <div className="bg-white px-6 py-4 border-b border-[#e2e8f0] text-xs text-slate-700 space-y-3">
          <div className="flex items-start gap-1.5 font-bold text-slate-700">
            <span>•</span>
            <p>You can also make another payment by clicking the <span className="font-extrabold text-slate-800">MAKE ANOTHER PAYMENT</span> button</p>
          </div>
        </div>

        {/* Main GST Portal Container (Full-width inside the max-w-5xl wrapper) */}
        <div className="w-full flex-1 flex flex-col justify-between bg-white relative overflow-hidden">
            
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
              
              <div className="flex flex-col items-end gap-1 text-white">
                {/* Accessibility row */}
                <div className="flex items-center gap-2 text-[9px] text-white/70 font-semibold select-none">
                  <span className="hover:underline cursor-pointer">Skip to Main Content</span>
                  <span className="cursor-pointer hover:text-blue-200">A+</span>
                  <span className="cursor-pointer hover:text-blue-200">A</span>
                  <span className="cursor-pointer hover:text-blue-200">A-</span>
                </div>
                {/* User Info row */}
                <div className="flex flex-col items-end text-right text-[10px] font-bold mt-0.5">
                  <div className="flex items-center gap-1 select-none">
                    <User size={11} className="text-white/60" />
                    <span>Fincurious Cements Private Limited</span>
                  </div>
                  <span className="text-[9px] text-[#93c5fd] font-semibold mt-0.5 tracking-wider">
                    07GDLCF7228G1YK
                  </span>
                </div>
              </div>
            </div>

            {/* Inner Portal Navigation Menu */}
            <div className="bg-[#2c4f7c] px-5 py-2.5 overflow-x-auto whitespace-nowrap scrollbar-none w-full">
              <div className="flex items-center gap-8 text-white text-[12px] font-semibold">
                <span className="cursor-pointer hover:text-blue-100 transition-colors" onClick={() => {
                  if (currentStep !== "reason_for_challan_overlay") {
                    setCurrentStep("reason_for_challan");
                  }
                }}>Dashboard</span>
                <span
                  onClick={() => currentStep !== "reason_for_challan_overlay" && setIsServicesMenuOpen(!isServicesMenuOpen)}
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
                    className="cursor-pointer px-2.5 py-0.5 text-[#0d9488] border-2 border-red-500 font-bold flex items-center gap-1 bg-white hover:bg-slate-50 outline-none"
                  >
                    Payments
                  </button>
                  
                  {isPaymentsDropdownOpen && (
                    <div className="absolute left-0 right-0 w-full mt-2 bg-white border-y border-slate-300 shadow-lg p-5 pl-[220px] pr-24 z-[99999] text-[11px] grid grid-cols-2 gap-x-12 gap-y-3 font-bold select-none">
                      {/* Left Column */}
                      <div className="flex flex-col gap-3 text-left">
                        <button
                          onClick={handleCreateChallanNav}
                          className="text-left text-blue-900 hover:text-blue-700 cursor-pointer w-fit"
                        >
                          Create Challan
                        </button>
                        <button className="text-left text-blue-950/40 cursor-not-allowed opacity-60 w-fit" disabled>
                          Challan History
                        </button>
                        <button className="text-left text-blue-950/40 cursor-not-allowed opacity-60 w-fit" disabled>
                          Instalment Calendar
                        </button>
                      </div>

                      {/* Right Column */}
                      <div className="flex flex-col gap-3 text-left justify-start pt-1.5">
                        <button className="text-left text-blue-950/40 cursor-not-allowed opacity-60 w-fit" disabled>
                          Saved Challans
                        </button>
                        <button className="text-left text-blue-950/40 cursor-not-allowed opacity-60 w-fit" disabled>
                          Application for Deferred Payment/Payment in Instalments
                        </button>
                        <button className="text-left text-blue-950/40 cursor-not-allowed opacity-60 w-fit" disabled>
                          Grievance against Payment(GST PMT-07)
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
                  <span className="hover:underline cursor-pointer" onClick={() => {
                    if (currentStep !== "reason_for_challan_overlay") {
                      setCurrentStep("reason_for_challan");
                    }
                  }}>Dashboard</span>
                  {(currentStep === "reason_for_challan" || currentStep === "reason_for_challan_overlay") && (
                    <>
                      <span className="text-[#94a3b8] font-normal">&gt;</span>
                      <span className="hover:underline cursor-pointer">Payment</span>
                      <span className="text-[#94a3b8] font-normal">&gt;</span>
                      <span className="text-[#475569]">Reason for challan</span>
                    </>
                  )}
                  {currentStep === "create_challan" && (
                    <>
                      <span className="text-[#94a3b8] font-normal">&gt;</span>
                      <span className="hover:underline cursor-pointer">Payment</span>
                      <span className="text-[#94a3b8] font-normal">&gt;</span>
                      <span className="text-[#475569]">Create Challan</span>
                    </>
                  )}
                  {currentStep === "receipt" && (
                    <>
                      <span className="text-[#94a3b8] font-normal">&gt;</span>
                      <span className="hover:underline cursor-pointer">Payments</span>
                      <span className="text-[#94a3b8] font-normal">&gt;</span>
                      <span className="text-[#475569]">Challan Receipt</span>
                    </>
                  )}
                </div>
                
                {currentStep === "reason_for_challan" && (
                  <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
                    <Globe size={12} className="text-slate-500" />
                    <span>English</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Body Area */}
            <div className="w-full flex-1 bg-white p-5 flex flex-col justify-between">
                           {/* STATE 3: REASON FOR CHALLAN SELECTOR */}
              {(currentStep === "reason_for_challan" || currentStep === "reason_for_challan_overlay") && (
                <div className="space-y-6 flex-1 w-full text-[11px] relative">
                  
                  {/* Start Experiment overlay */}
                  {currentStep === "reason_for_challan_overlay" && (
                    <div className="absolute inset-0 bg-white/25 backdrop-blur-[1px] z-20 flex items-center justify-center">
                      <button
                        onClick={handleStartExperiment}
                        className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white px-8 py-3.5 rounded font-bold uppercase tracking-wider text-sm shadow-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Play fill="white" size={13} />
                        Start Experiment
                      </button>
                    </div>
                  )}

                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 w-full shadow-none">
                    <div className="bg-[#2c4f7c] text-white px-4 py-2 font-bold text-[12px] flex items-center justify-between">
                      <span>Reason For Challan</span>
                      <button className="bg-[#1e3b6a] hover:bg-[#152a4e] text-white text-[10px] px-3 py-1 font-bold">
                        HELP ?
                      </button>
                    </div>

                    <div className="p-6 border border-t-0 border-[#cbd5e1] space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-8 font-bold text-slate-700">
                          <span>Reason For Challan <span className="text-red-500 font-bold">*</span> :</span>
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                            <input
                              type="radio"
                              name="challanReason"
                              value="monthly"
                              checked={selectedReason === "monthly"}
                              onChange={() => setSelectedReason("monthly")}
                              className="h-4 w-4 accent-[#0a2558]"
                            />
                            Monthly payment for quarterly return
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 border-2 border-red-500 px-2.5 py-0.5">
                            <input
                              type="radio"
                              name="challanReason"
                              value="other"
                              checked={selectedReason === "other"}
                              onChange={() => setSelectedReason("other")}
                              className="h-4 w-4 accent-[#0a2558]"
                            />
                            Any other payment
                          </label>
                        </div>

                        <div className="text-[10px] text-red-500 font-semibold md:text-right">
                          <span className="text-red-500 font-bold">*</span> indicates mandatory fields
                        </div>
                      </div>

                      {/* Action buttons under Selector */}
                      <div className="flex items-center justify-between pt-4">
                        <button
                          onClick={() => setShowLedgerTable(!showLedgerTable)}
                          className="bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white px-5 py-2 font-bold uppercase transition-all shadow-sm border-2 border-red-500"
                        >
                          View Ledger Balance ▼
                        </button>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleProceedFromReason}
                            disabled={!selectedReason}
                            className={`px-6 py-2 font-bold uppercase transition-all shadow-sm border-2 border-red-500 ${
                              selectedReason
                                ? "bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white cursor-pointer"
                                : "bg-[#cbd5e1] text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            Proceed
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-[#cbd5e1] hover:bg-slate-300 text-slate-700 px-6 py-2 font-bold uppercase transition-all shadow-sm cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      {/* Expanded Ledger Balance Table */}
                      {showLedgerTable && (
                        <div className="border border-[#cbd5e1] mt-6 overflow-x-auto bg-slate-50/50 p-4">
                          <h4 className="font-extrabold text-[#0a2558] mb-3 uppercase tracking-wide">
                            Ledger Balance Details
                          </h4>
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-[#cbd5e1] font-bold text-slate-700">
                                <th className="p-2 border-r border-[#cbd5e1]">Ledger Type</th>
                                <th className="p-2 border-r border-[#cbd5e1] text-right">Tax (₹)</th>
                                <th className="p-2 border-r border-[#cbd5e1] text-right">Interest (₹)</th>
                                <th className="p-2 border-r border-[#cbd5e1] text-right">Penalty (₹)</th>
                                <th className="p-2 border-r border-[#cbd5e1] text-right">Fee (₹)</th>
                                <th className="p-2 text-right">Other (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-700 font-semibold">
                              <tr className="border-b border-[#cbd5e1]">
                                <td className="p-2 border-r border-[#cbd5e1] font-bold">Electronic Cash Ledger</td>
                                <td className="p-2 border-r border-[#cbd5e1] text-right">15,000</td>
                                <td className="p-2 border-r border-[#cbd5e1] text-right">0</td>
                                <td className="p-2 border-r border-[#cbd5e1] text-right">0</td>
                                <td className="p-2 border-r border-[#cbd5e1] text-right">0</td>
                                <td className="p-2 text-right">0</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-r border-[#cbd5e1] font-bold">Electronic Credit Ledger</td>
                                <td className="p-2 border-r border-[#cbd5e1] text-right">45,000</td>
                                <td className="p-2 border-r border-[#cbd5e1] text-right">0</td>
                                <td className="p-2 border-r border-[#cbd5e1] text-right">0</td>
                                <td className="p-2 border-r border-[#cbd5e1] text-right">0</td>
                                <td className="p-2 text-right">0</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informational sky-blue box */}
                  <div className="bg-[#f0f9ff] border border-sky-200 p-4 text-[10.5px] leading-relaxed text-slate-700 space-y-2">
                    <p className="font-bold text-[#0a2558]">Note: For taxpayer filing GSTR-3B on quarterly basis:</p>
                    <p>
                      1. To make payment for the first (M1) and second (M2) months of the quarter, please select reason as 'Monthly Payment for Quarterly Return' and the relevant period (financial year, month) and choose whether to pay through 35% challan or self-assessment challan.
                    </p>
                    <p>
                      2. To make payment for the third month of the quarter (M3), please use 'Create Challan' option in payment Table-6 of Form GSTR-3B Quarterly. An auto-populated challan amounting to liabilities for the quarter net of credit utilization and existing cash balance can be generated and used to offset liabilities.
                    </p>
                    <p>
                      <span className="text-[#0a2558] hover:underline cursor-pointer font-bold">Click here</span> for navigation to 'Return Dashboard' and prepare GSTR-3B Quarterly. Filing of GSTR-3B Quarterly available in the third month of the quarter is mandatory.
                    </p>
                    <p>*For adding cash to Electronic Cash Ledger, already established procedure may be followed.</p>
                  </div>
                </div>
              )}

              {/* STATE 4: CREATE CHALLAN FORM */}
              {currentStep === "create_challan" && (
                <div className="space-y-6 flex-1 w-full text-[11px]">
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 p-3 text-red-700 font-bold text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="border border-[#cbd5e1] rounded-none overflow-x-auto shadow-sm">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-[#2c4f7c] text-white font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3 border-r border-[#cbd5e1]/30">Government Head</th>
                          <th className="p-3 border-r border-[#cbd5e1]/30 text-right">Tax (₹)</th>
                          <th className="p-3 border-r border-[#cbd5e1]/30 text-right">Interest (₹)</th>
                          <th className="p-3 border-r border-[#cbd5e1]/30 text-right">Penalty (₹)</th>
                          <th className="p-3 border-r border-[#cbd5e1]/30 text-right">Fees (₹)</th>
                          <th className="p-3 border-r border-[#cbd5e1]/30 text-right">Other (₹)</th>
                          <th className="p-3 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700 font-semibold">
                        {/* CGST */}
                        <tr className="border-b border-[#cbd5e1] hover:bg-slate-50">
                          <td className="p-3 border-r border-[#cbd5e1] font-bold text-slate-800 bg-slate-50">CGST (0005)</td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cgst.tax || ""}
                              onChange={(e) => setCgst({ ...cgst, tax: Number(e.target.value) })}
                              className="w-full border-2 border-red-500 p-1 text-right text-xs text-[#0a2558] font-bold outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cgst.interest || ""}
                              onChange={(e) => setCgst({ ...cgst, interest: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cgst.penalty || ""}
                              onChange={(e) => setCgst({ ...cgst, penalty: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cgst.fees || ""}
                              onChange={(e) => setCgst({ ...cgst, fees: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cgst.other || ""}
                              onChange={(e) => setCgst({ ...cgst, other: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3 text-right font-extrabold bg-slate-50/50">{cgstTotal.toLocaleString("en-IN")}</td>
                        </tr>

                        {/* SGST */}
                        <tr className="border-b border-[#cbd5e1] hover:bg-slate-50">
                          <td className="p-3 border-r border-[#cbd5e1] font-bold text-slate-800 bg-slate-50">SGST (0006)</td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={sgst.tax || ""}
                              onChange={(e) => setSgst({ ...sgst, tax: Number(e.target.value) })}
                              className="w-full border-2 border-red-500 p-1 text-right text-xs text-[#0a2558] font-bold outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={sgst.interest || ""}
                              onChange={(e) => setSgst({ ...sgst, interest: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={sgst.penalty || ""}
                              onChange={(e) => setSgst({ ...sgst, penalty: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={sgst.fees || ""}
                              onChange={(e) => setSgst({ ...sgst, fees: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={sgst.other || ""}
                              onChange={(e) => setSgst({ ...sgst, other: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3 text-right font-extrabold bg-slate-50/50">{sgstTotal.toLocaleString("en-IN")}</td>
                        </tr>

                        {/* IGST */}
                        <tr className="border-b border-[#cbd5e1] hover:bg-slate-50">
                          <td className="p-3 border-r border-[#cbd5e1] font-bold text-slate-800 bg-slate-50">IGST (0008)</td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={igst.tax || ""}
                              onChange={(e) => setIgst({ ...igst, tax: Number(e.target.value) })}
                              className="w-full border-2 border-red-500 p-1 text-right text-xs text-[#0a2558] font-bold outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={igst.interest || ""}
                              onChange={(e) => setIgst({ ...igst, interest: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={igst.penalty || ""}
                              onChange={(e) => setIgst({ ...igst, penalty: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={igst.fees || ""}
                              onChange={(e) => setIgst({ ...igst, fees: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={igst.other || ""}
                              onChange={(e) => setIgst({ ...igst, other: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3 text-right font-extrabold bg-slate-50/50">{igstTotal.toLocaleString("en-IN")}</td>
                        </tr>

                        {/* Cess */}
                        <tr className="border-b border-[#cbd5e1] hover:bg-slate-50">
                          <td className="p-3 border-r border-[#cbd5e1] font-bold text-slate-800 bg-slate-50">Cess (0009)</td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cess.tax || ""}
                              onChange={(e) => setCess({ ...cess, tax: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cess.interest || ""}
                              onChange={(e) => setCess({ ...cess, interest: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cess.penalty || ""}
                              onChange={(e) => setCess({ ...cess, penalty: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cess.fees || ""}
                              onChange={(e) => setCess({ ...cess, fees: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]">
                            <input
                              type="number"
                              value={cess.other || ""}
                              onChange={(e) => setCess({ ...cess, other: Number(e.target.value) })}
                              className="w-full border border-slate-300 p-1 text-right text-xs outline-none focus:border-[#0a2558]"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3 text-right font-extrabold bg-slate-50/50">{cessTotal.toLocaleString("en-IN")}</td>
                        </tr>

                        {/* Grand Totals */}
                        <tr className="bg-slate-100 font-extrabold text-[#0a2558] border-b-2 border-slate-300">
                          <td className="p-3 border-r border-[#cbd5e1] uppercase">Total (₹)</td>
                          <td className="p-3 border-r border-[#cbd5e1] text-right">{totalTax.toLocaleString("en-IN")}</td>
                          <td className="p-3 border-r border-[#cbd5e1] text-right">{totalInterest.toLocaleString("en-IN")}</td>
                          <td className="p-3 border-r border-[#cbd5e1] text-right">{totalPenalty.toLocaleString("en-IN")}</td>
                          <td className="p-3 border-r border-[#cbd5e1] text-right">{totalFees.toLocaleString("en-IN")}</td>
                          <td className="p-3 border-r border-[#cbd5e1] text-right">{totalOther.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right text-lg text-emerald-600 font-black">{grandTotal.toLocaleString("en-IN")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Mode Selection */}
                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-800 tracking-wide text-xs">
                      Payment Modes <span className="text-red-500">*</span>
                    </h3>
                    
                    <div className="flex flex-col gap-2.5 font-semibold text-[11px] text-slate-700">
                      <div className="flex items-center">
                        <span className="mr-2 text-slate-400">•</span>
                        <div className="border-2 border-red-500 p-1.5 flex items-center gap-2 bg-slate-50">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="E-Payment"
                            checked={paymentMode === "E-Payment"}
                            onChange={() => setPaymentMode("E-Payment")}
                            className="h-3.5 w-3.5 accent-[#0a2558] cursor-pointer"
                          />
                          <span className="text-[#2c4f7c] underline cursor-pointer">E-Payment</span>
                          <span className="text-[#2c4f7c] font-black">✓</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center opacity-80">
                        <span className="mr-2 text-slate-400">•</span>
                        <div className="p-1 flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="OTC"
                            checked={paymentMode === "OTC"}
                            onChange={() => setPaymentMode("OTC")}
                            className="h-3.5 w-3.5 accent-[#0a2558] cursor-not-allowed"
                            disabled
                          />
                          <span className="text-[#2c4f7c] underline cursor-not-allowed">Over The Counter</span>
                        </div>
                      </div>

                      <div className="flex items-center opacity-80">
                        <span className="mr-2 text-slate-400">•</span>
                        <div className="p-1 flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="NEFT"
                            checked={paymentMode === "NEFT"}
                            onChange={() => setPaymentMode("NEFT")}
                            className="h-3.5 w-3.5 accent-[#0a2558] cursor-not-allowed"
                            disabled
                          />
                          <span className="text-[#2c4f7c] underline cursor-not-allowed">NEFT/RTGS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex justify-end gap-3.5 pt-4">
                    <button
                      onClick={handleCancel}
                      className="bg-[#cbd5e1] hover:bg-[#b8c6d6] text-slate-700 font-extrabold text-[11px] uppercase px-5 py-2 transition-colors cursor-pointer"
                    >
                      Edit Reason
                    </button>
                    <button
                      onClick={() => alert("Challan draft saved successfully.")}
                      className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-[11px] uppercase px-5 py-2 transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleGenerateChallan}
                      className="bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white font-extrabold text-[11px] uppercase px-6 py-2 border-2 border-red-500 shadow-md cursor-pointer transition-colors"
                    >
                      Generate Challan
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 4.5: PAYMENT SELECTION */}
              {currentStep === "payment_selection" && (
                <div className="space-y-6 flex-1 w-full text-[11px] select-none">
                  
                  {/* Success Alert Banner */}
                  <div className="bg-[#e6f4ea] border border-[#a3cfb6] p-4 text-[#137333] font-bold text-xs rounded-none shadow-sm flex items-center justify-between select-none animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span>Challan successfully generated.</span>
                    </div>
                  </div>

                  {paymentSelectionErrorMessage && (
                    <div className="bg-red-50 border border-red-200 p-3 text-red-700 font-bold text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{paymentSelectionErrorMessage}</span>
                    </div>
                  )}

                  {/* GST Challan Section */}
                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-[#0a2558] uppercase tracking-wide text-xs border-b border-slate-100 pb-2">
                      GST Challan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-semibold text-slate-600">
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">CPIN</p>
                        <p className="text-slate-800 font-black text-xs tracking-wider">{cpin}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Challan Generation Date</p>
                        <p className="text-slate-800 font-extrabold text-xs">{getTodayDate()} 15:15:13.345Z</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Challan Expiry Date</p>
                        <p className="text-slate-800 font-extrabold text-xs">{getExpiryDate()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Mode of Payment :-</p>
                        <p className="text-slate-800 font-extrabold text-xs">E-Payment</p>
                      </div>
                    </div>
                  </div>

                  {/* Details of Taxpayer Section */}
                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-[#0a2558] uppercase tracking-wide text-xs border-b border-slate-100 pb-2">
                      Details Of Taxpayer
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold text-slate-600">
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">GSTIN/Other Id</p>
                        <p className="text-slate-800 font-extrabold text-xs">07GDLCF7228G1YK</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Email Address</p>
                        <p className="text-slate-800 font-extrabold text-xs">cXXXXXXXXX@XXXXXXXom</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Mobile Number</p>
                        <p className="text-slate-800 font-extrabold text-xs">8XXXXX0910</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-semibold text-slate-600 pt-2">
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Name</p>
                        <p className="text-slate-800 font-extrabold text-xs">IICPA Private Limited</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Address</p>
                        <p className="text-slate-800 font-extrabold text-xs font-semibold">XXXXXXXXXX Karnataka,560028</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason For Challan Section */}
                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 shadow-sm space-y-2">
                    <h3 className="font-extrabold text-[#0a2558] uppercase tracking-wide text-xs border-b border-slate-100 pb-2">
                      Reason For Challan
                    </h3>
                    <div className="space-y-1 pt-1 font-semibold text-slate-600">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Reason</p>
                      <p className="text-slate-800 font-extrabold text-xs">{selectedReason || "Any other payment"}</p>
                    </div>
                  </div>

                  {/* Details of Deposit Section */}
                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-[#0a2558] uppercase tracking-wide text-xs border-b border-slate-100 pb-2">
                      Details of Deposit
                    </h3>
                    <div className="border border-[#cbd5e1] overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-[#cbd5e1] font-bold text-slate-700">
                            <th className="p-2.5 border-r border-[#cbd5e1]"></th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Tax (₹)</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Interest (₹)</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Penalty (₹)</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Fees (₹)</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Other (₹)</th>
                            <th className="p-2.5 text-right font-extrabold text-[#0a2558]">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-700 font-semibold">
                          <tr className="border-b border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] font-bold">CGST (0005)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">{cgst.tax.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right font-extrabold bg-slate-50/30">{cgstTotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] font-bold">IGST (0008)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">{igst.tax.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right font-extrabold bg-slate-50/30">{igstTotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] font-bold">CESS (0009)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right font-extrabold bg-slate-50/30">0</td>
                          </tr>
                          <tr className="border-b border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] font-bold">State SGST (0006)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">{sgst.tax.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right font-extrabold bg-slate-50/30">{sgstTotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="bg-slate-100 font-extrabold text-[#0a2558]">
                            <td className="p-2.5 border-r border-[#cbd5e1] uppercase">Total Challan Amount:</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right font-black" colSpan={5}>₹ {grandTotal.toLocaleString("en-IN")} /-</td>
                            <td className="p-2.5 text-right text-xs text-emerald-600 font-black">{grandTotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="bg-slate-50 font-bold text-slate-700 border-t border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] uppercase text-[9px] text-slate-400">Total Challan Amount (In Words):</td>
                            <td className="p-2.5 text-left text-[11px] font-extrabold text-slate-800" colSpan={6}>Ninety three thousand five hundred only.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Select Mode of E-Payment Section */}
                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-[#0a2558] tracking-wide text-xs">
                      Select Mode of E-Payment <span className="text-red-500">*</span>
                    </h3>
                    <div className="flex flex-col gap-2 font-semibold text-[11px] text-slate-700 select-none">
                      <div className="flex items-center opacity-70">
                        <span className="mr-2 text-slate-400">•</span>
                        <div className="p-1 flex items-center gap-2">
                          <input type="radio" disabled className="h-3 w-3 accent-[#0a2558]" />
                          <span className="text-[#2c4f7c] underline">Preferred Banks</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2 text-slate-400">•</span>
                        <div className="p-1 flex items-center gap-2">
                          <input type="radio" checked readOnly className="h-3 w-3 accent-[#0a2558]" />
                          <span className="text-[#2c4f7c] underline">Net Banking</span>
                          <span className="text-[#2c4f7c] font-black">✓</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Please select a bank Section */}
                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-[#0a2558] tracking-wide text-xs">
                      Please select a bank <span className="text-red-500">*</span>
                    </h3>
                    <div className="border border-red-500 p-2.5 bg-white inline-flex items-center gap-2 rounded">
                      <input
                        type="radio"
                        name="selectionBank"
                        value="IICPA_DUMMY_BANK"
                        checked={selectedBank === "IICPA_DUMMY_BANK"}
                        onChange={() => setSelectedBank("IICPA_DUMMY_BANK")}
                        className="h-3.5 w-3.5 accent-[#0a2558] cursor-pointer"
                        id="iicpa-dummy-bank-radio"
                      />
                      <label htmlFor="iicpa-dummy-bank-radio" className="text-slate-800 font-extrabold text-[11px] cursor-pointer select-none">
                        IICPA DUMMY BANK
                      </label>
                    </div>
                  </div>

                  {/* Terms and Conditions Section */}
                  <div className="bg-white border border-[#cbd5e1] rounded-none p-5 shadow-sm">
                    <div className="border border-red-500 p-2.5 bg-white inline-flex items-center gap-2 rounded">
                      <input
                        type="checkbox"
                        checked={isTermsChecked}
                        onChange={(e) => setIsTermsChecked(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[#0a2558] cursor-pointer"
                        id="terms-conditions-checkbox"
                      />
                      <label htmlFor="terms-conditions-checkbox" className="text-blue-600 underline font-extrabold text-[11px] cursor-pointer select-none">
                        Terms and Conditions apply.
                      </label>
                    </div>
                  </div>

                  {/* Footer informational guidelines */}
                  <div className="bg-[#fcf8e3] border border-[#faebcc] p-4 text-[#8a6d3b] text-[10px] leading-relaxed space-y-2 select-none">
                    <p className="font-bold">
                      ℹ If amount is deducted from bank account and not reflected in electronic cash ledger, you may raise grievance under Services &gt; Payments &gt; Grievance against payment (GST PMT-07)
                    </p>
                    <p className="font-bold">
                      ℹ *Awaiting Bank Confirmation: For e-payment mode of payment, if the maker has made a transaction and checker approval is not communicated by bank to GST System.
                    </p>
                    <p className="font-bold">
                      ℹ *Awaiting Bank Clearance: For OTC mode of payment, if bank has acknowledged the challan but remittance confirmation is not communicated by bank to GST System.
                    </p>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex justify-end gap-3.5 pt-4">
                    <button
                      onClick={() => alert("Challan PDF downloaded successfully.")}
                      className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-[11px] uppercase px-6 py-2 transition-colors cursor-pointer"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleMakePayment}
                      className={`font-extrabold text-[11px] uppercase px-8 py-2.5 shadow-md transition-colors ${
                        selectedBank === "IICPA_DUMMY_BANK" && isTermsChecked
                          ? "bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white cursor-pointer"
                          : "bg-[#cbd5e1] text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Make Payment
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 5: RECIEPT / SUCCESS CHALLAN GENERATED */}
              {currentStep === "receipt" && (
                <div className="space-y-6 flex-1 w-full text-[11px]">
                  
                  {/* Success Alert Banner */}
                  <div className="bg-[#e6f4ea] border border-[#a3cfb6] p-4 text-[#137333] font-bold text-xs rounded-none shadow-sm flex items-center gap-2.5 select-none animate-fadeIn">
                    <CheckCircle2 size={18} className="shrink-0 animate-bounce" />
                    <span>Challan successfully generated! The details are saved below. Please print or copy the CPIN to finalize the payment records.</span>
                  </div>

                  <div className="bg-white border border-[#cbd5e1] rounded-none p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src="/images/simulations/satyamev-jayate.jpg"
                          alt="Satyamev Jayate emblem"
                          className="h-10 w-10 object-contain bg-slate-50 rounded-full p-0.5"
                        />
                        <div>
                          <h4 className="text-slate-800 font-black text-sm uppercase">Common Portal Challan Receipt</h4>
                          <p className="text-slate-500 text-[10px] font-bold">DEPARTMENT OF REVENUE • GOVERNMENT OF INDIA</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 font-bold rounded flex items-center gap-1.5 cursor-pointer text-[10px]">
                          <Printer size={12} /> Print Receipt
                        </button>
                        <button className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 font-bold rounded flex items-center gap-1.5 cursor-pointer text-[10px]">
                          <Download size={12} /> Download PDF
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold text-slate-600">
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">GSTIN/Temporary ID</p>
                        <p className="text-slate-800 font-extrabold text-xs">09GDLCF7228G1YK</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Legal Name</p>
                        <p className="text-[#0a2558] font-extrabold text-xs">IICPA Private Limited</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Challan Common Portal ID (CPIN)</p>
                        <p className="text-emerald-700 font-black text-sm tracking-widest">{cpin}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Challan Generation Date</p>
                        <p className="text-slate-800 font-extrabold text-xs">{getTodayDate()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Challan Expiry Date</p>
                        <p className="text-slate-800 font-extrabold text-xs">{getExpiryDate()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">Selected Payment Mode</p>
                        <p className="text-slate-800 font-extrabold text-xs">{paymentMode}</p>
                      </div>
                    </div>

                    <div className="border border-[#cbd5e1] overflow-x-auto mt-6">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-[#cbd5e1] font-bold text-slate-700">
                            <th className="p-2.5 border-r border-[#cbd5e1]">Major Head</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Tax (₹)</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Interest (₹)</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Penalty (₹)</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Fees (₹)</th>
                            <th className="p-2.5 border-r border-[#cbd5e1] text-right">Other (₹)</th>
                            <th className="p-2.5 text-right font-extrabold text-[#0a2558]">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-700 font-semibold">
                          <tr className="border-b border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] font-bold">CGST (0005)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">{cgst.tax.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right font-extrabold bg-slate-50/30">{cgstTotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] font-bold">SGST (0006)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">{sgst.tax.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right font-extrabold bg-slate-50/30">{sgstTotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] font-bold">IGST (0008)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">{igst.tax.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right font-extrabold bg-slate-50/30">{igstTotal.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-[#cbd5e1]">
                            <td className="p-2.5 border-r border-[#cbd5e1] font-bold">Cess (0009)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right font-extrabold bg-slate-50/30">0</td>
                          </tr>
                          <tr className="bg-slate-100 font-extrabold text-[#0a2558]">
                            <td className="p-2.5 border-r border-[#cbd5e1] uppercase">Total (₹)</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">{totalTax.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right text-xs text-emerald-600 font-black">{grandTotal.toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Portal Footer Bar */}
            <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 shrink-0">
              <span>© 2026 Goods and Services Tax Network</span>
              <span>Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+, Firefox 45+ and Safari 6+</span>
            </div>
          </div>
      </div>
    </div>
  );
}
