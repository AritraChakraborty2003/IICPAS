"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Play,
} from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";

// UAN, Password and the member Name all come from the admin Simulation
// Manager (or the course editor's per-insert "Add/Edit Creds") for slug
// "epf-reg-17", matched by field label: UAN / Password / Name. If nothing
// is configured, the values below (matching the standard "Passbook" login
// experiment for Mr. Nagarjun Patel) are used as the default expected
// answers. There is no hardcoded banner fallback — the instructional
// banner only appears if an admin sets bannerText.
const SIMULATION_SLUG = "epf-reg-17";
const DEFAULT_UAN = "201973667382";
const DEFAULT_PASSWORD = "Fin@123";
const DEFAULT_NAME = "Nagarjun Patel";
const CAPTCHA_CODE = "P237M";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

const MEMBER_ID = "BGBNG2962711000010012";
const TOTAL_BALANCE = 2351;
const EMPLOYEE_SHARE = 1800;
const EMPLOYER_SHARE = 551;
const PENSION_SHARE = 1250;
const CHART_YEARS = Array.from({ length: 12 }, (_, i) => 2012 + i);
const CHART_MAX = 2500;

// ─── Top simulation disclaimer ─────────────────────────────────────────────
function SimBanner() {
  return (
    <div className="sticky top-0 z-50 bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
      This is a Simulation. Use For Educational Purposes ONLY.
    </div>
  );
}

// ─── Thin utility strip above the header ───────────────────────────────────
function UtilityStrip() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e0e0] bg-white px-6 py-1.5 text-[12px]">
      <span className="font-semibold text-[#1a6fa8]">
        For EPF Balance Enquiry : 1. Give a Missed call to{" "}
        <span className="underline">9966044425</span> or 2. SMS EPFOHO UAN &lt;LAN&gt; to{" "}
        <span className="underline">7738299899</span>
      </span>
      <span className="font-semibold text-[#555]">Help Desk/Toll Free Number&nbsp;: 1800118005</span>
    </div>
  );
}

