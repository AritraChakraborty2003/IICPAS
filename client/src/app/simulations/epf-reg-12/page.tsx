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
  HelpCircle,
  Phone,
  Info,
} from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

// UAN, Aadhaar, Name, Date of Birth, Mobile and the Authorisation PIN/OTP all
// come from the admin Simulation Manager (or the course editor's per-insert
// "Add/Edit Creds") for slug "epf-reg-12", matched by field label:
//   UAN / Aadhaar / Name / DOB (or Date of Birth) / Mobile / OTP (or PIN)
// If nothing is configured, the values below (matching the standard EPF
// Registration "Activate UAN" experiment for Mr. Nagarjun Patel) are used as
// the default expected answers. Only the simulated captcha code and the
// masked mobile-number digits shown in the success message are fixed UI
// mechanics, not experiment content.
const SIMULATION_SLUG = "epf-reg-12";
const CAPTCHA_CODE = "P237M";
const DEFAULT_UAN = "201973667382";
const DEFAULT_AADHAAR = "444422226666";
const DEFAULT_NAME = "Nagarjun Patel";
const DEFAULT_DOB = "22/12/1991";
const DEFAULT_MOBILE = "9980088777";
const DEFAULT_OTP = "222666";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

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

// ─── Member Sign In panel (floating avatar, decorative — not part of this
// experiment's flow, matches the real portal look) ──────────────────────────
function MemberSignInPanel() {
  const [form, setForm] = useState({ uan: "", password: "", captcha: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = () => {
    setNotice("Please use the “Activate UAN” link under Important Links for this experiment.");
  };

  const reset = () => {
    setForm({ uan: "", password: "", captcha: "" });
    setNotice("");
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
              placeholder="Password"
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
              placeholder="Enter the Captcha displayed above"
              className="h-[40px] flex-1 rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
            />
          </div>
        </div>

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
        {notice && <p className="text-[11.5px] text-[#888]">{notice}</p>}
      </div>

      <div className="mt-4 text-[13px]">
        <span className="cursor-pointer font-semibold text-[#157a72] hover:underline">
          Forgot Password ?
        </span>
      </div>
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
  const notice = "No last date is declared by EPFO for filing e-Nomination";

  return (
    <Panel title="Dear EPF Members !!" icon={<Users size={16} />}>
      <div className="mb-3 -mx-4 overflow-hidden border-b border-[#f0d6d3] bg-[#fdeee5] py-2">
        <div className="dear-members-marquee flex w-max items-center gap-12 whitespace-nowrap px-4 text-[15px] font-bold text-[#c0392b]">
          <span>{notice}</span>
          <span aria-hidden="true">{notice}</span>
        </div>
      </div>
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

      <style jsx>{`
        .dear-members-marquee {
          animation: dearMembersScroll 14s linear infinite;
        }

        @keyframes dearMembersScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
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

// ─── Important Links panel — "Activate UAN" launches this experiment ──────
function ImportantLinksPanel({ onActivateClick }: { onActivateClick: () => void }) {
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
        {links.map((text) => {
          const isActivate = text === "Activate UAN";
          return (
            <li key={text} className="flex gap-2">
              <ThumbsUp size={13} className="mt-0.5 shrink-0 text-[#e08a3c]" />
              <span
                onClick={isActivate ? onActivateClick : undefined}
                className={
                  isActivate
                    ? "cursor-pointer rounded border border-[#e1141a] px-1 font-semibold text-[#157a72] hover:underline"
                    : "cursor-pointer font-semibold text-[#157a72] hover:underline"
                }
              >
                {text}
              </span>
            </li>
          );
        })}
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

// ─── Full-screen success tick overlay (brief, shown right when UAN
// activation is validated — the "tick at the top" completion cue) ──────────
function TickOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">
      <div
        className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
        style={{ animation: "epfReg12TickPop 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">UAN Activated!</p>
      <style jsx>{`
        @keyframes epfReg12TickPop {
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

type ActivateDetails = {
  uan: string;
  aadhaar: string;
  name: string;
  dob: string;
  mobile: string;
};

// ─── Step 1: "Activate Your Uan" form ──────────────────────────────────────
function ActivateUanForm({
  uanValue,
  aadhaarValue,
  nameValue,
  dobValue,
  mobileValue,
  validateCreds,
  onSubmit,
}: {
  uanValue: string;
  aadhaarValue: string;
  nameValue: string;
  dobValue: string;
  mobileValue: string;
  validateCreds: boolean;
  onSubmit: (details: ActivateDetails) => void;
}) {
  const [idType, setIdType] = useState<"uan" | "memberId">("uan");
  const [form, setForm] = useState({
    uan: "",
    aadhaar: "",
    name: "",
    dob: "",
    mobile: "",
    captcha: "",
  });
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = () => {
    if (
      !form.uan.trim() ||
      !form.aadhaar.trim() ||
      !form.name.trim() ||
      !form.dob.trim() ||
      !form.mobile.trim() ||
      !form.captcha.trim()
    ) {
      setError("UAN, Aadhaar, Name, Date of Birth, Mobile No. and Captcha are all required.");
      return;
    }
    if (!consent) {
      setError("Please provide Aadhaar consent to continue.");
      return;
    }
    if (form.captcha.trim() !== CAPTCHA_CODE) {
      setError("Captcha does not match.");
      return;
    }
    if (
      validateCreds &&
      (normalize(form.uan) !== normalize(uanValue) ||
        normalize(form.aadhaar) !== normalize(aadhaarValue) ||
        normalize(form.name) !== normalize(nameValue) ||
        normalize(form.dob) !== normalize(dobValue) ||
        normalize(form.mobile) !== normalize(mobileValue))
    ) {
      setError(
        "These details do not match EPFO records. Please re-check the UAN, Aadhaar number, Name, Date of Birth and Mobile Number given for this experiment."
      );
      return;
    }
    setError("");
    onSubmit({ uan: form.uan, aadhaar: form.aadhaar, name: form.name, dob: form.dob, mobile: form.mobile });
  };

  const reset = () => {
    setForm({ uan: "", aadhaar: "", name: "", dob: "", mobile: "", captcha: "" });
    setConsent(false);
    setError("");
  };

  return (
    <main className="mx-auto flex w-[98vw] max-w-[1300px] flex-1 flex-col gap-5 py-6">
      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#d8d8d8] bg-[#eaf3fb] px-5 py-3 text-[16px] font-bold text-[#1a4f8b]">
          Activate Your Uan
        </div>

        <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <label className="flex items-center gap-2 text-[14px] font-semibold text-[#333]">
                <input
                  type="radio"
                  checked={idType === "uan"}
                  onChange={() => setIdType("uan")}
                  className="h-4 w-4 accent-[#157a72]"
                />
                UAN&nbsp;:
              </label>
              <input
                value={form.uan}
                onChange={set("uan")}
                disabled={idType !== "uan"}
                placeholder="Enter UAN"
                className="h-[42px] rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72] disabled:bg-[#f3f3f3]"
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <label className="flex items-center gap-2 text-[14px] font-semibold text-[#333]">
                <input
                  type="radio"
                  checked={idType === "memberId"}
                  onChange={() => setIdType("memberId")}
                  className="h-4 w-4 accent-[#157a72]"
                />
                Member ID&nbsp;:
              </label>
              <input
                disabled={idType !== "memberId"}
                placeholder="Enter Member ID"
                className="h-[42px] rounded border border-[#c0c0c0] bg-[#f3f3f3] px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa]"
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                AADHAAR <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <div className="flex">
                <input
                  type={showAadhaar ? "text" : "password"}
                  value={form.aadhaar}
                  onChange={set("aadhaar")}
                  placeholder="Enter Aadhaar Number"
                  className="h-[42px] flex-1 rounded-l border border-r-0 border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
                />
                <button
                  type="button"
                  onClick={() => setShowAadhaar((v) => !v)}
                  className="flex h-[42px] w-[40px] shrink-0 items-center justify-center rounded-r border border-[#c0c0c0] bg-[#f3f3f3] text-[#555] hover:bg-[#e8e8e8]"
                >
                  {showAadhaar ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                Name <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Enter Name as per Aadhaar"
                className="h-[42px] rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                Date of Birth <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <input
                value={form.dob}
                onChange={set("dob")}
                placeholder="DD/MM/YYYY"
                className="h-[42px] rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                Mobile No. <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <input
                value={form.mobile}
                onChange={set("mobile")}
                placeholder="Enter Mobile Number"
                className="h-[42px] rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <div />
              <div className="flex items-center gap-2">
                <div
                  className="flex h-[42px] w-[120px] shrink-0 items-center justify-center rounded border border-[#c0c0c0] bg-[#ede9df] shadow-inner"
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
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                Captcha <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <input
                value={form.captcha}
                onChange={set("captcha")}
                placeholder="Enter the Captcha displayed above"
                className="h-[42px] rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
              />
            </div>

            <label className="flex items-start gap-2 rounded border border-[#bee3da] bg-[#eaf7f4] px-3 py-3 text-[12px] leading-relaxed text-[#157a72]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#157a72]"
              />
              <span>
                मैं अपनी पहचान स्थापित करने के उद्देश्य से आधार आधारित प्रमाणीकरण के लिए अपना आधार नंबर, वन टाइम पिन
                (ओटीपी) डेटा प्रदान करने के लिए सहमत हूं और मैं यूएएन को सक्रिय करने के उद्देश्य से आधार के साथ
                उपलब्ध अपने मूल विवरण को साझा करने के लिए सहमत हूं।
                <br />I hereby consent to provide my Aadhaar Number, One Time Pin (OTP) data for Aadhaar based
                authentication for the purpose of establishing my identity and I agree to share my basic details as
                available with Aadhaar for the purpose of activating UAN.
              </span>
            </label>

            {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={submit}
                className="rounded bg-[#2f80b5] px-6 py-2 text-[14px] font-semibold text-white hover:bg-[#256a96]"
              >
                Get Authorization Pin
              </button>
              <button
                onClick={reset}
                className="rounded bg-[#9fb4b1] px-6 py-2 text-[14px] font-semibold text-white hover:bg-[#85a09c]"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="rounded border border-[#bcd7ee] bg-[#eaf3fb] p-4 text-[12.5px] leading-relaxed text-[#1a4f8b]">
            <div className="mb-2 flex items-center gap-1.5 font-bold underline">
              <Info size={14} /> INSTRUCTIONS
            </div>
            <p>The following information being entered should be as per EPFO records</p>
            <ol className="ml-4 list-decimal space-y-1 py-1">
              <li>UAN of member</li>
              <li>Member&apos;s Aadhaar number, Name, Date of birth should be as available in EPFO records.</li>
            </ol>
            <p className="mt-2">Member should have a valid mobile linked with Aadhaar number as per UIDAI records.</p>
            <p className="mt-2">
              Member&apos;s Aadhaar number, Name, Date of birth should be same as member&apos;s Aadhaar details.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Step 2: OTP / Authorization Pin verification ──────────────────────────
function OtpConfirmPage({
  details,
  otpValue,
  validateCreds,
  onCancel,
  onSuccess,
}: {
  details: ActivateDetails;
  otpValue: string;
  validateCreds: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!otp.trim()) {
      setError("Please enter the Authorization PIN sent to your Aadhaar linked mobile number.");
      return;
    }
    if (validateCreds && normalize(otp) !== normalize(otpValue)) {
      setError("Invalid PIN. Please use the Authorisation PIN provided for this experiment.");
      return;
    }
    setError("");
    onSuccess();
  };

  const reset = () => {
    setOtp("");
    setError("");
  };

  return (
    <main className="mx-auto flex w-[98vw] max-w-[1300px] flex-1 flex-col gap-3 py-6">
      <div className="flex items-center gap-2 text-[13px] text-[#555]">
        <span className="cursor-pointer text-[#2f80b5] hover:underline" onClick={onCancel}>
          Home
        </span>
        <span>/</span>
        <span>Activate Your Uan</span>
      </div>

      <div className="rounded border-t-4 border-[#e1141a] bg-white shadow-sm">
        <div className="rounded-t bg-[#e3f3e1] px-5 py-3 text-[14px] font-semibold text-[#1a7a3a]">
          An OTP has been sent to your AADHAAR linked mobile number: *********
        </div>

        <div className="border-b border-[#d8d8d8] px-5 py-3 text-[16px] font-bold text-[#1a4f8b]">
          Activate Your Uan
        </div>

        <div className="px-6 py-6">
          <div className="mx-auto max-w-[680px] space-y-4">
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">UAN&nbsp;:</label>
              <div className="rounded border border-[#e2e2e2] bg-[#f7f7f7] px-3 py-2 text-[14px] text-[#333]">
                {details.uan}
              </div>
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                AADHAAR <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <div className="rounded border border-[#e2e2e2] bg-[#f7f7f7] px-3 py-2 text-[14px] text-[#333]">
                {details.aadhaar}
              </div>
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                Name <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <div className="rounded border border-[#e2e2e2] bg-[#f7f7f7] px-3 py-2 text-[14px] text-[#333]">
                {details.name}
              </div>
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                Date of Birth <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <div className="rounded border border-[#e2e2e2] bg-[#f7f7f7] px-3 py-2 text-[14px] text-[#333]">
                {details.dob}
              </div>
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                Mobile No. <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <div className="rounded border border-[#e2e2e2] bg-[#f7f7f7] px-3 py-2 text-[14px] text-[#333]">
                {details.mobile}
              </div>
            </div>

            <label className="flex items-start gap-2 rounded border border-[#bee3da] bg-[#eaf7f4] px-3 py-3 text-[12px] leading-relaxed text-[#157a72]">
              <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 shrink-0 accent-[#157a72]" />
              <span>
                I hereby consent to provide my Aadhaar Number, One Time Pin (OTP) data for Aadhaar based
                authentication for the purpose of establishing my identity and I agree to share my basic details as
                available with Aadhaar for the purpose of activating UAN.
              </span>
            </label>

            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <label className="text-[14px] font-semibold text-[#333]">
                Enter OTP <span className="text-[#e53e3e]">*</span>&nbsp;:
              </label>
              <div>
                <input
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                    setError("");
                  }}
                  type="password"
                  placeholder="Enter Authorization PIN"
                  className="h-[42px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
                />
              </div>
            </div>

            {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={submit}
                className="rounded bg-[#2f80b5] px-6 py-2 text-[14px] font-semibold text-white hover:bg-[#256a96]"
              >
                Validate OTP and Activate UAN
              </button>
              <button
                onClick={reset}
                className="rounded bg-[#9fb4b1] px-6 py-2 text-[14px] font-semibold text-white hover:bg-[#85a09c]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Step 3: Final success page (UAN activated) — persistent tick + Retry ─
function SuccessPage({ mobile, onRetry }: { mobile: string; onRetry: () => void }) {
  const last4 = mobile.slice(-4) || "0000";
  return (
    <main className="mx-auto flex w-[98vw] max-w-[1300px] flex-1 flex-col items-center gap-6 py-10">
      <div className="w-full rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-start gap-3 rounded-t bg-[#e3f3e1] px-4 py-3 text-[14px] text-[#1a7a3a]">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <span>
            Your UAN has been activated successfully and the default password has been sent to your registered
            mobile number XXX XXX {last4}. Kindly change your default password using the change password
            functionality upon successful login.
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-6">
        <div
          className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
          style={{ animation: "epfReg12TickPop2 0.4s ease-out" }}
        >
          <CheckCircle size={52} className="text-white" />
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] hover:bg-[#c90f15]"
        >
          <RotateCcw size={15} /> Retry
        </button>
      </div>

      <style jsx>{`
        @keyframes epfReg12TickPop2 {
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
    </main>
  );
}

type View = "portal" | "activate" | "otp" | "success";

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg12Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("portal");
  const [showTick, setShowTick] = useState(false);
  const [details, setDetails] = useState<ActivateDetails | null>(null);

  // Admin-configured experiment values (Simulation Manager slug "epf-reg-12",
  // or the course editor's per-insert "Add/Edit Creds") override the default
  // Mr. Nagarjun Patel values when present.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const uanValue = findFieldValue(simConfig, /uan/i) || DEFAULT_UAN;
  const aadhaarValue = findFieldValue(simConfig, /aadhaar/i) || DEFAULT_AADHAAR;
  const nameValue = findFieldValue(simConfig, /name/i) || DEFAULT_NAME;
  const dobValue = findFieldValue(simConfig, /dob|birth/i) || DEFAULT_DOB;
  const mobileValue = findFieldValue(simConfig, /mobile/i) || DEFAULT_MOBILE;
  const otpValue = findFieldValue(simConfig, /otp|pin/i) || DEFAULT_OTP;
  const validateCreds = simConfig?.requireCredentialValidation ?? true;
  const notifyGroupComplete = useSimGroupComplete();

  const handleActivateSubmit = (submitted: ActivateDetails) => {
    setDetails(submitted);
    setView("otp");
  };

  const handleOtpSuccess = () => {
    setShowTick(true);
    setTimeout(() => setShowTick(false), 1400);
    setView("success");
    notifyGroupComplete();
  };

  const handleReset = () => {
    setDetails(null);
    setView("portal");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {showTick && <TickOverlay />}

      <Header />

      {view === "activate" && (
        <ActivateUanForm
          uanValue={uanValue}
          aadhaarValue={aadhaarValue}
          nameValue={nameValue}
          dobValue={dobValue}
          mobileValue={mobileValue}
          validateCreds={validateCreds}
          onSubmit={handleActivateSubmit}
        />
      )}
      {view === "otp" && details && (
        <OtpConfirmPage
          details={details}
          otpValue={otpValue}
          validateCreds={validateCreds}
          onCancel={handleReset}
          onSuccess={handleOtpSuccess}
        />
      )}
      {view === "success" && details && <SuccessPage mobile={details.mobile} onRetry={handleReset} />}
      {view === "portal" && (
        <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
          <div className="grid gap-5 md:grid-cols-[2.4fr_1fr]">
            <G20Banner />
            <MemberSignInPanel />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <DearMembersPanel />
            <BenefitsPanel />
            <ImportantLinksPanel onActivateClick={() => setView("activate")} />
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
