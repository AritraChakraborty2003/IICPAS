"use client";

import React, { useEffect, useState } from "react";
import { FaGlobe, FaBell, FaChevronDown } from "react-icons/fa";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "prepare" | "summary" | "declare" | "filed";

interface GSTR110SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1-10 -> gst-gstr-1-10 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so the OTP configured there applies here automatically).
const SIMULATION_SLUG = "gst-gstr-1-10";

const COMPANY_NAME = "HP Cements Private Limited";
const GSTIN = "07GDLCF7228G1YK";
const DEFAULT_OTP = "728272";
const RESEND_SECONDS = 15;

const generateAckNumber = () => {
  let digits = "";
  for (let i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10);
  return `AA${digits}B`;
};

export default function GSTR110Simulation({
  onComplete,
}: GSTR110SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const otp = findFieldValue(simConfig, /otp/i) || DEFAULT_OTP;
  // Only show a banner once an admin has actually configured one — no
  // hardcoded fallback text, since that would print the OTP answer above
  // the exercise for everyone regardless of admin setup.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [step, setStep] = useState<Step>("prepare");
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [declareError, setDeclareError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [ackNumber, setAckNumber] = useState("");

  useEffect(() => {
    if (!showOtpModal || resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [showOtpModal, resendSeconds]);

  useEffect(() => {
    if (step === "filed") onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleGenerateSummary = () => setStep("summary");
  const handleFileStatement = () => setStep("declare");

  const openOtpModal = () => {
    if (!declarationChecked) {
      setDeclareError("Please accept the declaration before filing.");
      return;
    }
    setDeclareError("");
    setOtpInput("");
    setOtpError("");
    setResendSeconds(RESEND_SECONDS);
    setShowOtpModal(true);
  };

  const handleResendOtp = () => {
    if (resendSeconds > 0) return;
    setOtpError("");
    setOtpInput("");
    setResendSeconds(RESEND_SECONDS);
  };

  const handleVerifyOtp = () => {
    if (otpInput.trim() !== otp) {
      setOtpError("Invalid OTP. Please try again.");
      return;
    }
    setShowOtpModal(false);
    setAckNumber(generateAckNumber());
    setStep("filed");
  };

  const handleRetry = () => {
    setStep("prepare");
    setDeclarationChecked(false);
    setDeclareError("");
    setShowOtpModal(false);
    setOtpInput("");
    setOtpError("");
    setAckNumber("");
    setIsExperimentStarted(true);
  };

  const infoRows: [string, string][] = [
    ["GSTIN", GSTIN],
    ["Legal Name", COMPANY_NAME],
    ["Trade Name", COMPANY_NAME],
    ["FY", "20XX-XX"],
    ["Tax Period", "June"],
    ["Status", step === "prepare" ? "Not Filed" : "Submitted"],
    ["Due Date", "Jul 11 20XX"],
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#333333] font-sans antialiased flex flex-col select-none relative">
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

      {/* Experiment Instruction Banner — only rendered once an admin has configured one */}
      {bannerText && (
        <div className="bg-[#e0f2fe] border-b border-[#bae6fd] px-6 py-2.5 text-[11px] font-bold text-[#0369a1] select-none shrink-0">
          {bannerText}
        </div>
      )}

      {/* Blue GST Header */}
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

          <div className="mt-1 flex items-center gap-1 text-[10px] font-extrabold text-white bg-white/10 px-2 py-0.5 rounded self-start md:self-auto">
            <span>{COMPANY_NAME}</span>
            <span className="text-slate-400 font-normal mx-1">/</span>
            <span className="text-emerald-400">{GSTIN}</span>
          </div>
        </div>

        <div className="bg-[#1e3b6a] px-4 text-xs font-bold flex flex-wrap items-center justify-between shadow-md">
          <div className="flex flex-wrap items-center">
            {[
              "Dashboard",
              "Services",
              "GST Law",
              "Downloads",
              "Search Taxpayer",
              "Help and Taxpayer Facilities",
            ].map((item, idx) => (
              <button
                key={item}
                className="px-4 py-3 hover:bg-[#152a4e] transition-colors border-r border-white/5 uppercase tracking-wide flex items-center gap-1"
              >
                {item}
                {idx === 1 && <FaChevronDown size={9} />}
              </button>
            ))}
          </div>
          <div className="py-2.5 px-2 flex items-center gap-1.5 text-slate-300">
            <FaBell size={12} className="cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-[#cbd5e1]/40 border-b border-[#cbd5e1]/60 px-5 py-2 select-none shrink-0">
        <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="hover:underline cursor-pointer text-[#0f3a9a]">Dashboard</span>
            <span className="text-[#94a3b8] font-normal">&gt;</span>
            <span className="hover:underline cursor-pointer text-[#0f3a9a]">Returns</span>
            <span className="text-[#94a3b8] font-normal">&gt;</span>
            <span className="text-[#475569]">GSTR-1/IFF</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer font-bold">
            <FaGlobe size={12} className="text-slate-500" />
            <span>English</span>
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="flex-1 w-full p-5 flex flex-col gap-5 relative">
        {/* Success banner */}
        {step === "filed" && (
          <div className="bg-[#dcfce7] border border-[#86efac] text-[#166534] text-[11px] font-semibold px-4 py-3 rounded">
            GSTR1 of GSTIN - {GSTIN} for the Return Period - &apos;June&apos; - has been
            successfully filed. The Acknowledgment Reference Number is{" "}
            <span className="font-black">{ackNumber}</span>. This message is sent to your
            registered Email ID and Mobile Number.
          </div>
        )}

        {/* Taxpayer info card */}
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

        {/* GSTR-1/IFF card */}
        <div className="bg-white border border-[#cbd5e1]">
          <div className="bg-[#0d9488] text-white px-4 py-2.5 font-extrabold text-[12px]">
            GSTR-1 - Details of outward supplies of goods or services
          </div>

          {step === "prepare" && (
            <div className="p-5 space-y-4 text-[11px]">
              <div className="bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1] px-3 py-2.5 rounded">
                Either summary has not been generated or details have been updated post
                last generation. Please generate GSTR-1 summary to enable Preview
                (summary PDF) and Submit/file.
              </div>
              <div className="text-slate-500 font-semibold">
                All record detail sections (B2B Invoices, B2C, Exports, Nil Rated,
                Credit/Debit Notes, HSN Summary, Documents Issued, etc.) currently have
                0 entries for this exercise.
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleGenerateSummary}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
                >
                  Generate Summary
                </button>
              </div>
            </div>
          )}

          {(step === "summary" || step === "declare" || step === "filed") && (
            <div className="p-5 space-y-4 text-[11px]">
              <div className="bg-[#ecfdf5] text-[#0d9488] font-extrabold text-[11px] px-4 py-2 border border-[#99f6e4]">
                Consolidated Summary
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10.5px] border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold">
                      <th className="px-3 py-2 text-left border-b border-slate-200">
                        Description
                      </th>
                      <th className="px-3 py-2 text-right border-b border-slate-200">
                        Value (₹)
                      </th>
                      <th className="px-3 py-2 text-right border-b border-slate-200">
                        Integrated Tax (₹)
                      </th>
                      <th className="px-3 py-2 text-right border-b border-slate-200">
                        Central Tax (₹)
                      </th>
                      <th className="px-3 py-2 text-right border-b border-slate-200">
                        State/UT Tax (₹)
                      </th>
                      <th className="px-3 py-2 text-right border-b border-slate-200">
                        Cess (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-extrabold text-slate-800 bg-slate-50">
                      <td className="px-3 py-2">Total Liability (Outward supplies)</td>
                      <td className="px-3 py-2 text-right">0.00</td>
                      <td className="px-3 py-2 text-right">0.00</td>
                      <td className="px-3 py-2 text-right">0.00</td>
                      <td className="px-3 py-2 text-right">0.00</td>
                      <td className="px-3 py-2 text-right">0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {step === "summary" && (
                <div className="flex justify-end">
                  <button
                    onClick={handleFileStatement}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
                  >
                    File Statement
                  </button>
                </div>
              )}

              {(step === "declare" || step === "filed") && (
                <div className="border-t border-slate-200 pt-4 relative">
                  <label className="flex items-start gap-2 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={declarationChecked}
                      disabled={step === "filed"}
                      onChange={(e) => {
                        setDeclarationChecked(e.target.checked);
                        setDeclareError("");
                      }}
                      className="mt-0.5 h-4 w-4"
                    />
                    I hereby solemnly affirm and declare that the information given
                    herein above is true and correct to the best of my/our knowledge
                    and belief and nothing has been concealed therefrom.
                  </label>

                  {step === "declare" && declarationChecked && (
                    <div className="mt-3 max-w-xs">
                      <label className="block font-extrabold text-slate-700 mb-1">
                        Authorised Signatory <span className="text-red-500">*</span>
                      </label>
                      <select className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 outline-none font-semibold">
                        <option>OWNER1</option>
                      </select>
                    </div>
                  )}

                  {declareError && (
                    <div className="mt-3 rounded border border-red-300 bg-red-50 px-2.5 py-2 text-red-600">
                      {declareError}
                    </div>
                  )}

                  {step === "declare" && (
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        disabled
                        title="Not available in this simulation"
                        className="bg-slate-200 text-slate-400 font-bold uppercase text-[11px] px-5 py-2 rounded cursor-not-allowed"
                      >
                        File with DSC
                      </button>
                      <button
                        onClick={openOtpModal}
                        className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[11px] px-5 py-2 rounded cursor-pointer transition-colors"
                      >
                        File with EVC
                      </button>
                    </div>
                  )}

                  {step === "filed" && (
                    <div className="mt-4 flex items-center justify-center gap-6 py-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_10px_30px_rgba(71,198,90,0.35)]">
                        <CheckCircle2 className="text-white" size={36} strokeWidth={2.5} />
                      </div>
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="inline-flex items-center gap-2 rounded-md bg-[#e1141a] px-5 py-2.5 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.3)] transition-all hover:bg-[#c90f15] hover:scale-105 cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inner Portal Footer */}
        <div className="bg-[#0b1a30] px-5 py-3 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto">
          <span>© 2022 IICPA Simulation Software Designed &amp; Developed by IICPA</span>
          <span>
            Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome
            49+, Firefox 45+ and Safari 6+
          </span>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] px-4">
          <div className="w-full max-w-sm rounded bg-white p-5 shadow-2xl">
            <h3 className="text-[15px] font-bold text-[#0a2558] mb-3">
              Validate One Time Password (OTP)
            </h3>
            <div className="bg-[#ecfdf5] border border-[#86efac] text-[#166534] text-[10.5px] px-3 py-2.5 rounded mb-3">
              One-Time Password (OTP) has been sent to your registered email ID
              xxxxxxxx@gmail.com and mobile no. xxxxxxxxxx. OTP is Valid Till 10 mins
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
              <button
                onClick={handleResendOtp}
                disabled={resendSeconds > 0}
                className={`flex-1 border rounded px-3 py-2 text-[11px] font-bold uppercase ${
                  resendSeconds > 0
                    ? "border-slate-200 text-slate-300 cursor-not-allowed"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {resendSeconds > 0 ? `${resendSeconds}s` : "Resend OTP"}
              </button>
            </div>
            <p className="mt-3 text-[10px] text-slate-400">
              If you do not receive the OTP within 30 seconds, please click &quot;Resend
              OTP&quot; to request it again. Resend can be requested a maximum of three
              times.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
