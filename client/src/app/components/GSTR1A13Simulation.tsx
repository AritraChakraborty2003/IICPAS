"use client";

import React, { useState } from "react";
import {
  FaCheckCircle,
  FaGlobe,
  FaChevronDown,
  FaBell,
} from "react-icons/fa";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "gstr1a_view" | "b2b_view" | "add_invoice_form";

interface GSTR1A13SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-13 -> gst-gstr-1a-13 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-13";

const DEFAULT_COMPANY_NAME = "HP Cements Private Limited";
const DEFAULT_GSTIN = "07GDLCF7228G1YK";

// Reference exercise data (Experiment 3 - Adding a Missed Invoice in
// GSTR-1A). These are validation-only fallbacks, overridden by the
// "Recipient GSTIN", "Invoice No", "Invoice Date" and "Total Invoice Value"
// credential fields an admin sets for this slug in the Simulation Manager /
// Course editor - never rendered in the banner.
const DEFAULT_RECIPIENT_GSTIN = "07DSNPS7282B1Z9";
const DEFAULT_INVOICE_NO = "UT24/10290";
const DEFAULT_INVOICE_DATE = "29/06/20XX";
const DEFAULT_TOTAL_INVOICE_VALUE = "5,90,000";
const DEFAULT_POS_STATE = "07-Delhi";

const posOptions = [
  "Select",
  "01-Jammu and Kashmir",
  "06-Haryana",
  "07-Delhi",
  "09-Uttar Pradesh",
  "27-Maharashtra",
  "29-Karnataka",
  "33-Tamil Nadu",
];

