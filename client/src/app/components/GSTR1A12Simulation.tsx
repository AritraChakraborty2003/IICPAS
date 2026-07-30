"use client";

import React, { useState } from "react";
import {
  FaCheckCircle,
  FaArrowLeft,
  FaGlobe,
  FaChevronDown,
  FaChevronUp,
  FaBell,
} from "react-icons/fa";
import { CheckCircle2, RotateCcw, RefreshCw, Wand2 } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "gstr1a_view" | "amend_search" | "amend_edit";

interface GSTR1A12SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-12 -> gst-gstr-1a-12 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-12";

const DEFAULT_COMPANY_NAME = "HP Cements Private Limited";
const DEFAULT_GSTIN = "07GDLCF7228G1YK";

// GSTR-1A "Add Record Details" tiles (non-interactive — this exercise is
// about the Amend Record Details section below).
const recordCards: { key: string; label: string }[] = [
  { key: "b2b", label: "4A, 4B, 6B, 6C - B2B, SEZ, DE Invoices" },
  { key: "b2c_large", label: "5 - B2C (Large) Invoices" },
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
];

// GSTR-1A "Amend Record Details" tiles. Only "9A - Amended B2B Invoices" is
// interactive for this exercise (Experiment 2 - amending a B2B invoice).
const amendCards: { key: string; label: string }[] = [
  { key: "amend_b2b", label: "9A - Amended B2B Invoices" },
  { key: "amend_b2c_large", label: "9A - Amended B2C ( Large ) Invoices" },
  { key: "amend_exports", label: "9A - Amended Exports Invoices" },
  { key: "amend_cdnr", label: "9C - Amended Credit/Debit Notes (Registered)" },
  { key: "amend_cdnur", label: "9C - Amended Credit/Debit Notes (Unregistered)" },
  { key: "amend_b2c_others", label: "10 - Amended B2C(Others)" },
  { key: "amend_advances_tax", label: "11A - Amended Tax Liability (Advances Received)" },
  { key: "amend_advances_adj", label: "11B - Amendment of Adjustment of Advances" },
  { key: "amend_eco", label: "14A - Amended Supplies made through ECO" },
  { key: "amend_9_5", label: "15A- Amended Supplies U/s 9(5)" },
];

const formatINR = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const parseAmount = (value: string) => {
  const cleaned = parseFloat(value.replace(/[₹,\s]/g, ""));
  return Number.isFinite(cleaned) ? cleaned : 0;
};

