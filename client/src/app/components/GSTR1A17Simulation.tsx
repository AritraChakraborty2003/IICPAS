"use client";

import React, { useState } from "react";
import { FaGlobe, FaChevronDown, FaBell } from "react-icons/fa";
import { CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "gstr3b_view" | "eligible_itc_edit";

interface GSTR1A17SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-17 -> gst-gstr-1a-17 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-17";

const DEFAULT_COMPANY_NAME = "HP Cements Private Limited";
const DEFAULT_GSTIN = "07GDLCF7228G1YK";

const formatINR = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const parseAmount = (value: string) => {
  const cleaned = parseFloat(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(cleaned) ? cleaned : 0;
};

export default function GSTR1A17Simulation({
  onComplete,
}: GSTR1A17SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /gstin/i) || DEFAULT_GSTIN;
  // No hardcoded exercise brief - the "Experiment" instructions block is
  // entirely admin-controlled via the Simulation Manager's Banner Text
  // field for this slug, and simply doesn't render if left unset.
  const bannerText = simConfig?.bannerText || "";

  // Admin-configured (Simulation Manager / Course editor) answer key for the
  // "5. All other ITC" row of the Eligible ITC exercise. Never shown as a
  // hint, never hardcoded with a local fallback - only used to validate what
  // the student enters. The answer key comes entirely from the "Central Tax"
  // and "State/UT Tax" (and optional "Integrated Tax") credential fields set
  // for this slug in the Simulation Manager.
  const expectedCentralTax = findFieldValue(simConfig, /central.*tax/i);
  const expectedStateTax = findFieldValue(simConfig, /state.*tax|sgst/i);
  const expectedIntegratedTax = findFieldValue(simConfig, /integrated.*tax|igst/i);
  const isExerciseConfigured = Boolean(expectedCentralTax && expectedStateTax);

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [step, setStep] = useState<Step>("gstr3b_view");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [itcConfirmed, setItcConfirmed] = useState(false);
  const [isGstr3bSaved, setIsGstr3bSaved] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [showVarianceAlert, setShowVarianceAlert] = useState(false);

  // 4. Eligible ITC - row (5) All other ITC
  const [integratedTax, setIntegratedTax] = useState("");
  const [centralTax, setCentralTax] = useState("");
  const [stateTax, setStateTax] = useState("");
  const [editError, setEditError] = useState("");

  const resetForm = () => {
    setIntegratedTax("");
    setCentralTax("");
    setStateTax("");
    setEditError("");
  };

  const handleRetry = () => {
    setStep("gstr3b_view");
    setShowSuccessOverlay(false);
    setItcConfirmed(false);
    setIsGstr3bSaved(false);
    setShowSavedBanner(false);
    setShowVarianceAlert(false);
    resetForm();
  };

  const handleOpenEligibleItcTile = () => {
    setEditError("");
    setStep("eligible_itc_edit");
  };

  const handleFillDetail = () => {
    if (!isExerciseConfigured) return;
    setEditError("");
    setIntegratedTax(expectedIntegratedTax || "0");
    setCentralTax(expectedCentralTax);
    setStateTax(expectedStateTax);
  };

  const handleConfirmEligibleItc = () => {
    if (!isExerciseConfigured) {
      setEditError(
        "This exercise hasn't been configured yet. Ask your admin to set the Central Tax and State/UT Tax (and optionally Integrated Tax) for this simulation in the Simulation Manager."
      );
      return;
    }
    const isValid =
      Math.round(parseAmount(centralTax)) === Math.round(parseAmount(expectedCentralTax)) &&
      Math.round(parseAmount(stateTax)) === Math.round(parseAmount(expectedStateTax)) &&
      Math.round(parseAmount(integratedTax)) === Math.round(parseAmount(expectedIntegratedTax || "0"));
    if (!isValid) {
      setEditError(
        "The ITC entered under ‘All other ITC’ doesn't match this exercise yet. Please double-check the amounts and try again."
      );
      return;
    }
    setEditError("");
    setItcConfirmed(true);
    setStep("gstr3b_view");
  };

  const handleSaveGstr3b = () => {
    if (!itcConfirmed) return;
    setIsGstr3bSaved(true);
    setShowSavedBanner(true);
  };

  const handleProceedToPayment = () => {
    if (!isGstr3bSaved) return;
    setShowVarianceAlert(true);
  };

  const handleVarianceAlertOk = () => {
    setShowVarianceAlert(false);
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  const netItc =
    parseAmount(integratedTax) + parseAmount(centralTax) + parseAmount(stateTax);

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
                    if (label === "Dashboard" || label === "Returns" || label === "GSTR-3B") {
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

  const eligibleItcTileValues = itcConfirmed
    ? [
        { label: "Integrated Tax", value: String(Math.round(parseAmount(integratedTax))) },
        { label: "Central Tax", value: String(Math.round(parseAmount(centralTax))) },
        { label: "State/UT Tax", value: String(Math.round(parseAmount(stateTax))) },
        { label: "CESS", value: "₹0.00" },
      ]
    : [
        { label: "Integrated Tax", value: "0" },
        { label: "Central Tax", value: "0" },
        { label: "State/UT Tax", value: "0" },
        { label: "CESS", value: "₹0.00" },
      ];

  const otherTiles: {
    key: string;
    label: string;
    values: { label: string; value: string }[];
  }[] = [
    {
      key: "outward",
      label: "3.1 Tax on outward and reverse charge inward supplies",
      values: [
        { label: "Integrated Tax", value: "₹0.00" },
        { label: "Central Tax", value: "₹0.00" },
      ],
    },
    {
      key: "tds_tcs",
      label: "6.2 TDS/TCS Credit",
      values: [
        { label: "Integrated Tax", value: "₹0.00" },
        { label: "Central Tax", value: "₹0.00" },
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

      {/* RULE 36(4) ITC VARIANCE ALERT */}
      {showVarianceAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1.5px] animate-fadeIn px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start gap-3 p-5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="text-amber-600" size={18} />
              </div>
              <p className="text-[12.5px] leading-relaxed text-slate-700">
                The information entered by you is in variance with the auto-populated data.
                The input tax credit has been auto-populated on the basis of the GSTR-2B
                generated for you. Also, please note that any variance above 5% of the input
                tax credit is in contravention to Rule 36(4) of the CGST Rules, 2017. Kindly
                recheck and proceed.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowVarianceAlert(false)}
                className="rounded px-4 py-2 text-[11px] font-bold uppercase text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVarianceAlertOk}
                className="rounded bg-[#0f3a9a] px-5 py-2 text-[11px] font-bold uppercase text-white hover:bg-[#0a2558] cursor-pointer transition-colors"
              >
                OK
              </button>
            </div>
          </div>
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

      {/* Admin-configured (Simulation Manager) experiment brief - not
          rendered at all if the admin hasn't set a banner for this slug. */}
      {bannerText && (
        <div className="bg-[#e0f2fe] border-b border-[#bae6fd] px-6 py-2.5 text-[11px] font-bold text-[#0369a1] select-none shrink-0">
          {bannerText}
        </div>
      )}

      {/* STEP 1: GSTR-3B - Monthly Return view */}
      {step === "gstr3b_view" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-3B"])}

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

            {showSavedBanner && (
              <div className="flex items-center justify-between bg-[#dcfce7] border border-[#bbf7d0] px-3 py-2 text-[#15803d] text-[10.5px] font-semibold">
                <span>GSTR3B details saved successfully.</span>
                <button
                  type="button"
                  onClick={() => setShowSavedBanner(false)}
                  className="text-[#15803d]/70 hover:text-[#15803d] cursor-pointer font-bold"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {otherTiles.slice(0, 2).map((tile) => (
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

              {otherTiles.slice(2, 3).map((tile) => (
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

              {/* 4. Eligible ITC - interactive tile */}
              <div
                onClick={handleOpenEligibleItcTile}
                className={`bg-white flex flex-col rounded overflow-hidden shadow-sm cursor-pointer transition-all ${
                  itcConfirmed ? "border border-[#cbd5e1]" : "border-2 border-red-500 hover:shadow-md"
                }`}
              >
                <div className="bg-[#1e3b6a] text-white p-3 font-extrabold text-[10.5px] leading-snug min-h-[56px] flex items-center">
                  4. Eligible ITC
                </div>
                <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  {eligibleItcTileValues.map((v) => (
                    <div key={v.label}>
                      <div className="text-slate-500 font-semibold">{v.label}</div>
                      <div className="text-slate-800 font-bold">{v.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {otherTiles.slice(3).map((tile) => (
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
                disabled={!itcConfirmed}
                className={`font-bold uppercase text-[11px] px-5 py-2 rounded transition-colors ${
                  itcConfirmed
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
                onClick={handleProceedToPayment}
                disabled={!isGstr3bSaved}
                className={`font-bold uppercase text-[11px] px-5 py-2 rounded transition-colors ${
                  isGstr3bSaved
                    ? "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Proceed to Payment
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 2: 4. Eligible ITC table */}
      {step === "eligible_itc_edit" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-3B", "Eligible ITC"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-[#0a2558] font-bold text-[13px]">4. Eligible ITC</h2>
              <button
                type="button"
                onClick={handleFillDetail}
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
                Fill Detail
              </button>
            </div>

            <div className="bg-[#e0f2fe] border border-[#bae6fd] px-3 py-2 text-[#0369a1] text-[10.5px] font-semibold">
              Tables 4(A)(1), (3), (4), (5) and 4(B)(2) are auto-drafted based on the values in
              GSTR-2B.
            </div>

            <div className="bg-white border border-[#cbd5e1] overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold">
                    <th className="border border-slate-200 p-2 text-left w-1/3">Details</th>
                    <th className="border border-slate-200 p-2 text-left">Integrated Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">Central Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">State/UT Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">CESS (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2 font-extrabold text-slate-700" colSpan={5}>
                      (A) ITC Available (whether in full or part)
                    </td>
                  </tr>
                  {[
                    { label: "(1) Import of goods", cols: 1 },
                    { label: "(2) Import of services", cols: 1 },
                    { label: "(3) Inward supplies liable to reverse charge (other than 1 & 2 above)", cols: 3 },
                    { label: "(4) Inward supplies from ISD", cols: 3 },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="border border-slate-200 p-2 text-slate-700">{row.label}</td>
                      {Array.from({ length: row.cols }).map((_, i) => (
                        <td key={i} className="border border-slate-200 p-2 bg-slate-50 text-slate-600 font-semibold">
                          0
                        </td>
                      ))}
                      {Array.from({ length: 4 - row.cols }).map((_, i) => (
                        <td key={`b-${i}`} className="border border-slate-200 p-1">
                          <input
                            disabled
                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Row 5 - the editable target of this exercise */}
                  <tr>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                      (5) All other ITC
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        value={integratedTax}
                        onChange={(e) => {
                          setEditError("");
                          setIntegratedTax(e.target.value);
                        }}
                        placeholder="0"
                        className="w-full border-2 border-red-500 rounded px-2 py-1.5 text-[11px] font-semibold outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        value={centralTax}
                        onChange={(e) => {
                          setEditError("");
                          setCentralTax(e.target.value);
                        }}
                        placeholder="0"
                        className="w-full border-2 border-red-500 rounded px-2 py-1.5 text-[11px] font-semibold outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        value={stateTax}
                        onChange={(e) => {
                          setEditError("");
                          setStateTax(e.target.value);
                        }}
                        placeholder="0"
                        className="w-full border-2 border-red-500 rounded px-2 py-1.5 text-[11px] font-semibold outline-none"
                      />
                    </td>
                    <td className="border border-slate-200 p-1">
                      <input
                        disabled
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-slate-200 p-2 font-extrabold text-slate-700" colSpan={5}>
                      (B) ITC Reversed
                    </td>
                  </tr>
                  {["(1) As per Rule 42 & 43 of CGST/SGST rules", "(2) Others"].map((label) => (
                    <tr key={label}>
                      <td className="border border-slate-200 p-2 text-slate-700">{label}</td>
                      {[0, 1, 2].map((i) => (
                        <td key={i} className="border border-slate-200 p-2 bg-slate-50 text-slate-600 font-semibold">
                          0
                        </td>
                      ))}
                      <td className="border border-slate-200 p-1">
                        <input
                          disabled
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                        />
                      </td>
                    </tr>
                  ))}

                  <tr>
                    <td className="border border-slate-200 p-2 font-extrabold text-slate-700">
                      (C) Net ITC Available (A) - (B)
                    </td>
                    {[0, 1, 2].map((i) => (
                      <td key={i} className="border border-slate-200 p-2 bg-slate-100 text-slate-600 font-semibold">
                        {i === 1 ? formatINR(netItc).replace("₹", "") : "0"}
                      </td>
                    ))}
                    <td className="border border-slate-200 bg-slate-100" />
                  </tr>

                  <tr>
                    <td className="border border-slate-200 p-2 font-extrabold text-slate-700" colSpan={5}>
                      (D) Ineligible ITC
                    </td>
                  </tr>
                  {["(1) As per section 17(5)", "(2) Others"].map((label) => (
                    <tr key={label}>
                      <td className="border border-slate-200 p-2 text-slate-700">{label}</td>
                      {[0, 1, 2, 3].map((i) => (
                        <td key={i} className="border border-slate-200 p-1">
                          <input
                            disabled
                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
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
                onClick={handleConfirmEligibleItc}
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
