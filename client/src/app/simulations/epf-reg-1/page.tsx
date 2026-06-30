"use client";

import React, { useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  Link2,
  NotebookText,
  UserPlus2,
  ThumbsUp,
  RotateCcw,
} from "lucide-react";

const LOGIN_USER = "APHYD1577313000";
const LOGIN_PASS = "Epfo@123";

// ─── Top simulation disclaimer ─────────────────────────────────────────────
function SimBanner() {
  return (
    <div className="sticky top-0 z-50 bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
      This is a Simulation. Use For Educational Purposes ONLY.
    </div>
  );
}

// ─── Header: EPFO branding ──────────────────────────────────────────────────
function Header() {
  return (
    <header className="border-b border-[#ddd] bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <img
          src="/images/simulations/epfo.jpg"
          alt="EPFO Logo"
          className="h-[54px] w-[54px] shrink-0 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="leading-[1.4]">
          <div className="text-[19px] font-bold text-[#c0392b]">
            Employees&apos; Provident Fund Organisation, India
          </div>
          <div className="text-[13px] text-[#555]">
            Ministry of Labour &amp; Employment
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Generic panel with a coloured title bar ────────────────────────────────
function Panel({
  title,
  headerClass,
  icon,
  children,
}: {
  title: string;
  headerClass: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded border border-[#d8d8d8] bg-white shadow-sm">
      <div
        className={`flex items-center justify-between px-4 py-2.5 text-[15px] font-bold text-white ${headerClass}`}
      >
        <span>{title}</span>
        {icon}
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

// ─── G20 placeholder banner ─────────────────────────────────────────────────
function G20Banner() {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 rounded border border-[#d8d8d8] bg-white p-6 text-center shadow-sm">
      <div
        className="text-[46px] font-black leading-none"
        style={{ fontFamily: "'Arial Black', sans-serif" }}
      >
        <span className="text-[#ff9933]">G</span>
        <span className="text-[#444]">2</span>
        <span className="text-[#1b6ca8]">0</span>
      </div>
      <div className="text-[14px] font-semibold text-[#444]">भारत 2023 INDIA</div>
      <div className="text-[13px] text-[#777]">वसुधैव कुटुम्बकम्</div>
      <div className="mt-2 text-[12px] font-medium tracking-wide text-[#888]">
        ONE EARTH &nbsp;•&nbsp; ONE FAMILY &nbsp;•&nbsp; ONE FUTURE
      </div>
    </div>
  );
}

// ─── Instructions panel ─────────────────────────────────────────────────────
function InstructionsPanel() {
  const items = [
    "Please create your permanent login id and password of your choice after the first login.",
    "In case you have forgotten the password/login id, use Forgot Password link to get the same through SMS on your registered mobile number.",
    "In case your account is locked due to repeated use of wrong password, use Unlock account link.",
  ];
  return (
    <Panel title="Instructions" headerClass="bg-gradient-to-r from-[#d9756d] to-[#c0504d]">
      <ul className="space-y-3.5 text-[14px] text-[#333]">
        {items.map((text, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[3px] text-[#e08a3c]">▶</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ─── Establishment Sign In panel ────────────────────────────────────────────
function SignInPanel({ onSuccess }: { onSuccess: (user: string) => void }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = () => {
    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and Password are required");
      return;
    }
    if (form.username !== LOGIN_USER || form.password !== LOGIN_PASS) {
      setError(`Invalid credentials — use ${LOGIN_USER} / ${LOGIN_PASS}`);
      return;
    }
    setError("");
    onSuccess(form.username);
  };

  const reset = () => {
    setForm({ username: "", password: "" });
    setError("");
  };

  return (
    <Panel
      title="Establishment Sign In"
      headerClass="bg-[#2f80b5]"
      icon={<ArrowRight size={18} />}
    >
      <div className="mb-4 flex justify-center">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#eef3f7] text-[#2f80b5]">
          <User size={28} />
        </div>
      </div>

      <div className="mb-3 rounded border border-[#bee3f8] bg-[#ebf8ff] px-3 py-2 text-[11.5px] text-[#2b6cb0]">
        Use <strong>{LOGIN_USER}</strong> / <strong>{LOGIN_PASS}</strong> to sign in.
      </div>

      <div className="space-y-3">
        <div className="flex items-center rounded border border-[#c0c0c0] bg-white">
          <span className="flex h-[42px] w-[40px] shrink-0 items-center justify-center text-[#888]">
            <User size={16} />
          </span>
          <input
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="Username"
            className="h-[42px] flex-1 rounded-r border-l border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
          />
        </div>
        <div className="flex items-center rounded border border-[#c0c0c0] bg-white">
          <span className="flex h-[42px] w-[40px] shrink-0 items-center justify-center text-[#888]">
            <Lock size={16} />
          </span>
          <input
            type={showPwd ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Enter Password"
            className="h-[42px] flex-1 border-l border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="flex h-[42px] w-[40px] shrink-0 items-center justify-center text-[#888] hover:text-[#444]"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && <p className="text-[11.5px] text-[#e53e3e]">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={submit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded bg-[#5cb85c] py-2.5 text-[14px] font-bold text-white transition hover:bg-[#4ca64c] active:scale-[0.99]"
          >
            <CheckCircle size={16} /> Sign In
          </button>
          <button
            onClick={reset}
            className="flex flex-1 items-center justify-center gap-1.5 rounded bg-[#d9534f] py-2.5 text-[14px] font-bold text-white transition hover:bg-[#c9302c] active:scale-[0.99]"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#555]">
        <span className="cursor-pointer hover:underline" onClick={() => setNotice("Not available in this simulation.")}>
          Forgot Password
        </span>
        <span className="text-[#bbb]">|</span>
        <span className="cursor-pointer hover:underline" onClick={() => setNotice("Not available in this simulation.")}>
          Unlock Account
        </span>
      </div>
      <div className="mt-2 text-center text-[13px]">
        <div className="font-semibold text-[#2f80b5]">Employer Sign In</div>
        <div
          className="cursor-pointer font-semibold text-[#2f80b5] hover:underline"
          onClick={() => setNotice("Not available in this simulation.")}
        >
          Uncovered Principal Employer Sign In
        </div>
      </div>
      {notice && <p className="mt-2 text-center text-[11px] text-[#888]">{notice}</p>}
    </Panel>
  );
}

// ─── Welcome Employers panel ────────────────────────────────────────────────
function WelcomeEmployersPanel() {
  return (
    <Panel title="Welcome Employers !!" headerClass="bg-[#e8954b]" icon={<UserPlus2 size={18} />}>
      <div className="flex items-start gap-2 text-[14px] font-bold text-[#c0392b]">
        <ThumbsUp size={18} className="mt-0.5 shrink-0" />
        <span>No last date is declared by EPFO for filing nomination.</span>
      </div>
    </Panel>
  );
}

// ─── Important Links panel ──────────────────────────────────────────────────
function ImportantLinksPanel() {
  const links = [
    "Common Registration Under (EPFO & ESIC)",
    "Employees' Provident Fund Organisation, India",
    "Shram Suvidha Portal",
    "Employer Registration for Pre-covered Establishments",
  ];
  return (
    <Panel title="Important Links" headerClass="bg-[#5c7a78]" icon={<Link2 size={18} />}>
      <ul className="space-y-2.5 text-[13.5px]">
        {links.map((text) => (
          <li key={text} className="flex gap-2">
            <span className="mt-[3px] text-[#e08a3c]">▶</span>
            <span className="cursor-pointer text-[#2f80b5] hover:underline">{text}</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="mt-[1px] text-[#e08a3c]">▶</span>
          <span className="cursor-pointer text-[#2f80b5] hover:underline">
            Uncovered Principal Employer Registration
          </span>
          <span className="rounded bg-[#d9534f] px-1.5 py-[1px] text-[10px] font-bold text-white">
            NEW!
          </span>
        </li>
      </ul>
    </Panel>
  );
}

// ─── What's New panel ───────────────────────────────────────────────────────
function WhatsNewPanel() {
  return (
    <Panel title="What&apos;s New" headerClass="bg-[#1f4e79]" icon={<NotebookText size={18} />}>
      <div className="space-y-2.5 text-[12.5px] leading-snug text-[#333]">
        <p>
          EPFO services are now available on the UMANG (Unified Mobile APP for New
          Governance). The UMANG APP can be downloaded by giving a missed call
          9718397183. The APP can also be downloaded from{" "}
          <span className="cursor-pointer text-[#2f80b5] hover:underline">UMANG</span>{" "}
          website or from the play/app stores. Erstwhile EPF mobile services are being
          discontinued.
        </p>
        <p>
          The ECR format has been revised and it will be UAN based without the
          erstwhile member id. Please see the reference documents.
        </p>
        <p>Online payments through Multi banking introduced.</p>
        <p>UAN upfront allotment introduced.</p>
      </div>
    </Panel>
  );
}

// ─── Logged-in success card (replaces Sign In panel content) ───────────────
function LoginSuccess({ user, onRestart }: { user: string; onRestart: () => void }) {
  return (
    <Panel title="Establishment Sign In" headerClass="bg-[#2f80b5]" icon={<ArrowRight size={18} />}>
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_8px_rgba(34,197,94,0.18)]">
          <CheckCircle size={32} className="text-white" />
        </div>
        <p className="text-[16px] font-bold text-[#1a7a3a]">Login Successful!</p>
        <p className="text-[13px] text-[#555]">
          Welcome, <span className="font-semibold">{user}</span>
        </p>
        <button
          onClick={onRestart}
          className="mt-2 rounded border border-[#2f80b5] px-4 py-1.5 text-[13px] font-semibold text-[#2f80b5] hover:bg-[#eef6fb]"
        >
          Sign out
        </button>
      </div>
    </Panel>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-auto bg-[#3a3a3a] py-4 text-center text-[12px] leading-relaxed text-[#ddd]">
      <p>Designed, Developed and Hosted by: IICPA, India</p>
      <p>Last Updated Thu 05 Oct 2023 (PV 4.3.22)</p>
      <p>This site is best viewed through Mozilla Firefox 52.x or higher.</p>
    </footer>
  );
}

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg1Page() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <SimBanner />
      <Header />

      <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
        <div className="grid gap-5 md:grid-cols-[2.4fr_1fr_1fr]">
          <G20Banner />
          <InstructionsPanel />
          {loggedInUser ? (
            <LoginSuccess user={loggedInUser} onRestart={() => setLoggedInUser(null)} />
          ) : (
            <SignInPanel onSuccess={setLoggedInUser} />
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <WelcomeEmployersPanel />
          <ImportantLinksPanel />
          <WhatsNewPanel />
        </div>
      </main>

      <Footer />
    </div>
  );
}
