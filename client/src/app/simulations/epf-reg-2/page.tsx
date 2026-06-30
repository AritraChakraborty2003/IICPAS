"use client";

import React, { useState } from "react";
import {
  Users,
  Eye,
  EyeOff,
  CheckCircle,
  RotateCcw,
  FileText,
  Bell,
  Link2,
  Boxes,
  ThumbsUp,
  Menu,
  Minus,
  AlertCircle,
  HelpCircle,
  Play,
  Phone,
} from "lucide-react";

const LOGIN_UAN = "100400800693";
const LOGIN_PASS = "Member@123";
const CAPTCHA_CODE = "P237M";
const MOBILE_LAST4 = "1316";
const DUMMY_OTP = "123456";

// ─── Top simulation disclaimer ─────────────────────────────────────────────
function SimBanner() {
  return (
    <div className="sticky top-0 z-50 bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
      This is a Simulation. Use For Educational Purposes ONLY.
    </div>
  );
}

// ─── Header: Member e-SEWA branding ─────────────────────────────────────────
function Header() {
  return (
    <header className="border-b border-[#ddd] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
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
            <div className="text-[19px] font-bold text-[#157a72]">
              Employees&apos; Provident Fund Organisation, India
            </div>
            <div className="text-[12px] font-bold tracking-wide text-[#8a4b16]">
              MINISTRY OF LABOUR &amp; EMPLOYMENT, GOVERNMENT OF INDIA
            </div>
          </div>
        </div>

        <div className="text-right leading-[1.4]">
          <div className="text-[14px] font-semibold text-[#157a72]">
            Universal Account Number (UAN)
          </div>
          <div className="text-[20px] font-bold text-[#c0392b]">MEMBER e-SEWA</div>
        </div>
      </div>
      <div className="h-[34px] bg-[#f3f3f3]" />
    </header>
  );
}

