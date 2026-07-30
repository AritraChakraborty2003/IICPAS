"use client";

import React, { useState } from "react";
import { FaGlobe, FaChevronDown, FaBell } from "react-icons/fa";
import { CheckCircle2, RotateCcw, RefreshCw } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "gstr3b_view" | "outward_edit";

interface GSTR1A15SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-15 -> gst-gstr-1a-15 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-15";

const DEFAULT_COMPANY_NAME = "HP Cements Private Limited";
const DEFAULT_GSTIN = "07GDLCF7228G1YK";

// Auto-populated (pre-existing, from GSTR-2B) figures for table 3.1 before
// the missing June invoice is added. These plus the invoice figures below
// are what the tile totals should equal once the exercise is done.
const DEFAULT_BASE_TAXABLE_VALUE = "531000";
const DEFAULT_BASE_INTEGRATED_TAX = "234620";

// Experiment 2: the invoice that was left out of GSTR-1 for June and needs
// to be folded into table 3.1's totals.
const DEFAULT_INVOICE_TAXABLE_VALUE = "100000";
const DEFAULT_INVOICE_IGST = "18000";

const formatINR = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const parseAmount = (value: string) => {
  const cleaned = parseFloat(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(cleaned) ? cleaned : 0;
};

export default function GSTR1A15Simulation({
  onComplete,
}: GSTR1A15SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /gstin/i) || DEFAULT_GSTIN;

  // Admin-configured (Simulation Manager / Course editor) answer key. Never
  // shown as a hint - only used to validate what the student enters. Falls
  // back to the figures called out in the exercise brief when nothing has
  // been configured for this slug yet.
  const baseTaxableValue =
    findFieldValue(simConfig, /base.*taxable/i) || DEFAULT_BASE_TAXABLE_VALUE;
  const baseIntegratedTax =
    findFieldValue(simConfig, /base.*(integrated|igst)/i) || DEFAULT_BASE_INTEGRATED_TAX;
  const invoiceTaxableValue =
    findFieldValue(simConfig, /invoice.*taxable/i) || DEFAULT_INVOICE_TAXABLE_VALUE;
  const invoiceIGST =
    findFieldValue(simConfig, /invoice.*(igst|integrated)/i) || DEFAULT_INVOICE_IGST;

  const expectedTotalTaxableValue = parseAmount(baseTaxableValue) + parseAmount(invoiceTaxableValue);
  const expectedTotalIntegratedTax = parseAmount(baseIntegratedTax) + parseAmount(invoiceIGST);

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [step, setStep] = useState<Step>("gstr3b_view");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [outwardConfirmed, setOutwardConfirmed] = useState(false);

  // 3.1 - Outward taxable supplies row (a) - left blank for the student to fill in
  const [totalTaxableValue, setTotalTaxableValue] = useState("");
  const [integratedTax, setIntegratedTax] = useState("");
  const [editError, setEditError] = useState("");

  const handleRetry = () => {
    setStep("gstr3b_view");
    setShowSuccessOverlay(false);
    setOutwardConfirmed(false);
    setTotalTaxableValue("");
    setIntegratedTax("");
    setEditError("");
  };

  const handleOpenOutwardTile = () => {
    setEditError("");
    setStep("outward_edit");
  };

  const handleConfirmOutward = () => {
    const isValid =
      Math.round(parseAmount(totalTaxableValue)) === Math.round(expectedTotalTaxableValue) &&
      Math.round(parseAmount(integratedTax)) === Math.round(expectedTotalIntegratedTax);
    if (!isValid) {
      setEditError(
        "The totals don't match this exercise yet. Add the invoice's taxable value and IGST to the auto-populated figures and try again."
      );
      return;
    }
    setEditError("");
    setOutwardConfirmed(true);
    setStep("gstr3b_view");
  };

  const handleSaveGstr3b = () => {
    if (!outwardConfirmed) return;
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
                    if (label === "Dashboard" || label === "Returns" || label === "GSTR3B") {
                      setStep("gstr3b_view");
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

  const outwardTileValues = outwardConfirmed
    ? [
        { label: "Integrated Tax", value: String(Math.round(expectedTotalIntegratedTax)) },
        { label: "Central Tax", value: "0" },
        { label: "State/UT Tax", value: "0" },
        { label: "CESS", value: "₹0.00" },
      ]
    : [
        { label: "Integrated Tax", value: "₹0.00" },
        { label: "Central Tax", value: "₹0.00" },
        { label: "State/UT Tax", value: "₹0.00" },
        { label: "CESS", value: "₹0.00" },
      ];

  const otherTiles: {
    key: string;
    label: string;
    values: { label: string; value: string }[];
  }[] = [
    {
      key: "tds_tcs",
      label: "6.2 TDS/TCS Credit",
      values: [
        { label: "Integrated Tax", value: "₹0.00" },
        { label: "Central Tax", value: "₹0.00" },
        { label: "State/UT Tax", value: "₹0.00" },
      ],
    },
    {
      key: "interstate",
      label: "3.2 Inter-state supplies",
      values: [
        { label: "Taxable Value", value: "₹70000" },
        { label: "Integrated Tax", value: "₹12600" },
      ],
    },
    {
      key: "eligible_itc",
      label: "4. Eligible ITC",
      values: [
        { label: "Integrated Tax", value: "0" },
        { label: "Central Tax", value: "0" },
        { label: "State/UT Tax", value: "0" },
        { label: "CESS", value: "₹0.00" },
      ],
    },
    {
      key: "exempt",
      label: "5. Exempt, nil and Non GST inward supplies",
      values: [
        { label: "Inter-state supplies", value: "₹0.00" },
        { label: "Intra-state supplies", value: "₹0.00" },
      ],
    },
    {
      key: "interest",
      label: "5.1 Interest and Late fee",
      values: [
        { label: "Integrated Tax", value: "₹0.00" },
        { label: "Central Tax", value: "₹0.00" },
        { label: "State/UT Tax", value: "₹0.00" },
        { label: "CESS", value: "₹0.00" },
      ],
    },
  ];

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

      {/* STEP 1: GSTR-3B - Monthly Return view */}
      {step === "gstr3b_view" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR3B"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <h2 className="text-[#0a2558] font-bold text-[14px]">GSTR-3B - Monthly Return</h2>

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
                  <span className="font-bold text-slate-500">Status</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-red-500">Not Filed</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">FY</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">2024-25</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Return Period</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">June</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Due Date</span>
                  <span className="text-slate-400"> - </span>
                  <span className="font-bold text-slate-800">Jul 20 20XX</span>
                </div>
              </div>
            </div>

            <div className="bg-[#e0f2fe] border border-[#bae6fd] px-3 py-2 text-[#0369a1] text-[10.5px] font-semibold">
              You have not filed GSTR-1 of the selected tax period. Please file the same to
              have auto-drafted liabilities in GSTR-3B from form GSTR-1.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 3.1 - interactive tile */}
              <div
                onClick={handleOpenOutwardTile}
                className={`bg-white flex flex-col rounded overflow-hidden shadow-sm cursor-pointer transition-all ${
                  outwardConfirmed ? "border border-[#cbd5e1]" : "border-2 border-red-500 hover:shadow-md"
                }`}
              >
                <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[10.5px] leading-snug min-h-[56px] flex items-center">
                  3.1 Tax on outward and reverse charge inward supplies
                </div>
                <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  {outwardTileValues.map((v) => (
                    <div key={v.label}>
                      <div className="text-slate-500 font-semibold">{v.label}</div>
                      <div className="text-slate-800 font-bold">{v.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {otherTiles.map((tile) => (
                <div
                  key={tile.key}
                  className="bg-white border border-[#cbd5e1] flex flex-col rounded overflow-hidden shadow-sm"
                >
                  <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[10.5px] leading-snug min-h-[56px] flex items-center">
                    {tile.label}
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    {tile.values.map((v) => (
                      <div key={v.label}>
                        <div className="text-slate-500 font-semibold">{v.label}</div>
                        <div className="text-slate-800 font-bold">{v.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1e3b6a] text-white">
              <div className="text-center font-bold text-[11px] py-2 border-b border-white/10">
                Important Message
              </div>
              <div className="p-4 text-[10.5px] leading-relaxed space-y-1">
                <p>Once you have filled the relevant tables, please follow the following steps for filing:-</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Please click on &apos;Save GSTR3B&apos; on the summary page.</li>
                  <li>You may download and preview/save the draft GSTR-3B.</li>
                  <li>Click on &apos;Proceed to payment&apos; to offset your liabilities.</li>
                  <li>
                    In case of insufficient cash balance to set off the liabilities, challan
                    creation facility has been provided on the same screen.
                  </li>
                  <li>After setting off liabilities, GSTR-3B can be filed by attaching DSC/EVC.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Back
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                GSTR-3B System Computed (PDF)
              </button>
              <button
                onClick={handleSaveGstr3b}
                disabled={!outwardConfirmed}
                className={`font-bold uppercase text-[11px] px-5 py-2 rounded transition-colors ${
                  outwardConfirmed
                    ? "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                    : "bg-[#0f3a9a]/40 text-white cursor-not-allowed"
                }`}
              >
                Save GSTR3B
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Preview Draft GSTR-3B
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 2: 3.1 Details of Outward Supplies and inward supplies liable to reverse charge */}
      {step === "outward_edit" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR3B", "Outward and Reverse Charge Inward"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-[#0a2558] font-bold text-[13px]">
                3.1 Details of Outward Supplies and inward supplies liable to reverse charge
              </h2>
            </div>

            <div className="bg-white border border-[#cbd5e1] overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold">
                    <th className="border border-slate-200 p-2 text-left w-1/4">Nature of Supplies</th>
                    <th className="border border-slate-200 p-2 text-left">Total Taxable value (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">Integrated Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">Central Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">State/UT Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">CESS (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                      (a) Outward taxable supplies (other than zero rated, nil rated and
                      exempted)
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        value={totalTaxableValue}
                        onChange={(e) => {
                          setEditError("");
                          setTotalTaxableValue(e.target.value);
                        }}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-[11px] font-semibold outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        value={integratedTax}
                        onChange={(e) => {
                          setEditError("");
                          setIntegratedTax(e.target.value);
                        }}
                        className="w-full border-2 border-red-500 rounded px-2 py-1.5 text-[11px] font-semibold outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 p-2 bg-slate-50 text-slate-600 font-semibold">
                      ₹0
                    </td>
                    <td className="border border-slate-200 p-2 bg-slate-50 text-slate-600 font-semibold">
                      ₹0
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        disabled
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                      (b) Outward taxable supplies (zero rated )
                    </td>
                    <td className="border border-slate-200 p-1" colSpan={2}>
                      <input
                        disabled
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 bg-slate-100" colSpan={2} />
                    <td className="border border-slate-200 p-1">
                      <input
                        disabled
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                      (c) Other outward supplies (Nil rated, exempted)
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        disabled
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 bg-slate-100" colSpan={3} />
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                      (d) Inward supplies (liable to reverse charge)
                    </td>
                    <td className="border border-slate-200 p-1" colSpan={4}>
                      <div className="grid grid-cols-4 gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <input
                            key={i}
                            disabled
                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                      (e) Non-GST outward supplies
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        disabled
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 bg-slate-100" colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>

            {editError && (
              <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setStep("gstr3b_view")}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-6 py-2 rounded cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOutward}
                className="border-2 border-red-500 bg-white hover:bg-slate-50 text-[#0f3a9a] font-bold uppercase text-[11px] px-6 py-2 rounded cursor-pointer transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}
    </div>
  );
}
