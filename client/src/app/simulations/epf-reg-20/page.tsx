"use client";

import React, { useState } from "react";
import { CheckCircle, RotateCcw, ChevronRight } from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

// Every field in the instructional banner (employee/bank/nominee details,
// OTP, etc.) plus the Employer/Subunit Code come from the admin Simulation
// Manager (or the course editor's per-insert "Add/Edit Creds") for slug
// "epf-reg-20" — nothing about the employee being registered is hardcoded
// here. If nothing is configured, the code below falls back to the standard
// demo establishment used across the epf-reg-18/22/23/24/25 chain so the
// page still functions.
const SIMULATION_SLUG = "epf-reg-20";
const DEFAULT_CODE = "63000728280002700";

// ─── Top simulation disclaimer ─────────────────────────────────────────────
function SimBanner() {
  return (
    <div className="sticky top-0 z-50 bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
      This is a Simulation. Use For Educational Purposes ONLY.
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
        className="relative z-10 inline-flex min-h-[72px] w-[min(84vw,34rem)] items-center justify-center rounded-[22px] bg-[#1a6fa8] px-6 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(26,111,168,0.30)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#155d8e] disabled:cursor-wait disabled:opacity-80 sm:min-h-[78px] sm:px-8 sm:text-xl"
      >
        {starting ? "LOADING..." : "START EXPERIMENT"}
      </button>
    </div>
  );
}

// ─── Top nav: tricolour strip + accessibility row ──────────────────────────
function TopStrip() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e0e0] bg-[#f5f5f5] px-5 py-[4px] text-[11px]">
      <div className="flex items-center gap-2 font-medium text-[#333]">
        <div className="flex h-[15px] w-[22px] flex-col overflow-hidden rounded-[1px]">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
        <span>भारत सरकार</span>
        <span className="text-[#aaa]">/</span>
        <span>Government of India</span>
      </div>
      <div className="flex items-center gap-2 text-[#1a6fa8]">
        <span className="font-bold">A+</span>
        <span>A</span>
        <span>A-</span>
        <span className="text-[#bbb]">|</span>
        <span className="cursor-pointer">Select Language ▾</span>
      </div>
    </div>
  );
}

// ─── Header: bilingual ESIC branding, ESIC crest + national emblem ────────
function Header() {
  return (
    <header className="border-b border-[#ddd] bg-white">
      <div className="mx-auto flex w-full max-w-[1300px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/images/simulations/esic-logo.png"
            alt="ESIC Emblem"
            className="h-[50px] w-[50px] shrink-0 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="leading-[1.35]">
            <div className="text-[15px] font-bold text-[#333]">कर्मचारी राज्य बीमा निगम</div>
            <div className="text-[19px] font-bold text-[#0b2e57]">
              Employees&apos; State Insurance Corporation
            </div>
            <div className="text-[11.5px] italic text-[#888]">
              (Ministry of Labour and Employment, Government of India)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right leading-[1.35]">
            <div className="text-[13px] font-bold text-[#333]">श्रम एवं रोजगार मंत्रालय</div>
            <div className="text-[13.5px] font-semibold text-[#333]">
              Ministry of Labour &amp; Employment
            </div>
          </div>
          <img
            src="/images/simulations/satyamev-jayate.jpg"
            alt="Ministry of Labour and Employment Emblem"
            className="h-[50px] w-[50px] shrink-0 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </div>
    </header>
  );
}

// ─── Instructional banner: every configured credential field, verbatim ────
function CredsBanner({ fields }: { fields: { label: string; value: string }[] }) {
  const visible = fields.filter((f) => !/captcha/i.test(f.label));
  if (!visible.length) return null;
  return (
    <div className="mx-auto w-full max-w-[1300px] px-6 pt-6">
      <div className="rounded-[8px] border border-[#bee3da] bg-[#e3f4f1] px-5 py-4 text-[13.5px] leading-relaxed text-[#0b3d3a]">
        <p className="mb-1 font-bold">Experiment:</p>
        <p className="mb-2">
          Register an employee in ESI portal using the Experiment below. Following details are available:
        </p>
        {visible.map((f) => (
          <p key={f.label}>
            <span className="font-semibold">{f.label}:</span> {f.value}
          </p>
        ))}
      </div>
    </div>
  );
}

