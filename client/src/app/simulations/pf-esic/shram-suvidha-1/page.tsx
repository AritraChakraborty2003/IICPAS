"use client";

import React, { useState } from "react";
import { CheckCircle, RefreshCw, Eye, EyeOff } from "lucide-react";

type View = "signup" | "login" | "loggedIn";

const DUMMY_NAME = "IICPA Student";
const DUMMY_EMAIL = "student@iicpa.in";
const DUMMY_MOBILE = "9876543210";
const LOGIN_USERNAME = "student@iicpa.in";
const LOGIN_PASSWORD = "IICPA@123";
const SIGNUP_CAPTCHA = "CEKbpR";
const LOGIN_CAPTCHA = "fByGYp";

// ─── Launch Screen ─────────────────────────────────────────────────────────────
function LaunchScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a3a5c] via-[#1e4976] to-[#0f2a45]">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-lg overflow-hidden">
            <img
              src="/images/simulations/satyamev-jayate.jpg"
              alt="Emblem"
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-blue-300">Government of India</div>
            <div className="text-2xl font-black tracking-tight text-white">SHRAM SUVIDHA 2.0</div>
            <div className="text-[12px] text-blue-200">Ministry of Labour &amp; Employment</div>
          </div>
        </div>
        <p className="max-w-sm text-sm text-blue-200/80">
          PF &amp; ESIC Registration Simulation — interactive replica of the Shram Suvidha Portal sign-up and login flow.
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

// ─── Top Nav (exact match to screenshot) ──────────────────────────────────────
function TopNav({
  onSignInClick,
  onSignUpClick,
}: {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}) {
  return (
    <header className="w-full bg-white">
      {/* Topmost strip — Indian flag + "Government of India" + accessibility */}
      <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-[#f5f5f5] px-5 py-[5px] text-[11px] text-[#555]">
        <div className="flex items-center gap-2">
          {/* Tricolour flag mini */}
          <div className="flex h-4 w-6 flex-col overflow-hidden rounded-[1px] shadow-sm">
            <div className="h-[5px] bg-[#FF9933]" />
            <div className="h-[5px] bg-white" />
            <div className="h-[5px] bg-[#138808]" />
          </div>
          <span className="font-medium text-[#333]">भारत सरकार</span>
          <span className="text-[#777]">|</span>
          <span className="text-[#333]">Government of India</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#1a6fa8]">
          <span className="cursor-pointer hover:underline">🔊 Screen Reader Access</span>
          <span className="text-[#999]">|</span>
          <span className="cursor-pointer hover:underline">Skip to main content</span>
          <span className="text-[#999]">|</span>
          <div className="flex items-center gap-1">
            <button className="font-bold text-[#1a6fa8]">A+</button>
            <button className="text-[#1a6fa8]">A</button>
            <button className="text-[#1a6fa8]">A-</button>
          </div>
          <span className="text-[#999]">|</span>
          <div className="flex items-center gap-0.5">
            <div className="h-4 w-4 rounded-full border border-gray-400 bg-white" />
            <div className="h-4 w-4 rounded-full border border-gray-400 bg-gray-800" />
          </div>
          <span className="text-[#999]">|</span>
          <span className="cursor-pointer hover:underline">🌐 English</span>
        </div>
      </div>

      {/* Logo row */}
      <div className="flex items-center justify-between px-6 py-4 bg-white">
        {/* Left: emblem + ministry text */}
        <div className="flex items-center gap-3">
          <div className="h-[70px] w-[70px] shrink-0 overflow-hidden">
            <img
              src="/images/simulations/satyamev-jayate.jpg"
              alt="Emblem"
              className="h-full w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[#333]">भारत सरकार</div>
            <div className="text-[13px] text-[#555]">श्रम एवं रोज़गार मंत्रालय</div>
            <div className="text-[12px] text-[#555]">Government of India</div>
            <div className="text-[12px] text-[#555]">Ministry of Labour and Employment</div>
          </div>
        </div>

        {/* Centre: portal name */}
        <div className="text-center">
          <div className="text-[38px] font-black tracking-tight text-[#1a6fa8]" style={{ fontFamily: "Arial Black, sans-serif" }}>
            SHRAM SUVIDHA 2.0
          </div>
          <div className="text-[13px] text-[#666]">One-Stop-Solution for Labour Law Compliance.</div>
        </div>

        {/* Right: Sign in / Sign up */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSignInClick}
            className="rounded border border-[#1a6fa8] bg-white px-6 py-2 text-[14px] font-semibold text-[#1a6fa8] transition hover:bg-[#f0f7ff]"
          >
            Sign in
          </button>
          <button
            onClick={onSignUpClick}
            className="rounded bg-[#1a6fa8] px-6 py-2 text-[14px] font-semibold text-white transition hover:bg-[#155d8e]"
          >
            Sign up
          </button>
        </div>
      </div>

      {/* Nav menu strip — teal */}
      <nav className="flex items-center bg-[#2c7a8c] shadow-sm">
        {/* Home icon */}
        <button className="flex h-[46px] w-[52px] items-center justify-center border-r border-white/20 text-white hover:bg-white/15">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </button>
        {["About us ▾", "Codes & Rules ▾", "Know Your ▾", "Media ▾", "Startup Schemes", "Notifications", "User Manual", "FAQ's ▾", "NMDS Data"].map((item) => (
          <button
            key={item}
            className="whitespace-nowrap border-r border-white/20 px-4 py-3 text-[13px] font-medium text-white transition hover:bg-white/15"
          >
            {item}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ─── Shared page background (textured grey like the real portal) ───────────────
function PageBg({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: "#d8dde3",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='1' height='1' fill='rgba(255,255,255,0.35)'/%3E%3C/svg%3E\")",
        backgroundSize: "4px 4px",
      }}
    >
      {children}
    </div>
  );
}

// ─── Form card (white centred card matching the real portal) ───────────────────
function FormCard({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto mt-10 mb-10 w-full ${wide ? "max-w-[660px]" : "max-w-[560px]"} rounded bg-white px-10 py-8 shadow-[0_2px_16px_rgba(0,0,0,0.13)]`}>
      {children}
    </div>
  );
}

// ─── Sign-Up Page ──────────────────────────────────────────────────────────────
function SignUpPage({
  onSuccess,
  onLoginClick,
}: {
  onSuccess: () => void;
  onLoginClick: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", mobile: "", captcha: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Valid email is required";
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = "Enter a 10-digit mobile number";
    if (!form.captcha.trim()) e.captcha = "Enter the captcha";
    else if (form.captcha !== SIGNUP_CAPTCHA) e.captcha = "Captcha does not match";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); onSuccess(); }, 1400);
  };

  const handleReset = () => {
    setForm({ name: "", email: "", mobile: "", captcha: "" });
    setErrors({});
  };

  return (
    <FormCard wide>
      <h2 className="mb-0.5 text-center text-[22px] font-bold text-[#222]">
        Welcome to Shram Suvidha Portal
      </h2>
      <p className="mb-5 text-center text-[16px] font-semibold text-[#444]">Sign-up</p>

      {/* Dummy creds hint */}
      <div className="mb-5 rounded border border-[#b6d4f0] bg-[#eaf4ff] px-3 py-2 text-[12px] text-[#1a5fa0]">
        Use <strong>{DUMMY_NAME}</strong>, <strong>{DUMMY_EMAIL}</strong>, mobile <strong>{DUMMY_MOBILE}</strong> and captcha <strong className="font-mono">{SIGNUP_CAPTCHA}</strong> to register.
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-[#333]">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Enter your name"
            className="h-[40px] w-full rounded border border-[#bbb] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
          />
          {errors.name && <p className="mt-0.5 text-[11px] text-red-600">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-[#333]">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="Enter valid email id"
            className="h-[40px] w-full rounded border border-[#bbb] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
          />
          {errors.email && <p className="mt-0.5 text-[11px] text-red-600">{errors.email}</p>}
        </div>

        {/* Mobile */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-[#333]">
            Mobile <span className="text-red-600">*</span>
          </label>
          <input
            value={form.mobile}
            onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
            placeholder="Enter mobile no."
            maxLength={10}
            className="h-[40px] w-full rounded border border-[#bbb] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
          />
          {errors.mobile && <p className="mt-0.5 text-[11px] text-red-600">{errors.mobile}</p>}
        </div>

        {/* Captcha */}
        <div>
          <label className="mb-1 block text-[14px] font-medium text-[#333]">
            Captcha Code <span className="text-red-600">*</span>
          </label>
          <div className="flex items-center gap-2">
            {/* Captcha box */}
            <div className="flex h-[40px] w-[130px] shrink-0 items-center justify-center rounded border border-[#bbb] bg-[#f0ece4]">
              <span
                className="select-none font-mono text-[21px] font-black text-[#222]"
                style={{ fontStyle: "italic", letterSpacing: "0.1em", textShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}
              >
                {SIGNUP_CAPTCHA}
              </span>
            </div>
            {/* Refresh */}
            <button type="button" className="flex h-[40px] w-[40px] items-center justify-center rounded border border-[#bbb] bg-white text-[#555] hover:bg-[#f5f5f5]">
              <RefreshCw size={15} />
            </button>
            {/* Input */}
            <input
              value={form.captcha}
              onChange={(e) => setForm((p) => ({ ...p, captcha: e.target.value }))}
              placeholder="Enter Captcha"
              className="h-[40px] flex-1 rounded border border-[#bbb] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
            />
          </div>
          {errors.captcha && <p className="mt-0.5 text-[11px] text-red-600">{errors.captcha}</p>}
        </div>
      </div>

      {/* Buttons — exact blue Submit, red Reset matching screenshot */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmit}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-[#1a4fa8] py-2.5 text-[15px] font-semibold text-white shadow transition hover:bg-[#163e87] active:scale-[0.98]"
        >
          {showSuccess ? <><CheckCircle size={18} className="text-green-300" /> Registered!</> : "Submit"}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 rounded bg-[#c0392b] py-2.5 text-[15px] font-semibold text-white shadow transition hover:bg-[#a93226] active:scale-[0.98]"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 text-center text-[13px] text-[#555]">
        Already have an account?{" "}
        <button onClick={onLoginClick} className="font-semibold text-[#1a6fa8] hover:underline">
          Log in here
        </button>
      </div>
    </FormCard>
  );
}

// ─── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({
  onSuccess,
  onSignUpClick,
}: {
  onSuccess: () => void;
  onSignUpClick: () => void;
}) {
  const [loginMode, setLoginMode] = useState<"otp" | "password">("password");
  const [form, setForm] = useState({ username: "", password: "", captcha: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.password.trim()) e.password = "Password is required";
    else if (form.username !== LOGIN_USERNAME || form.password !== LOGIN_PASSWORD)
      e.password = `Invalid credentials. Use ${LOGIN_USERNAME} / ${LOGIN_PASSWORD}`;
    if (!form.captcha.trim()) e.captcha = "Enter the captcha";
    else if (form.captcha !== LOGIN_CAPTCHA) e.captcha = "Captcha does not match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); onSuccess(); }, 1200);
  };

  const handleReset = () => {
    setForm({ username: "", password: "", captcha: "" });
    setErrors({});
  };

  return (
    <FormCard>
      <h2 className="mb-0.5 text-center text-[22px] font-bold text-[#222]">
        Welcome to Shram Suvidha Portal
      </h2>
      <p className="mb-2 text-center text-[16px] font-semibold text-[#444]">Log-in</p>

      {/* Mandatory notice — orange-red bold, exactly as in screenshot */}
      <p className="mb-4 text-center text-[13px] font-semibold leading-snug text-[#c0392b]">
        It is mandatory for all users to reset their password upon first login using the &apos;Forgot Password&apos; link.
      </p>

      {/* Dummy creds hint */}
      <div className="mb-4 rounded border border-[#b6d4f0] bg-[#eaf4ff] px-3 py-2 text-[12px] text-[#1a5fa0]">
        Use <strong>{LOGIN_USERNAME}</strong> / <strong>{LOGIN_PASSWORD}</strong>, captcha <strong className="font-mono">{LOGIN_CAPTCHA}</strong> to login.
      </div>

      {/* Radio toggle: Mobile/Email OTP | Username/Password */}
      <div className="mb-5 flex items-center justify-center gap-6 text-[14px] text-[#333]">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="loginMode"
            checked={loginMode === "otp"}
            onChange={() => setLoginMode("otp")}
            className="accent-[#1a6fa8]"
          />
          Mobile/Email OTP
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="loginMode"
            checked={loginMode === "password"}
            onChange={() => setLoginMode("password")}
            className="accent-[#1a6fa8]"
          />
          Username/Password
        </label>
      </div>

      {loginMode === "password" && (
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="mb-1 block text-[14px] font-medium text-[#333]">
              Username <span className="text-red-600">*</span>
            </label>
            <input
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Enter Username"
              className="h-[40px] w-full rounded border border-[#bbb] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
            />
            {errors.username && <p className="mt-0.5 text-[11px] text-red-600">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-[14px] font-medium text-[#333]">
              Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter valid password"
                className="h-[40px] w-full rounded border border-[#bbb] bg-white px-3 pr-12 text-[14px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
              />
              {/* Eye button — dark teal bg matching screenshot */}
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-0 top-0 flex h-[40px] w-[44px] items-center justify-center rounded-r border border-[#bbb] bg-[#2c7a8c] text-white hover:bg-[#246070]"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-0.5 text-[11px] text-red-600">{errors.password}</p>}
          </div>

          {/* Captcha */}
          <div>
            <label className="mb-1 block text-[14px] font-medium text-[#333]">
              Captcha Code <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex h-[40px] w-[120px] shrink-0 items-center justify-center rounded border border-[#bbb] bg-[#f0ece4]">
                <span
                  className="select-none font-mono text-[20px] font-black text-[#222]"
                  style={{ fontStyle: "italic", letterSpacing: "0.1em", textShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}
                >
                  {LOGIN_CAPTCHA}
                </span>
              </div>
              <button type="button" className="flex h-[40px] w-[40px] items-center justify-center rounded border border-[#bbb] bg-white text-[#555] hover:bg-[#f5f5f5]">
                <RefreshCw size={15} />
              </button>
              <input
                value={form.captcha}
                onChange={(e) => setForm((p) => ({ ...p, captcha: e.target.value }))}
                placeholder="Enter Captcha"
                className="h-[40px] flex-1 rounded border border-[#bbb] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
              />
            </div>
            {errors.captcha && <p className="mt-0.5 text-[11px] text-red-600">{errors.captcha}</p>}
          </div>
        </div>
      )}

      {loginMode === "otp" && (
        <div className="rounded border border-[#b6d4f0] bg-[#eaf4ff] px-4 py-6 text-center text-[14px] text-[#1a5fa0]">
          OTP mode is not available in this simulation. Switch to <button className="font-semibold underline" onClick={() => setLoginMode("password")}>Username/Password</button> to login.
        </div>
      )}

      {/* Submit / Reset */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmit}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-[#1a4fa8] py-2.5 text-[15px] font-semibold text-white shadow transition hover:bg-[#163e87] active:scale-[0.98]"
        >
          {showSuccess ? <><CheckCircle size={18} className="text-green-300" /> Logged in!</> : "Submit"}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 rounded bg-[#c0392b] py-2.5 text-[15px] font-semibold text-white shadow transition hover:bg-[#a93226] active:scale-[0.98]"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 text-center text-[13px] text-[#555]">
        Don&apos;t have an account?{" "}
        <button onClick={onSignUpClick} className="font-semibold text-[#1a6fa8] hover:underline">
          Sign up here
        </button>
      </div>
    </FormCard>
  );
}

// ─── Post-login Dashboard ──────────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="mx-auto my-10 w-full max-w-[860px] rounded bg-white px-8 py-8 shadow-[0_2px_16px_rgba(0,0,0,0.13)]">
      <div className="mb-6 flex items-center gap-3 rounded border border-green-300 bg-green-50 px-5 py-4">
        <CheckCircle size={32} className="shrink-0 text-green-500" />
        <div>
          <div className="text-[16px] font-bold text-green-800">Login Successful!</div>
          <div className="text-[13px] text-green-700">Welcome to Shram Suvidha 2.0 — your PF &amp; ESIC compliance portal.</div>
        </div>
      </div>
      <h2 className="mb-4 text-[20px] font-bold text-[#222]">Employer Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: "EPF Registration", c: "bg-blue-50 border-blue-200 text-blue-800" },
          { label: "ESIC Registration", c: "bg-purple-50 border-purple-200 text-purple-800" },
          { label: "Monthly PF Return", c: "bg-amber-50 border-amber-200 text-amber-800" },
          { label: "ESIC Half-Yearly Return", c: "bg-emerald-50 border-emerald-200 text-emerald-800" },
          { label: "Unified Annual Return", c: "bg-rose-50 border-rose-200 text-rose-800" },
          { label: "View / Download Challan", c: "bg-cyan-50 border-cyan-200 text-cyan-800" },
        ].map((item) => (
          <div key={item.label} className={`cursor-pointer rounded border px-4 py-4 text-[13px] font-semibold transition hover:opacity-80 ${item.c}`}>
            {item.label}
          </div>
        ))}
      </div>
      <button onClick={onLogout} className="mt-8 rounded border border-[#bbb] px-5 py-2 text-[13px] text-[#555] hover:bg-[#f5f5f5]">
        Sign Out
      </button>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function ShramSuvidha1Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("signup");

  if (!launched) return <LaunchScreen onStart={() => setLaunched(true)} />;

  return (
    <PageBg>
      <TopNav onSignInClick={() => setView("login")} onSignUpClick={() => setView("signup")} />
      <main className="flex-1 px-4 pb-12">
        {view === "signup" && <SignUpPage onSuccess={() => setView("login")} onLoginClick={() => setView("login")} />}
        {view === "login" && <LoginPage onSuccess={() => setView("loggedIn")} onSignUpClick={() => setView("signup")} />}
        {view === "loggedIn" && <Dashboard onLogout={() => setView("login")} />}
      </main>
      <footer className="border-t border-[#ccc] bg-white py-3 text-center text-[11px] text-[#888]">
        © 2024 Ministry of Labour &amp; Employment, Government of India &nbsp;|&nbsp; Shram Suvidha 2.0 — Simulation for educational purposes only
      </footer>
    </PageBg>
  );
}