// ─── Generic panel with a coloured title bar ────────────────────────────────
function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded border border-[#d8d8d8] bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-[#157a72] px-4 py-2.5 text-[15px] font-bold text-white">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

// ─── G20 placeholder banner ─────────────────────────────────────────────────
function G20Banner() {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 rounded border border-[#d8d8d8] bg-white p-6 text-center shadow-sm">
      <img
        src="/images/simulations/G20-Logo.jpg"
        alt="G20 Logo"
        className="max-h-[300px] w-auto object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

// ─── Member Sign In panel (floating avatar, no title bar) ──────────────────
function MemberSignInPanel({ onSuccess }: { onSuccess: (uan: string) => void }) {
  const [form, setForm] = useState({ uan: "", password: "", captcha: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = () => {
    if (!form.uan.trim() || !form.password.trim() || !form.captcha.trim()) {
      setError("UAN, Password and Captcha are required");
      return;
    }
    if (form.uan !== LOGIN_UAN || form.password !== LOGIN_PASS) {
      setError(`Invalid credentials — use ${LOGIN_UAN} / ${LOGIN_PASS}`);
      return;
    }
    if (form.captcha !== CAPTCHA_CODE) {
      setError("Captcha does not match");
      return;
    }
    setError("");
    onSuccess(form.uan);
  };

  const reset = () => {
    setForm({ uan: "", password: "", captcha: "" });
    setError("");
  };

  return (
    <div className="relative mt-7 rounded-[10px] border border-[#d8d8d8] bg-white px-6 pb-6 pt-12 shadow-sm">
      <div className="absolute left-1/2 top-0 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#157a72] bg-white shadow-sm">
        <img
          src="/images/simulations/home-user-image.png"
          alt="Member"
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div className="mb-3 rounded border border-[#bee3da] bg-[#eaf7f4] px-3 py-2 text-[11.5px] text-[#157a72]">
        Use <strong>{LOGIN_UAN}</strong> / <strong>{LOGIN_PASS}</strong>, captcha{" "}
        <strong className="font-mono">{CAPTCHA_CODE}</strong> to sign in.
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
          <label className="text-[14px] font-semibold text-[#333]">UAN&nbsp;:</label>
          <input
            value={form.uan}
            onChange={(e) => setForm((p) => ({ ...p, uan: e.target.value }))}
            placeholder="Enter UAN"
            className="h-[40px] rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
          />
        </div>

        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
          <label className="text-[14px] font-semibold text-[#333]">Password&nbsp;:</label>
          <div className="flex">
            <input
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Enter Password"
              className="h-[40px] flex-1 rounded-l border border-r-0 border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-r border border-[#c0c0c0] bg-[#157a72] text-white hover:bg-[#0f5f59]"
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
          <label className="text-[14px] font-semibold text-[#333]">Captcha&nbsp;:</label>
          <div className="flex items-center gap-2">
            <div
              className="flex h-[40px] w-[110px] shrink-0 items-center justify-center rounded border border-[#c0c0c0] bg-[#ede9df] shadow-inner"
              style={{
                backgroundImage:
                  "linear-gradient(0deg, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
                backgroundSize: "6px 6px",
              }}
            >
              <span
                className="select-none font-mono text-[18px] font-black text-[#222]"
                style={{ fontStyle: "italic", letterSpacing: "0.1em" }}
              >
                {CAPTCHA_CODE}
              </span>
            </div>
            <input
              value={form.captcha}
              onChange={(e) => setForm((p) => ({ ...p, captcha: e.target.value }))}
              placeholder="Enter Captcha"
              className="h-[40px] flex-1 rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
            />
          </div>
        </div>

        {error && <p className="text-[11.5px] text-[#e53e3e]">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={submit}
            className="flex items-center justify-center gap-1.5 rounded bg-[#157a72] px-5 py-2 text-[14px] font-bold text-white transition hover:bg-[#0f5f59] active:scale-[0.99]"
          >
            <CheckCircle size={16} /> Sign In
          </button>
          <button
            onClick={reset}
            className="flex items-center justify-center gap-1.5 rounded bg-[#9fb4b1] px-5 py-2 text-[14px] font-bold text-white transition hover:bg-[#85a09c] active:scale-[0.99]"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      <div className="mt-4 text-[13px]">
        <span
          className="cursor-pointer font-semibold text-[#157a72] hover:underline"
          onClick={() => setNotice("Not available in this simulation.")}
        >
          Forgot Password ?
        </span>
      </div>
      {notice && <p className="mt-2 text-[11px] text-[#888]">{notice}</p>}
    </div>
  );
}

// ─── Dear EPF Members panel ──────────────────────────────────────────────────
function DearMembersPanel() {
  const noticeLinks = [
    "Important notice about Aadhaar linking. Click here.",
    "Benefits for Unorganised workers registering on e SHRAM portal. Click here",
    "Kind attention Members. Now Aadhaar is mandatory for filing ECR.",
    "Important notice about EDLI. Click here to read.",
    "Important notice about Bank Account Linking with UAN. Click here to read",
  ];
  const warnings = [
    "EPFO NEVER ASKS YOU TO SHARE YOUR PERSONAL DETAILS LIKE AADHAAR, PAN, BANK DETAILS ETC OVER PHONE.",
    "EPFO NEVER CALLS ANY MEMBER TO DEPOSIT ANY AMOUNT IN ANY BANK.",
    "PLEASE DO NOT RESPOND TO SUCH CALLS.",
  ];
  return (
    <Panel title="Dear EPF Members !!" icon={<Users size={16} />}>
      <p className="mb-3 text-[15px] font-bold text-[#c0392b]">
        No last date is declared by EPFO for filing e-Nomination
      </p>
      <ul className="space-y-2 text-[13px] text-[#333]">
        {noticeLinks.map((text) => (
          <li key={text} className="flex gap-1.5">
            <FileText size={13} className="mt-0.5 shrink-0 text-[#c0392b]" />
            <span className="cursor-pointer hover:underline">{text}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-1.5 text-[12.5px] font-bold text-[#333]">
        {warnings.map((text) => (
          <li key={text} className="flex gap-1.5">
            <Bell size={13} className="mt-0.5 shrink-0 text-[#157a72]" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ─── Benefits of Registration panel ─────────────────────────────────────────
function BenefitsPanel() {
  const items = [
    "Download/Print your Updated Passbook anytime.",
    "Download/ Print your UAN Card.",
    "Update your KYC information.",
  ];
  return (
    <Panel title="Benefits of Registration" icon={<Boxes size={16} />}>
      <ul className="space-y-2.5 text-[13.5px] text-[#333]">
        {items.map((text) => (
          <li key={text} className="flex gap-2">
            <span className="mt-[3px] text-[#e08a3c]">▶</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ─── Important Links panel ──────────────────────────────────────────────────
function ImportantLinksPanel() {
  const links = [
    "Track Application Status for Pension on Higher Wages",
    "Activate UAN",
    "Know your UAN",
    "Direct UAN Allotment by Employees",
    "Death claim filing by beneficiary",
    "UAN Allotment for Existing PF",
  ];
  return (
    <Panel title="Important Links" icon={<Link2 size={16} />}>
      <ul className="space-y-2.5 text-[13.5px]">
        {links.map((text) => (
          <li key={text} className="flex gap-2">
            <ThumbsUp size={13} className="mt-0.5 shrink-0 text-[#e08a3c]" />
            <span className="cursor-pointer font-semibold text-[#157a72] hover:underline">{text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-auto">
      <div className="flex items-center justify-end gap-5 border-t border-[#ddd] bg-white px-6 py-2 text-[13px] font-semibold text-[#157a72]">
        <span className="flex cursor-pointer items-center gap-1.5 hover:underline">
          <Phone size={14} /> Contact Us
        </span>
        <span className="flex cursor-pointer items-center gap-1.5 hover:underline">
          <HelpCircle size={14} /> FAQs
        </span>
      </div>
      <div className="bg-[#157a72] py-3 text-center text-[12px] leading-relaxed text-white">
        <p>©2015. Powered by EPFO Wed 06, September 2023 (PV 2.9.10)</p>
        <p>This site is best viewed at 1920 x 1080 resolution in Mozilla Firefox 58.0+</p>
      </div>
    </footer>
  );
}

// ─── Full-screen success tick overlay ───────────────────────────────────────
function TickOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">
      <div
        className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
        style={{ animation: "epfTickPop2 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">Login Successful!</p>
      <style jsx>{`
        @keyframes epfTickPop2 {
          0% {
            transform: scale(0.4);
            opacity: 0;
          }
          70% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Launch overlay (blurred portal behind, button centred on top) ─────────
function LaunchOverlay({ onStart }: { onStart: () => void }) {
  const [starting, setStarting] = useState(false);
  const handle = () => {
    if (starting) return;
    setStarting(true);
    setTimeout(onStart, 1200);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#07111f]/25 px-4 backdrop-blur-[2px]">
      <button
        type="button"
        onClick={handle}
        disabled={starting}
        className="relative z-10 inline-flex min-h-[72px] w-[min(84vw,34rem)] items-center justify-center rounded-[22px] bg-[#157a72] px-6 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(21,122,114,0.30)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0f5f59] disabled:cursor-wait disabled:opacity-80 sm:min-h-[78px] sm:px-8 sm:text-xl"
      >
        {starting ? "LOADING..." : "START EXPERIMENT"}
      </button>
    </div>
  );
}

// ─── Mandatory "Change Password" page (shown right after first login) ──────
function ChangePasswordPage({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.oldPassword.trim() || !form.newPassword.trim() || !form.confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New Password and Confirm New Password do not match");
      return;
    }
    if (!consent) {
      setError("Please provide Aadhaar consent to continue");
      return;
    }
    setError("");
    onContinue();
  };

  const reset = () => {
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setConsent(false);
    setError("");
  };

  return (
    <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-[#e8954b] px-5 py-3.5">
          <div className="flex items-center gap-2 text-[16px] font-bold text-[#8a4b16]">
            <Menu size={18} /> Change Password&nbsp;:
          </div>
          <button className="flex h-[20px] w-[20px] items-center justify-center rounded border border-[#888] text-[#888]">
            <Minus size={13} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="mb-6 flex items-center gap-2 rounded bg-[#f7e3e1] px-4 py-3 text-[14px] font-bold text-[#c0392b]">
            <AlertCircle size={18} className="shrink-0" />
            Kindly update your password.
          </div>

          <div className="mx-auto max-w-[680px] space-y-5">
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[14px] font-semibold text-[#333]">
                Old Password <span className="text-[#e53e3e]">*</span>
              </label>
              <input
                type="password"
                value={form.oldPassword}
                onChange={(e) => setForm((p) => ({ ...p, oldPassword: e.target.value }))}
                placeholder="Old Password"
                className="h-[42px] rounded border border-[#c0c0c0] bg-white px-3 text-[14px] italic text-[#157a72] outline-none placeholder:italic placeholder:text-[#157a72]/70 focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[14px] font-semibold text-[#333]">
                New Password <span className="text-[#e53e3e]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="New Password"
                  className="h-[42px] flex-1 rounded border border-[#c0c0c0] bg-white px-3 text-[14px] italic text-[#157a72] outline-none placeholder:italic placeholder:text-[#157a72]/70 focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
                />
                <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[#2f80b5] text-white">
                  <HelpCircle size={15} />
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[14px] font-semibold text-[#333]">
                Confirm New Password <span className="text-[#e53e3e]">*</span>
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm New Password"
                className="h-[42px] rounded border border-[#c0c0c0] bg-white px-3 text-[14px] italic text-[#157a72] outline-none placeholder:italic placeholder:text-[#157a72]/70 focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
              />
            </div>

            <div className="rounded bg-[#eaf3fb] p-4 text-[13px] leading-relaxed text-[#1a4f8b]">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#157a72]"
                />
                <span>
                  मैं पासवर्ड रीसेट करने के लिए अपनी पहचान स्थापित करने के उद्देश्य से आधार आधारित प्रमाणीकरण के
                  लिए अपना आधार नंबर, वन टाइम पिन (ओटीपी) डेटा प्रदान करने की सहमति देता हूं। Version : [ Wed 06,
                  September 2023 (PV 2.9.10) ]
                </span>
              </label>
              <p className="mt-2">
                I hereby consent to provide my Aadhaar Number, One Time Pin (OTP) data for Aadhaar based
                authentication for the purpose of establishing my identity for password resetting Version : [ Wed
                06, September 2023 (PV 2.9.10) ]
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className="flex items-center gap-1.5 rounded bg-[#2f80b5] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#256a96]">
                  <Play size={13} /> Listen to Consent
                </button>
                <select className="rounded border border-[#c0c0c0] bg-white px-2 py-1.5 text-[12.5px] text-[#333]">
                  <option>English</option>
                  <option>हिंदी</option>
                </select>
              </div>
            </div>

            {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={submit}
                className="rounded-full bg-[#157a72] px-6 py-2.5 text-[14px] font-bold text-white hover:bg-[#0f5f59]"
              >
                Get AADHAAR OTP
              </button>
              <button
                onClick={reset}
                className="rounded-full bg-[#d8b27a] px-6 py-2.5 text-[14px] font-bold text-white hover:bg-[#c79e60]"
              >
                Reset
              </button>
              <button
                onClick={onCancel}
                className="rounded-full bg-[#d98a86] px-6 py-2.5 text-[14px] font-bold text-white hover:bg-[#c97470]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg2Page() {
  const [launched, setLaunched] = useState(false);
  const [loggedInUan, setLoggedInUan] = useState<string | null>(null);
  const [showTick, setShowTick] = useState(false);

  const handleLoginSuccess = (uan: string) => {
    setLoggedInUan(uan);
    setShowTick(true);
    setTimeout(() => setShowTick(false), 1400);
  };

  const handleSignOut = () => {
    setLoggedInUan(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {showTick && <TickOverlay />}

      <Header />

      {loggedInUan ? (
        <ChangePasswordPage onCancel={handleSignOut} onDone={handleSignOut} />
      ) : (
        <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
          <div className="grid gap-5 md:grid-cols-[2.4fr_1fr]">
            <G20Banner />
            <MemberSignInPanel onSuccess={handleLoginSuccess} />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <DearMembersPanel />
            <BenefitsPanel />
            <ImportantLinksPanel />
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
