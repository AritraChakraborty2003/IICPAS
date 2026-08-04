"use client";

import React, { useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useSimulationConfig } from "@/lib/useSimulationConfig";

interface ITRReg5SimulationProps {
  onComplete?: () => void;
}

// /simulations/itr-reg-5 -> itr-reg-5 (matches the slug derivation used by
// the admin Course editor's simulation-card quick insert and the Simulation
// Manager, so an admin-set banner for this slug applies here automatically).
const SIMULATION_SLUG = "itr-reg-5";

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

// This step has nothing to enter or validate against a config - the student
// has already supplied PAN/basic/contact details and OTPs in the earlier
// itr-reg-1..4 steps, so it's a plain review-and-confirm screen.
export default function ITRReg5Simulation({ onComplete }: ITRReg5SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleVerify = () => {
    setShowSuccessOverlay(true);
    onComplete?.();
  };

  // Return restarts this exercise from the beginning rather than navigating
  // away, so a student can retry the same simulation as many times as needed.
  const handleReturn = () => {
    setShowSuccessOverlay(false);
  };

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
            <p className="text-white font-bold text-[15px]">Registration Complete!</p>
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
          <div className="flex items-center gap-3">
            <button className="border border-[#0f3a9a] text-[#0f3a9a] text-[11px] font-bold px-4 py-2 rounded cursor-default">
              Login
            </button>
            <button className="bg-[#0f3a9a] text-white text-[11px] font-bold px-4 py-2 rounded border-2 border-red-500 cursor-default">
              Register
            </button>
          </div>
        </div>
        <div className="bg-[#1e3b6a] px-4 text-[11px] font-bold flex flex-wrap items-center text-white shadow-md">
          {navItems.map((item) => (
            <span
              key={item}
              className="px-4 py-2.5 uppercase tracking-wide border-r border-white/5 cursor-default"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full px-6 py-6">
          <div className="flex items-center justify-between mb-8 max-w-2xl">
            {stepperItems.map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-8 w-8 rounded flex items-center justify-center font-bold text-[13px] border-2 ${
                      idx <= 2
                        ? "bg-[#22c55e] text-white border-[#22c55e]"
                        : "border-[#0f3a9a] text-[#0f3a9a]"
                    }`}
                  >
                    {idx <= 2 ? "✓" : idx + 1}
                  </div>
                  <span className="text-[10px] font-bold text-[#0a2558]">{label}</span>
                </div>
                {idx < stepperItems.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-1 ${idx <= 1 ? "bg-[#22c55e]" : "bg-slate-200"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="w-full max-w-xl border border-slate-200 rounded p-6 shadow-sm">
              <h3 className="text-[16px] font-bold text-[#0a2558] mb-1">Secure Your Account</h3>
              <p className="text-[11px] text-slate-500 mb-5">
                Your PAN, Basic Details, Contact Details and OTP verification have all been
                completed successfully. Review and confirm to finish registering your account.
              </p>

              <div className="rounded border border-slate-200 divide-y divide-slate-100 mb-5 text-[11.5px]">
                {[
                  ["PAN", "Verified"],
                  ["Basic Details", "Completed"],
                  ["Contact Details", "Completed"],
                  ["Mobile & Email OTP", "Verified"],
                ].map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2">
                    <span className="font-semibold text-slate-600">{label}</span>
                    <span className="font-bold text-emerald-600">{status}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleVerify}
                className="w-full bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold text-[13px] py-2.5 rounded cursor-pointer transition-colors"
              >
                Register ✓
              </button>
            </div>

            <div className="w-full md:w-72 shrink-0 flex items-start gap-2 bg-[#eff6ff] border border-[#bfdbfe] rounded p-4 text-[11px] text-slate-600">
              <FaInfoCircle className="text-[#0f3a9a] shrink-0 mt-0.5" size={14} />
              <div>
                <p className="font-bold text-[#0a2558] mb-1">Please Note</p>
                <p>
                  Once you click Register, your account will be created and you will be able to
                  log in using your PAN and the password you set earlier.
                </p>
              </div>
            </div>
          </div>
        </div>

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
