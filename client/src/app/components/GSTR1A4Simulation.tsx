"use client";

import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaArrowLeft,
  FaGlobe,
  FaChevronDown,
  FaChevronUp,
  FaBell,
  FaInfoCircle,
} from "react-icons/fa";
import { CheckCircle2, RotateCcw, RefreshCw, Wand2 } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step =
  | "dashboard"
  | "select_period"
  | "view_returns"
  | "gstr1_view"
  | "b2c_large_add";

interface GSTR1A4SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-4 -> gst-gstr-1a-4 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-4";

const DEFAULT_COMPANY_NAME = "HP Cements Private Limited";
const DEFAULT_GSTIN = "07GDLCF7228G1YK";
const DEFAULT_BANNER =
  "Add the B2C (Large) invoice using the details configured for this exercise in the Simulation Manager.";

const recordCards: { key: string; label: string }[] = [
  { key: "b2b", label: "4A, 4B, 6B, 6C - B2B Invoices" },
  { key: "b2c_large", label: "5A - B2C (Large) Invoices" },
  { key: "exports", label: "6A - Exports Invoices" },
  { key: "b2c_others", label: "7 - B2C (Others)" },
  { key: "nil_rated", label: "8A, 8B, 8C, 8D - Nil Rated Supplies" },
  { key: "cdnr", label: "9B - Credit / Debit Notes (Registered)" },
  { key: "cdnur", label: "9B - Credit / Debit Notes (Unregistered)" },
  { key: "advances_tax", label: "11A(1), 11A(2) - Tax Liability (Advances Received)" },
  { key: "advances_adj", label: "11B(1), 11B(2) - Adjustment of Advances" },
  { key: "hsn", label: "12 - HSN-wise summary of outward supplies" },
  { key: "documents", label: "13 - Documents Issued" },
  { key: "eco", label: "14 - Supplies made through ECO" },
  { key: "sec9_5", label: "15 - Supplies U/s 9(5)" },
];

const POS_OPTIONS = [
  "01-Jammu & Kashmir",
  "02-Himachal Pradesh",
  "03-Punjab",
  "06-Haryana",
  "07-Delhi",
  "08-Rajasthan",
  "09-Uttar Pradesh",
  "10-Bihar",
  "19-West Bengal",
  "21-Odisha",
  "22-Chhattisgarh",
  "23-Madhya Pradesh",
  "24-Gujarat",
  "27-Maharashtra",
  "29-Karnataka",
  "32-Kerala",
  "33-Tamil Nadu",
  "36-Telangana",
  "37-Andhra Pradesh",
];

const RATE_ROWS = ["0%", "0.1%", "0.25%", "1%", "1.5%", "3%", "5%", "7.5%", "12%", "18%", "28%"];
const DEFAULT_RATE_ROW = "18%";

const returnsCalendarStatuses = ["Filed", "Filed", "Filed", "Filed", "To be Filed"];

