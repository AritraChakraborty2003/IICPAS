"use client";

import React, { useState } from "react";
import { FaGlobe, FaChevronDown, FaBell } from "react-icons/fa";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step =
  | "gstr3b_view"
  | "payment_of_tax"
  | "create_challan"
  | "challan_generated"
  | "payment_summary";

interface GSTR1A18SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-18 -> gst-gstr-1a-18 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-18";

const DEFAULT_COMPANY_NAME = "HP Cements Private Limited";
const DEFAULT_GSTIN = "07GDLCF7228G1YK";

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

// Fixed liability for this exercise: Table 3.1 carries an IGST liability of
// ₹12,600 (on the ₹70,000 inter-state supply reported in Table 3.2) and no
// ITC is available in Table 4, so the entire liability must be set off in
// cash via a challan - that is the point of this "pay balance GST" exercise.
const IGST_LIABILITY = 12600;
const CGST_LIABILITY = 0;
const SGST_LIABILITY = 0;
const CESS_LIABILITY = 0;
const TOTAL_CHALLAN_AMOUNT = IGST_LIABILITY + CGST_LIABILITY + SGST_LIABILITY + CESS_LIABILITY;
const TOTAL_CHALLAN_AMOUNT_WORDS = "Twelve Thousand Six Hundred Rupees only";

const generateCpin = () =>
  `CLN${Math.floor(1000000000 + Math.random() * 8999999999)}`;

