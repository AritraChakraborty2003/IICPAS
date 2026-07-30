"use client";

import React, { useState } from "react";
import { FaGlobe, FaChevronDown, FaBell } from "react-icons/fa";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "gstr3b_view" | "payment" | "declare";

interface GSTR1A19SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-19 -> gst-gstr-1a-19 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-19";

const DEFAULT_COMPANY_NAME = "HP Cements Private Limited";
const DEFAULT_GSTIN = "07GDLCF7228G1YK";
const DEFAULT_OTP = "673767";
const IGST_LIABILITY = 12600;

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const generateCpin = () => {
  let digits = "";
  for (let i = 0; i < 10; i++) digits += Math.floor(Math.random() * 10);
  return `CLN${digits}`;
};

const generateAckNumber = () => {
  let digits = "";
  for (let i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10);
  return `AA${digits}B`;
};

export default function GSTR1A19Simulation({
  onComplete,
}: GSTR1A19SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const companyName = findFieldValue(simConfig, /compan/i) || DEFAULT_COMPANY_NAME;
  const gstin = findFieldValue(simConfig, /gstin/i) || DEFAULT_GSTIN;
  const otp = findFieldValue(simConfig, /otp/i) || DEFAULT_OTP;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [step, setStep] = useState<Step>("gstr3b_view");
  const [isGstr3bSaved, setIsGstr3bSaved] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [isChallanPaid, setIsChallanPaid] = useState(false);
  const [cpin, setCpin] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [declareError, setDeclareError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [ackNumber, setAckNumber] = useState("");

  const handleRetry = () => {
    setStep("gstr3b_view");
    setIsGstr3bSaved(false);
    setShowSavedBanner(false);
    setIsChallanPaid(false);
    setCpin("");
    setIsPaying(false);
    setDeclarationChecked(false);
    setDeclareError("");
    setShowOtpModal(false);
    setOtpInput("");
    setOtpError("");
    setShowSuccessOverlay(false);
    setAckNumber("");
  };

  const handleSaveGstr3b = () => {
    setIsGstr3bSaved(true);
    setShowSavedBanner(true);
  };

  const handleProceedToPayment = () => {
    if (!isGstr3bSaved) return;
    setStep("payment");
  };

  const handleCreateChallanAndPay = () => {
    setIsPaying(true);
    setTimeout(() => {
      setCpin(generateCpin());
      setIsChallanPaid(true);
      setIsPaying(false);
    }, 500);
  };

  const handleProceedToFile = () => {
    if (!isChallanPaid) return;
    setStep("declare");
  };

  const openOtpModal = () => {
    if (!declarationChecked) {
      setDeclareError("Please accept the declaration before filing.");
      return;
    }
    setDeclareError("");
    setOtpInput("");
    setOtpError("");
    setShowOtpModal(true);
  };

  const handleVerifyOtp = () => {
    if (otpInput.trim() !== otp) {
      setOtpError("Invalid OTP. Please try again.");
      return;
    }
    setShowOtpModal(false);
    setAckNumber(generateAckNumber());
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
                  onClick={() => setStep("gstr3b_view")}
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
        { label: "Taxable Value", value: "₹70,000" },
        { label: "Integrated Tax", value: formatINR(IGST_LIABILITY) },
      ],
    },
    {
      key: "itc",
      label: "4. Eligible ITC",
      values: [
        { label: "Integrated Tax", value: "0" },
        { label: "Central Tax", value: "0" },
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

      {/* SUCCESS OVERLAY (GREEN TICK, ARN & RETRY BUTTON) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] animate-fadeIn px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_15px_45px_rgba(71,198,90,0.4)] animate-scaleIn">
              <CheckCircle2 className="text-white" size={90} strokeWidth={2.5} />
            </div>
            <div className="max-w-sm text-white text-[12px] font-semibold">
              GSTR-3B of GSTIN - {gstin} for the Return Period - &apos;June&apos; - has been
              successfully filed. The Acknowledgment Reference Number is{" "}
              <span className="font-black">{ackNumber}</span>.
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

      {/* OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] px-4">
          <div className="w-full max-w-sm rounded bg-white p-5 shadow-2xl">
            <h3 className="text-[15px] font-bold text-[#0a2558] mb-3">
              Validate One Time Password (OTP)
            </h3>
            <div className="bg-[#ecfdf5] border border-[#86efac] text-[#166534] text-[10.5px] px-3 py-2.5 rounded mb-3">
              One-Time Password (OTP) has been sent to the email ID and mobile number of the
              Authorised Signatory registered at the GST Portal.
            </div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Enter One Time Password (OTP)
            </label>
            <input
              value={otpInput}
              onChange={(e) => {
                setOtpInput(e.target.value);
                setOtpError("");
              }}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-500 text-[12px]"
              maxLength={6}
            />
            {otpError && (
              <div className="mt-2 rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                {otpError}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setShowOtpModal(false)}
                className="flex-1 border border-slate-300 rounded px-3 py-2 text-[11px] font-bold uppercase text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                className="flex-1 bg-[#0f3a9a] hover:bg-[#0a2558] text-white rounded px-3 py-2 text-[11px] font-bold uppercase cursor-pointer"
              >
                Verify
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
                  <li>Click on &apos;Proceed to payment&apos; to offset your liabilities.</li>
                  <li>Create the challan and make payment to clear the cash liability.</li>
                  <li>After setting off liabilities, GSTR-3B can be filed by attaching DSC/EVC.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                onClick={handleSaveGstr3b}
                disabled={isGstr3bSaved}
                className={`font-bold uppercase text-[11px] px-5 py-2 rounded transition-colors ${
                  !isGstr3bSaved
                    ? "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Save GSTR3B
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
      {step === "payment" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-3B", "Payment of tax"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <h2 className="text-[#0a2558] font-bold text-[13px]">6.1 Payment of Tax</h2>

            <div className="bg-[#e0f2fe] border border-[#bae6fd] px-3 py-2 text-[#0369a1] text-[10.5px] font-semibold">
              The cash available as on date and ITC available are shown in this table. Net
              Integrated Tax of {formatINR(IGST_LIABILITY)} is payable in cash.
            </div>

            <div className="bg-white border border-[#cbd5e1] overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold">
                    <th className="border border-slate-200 p-2 text-left">Description</th>
                    <th className="border border-slate-200 p-2 text-left">Integrated Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">Central Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">State/UT Tax (₹)</th>
                    <th className="border border-slate-200 p-2 text-left">CESS (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                      Tax Payable
                    </td>
                    <td className="border border-slate-200 p-2 font-bold text-slate-800">
                      {IGST_LIABILITY.toLocaleString("en-IN")}
                    </td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-semibold">0</td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-semibold">0</td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-semibold">0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                      Paid through ITC
                    </td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-semibold">0</td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-semibold">0</td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-semibold">0</td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-semibold">0</td>
                  </tr>
                  <tr className="bg-slate-100">
                    <td className="border border-slate-200 p-2 font-extrabold text-slate-700">
                      Balance Payable in Cash
                    </td>
                    <td className="border border-slate-200 p-2 font-extrabold text-slate-800">
                      {IGST_LIABILITY.toLocaleString("en-IN")}
                    </td>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-600">0</td>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-600">0</td>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-600">0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isChallanPaid && (
              <div className="bg-[#dcfce7] border border-[#bbf7d0] px-3 py-2.5 text-[#15803d] text-[10.5px] font-semibold">
                Challan {cpin} generated and payment of {formatINR(IGST_LIABILITY)} completed
                successfully via FINC Dummy Bank. The amount has been posted to your Electronic
                Cash Ledger.
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                onClick={() => setStep("gstr3b_view")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateChallanAndPay}
                disabled={isChallanPaid || isPaying}
                className={`font-bold uppercase text-[11px] px-5 py-2 rounded transition-colors ${
                  isChallanPaid
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                }`}
              >
                {isPaying
                  ? "Processing..."
                  : isChallanPaid
                  ? "Payment Completed"
                  : "Create Challan & Make Payment"}
              </button>
              <button
                onClick={handleProceedToFile}
                disabled={!isChallanPaid}
                className={`font-bold uppercase text-[11px] px-5 py-2 rounded transition-colors ${
                  isChallanPaid
                    ? "bg-[#0f3a9a] hover:bg-[#0a2558] text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Proceed to File
              </button>
            </div>
          </div>
          {footer}
        </div>
      )}

      {/* STEP 3: Declaration & File with EVC */}
      {step === "declare" && (
        <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col">
          {navHeader}
          {breadcrumb(["Dashboard", "Returns", "GSTR-3B", "File Return"])}

          <div className="flex-1 p-5 space-y-4 animate-fadeIn">
            <h2 className="text-[#0a2558] font-bold text-[13px]">File Form GSTR-3B</h2>

            <div className="bg-white border border-[#cbd5e1] p-5 text-[11px] space-y-4">
              <label className="flex items-start gap-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => {
                    setDeclarationChecked(e.target.checked);
                    setDeclareError("");
                  }}
                  className="mt-0.5 h-4 w-4"
                />
                I hereby solemnly affirm and declare that the information given herein above is
                true and correct to the best of my/our knowledge and belief and nothing has been
                concealed therefrom.
              </label>

              {declarationChecked && (
                <div className="max-w-xs">
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Authorised Signatory <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 outline-none font-semibold">
                    <option>OWNER1</option>
                  </select>
                </div>
              )}

              {declareError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-red-600">
                  {declareError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setStep("payment")}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
                >
                  Back
                </button>
                <button
                  disabled
                  title="Not available in this simulation"
                  className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
                >
                  File GSTR-3B with DSC
                </button>
                <button
                  onClick={openOtpModal}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
                >
                  File GSTR-3B with EVC
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
