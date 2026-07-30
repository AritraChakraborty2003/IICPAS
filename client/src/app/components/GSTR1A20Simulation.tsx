"use client";

import React, { useState } from "react";
import { FaLock } from "react-icons/fa";
import { CheckCircle2, RotateCcw, RefreshCw } from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
  findUsernameValue,
} from "@/lib/useSimulationConfig";

interface GSTR1A20SimulationProps {
  onComplete?: () => void;
}

// /simulations/gst/gstr-1a-20 -> gst-gstr-1a-20 (matches the slug derivation
// used by the admin Course editor's simulation-card quick insert and the
// Simulation Manager, so credentials set there apply here automatically).
const SIMULATION_SLUG = "gst-gstr-1a-20";

const DEFAULT_USERNAME = "FINMOTO";
const DEFAULT_PASSWORD = "Fin@123";

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCaptcha = () => {
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return out;
};

const navItems = [
  "Dashboard",
  "Services",
  "GST Law",
  "Downloads",
  "Search Taxpayer",
  "Help and Taxpayer Facilities",
];

export default function GSTR1A20Simulation({
  onComplete,
}: GSTR1A20SimulationProps = {}) {
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const loginUsername = findUsernameValue(simConfig) || DEFAULT_USERNAME;
  const loginPassword = findFieldValue(simConfig, /pass/i) || DEFAULT_PASSWORD;
  const requireCredentialValidation =
    simConfig?.requireCredentialValidation !== false;
  // Admin-configured (Simulation Manager) experiment brief - not rendered at
  // all if the admin hasn't set a banner for this slug. Never hardcoded, so
  // the login credentials above are never printed on-screen for students.
  const bannerText = simConfig?.bannerText || "";

  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState(randomCaptcha);
  const [loginError, setLoginError] = useState("");

  const refreshCaptcha = () => {
    setCaptchaCode(randomCaptcha());
    setCaptchaInput("");
  };

  const handleRetry = () => {
    setShowSuccessOverlay(false);
    setUsernameInput("");
    setPasswordInput("");
    setCaptchaInput("");
    setLoginError("");
    refreshCaptcha();
  };

  const handleLoginSubmit = () => {
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setLoginError("Invalid captcha. Please try again.");
      refreshCaptcha();
      return;
    }
    if (
      requireCredentialValidation &&
      (usernameInput.trim() !== loginUsername || passwordInput !== loginPassword)
    ) {
      setLoginError(
        "Invalid username or password. Please use the credentials provided for this experiment."
      );
      return;
    }
    setLoginError("");
    setShowSuccessOverlay(true);
    onComplete?.();
  };

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

      {/* Admin-configured (Simulation Manager) experiment brief - not
          rendered at all if the admin hasn't set a banner for this slug. */}
      {bannerText && (
        <div className="bg-[#e0f2fe] border-b border-[#bae6fd] px-6 py-2.5 text-[11px] font-bold text-[#0369a1] select-none shrink-0">
          {bannerText}
        </div>
      )}

      {/* Login page (username / password / captcha) */}
      <div className="flex-1 w-full bg-white flex flex-col">
          <div className="bg-[#0a2558] text-white w-full select-none shrink-0">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
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
              <div className="flex items-center gap-3">
                <button className="bg-white text-[#0a2558] text-[11px] font-extrabold uppercase px-4 py-2 rounded-sm">
                  Register
                </button>
                <button className="bg-[#1e3b6a] text-white text-[11px] font-extrabold uppercase px-4 py-2 rounded-sm">
                  Login
                </button>
              </div>
            </div>
            <div className="bg-[#1e3b6a] px-4 text-xs font-bold flex flex-wrap items-center shadow-md">
              {navItems.map((item, idx) => (
                <button
                  key={item}
                  className={`px-4 py-3 transition-colors border-r border-white/5 uppercase tracking-wide ${
                    idx === 1 ? "bg-[#0c5f86]" : "hover:bg-[#152a4e]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#cbd5e1]/40 border-b border-[#cbd5e1]/60 px-5 py-2 text-[10.5px] font-bold text-slate-600">
            Home <span className="text-[#94a3b8] font-normal">&gt;</span> Login
          </div>

          <div className="flex-1 flex items-start justify-center py-10 px-4">
            <div className="w-full max-w-sm border border-slate-200 rounded-sm p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#0a2558] mb-1">Login</h2>
              <p className="text-right text-[10px] text-red-500 font-semibold mb-4">
                <span className="text-red-500 font-bold">*</span> indicates mandatory fields
              </p>

              <div className="space-y-3 text-[11px]">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={usernameInput}
                    onChange={(e) => {
                      setLoginError("");
                      setUsernameInput(e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setLoginError("");
                      setPasswordInput(e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Type the characters you see in the image below{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-9 w-[150px] items-center justify-center overflow-hidden rounded border border-slate-300 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.22)_1px,transparent_0)] bg-[length:6px_6px]">
                      <span className="font-mono text-[18px] font-black tracking-[-0.05em] text-slate-900 select-none">
                        {captchaCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      aria-label="Refresh captcha"
                      className="flex h-9 w-9 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <input
                    value={captchaInput}
                    onChange={(e) => {
                      setLoginError("");
                      setCaptchaInput(e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                {loginError && (
                  <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-600 flex items-start gap-1.5">
                    <FaLock className="mt-0.5 shrink-0" size={10} />
                    {loginError}
                  </div>
                )}

                <button
                  onClick={handleLoginSubmit}
                  className="w-full bg-[#0f3a9a] hover:bg-[#0a2558] text-white font-bold uppercase text-[12px] py-2.5 rounded cursor-pointer transition-colors"
                >
                  Login
                </button>

                <div className="flex items-center justify-between text-[10.5px] font-bold text-[#0c5f86] pt-1">
                  <span className="cursor-pointer hover:underline">Forgot Username</span>
                  <span className="cursor-pointer hover:underline">Forgot Password</span>
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