export default function GSTR1A18Simulation({
  onComplete,
}: GSTR1A18SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /gstin/i) || DEFAULT_GSTIN;
  // No hardcoded exercise brief - the "Experiment" instructions block is
  // entirely admin-controlled via the Simulation Manager's Banner Text
  // field for this slug, and simply doesn't render if left unset.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [step, setStep] = useState<Step>("gstr3b_view");

  const [isGstr3bSaved, setIsGstr3bSaved] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [showVarianceAlert, setShowVarianceAlert] = useState(false);

  const [showChallanSuccessBanner, setShowChallanSuccessBanner] = useState(false);
  const [challanGeneratedAt, setChallanGeneratedAt] = useState<Date | null>(null);
  const [cpin, setCpin] = useState(generateCpin);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);

  const handleRetry = () => {
    setStep("gstr3b_view");
    setIsGstr3bSaved(false);
    setShowSavedBanner(false);
    setShowVarianceAlert(false);
    setShowChallanSuccessBanner(false);
    setChallanGeneratedAt(null);
    setCpin(generateCpin());
    setTermsAccepted(false);
    setShowConfirmPayment(false);
  };

  const handleSaveGstr3b = () => {
    setIsGstr3bSaved(true);
    setShowSavedBanner(true);
  };

  const handleProceedToPayment = () => {
    if (!isGstr3bSaved) return;
    setShowVarianceAlert(true);
  };

  const handleVarianceAlertOk = () => {
    setShowVarianceAlert(false);
    setStep("payment_of_tax");
  };

  const handleCreateChallan = () => {
    setStep("create_challan");
  };

  const handleGenerateChallan = () => {
    setChallanGeneratedAt(new Date());
    setShowChallanSuccessBanner(true);
    setStep("challan_generated");
  };

  const handleMakePaymentClick = () => {
    if (!termsAccepted) return;
    setShowConfirmPayment(true);
  };

  const handleConfirmPaymentOk = () => {
    setShowConfirmPayment(false);
    setStep("payment_summary");
    onComplete?.();
  };

  const challanExpiry = challanGeneratedAt
    ? new Date(challanGeneratedAt.getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;

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
                    if (label === "Dashboard") setStep("gstr3b_view");
                    if (label === "Returns" || label === "GSTR-3B") setStep("gstr3b_view");
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

  const tiles: { key: string; label: string; values: { label: string; value: string }[] }[] = [
    {
      key: "outward",
      label: "3.1 Tax on outward and reverse charge inward supplies",
      values: [
        { label: "Integrated Tax", value: formatINR(IGST_LIABILITY) },
        { label: "Central Tax", value: "₹0.00" },
        { label: "State/UT Tax", value: "₹0.00" },
        { label: "CESS", value: "₹0.00" },
      ],
    },
    {
      key: "tds_tcs",
      label: "6.2 TDS/TCS Credit",
      values: [
        { label: "Integrated Tax", value: "₹0.00" },
        { label: "Central Tax", value: "₹0.00" },
        { label: "State/UT Tax", value: "₹0.00" },
        { label: "CESS", value: "₹0.00" },
      ],
    },
    {
      key: "interstate",
      label: "3.2 Inter-state supplies",
      values: [
        { label: "Taxable Value", value: "₹70,000" },
        { label: "Integrated Tax", value: formatINR(IGST_LIABILITY) },
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

  const challanRows: { code: string; tax: number }[] = [
    { code: "CGST(0005)", tax: CGST_LIABILITY },
    { code: "IGST(0008)", tax: IGST_LIABILITY },
    { code: "CESS(0009)", tax: CESS_LIABILITY },
    { code: "State SGST(0006)", tax: SGST_LIABILITY },
  ];

  const itcUtilizationRows = [
    { label: "Integrated Tax", payable: IGST_LIABILITY, cash: IGST_LIABILITY },
    { label: "Central Tax", payable: CGST_LIABILITY, cash: CGST_LIABILITY },
    { label: "State/UT Tax", payable: SGST_LIABILITY, cash: SGST_LIABILITY },
    { label: "CESS", payable: CESS_LIABILITY, cash: CESS_LIABILITY },
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
            <div className="p-5">
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

      {/* CONFIRM PAYMENT DIALOG */}
      {showConfirmPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1.5px] animate-fadeIn px-4">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="p-5">
              <p className="text-[13px] font-semibold text-slate-800">Confirm Payment?</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowConfirmPayment(false)}
                className="rounded px-4 py-2 text-[11px] font-bold uppercase text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentOk}
                className="rounded bg-[#0f3a9a] px-5 py-2 text-[11px] font-bold uppercase text-white hover:bg-[#0a2558] cursor-pointer transition-colors"
              >
                OK
              </button>
            </div>
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
              {tiles.map((tile) => (
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
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded transition-colors cursor-pointer"
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

      {/* STEP 2: 6.1 Payment of tax */}
      {step === "payment_of_tax" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-3B", "Payment of tax"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-[#0a2558] font-bold text-[14px]">6.1 Payment of tax</h2>
              <span className="text-[#0f3a9a] text-[11px] font-bold cursor-pointer hover:underline">Help</span>
            </div>

            <div className="bg-[#e0f2fe] border border-[#bae6fd] px-3 py-2 text-[#0369a1] text-[10.5px] font-semibold">
              The cash available as on date and ITC available (considering ITC of current tax
              period) are shown in this table.
            </div>

            <div className="bg-white border border-[#cbd5e1] overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold text-center">
                    <th className="border border-slate-200 p-2 text-left" rowSpan={2}>Description</th>
                    <th className="border border-slate-200 p-2" colSpan={5}>Cash Ledger Balance</th>
                    <th className="border border-slate-200 p-2" colSpan={4}>Credit Ledger Balance</th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-center">
                    <th className="border border-slate-200 p-2">Integrated Tax (₹)</th>
                    <th className="border border-slate-200 p-2">Central Tax (₹)</th>
                    <th className="border border-slate-200 p-2">State/UT Tax (₹)</th>
                    <th className="border border-slate-200 p-2">CESS (₹)</th>
                    <th className="border border-slate-200 p-2">Total (₹)</th>
                    <th className="border border-slate-200 p-2">Integrated Tax (₹)</th>
                    <th className="border border-slate-200 p-2">Central Tax (₹)</th>
                    <th className="border border-slate-200 p-2">State/UT Tax (₹)</th>
                    <th className="border border-slate-200 p-2">CESS (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {["Tax", "Interest", "Late Fees"].map((row) => (
                    <tr key={row}>
                      <td className="border border-slate-200 p-2 font-bold text-slate-700">{row}</td>
                      {Array.from({ length: 9 }).map((_, i) => (
                        <td key={i} className="border border-slate-200 p-1">
                          <input
                            disabled
                            value={row === "Tax" ? "0" : ""}
                            placeholder="0"
                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-[11px] bg-slate-50 text-slate-500 outline-none text-center"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#e0f2fe] border border-[#bae6fd] px-3 py-2 text-[#0369a1] text-[10.5px] font-semibold space-y-1">
              <p>
                System has auto-populated &quot;Tax to be paid through ITC&quot; fields with
                optimum utilization amounts based on provisions of the law relating to credit
                utilization. However, you may edit the ITC utilization. As you change ITC
                utilization, the cash to be paid will also changed.
              </p>
              <p>
                If available cash balance in Electronic cash ledger is not sufficient to offset
                the liabilities, additional cash required for paying liability is being reflected
                in the last column of the Table (Addition cash required). You may create challan
                for that amount directly by clicking on the &quot;Create Challan&quot; button.
              </p>
            </div>

            <div className="bg-[#e0f2fe] border border-[#bae6fd] px-3 py-2 text-[#0369a1] text-[10.5px] font-semibold">
              The ITC and Cash utilization information entered will only be available for 2 days.
              After expiry of 2 days, the suggested utilization shall be reverted to original
              system suggested utilization.
            </div>

            <div className="bg-white border border-[#cbd5e1] overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold text-center">
                    <th className="border border-slate-200 p-2 text-left" rowSpan={2}>Description</th>
                    <th className="border border-slate-200 p-2" rowSpan={2}>
                      Other than reverse charge Tax payable (₹)
                    </th>
                    <th className="border border-slate-200 p-2" colSpan={4}>Paid through ITC</th>
                    <th className="border border-slate-200 p-2" rowSpan={2}>
                      Other than reverse charge Tax to be paid in Cash (₹)
                    </th>
                    <th className="border border-slate-200 p-2" rowSpan={2}>
                      Reverse charge Tax payable (₹)
                    </th>
                    <th className="border border-slate-200 p-2" rowSpan={2}>
                      Reverse charge Tax to be paid in Cash (₹)
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-center">
                    <th className="border border-slate-200 p-2">Integrated Tax (₹)</th>
                    <th className="border border-slate-200 p-2">Central Tax (₹)</th>
                    <th className="border border-slate-200 p-2">State/UT Tax (₹)</th>
                    <th className="border border-slate-200 p-2">CESS (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {itcUtilizationRows.map((row) => (
                    <tr key={row.label}>
                      <td className="border border-slate-200 p-2 font-bold text-slate-700">{row.label}</td>
                      <td className="border border-slate-200 p-2 text-center bg-slate-50 text-slate-700 font-semibold">
                        {row.payable}
                      </td>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <td key={i} className="border border-slate-200 p-2 text-center bg-slate-50 text-slate-500 font-semibold">
                          0
                        </td>
                      ))}
                      <td className="border border-slate-200 p-2 text-center bg-slate-100 text-slate-800 font-bold">
                        {row.cash}
                      </td>
                      <td className="border border-slate-200 p-2 text-center bg-slate-50 text-slate-500 font-semibold">0</td>
                      <td className="border border-slate-200 p-2 text-center bg-slate-50 text-slate-500 font-semibold">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                onClick={() => setStep("gstr3b_view")}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Preview Draft GSTR-3B
              </button>
              <button
                onClick={handleCreateChallan}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Create Challan
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Make Payment/Post Credit to Ledger
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Proceed to File
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 3: Create Challan */}
      {step === "create_challan" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Payment", "Create Challan"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-6 border-b border-[#cbd5e1] text-[12px] font-bold">
              <span className="pb-2 border-b-2 border-[#0f3a9a] text-[#0f3a9a]">Create Challan</span>
              <span className="pb-2 text-slate-500 cursor-pointer hover:text-slate-700">Saved Challan</span>
              <span className="pb-2 text-slate-500 cursor-pointer hover:text-slate-700">Challan History</span>
            </div>

            <h3 className="text-[#0a2558] font-bold text-[13px]">Tax Liability</h3>

            <div className="bg-white border border-[#cbd5e1] overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold text-center">
                    <th className="border border-slate-200 p-2 text-left"></th>
                    <th className="border border-slate-200 p-2">Tax (₹)</th>
                    <th className="border border-slate-200 p-2">Interest (₹)</th>
                    <th className="border border-slate-200 p-2">Penalty (₹)</th>
                    <th className="border border-slate-200 p-2">Fees (₹)</th>
                    <th className="border border-slate-200 p-2">Other (₹)</th>
                    <th className="border border-slate-200 p-2">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {challanRows.map((row) => (
                    <tr key={row.code}>
                      <td className="border border-slate-200 p-2 font-bold text-slate-700">{row.code}</td>
                      <td className="border border-slate-200 p-1">
                        <input
                          disabled
                          value={row.tax}
                          className="w-full border border-red-300 rounded px-2 py-1.5 text-[11px] font-semibold text-center bg-white outline-none"
                        />
                      </td>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <td key={i} className="border border-slate-200 p-2 text-center bg-slate-50 text-slate-500 font-semibold">
                          0
                        </td>
                      ))}
                      <td className="border border-slate-200 p-2 text-center bg-slate-100 text-slate-800 font-bold">
                        {row.tax}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div>
                <span className="font-bold text-slate-700">Total Challan Amount: </span>
                <span className="font-bold text-slate-900">{formatINR(TOTAL_CHALLAN_AMOUNT)}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Total Challan Amount (In Words): </span>
                <span className="font-semibold text-slate-800">{TOTAL_CHALLAN_AMOUNT_WORDS}</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-700 mb-2">
                Payment Modes <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-col gap-1.5 text-[11px] font-semibold text-[#0f3a9a]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="paymentMode" checked readOnly className="accent-[#0f3a9a]" />
                  E-Payment
                </label>
                <span className="text-slate-500">Over The Counter</span>
                <span className="text-slate-500">NEFT/RTGS</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Edit Reason
              </button>
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={handleGenerateChallan}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Generate Challan
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 4: Generate Challan (challan generated + make payment) */}
      {step === "challan_generated" && challanGeneratedAt && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Payment", "Generate Challan"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            {showChallanSuccessBanner && (
              <div className="flex items-center justify-between bg-[#dcfce7] border border-[#bbf7d0] px-3 py-2 text-[#15803d] text-[11px] font-bold">
                <span>Challan successfully generated.</span>
                <button
                  type="button"
                  onClick={() => setShowChallanSuccessBanner(false)}
                  className="text-[#15803d]/70 hover:text-[#15803d] cursor-pointer font-bold"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}

            <h3 className="text-[#0f3a9a] font-bold text-[13px]">GST Challan</h3>
            <div className="bg-white border border-[#cbd5e1] p-4 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-[11px]">
              <div>
                <div className="text-slate-500 font-semibold">CPIN</div>
                <div className="text-slate-800 font-bold">{cpin}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Challan Generation Date</div>
                <div className="text-slate-800 font-bold">{challanGeneratedAt.toISOString()}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Challan Expiry Date</div>
                <div className="text-slate-800 font-bold">{challanExpiry?.toDateString()}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Mode of Payment</div>
                <div className="text-slate-800 font-bold">E-Payment</div>
              </div>
            </div>

            <h3 className="text-[#0f3a9a] font-bold text-[13px]">Details Of Taxpayer</h3>
            <div className="bg-white border border-[#cbd5e1] p-4 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-[11px]">
              <div>
                <div className="text-slate-500 font-semibold">GSTIN/Other Id</div>
                <div className="text-slate-800 font-bold">{gstin}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Email Address</div>
                <div className="text-slate-800 font-bold">cXXXXXXXXX@XXXXXXXom</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Mobile Number</div>
                <div className="text-slate-800 font-bold">8XXXXX0910</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Name</div>
                <div className="text-slate-800 font-bold">{companyName}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Address</div>
                <div className="text-slate-800 font-bold">XXXXXXXXXX Karnataka,560028</div>
              </div>
            </div>

            <h3 className="text-[#0f3a9a] font-bold text-[13px]">Reason For Challan</h3>
            <div className="bg-white border border-[#cbd5e1] p-4 text-[11px]">
              <div className="text-slate-500 font-semibold">Reason</div>
              <div className="text-slate-800 font-bold">Any other payment</div>
            </div>

            <h3 className="text-[#0f3a9a] font-bold text-[13px]">Details of Deposit</h3>
            <div className="bg-white border border-[#cbd5e1] overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold text-center">
                    <th className="border border-slate-200 p-2 text-left"></th>
                    <th className="border border-slate-200 p-2">Tax (₹)</th>
                    <th className="border border-slate-200 p-2">Interest (₹)</th>
                    <th className="border border-slate-200 p-2">Penalty (₹)</th>
                    <th className="border border-slate-200 p-2">Fees (₹)</th>
                    <th className="border border-slate-200 p-2">Other (₹)</th>
                    <th className="border border-slate-200 p-2">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {challanRows.map((row) => (
                    <tr key={row.code}>
                      <td className="border border-slate-200 p-2 font-bold text-slate-700">{row.code}</td>
                      <td className="border border-slate-200 p-2 text-center text-slate-800 font-semibold">{row.tax}</td>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <td key={i} className="border border-slate-200 p-2 text-center text-slate-500 font-semibold">0</td>
                      ))}
                      <td className="border border-slate-200 p-2 text-center bg-slate-50 text-slate-800 font-bold">{row.tax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[11px]">
              <span className="font-bold text-slate-700">Total Challan Amount: </span>
              <span className="font-bold text-slate-900">₹{TOTAL_CHALLAN_AMOUNT}/-</span>
            </div>

            <h3 className="text-[#0f3a9a] font-bold text-[13px]">Select Mode of E-Payment <span className="text-red-500">*</span></h3>
            <div className="bg-white border border-[#cbd5e1] p-4 flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex flex-col gap-1.5 text-[11px] font-semibold text-[#0f3a9a]">
                <span className="border-b-2 border-[#0f3a9a] pb-1 w-fit">Preferred Banks</span>
                <span className="text-slate-500">Net Banking</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1.5">
                  Please select a bank <span className="text-red-500">*</span>
                </p>
                <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-800 cursor-pointer">
                  <input type="radio" name="bank" checked readOnly className="accent-[#0f3a9a]" />
                  FINC DUMMY BANK
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="accent-[#0f3a9a]"
              />
              Terms and Conditions apply.
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                disabled
                className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
              >
                Download
              </button>
              <button
                onClick={handleMakePaymentClick}
                disabled={!termsAccepted}
                className={`font-bold uppercase text-[11px] px-5 py-2 rounded transition-colors ${
                  termsAccepted
                    ? "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Make Payment
              </button>
            </div>

            <div className="text-[10px] text-slate-500 space-y-1 pt-2">
              <p>
                If amount is deducted from bank account and not reflected in electronic cash
                ledger, you may raise grievance under Services&gt;Payments&gt;Grievance against
                payment(GST PMT-07)
              </p>
              <p>
                *Awaiting Bank Confirmation: For e-payment mode of payment, if the maker has made
                a transaction and checker approval is not communicated by bank to GST System.
              </p>
              <p>
                *Awaiting Bank Clearance: For OTC mode of payment, if bank has acknowledged the
                challan but remittance confirmation is not communicated by bank to GST System.
              </p>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 5: Payment Summary */}
      {step === "payment_summary" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Payment", "Payment Summary"])}

          <div className="flex-1 p-5 space-y-8 animate-fadeIn flex flex-col items-center">
            <div className="bg-white border border-[#cbd5e1] p-5 w-full max-w-2xl">
              <h3 className="text-[#0f3a9a] font-bold text-[13px] mb-3">Payment Summary</h3>
              <div className="bg-[#dcfce7] border border-[#bbf7d0] px-3 py-2 text-[#15803d] text-[11px] font-bold mb-3">
                Your Payment is successfully completed.
              </div>
              <p className="text-[11px] text-slate-700 mb-2">
                Tax Remittance of Rs. {TOTAL_CHALLAN_AMOUNT} via Bank Transaction ID{" "}
                <span className="font-bold">{cpin}</span> successfully completed.{" "}
                <span className="text-[#0f3a9a] font-bold underline cursor-pointer">View Receipt</span>
              </p>
              <p className="text-[11px] font-bold text-slate-800 mb-2">Thank You!</p>
              <p className="text-[11px] text-[#0f3a9a] font-bold underline cursor-pointer mb-4">
                Click here to view your Cash Ledger.
              </p>
              <button
                onClick={handleRetry}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Make Another Payment
              </button>
            </div>

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
          {footer}
        </div>
      )}
    </div>
  );
}