const recordCards: { key: string; label: string; clickable?: boolean }[] = [
  { key: "b2b", label: "4A, 4B, 6B, 6C - B2B, SEZ, DE Invoices", clickable: true },
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

const normalizeAmount = (value: string) => value.trim().replace(/[,\s₹]/g, "");
const normalizeText = (value: string) =>
  value.trim().replace(/[^0-9a-z]/gi, "").toUpperCase();

interface ProcessedInvoice {
  invoiceNo: string;
  invoiceDate: string;
  totalValue: string;
}

export default function GSTR1A13Simulation({
  onComplete,
}: GSTR1A13SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /^gstin$|own.*gstin|company.*gstin/i) || DEFAULT_GSTIN;

  // Admin-configured (Simulation Manager / Course editor) expected values for
  // the missed invoice. Never rendered in a banner - only used to validate
  // what the student types into the Add Invoice form.
  const expectedRecipientGstin =
    findFieldValue(simConfig, /recipient.*gstin|customer.*gstin/i) || DEFAULT_RECIPIENT_GSTIN;
  const expectedInvoiceNo =
    findFieldValue(simConfig, /invoice.*no|invoice.*number/i) || DEFAULT_INVOICE_NO;
  const expectedInvoiceDate =
    findFieldValue(simConfig, /invoice.*date/i) || DEFAULT_INVOICE_DATE;
  const expectedTotalValue =
    findFieldValue(simConfig, /total.*invoice.*value|total.*value/i) || DEFAULT_TOTAL_INVOICE_VALUE;
  const expectedPosState =
    findFieldValue(simConfig, /pos|place.*of.*supply/i) || DEFAULT_POS_STATE;

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  // This exercise (Experiment 3) is only about adding a missed invoice, so
  // the simulation opens straight on the GSTR-1A - Amendment record-details
  // screen instead of the GST portal welcome/period-search screens.
  const [step, setStep] = useState<Step>("gstr1a_view");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [processedInvoices, setProcessedInvoices] = useState<ProcessedInvoice[]>([]);
  const [saveError, setSaveError] = useState("");

  // Add Invoice form fields
  const [recipientGstin, setRecipientGstin] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [nameAsInMaster, setNameAsInMaster] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [pos, setPos] = useState("Select");
  const [totalInvoiceValue, setTotalInvoiceValue] = useState("");
  const [supplyType, setSupplyType] = useState("");

  const resetForm = () => {
    setRecipientGstin("");
    setRecipientName("");
    setNameAsInMaster("");
    setInvoiceNo("");
    setInvoiceDate("");
    setPos("Select");
    setTotalInvoiceValue("");
    setSupplyType("");
    setSaveError("");
  };

  const handleRetry = () => {
    setStep("gstr1a_view");
    setShowSuccessOverlay(false);
    setProcessedInvoices([]);
    resetForm();
  };

  const handleCardClick = (key: string) => {
    if (key === "b2b") setStep("b2b_view");
  };

  const formComplete =
    recipientGstin.trim() &&
    recipientName.trim() &&
    invoiceNo.trim() &&
    invoiceDate.trim() &&
    pos !== "Select" &&
    totalInvoiceValue.trim();

  const handleSaveInvoice = () => {
    if (!formComplete) {
      setSaveError("Please fill all mandatory fields.");
      return;
    }

    const isValid =
      normalizeText(recipientGstin) === normalizeText(expectedRecipientGstin) &&
      normalizeText(invoiceNo) === normalizeText(expectedInvoiceNo) &&
      normalizeText(invoiceDate) === normalizeText(expectedInvoiceDate) &&
      normalizeAmount(totalInvoiceValue) === normalizeAmount(expectedTotalValue) &&
      pos === expectedPosState;

    if (!isValid) {
      setSaveError(
        "The invoice details entered do not match this exercise. Please double-check the Recipient GSTIN, Invoice No., Invoice Date, POS and Total Invoice Value fields."
      );
      return;
    }

    setSaveError("");
    setProcessedInvoices([{ invoiceNo, invoiceDate, totalValue: totalInvoiceValue }]);
    setStep("b2b_view");
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
                    if (label === "Dashboard" || label === "Returns") setStep("gstr1a_view");
                    if (label === "GSTR-1" || label === "GSTR-1A") setStep("gstr1a_view");
                    if (label === "B2B") setStep("b2b_view");
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

      {/* STEP 1: GSTR-1A - Amendment record details view */}
      {step === "gstr1a_view" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-1A"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="bg-[#0d9488] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-extrabold text-[12px]">
                GSTR-1A - Amendment of outward supplies of goods or services for current
                tax period
              </span>
              <button className="bg-[#0b7a70] hover:bg-[#0a6a61] text-white text-[9.5px] font-bold uppercase px-3 py-1.5">
                Help
              </button>
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
                  <span className="font-bold text-slate-800">20XX-XX</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Tax Period</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">June</span>
                </div>
              </div>
            </div>

            {/* Add Record Details */}
            <div className="bg-white border border-[#cbd5e1]">
              <div className="bg-[#1e3b6a] text-white px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">
                Add Record Details
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recordCards.map((card) => (
                  <div
                    key={card.key}
                    onClick={() => handleCardClick(card.key)}
                    className={`border bg-white transition-all flex flex-col min-h-[110px] rounded overflow-hidden shadow-sm ${
                      card.clickable
                        ? "border-red-400 hover:border-red-500 cursor-pointer"
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
                      <div className="text-xl font-black text-[#0a2558]">
                        {card.key === "b2b" ? processedInvoices.length : 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 2: B2B - document wise details */}
      {step === "b2b_view" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-1", "B2B"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="bg-white border border-[#cbd5e1] p-4">
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
                  <span className="font-bold text-slate-500">Trade Name</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">{companyName}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#cbd5e1]">
              <div className="bg-[#0d9488] text-white px-4 py-2.5 flex items-center justify-between">
                <span className="font-extrabold text-[12px]">
                  4A, 4B, 6B, 6C - B2B, SEZ, DE Invoices
                </span>
                <button className="bg-[#0b7a70] hover:bg-[#0a6a61] text-white text-[9.5px] font-bold uppercase px-3 py-1.5">
                  Help
                </button>
              </div>

              <div className="flex border-b border-slate-200 text-[11px] font-bold">
                <div className="px-4 py-2.5 text-slate-500">Recipient wise count</div>
                <div className="px-4 py-2.5 text-[#0d9488] border-b-2 border-[#0d9488]">
                  Document wise details
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-[#0a2558] font-bold text-[12px] mb-3">
                  Processed Invoices
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10.5px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-slate-600 font-extrabold">
                        <th className="text-left py-2 pr-2">Invoice No.</th>
                        <th className="text-left py-2 pr-2">Invoice Date</th>
                        <th className="text-left py-2 pr-2">Total Invoice Value (₹)</th>
                        <th className="text-left py-2 pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-semibold">
                            No records added yet.
                          </td>
                        </tr>
                      ) : (
                        processedInvoices.map((inv) => (
                          <tr key={inv.invoiceNo} className="border-b border-slate-100">
                            <td className="py-2 pr-2 font-bold text-slate-800">{inv.invoiceNo}</td>
                            <td className="py-2 pr-2 text-slate-700">{inv.invoiceDate}</td>
                            <td className="py-2 pr-2 text-slate-700">{inv.totalValue}</td>
                            <td className="py-2 pr-2 text-emerald-600 font-bold">Saved</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setStep("gstr1a_view")}
                    className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("add_invoice_form")}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer"
                  >
                    Add Details
                  </button>
                </div>
              </div>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 3: B2B - Add Invoice form */}
      {step === "add_invoice_form" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-1", "B2B"])}

          <div className="flex-1 p-5 animate-fadeIn">
            <div className="bg-white border border-[#cbd5e1]">
              <div className="bg-[#0d9488] text-white px-4 py-2.5 font-extrabold text-[12px]">
                B2B - Add Invoice
              </div>

              <div className="p-5 space-y-5">
                <div className="text-right text-[10px] text-red-500 font-semibold pr-1">
                  <span className="text-red-500 font-bold">*</span> Indicates Mandatory Fields
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10.5px] font-semibold text-slate-700">
                  {[
                    "Deemed Exports",
                    "SEZ Supplies with payment",
                    "SEZ Supplies without payment",
                    "Supply attract Reverse Charge",
                    "Intra-State Supplies attracting IGST",
                  ].map((label) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-3.5 w-3.5" />
                      {label}
                    </label>
                  ))}
                </div>

                {saveError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold px-3 py-2 rounded">
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">
                      Recipient GSTIN/UIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={recipientGstin}
                      onChange={(e) => setRecipientGstin(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">
                      Recipient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">
                      Name as in Master
                    </label>
                    <input
                      value={nameAsInMaster}
                      onChange={(e) => setNameAsInMaster(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">
                      Invoice No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      placeholder="DD/MM/20XX"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px] flex items-center gap-1">
                      POS <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={pos}
                      onChange={(e) => setPos(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    >
                      {posOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">
                      Total Invoice Value (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={totalInvoiceValue}
                      onChange={(e) => setTotalInvoiceValue(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-extrabold text-[10.5px]">
                      Supply Type
                    </label>
                    <input
                      value={supplyType}
                      onChange={(e) => setSupplyType(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-[11px] outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSaveError("");
                      setStep("b2b_view");
                    }}
                    className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveInvoice}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
          {footer}
        </div>
      )}
    </div>
  );
}