const EMPLOYER_LINKS = [
  "Update Employer Details",
  "Create Subunit Registration",
  "Accident Report (Form 12)",
  "Accident Report Print / PDF Form",
  "Wage Contributory Record",
  "Reply For Abstention Verification",
  "View Subunit Details",
  "Change Password",
  "Help for Monthly contribution and Challan (Updated)",
  "Help File for Contractor/Principal Employer Mapping and Contribution",
  "User Manual for Mobile/Bank update",
  "Consolidated MC/Edit MC Help File",
  "Online Payment Help File",
  "DEPLOY SECURITY CERTIFICATE",
  "Employer and Employee Registration through Portal",
];

const EMPLOYEE_LINKS = [
  "Enroll Employee with previously allotted ESI Number",
  "Register/Enroll New Employee",
  "Update Particulars of Insured Person",
  "Update Mobile Number of Insured Person",
  "Bulk Upload of Mobile Number",
  "Bulk Upload of Account Number",
  "Upload Bank Account related Document of Insured Person",
  "e-Pehchan Card",
  "List of Employees",
  "Health Passbook",
  "Notification",
  "Employee Dispensary Approval",
];

const CONTRIBUTION_LINKS = [
  "File Monthly Contributions",
  "Generate Challan",
  "Modify Challan",
  "View Contribution History",
  "Omitted Wages Challan",
  "Contractor/Principal Employer Master",
  "IP Mapping with Contractor/Principal Employer",
  "Bulk IP Mapping with Contractor/Principal Employer",
  "View Contribution History (Contractor/Principal Employer Wise)",
  "Self Certification",
  "View RC",
  "Recovery/Defaulter Challan",
  "Updation of Unrealized Challan Details",
  "Online Challan Double Verification",
  "Interest For Delay Payment",
  "File Consolidated Monthly Contributions",
  "Consolidated Monthly Contribution Challan",
  "Consolidated View Contribution History",
];

