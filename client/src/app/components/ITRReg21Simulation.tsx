"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, ArrowLeft, Info } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "declaration" | "preview" | "everify";

interface ITRReg21SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-21 -> itr-reg-21 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-21";

const DEFAULT_NAME = "Sanjay Sahu";
const DEFAULT_FATHER_NAME = "Manoj Sahu";
const DEFAULT_PAN = "SNSPS4827K";
const DEFAULT_PLACE = "Bengaluru";
const DEFAULT_OTP = "482719";
const ITR_TYPE = "ITR-2";

const capacityOptions = [
  "Self",
  "Guardian",
  "Legal Heir",
  "Representative Assessee",
  "Karta of HUF",
];

const stepperItems = ["Validate Return", "Confirm your Return Summary", "Verify and Submit"];
const verifySubSteps = ["Preview and Submit", "Verify your Return"];

const todayFormatted = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

export default function ITRReg21Simulation({ onComplete }: ITRReg21SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const name = findFieldValue(simConfig, /^name$/i) || DEFAULT_NAME;
  const fatherName = findFieldValue(simConfig, /father/i) || DEFAULT_FATHER_NAME;
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  // Admin-configured (Simulation Manager) expected "Place" value for the
  // declaration - the student must type this exact place before they can
  // proceed. Never hardcoded.
  const expectedPlace = findFieldValue(simConfig, /place/i) || DEFAULT_PLACE;
  const expectedOtp = findFieldValue(simConfig, /otp/i) || DEFAULT_OTP;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("declaration");

  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [capacity, setCapacity] = useState("Self");
  const [place, setPlace] = useState("");
  const [trpId, setTrpId] = useState("");
  const [trpName, setTrpName] = useState("");
  const [trpReimbursement, setTrpReimbursement] = useState("");
  const [declarationError, setDeclarationError] = useState("");

  const [selectedVerification, setSelectedVerification] = useState<"now" | "later">("now");
  const [everifyError, setEverifyError] = useState("");

  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [agreeAadhaar, setAgreeAadhaar] = useState(false);
  const [aadhaarModalError, setAadhaarModalError] = useState("");

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const resetAll = () => {
    setStep("declaration");
    setAgreeDeclaration(false);
    setCapacity("Self");
    setPlace("");
    setTrpId("");
    setTrpName("");
    setTrpReimbursement("");
    setDeclarationError("");
    setSelectedVerification("now");
    setEverifyError("");
    setShowAadhaarModal(false);
    setAgreeAadhaar(false);
    setAadhaarModalError("");
    setShowOtpModal(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
  };

  const handleProceedToPreview = () => {
    if (!agreeDeclaration || !capacity || !place.trim()) {
      setDeclarationError("Please fill all the mandatory fields marked with *.");
      return;
    }
    if (requireCredentialValidation && place.trim().toLowerCase() !== expectedPlace.trim().toLowerCase()) {
      setDeclarationError(
        `Entered Place does not match the experiment brief. Please enter “${expectedPlace}” and try again.`
      );
      return;
    }
    setDeclarationError("");
    setStep("preview");
  };

  const handleProceedToVerification = () => {
    setStep("everify");
  };

  const handleEverifyContinue = () => {
    setEverifyError("");
    if (selectedVerification === "later") {
      setShowSuccessOverlay(true);
      onComplete?.();
      return;
    }
    setAgreeAadhaar(false);
    setAadhaarModalError("");
    setShowAadhaarModal(true);
  };

  const handleGenerateAadhaarOtp = () => {
    if (!agreeAadhaar) {
      setAadhaarModalError("Please agree to validate your Aadhaar Details to continue.");
      return;
    }
    setAadhaarModalError("");
    setShowAadhaarModal(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
    setShowOtpModal(true);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setOtpError("");
    if (digit && index < otpDigits.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleValidateOtp = () => {
    const enteredOtp = otpDigits.join("");
    if (enteredOtp.length < 6) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }
    if (requireCredentialValidation && enteredOtp !== expectedOtp.trim()) {
      setOtpError("Incorrect OTP entered. Please check the OTP provided in the experiment brief and try again.");
      return;
    }
    setOtpError("");
    setShowOtpModal(false);
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
    resetAll();
  };

  const breadcrumb =
    "Dashboard › Filing Returns for A.Y. 2024-25 › ITR-2 › Schedules › Schedule Part B - TTI › You have opted to pay later › Verify and Submit";

  const verifySubStepIndex = step === "declaration" ? 0 : 1;

  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans antialiased flex flex-col select-none relative">
      {/* START EXPERIMENT OVERLAY */}
      {!isExperimentStarted && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-[1.5px] z-40 flex items-center justify-center">
          <button
            onClick={() => setIsExperimentStarted(true)}
            className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white px-8 py-3.5 rounded font-bold uppercase tracking-wider text-sm shadow-md hover:scale-105 transition-all cursor-pointer z-50"
          >
            Start Experiment
          </button>
        </div>
      )}

      {/* SUCCESS OVERLAY (GREEN TICK & RETURN BUTTON) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] animate-fadeIn">
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_15px_45px_rgba(71,198,90,0.4)] animate-scaleIn">
              <CheckCircle2 className="text-white" size={90} strokeWidth={2.5} />
            </div>
            <p className="text-white font-bold text-[15px]">
              {selectedVerification === "later"
                ? `${ITR_TYPE} Filed Successfully! Verify within 30 days.`
                : `${ITR_TYPE} Filed and e-Verified Successfully!`}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReturn}
                className="inline-flex items-center gap-2 rounded-md bg-[#0f3a9a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(15,58,154,0.35)] transition-all hover:bg-[#0a2558] hover:scale-105 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AADHAAR OTP CONSENT MODAL */}
      {showAadhaarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
          <div className="w-full max-w-md bg-white rounded shadow-2xl">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <Info className="text-slate-700" size={34} strokeWidth={1.5} />
              <p className="text-[12.5px] text-slate-700">
                One time password (OTP) will be sent via text message(SMS) to the number
                registered with Aadhaar.
              </p>
              <label className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeAadhaar}
                  onChange={(e) => {
                    setAgreeAadhaar(e.target.checked);
                    setAadhaarModalError("");
                  }}
                />
                I agree to validate my Aadhaar Details <span className="text-red-500">*</span>
              </label>
              {aadhaarModalError && (
                <div className="w-full rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                  {aadhaarModalError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-5 border-t border-slate-200 px-6 py-3">
              <button
                onClick={() => setShowAadhaarModal(false)}
                className="text-[#0f3a9a] font-bold text-[12.5px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAadhaarOtp}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[12.5px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Generate Aadhaar OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
          <div className="w-full max-w-md bg-white rounded shadow-2xl">
            <div className="px-6 pt-5 pb-2">
              <h3 className="text-[18px] font-bold text-[#0a2558]">Verify OTP</h3>
            </div>
            <div className="px-6 pb-4">
              <p className="text-[12px] text-slate-600 mb-3">
                Please enter OTP which has been sent to your Mobile number registered with
                Aadhaar.
              </p>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                OTP<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="h-10 w-10 border border-slate-300 rounded text-center text-[14px] font-bold text-slate-800 outline-none focus:border-blue-500"
                  />
                ))}
              </div>
              {otpError && (
                <div className="mt-3 rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                  {otpError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-5 border-t border-slate-200 px-6 py-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setStep("everify");
                }}
                className="text-[#0f3a9a] font-bold text-[12.5px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleValidateOtp}
                className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[12.5px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                Validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin-configured (Simulation Manager) experiment brief - not
          rendered at all if the admin hasn't set a banner for this slug. */}
      {bannerText && (
        <div className="bg-[#e0f2fe] border-b border-[#bae6fd] px-6 py-2.5 text-[11px] font-bold text-[#0369a1] select-none shrink-0 whitespace-pre-line">
          {bannerText}
        </div>
      )}

      {/* Portal header */}
      <div className="w-full select-none shrink-0 border-b border-slate-200">
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/simulations/satyamev-jayate.jpg"
              alt="Satyamev Jayate emblem"
              className="h-10 w-10 object-contain rounded-full"
            />
            <div>
              <h1 className="text-lg font-bold text-[#0a2558] leading-tight">
                e-Filing{" "}
                <span className="text-red-500 font-semibold italic text-sm">
                  Anywhere Anytime
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold">
                Income Tax Department, Government of India
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-bold text-slate-700">{name} ▾</p>
            <p className="text-[10px] text-slate-400 cursor-default">Individual</p>
          </div>
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {["Dashboard", "e-File", "Authorised Partners", "Services", "AIS", "Pending Actions", "Grievances", "Help"].map(
            (item) => (
              <span
                key={item}
                className={`px-4 py-2.5 uppercase tracking-wide border-r border-white/5 cursor-default ${
                  item === "Dashboard" ? "underline underline-offset-4" : ""
                }`}
              >
                {item}
              </span>
            )
          )}
          <span className="ml-auto px-4 py-2.5 text-white/80">Session Time 14:53</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          <p className="text-[10.5px] font-bold text-[#0f3a9a] mb-4 max-w-4xl">{breadcrumb}</p>

          <div className="flex items-center justify-between mb-4 max-w-2xl">
            {stepperItems.map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                      idx < 2
                        ? "bg-[#22c55e] text-white border-[#22c55e]"
                        : "border-[#0f3a9a] text-[#0f3a9a]"
                    }`}
                  >
                    {idx < 2 ? "✓" : idx + 1}
                  </div>
                  <span className="text-[10px] font-bold text-center max-w-[90px] text-[#0a2558]">
                    {label}
                  </span>
                </div>
                {idx < stepperItems.length - 1 && (
                  <div className="flex-1 h-[2px] mx-1 bg-[#22c55e]" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-slate-50 rounded-md p-4 mb-6 max-w-md">
            <div className="flex items-center justify-between">
              {verifySubSteps.map((label, idx) => (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                        idx < verifySubStepIndex
                          ? "bg-[#22c55e] text-white border-[#22c55e]"
                          : idx === verifySubStepIndex
                          ? "border-[#0f3a9a] text-[#0f3a9a]"
                          : "border-slate-300 text-slate-400"
                      }`}
                    >
                      {idx < verifySubStepIndex ? "✓" : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold text-[#0a2558] text-center max-w-[90px]">
                      {label}
                    </span>
                  </div>
                  {idx < verifySubSteps.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-1 ${
                        verifySubStepIndex > 0 ? "bg-[#22c55e]" : "bg-slate-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {step === "declaration" && (
            <>
              <div className="flex items-center justify-between max-w-4xl mb-1">
                <h2 className="text-[26px] font-bold text-[#0a2558]">Preview and Submit your return</h2>
              </div>
              <p className="text-[11px] text-slate-400 mb-6">
                <span className="text-red-500">*</span> Indicates mandatory fields
              </p>

              <div className="max-w-4xl border border-slate-200 rounded p-6 mb-4">
                <label className="flex flex-wrap items-start gap-2 text-[13px] text-slate-700 mb-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeDeclaration}
                    onChange={(e) => {
                      setAgreeDeclaration(e.target.checked);
                      setDeclarationError("");
                    }}
                    className="mt-1 shrink-0"
                  />
                  <span>
                    I,{" "}
                    <span className="inline-block min-w-[140px] border-b border-slate-400 font-semibold text-slate-800 px-1">
                      {name}
                    </span>
                    , Son/daughter of{" "}
                    <span className="inline-block min-w-[140px] border-b border-slate-400 font-semibold text-slate-800 px-1">
                      {fatherName}
                    </span>{" "}
                    solemnly declare that to the best of my knowledge and belief, the information
                    given in the return and schedules thereto is correct and complete and is in
                    accordance with the provisions of the Income Tax Act,1961.
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-700 mb-5">
                  <span>I further declare that I am making return in my capacity as</span>
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-1.5 text-[12.5px] text-slate-800 bg-white outline-none focus:border-blue-500"
                  >
                    {capacityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span>
                    and I am also competent to make this return and verify it. I am holding
                    Permanent Account Number
                  </span>
                </div>
                <div className="mb-6 w-52">
                  <input
                    value={pan}
                    readOnly
                    className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] font-semibold text-slate-800 bg-slate-50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      Place <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={place}
                      onChange={(e) => {
                        setPlace(e.target.value);
                        setDeclarationError("");
                      }}
                      placeholder="Enter place"
                      className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={todayFormatted()}
                      readOnly
                      className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 bg-slate-50 outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <p className="text-[12.5px] font-semibold text-slate-700 mb-4">
                    If the return has been prepared by a Tax Return Preparer (TRP) give further
                    details below:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                        Identification No. of TRP
                      </label>
                      <input
                        value={trpId}
                        onChange={(e) => setTrpId(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                        Name of TRP
                      </label>
                      <input
                        value={trpName}
                        onChange={(e) => setTrpName(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="w-64">
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      If TRP is entitled for any reimbursement from the Government, amount thereof
                    </label>
                    <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                      <span className="px-2.5 py-2 text-[12px] text-slate-500 bg-slate-50 border-r border-slate-300">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={trpReimbursement}
                        onChange={(e) => setTrpReimbursement(e.target.value)}
                        className="w-full px-2.5 py-2 text-[12px] text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {declarationError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4 max-w-4xl">
                  {declarationError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  disabled
                  title="Not available in this simulation"
                  className="border border-slate-200 text-slate-300 font-bold text-[13px] px-6 py-2 rounded cursor-not-allowed"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleProceedToPreview}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Proceed to Preview
                </button>
              </div>

              <p className="text-[11.5px] text-slate-500 mt-5 max-w-3xl">
                Note: In case E-Verify Later is selected, submit return. However, it will be
                required to verify return within 30 days of filing ITR.
              </p>
            </>
          )}

          {step === "preview" && (
            <div className="max-w-3xl">
              <h2 className="text-[26px] font-bold text-[#0a2558] mb-4">{ITR_TYPE} Return Preview</h2>
              <div className="border border-[#bbf7d0] bg-[#f0fdf4] rounded p-5 mb-6 flex items-center gap-4">
                <CheckCircle2 className="text-[#22c55e] shrink-0" size={34} />
                <div>
                  <p className="text-[14px] font-bold text-[#166534]">Declaration Confirmed!</p>
                  <p className="text-[11.5px] text-[#166534]">No errors were found.</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded divide-y divide-slate-100 mb-6">
                {[
                  ["Name", name],
                  ["Son/daughter of", fatherName],
                  ["Capacity", capacity],
                  ["Permanent Account Number", pan],
                  ["Place", place],
                  ["Date", todayFormatted()],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-[12px] text-slate-500 font-semibold">{label}</span>
                    <span className="text-[13px] font-bold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep("declaration")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleProceedToVerification}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  Proceed to Verification
                </button>
              </div>
            </div>
          )}

          {step === "everify" && (
            <div className="max-w-3xl">
              <h2 className="text-[28px] font-bold text-[#0a2558] mb-5">e-Verify</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-5 border-b border-slate-200">
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold mb-0.5">PAN</p>
                  <p className="text-[13px] font-bold text-slate-800">{pan}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold mb-0.5">ITR</p>
                  <p className="text-[13px] font-bold text-slate-800">{ITR_TYPE}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold mb-0.5">Place</p>
                  <p className="text-[13px] font-bold text-slate-800">{place}</p>
                </div>
              </div>

              <p className="text-[13px] font-bold text-slate-800 mb-4">How do you want to e-verify?</p>

              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-2.5 text-[12.5px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="everify-mode"
                    checked={selectedVerification === "now"}
                    onChange={() => {
                      setSelectedVerification("now");
                      setEverifyError("");
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    e-Verify Now{" "}
                    <span className="text-[#16a34a] font-bold">(Recommended)</span> — verify using
                    OTP on mobile number registered with Aadhaar. It is quick, paperless, and safer
                    than sending a signed physical ITR-V to CPC by post.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-[12.5px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="everify-mode"
                    checked={selectedVerification === "later"}
                    onChange={() => {
                      setSelectedVerification("later");
                      setEverifyError("");
                    }}
                    className="mt-0.5"
                  />
                  <span>e-Verify Later — submit return now and verify within 30 days of filing ITR.</span>
                </label>
              </div>

              {everifyError && (
                <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 mb-4 max-w-2xl">
                  {everifyError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep("preview")}
                  className="border border-slate-300 text-[#0f3a9a] font-bold text-[13px] px-6 py-2 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleEverifyContinue}
                  className="bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] px-6 py-2 rounded cursor-pointer transition-colors"
                >
                  {selectedVerification === "later" ? "Submit Return ›" : "Continue ›"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto shrink-0 flex items-start gap-2 bg-[#eff6ff] border-t border-[#bfdbfe] px-6 py-3 text-[11px] text-slate-600">
          <Info className="text-[#0f3a9a] shrink-0 mt-0.5" size={14} />
          <span>
            PAN on record: <span className="font-bold">{pan}</span> &mdash; all figures shown are
            pre-filled defaults for this simulation.
          </span>
        </div>

        <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <span>© 2022 IICPA Simulation Software Designed &amp; Developed by IICPA</span>
          <span>
            Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+,
            Firefox 45+ and Safari 6+
          </span>
        </div>
      </div>
    </div>
  );
}
