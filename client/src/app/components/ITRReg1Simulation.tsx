"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";

type Step = "home" | "getStarted" | "details";

interface ITRReg1SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-1 -> itr-reg-1 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "itr-reg-1";

const DEFAULT_PAN = "AKSPA3663B";
const DEFAULT_LAST_NAME = "Sharma";
const DEFAULT_FIRST_NAME = "Akhil";
const DEFAULT_DOB = "04/07/1996";
const DEFAULT_GENDER = "Male";
const DEFAULT_RESIDENTIAL_STATUS = "Resident";

const navItems = [
  "Home",
  "Individual/HUF",
  "Company",
  "Non-Company",
  "Tax Professionals & Others",
  "Downloads",
  "Help",
];

const stepperItems = ["Get Started", "Fill Details", "Verify Details", "Secure Your Account"];

export default function ITRReg1Simulation({ onComplete }: ITRReg1SimulationProps = {}) {
  const router = useRouter();
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const pan = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const lastName = findFieldValue(simConfig, /last/i) || DEFAULT_LAST_NAME;
  const firstName = findFieldValue(simConfig, /first/i) || DEFAULT_FIRST_NAME;
  const dob = findFieldValue(simConfig, /dob|birth/i) || DEFAULT_DOB;
  const gender = findFieldValue(simConfig, /gender/i) || DEFAULT_GENDER;
  const residentialStatus =
    findFieldValue(simConfig, /resident/i) || DEFAULT_RESIDENTIAL_STATUS;
  const requireCredentialValidation = simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [step, setStep] = useState<Step>("home");

  const [panInput, setPanInput] = useState("");
  const [panValidated, setPanValidated] = useState(false);
  const [panError, setPanError] = useState("");

  const [confirmChoice, setConfirmChoice] = useState<"yes" | "no" | null>(null);
  const [confirmError, setConfirmError] = useState("");

  const [lastNameInput, setLastNameInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [genderInput, setGenderInput] = useState("");
  const [residentialInput, setResidentialInput] = useState("");
  const [detailsError, setDetailsError] = useState("");

  const goToGetStarted = () => setStep("getStarted");

  const handleValidatePan = () => {
    const trimmed = panInput.trim().toUpperCase();
    if (!trimmed) {
      setPanError("Please enter a PAN.");
      return;
    }
    if (requireCredentialValidation && trimmed !== pan.toUpperCase()) {
      setPanError("Invalid PAN. Please enter the PAN provided in the experiment brief.");
      setPanValidated(false);
      return;
    }
    setPanError("");
    setPanValidated(true);
  };

  const handleConfirmContinue = () => {
    if (confirmChoice !== "yes") {
      setConfirmError('Please select "Yes" to confirm registration as Individual taxpayer.');
      return;
    }
    setConfirmError("");
    setStep("details");
  };

  const handleDetailsSubmit = () => {
    if (
      !lastNameInput.trim() ||
      !firstNameInput.trim() ||
      !dobInput.trim() ||
      !genderInput ||
      !residentialInput
    ) {
      setDetailsError("Please fill all mandatory fields.");
      return;
    }
    if (requireCredentialValidation) {
      const mismatch =
        lastNameInput.trim().toLowerCase() !== lastName.trim().toLowerCase() ||
        firstNameInput.trim().toLowerCase() !== firstName.trim().toLowerCase() ||
        dobInput.trim() !== dob.trim() ||
        genderInput.toLowerCase() !== gender.trim().toLowerCase() ||
        residentialInput.toLowerCase() !== residentialStatus.trim().toLowerCase();
      if (mismatch) {
        setDetailsError(
          "Details entered do not match the experiment brief. Please re-check and try again."
        );
        return;
      }
    }
    setDetailsError("");
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  const handleRetry = () => {
    setShowSuccessOverlay(false);
    setStep("home");
    setPanInput("");
    setPanValidated(false);
    setPanError("");
    setConfirmChoice(null);
    setConfirmError("");
    setLastNameInput("");
    setFirstNameInput("");
    setDobInput("");
    setGenderInput("");
    setResidentialInput("");
    setDetailsError("");
  };

  const handleReturn = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) router.back();
    else window.close();
  };

  const activeStepIndex = step === "details" ? 1 : 0;

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

      {/* SUCCESS OVERLAY (GREEN TICK & RETURN BUTTON) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px] animate-fadeIn">
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_15px_45px_rgba(71,198,90,0.4)] animate-scaleIn">
              <CheckCircle2 className="text-white" size={90} strokeWidth={2.5} />
            </div>
            <p className="text-white font-bold text-[15px]">Registration Successful!</p>
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
                e-Filing <span className="text-red-500 font-semibold italic text-sm">Anywhere Anytime</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold">
                Income Tax Department, Government of India
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("home")}
              className="border border-[#0f3a9a] text-[#0f3a9a] text-[11px] font-bold px-4 py-2 rounded cursor-pointer hover:bg-[#0f3a9a]/5"
            >
              Login
            </button>
            <button
              onClick={goToGetStarted}
              className="bg-[#0f3a9a] text-white text-[11px] font-bold px-4 py-2 rounded border-2 border-red-500 cursor-pointer hover:bg-[#0a2558]"
            >
              Register
            </button>
          </div>
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {navItems.map((item, idx) => (
            <span
              key={item}
              className={`px-4 py-2.5 uppercase tracking-wide border-r border-white/5 ${
                idx === 0 ? "bg-[#0c5f86]" : ""
              }`}
            >
              {item}
            </span>
          ))}
          <span className="ml-auto p-2.5 pr-4">
            <FaSearch size={11} />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        {step === "home" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
            <h2 className="text-3xl font-black text-[#0a2558]">e-Filing 2.0</h2>
            <p className="max-w-md text-slate-500 text-sm">
              All features of the new portal that make e-Filing easier for you! Register to find
              all your tax data in a single secure platform.
            </p>
            <button
              onClick={goToGetStarted}
              className="mt-2 bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[12px] px-6 py-3 rounded cursor-pointer transition-colors"
            >
              Register
            </button>
          </div>
        )}

        {(step === "getStarted" || step === "details") && (
          <div className="flex-1 w-full px-6 py-6">
            <div className="flex items-center justify-between mb-8 max-w-2xl">
              {stepperItems.map((label, idx) => (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                        idx < activeStepIndex
                          ? "bg-[#22c55e] text-white border-[#22c55e]"
                          : idx === activeStepIndex
                          ? "border-[#0f3a9a] text-[#0f3a9a]"
                          : "border-slate-300 text-slate-400"
                      }`}
                    >
                      {idx < activeStepIndex ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        idx <= activeStepIndex ? "text-[#0a2558]" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < stepperItems.length - 1 && (
                    <div className="flex-1 h-[2px] bg-slate-200 mx-1" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {step === "getStarted" && (
              <div className="max-w-xl border border-slate-200 rounded p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#0a2558] mb-1">Let&apos;s get started</h3>
                <p className="text-[11px] font-bold text-slate-500 mb-4">Register as</p>
                <div className="flex gap-2 mb-5">
                  <span className="bg-[#0f3a9a] text-white text-[12px] font-bold px-4 py-1.5 rounded">
                    Taxpayer
                  </span>
                  <span className="border border-slate-300 text-slate-500 text-[12px] font-bold px-4 py-1.5 rounded">
                    Others
                  </span>
                </div>

                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  PAN <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    value={panInput}
                    disabled={panValidated}
                    onChange={(e) => {
                      setPanInput(e.target.value.toUpperCase());
                      setPanError("");
                    }}
                    maxLength={10}
                    className="border border-slate-300 rounded px-3 py-2 text-[13px] font-semibold uppercase text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-100 w-52"
                  />
                  <button
                    onClick={handleValidatePan}
                    disabled={panValidated}
                    className="bg-[#0f3a9a] hover:bg-[#0a2558] disabled:opacity-60 text-white font-bold text-[12px] px-5 py-2 rounded cursor-pointer transition-colors"
                  >
                    Validate
                  </button>
                </div>

                {panError && (
                  <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-600 mb-3">
                    {panError}
                  </div>
                )}

                {panValidated && (
                  <>
                    <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-[11.5px] text-green-700 font-semibold mb-4">
                      Success : PAN validated successfully.
                    </div>

                    <p className="text-[12px] font-semibold text-slate-700 mb-2">
                      Please confirm if you want to register as &quot;Individual taxpayer&quot;
                    </p>
                    <div className="flex items-center gap-6 mb-3">
                      <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmChoice === "yes"}
                          onChange={() => {
                            setConfirmChoice("yes");
                            setConfirmError("");
                          }}
                          className="h-4 w-4"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmChoice === "no"}
                          onChange={() => {
                            setConfirmChoice("no");
                            setConfirmError("");
                          }}
                          className="h-4 w-4"
                        />
                        No
                      </label>
                    </div>

                    <p className="text-[10.5px] text-slate-500 mb-4">
                      Note: Please ensure your Status is correct as details in subsequent screens
                      will be based on your Status.
                    </p>

                    {confirmError && (
                      <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-600 mb-3">
                        {confirmError}
                      </div>
                    )}

                    <button
                      onClick={handleConfirmContinue}
                      className="w-full bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] py-2.5 rounded cursor-pointer transition-colors"
                    >
                      Continue ›
                    </button>
                  </>
                )}
              </div>
            )}

            {step === "details" && (
              <div className="max-w-xl border border-slate-200 rounded p-6 shadow-sm">
                <p className="text-[13px] font-bold text-[#0a2558] mb-4">
                  Registering as - Individual
                </p>
                <h3 className="text-[14px] font-bold text-[#0a2558] mb-4">Basic Details</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      PAN <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={panInput}
                      disabled
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] font-semibold text-slate-800 bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Surname / Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={lastNameInput}
                      onChange={(e) => {
                        setLastNameInput(e.target.value);
                        setDetailsError("");
                      }}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      First Name and Middle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={firstNameInput}
                      onChange={(e) => {
                        setFirstNameInput(e.target.value);
                        setDetailsError("");
                      }}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={dobInput}
                      placeholder="DD/MM/YYYY"
                      onChange={(e) => {
                        setDobInput(e.target.value);
                        setDetailsError("");
                      }}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      {["Male", "Female", "Transgender"].map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-1.5 text-[12px] text-slate-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="gender"
                            checked={genderInput === option}
                            onChange={() => {
                              setGenderInput(option);
                              setDetailsError("");
                            }}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Residential Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={residentialInput}
                      onChange={(e) => {
                        setResidentialInput(e.target.value);
                        setDetailsError("");
                      }}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12px] text-slate-800 bg-white outline-none focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Resident">Resident</option>
                      <option value="Non-Resident">Non-Resident</option>
                      <option value="Not Ordinarily Resident">Not Ordinarily Resident</option>
                    </select>
                  </div>

                  {detailsError && (
                    <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                      {detailsError}
                    </div>
                  )}

                  <button
                    onClick={handleDetailsSubmit}
                    className="w-full bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] py-2.5 rounded cursor-pointer transition-colors mt-2"
                  >
                    Continue ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-[#0b1a30] px-5 py-3 border-t border-white/5 text-white/70 text-[10px] font-medium w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto shrink-0">
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
