"use client";

import React, { useState } from "react";
import { CheckCircle, RotateCcw, Eye, EyeOff } from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

// Every credential field (Firm Name / User ID / Password / etc.) comes from
// the admin Simulation Manager (or the course editor's per-insert "Add/Edit
// Creds") for slug "epf-reg-19" — nothing is hardcoded here. The
// instructional banner lists whatever fields are configured, verbatim, so
// it always matches what the login form actually validates against. Only
// the simulated captcha code is a fixed UI mechanic, not experiment content.
const SIMULATION_SLUG = "epf-reg-19";
const CAPTCHA_CODE = "P237M";

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

// ─── Instructional banner: every configured credential field, verbatim ────
function CredsBanner({ fields }: { fields: { label: string; value: string }[] }) {
  const visible = fields.filter((f) => !/captcha/i.test(f.label));
  if (!visible.length) return null;
  return (
    <div className="mx-auto w-full max-w-[1300px] px-6 pt-6">
      <div className="rounded-[8px] border border-[#bee3da] bg-[#e3f4f1] px-5 py-4 text-[13.5px] leading-relaxed text-[#0b3d3a]">
        <p className="mb-1 font-bold">Experiment 1:</p>
        <p className="mb-2">
          Login to ESI portal in Simulation Experiment below using the given login credentials:
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

// ─── Employer Login panel ───────────────────────────────────────────────────
function EmployerLoginPanel({
  loginUser,
  loginPass,
  validateCreds,
  onSuccess,
}: {
  loginUser: string;
  loginPass: string;
  validateCreds: boolean;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ username: "", password: "", captcha: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.username.trim() || !form.password.trim() || !form.captcha.trim()) {
      setError("Username, Password and Captcha are required");
      return;
    }
    if (
      validateCreds &&
      ((loginUser && form.username !== loginUser) || (loginPass && form.password !== loginPass))
    ) {
      setError("Invalid credentials. Please use the User ID and password provided for this experiment.");
      return;
    }
    if (form.captcha !== CAPTCHA_CODE) {
      setError("Captcha does not match");
      return;
    }
    setError("");
    onSuccess();
  };

  const reset = () => {
    setForm({ username: "", password: "", captcha: "" });
    setError("");
  };

  return (
    <div className="w-full max-w-[380px] rounded-[8px] border border-[#d8d8d8] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[19px] font-bold text-[#0b2e57]">Employer Login</h2>
        <span className="cursor-pointer text-[12px] font-semibold text-[#c0392b] hover:underline">
          Hindi
        </span>
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#555]">Username/LIN</label>
          <input
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="Type your username"
            className="h-[42px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#555]">Password</label>
          <div className="flex">
            <input
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Type your password"
              className="h-[42px] flex-1 rounded-l border border-r-0 border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-r border border-[#c0c0c0] bg-[#1a6fa8] text-white hover:bg-[#155d8e]"
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#555]">Captcha *</label>
          <div className="mb-2 flex h-[42px] w-full items-center justify-center rounded border border-[#c0c0c0] bg-[#ede9df] shadow-inner">
            <span
              className="select-none font-mono text-[19px] font-black text-[#222]"
              style={{ fontStyle: "italic", letterSpacing: "0.12em" }}
            >
              {CAPTCHA_CODE}
            </span>
          </div>
          <input
            value={form.captcha}
            onChange={(e) => setForm((p) => ({ ...p, captcha: e.target.value }))}
            placeholder="Type your Captcha"
            className="h-[42px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
          />
        </div>

        {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}

        <div className="flex items-center justify-between pt-1 text-[12.5px]">
          <span className="cursor-pointer font-semibold text-[#1a6fa8] hover:underline">Sign Up</span>
          <span className="cursor-pointer font-semibold text-[#1a6fa8] hover:underline">Forgot password?</span>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={submit}
            className="flex-1 rounded bg-[#c0392b] px-5 py-2.5 text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a93226] active:scale-[0.99]"
          >
            Login
          </button>
          <button
            onClick={reset}
            className="rounded bg-[#9aa5b1] px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#818e9c] active:scale-[0.99]"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-1.5 border-t border-[#eee] pt-4 text-[12.5px]">
        <div className="cursor-pointer text-[#1a6fa8] hover:underline">Username</div>
        <div className="cursor-pointer text-[#1a6fa8] hover:underline">Check Password Policy</div>
        <div className="cursor-pointer font-semibold text-[#157a3d] hover:underline">
          Common Registration Link For ESIC / EPFO
        </div>
        <div className="cursor-pointer font-semibold text-[#157a3d] hover:underline">
          Unified ECR link for ESIC/EPFO
        </div>
        <div className="cursor-pointer text-[#1a6fa8] hover:underline">Manual for Employer and Employee</div>
        <div className="cursor-pointer text-[#1a6fa8] hover:underline">Registration through Portal</div>
      </div>
    </div>
  );
}

// ─── Left info column (static portal chrome, not experiment data) ─────────
function PortalInfoColumn() {
  return (
    <div className="max-w-[620px] text-[13px] leading-relaxed text-[#c0392b]">
      <p className="mb-3">
        No physical processing of paper is undertaken by ESIC for registration of Employer. If there is any
        complaint to the contrary, the same may be made on{" "}
        <span className="text-[#1a6fa8] underline">help-shramsuvidha@gov.in</span>
      </p>
      <p className="mb-2 font-semibold">We Are Migrating To One Unit One Identifier</p>
      <p>
        Simulation plans to do away with all employer codes being issued by separate labour enforcement agencies
        such as ESIC, EPFO, O/O and DGMS etc by replacing them with new Labour Identification Number (LIN). Your
        unit has already been allotted a LIN and the same may be obtained online using{" "}
        <span className="text-[#1a6fa8] underline">tinyurl.com/whatismylin</span>. Please verify the information
        associated with your LIN before the current employer codes are rendered useless. For any support please
        contact <span className="text-[#1a6fa8] underline">help-shramsuvidha@gov.in</span>
      </p>
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

// ─── Post-login employer dashboard: three-column portal menu ──────────────
function DashboardMenu({ code }: { code: string }) {
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
            <div className="mb-3 text-[12px] font-bold tracking-wide text-[#a08968]">
              {col.title}
            </div>
            <ul className="space-y-2.5">
              {col.items.map((item) => (
                <li
                  key={item}
                  className="text-[13px] text-[#5b7fa6] underline decoration-[#c7d6e8] underline-offset-2"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
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

// ─── Success overlay: tick + red Retry, appearing the moment login succeeds ─
function SuccessOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-[#07111f]/45 px-4 pt-24 backdrop-blur-[3px] sm:pt-32">
      <div className="flex flex-col items-center gap-4 rounded-[16px] bg-white/95 px-10 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div
          className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
          style={{ animation: "epfReg19TickPop 0.15s ease-out" }}
        >
          <CheckCircle size={48} className="text-white" />
        </div>
        <p className="text-center text-[15px] font-semibold text-[#0b2e57]">
          Login Successful
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] hover:bg-[#c90f15]"
        >
          <RotateCcw size={15} /> Retry
        </button>
      </div>
      <style jsx>{`
        @keyframes epfReg19TickPop {
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
export default function EpfReg19Page() {
  const [launched, setLaunched] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Admin-configured credentials (Simulation Manager slug "epf-reg-19", or the
  // course editor's per-insert "Add/Edit Creds") drive both the instructional
  // banner and the login form validation — there is no hardcoded Firm Name /
  // User ID / Password fallback in this file.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const loginUser = findFieldValue(simConfig, /user|lin/i);
  const loginPass = findFieldValue(simConfig, /pass/i);
  const validateCreds = simConfig?.requireCredentialValidation ?? true;
  const notifyGroupComplete = useSimGroupComplete();

  const handleLoginSuccess = () => {
    setLoggedIn(true);
    notifyGroupComplete();
  };

  const handleRetry = () => {
    setLoggedIn(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {loggedIn && <SuccessOverlay onRetry={handleRetry} />}

      <TopStrip />
      <Header />
      <CredsBanner fields={simConfig?.credentialFields || []} />

      <main className="flex-1 px-6 py-10">
        {loggedIn ? (
          <DashboardMenu code={loginUser || "—"} />
        ) : (
          <div className="mx-auto flex w-full max-w-[1300px] flex-wrap items-start justify-center gap-16">
            <PortalInfoColumn />
            <EmployerLoginPanel
              loginUser={loginUser}
              loginPass={loginPass}
              validateCreds={validateCreds}
              onSuccess={handleLoginSuccess}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
