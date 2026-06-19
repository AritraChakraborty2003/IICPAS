"use client";

import React, { useState } from "react";
import { CheckCircle, RefreshCw, Eye, EyeOff } from "lucide-react";

type View = "signup" | "login" | "loggedIn";

const DUMMY_NAME     = "IICPA Student";
const DUMMY_EMAIL    = "student@iicpa.in";
const DUMMY_MOBILE   = "9876543210";
const LOGIN_USER     = "student@iicpa.in";
const LOGIN_PASS     = "IICPA@123";
const SIGNUP_CAP     = "CEKbpR";
const LOGIN_CAP      = "fByGYp";

// ─── Launch Screen ─────────────────────────────────────────────────────────────
function LaunchScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a3a5c] via-[#1e4976] to-[#0f2a45]">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg">
            <img src="/images/simulations/satyamev-jayate.jpg" alt="Emblem"
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
        <button onClick={onStart}
          className="mt-2 rounded-lg bg-[#e8b800] px-10 py-3 text-[15px] font-bold uppercase tracking-widest text-[#1a3a5c] shadow-lg transition hover:bg-yellow-400 active:scale-95">
          START EXPERIMENT
        </button>
      </div>
    </div>
  );
}

// ─── Top header (pixel-perfect match) ─────────────────────────────────────────
function TopNav({ onSignInClick, onSignUpClick }: { onSignInClick: () => void; onSignUpClick: () => void }) {
  return (
    <header className="w-full bg-white">
      {/* Topmost strip */}
      <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-[#f5f5f5] px-5 py-[4px] text-[11px]">
        <div className="flex items-center gap-2 font-medium text-[#333]">
          {/* Tricolour */}
          <div className="flex h-[15px] w-[22px] flex-col overflow-hidden rounded-[1px]">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
          <span>भारत सरकार</span>
          <span className="text-[#aaa]">/</span>
          <span>Government of India</span>
        </div>
        <div className="flex items-center gap-3 text-[#1a6fa8]">
          <span className="cursor-pointer">🔊 Screen Reader Access</span>
          <span className="text-[#bbb]">|</span>
          <span className="cursor-pointer">Skip to main content</span>
          <span className="text-[#bbb]">|</span>
          <span className="font-bold cursor-pointer">A+</span>
          <span className="cursor-pointer">A</span>
          <span className="cursor-pointer">A-</span>
          <span className="text-[#bbb]">|</span>
          <div className="flex gap-1">
            <div className="h-[14px] w-[14px] rounded-full border border-[#aaa] bg-white" />
            <div className="h-[14px] w-[14px] rounded-full border border-[#aaa] bg-[#444]" />
          </div>
          <span className="text-[#bbb]">|</span>
          <span className="cursor-pointer">🌐 English ▾</span>
        </div>
      </div>

      {/* Logo + title + sign in/up row */}
      <div className="flex items-center justify-between px-6 py-5 bg-white">
        {/* Emblem + ministry */}
        <div className="flex items-center gap-3">
          <div className="h-[76px] w-[76px] shrink-0 overflow-hidden">
            <img src="/images/simulations/satyamev-jayate.jpg" alt="Emblem"
              className="h-full w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div className="leading-[1.45] text-[13px] text-[#444]">
            <div className="font-semibold text-[#222]">भारत सरकार</div>
            <div>श्रम एवं रोज़गार मंत्रालय</div>
            <div>Government of India</div>
            <div>Ministry of Labour and Employment</div>
          </div>
        </div>

        {/* Portal name */}
        <div className="text-center">
          <div className="text-[40px] font-black leading-none tracking-tight text-[#1a6fa8]"
            style={{ fontFamily: "'Arial Black', 'Franklin Gothic Medium', sans-serif" }}>
            SHRAM SUVIDHA 2.0
          </div>
          <div className="mt-1 text-[13px] text-[#666]">One-Stop-Solution for Labour Law Compliance.</div>
        </div>

        {/* Sign in / Sign up */}
        <div className="flex gap-3">
          <button onClick={onSignInClick}
            className="rounded border-2 border-[#1a6fa8] bg-white px-7 py-2 text-[14px] font-bold text-[#1a6fa8] transition hover:bg-[#f0f7ff]">
            Sign in
          </button>
          <button onClick={onSignUpClick}
            className="rounded bg-[#1a6fa8] px-7 py-2 text-[14px] font-bold text-white transition hover:bg-[#155d8e]">
            Sign up
          </button>
        </div>
      </div>

      {/* Teal nav strip */}
      <nav className="flex items-stretch bg-[#2c7a8c]">
        <button className="flex w-[54px] items-center justify-center border-r border-white/20 text-white hover:bg-white/15">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>
        {["About us ▾", "Codes & Rules ▾", "Know Your ▾", "Media ▾", "Startup Schemes", "Notifications", "User Manual", "FAQ's ▾", "NMDS Data"].map((item) => (
          <button key={item}
            className="border-r border-white/20 px-5 py-3 text-[13px] font-medium text-white transition hover:bg-white/15 whitespace-nowrap">
            {item}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ─── Textured background wrapper ───────────────────────────────────────────────
function PageBg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col"
      style={{
        backgroundColor: "#d4d8de",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='3' height='3' viewBox='0 0 3 3' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='1' height='1' fill='rgba(255,255,255,0.28)'/%3E%3C/svg%3E\")",
        backgroundSize: "3px 3px",
      }}>
      {children}
    </div>
  );
}

// ─── Captcha widget ────────────────────────────────────────────────────────────
function CaptchaRow({ code, value, onChange, error }: {
  code: string; value: string; onChange: (v: string) => void; error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[14px] font-medium text-[#333]">
        Captcha Code <span className="text-[#e53e3e]">*</span>
      </label>
      <div className="flex items-center gap-2">
        {/* Captcha image box */}
        <div className="flex h-[46px] w-[130px] shrink-0 items-center justify-center rounded border border-[#c0c0c0] bg-[#ede9df] shadow-inner">
          <span className="select-none font-mono text-[22px] font-black text-[#111]"
            style={{ fontStyle: "italic", letterSpacing: "0.12em", textShadow: "1px 1px 0 rgba(0,0,0,0.18)" }}>
            {code}
          </span>
        </div>
        {/* Refresh button */}
        <button type="button"
          className="flex h-[46px] w-[46px] items-center justify-center rounded border border-[#c0c0c0] bg-white text-[#666] hover:bg-[#f0f0f0]">
          <RefreshCw size={16} />
        </button>
        {/* Input */}
        <input value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="Enter Captcha"
          className="h-[46px] flex-1 rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]" />
      </div>
      {error && <p className="mt-1 text-[11px] text-[#e53e3e]">{error}</p>}
    </div>
  );
}

// ─── Submit + Reset button row ─────────────────────────────────────────────────
function ActionButtons({ onSubmit, onReset, submitLabel }: {
  onSubmit: () => void; onReset: () => void; submitLabel: React.ReactNode;
}) {
  return (
    <div className="mt-7 flex gap-0">
      <button onClick={onSubmit}
        className="flex flex-1 items-center justify-center gap-2 rounded-l bg-[#233f8f] py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#1a3070] active:scale-[0.99]">
        {submitLabel}
      </button>
      <button onClick={onReset}
        className="flex flex-1 items-center justify-center rounded-r bg-[#c0392b] py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#a93226] active:scale-[0.99]">
        Reset
      </button>
    </div>
  );
}

// ─── Sign-Up page ──────────────────────────────────────────────────────────────
function SignUpPage({ onSuccess, onLoginClick }: { onSuccess: () => void; onLoginClick: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", mobile: "", captcha: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Valid email is required";
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = "Enter a 10-digit mobile number";
    if (!form.captcha.trim()) e.captcha = "Enter the captcha";
    else if (form.captcha !== SIGNUP_CAP) e.captcha = "Captcha does not match";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); onSuccess(); }, 1400);
  };

  const reset = () => { setForm({ name: "", email: "", mobile: "", captcha: "" }); setErrors({}); };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div className="mx-auto my-8 w-full max-w-[660px] rounded bg-white px-10 py-9 shadow-[0_2px_18px_rgba(0,0,0,0.14)]">
      <h2 className="text-center text-[22px] font-bold text-[#111]">Welcome to Shram Suvidha Portal</h2>
      <p className="mt-0.5 text-center text-[16px] font-semibold text-[#444]">Sign-up</p>

      {/* Hint */}
      <div className="mt-4 mb-5 rounded border border-[#bee3f8] bg-[#ebf8ff] px-3 py-2 text-[12px] text-[#2b6cb0]">
        Use <strong>{DUMMY_NAME}</strong>, <strong>{DUMMY_EMAIL}</strong>, mobile <strong>{DUMMY_MOBILE}</strong>, captcha <strong className="font-mono">{SIGNUP_CAP}</strong>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-[#333]">Name <span className="text-[#e53e3e]">*</span></label>
          <input {...field("name")} placeholder="Enter your name"
            className="h-[46px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]" />
          {errors.name && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-[#333]">Email <span className="text-[#e53e3e]">*</span></label>
          <input {...field("email")} placeholder="Enter valid email id"
            className="h-[46px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]" />
          {errors.email && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.email}</p>}
        </div>

        {/* Mobile */}
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-[#333]">Mobile <span className="text-[#e53e3e]">*</span></label>
          <input {...field("mobile")} placeholder="Enter mobile no." maxLength={10}
            className="h-[46px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]" />
          {errors.mobile && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.mobile}</p>}
        </div>

        <CaptchaRow code={SIGNUP_CAP} value={form.captcha}
          onChange={(v) => setForm((p) => ({ ...p, captcha: v }))} error={errors.captcha} />
      </div>

      <ActionButtons onSubmit={submit} onReset={reset}
        submitLabel={showSuccess ? <><CheckCircle size={17} className="text-green-300" /> Registered!</> : "Submit"} />

      <p className="mt-5 text-center text-[13px] text-[#666]">
        Already have an account?{" "}
        <button onClick={onLoginClick} className="font-semibold text-[#1a6fa8] hover:underline">Log in here</button>
      </p>
    </div>
  );
}

// ─── Login page ────────────────────────────────────────────────────────────────
function LoginPage({ onSuccess, onSignUpClick }: { onSuccess: () => void; onSignUpClick: () => void }) {
  const [mode, setMode] = useState<"otp" | "password">("password");
  const [form, setForm] = useState({ username: "", password: "", captcha: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.password.trim()) e.password = "Password is required";
    else if (form.username !== LOGIN_USER || form.password !== LOGIN_PASS)
      e.password = `Invalid credentials — use ${LOGIN_USER} / ${LOGIN_PASS}`;
    if (!form.captcha.trim()) e.captcha = "Enter the captcha";
    else if (form.captcha !== LOGIN_CAP) e.captcha = "Captcha does not match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); onSuccess(); }, 1200);
  };

  const reset = () => { setForm({ username: "", password: "", captcha: "" }); setErrors({}); };

  return (
    /* Card: same width as real portal — centred, white, shadow */
    <div className="mx-auto my-8 w-full max-w-[660px] rounded bg-white px-10 py-9 shadow-[0_2px_18px_rgba(0,0,0,0.14)]">
      <h2 className="text-center text-[22px] font-bold text-[#111]">Welcome to Shram Suvidha Portal</h2>
      <p className="mt-0.5 text-center text-[16px] font-semibold text-[#444]">Log-in</p>

      {/* Mandatory notice — bold red-orange, centred, exactly as screenshot */}
      <p className="mt-3 text-center text-[13.5px] font-bold leading-snug text-[#c0392b]">
        It is mandatory for all users to reset their password upon first login using the &apos;Forgot Password&apos; link.
      </p>

      {/* Hint box */}
      <div className="mt-4 mb-5 rounded border border-[#bee3f8] bg-[#ebf8ff] px-3 py-2 text-[12px] text-[#2b6cb0]">
        Use <strong>{LOGIN_USER}</strong> / <strong>{LOGIN_PASS}</strong>, captcha <strong className="font-mono">{LOGIN_CAP}</strong> to login.
      </div>

      {/* Radio toggle */}
      <div className="mb-6 flex items-center justify-center gap-8 text-[14px] text-[#333]">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="radio" name="lmode" checked={mode === "otp"} onChange={() => setMode("otp")} className="accent-[#1a6fa8] h-4 w-4" />
          Mobile/Email OTP
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="radio" name="lmode" checked={mode === "password"} onChange={() => setMode("password")} className="accent-[#1a6fa8] h-4 w-4" />
          Username/Password
        </label>
      </div>

      {mode === "otp" ? (
        <div className="rounded border border-[#bee3f8] bg-[#ebf8ff] px-4 py-6 text-center text-[14px] text-[#2b6cb0]">
          OTP mode is unavailable in this simulation.{" "}
          <button className="font-semibold underline" onClick={() => setMode("password")}>Switch to Username/Password</button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-[#333]">
              Username <span className="text-[#e53e3e]">*</span>
            </label>
            <input
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Enter Username"
              className="h-[46px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
            />
            {errors.username && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-[#333]">
              Password <span className="text-[#e53e3e]">*</span>
            </label>
            <div className="relative flex">
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter valid password"
                className="h-[46px] flex-1 rounded-l border border-r-0 border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
              />
              {/* Green eye button — exact colour from screenshot */}
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="flex h-[46px] w-[50px] shrink-0 items-center justify-center rounded-r border border-[#c0c0c0] bg-[#2e7d4f] text-white hover:bg-[#276644]"
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-[11px] text-[#e53e3e]">{errors.password}</p>}
          </div>

          <CaptchaRow code={LOGIN_CAP} value={form.captcha}
            onChange={(v) => setForm((p) => ({ ...p, captcha: v }))} error={errors.captcha} />
        </div>
      )}

      <ActionButtons onSubmit={submit} onReset={reset}
        submitLabel={showSuccess ? <><CheckCircle size={17} className="text-green-300" /> Logged in!</> : "Submit"} />

      <p className="mt-5 text-center text-[13px] text-[#666]">
        Don&apos;t have an account?{" "}
        <button onClick={onSignUpClick} className="font-semibold text-[#1a6fa8] hover:underline">Sign up here</button>
      </p>
    </div>
  );
}

// ─── Post-login Dashboard ──────────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="mx-auto my-8 w-full max-w-[860px] rounded bg-white px-8 py-8 shadow-[0_2px_18px_rgba(0,0,0,0.14)]">
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
      <main className="flex-1 px-4 pb-10">
        {view === "signup"    && <SignUpPage  onSuccess={() => setView("login")}     onLoginClick={() => setView("login")} />}
        {view === "login"     && <LoginPage   onSuccess={() => setView("loggedIn")}  onSignUpClick={() => setView("signup")} />}
        {view === "loggedIn"  && <Dashboard   onLogout={() => setView("login")} />}
      </main>
      <footer className="mt-auto border-t border-[#bbb] bg-white py-3 text-center text-[11px] text-[#888]">
        © 2024 Ministry of Labour &amp; Employment, Government of India &nbsp;|&nbsp; Shram Suvidha 2.0 — Simulation for educational purposes only
      </footer>
    </PageBg>
  );
}