export default function GSTR1A12Simulation({
  onComplete,
}: GSTR1A12SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /gstin/i) || DEFAULT_GSTIN;

  // Admin-configured (Simulation Manager / Course editor) answer key for the
  // Amend B2B Invoice exercise. Never shown as a hint — only used to
  // validate what the student searches for / edits. There is no local
  // fallback for these: the answer key comes entirely from the "Invoice No",
  // "Old Taxable Value" and "New Taxable Value" credential fields set for
  // this slug in the Simulation Manager.
  const expectedInvoiceNo = findFieldValue(simConfig, /invoice.?no/i);
  const expectedOldTaxableValue = findFieldValue(simConfig, /old.*taxable/i);
  const expectedNewTaxableValue = findFieldValue(simConfig, /new.*taxable/i);
  const gstRatePct = (() => {
    const configured = findFieldValue(simConfig, /rate/i).replace(/[%\s]/g, "");
    const parsed = parseFloat(configured);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 18;
  })();
  const isExerciseConfigured = Boolean(
    expectedInvoiceNo && expectedOldTaxableValue && expectedNewTaxableValue
  );

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  // This exercise is only about the Amend B2B Invoice screen, so the
  // simulation opens directly on the GSTR-1A - Prepare Online view instead
  // of the GST portal welcome/period-search/returns-grid screens.
  const [step, setStep] = useState<Step>("gstr1a_view");
  const [amendOpen, setAmendOpen] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [amendedCount, setAmendedCount] = useState(0);

  // Amend - search form
  const [invoiceNo, setInvoiceNo] = useState("");
  const [searchError, setSearchError] = useState("");

  // Amend - edit form
  const [taxableValue, setTaxableValue] = useState("");
  const [previewGenerated, setPreviewGenerated] = useState(false);
  const [editError, setEditError] = useState("");

  const resetAmendForms = () => {
    setInvoiceNo("");
    setSearchError("");
    setTaxableValue("");
    setPreviewGenerated(false);
    setEditError("");
  };

  const handleRetry = () => {
    setStep("gstr1a_view");
    setAmendOpen(false);
    setShowSuccessOverlay(false);
    setAmendedCount(0);
    resetAmendForms();
  };

  const handleAmendTileClick = () => {
    resetAmendForms();
    setStep("amend_search");
  };

  const handleFillInvoiceNo = () => {
    if (!isExerciseConfigured) return;
    setSearchError("");
    setInvoiceNo(expectedInvoiceNo);
  };

  const handleAmendRecordSearch = () => {
    if (!isExerciseConfigured) {
      setSearchError(
        "This exercise hasn't been configured yet. Ask your admin to set the invoice number, old taxable value and new taxable value for this simulation in the Simulation Manager."
      );
      return;
    }
    if (!invoiceNo.trim()) {
      setSearchError("Please enter the invoice number.");
      return;
    }
    if (invoiceNo.trim().toUpperCase() !== expectedInvoiceNo.trim().toUpperCase()) {
      setSearchError("No matching invoice found for this invoice number. Please double-check and try again.");
      return;
    }
    setSearchError("");
    setTaxableValue(expectedOldTaxableValue);
    setPreviewGenerated(false);
    setEditError("");
    setStep("amend_edit");
  };

  const taxableNumber = parseAmount(taxableValue);
  const gstAmount = taxableNumber * (gstRatePct / 100);
  const totalInvoiceValue = taxableNumber + gstAmount;

  const oldTaxableNumber = parseAmount(expectedOldTaxableValue);
  const oldGstAmount = oldTaxableNumber * (gstRatePct / 100);
  const oldTotalInvoiceValue = oldTaxableNumber + oldGstAmount;

  const handleSavePreview = () => {
    if (!taxableValue.trim()) {
      setEditError("Please enter the revised taxable value.");
      return;
    }
    setEditError("");
    setPreviewGenerated(true);
  };

  const handleSubmitAmendment = () => {
    if (!previewGenerated) return;
    const isValid =
      Math.round(taxableNumber) === Math.round(parseAmount(expectedNewTaxableValue));
    if (!isValid) {
      setEditError(
        "The revised taxable value doesn't match this exercise. Please double-check and try again."
      );
      return;
    }
    setEditError("");
    setAmendedCount(1);
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
                    if (label === "Dashboard" || label === "Returns" || label === "GSTR-1A") {
                      setStep("gstr1a_view");
                    }
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

      {/* STEP 1: GSTR-1A - Prepare Online (Add / Amend Record Details) */}
      {step === "gstr1a_view" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-1A"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="bg-[#0a2558] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-extrabold text-[12px]">
                GSTR-1A - Amendment of outward supplies of goods or services for current
                tax period
              </span>
              <div className="flex items-center gap-2">
                <button className="bg-[#132f5e] hover:bg-[#0a2050] text-white text-[9.5px] font-bold uppercase px-3 py-1.5">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-2 text-[11px]">
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
                  <span className="font-bold text-slate-500">FY</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">2024-25</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Tax Period</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">June</span>
                </div>
              </div>
            </div>

            {/* Add Record Details (non-interactive for this exercise) */}
            <div className="bg-white border border-[#cbd5e1]">
              <div className="bg-[#1e3b6a] text-white px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">
                Add Record Details
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recordCards.map((card) => (
                  <div
                    key={card.key}
                    className="border border-[#cbd5e1] bg-white transition-all flex flex-col min-h-[110px] rounded overflow-hidden shadow-sm hover:border-slate-400"
                  >
                    <div className="bg-[#1e3b6a] text-white p-3 flex justify-between items-start min-h-[56px]">
                      <span className="font-extrabold text-[10px] leading-snug max-w-[85%]">
                        {card.label}
                      </span>
                      <FaCheckCircle className="text-emerald-400 shrink-0 bg-white rounded-full p-[1px] mt-0.5" size={13} />
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-center bg-slate-50/50">
                      <div className="text-xl font-black text-[#0a2558]">0</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amend Record Details (collapsible, 9A - Amended B2B Invoices is interactive) */}
            <div className="bg-white border border-[#cbd5e1]">
              <button
                onClick={() => setAmendOpen((v) => !v)}
                className="w-full bg-[#1e3b6a] text-white px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide flex items-center justify-between cursor-pointer"
              >
                Amend Record Details
                {amendOpen ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
              </button>
              {amendOpen && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                  {amendCards.map((card) => {
                    const isClickable = card.key === "amend_b2b";
                    const count = card.key === "amend_b2b" ? amendedCount : 0;
                    return (
                      <div
                        key={card.key}
                        onClick={isClickable ? handleAmendTileClick : undefined}
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
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
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
                Generate Summary
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 2: Amend B2B Invoice - search form */}
      {step === "amend_search" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-1A"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <button
              onClick={() => setStep("gstr1a_view")}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold uppercase text-[10px]"
            >
              <FaArrowLeft size={10} /> Back
            </button>

            <div className="bg-white border border-[#cbd5e1] p-5 text-[11px]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[#0a2558] font-bold text-[13px]">
                  9A - Amended B2B Invoices
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFillInvoiceNo}
                    disabled={!isExerciseConfigured}
                    title={
                      isExerciseConfigured
                        ? undefined
                        : "This exercise's answer key hasn't been set in the Simulation Manager yet."
                    }
                    className={`inline-flex items-center gap-1.5 font-bold uppercase text-[10.5px] px-3.5 py-2 rounded transition-colors ${
                      isExerciseConfigured
                        ? "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Wand2 size={12} />
                    Fill Detail
                  </button>
                  <span className="text-[10px] text-red-500 font-semibold">
                    <span className="text-red-500 font-bold">*</span> Indicates Mandatory Fields
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Financial Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value="2024-25"
                    disabled
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-slate-100 text-slate-600 text-[11px] outline-none font-semibold"
                  >
                    <option value="2024-25">2024-25</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Original Return Period <span className="text-red-500">*</span>
                  </label>
                  <select
                    value="June"
                    disabled
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-slate-100 text-slate-600 text-[11px] outline-none font-semibold"
                  >
                    <option value="June">June</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Invoice No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={invoiceNo}
                    onChange={(e) => {
                      setSearchError("");
                      setInvoiceNo(e.target.value);
                    }}
                    placeholder="Enter Invoice No"
                    className="w-full border-2 border-red-500 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {searchError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mt-4">
                  {searchError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-6">
                <button
                  onClick={() => setStep("gstr1a_view")}
                  className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleAmendRecordSearch}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Amend Record
                </button>
              </div>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 3: Amend B2B Invoice - edit taxable value & recalculate GST */}
      {step === "amend_edit" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-1A"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <button
              onClick={() => setStep("amend_search")}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold uppercase text-[10px]"
            >
              <FaArrowLeft size={10} /> Back
            </button>

            <div className="bg-[#0a2558] text-white px-4 py-2.5 font-extrabold text-[12px]">
              9A - Amended B2B Invoices - Invoice {expectedInvoiceNo || invoiceNo}
            </div>

            <div className="bg-white border border-[#cbd5e1] p-5 text-[11px] space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 text-slate-500 font-semibold bg-slate-50 border border-slate-200 rounded p-3">
                <div>
                  Original Taxable Value:{" "}
                  <span className="font-bold text-slate-800">{formatINR(oldTaxableNumber)}</span>
                </div>
                <div>
                  Original GST ({gstRatePct}%):{" "}
                  <span className="font-bold text-slate-800">{formatINR(oldGstAmount)}</span>
                </div>
                <div>
                  Original Invoice Value:{" "}
                  <span className="font-bold text-slate-800">{formatINR(oldTotalInvoiceValue)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-extrabold text-[10.5px]">
                    Taxable Value (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={taxableValue}
                    onChange={(e) => {
                      setEditError("");
                      setPreviewGenerated(false);
                      setTaxableValue(e.target.value);
                    }}
                    className="w-full border-2 border-red-500 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                  />
                </div>
              </div>

              {previewGenerated && (
                <div className="bg-[#e0f2fe] border border-[#bae6fd] rounded p-4 animate-fadeIn">
                  <h4 className="font-extrabold text-[#0369a1] text-[11px] uppercase tracking-wide mb-2">
                    System recalculates GST
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11.5px] text-[#0369a1]">
                    <div>
                      Taxable Value: <span className="font-bold">{formatINR(taxableNumber)}</span>
                    </div>
                    <div>
                      GST ({gstRatePct}%): <span className="font-bold">{formatINR(gstAmount)}</span>
                    </div>
                    <div>
                      Total Invoice Value:{" "}
                      <span className="font-bold">{formatINR(totalInvoiceValue)}</span>
                    </div>
                  </div>
                </div>
              )}

              {editError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setStep("amend_search")}
                  className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleSavePreview}
                  className="border-2 border-[#0f3a9a] bg-white hover:bg-slate-50 text-[#0f3a9a] font-bold uppercase text-[11px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Save &amp; Preview
                </button>
                <button
                  onClick={handleSubmitAmendment}
                  disabled={!previewGenerated}
                  className={`font-bold uppercase text-[11px] px-6 py-2 rounded transition-colors ${
                    previewGenerated
                      ? "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Submit
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
