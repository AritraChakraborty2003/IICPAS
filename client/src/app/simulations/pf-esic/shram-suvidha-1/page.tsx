"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, RefreshCw, Eye, EyeOff } from "lucide-react";

type View = "signup" | "login" | "loggedIn";

const DUMMY_NAME = "IICPA Student";
const DUMMY_EMAIL = "student@iicpa.in";
const DUMMY_MOBILE = "9876543210";
const DUMMY_LOGIN_USERNAME = "student@iicpa.in";
const DUMMY_LOGIN_PASSWORD = "IICPA@123";

const CAPTCHA_CODE = "CEKbpR";

function generateCaptcha() {
  return CAPTCHA_CODE;
}

// ─── Launch Screen ────────────────────────────────────────────────────────────
function LaunchScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a3a5c] via-[#1e4976] to-[#0f2a45]">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-lg">
            <img
              src="/images/simulations/satyamev-jayate.jpg"
              alt="Emblem"
              className="h-full w-full rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-blue-300">
              Government of India
            </div>
            <div className="text-2xl font-black tracking-tight text-white">
              SHRAM SUVIDHA 2.0
            </div>
            <div className="text-[12px] text-blue-200">
              Ministry of Labour & Employment
            </div>
          </div>
        </div>
        <p className="max-w-sm text-sm text-blue-200/80">
          PF &amp; ESIC Registration Simulation — interactive replica of the
          Shram Suvidha Portal sign-up and login flow.
        </p>
        <button
          onClick={onStart}
          className="mt-2 rounded-lg bg-[#e8b800] px-10 py-3 text-[15px] font-bold uppercase tracking-widest text-[#1a3a5c] shadow-lg transition hover:bg-yellow-400 active:scale-95"
        >
          START EXPERIMENT
        </button>
      </div>
    </div>
  );
}