export default function GSTR1A4Simulation({
  onComplete,
}: GSTR1A4SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /gstin/i) || DEFAULT_GSTIN;
  const bannerText = simConfig?.bannerText || DEFAULT_BANNER;

  // Admin-configured (Simulation Manager / Course editor) expected invoice
  // values for the B2C (Large) - Add Invoice exercise. Never rendered in a
  // banner — only used to validate what the student types into the form.
  // There is no local fallback: this exercise's answer key comes entirely
  // from the "POS" / "Invoice Number" / "Invoice Date" / "Total Invoice
  // Value" / "Taxable Value" / "Rate" credential fields set for this slug in
  // the Simulation Manager.
  const expectedPos = findFieldValue(simConfig, /pos|place.*supply|state/i);
  const expectedInvoiceNo = findFieldValue(simConfig, /invoice.?no/i);
  const expectedInvoiceDate = findFieldValue(simConfig, /invoice.*date|date/i);
  const expectedTotalValue = findFieldValue(simConfig, /total.*value/i);
  const expectedTaxableValue = findFieldValue(simConfig, /taxable/i);
  const expectedRateRow = (() => {
    const configured = findFieldValue(simConfig, /rate/i).replace(/[%\s]/g, "");
    return configured ? `${configured}%` : DEFAULT_RATE_ROW;
  })();
  const isExerciseConfigured = Boolean(
    expectedPos && expectedInvoiceNo && expectedInvoiceDate && expectedTotalValue && expectedTaxableValue
  );

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  // This exercise is only about the B2C (Large) add-invoice screen, so the
  // simulation opens straight on the Returns grid (Dashboard > Returns)
  // instead of the GST portal welcome/period-search screens.
  const [step, setStep] = useState<Step>("view_returns");
  const [financialYear, setFinancialYear] = useState("20XX-XX");
  const [quarter, setQuarter] = useState("Quarter 1 (Apr - Jun)");
  const [period, setPeriod] = useState("Select");
  const [amendOpen, setAmendOpen] = useState(false);
  const [eInvoiceHistoryOpen, setEInvoiceHistoryOpen] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});

  // B2C (Large) - Add Invoice form state
  const [pos, setPos] = useState("Select");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [totalInvoiceValue, setTotalInvoiceValue] = useState("");
  const [rowTaxableValues, setRowTaxableValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (step !== "gstr1_view") setShowSuccessOverlay(false);
  }, [step]);

  const handleSearchClick = () => {
    if (period === "June") setStep("view_returns");
  };

  const resetInvoiceForm = () => {
    setPos("Select");
    setInvoiceNo("");
    setInvoiceDate("");
    setTotalInvoiceValue("");
    setRowTaxableValues({});
    setSaveError("");
  };

  const handleRetry = () => {
    setStep("view_returns");
    setPeriod("Select");
    setAmendOpen(false);
    setEInvoiceHistoryOpen(false);
    setShowSuccessOverlay(false);
    setRecordCounts({});
    resetInvoiceForm();
  };

  const handleFillDetail = () => {
    if (!isExerciseConfigured) return;
    setSaveError("");
    setPos(expectedPos);
    setInvoiceNo(expectedInvoiceNo);
    setInvoiceDate(expectedInvoiceDate);
    setTotalInvoiceValue(expectedTotalValue);
    setRowTaxableValues({ [expectedRateRow]: expectedTaxableValue });
  };

  const taxableAtApplicableRate = rowTaxableValues[expectedRateRow] || "";

  const b2cFormComplete =
    pos !== "Select" &&
    invoiceNo.trim() &&
    invoiceDate.trim() &&
    totalInvoiceValue.trim() &&
    taxableAtApplicableRate.trim();

  const handleSaveInvoice = () => {
    if (!isExerciseConfigured) {
      setSaveError(
        "This exercise hasn't been configured yet. Ask your admin to set the POS, invoice number, invoice date, taxable value and total invoice value for this simulation in the Simulation Manager."
      );
      return;
    }
    if (!b2cFormComplete) {
      setSaveError("Please fill all mandatory fields.");
      return;
    }
    const normalize = (value: string) => value.trim().replace(/[,\s]/g, "");
    const isValid =
      pos.trim().toLowerCase() === expectedPos.trim().toLowerCase() &&
      invoiceNo.trim().toUpperCase() === expectedInvoiceNo.trim().toUpperCase() &&
      invoiceDate.trim().toLowerCase() === expectedInvoiceDate.trim().toLowerCase() &&
      normalize(totalInvoiceValue) === normalize(expectedTotalValue) &&
      normalize(taxableAtApplicableRate) === normalize(expectedTaxableValue);

    if (!isValid) {
      setSaveError(
        "The invoice details entered do not match this exercise. Please double-check the POS, invoice number, invoice date, taxable value, and total invoice value."
      );
      return;
    }

    setSaveError("");
    setRecordCounts((prev) => ({ ...prev, b2c_large: 1 }));
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  const infoRows: [string, string][] = [
    ["GSTIN", gstin],
    ["Legal Name", companyName],
    ["Trade Name", companyName],
    ["FY", "20XX-XX"],
    ["Tax Period", "June"],
    ["Status", "Not Filed"],
    ["Due Date", "Jul 11 20XX"],
  ];

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
                    if (label === "Dashboard") setStep("dashboard");
                    if (label === "Returns") setStep("select_period");
                    if (label === "GSTR-1" || label === "GSTR-1/IFF") setStep("gstr1_view");
                    if (label === "B2CL") setStep("b2c_large_add");
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

      {/* Experiment Instruction Banner */}
      <div className="bg-[#e0f2fe] border-b border-[#bae6fd] px-6 py-2.5 text-[11px] font-bold text-[#0369a1] select-none shrink-0">
        {bannerText}
      </div>

      {/* STEP 0: Return Dashboard (Welcome screen) */}
      {step === "dashboard" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard"])}

          <div className="flex-1 p-5">
            <div className="bg-white border border-[#cbd5e1] p-6 grid gap-8 lg:grid-cols-[1fr_300px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-extrabold text-[#0a2558]">
                    Welcome {companyName} to GST Common Portal
                  </h2>
                  <span className="text-[10.5px] text-slate-500 font-semibold">
                    Currently logged in from IP: <span className="font-black">1.1.1.1</span>
                  </span>
                </div>

                <h3 className="text-[12px] font-extrabold text-slate-700 mb-2">
                  Returns Calendar (Last 5 return periods)
                </h3>
                <div className="grid grid-cols-[140px_repeat(5,1fr)] text-[10.5px] font-bold text-center border border-[#cbd5e1] mb-6">
                  <div className="bg-[#0a2558] text-white px-2 py-3 text-left">GSTR-1 / IFF</div>
                  {returnsCalendarStatuses.map((status, idx) => (
                    <div
                      key={`gstr1-${idx}`}
                      className={`px-2 py-3 border-l border-white/40 ${
                        status === "Filed" ? "bg-[#4caf82] text-white" : "bg-[#e8a33d] text-white"
                      }`}
                    >
                      {status}
                    </div>
                  ))}
                  <div className="bg-[#0a2558] text-white px-2 py-3 text-left">GSTR-3B</div>
                  {returnsCalendarStatuses.map((status, idx) => (
                    <div
                      key={`gstr3b-${idx}`}
                      className={`px-2 py-3 border-l border-white/40 ${
                        status === "Filed" ? "bg-[#4caf82] text-white" : "bg-[#e8a33d] text-white"
                      }`}
                    >
                      {status}
                    </div>
                  ))}
                </div>

                <div className="border border-slate-300 px-4 py-3 text-[10.5px] text-slate-600 mb-4">
                  You can navigate to your chosen page through navigation panel given below
                </div>

                <div className="border border-slate-300 px-4 py-3 text-[10.5px] font-semibold text-slate-700 mb-6">
                  Your address of Principal Place of Business is not Geocoded in our
                  records. Kindly click on continue to update the Geocoded Address.
                  Please note that the existing address of the Principal Place of
                  Business appearing in the GST system/Registration Certificate will not
                  be impacted.{" "}
                  <span className="inline-flex items-center gap-1 text-[#0f3a9a] font-bold cursor-pointer hover:underline">
                    Continue <FaInfoCircle size={10} />
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => setStep("select_period")}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-4 py-2.5 rounded cursor-pointer transition-colors"
                  >
                    Return Dashboard &gt;
                  </button>
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-bold uppercase text-[11px] px-4 py-2.5 rounded cursor-not-allowed"
                  >
                    Create Challan &gt;
                  </button>
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-bold uppercase text-[11px] px-4 py-2.5 rounded cursor-not-allowed"
                  >
                    View Notice(s) and Order(s) &gt;
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-bold uppercase text-[11px] px-4 py-2.5 rounded cursor-not-allowed"
                  >
                    Annual Return &gt;
                  </button>
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-bold uppercase text-[11px] px-4 py-2.5 rounded cursor-not-allowed"
                  >
                    Report ITC Reversal Opening Balance &gt;
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled
                    className="bg-slate-100 text-slate-400 font-bold uppercase text-[11px] px-4 py-2.5 rounded cursor-not-allowed"
                  >
                    Report RCM ITC Opening Balance &gt;
                  </button>
                </div>
                <div className="mt-4 text-[10.5px] font-bold text-slate-500">
                  Else Go to »{" "}
                  <button
                    disabled
                    className="ml-2 bg-slate-100 text-slate-400 font-bold uppercase text-[11px] px-4 py-2 rounded cursor-not-allowed"
                  >
                    Continue to Dashboard &gt;
                  </button>
                </div>
              </div>

              <div className="space-y-5 text-[11px]">
                <div>
                  <h4 className="font-extrabold text-[#0a2558] mb-1">{companyName}</h4>
                  <p className="font-mono font-bold text-slate-700 mb-2">{gstin}</p>
                  <span className="text-[#0f3a9a] font-bold cursor-pointer hover:underline">
                    View Profile &gt;
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0a2558] mb-2">Quick Links</h4>
                  <div className="space-y-1.5 text-[#0f3a9a] font-bold">
                    <p className="cursor-pointer hover:underline">Check Cash Balance</p>
                    <p className="cursor-pointer hover:underline">Liability ledger</p>
                    <p className="cursor-pointer hover:underline">Credit ledger</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {footer}
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

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <button
              onClick={() => setStep("select_period")}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold uppercase text-[10px]"
            >
              <FaArrowLeft size={10} /> Back
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[11px]">
              {/* GSTR1 - the target tile */}
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
                    onClick={() => setStep("gstr1_view")}
                    className="bg-white border-2 border-red-500 hover:bg-slate-50 text-slate-700 font-extrabold px-5 py-1.5 uppercase text-[9.5px] cursor-pointer"
                  >
                    View
                  </button>
                  <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
                    Download
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
                  <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
                    View
                  </button>
                  <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
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
                  <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
                    View
                  </button>
                  <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-4 py-1.5 uppercase text-[9.5px]">
                    Download
                  </button>
                </div>
              </div>

              {/* GSTR3B */}
              <div className="bg-white border border-[#cbd5e1] flex flex-col justify-between min-h-[170px]">
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
          {footer}
        </div>
      )}

      {/* STEP 3: GSTR-1/IFF record details view */}
      {step === "gstr1_view" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-1/IFF"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="bg-[#0d9488] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-extrabold text-[12px]">
                GSTR-1 - Details of outward supplies of goods or services
              </span>
              <div className="flex items-center gap-2">
                <button className="bg-[#0b7a70] hover:bg-[#0a6a61] text-white text-[9.5px] font-bold uppercase px-3 py-1.5">
                  E-Invoice Advisory
                </button>
                <button className="bg-[#0b7a70] hover:bg-[#0a6a61] text-white text-[9.5px] font-bold uppercase px-3 py-1.5">
                  Help
                </button>
                <button
                  className="bg-white/15 hover:bg-white/25 text-white p-1.5"
                  aria-label="Refresh"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#cbd5e1] p-4">
              <div className="flex justify-end mb-2">
                <span className="text-[10px] text-red-500 font-semibold">
                  <span className="text-red-500 font-bold">*</span> Indicates Mandatory Fields
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-2 text-[11px]">
                {infoRows.map(([label, value]) => (
                  <div key={label}>
                    <span className="font-bold text-slate-500">{label}</span>
                    <span className="text-slate-400"> - </span>
                    <span className="font-bold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1] px-3 py-2.5 rounded text-[11px]">
              Either summary has not been generated or details have been updated post
              last generation. Please generate GSTR-1 summary to enable Preview (summary
              PDF) and Submit/file.
            </div>

            {/* Add Record Details */}
            <div className="bg-white border border-[#cbd5e1]">
              <div className="bg-[#1e3b6a] text-white px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">
                Add Record Details
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recordCards.map((card) => {
                  const isClickable = card.key === "b2c_large";
                  const count = recordCounts[card.key] || 0;
                  return (
                    <div
                      key={card.key}
                      onClick={isClickable ? () => setStep("b2c_large_add") : undefined}
                      className={`border bg-white transition-all flex flex-col min-h-[110px] rounded overflow-hidden shadow-sm ${
                        isClickable
                          ? "cursor-pointer border-2 border-red-500 hover:shadow-md"
                          : "border-[#cbd5e1] hover:border-slate-400"
                      }`}
                    >
                      <div className="bg-[#1e3b6a] text-white p-3 flex justify-between items-start min-h-[56px]">
                        <span className="font-extrabold text-[10px] leading-snug max-w-[85%]">
                          {card.label}
                        </span>
                        <FaCheckCircle className="text-emerald-400 shrink-0 bg-white rounded-full p-[1px] mt-0.5" size={13} />
                      </div>
                      <div className="flex-1 p-3 flex items-center justify-center bg-slate-50/50">
                        <div className="text-xl font-black text-[#0a2558]">{count}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amend Record Details (collapsible) */}
            <div className="bg-white border border-[#cbd5e1]">
              <button
                onClick={() => setAmendOpen((v) => !v)}
                className="w-full bg-[#1e3b6a] text-white px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide flex items-center justify-between cursor-pointer"
              >
                Amend Record Details
                {amendOpen ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
              </button>
              {amendOpen && (
                <div className="p-4 bg-[#e0f2fe] text-[#0369a1] text-[10.5px] leading-relaxed">
                  The taxpayers for whom e-invoicing is not applicable may ignore the
                  sections/options related to e-invoice download. The downloaded file
                  would be blank in case taxpayer is not e-invoicing or when e-invoices
                  reported to IRP are yet to be processed by GST system.
                </div>
              )}
            </div>

            {/* E-Invoice Download History (collapsible) */}
            <div className="bg-white border border-[#cbd5e1]">
              <button
                onClick={() => setEInvoiceHistoryOpen((v) => !v)}
                className="w-full bg-[#1e3b6a] text-white px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide flex items-center justify-between cursor-pointer"
              >
                E-Invoice Download History
                {eInvoiceHistoryOpen ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
              </button>
              {eInvoiceHistoryOpen && (
                <div className="p-4 text-[10.5px] text-slate-500 text-center">
                  No download history available for this exercise.
                </div>
              )}
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
                Download details from e-invoices (Excel)
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Reset
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Proceed to File/Summary
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 4: B2C (Large) - Add Invoice form */}
      {step === "b2c_large_add" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-1", "B2CL"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <button
              onClick={() => setStep("gstr1_view")}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold uppercase text-[10px]"
            >
              <FaArrowLeft size={10} /> Back
            </button>

            <div className="bg-[#0d9488] text-white px-4 py-2.5 font-extrabold text-[12px]">
              B2C(Large) Invoices- Details
            </div>

            <div className="bg-white border border-[#cbd5e1] p-5 text-[11px]">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handleFillDetail}
                  className="inline-flex items-center gap-1.5 bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[10.5px] px-3.5 py-2 rounded cursor-pointer transition-colors"
                >
                  <Wand2 size={12} />
                  Fill Detail
                </button>
                <span className="text-[10px] text-red-500 font-semibold">
                  <span className="text-red-500 font-bold">*</span> Indicates Mandatory Fields
                </span>
              </div>

              <div className="flex items-start gap-2 mb-5 text-[10.5px] text-slate-600">
                <input type="checkbox" className="mt-0.5" disabled />
                <span>
                  Is the supply eligible to be taxed at a differential percentage (%) of
                  the existing rate of tax, as notified by the Government?
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px] flex items-center gap-1">
                    POS <FaInfoCircle size={9} className="text-slate-400" />
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={pos}
                    onChange={(e) => {
                      setSaveError("");
                      setPos(e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                  >
                    <option value="Select">Select</option>
                    {POS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Invoice No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={invoiceNo}
                    onChange={(e) => {
                      setSaveError("");
                      setInvoiceNo(e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={invoiceDate}
                    onChange={(e) => {
                      setSaveError("");
                      setInvoiceDate(e.target.value);
                    }}
                    placeholder="dd/mm/yyyy"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Supply Type
                  </label>
                  <input
                    disabled
                    value="Inter-State"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-slate-100 text-slate-500 text-[11px] outline-none font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Total Invoice Value (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={totalInvoiceValue}
                    onChange={(e) => {
                      setSaveError("");
                      setTotalInvoiceValue(e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                  />
                </div>
              </div>

              <h4 className="font-extrabold text-[#0f3a9a] text-[11.5px] mb-2">
                Item details
              </h4>
              <div className="overflow-x-auto border border-slate-300 mb-2">
                <table className="w-full text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold">
                      <th className="border border-slate-300 px-3 py-2 text-left">Rate (%)</th>
                      <th className="border border-slate-300 px-3 py-2 text-left">
                        Taxable value (₹) <span className="text-red-500">*</span>
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left">
                        Integrated Tax (₹) <span className="text-red-500">*</span>
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left">Cess (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RATE_ROWS.map((rateLabel) => {
                      const ratePct = parseFloat(rateLabel);
                      const taxableValue = rowTaxableValues[rateLabel] || "";
                      const taxableNumber = parseFloat(taxableValue.replace(/[,\s]/g, ""));
                      const integratedTax = Number.isFinite(taxableNumber)
                        ? Math.round(taxableNumber * (ratePct / 100))
                        : "";
                      return (
                        <tr key={rateLabel}>
                          <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-600">
                            {rateLabel}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5">
                            <input
                              value={taxableValue}
                              onChange={(e) => {
                                setSaveError("");
                                setRowTaxableValues((prev) => ({
                                  ...prev,
                                  [rateLabel]: e.target.value,
                                }));
                              }}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-[10.5px] outline-none"
                            />
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 bg-slate-100 text-slate-500">
                            {integratedTax}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 bg-slate-100" />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {saveError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-3">
                  {saveError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setStep("gstr1_view")}
                  className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveInvoice}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
          {footer}
        </div>
      )}
    </div>
  );
}