// ─── Employer dashboard: three-column menu, "Register/Enroll New Employee" actionable
function DashboardMenu({ code, onRegisterEmployee }: { code: string; onRegisterEmployee: () => void }) {
  const columns: { title: string; items: string[] }[] = [
    { title: "EMPLOYER", items: EMPLOYER_LINKS },
    { title: "EMPLOYEE", items: EMPLOYEE_LINKS },
    { title: "MONTHLY CONTRIBUTION", items: CONTRIBUTION_LINKS },
  ];
  return (
    <div className="mx-auto w-full max-w-[1300px] rounded-[8px] border border-[#e0ddc8] bg-[#fdfaf0]">
      <div className="border-b border-[#e0ddc8] bg-[#d9d2ae] px-5 py-2 text-[12px] font-semibold text-[#4a4630]">
        User Login: {code}
      </div>
      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
        {columns.map((col) => (
          <div key={col.title}>
            <div className="mb-3 text-[12px] font-bold tracking-wide text-[#a08968]">{col.title}</div>
            <ul className="space-y-2.5">
              {col.items.map((item) =>
                item === "Register/Enroll New Employee" ? (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={onRegisterEmployee}
                      className="flex items-center gap-1 text-[13px] font-bold text-[#0b2e57] underline decoration-2 underline-offset-2 hover:text-[#1a6fa8]"
                    >
                      {item}
                      <ChevronRight size={14} />
                    </button>
                  </li>
                ) : (
                  <li key={item} className="text-[13px] text-[#5b7fa6] underline decoration-[#c7d6e8] underline-offset-2">
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Employer/Subunit Code + choose Aadhaar-based registration ────
function AadhaarChoiceForm({
  code,
  registerWithAadhaar,
  onChangeChoice,
  onContinue,
  onCancel,
}: {
  code: string;
  registerWithAadhaar: "yes" | "no";
  onChangeChoice: (v: "yes" | "no") => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="border-b border-[#e0ddc8] bg-[#d9d2ae] px-4 py-2 text-[12px] font-semibold text-[#4a4630]">
        User Login: {code}
      </div>
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Employee Registration with Aadhaar Number
      </div>
      <div className="space-y-3 bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <label className="flex items-center gap-3">
          <span className="w-[260px] shrink-0 font-semibold text-[#7a1f1a]">Employer/Subunit Code No.:*</span>
          <input readOnly value={code} className="h-[32px] w-[220px] rounded border border-[#c0c0c0] bg-[#f4f4f4] px-2 font-mono" />
        </label>
        <div className="flex items-center gap-3">
          <span className="w-[260px] shrink-0 font-semibold text-[#7a1f1a]">Do you want to register with Aadhaar number?:</span>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="aadhaarChoice"
              checked={registerWithAadhaar === "yes"}
              onChange={() => onChangeChoice("yes")}
            />
            Yes
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="aadhaarChoice"
              checked={registerWithAadhaar === "no"}
              onChange={() => onChangeChoice("no")}
            />
            No
          </label>
        </div>
      </div>
      <div className="flex justify-center gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          onClick={onContinue}
          className="rounded border border-[#7a1f1a] bg-[#c0392b] px-5 py-1.5 text-[13px] font-bold text-white hover:bg-[#a93226]"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Step 2a: Aadhaar Seeding (OTP verification against the configured OTP)
function AadhaarSeedingPanel({
  otpCode,
  onSubmit,
  onCancel,
}: {
  otpCode: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [aadhaar, setAadhaar] = useState("");
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [authMethod, setAuthMethod] = useState<"otp" | "biometric">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const canGetOtp = aadhaar.trim().length >= 4 && agreed && authMethod === "otp";

  const handleGetOtp = () => {
    setOtpSent(true);
    setError("");
  };

  const handleSubmit = () => {
    if (!otp.trim()) {
      setError("Please enter the OTP sent for Aadhaar verification");
      return;
    }
    if (otpCode && otp !== otpCode) {
      setError("Incorrect OTP. Please check the OTP provided for this experiment.");
      return;
    }
    setError("");
    onSubmit();
  };

  return (
    <div className="mt-5 overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Aadhaar Seeding
      </div>
      <div className="space-y-3 bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <label className="flex items-center gap-3">
          <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Enter Aadhaar/VID</span>
          <input
            type={showAadhaar ? "text" : "password"}
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value)}
            placeholder="Enter Aadhaar or VID"
            className="h-[32px] w-[240px] rounded border border-[#c0c0c0] bg-white px-2 outline-none focus:border-[#1a6fa8]"
          />
          <label className="flex items-center gap-1.5 text-[12.5px]">
            <input type="checkbox" checked={showAadhaar} onChange={(e) => setShowAadhaar(e.target.checked)} />
            View
          </label>
        </label>

        <label className="flex items-start gap-2">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="text-[#1a56db] underline">View terms and conditions.</span> Employee is agreed to the
            terms and conditions for registration and willing to share Aadhaar.
          </span>
        </label>

        <div className="flex items-center gap-3">
          <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Authentication With:</span>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="authMethod"
              checked={authMethod === "otp"}
              onChange={() => setAuthMethod("otp")}
            />
            OTP
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="authMethod"
              checked={authMethod === "biometric"}
              onChange={() => setAuthMethod("biometric")}
            />
            Biometric
          </label>
        </div>

        <label className="flex items-center gap-3">
          <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Choose Device for Biometric:</span>
          <select disabled={authMethod !== "biometric"} className="h-[32px] w-[220px] rounded border border-[#c0c0c0] bg-white px-2 disabled:bg-[#f4f4f4]">
            <option>-- Select --</option>
          </select>
        </label>

        <div>
          <button
            type="button"
            disabled={!canGetOtp}
            onClick={handleGetOtp}
            className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-4 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Get OTP
          </button>
        </div>

        {otpSent && authMethod === "otp" && (
          <label className="flex items-center gap-3">
            <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Enter OTP:*</span>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="h-[32px] w-[160px] rounded border border-[#c0c0c0] bg-white px-2 outline-none focus:border-[#1a6fa8]"
            />
          </label>
        )}

        {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}
      </div>
      <div className="flex justify-center gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          disabled={!otpSent || authMethod !== "otp"}
          onClick={handleSubmit}
          className="rounded border border-[#7a1f1a] bg-[#c0392b] px-5 py-1.5 text-[13px] font-bold text-white hover:bg-[#a93226] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Step 2b: Non-Aadhaar path — mobile number validation ─────────────────
function MobileRegistrationPanel({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) {
  const [mobile, setMobile] = useState("");
  const [validated, setValidated] = useState(false);

  return (
    <div className="mt-5 overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Employee Registration without Aadhaar Number
      </div>
      <div className="space-y-3 bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <label className="flex items-center gap-3">
          <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Employee&apos;s Mobile Number:*</span>
          <input
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value);
              setValidated(false);
            }}
            placeholder="Enter mobile number"
            className="h-[32px] w-[220px] rounded border border-[#c0c0c0] bg-white px-2 outline-none focus:border-[#1a6fa8]"
          />
          <button
            type="button"
            disabled={mobile.trim().length < 10}
            onClick={() => setValidated(true)}
            className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-4 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Validate Mobile Number
          </button>
        </label>
        {validated && <p className="text-[12.5px] font-semibold text-[#157a3d]">Mobile number validated.</p>}
      </div>
      <div className="flex justify-center gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          disabled={!validated}
          onClick={onSubmit}
          className="rounded border border-[#7a1f1a] bg-[#c0392b] px-5 py-1.5 text-[13px] font-bold text-white hover:bg-[#a93226] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-auto">
      <div className="border-t border-[#e0e0e0] bg-[#f5f5f5] px-6 py-1.5 text-right text-[11.5px] text-[#666]">
        Last Updated : 28/10/2020
      </div>
      <div className="bg-[#4a2545] px-6 py-3 text-[12px] text-[#f0e0e6]">
        <div className="mx-auto flex w-full max-w-[1300px] flex-wrap items-center justify-between gap-2">
          <span>
            <strong>© Copyright ESIC 2026.</strong> All Rights Reserved
          </span>
          <span>Site maintained by : ESIC. | Visitors Count: 373193805</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Success overlay: green tick + red Retry, floating above the portal ───
function SuccessOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-[#07111f]/45 px-4 pt-24 backdrop-blur-[3px] sm:pt-32">
      <div className="flex flex-col items-center gap-4 rounded-[16px] bg-white/95 px-10 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div
          className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
          style={{ animation: "epfReg20TickPop 0.15s ease-out" }}
        >
          <CheckCircle size={48} className="text-white" />
        </div>
        <p className="text-center text-[15px] font-semibold text-[#0b2e57]">
          Employee Registered Successfully
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] hover:bg-[#c90f15]"
        >
          <RotateCcw size={15} /> Retry
        </button>
      </div>
      <style jsx>{`
        @keyframes epfReg20TickPop {
          0% {
            transform: scale(0.85);
            opacity: 0;
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

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg20Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<"menu" | "choice" | "aadhaar" | "mobile">("menu");
  const [registerWithAadhaar, setRegisterWithAadhaar] = useState<"yes" | "no">("yes");
  const [submitted, setSubmitted] = useState(false);

  // Admin-configured Employer/Subunit Code and OTP (Simulation Manager slug
  // "epf-reg-20", or the course editor's per-insert "Add/Edit Creds") drive
  // the registration form — falling back to the standard demo code when
  // nothing is configured. The OTP check is skipped (accepts anything) if no
  // OTP field has been configured.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const code = findFieldValue(simConfig, /code|lin|user/i) || DEFAULT_CODE;
  const otpCode = findFieldValue(simConfig, /otp/i);
  const notifyGroupComplete = useSimGroupComplete();

  const handleSubmitted = () => {
    setSubmitted(true);
    notifyGroupComplete();
  };

  const handleRetry = () => {
    setSubmitted(false);
    setView("menu");
    setRegisterWithAadhaar("yes");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {submitted && <SuccessOverlay onRetry={handleRetry} />}

      <TopStrip />
      <Header />
      <CredsBanner fields={simConfig?.credentialFields || []} />

      <main className="mx-auto w-full max-w-[1300px] flex-1 px-6 py-8">
        {view === "menu" && (
          <DashboardMenu code={code} onRegisterEmployee={() => setView("choice")} />
        )}

        {view === "choice" && (
          <AadhaarChoiceForm
            code={code}
            registerWithAadhaar={registerWithAadhaar}
            onChangeChoice={setRegisterWithAadhaar}
            onContinue={() => setView(registerWithAadhaar === "yes" ? "aadhaar" : "mobile")}
            onCancel={() => setView("menu")}
          />
        )}

        {view === "aadhaar" && (
          <AadhaarSeedingPanel otpCode={otpCode} onSubmit={handleSubmitted} onCancel={() => setView("menu")} />
        )}

        {view === "mobile" && (
          <MobileRegistrationPanel onSubmit={handleSubmitted} onCancel={() => setView("menu")} />
        )}
      </main>

      <Footer />
    </div>
  );
}