// ─── Top Nav Bar (matches screenshot) ────────────────────────────────────────
function TopNav({
  onSignInClick,
  onSignUpClick,
}: {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}) {
  return (
    <header className="w-full bg-white shadow-sm">
      {/* Gov strip */}
      <div className="flex items-center justify-between bg-[#f5f5f5] px-6 py-1 text-[11px] text-slate-500">
        <span>भारत सरकार / Government of India</span>
        <span>Screen Reader Access | Skip to Main Content</span>
      </div>

      {/* Main nav */}
      <div className="flex items-center justify-between bg-white px-6 py-3">
        {/* Logo + title */}
        <div className="flex items-center gap-4">
          <div className="flex h-[56px] w-[56px] items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
            <img
              src="/images/simulations/satyamev-jayate.jpg"
              alt="Emblem"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500">
              भ्रम एवं रोज़गार मंत्रालय
            </div>
            <div className="text-[10px] text-slate-500">
              Government of India
            </div>
            <div className="text-[10px] text-slate-500">
              Ministry of Labour and Employment
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="hidden text-center md:block">
          <div className="text-[28px] font-black tracking-tight text-[#1e6fa8]">
            SHRAM SUVIDHA 2.0
          </div>
          <div className="text-[12px] text-slate-500">
            One-Stop-Solution for Labour Law Compliance.
          </div>
        </div>

        {/* Sign in / Sign up */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSignInClick}
            className="rounded border border-[#1e6fa8] px-5 py-2 text-[13px] font-semibold text-[#1e6fa8] transition hover:bg-[#1e6fa8] hover:text-white"
          >
            Sign in
          </button>
          <button
            onClick={onSignUpClick}
            className="rounded bg-[#1e6fa8] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#155d8e]"
          >
            Sign up
          </button>
        </div>
      </div>

      {/* Menu strip */}
      <nav className="flex items-center gap-0 overflow-x-auto bg-[#1e6fa8]">
        {[
          "About us",
          "Codes & Rules",
          "Know Your",
          "Media",
          "Startup Schemes",
          "Notifications",
          "User Manual",
          "FAQ's",
          "NMDS Data",
        ].map((item) => (
          <button
            key={item}
            className="whitespace-nowrap px-4 py-2.5 text-[12px] font-medium text-white/90 transition hover:bg-white/20"
          >
            {item}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ─── Sign Up Panel ────────────────────────────────────────────────────────────
function SignUpPanel({
  onSuccess,
  onLoginClick,
}: {
  onSuccess: () => void;
  onLoginClick: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    captcha: "",
  });
  const [captchaCode] = useState(generateCaptcha());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Valid email is required";
    if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile))
      e.mobile = "Enter a 10-digit mobile number";
    if (!form.captcha.trim()) e.captcha = "Enter the captcha";
    else if (form.captcha !== captchaCode) e.captcha = "Captcha does not match";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onSuccess();
    }, 1400);
  };

  const handleReset = () => {
    setForm({ name: "", email: "", mobile: "", captcha: "" });
    setErrors({});
  };

  return (
    <div className="mx-auto my-8 w-full max-w-[600px] rounded-lg bg-white px-8 py-8 shadow-md">
      <h2 className="mb-1 text-center text-[20px] font-bold text-slate-800">
        Welcome to Shram Suvidha Portal
      </h2>
      <p className="mb-6 text-center text-[14px] font-semibold text-slate-600">
        Sign-up
      </p>

      {/* Hint box */}
      <div className="mb-5 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">
        Use{" "}
        <span className="font-bold">{DUMMY_NAME}</span>,{" "}
        <span className="font-bold">{DUMMY_EMAIL}</span>,{" "}
        <span className="font-bold">{DUMMY_MOBILE}</span> and captcha{" "}
        <span className="font-bold font-mono">{CAPTCHA_CODE}</span> to
        register.
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-slate-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Enter your name"
            className="h-[42px] w-full rounded border border-slate-300 px-3 text-[14px] text-slate-800 outline-none focus:border-[#1e6fa8] focus:ring-2 focus:ring-blue-100"
          />
          {errors.name && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-slate-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            value={form.email}
            onChange={(e) =>
              setForm((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="Enter valid email id"
            className="h-[42px] w-full rounded border border-slate-300 px-3 text-[14px] text-slate-800 outline-none focus:border-[#1e6fa8] focus:ring-2 focus:ring-blue-100"
          />
          {errors.email && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Mobile */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-slate-700">
            Mobile <span className="text-red-500">*</span>
          </label>
          <input
            value={form.mobile}
            onChange={(e) =>
              setForm((p) => ({ ...p, mobile: e.target.value }))
            }
            placeholder="Enter mobile no."
            maxLength={10}
            className="h-[42px] w-full rounded border border-slate-300 px-3 text-[14px] text-slate-800 outline-none focus:border-[#1e6fa8] focus:ring-2 focus:ring-blue-100"
          />
          {errors.mobile && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.mobile}</p>
          )}
        </div>

        {/* Captcha */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-slate-700">
            Captcha Code <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {/* Captcha image */}
            <div className="flex h-[42px] w-[130px] shrink-0 items-center justify-center rounded border border-slate-300 bg-[#e8e4dc] shadow-inner">
              <span
                className="select-none font-mono text-[22px] font-black tracking-widest text-slate-800"
                style={{
                  textShadow: "1px 1px 0 rgba(0,0,0,0.18)",
                  fontStyle: "italic",
                  letterSpacing: "0.12em",
                }}
              >
                {captchaCode}
              </span>
            </div>
            <button
              type="button"
              className="flex h-[42px] w-[42px] items-center justify-center rounded border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-100"
            >
              <RefreshCw size={16} />
            </button>
            <input
              value={form.captcha}
              onChange={(e) =>
                setForm((p) => ({ ...p, captcha: e.target.value }))
              }
              placeholder="Enter Captcha"
              className="h-[42px] flex-1 rounded border border-slate-300 px-3 text-[14px] text-slate-800 outline-none focus:border-[#1e6fa8] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {errors.captcha && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.captcha}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmit}
          className="relative flex flex-1 items-center justify-center gap-2 rounded bg-[#1e6fa8] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#155d8e] active:scale-[0.98]"
        >
          {showSuccess ? (
            <>
              <CheckCircle size={18} className="text-green-300" />
              Registered!
            </>
          ) : (
            "Submit"
          )}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 rounded bg-[#c0392b] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#a93226] active:scale-[0.98]"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 text-center text-[13px] text-slate-500">
        Already have an account?{" "}
        <button
          onClick={onLoginClick}
          className="font-medium text-[#1e6fa8] underline"
        >
          Log in here
        </button>
      </div>
    </div>
  );
}

// ─── Login Panel ──────────────────────────────────────────────────────────────
function LoginPanel({
  onSuccess,
  onSignUpClick,
}: {
  onSuccess: () => void;
  onSignUpClick: () => void;
}) {
  const [form, setForm] = useState({
    username: DUMMY_LOGIN_USERNAME,
    password: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogin = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = "Username / Email is required";
    if (!form.password.trim()) e.password = "Password is required";
    else if (
      form.username !== DUMMY_LOGIN_USERNAME ||
      form.password !== DUMMY_LOGIN_PASSWORD
    ) {
      e.password = "Invalid credentials. Use the dummy credentials shown above.";
    }
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="mx-auto my-8 w-full max-w-[480px] rounded-lg bg-white px-8 py-8 shadow-md">
      <h2 className="mb-1 text-center text-[20px] font-bold text-slate-800">
        Welcome to Shram Suvidha Portal
      </h2>
      <p className="mb-5 text-center text-[14px] font-semibold text-slate-600">
        Sign-in
      </p>

      {/* Hint box */}
      <div className="mb-5 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">
        Use email{" "}
        <span className="font-bold">{DUMMY_LOGIN_USERNAME}</span> and password{" "}
        <span className="font-bold">{DUMMY_LOGIN_PASSWORD}</span> to login.
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-slate-700">
            Username / Email
          </label>
          <input
            value={form.username}
            onChange={(e) =>
              setForm((p) => ({ ...p, username: e.target.value }))
            }
            className="h-[42px] w-full rounded border border-slate-300 px-3 text-[14px] text-slate-800 outline-none focus:border-[#1e6fa8] focus:ring-2 focus:ring-blue-100"
          />
          {errors.username && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.username}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder="Enter password"
              className="h-[42px] w-full rounded border border-slate-300 px-3 pr-10 text-[14px] text-slate-800 outline-none focus:border-[#1e6fa8] focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <label className="flex items-center gap-1.5 text-slate-600">
            <input type="checkbox" className="accent-[#1e6fa8]" />
            Remember me
          </label>
          <button className="text-[#1e6fa8] hover:underline">
            Forgot Password?
          </button>
        </div>
      </div>

      <button
        onClick={handleLogin}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-[#1e6fa8] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#155d8e] active:scale-[0.98]"
      >
        {showSuccess ? (
          <>
            <CheckCircle size={18} className="text-green-300" />
            Logged in!
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <div className="mt-5 text-center text-[13px] text-slate-500">
        Don&apos;t have an account?{" "}
        <button
          onClick={onSignUpClick}
          className="font-medium text-[#1e6fa8] underline"
        >
          Sign up here
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard (after login) ──────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="mx-auto my-8 w-full max-w-[900px] rounded-lg bg-white px-8 py-8 shadow-md">
      {/* Success banner */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-5 py-4">
        <CheckCircle size={32} className="shrink-0 text-green-500" />
        <div>
          <div className="text-[16px] font-bold text-green-800">
            Login Successful!
          </div>
          <div className="text-[13px] text-green-700">
            Welcome to Shram Suvidha 2.0 — your PF &amp; ESIC compliance portal.
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-[20px] font-bold text-slate-800">
        Employer Dashboard
      </h2>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: "EPF Registration", color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "ESIC Registration", color: "bg-purple-50 border-purple-200 text-purple-700" },
          { label: "Monthly PF Return", color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "ESIC Half-Yearly Return", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Unified Annual Return", color: "bg-rose-50 border-rose-200 text-rose-700" },
          { label: "View / Download Challan", color: "bg-cyan-50 border-cyan-200 text-cyan-700" },
        ].map((item) => (
          <div
            key={item.label}
            className={`cursor-pointer rounded-lg border px-4 py-4 text-[13px] font-semibold transition hover:opacity-80 ${item.color}`}
          >
            {item.label}
          </div>
        ))}
      </div>

      <button
        onClick={onLogout}
        className="mt-8 rounded border border-slate-300 px-5 py-2 text-[13px] text-slate-600 transition hover:bg-slate-100"
      >
        Sign Out
      </button>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function ShramSuvidha1Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("signup");

  if (!launched) {
    return <LaunchScreen onStart={() => setLaunched(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <TopNav
        onSignInClick={() => setView("login")}
        onSignUpClick={() => setView("signup")}
      />

      <main className="px-4 pb-12">
        {view === "signup" && (
          <SignUpPanel
            onSuccess={() => setView("login")}
            onLoginClick={() => setView("login")}
          />
        )}
        {view === "login" && (
          <LoginPanel
            onSuccess={() => setView("loggedIn")}
            onSignUpClick={() => setView("signup")}
          />
        )}
        {view === "loggedIn" && (
          <Dashboard onLogout={() => setView("login")} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-[11px] text-slate-400">
        © 2024 Ministry of Labour &amp; Employment, Government of India | Shram
        Suvidha 2.0 — Simulation for educational purposes only
      </footer>
    </div>
  );
}