// ─── Header: national emblem + EPFO + company name, G20 / Azadi logos ─────
function Header() {
  return (
    <header className="border-b border-[#ddd] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/images/simulations/satyamev-jayate.jpg"
            alt="National Emblem"
            className="h-[50px] w-[50px] shrink-0 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <img
            src="/images/simulations/epfo.jpg"
            alt="EPFO"
            className="h-[50px] w-[50px] shrink-0 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="leading-[1.35]">
            <div className="text-[15px] font-bold text-[#333]">कर्मचारी भविष्य निधि संगठन</div>
            <div className="text-[19px] font-bold text-[#1a1a1a]">Company Private Limited</div>
            <div className="text-[11.5px] italic text-[#888]">
              (श्रम एवं रोजगार मंत्रालय, भारत सरकार)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <img
            src="/images/simulations/G20-Logo.jpg"
            alt="G20"
            className="h-[46px] w-[70px] shrink-0 rounded border border-[#e2e2e2] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex h-[46px] w-[70px] shrink-0 items-center justify-center rounded border border-[#e2e2e2] bg-[#fafafa] px-1 text-center text-[9.5px] leading-tight text-[#777]">
            Azadi ka Amrit Mahotsav
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Pink/mauve scrolling disclaimer marquee ───────────────────────────────
function WarningMarquee() {
  const notice =
    "Please never respond to any call for sharing any personal details like Aadhaar, PAN, Bank details, OTP or request for any payment.";
  return (
    <div className="overflow-hidden border-y border-[#c98a86] bg-[#d9a9a5] py-2">
      <div className="passbook-marquee flex w-max items-center gap-16 whitespace-nowrap px-4 text-[13.5px] font-bold text-[#7a1f1a]">
        <span>{notice}</span>
        <span aria-hidden="true">{notice}</span>
      </div>
      <style jsx>{`
        .passbook-marquee {
          animation: passbookMarqueeScroll 16s linear infinite;
        }

        @keyframes passbookMarqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Sign In card ───────────────────────────────────────────────────────────
function SignInCard({
  uanValue,
  passwordValue,
  validateCreds,
  bannerText,
  onSuccess,
}: {
  uanValue: string;
  passwordValue: string;
  validateCreds: boolean;
  bannerText: string;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ uan: "", password: "", captcha: "" });
  const [error, setError] = useState("");
  const [captchaSeed, setCaptchaSeed] = useState(0);

  const submit = () => {
    if (!form.uan.trim() || !form.password.trim() || !form.captcha.trim()) {
      setError("UAN, Password and Captcha are required.");
      return;
    }
    if (
      validateCreds &&
      (normalize(form.uan) !== normalize(uanValue) || form.password !== passwordValue)
    ) {
      setError("Invalid credentials. Please use the UAN and Password provided for this experiment.");
      return;
    }
    if (form.captcha.trim() !== CAPTCHA_CODE) {
      setError("Captcha does not match.");
      return;
    }
    setError("");
    onSuccess();
  };

  return (
    <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
      <div className="border-b border-[#eee] px-5 py-3 text-[16px] font-bold text-[#7a1f1a]">
        Sign In | EPF Passbook &amp; Claim Status
      </div>

      <div className="space-y-4 p-5">
        {bannerText && (
          <div className="rounded border border-[#bee3da] bg-[#eaf7f4] px-3 py-2 text-[12px] text-[#157a72]">
            {bannerText}
          </div>
        )}

        <div>
          <label className="text-[13.5px] font-semibold text-[#333]">UAN&nbsp;:</label>
          <input
            value={form.uan}
            onChange={(e) => setForm((p) => ({ ...p, uan: e.target.value }))}
            placeholder="Enter UAN"
            className="mt-1 h-[40px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
          />
        </div>

        <div>
          <label className="text-[13.5px] font-semibold text-[#333]">Password&nbsp;:</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Enter Password"
            className="mt-1 h-[40px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div
            key={captchaSeed}
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
          <button
            type="button"
            onClick={() => setCaptchaSeed((s) => s + 1)}
            className="flex h-[42px] w-[36px] shrink-0 items-center justify-center rounded border border-[#c0c0c0] text-[#555] hover:bg-[#f3f3f3]"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <input
          value={form.captcha}
          onChange={(e) => setForm((p) => ({ ...p, captcha: e.target.value }))}
          placeholder="Enter the Captcha displayed above"
          className="h-[40px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
        />

        {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}

        <button
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded bg-gradient-to-b from-[#3fa79a] to-[#157a72] px-5 py-2.5 text-[14.5px] font-bold text-white transition hover:from-[#37988c] hover:to-[#0f5f59]"
        >
          Sign In <Play size={14} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

// ─── Disclaimer panel ───────────────────────────────────────────────────────
function DisclaimerPanel() {
  const items = [
    "This facility is to view the Member Passbook for the members registered on the Unified Member Portal.",
    "Passbook will be available after 6 Hours of registration at Unified Member Portal.",
    "Changes in the credentials at Unified Member Portal will be effective at this Portal after after 6 Hours.",
    "Passbook will have the entries which has been reconciled at the EPFO field offices.",
    "Passbook facility not be available for the Exempted Establishments Members.",
  ];
  return (
    <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
      <div className="border-b border-[#eee] bg-[#f4f4f4] px-5 py-3 text-[14.5px] font-bold text-[#555]">
        Disclaimer
      </div>
      <ol className="list-decimal space-y-2 p-5 pl-9 text-[13px] leading-relaxed text-[#444]">
        {items.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ol>
    </div>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#ddd] bg-[#f7f7f7] px-6 py-3 text-[12.5px] text-[#555]">
      <span>© Company Private Limited</span>
      <span className="flex gap-3 font-semibold text-[#1a6fa8]">
        <span className="cursor-pointer hover:underline">EPFO</span>
        <span className="text-[#bbb]">|</span>
        <span className="cursor-pointer hover:underline">Member Portal</span>
        <span className="text-[#bbb]">|</span>
        <span className="cursor-pointer hover:underline">EPFO Grivance Portal</span>
      </span>
      <span className="italic text-[#888]">Designed, Developed and Hosted @ Fincurious</span>
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

// ─── Full-screen success tick overlay ──────────────────────────────────────
function TickOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">
      <div
        className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
        style={{ animation: "epfReg17TickPop 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">{message}</p>
      <style jsx>{`
        @keyframes epfReg17TickPop {
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

type Tab = "home" | "passbook";

const TAB_LABELS: { key: Tab | null; label: string }[] = [
  { key: "home", label: "Home" },
  { key: null, label: "Profile" },
  { key: "passbook", label: "Passbook" },
  { key: null, label: "Claims" },
  { key: null, label: "Service History" },
];

// ─── Post-login top nav ─────────────────────────────────────────────────────
function LoggedInNav({
  name,
  activeTab,
  onSelectTab,
}: {
  name: string;
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
}) {
  const [calcOpen, setCalcOpen] = useState(false);
  return (
    <nav className="relative flex items-center justify-between bg-[#2952c9] px-6 text-[13.5px] font-semibold text-white">
      <div className="flex items-stretch">
        {TAB_LABELS.map(({ key, label }) => (
          <span
            key={label}
            onClick={() => key && onSelectTab(key)}
            className={`cursor-pointer px-4 py-3 ${
              key && key === activeTab ? "bg-[#152a63]" : "hover:bg-white/10"
            }`}
          >
            {label}
          </span>
        ))}
        <div className="relative">
          <span
            className="flex cursor-pointer items-center gap-1 px-4 py-3 hover:bg-white/10"
            onClick={() => setCalcOpen((v) => !v)}
          >
            Calculators <ChevronDown size={13} />
          </span>
          {calcOpen && (
            <div className="absolute left-0 top-full z-20 w-[200px] rounded-b border border-t-0 border-[#c0c0c0] bg-white text-[12.5px] font-semibold text-[#333] shadow-md">
              <div className="cursor-pointer px-4 py-2.5 hover:bg-[#f3f3f3]">Pension Calculator</div>
              <div className="cursor-pointer px-4 py-2.5 hover:bg-[#f3f3f3]">Contribution Calculator</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 py-3">
        <span className="uppercase">{name}</span>
        <span className="cursor-pointer text-white/80 hover:underline">Logout</span>
      </div>
    </nav>
  );
}

// ─── Collapsible "Member Wise Balance" + dashboard panels ──────────────────
function MemberDashboard({ name }: { name: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-2 rounded border border-[#e3a19c] bg-[#fbeceb] px-4 py-3 text-[13px] font-semibold text-[#8a2a24]">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        Your PAN is not seeded which is a requirement to avoid any higher tax deduction in case TDS is applicable.
      </div>

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-[15px] font-bold text-[#333]"
        >
          Member Wise Balance
          <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="grid gap-4 border-t border-[#eee] p-5 lg:grid-cols-[1fr_320px]">
            <div className="rounded border border-[#d8d8d8]">
              <div className="border-b border-[#eee] px-4 py-2.5 text-[14px] font-bold text-[#7a1f1a]">
                EPF Contribution Summary
              </div>
              <div className="space-y-3 p-4 text-[13.5px]">
                <div className="flex items-center justify-between font-bold text-[#222]">
                  <span>Total Available Balance</span>
                  <span>2,351</span>
                </div>
                <div className="flex items-center justify-between text-[#c0392b]">
                  <span>Employee Share (Available)</span>
                  <span>1,800</span>
                </div>
                <div className="flex items-center justify-between text-[#1a4f8b]">
                  <span>Employer Share (Available)</span>
                  <span>551</span>
                </div>
              </div>
            </div>

            <div className="rounded border border-[#d8d8d8]">
              <div className="border-b border-[#eee] px-4 py-2.5 text-[14px] font-bold text-[#333]">
                Your Pending Requests
              </div>
              <div className="p-4 text-[13.5px] text-[#777]">No Request Pending</div>
            </div>

            <div className="rounded border border-[#d8d8d8] lg:col-span-2">
              <div className="border-b border-[#eee] px-4 py-2.5 text-[14px] font-bold text-[#7a1f1a]">
                Current Establishment Details
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-y-2.5 p-4 text-[13.5px]">
                <span className="font-semibold text-[#555]">Est. Name</span>
                <span className="text-[#333]">COMPANY PRIVATE LIMITED</span>
                <span className="font-semibold text-[#555]">Est. Id</span>
                <span className="text-[#333]">BGBNG2962711000</span>
                <span className="font-semibold text-[#555]">Member Id</span>
                <span className="text-[#333]">BGBNG2962711000010012</span>
                <span className="font-semibold text-[#555]">Date of Joining</span>
                <span className="text-[#333]">25-07-2023</span>
                <span className="font-semibold text-[#555]">Experience</span>
                <span className="text-[#333]">0 Years 7 Months 15 Days</span>
                <span />
                <span className="flex cursor-pointer items-center gap-1 font-semibold text-[#1a6fa8] hover:underline">
                  View Past Service History <ChevronRight size={13} />
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[12px] text-[#333]">Welcome, {name}.</p>
    </div>
  );
}

// ─── 12-year stacked contribution bar chart (only the current year has
// any data — matches the real passbook, where older years show empty) ──────
function ContributionChart() {
  const chartHeight = 220;
  const scale = (value: number) => (value / CHART_MAX) * chartHeight;
  const gridValues = [0, 500, 1000, 1500, 2000, 2500];

  return (
    <div className="rounded border border-[#d8d8d8] p-4">
      <div className="mb-4 text-center text-[13px] font-semibold text-[#555]">
        Contribution Summary in last 12 years
      </div>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-[#888]" style={{ height: chartHeight }}>
          {[...gridValues].reverse().map((v) => (
            <span key={v}>{v.toLocaleString()}</span>
          ))}
        </div>
        <div
          className="relative flex flex-1 items-end justify-between border-l border-b border-[#ddd]"
          style={{ height: chartHeight }}
        >
          {gridValues.map((v) => (
            <div
              key={v}
              className="absolute left-0 right-0 border-t border-dashed border-[#eee]"
              style={{ bottom: scale(v) }}
            />
          ))}
          {CHART_YEARS.map((year, i) => {
            const isCurrent = i === CHART_YEARS.length - 1;
            return (
              <div key={year} className="z-10 flex flex-1 flex-col items-center justify-end gap-1">
                {isCurrent && (
                  <div className="flex w-[26px] flex-col-reverse">
                    <div
                      className="w-full bg-[#d94f70]"
                      style={{ height: scale(EMPLOYEE_SHARE) }}
                      title={`Employee Cont. ${EMPLOYEE_SHARE}`}
                    />
                    <div
                      className="w-full bg-[#1a1a6e]"
                      style={{ height: scale(EMPLOYER_SHARE) }}
                      title={`Employer Cont. ${EMPLOYER_SHARE}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-[38px] text-[10.5px] text-[#888]">
        {CHART_YEARS.map((year) => (
          <span key={year}>{year}</span>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-5 text-[12px] text-[#555]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#d94f70]" /> Employee Cont.
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#1a1a6e]" /> Employer Cont.
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#b8860b]" /> Interest Earned
        </span>
      </div>
    </div>
  );
}

// ─── Passbook tab: Select Member Id → overview → chart → yearly ledger ────
function PassbookView({ onDownload }: { onDownload: () => void }) {
  const [memberId, setMemberId] = useState(MEMBER_ID);

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="rounded border border-[#d8d8d8] bg-white p-4">
        <div className="flex items-center justify-end gap-3">
          <label className="text-[13.5px] font-semibold text-[#333]">Select Member Id</label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="h-[38px] w-[280px] rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
          >
            <option value="">-- Select --</option>
            <option value={MEMBER_ID}>{MEMBER_ID}</option>
          </select>
        </div>
      </div>

      {memberId && (
        <>
          <div className="rounded border border-[#d8d8d8] bg-white p-4">
            <div className="mb-3 text-[14px] font-bold text-[#7a1f1a]">
              Passbook Overview [ {memberId} ]
            </div>
            <div className="grid grid-cols-7 gap-2 rounded bg-[#eef0fb] p-3 text-center text-[12.5px]">
              {[
                ["Total Balance", TOTAL_BALANCE],
                ["Adjustments (Balance)", 0],
                ["Employee Contribution", EMPLOYEE_SHARE],
                ["Employer Contribution", EMPLOYER_SHARE],
                ["Interest Earned", 0],
                ["Transfer-Ins/VDR", 0],
                ["Total PF Withdrawal", 0],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="font-semibold text-[#333]">{label}</div>
                  <div className="mt-1 text-[15px] font-bold text-[#1a1a1a]">{value}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-[#555]">
              Last Contribution made by for the month of Feb-2024
            </p>
          </div>

          <ContributionChart />

          <div className="rounded border border-[#d8d8d8] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee] p-4">
              <div className="flex items-center gap-3">
                <span className="rounded bg-[#3f3f9e] px-3 py-1.5 text-[13px] font-bold text-white">2023</span>
                <span className="text-[13px] text-[#333]">
                  Passbook for Member Id&nbsp;: <span className="font-bold text-[#c0392b]">[ {memberId} ]</span>
                </span>
              </div>
              <div className="flex gap-2">
                <button className="rounded border border-[#1a6fa8] px-4 py-1.5 text-[12.5px] font-semibold text-[#1a6fa8] hover:bg-[#eaf3fb]">
                  View Taxable Data
                </button>
                <button
                  onClick={onDownload}
                  className="rounded bg-[#1a6fa8] px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#155d8e]"
                >
                  Download as PDF
                </button>
              </div>
            </div>

            <div className="px-4 pt-3 text-[13px] text-[#333]">
              Passbook for Member Id&nbsp;: <span className="font-bold text-[#c0392b]">[ {memberId} ]</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[12px]">
                <tbody>
                  <tr className="border-b border-[#eee] bg-white font-semibold text-[#333]">
                    <th colSpan={6} className="px-3 py-2 text-left">
                      Particulars
                    </th>
                    <th className="px-3 py-2 text-left">Employee Share</th>
                    <th className="px-3 py-2 text-left">Employer Share</th>
                    <th className="px-3 py-2 text-left">Pension Share</th>
                  </tr>
                  <tr className="border-b border-[#f3f3f3] bg-[#fdf6e3] font-semibold text-[#7a5a10]">
                    <td colSpan={6} className="px-3 py-2">
                      OB Int. Updated upto 31/03/2023
                    </td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">0</td>
                  </tr>
                  <tr className="border-b border-[#eee] bg-[#f7f7f7] text-[#555]">
                    {[
                      "Wage Month",
                      "Transaction Date",
                      "Transaction Type",
                      "Particulars",
                      "EPF Wages",
                      "EPS Wages",
                      "Employee Share (12%)",
                      "Employer Share (3.67%)",
                      "Pension Share (8.33%)",
                    ].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-[#f3f3f3]">
                    <td className="px-3 py-2">Jan-2024</td>
                    <td className="px-3 py-2">14-02-2024</td>
                    <td className="px-3 py-2">CR</td>
                    <td className="px-3 py-2">Cont. For Due-Month 022024</td>
                    <td className="px-3 py-2">15,000</td>
                    <td className="px-3 py-2">15,000</td>
                    <td className="px-3 py-2">{EMPLOYEE_SHARE.toLocaleString()}</td>
                    <td className="px-3 py-2">{EMPLOYER_SHARE.toLocaleString()}</td>
                    <td className="px-3 py-2">{PENSION_SHARE.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-[#f3f3f3] font-semibold text-[#222]">
                    <td colSpan={6} className="px-3 py-2">
                      Total Contributions for the year [ 2023 ]
                    </td>
                    <td className="px-3 py-2">{EMPLOYEE_SHARE.toLocaleString()}</td>
                    <td className="px-3 py-2">{EMPLOYER_SHARE}</td>
                    <td className="px-3 py-2">{PENSION_SHARE}</td>
                  </tr>
                  <tr className="border-b border-[#f3f3f3] text-[#333]">
                    <td colSpan={6} className="px-3 py-2">
                      Total Transfer-Ins/VDRs for the year [ 2023 ]
                    </td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">0</td>
                  </tr>
                  <tr className="border-b border-[#f3f3f3] text-[#333]">
                    <td colSpan={6} className="px-3 py-2">
                      Total Withdrawals for the year [ 2023 ]
                    </td>
                    <td className="px-3 py-2 font-semibold text-[#c0392b]">0</td>
                    <td className="px-3 py-2 font-semibold text-[#c0392b]">0</td>
                    <td className="px-3 py-2 font-semibold text-[#c0392b]">0</td>
                  </tr>
                  <tr className="border-b border-[#f3f3f3]">
                    <td colSpan={9} className="px-3 py-2">
                      Interest details N/A
                    </td>
                  </tr>
                  <tr className="bg-[#fdf6e3] font-bold text-[#3a6b1f]">
                    <td colSpan={6} className="px-3 py-2">
                      Closing Balance as on 31/03/2024
                    </td>
                    <td className="px-3 py-2">{EMPLOYEE_SHARE.toLocaleString()}</td>
                    <td className="px-3 py-2">{EMPLOYER_SHARE.toLocaleString()}</td>
                    <td className="px-3 py-2">{PENSION_SHARE.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="border-t border-[#eee] p-3 text-[11.5px] italic text-[#c0392b]">
              Disclaimer - Information shown above is based on available data on central server. This information
              may not be use for legal purpose.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

type View = "login" | "loggedIn";

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg17Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("loggedIn");
  const [tab, setTab] = useState<Tab>("passbook");
  const [tickMessage, setTickMessage] = useState("");

  // Admin-configured experiment values (Simulation Manager slug
  // "epf-reg-17", or the course editor's per-insert "Add/Edit Creds")
  // override the default Mr. Nagarjun Patel values when present.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const uanValue = findFieldValue(simConfig, /uan/i) || DEFAULT_UAN;
  const passwordValue = findFieldValue(simConfig, /pass/i) || DEFAULT_PASSWORD;
  const nameValue = findFieldValue(simConfig, /name/i) || DEFAULT_NAME;
  const validateCreds = simConfig?.requireCredentialValidation ?? true;
  // No hardcoded fallback text — the banner only shows if an admin sets one.
  const bannerText = simConfig?.bannerText || "";

  const flashTick = (message: string) => {
    setTickMessage(message);
    setTimeout(() => setTickMessage(""), 1400);
  };

  const handleLoginSuccess = () => {
    flashTick("Login Successful!");
    setView("loggedIn");
    setTab("home");
  };

  const handleDownload = () => {
    flashTick("Download Complete!");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {tickMessage && <TickOverlay message={tickMessage} />}

      <UtilityStrip />
      <Header />
      <WarningMarquee />

      {view === "login" && (
        <main className="mx-auto grid w-[98vw] flex-1 gap-5 py-6 lg:grid-cols-[1fr_1fr]">
          <SignInCard
            uanValue={uanValue}
            passwordValue={passwordValue}
            validateCreds={validateCreds}
            bannerText={bannerText}
            onSuccess={handleLoginSuccess}
          />
          <DisclaimerPanel />
        </main>
      )}

      {view === "loggedIn" && (
        <>
          <LoggedInNav name={nameValue} activeTab={tab} onSelectTab={setTab} />
          <main className="mx-auto w-[98vw] flex-1">
            {tab === "home" && <MemberDashboard name={nameValue} />}
            {tab === "passbook" && <PassbookView onDownload={handleDownload} />}
          </main>
        </>
      )}

      <Footer />
    </div>
  );
}
