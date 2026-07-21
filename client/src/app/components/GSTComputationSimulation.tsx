"use client";

import React, { useState, useEffect, useRef } from "react";
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
  FlaskConical
} from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";

type Step = "dashboard_overlay" | "dashboard_active" | "reason_for_challan" | "create_challan" | "receipt";

interface TaxRow {
  head: string;
  tax: number;
  interest: number;
  penalty: number;
  fees: number;
  other: number;
}

export default function GSTComputationSimulation() {
  const [currentStep, setCurrentStep] = useState<Step>("dashboard_overlay");
  const [progress, setProgress] = useState(87);
  const [paymentMode, setPaymentMode] = useState<"E-Payment" | "OTC" | "NEFT">("E-Payment");
  const [errorMessage, setErrorMessage] = useState("");
  const [cpin, setCpin] = useState("");
  const [hoveredCalendarCell, setHoveredCalendarCell] = useState<string | null>(null);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isPaymentsDropdownOpen, setIsPaymentsDropdownOpen] = useState(false);
  const paymentsCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPaymentsDropdown = () => {
    if (paymentsCloseTimeoutRef.current) {
      clearTimeout(paymentsCloseTimeoutRef.current);
      paymentsCloseTimeoutRef.current = null;
    }
    setIsPaymentsDropdownOpen(true);
  };

  const scheduleClosePaymentsDropdown = () => {
    if (paymentsCloseTimeoutRef.current) {
      clearTimeout(paymentsCloseTimeoutRef.current);
    }
    paymentsCloseTimeoutRef.current = setTimeout(() => {
      setIsPaymentsDropdownOpen(false);
      paymentsCloseTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (paymentsCloseTimeoutRef.current) {
        clearTimeout(paymentsCloseTimeoutRef.current);
      }
    };
  }, []);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [showLedgerTable, setShowLedgerTable] = useState(false);
  const [ledgerViewed, setLedgerViewed] = useState(false);

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
    if (currentStep === "dashboard_overlay") {
      setProgress(87);
    } else if (currentStep === "dashboard_active") {
      setProgress(87);
    } else if (currentStep === "reason_for_challan") {
      setProgress(90);
    } else if (currentStep === "create_challan") {
      setProgress(92);
    } else if (currentStep === "receipt") {
      setProgress(100);
    }
  }, [currentStep]);

  const handleStartExperiment = () => {
    setCurrentStep("dashboard_active");
  };

  const handleCreateChallanNav = () => {
    setCurrentStep("reason_for_challan");
    setSelectedReason("");
    setShowLedgerTable(false);
    setLedgerViewed(false);
  };

  const handleProceedFromReason = () => {
    // Proceed is intentionally disabled for this experiment.
  };

  const handleCancel = () => {
    setCurrentStep("dashboard_active");
    setErrorMessage("");
    setSelectedReason("");
    setShowLedgerTable(false);
    setLedgerViewed(false);
  };

  const handleGenerateChallan = () => {
    // Expected values validation: CGST = 25000, SGST = 25000, IGST = 50000
    if (igst.tax !== 50000 || cgst.tax !== 25000 || sgst.tax !== 25000) {
      setErrorMessage("Incorrect liability entries! Please input: IGST Tax = 50,000, CGST Tax = 25,000, SGST Tax = 25,000.");
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
    const generatedCpin = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
    setCpin(generatedCpin);
    setErrorMessage("");
    setCurrentStep("receipt");
  };

  const handleReset = () => {
    setCurrentStep("dashboard_overlay");
    setCgst({ head: "CGST (0005)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
    setSgst({ head: "SGST (0006)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
    setIgst({ head: "IGST (0008)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
    setCess({ head: "Cess (0009)", tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 });
    setPaymentMode("E-Payment");
    setErrorMessage("");
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

  const calendarHoverConfig: Record<string, { label: string; date: string; defaultText: string; month: string }> = {
    gstr1_jan: { label: "Filed on :", date: "09/03/2026", defaultText: "Filed", month: "Jan - 2026" },
    gstr1_feb: { label: "Filed on :", date: "11/03/2026", defaultText: "Filed", month: "Feb - 2026" },
    gstr1_mar: { label: "Filed on :", date: "11/04/2026", defaultText: "Filed", month: "Mar - 2026" },
    gstr1_apr: { label: "Filed on :", date: "11/05/2026", defaultText: "Filed", month: "Apr - 2026" },
    
    gstr3b_jan: { label: "Filed on :", date: "20/02/2026", defaultText: "Filed", month: "Jan - 2026" },
    gstr3b_feb: { label: "Filed on :", date: "20/03/2026", defaultText: "Filed", month: "Feb - 2026" },
    gstr3b_mar: { label: "Filed on :", date: "20/04/2026", defaultText: "Filed", month: "Mar - 2026" },
    gstr3b_apr: { label: "Filed on :", date: "20/05/2026", defaultText: "Filed", month: "Apr - 2026" },
  };

  const renderCalendarCell = (cellKey: string, hasRightBorder: boolean = true) => {
    const config = calendarHoverConfig[cellKey];
    if (!config) return null;
    
    const isHovered = hoveredCalendarCell === cellKey;
    
    return (
      <td
        onMouseEnter={() => setHoveredCalendarCell(cellKey)}
        onMouseLeave={() => setHoveredCalendarCell(null)}
        className={`leading-[1.3] px-2 align-middle transition-all duration-200 cursor-pointer ${
          hasRightBorder ? "border-r border-white" : ""
        } ${
          isHovered ? "bg-[#e6fcf5] text-[#03543f]" : "bg-[#34b484] text-white"
        }`}
      >
        {isHovered ? (
          <div className="flex flex-col items-center justify-center text-[10px] leading-tight font-bold">
            <span className="font-normal text-[10px] text-[#03543f]/80">{config.label}</span>
            <span className="font-bold text-[11px] text-[#03543f] mt-0.5">{config.date}</span>
          </div>
        ) : (
          <>
            {config.month}
            <br />
            <span className="font-normal text-[11px]">{config.defaultText}</span>
          </>
        )}
      </td>
    );
  };



  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans antialiased flex flex-col justify-between">
      {/* Main GST Portal Container (Full-width, no outer spacing or borders) */}
      <div className="w-full flex-1 flex flex-col justify-between bg-white">
          
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
              {/* Emblem Image */}
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
                className="cursor-pointer border-2 border-red-500 px-2 py-0.5 text-white inline-flex items-center gap-1 hover:bg-white/10 select-none"
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
                onMouseEnter={openPaymentsDropdown}
                onMouseLeave={scheduleClosePaymentsDropdown}
              >
                <button
                  onClick={() => setIsPaymentsDropdownOpen(!isPaymentsDropdownOpen)}
                  className="cursor-pointer border-2 border-red-500 px-2.5 py-0.5 text-[#0a2558] font-bold flex items-center gap-1 bg-white hover:bg-slate-50 outline-none"
                >
                  Payments
                </button>

                {isPaymentsDropdownOpen && (
                  <div
                    onMouseEnter={openPaymentsDropdown}
                    onMouseLeave={scheduleClosePaymentsDropdown}
                    className="absolute left-0 right-0 w-full mt-2 bg-white border-y border-slate-300 shadow-lg p-5 pl-[220px] pr-24 z-[99999] text-[11px] grid grid-cols-2 gap-x-12 gap-y-3 font-bold select-none"
                  >
                    {/* Left Column */}
                    <div className="flex flex-col gap-3 text-left">
                      <button
                        onClick={() => {
                          handleCreateChallanNav();
                          setIsPaymentsDropdownOpen(false);
                          setIsServicesMenuOpen(false);
                        }}
                        className="w-fit text-left text-blue-900 border-2 border-red-500 px-3 py-1.5 bg-white hover:bg-slate-50 cursor-pointer font-bold"
                      >
                        Create Challan
                      </button>
                      <button
                        className="text-left text-blue-900 hover:text-blue-755 cursor-not-allowed opacity-80 w-fit"
                        disabled
                      >
                        Challan History
                      </button>
                      <button
                        className="text-left text-blue-900 hover:text-blue-755 cursor-not-allowed opacity-80 w-fit"
                        disabled
                      >
                        Instalment Calendar
                      </button>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-3 text-left justify-start pt-1.5">
                      <button
                        className="text-left text-blue-900 hover:text-blue-755 cursor-not-allowed opacity-80 w-fit"
                        disabled
                      >
                        Saved Challans
                      </button>
                      <button
                        className="text-left text-blue-900 hover:text-blue-755 cursor-not-allowed opacity-80 w-fit"
                        disabled
                      >
                        Application for Deferred Payment/Payment in Instalments
                      </button>
                      <button
                        className="text-left text-blue-900 hover:text-blue-755 cursor-not-allowed opacity-80 w-fit"
                        disabled
                      >
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
                <span className="hover:underline cursor-pointer" onClick={() => setCurrentStep("dashboard_active")}>Dashboard</span>
                {currentStep === "reason_for_challan" && (
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
                    <span className="hover:underline cursor-pointer">Payments</span>
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
          <div className="w-full flex-1 bg-white p-0 flex flex-col justify-between">
            
            {/* STATE 1 & 2: DASHBOARD VIEW */}
            {(currentStep === "dashboard_overlay" || currentStep === "dashboard_active") && (
              <div className="relative flex-1 bg-white flex flex-col w-full">
                {/* Start Experiment overlay for dashboard */}
                {currentStep === "dashboard_overlay" && (
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-20 flex items-center justify-center">
                    <button
                      onClick={handleStartExperiment}
                      className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white px-8 py-3.5 rounded font-bold uppercase tracking-wider text-sm shadow-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Play fill="white" size={13} />
                      Start Experiment
                    </button>
                  </div>
                )}

                {/* Top Info Bar (Last logged in & IP) */}
                <div className="flex items-center justify-between px-5 py-2 text-[11px] text-[#333] w-full">
                  <span>Last logged in on <strong>19/05/2026 08:26</strong></span>
                  <span>Currently logged in from IP: <strong>223.233.68.198</strong></span>
                </div>

                {/* Dashboard Flex Layout */}
                <div className="flex flex-col lg:flex-row gap-6 px-5 mt-6 pb-8 mx-auto w-full max-w-[1200px]">
                  
                  {/* Left Panel */}
                  <div className="flex-1 flex flex-col items-center">
                    <h2 className="text-[17px] font-medium text-[#1e3a8a] text-center w-full">
                      Welcome IICPA Private Limited to GST Common Portal
                    </h2>
                    
                    <p className="font-bold text-[#333] text-sm text-center mt-3 mb-5">
                      Return filing preference (Apr-Jun 2026) : Monthly (<span className="text-[#1e3a8a] cursor-pointer hover:underline font-normal">Change</span>)
                    </p>

                    <h3 className="text-[16px] font-bold text-[#333] text-center mb-3">
                      Returns Calendar (Last 5 return periods)
                    </h3>
                    
                    {/* Returns Calendar Table (2 rows) */}
                    <div className="border border-[#1e3b6a] max-w-[700px] w-full mb-6">
                      <table className="w-full text-center border-collapse text-[13px] font-bold table-fixed">
                        <tbody>
                          <tr className="border-b border-white h-[80px]">
                            <td className="bg-[#1e3b6a] text-white border-r border-white w-[130px] px-2 align-middle">GSTR-1 / IFF</td>
                            <td className="bg-[#cbd5e1] text-slate-700 border-r border-white leading-[1.3] px-2 align-middle">Dec - 2025<br/><span className="font-normal text-[11px]">NA<br/>Not registered</span></td>
                            {renderCalendarCell("gstr1_jan")}
                            {renderCalendarCell("gstr1_feb")}
                            {renderCalendarCell("gstr1_mar")}
                            {renderCalendarCell("gstr1_apr", false)}
                          </tr>
                          <tr className="h-[80px]">
                            <td className="bg-[#1e3b6a] text-white border-r border-white px-2 align-middle">GSTR-3B</td>
                            <td className="bg-[#cbd5e1] text-slate-700 border-r border-white leading-[1.3] px-2 align-middle">Dec - 2025<br/><span className="font-normal text-[11px]">NA<br/>Not registered</span></td>
                            {renderCalendarCell("gstr3b_jan")}
                            {renderCalendarCell("gstr3b_feb")}
                            {renderCalendarCell("gstr3b_mar")}
                            {renderCalendarCell("gstr3b_apr", false)}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Navigation Note */}
                    <div className="border border-[#777] py-1.5 px-6 text-[12px] text-slate-800 bg-white italic text-center w-[500px] mb-6">
                      You can navigate to your chosen page through navigation panel given below
                    </div>

                    {/* Warning Alert Box */}
                    <div className="border border-[#777] p-3.5 bg-white text-[12px] text-slate-800 flex items-start gap-2 max-w-[650px] font-bold italic mb-6 shadow-sm">
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
                      <button onClick={handleCreateChallanNav} className="px-5 py-2.5 bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-between gap-3 min-w-[190px]">
                        CREATE CHALLAN <span className="text-white text-xs">&gt;</span>
                      </button>
                      <button className="px-5 py-2.5 bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-between gap-3 min-w-[230px]">
                        VIEW NOTICE(S) AND ORDER(S) <span className="text-white text-xs">&gt;</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Side Widgets Panel */}
                  <div className="w-[300px] flex flex-col gap-6 text-[13px] bg-white shrink-0 mt-4 lg:mt-0">
                    <div className="flex flex-col gap-1.5">
                      <h4 className="font-extrabold text-[#333] text-[13px] leading-snug">IICPA PRIVATE LIMITED</h4>
                      <p className="font-extrabold text-[#333] text-[13px] mt-2 mb-2">09GDLCF7228G1YK</p>
                      <hr className="border-slate-300 w-full mb-1"/>
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
                        <span className="hover:underline cursor-pointer leading-tight">Electronic Credit Reversal and Re-<br/>claimed Statement</span>
                        <span className="hover:underline cursor-pointer leading-tight">Negative Liability Statement -<br/>Regular Taxpayers</span>
                        <span className="hover:underline cursor-pointer">RCM Liability/ITC Statement</span>
                        <span className="hover:underline cursor-pointer">Application for Unbarring Returns</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STATE 2.5: REASON FOR CHALLAN */}
            {currentStep === "reason_for_challan" && (
              <div className="space-y-6 flex-1 w-full text-[11px] select-none">
                {/* Reason For Challan Box */}
                <div className="bg-white border border-[#cbd5e1] rounded-none p-5 w-full shadow-none min-h-[340px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
                      <h2 className="text-[#0a2558] font-bold text-[14px]">Reason For Challan</h2>
                      <button className="bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white px-3 py-1 text-[10px] font-bold rounded-none shadow-none uppercase tracking-wide">
                        HELP
                      </button>
                    </div>

                    <div className="text-right text-[10px] text-red-500 font-semibold mb-4 pr-2">
                      <span className="text-red-500 font-bold">*</span> indicates mandatory fields
                    </div>

                    {/* Centered Radio Options Box */}
                    <div className="flex justify-center items-center py-10">
                      <div className="flex items-start gap-4">
                        <span className="text-[11px] font-bold text-slate-700 pt-0.5 text-right shrink-0">
                          Reason For Challan <span className="text-red-500 font-bold">*</span> :
                        </span>
                        <div className="flex flex-col gap-3 font-semibold text-slate-700 text-[11px]">
                          <label className="flex items-center gap-2 cursor-pointer">
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
                          <label className="flex items-center gap-2 cursor-pointer">
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

                  {showLedgerTable && (
                    <div className="px-6 pb-6 w-full overflow-x-auto select-none">
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
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 border-r border-[#cbd5e1] text-right">0</td>
                            <td className="p-2.5 text-right text-blue-600 underline cursor-pointer font-bold">0</td>
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
                      onClick={() => {
                        setShowLedgerTable(!showLedgerTable);
                        setLedgerViewed(true);
                      }}
                      className={`relative bg-[#2c4f7c] hover:bg-[#1e3b6a] text-white px-4 py-2 font-bold text-[10px] rounded-none shadow-none transition-colors uppercase cursor-pointer ${
                        ledgerViewed ? "border-2 border-emerald-500" : "border-2 border-red-500"
                      }`}
                    >
                      VIEW LEDGER BALANCE ▼
                      {ledgerViewed && (
                        <FaCheckCircle
                          className="absolute -top-2 -right-2 text-emerald-500 bg-white rounded-full shadow-md"
                          size={18}
                        />
                      )}
                    </button>
                    <button
                      onClick={handleProceedFromReason}
                      disabled
                      className="px-8 py-2 font-bold text-[10px] transition-colors rounded-none shadow-none uppercase bg-[#cbd5e1] text-slate-400 cursor-not-allowed opacity-60"
                    >
                      Proceed
                    </button>
                  </div>
                </div>

                {/* Note Card */}
                <div className="bg-white border border-[#38bdf8] rounded-none p-5 text-[11px] text-slate-700 mt-6 relative shadow-none leading-relaxed">
                  <h4 className="font-bold text-[#0a2558] mb-2.5 text-xs">Note: For taxpayer filing GSTR-3B on quarterly basis:</h4>
                  <ol className="list-decimal list-outside pl-4 space-y-2.5">
                    <li>
                      To make payment for the first (M1) and second (M2) months of the quarter, please select reason as 'Monthly Payment for Quarterly Return' and the relevant period (financial year, month) and choose whether to pay through 35% challan or self-assessment challan.
                    </li>
                    <li>
                      To make payment for the third month of the Quarter (M3), please use 'Create Challan' option in payment Table-6 of Form GSTR-3B Quarterly. An auto-populated challan amounting to liabilities for the quarter net off credit utilization and existing cash balance can be generated and used to offset liabilities.
                    </li>
                  </ol>
                  <p className="mt-3 text-slate-700">
                    <span className="text-blue-600 underline font-bold cursor-pointer hover:text-blue-800">Click here</span> for navigation to 'Return Dashboard' and prepare GSTR-3B Quarterly. Filing of GSTR-3B Quarterly available in the third month of the quarter is mandatory.
                  </p>
                  <p className="mt-2.5 font-bold text-slate-700">
                    *For adding cash to Electronic Cash Ledger, already established procedure may be followed.
                  </p>
                </div>
              </div>
            )}

            {/* STATE 3: CREATE CHALLAN FORM */}
            {currentStep === "create_challan" && (
              <div className="space-y-6 flex-1">
                
                {/* Tax Payer Info Summary */}
                <div className="grid gap-4 md:grid-cols-3 bg-[#f8fafc] border border-[#e2e8f0] rounded p-4 text-[11px] font-bold">
                  <div>
                    <span className="text-slate-500 block uppercase text-[9px] tracking-wider">GSTIN</span>
                    <span className="text-[#0a2558] text-sm">09GDLCF7228G1YK</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[9px] tracking-wider">Legal Name</span>
                    <span className="text-[#0a2558] text-sm uppercase">IICPA Private Limited</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase text-[9px] tracking-wider">Email Address</span>
                    <span className="text-[#0a2558] text-sm">contact@iicpa.in</span>
                  </div>
                </div>

                {/* Tax Details Section */}
                <div className="border border-[#cbd5e1] rounded overflow-hidden">
                  <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] px-4 py-3 flex items-center justify-between">
                    <h3 className="font-extrabold text-[#0a2558] text-xs uppercase tracking-wide">Add Challan Details</h3>
                    <span className="text-[10px] font-semibold text-slate-500">• All amounts are in Indian Rupees (INR)</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#0a2558] text-white border-b border-[#cbd5e1] font-bold text-[11px]">
                          <th className="p-2.5 border-r border-[#cbd5e1]/30">Major / Minor Head</th>
                          <th className="p-2.5 border-r border-[#cbd5e1]/30 text-right">Tax</th>
                          <th className="p-2.5 border-r border-[#cbd5e1]/30 text-right">Interest</th>
                          <th className="p-2.5 border-r border-[#cbd5e1]/30 text-right">Penalty</th>
                          <th className="p-2.5 border-r border-[#cbd5e1]/30 text-right">Fees</th>
                          <th className="p-2.5 border-r border-[#cbd5e1]/30 text-right">Other</th>
                          <th className="p-2.5 text-right">Total (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* CGST */}
                        <tr className="border-b border-[#cbd5e1] text-[11px]">
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 border-r border-[#cbd5e1]/20">
                            {cgst.head}
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cgst.tax || ""}
                              onChange={(e) => setCgst({ ...cgst, tax: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none focus:border-[#0a2558] font-bold"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cgst.interest || ""}
                              onChange={(e) => setCgst({ ...cgst, interest: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cgst.penalty || ""}
                              onChange={(e) => setCgst({ ...cgst, penalty: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cgst.fees || ""}
                              onChange={(e) => setCgst({ ...cgst, fees: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cgst.other || ""}
                              onChange={(e) => setCgst({ ...cgst, other: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800">
                            {cgstTotal.toLocaleString()}
                          </td>
                        </tr>

                        {/* SGST */}
                        <tr className="border-b border-[#cbd5e1] text-[11px]">
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 border-r border-[#cbd5e1]/20">
                            {sgst.head}
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={sgst.tax || ""}
                              onChange={(e) => setSgst({ ...sgst, tax: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none focus:border-[#0a2558] font-bold"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={sgst.interest || ""}
                              onChange={(e) => setSgst({ ...sgst, interest: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={sgst.penalty || ""}
                              onChange={(e) => setSgst({ ...sgst, penalty: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={sgst.fees || ""}
                              onChange={(e) => setSgst({ ...sgst, fees: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={sgst.other || ""}
                              onChange={(e) => setSgst({ ...sgst, other: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800">
                            {sgstTotal.toLocaleString()}
                          </td>
                        </tr>

                        {/* IGST */}
                        <tr className="border-b border-[#cbd5e1] text-[11px]">
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 border-r border-[#cbd5e1]/20">
                            {igst.head}
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={igst.tax || ""}
                              onChange={(e) => setIgst({ ...igst, tax: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none focus:border-[#0a2558] font-bold"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={igst.interest || ""}
                              onChange={(e) => setIgst({ ...igst, interest: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={igst.penalty || ""}
                              onChange={(e) => setIgst({ ...igst, penalty: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={igst.fees || ""}
                              onChange={(e) => setIgst({ ...igst, fees: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={igst.other || ""}
                              onChange={(e) => setIgst({ ...igst, other: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800">
                            {igstTotal.toLocaleString()}
                          </td>
                        </tr>

                        {/* Cess */}
                        <tr className="border-b border-[#cbd5e1] text-[11px]">
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 border-r border-[#cbd5e1]/20">
                            {cess.head}
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cess.tax || ""}
                              onChange={(e) => setCess({ ...cess, tax: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cess.interest || ""}
                              onChange={(e) => setCess({ ...cess, interest: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cess.penalty || ""}
                              onChange={(e) => setCess({ ...cess, penalty: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cess.fees || ""}
                              onChange={(e) => setCess({ ...cess, fees: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-1.5 border-r border-[#cbd5e1]/20">
                            <input
                              type="number"
                              value={cess.other || ""}
                              onChange={(e) => setCess({ ...cess, other: Number(e.target.value) })}
                              className="w-full text-right h-8 border border-[#cbd5e1] rounded px-2 outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800">
                            {cessTotal.toLocaleString()}
                          </td>
                        </tr>

                        {/* Summary Row */}
                        <tr className="bg-slate-100 font-extrabold border-t border-[#cbd5e1] text-[11px]">
                          <td className="p-2.5 border-r border-[#cbd5e1]/20">Total (Rs.)</td>
                          <td className="p-2.5 text-right border-r border-[#cbd5e1]/20">{totalTax.toLocaleString()}</td>
                          <td className="p-2.5 text-right border-r border-[#cbd5e1]/20">{totalInterest.toLocaleString()}</td>
                          <td className="p-2.5 text-right border-r border-[#cbd5e1]/20">{totalPenalty.toLocaleString()}</td>
                          <td className="p-2.5 text-right border-r border-[#cbd5e1]/20">{totalFees.toLocaleString()}</td>
                          <td className="p-2.5 text-right border-r border-[#cbd5e1]/20">{totalOther.toLocaleString()}</td>
                          <td className="p-2.5 text-right text-[#0a2558]">{grandTotal.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Mode Selection */}
                <div className="border border-[#cbd5e1] rounded p-4 bg-slate-50/30 text-xs">
                  <h4 className="font-bold text-[#334155] uppercase mb-3 text-[10px] tracking-wider">Payment Modes</h4>
                  <div className="flex flex-wrap gap-8 font-bold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment_mode"
                        checked={paymentMode === "E-Payment"}
                        onChange={() => setPaymentMode("E-Payment")}
                        className="h-4 w-4 text-[#0a2558] focus:ring-[#0a2558]"
                      />
                      <span>E-Payment</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer opacity-60">
                      <input
                        type="radio"
                        name="payment_mode"
                        checked={paymentMode === "OTC"}
                        onChange={() => setPaymentMode("OTC")}
                        className="h-4 w-4 text-[#0a2558] focus:ring-[#0a2558]"
                      />
                      <span>Over The Counter (OTC)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer opacity-60">
                      <input
                        type="radio"
                        name="payment_mode"
                        checked={paymentMode === "NEFT"}
                        onChange={() => setPaymentMode("NEFT")}
                        className="h-4 w-4 text-[#0a2558] focus:ring-[#0a2558]"
                      />
                      <span>NEFT/RTGS</span>
                    </label>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded font-bold text-xs flex items-center gap-2 mt-4">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold rounded shadow-sm transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateChallan}
                    className="px-5 py-2.5 bg-[#1e3b6a] hover:bg-[#152a4e] text-white text-[11px] font-bold rounded shadow transition-colors cursor-pointer"
                  >
                    GENERATE CHALLAN
                  </button>
                </div>

              </div>
            )}

            {/* STATE 4: SUCCESS RECEIPT VIEW */}
            {currentStep === "receipt" && (
              <div className="space-y-6 flex-1">
                
                {/* Receipt Body Frame */}
                <div className="border border-[#cbd5e1] rounded bg-white shadow-sm max-w-2xl mx-auto p-6 relative">
                  
                  {/* Print watermark/header */}
                  <div className="border-b-2 border-slate-200 pb-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">✓</span>
                      <div>
                        <h3 className="font-extrabold text-[#0a2558] text-sm">TAX CHALLAN RECEIPT</h3>
                        <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Online E-Payment Receipt</p>
                      </div>
                    </div>
                    
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded uppercase tracking-wider">
                      Generated
                    </span>
                  </div>

                  {/* Receipt Details Grid */}
                  <div className="grid gap-y-3 gap-x-4 grid-cols-2 text-[11px] border-b border-slate-200 pb-4 mb-4">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[8px]">CPIN (14 Digits)</span>
                      <span className="text-slate-800 font-black">{cpin}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[8px]">Challan Date</span>
                      <span className="text-slate-800 font-bold">{getTodayDate()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[8px]">Challan Expiry Date</span>
                      <span className="text-slate-800 font-bold">{getExpiryDate()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[8px]">GSTIN</span>
                      <span className="text-[#0a2558] font-bold">09GDLCF7228G1YK</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[8px]">Taxpayer Name</span>
                      <span className="text-slate-800 font-bold uppercase">IICPA Private Limited</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[8px]">Payment Mode</span>
                      <span className="text-slate-800 font-bold">E-Payment</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold tracking-wider text-[8px]">Status</span>
                      <span className="text-emerald-600 font-black">PAID</span>
                    </div>
                  </div>

                  {/* Summary Table inside receipt */}
                  <div className="border border-[#cbd5e1] rounded overflow-hidden mb-6">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-[#cbd5e1] font-bold">
                          <th className="p-2 border-r border-[#cbd5e1]/30">Tax Head</th>
                          <th className="p-2 text-right border-r border-[#cbd5e1]/30">Tax (Rs.)</th>
                          <th className="p-2 text-right border-r border-[#cbd5e1]/30">Interest (Rs.)</th>
                          <th className="p-2 text-right">Total (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[#cbd5e1]">
                          <td className="p-2 font-semibold text-slate-700 border-r border-[#cbd5e1]/20 bg-slate-50/20">IGST</td>
                          <td className="p-2 text-right border-r border-[#cbd5e1]/20">50,000</td>
                          <td className="p-2 text-right border-r border-[#cbd5e1]/20">0</td>
                          <td className="p-2 text-right font-bold">50,000</td>
                        </tr>
                        <tr className="border-b border-[#cbd5e1]">
                          <td className="p-2 font-semibold text-slate-700 border-r border-[#cbd5e1]/20 bg-slate-50/20">CGST</td>
                          <td className="p-2 text-right border-r border-[#cbd5e1]/20">25,000</td>
                          <td className="p-2 text-right border-r border-[#cbd5e1]/20">0</td>
                          <td className="p-2 text-right font-bold">25,000</td>
                        </tr>
                        <tr className="border-b border-[#cbd5e1]">
                          <td className="p-2 font-semibold text-slate-700 border-r border-[#cbd5e1]/20 bg-slate-50/20">SGST</td>
                          <td className="p-2 text-right border-r border-[#cbd5e1]/20">25,000</td>
                          <td className="p-2 text-right border-r border-[#cbd5e1]/20">0</td>
                          <td className="p-2 text-right font-bold">25,000</td>
                        </tr>
                        <tr className="bg-slate-100 font-extrabold text-[11px]">
                          <td className="p-2 border-r border-[#cbd5e1]/20">Total</td>
                          <td className="p-2 text-right border-r border-[#cbd5e1]/20">1,00,000</td>
                          <td className="p-2 text-right border-r border-[#cbd5e1]/20">0</td>
                          <td className="p-2 text-right text-emerald-700">1,00,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Receipt Watermark note */}
                  <div className="text-[9px] text-slate-400 font-medium text-center">
                    This is a simulated computer-generated payment receipt and does not require physical signature.
                  </div>
                </div>

                {/* Receipt Actions */}
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => alert("Simulation printing interface successfully opened!")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded border border-slate-300 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={12} />
                    Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Receipt downloaded successfully as simulated PDF!")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded border border-slate-300 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={12} />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2 bg-[#0f3a9a] hover:bg-[#0a2558] text-white text-[11px] font-bold rounded shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    Start Over
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Inner Portal Footer */}
          <div className="bg-[#3e4f62] px-5 py-4 text-white text-[11px] border-t border-[#e2e8f0] w-full">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between opacity-80 font-medium w-full font-sans">
              <div>Ver. 2.1.2 Rel.2026</div>
              <div className="max-w-xl leading-relaxed text-center md:text-left">
                This portal can be best viewed in Firefox 45.0 and above, Chrome 48.0 and above.
              </div>
              <div>© 2026 Goods and Services Tax Network</div>
            </div>
          </div>

        </div>
      </div>
    );
  }
