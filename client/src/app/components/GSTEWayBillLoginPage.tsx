"use client";

import React, { useState } from "react";
import { CheckCircle2, Eye, LockKeyhole, RotateCcw, UserRound } from "lucide-react";
import {
  findFieldValue,
  findUsernameValue,
  useSimulationConfig,
} from "@/lib/useSimulationConfig";

type GSTEWayBillLoginPageProps = {
  returnTo?: string;
};

// /simulations/gst/e-way-bill-1 -> gst-e-way-bill-1 (must match the slug
// derivation used by the course editor and the Simulation Manager).
const slugFromRoute = (route: string): string => {
  const match = route.match(/\/simulations\/(.+)/);
  if (!match) return "";
  return match[1].replace(/\/+$/, "").split("/").join("-").toLowerCase();
};

export default function GSTEWayBillLoginPage({
  returnTo = "/simulations/gst/e-way-bill-1",
}: GSTEWayBillLoginPageProps) {
  const expectedCaptcha = "P2R7M";
  const simConfig = useSimulationConfig(slugFromRoute(returnTo));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleLogin = () => {
    if (captchaValue.trim().toUpperCase() !== expectedCaptcha) {
      setLoginError("Incorrect captcha. Please try again.");
      return;
    }

    if (simConfig?.requireCredentialValidation) {
      const expectedUsername = findUsernameValue(simConfig);
      const expectedPassword = findFieldValue(simConfig, /pass/i);
      const isValid =
        (!expectedUsername || username.trim() === expectedUsername) &&
        (!expectedPassword || password === expectedPassword);
      if (!isValid) {
        setLoginError(
          "Invalid credentials. Please use the credentials provided for this experiment."
        );
        return;
      }
    }

    setLoginError("");
    setShowSuccessOverlay(true);
  };

  const handleRetry = () => {
    setShowSuccessOverlay(false);
    setCaptchaValue("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f5f8fb_44%,_#e8eef8_100%)] text-slate-900">
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]">
          <div className="flex flex-col items-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#47c65a] shadow-[0_22px_60px_rgba(71,198,90,0.35)]">
              <CheckCircle2 className="text-white" size={108} strokeWidth={2.2} />
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#e1141a] px-6 py-3 text-[16px] font-semibold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] transition-colors hover:bg-[#c90f15]"
            >
              <RotateCcw size={14} />
              Retry
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto flex min-h-screen w-full max-w-[1200px] items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
          <div className="border-b border-slate-200 px-6 py-5 text-center">
            <div className="text-[22px] font-serif text-slate-500">
              e - Way Bill System Login
            </div>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="flex items-stretch overflow-hidden rounded-sm border border-slate-300 bg-white">
              <div className="flex w-11 items-center justify-center bg-[#2f6fa8] text-white">
                <UserRound size={18} />
              </div>
              <input
                className="min-w-0 flex-1 bg-white px-3 py-2.5 text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
                value={username}
                onChange={(e) => {
                  setLoginError("");
                  setUsername(e.target.value);
                }}
                placeholder="Username"
              />
            </div>

            <div className="flex items-stretch overflow-hidden rounded-sm border border-slate-300 bg-white">
              <div className="flex w-11 items-center justify-center bg-[#2f6fa8] text-white">
                <LockKeyhole size={18} />
              </div>
              <input
                type="password"
                className="min-w-0 flex-1 bg-white px-3 py-2.5 text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
                value={password}
                onChange={(e) => {
                  setLoginError("");
                  setPassword(e.target.value);
                }}
                placeholder="Password"
              />
            </div>

            <div className="flex items-stretch overflow-hidden rounded-sm border border-slate-300 bg-white">
              <div className="flex w-11 shrink-0 items-center justify-center bg-[#2f6fa8] text-white">
                <Eye size={18} />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden px-2 py-1">
                <div className="flex h-[36px] w-full max-w-[150px] items-center justify-center overflow-hidden border border-slate-300 bg-white px-2">
                  <span className="text-[24px] font-black leading-none tracking-[-0.1em] text-black">
                    P2R7M
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-stretch overflow-hidden rounded-sm border border-slate-300 bg-white">
              <div className="flex h-[40px] w-[132px] items-center justify-center bg-[#2f6fa8] px-3 text-[14px] italic text-white">
                Enter Captcha
              </div>
              <input
                value={captchaValue}
                onChange={(e) => {
                  setLoginError("");
                  setCaptchaValue(e.target.value);
                }}
                className="min-w-0 flex-1 bg-[#efefef] px-3 py-2.5 text-[14px] text-slate-700 outline-none"
              />
            </div>

            {loginError && (
              <div className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                {loginError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogin}
                className="mx-auto flex w-[72%] items-center justify-center rounded-sm border-2 border-red-500 bg-[#0c5f86] px-5 py-3 text-[14px] font-medium text-white shadow-sm"
              >
                Login
              </button>
            </div>

            <div className="space-y-1 pt-1 text-center text-[13px] font-semibold text-[#2f6fa8]">
              <div className="flex items-center justify-center gap-10">
                <span>Forgot Password ?</span>
                <span>Forgot Username ?</span>
              </div>
              <div>Forgot Trans ID ?</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
