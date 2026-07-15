"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  RotateCcw,
  Bell,
  FileText,
  Info,
  ChevronDown,
  LogOut,
  Home as HomeIcon,
  UserPlus2,
  NotebookText,
  Minus,
  X,
  ArrowLeft,
} from "lucide-react";
import { EpfoNavItem } from "../../components/EpfoNavMenus";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";

const SIMULATION_SLUG = "epf-reg-4";
const COMPANY_NAME = "IICPA PRIVATE LIMITED";
const EST_ID = "APHYD1577313000";
const COMPANY_LIN = "9778613527";
const COMPANY_PAN = "BGRPA6026U";
const EMPLOYER_PROFILE_NAME = "IICPA PRIVATE LIMITED";

// Experiment 2 answer key — Mr. Keerthan Kumar
const TARGET_UAN = "101799815726";
const TARGET_AADHAAR = "353567678888";
const TARGET_NAME = "Keerthan Kumar";
const TARGET_DOB = "22/02/1988";

const digitsOnly = (v: string) => v.replace(/\D/g, "");
const norm = (v: string) => v.trim().toLowerCase();

const MEMBER_MENU_ITEMS = [
  "MEMBER PROFILE",
  "REGISTER-INDIVIDUAL",
  "REGISTER-BULK",
  "KYC-BULK",
  "EXIT-BULK",
  "APPROVALS",
  "MISSING DETAILS BULK",
  "APPROVE MISSING DETAILS",
  "AADHAAR VERIFICATION",
  "APPROVE KYC PENDING FOR DS",
  "BASIC DETAILS CHANGE REQUESTS",
  "APPROVE KYC SEEDED BY MEMBER",
  "UAN ALLOTMENT FOR EXISTING MEMBER",
  "INTERNATIONAL WORKER <-> DOMESTIC WORKER CHANGE",
];

const NAV_ITEMS = ["Establishment", "Payments", "Dashboards", "User", "Admin", "Online Services", "ABRY"];

type BasicDetails = { uan: string; aadhaar: string; name: string; dob: string };
type PendingMember = { name: string; uan: string; memberId: string };
type View = "dashboard" | "memberReg" | "employeeDetails" | "success";

// dd/mm/yyyy -> yyyy-mm-dd (for native <input type="date">)
function toIsoDate(dmy: string): string {
  const parts = digitsOnly(dmy);
  if (parts.length !== 8) return "";
  const d = parts.slice(0, 2);
  const m = parts.slice(2, 4);
  const y = parts.slice(4, 8);
  return `${y}-${m}-${d}`;
}

// ─── Top simulation disclaimer ─────────────────────────────────────────────
function SimBanner() {
  return (
    <div className="sticky top-0 z-50 bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
      This is a Simulation. Use For Educational Purposes ONLY.
    </div>
  );
}

// ─── Launch overlay ─────────────────────────────────────────────────────────
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
        className="relative z-10 inline-flex min-h-[72px] w-[min(84vw,34rem)] items-center justify-center rounded-[22px] bg-[#1244b8] px-6 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(18,68,184,0.30)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0f3a9a] disabled:cursor-wait disabled:opacity-80 sm:min-h-[78px] sm:px-8 sm:text-xl"
      >
        {starting ? "LOADING..." : "START EXPERIMENT"}
      </button>
    </div>
  );
}

// ─── Full-screen success tick overlay ───────────────────────────────────────
function TickOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">
      <div
        className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
        style={{ animation: "epfTickPop4 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">{label}</p>
      <style jsx>{`
        @keyframes epfTickPop4 {
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

// ─── Toast for "not available in this simulation" ───────────────────────────
function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[150] flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-[13px] font-medium text-white shadow-lg">
      {text}
      <button onClick={onClose} className="text-white/70 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Dashboard header: company strip + nav bar with Member dropdown ────────
function DashboardHeader({
  memberOpen,
  onToggleMember,
  onMemberItemClick,
  onNavClick,
  onLogout,
}: {
  memberOpen: boolean;
  onToggleMember: () => void;
  onMemberItemClick: (item: string) => void;
  onNavClick: (item: string) => void;
  onLogout: () => void;
}) {
  const [openNavMenu, setOpenNavMenu] = useState<string | null>(null);
  return (
    <header className="relative border-b border-[#ddd] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/images/simulations/epfo.jpg"
            alt="Logo"
            className="h-[48px] w-[48px] shrink-0 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="leading-[1.3]">
            <div className="text-[16px] font-bold text-[#1a4f8b]">{COMPANY_NAME}, INDIA</div>
            <div className="text-[11px] font-bold tracking-wide text-[#c0392b]">
              MINISTRY OF LABOUR &amp; EMPLOYMENT, SIMULATION
            </div>
          </div>
        </div>

        <div className="text-center text-[12.5px] leading-[1.5]">
          <div className="text-[#e8954b]">
            Welcome: <span className="font-semibold">{EST_ID}</span>
          </div>
          <div className="font-semibold text-[#2f80b5]">{EST_ID}</div>
        </div>

        <div className="text-right text-[11px] text-[#555]">
          <div className="mb-1 flex items-center justify-end gap-2">
            <span className="rounded bg-[#1a4f8b] px-1 text-[10px] font-bold text-white">A-</span>
            <span className="rounded bg-[#1a4f8b] px-1 text-[10px] font-bold text-white">A</span>
            <span className="rounded bg-[#1a4f8b] px-1 text-[10px] font-bold text-white">A+</span>
            <span className="text-[#888]">employerfeedback[at]epfindia[dot]gov[dot]in</span>
          </div>
          <button onClick={onLogout} className="flex items-center justify-end gap-1 text-[#2f80b5] hover:underline">
            <LogOut size={13} /> Logout
          </button>
          <div className="mt-1 text-[#888]">Mon 09 Aug 2021 (PV 3.3.30)</div>
        </div>
      </div>

      <nav className="flex flex-wrap items-stretch bg-[#1a4f8b] text-white">
        <button
          onClick={() => onNavClick("Home")}
          className="flex items-center gap-1.5 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10"
        >
          <HomeIcon size={14} /> Home
        </button>

        <div className="relative">
          <button
            onClick={onToggleMember}
            className={`flex items-center gap-1 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10 ${
              memberOpen ? "bg-white/10" : ""
            }`}
          >
            Member <ChevronDown size={12} />
          </button>

          {memberOpen && (
            <div className="absolute left-0 top-full z-40 w-[300px] rounded-b border border-t-0 border-[#ccc] bg-white py-1 text-left shadow-lg">
              {MEMBER_MENU_ITEMS.map((item) => {
                const isTarget = item === "REGISTER-INDIVIDUAL";
                return (
                  <button
                    key={item}
                    onClick={() => onMemberItemClick(item)}
                    className={`block w-full border-b border-[#f0f0f0] px-4 py-2 text-left text-[12.5px] last:border-b-0 hover:bg-[#eef4fb] ${
                      isTarget ? "bg-[#1a4f8b] font-semibold text-white hover:bg-[#153f70]" : "text-[#333]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {NAV_ITEMS.map((item) => (
          <EpfoNavItem
            key={item}
            label={item}
            open={openNavMenu === item}
            onToggle={setOpenNavMenu}
          />
        ))}
      </nav>
    </header>
  );
}

// ─── Dashboard info panel: white bg, icon chip + blue title ────────────────
function InfoPanel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#f0c7a0] bg-[#fdf6e9] px-4 py-2.5">
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded bg-[#e8954b] text-white">
          {icon}
        </span>
        <span className="text-[15px] font-bold text-[#1a4f8b]">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Alerts and To Do Tasks panel ───────────────────────────────────────────
function AlertsPanel() {
  const alerts = [
    "Kind attention Employers. Now Aadhaar is mandatory for filing ECR.",
    "KYC seeded at the time of member registration are available for approval after UAN allocation.",
    "Member Basic Details Modification Approve Reject functionality is available.",
  ];
  const noticeLinks = [
    "Notification of Section 142 of the Code of Social Security, 2020. Click here to read.",
    "Important notice about Section 142 of the Code of Social Security, 2020. Click here to read.",
  ];

  return (
    <InfoPanel icon={<Bell size={15} />} title="Alerts and To Do Tasks">
      <ul className="space-y-2.5 text-[13.5px] text-[#333]">
        {alerts.map((text, i) => {
          const isNotification = i < 2;
          return (
            <li key={text} className={`flex gap-2 ${isNotification ? "font-semibold text-[#c0392b]" : "text-[#333]"}`}>
              <Bell size={14} className={`mt-0.5 shrink-0 ${isNotification ? "text-[#c0392b]" : "text-[#e8954b]"}`} />
              <span>{text}</span>
            </li>
          );
        })}
        {noticeLinks.map((text) => (
          <li key={text} className="flex gap-2">
            <FileText size={14} className="mt-0.5 shrink-0 text-[#888]" />
            <span className="cursor-pointer text-[#2f80b5] hover:underline">{text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-3">
        <div className="rounded border border-[#bee3f8] bg-[#ebf8ff] px-3 py-2.5 text-[13px] text-[#1a4f8b]">
          <p className="font-bold">
            File Monthly ECR in respect of employees who have completed 58 years of age before first week of every
            month and submit their Pension/PF claim
          </p>
          <p className="mt-1">
            Employees&apos; attaining 58 years of age in the current Month{" "}
            <span className="cursor-pointer underline">PDF</span> | <span className="cursor-pointer underline">Excel</span>
          </p>
        </div>
      </div>
    </InfoPanel>
  );
}

function DashboardWhatsNewPanel() {
  return (
    <InfoPanel icon={<NotebookText size={15} />} title="What's New">
      <div className="flex items-center gap-2 text-[13.5px] text-[#333]">
        <FileText size={14} className="shrink-0 text-[#e8954b]" />
        <span>Please submit the ecr of international worker immediately if he/she is leaving</span>
      </div>
    </InfoPanel>
  );
}

function EmployerProfilePanel() {
  const rows: [string, React.ReactNode][] = [
    ["Est. Id", EST_ID],
    ["LIN", COMPANY_LIN],
    ["PAN", COMPANY_PAN],
    ["PF", "Un-Exempted"],
    ["Pension", "Un-Exempted"],
    ["EDLI", "Un-Exempted"],
    [
      "National Industrial Classification Code (NIC)",
      <span key="nic" className="cursor-pointer text-[#2f80b5] hover:underline">
        Update NIC2008 Code
      </span>,
    ],
    ["Address", "—"],
    ["PF Office", "—"],
  ];
  return (
    <InfoPanel icon={<UserPlus2 size={15} />} title="Employer Profile">
      <p className="mb-3 text-center text-[14px] font-bold text-[#1a4f8b]">{EMPLOYER_PROFILE_NAME}</p>
      <div className="divide-y divide-[#eee] text-[12.5px]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[auto_1fr] gap-3 py-2">
            <span className="font-semibold text-[#555]">{label}</span>
            <span className="text-right text-[#222]">{value}</span>
          </div>
        ))}
      </div>
    </InfoPanel>
  );
}

function OnlineServicesPanel() {
  return (
    <InfoPanel icon={<Info size={15} />} title="Online Services">
      <div className="divide-y divide-[#eee] text-[12.5px]">
        <div className="grid grid-cols-[auto_1fr] gap-3 py-2">
          <span className="font-semibold text-[#555]">No. Of Pending Transfer Claims</span>
          <span className="text-right text-[#222]">-</span>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-3 py-2">
          <span className="font-semibold text-[#555]">Oldest Claim Pending Since</span>
          <span className="text-right text-[#222]">-</span>
        </div>
      </div>
    </InfoPanel>
  );
}

// ─── Employer Home dashboard ─────────────────────────────────────────────────
function Dashboard({
  memberOpen,
  onToggleMember,
  onMemberItemClick,
  onNavClick,
  onLogout,
}: {
  memberOpen: boolean;
  onToggleMember: () => void;
  onMemberItemClick: (item: string) => void;
  onNavClick: (item: string) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <DashboardHeader
        memberOpen={memberOpen}
        onToggleMember={onToggleMember}
        onMemberItemClick={onMemberItemClick}
        onNavClick={onNavClick}
        onLogout={onLogout}
      />
      <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
        <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-5">
            <AlertsPanel />
            <DashboardWhatsNewPanel />
          </div>
          <div className="flex flex-col gap-5">
            <EmployerProfilePanel />
            <OnlineServicesPanel />
          </div>
        </div>
      </main>
      <footer className="mt-auto bg-[#1a3a66] py-4 text-center text-[12px] leading-relaxed text-[#dde6f0]">
        <p>Designed, Developed and Hosted by: Employees&apos; Provident Fund Organisation, India</p>
        <p>Last Updated Mon 09 Aug 2021 (PV 3.3.30)</p>
      </footer>
    </>
  );
}

// ─── Member Registration page (Previous Employment/UAN verify step) ───────
function MemberRegistrationPage({
  pendingMembers,
  onVerified,
  onCancel,
}: {
  pendingMembers: PendingMember[];
  onVerified: (details: BasicDetails) => void;
  onCancel: () => void;
}) {
  const [hasUan, setHasUan] = useState<"yes" | "no">("yes");
  const [form, setForm] = useState({ uan: "", aadhaar: "", name: "", dob: "" });
  const [error, setError] = useState("");

  // Admin-configured values (per-insert override or Simulation Manager)
  // replace the hardcoded answer key when available.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const targetUan = digitsOnly(findFieldValue(simConfig, /uan/i)) || TARGET_UAN;
  const targetName = findFieldValue(simConfig, /name/i) || TARGET_NAME;
  const targetDob = findFieldValue(simConfig, /birth|dob/i) || TARGET_DOB;
  const validateCreds = simConfig ? simConfig.requireCredentialValidation : true;

  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const verify = () => {
    if (!form.uan.trim() || !form.name.trim() || !form.dob.trim()) {
      setError("UAN, Name and Date of Birth are required");
      return;
    }
    if (validateCreds) {
      if (digitsOnly(form.uan) !== targetUan) {
        setError(`UAN not found. For this simulation use UAN ${targetUan}`);
        return;
      }
      if (norm(form.name) !== norm(targetName)) {
        setError(`Name does not match EPFO records for this UAN — expected "${targetName}"`);
        return;
      }
      if (digitsOnly(form.dob) !== digitsOnly(targetDob)) {
        setError(`Date of Birth does not match EPFO records — expected ${targetDob}`);
        return;
      }
    }
    setError("");
    onVerified({ uan: form.uan.trim(), aadhaar: form.aadhaar.trim(), name: form.name.trim(), dob: form.dob.trim() });
  };

  const reset = () => {
    setForm({ uan: "", aadhaar: "", name: "", dob: "" });
    setError("");
  };

  return (
    <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-4 py-6">
      <div className="flex items-center justify-between rounded-t border border-[#d8d8d8] bg-[#f7f7f7] px-4 py-2 text-[13px]">
        <div className="flex gap-5">
          <span className="font-bold text-[#1a4f8b]">Member Registration</span>
        </div>
        <span className="cursor-pointer text-[#2f80b5] hover:underline">Approve Member</span>
      </div>

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eee] px-5 py-3">
          <span className="text-[15px] font-bold text-[#333]">Member Registration</span>
          <Minus size={14} className="text-[#888]" />
        </div>

        <div className="space-y-4 px-6 py-6">
          <div>
            <span className="mb-2 block text-[14px] font-semibold text-[#333] underline">Previous Employment/UAN</span>
            <div className="flex gap-6">
              <label className="flex items-center gap-1.5 text-[14px] text-[#333]">
                <input
                  type="radio"
                  checked={hasUan === "no"}
                  onChange={() => setHasUan("no")}
                  className="accent-[#2f80b5]"
                />
                No
              </label>
              <label className="flex items-center gap-1.5 text-[14px] text-[#333]">
                <input
                  type="radio"
                  checked={hasUan === "yes"}
                  onChange={() => setHasUan("yes")}
                  className="accent-[#2f80b5]"
                />
                Yes
              </label>
            </div>
          </div>

          {hasUan === "yes" && (
            <>
              <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                    UAN <span className="text-[#e53e3e]">*</span>
                  </label>
                  <input
                    value={form.uan}
                    onChange={(e) => set("uan")(e.target.value)}
                    placeholder="UAN"
                    className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                    AADHAAR <span className="text-[#e53e3e]">*</span>
                  </label>
                  <input
                    value={form.aadhaar}
                    onChange={(e) => set("aadhaar")(e.target.value)}
                    placeholder="AADHAAR"
                    className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                    Name <span className="text-[#e53e3e]">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    placeholder="NAME"
                    className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                    Date of Birth <span className="text-[#e53e3e]">*</span>
                  </label>
                  <input
                    value={form.dob}
                    onChange={(e) => set("dob")(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                  />
                </div>
              </div>

              {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={verify}
                  className="rounded bg-[#2f80b5] px-6 py-2 text-[13.5px] font-bold text-white hover:bg-[#256a96]"
                >
                  Verify
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded bg-[#9fb4b1] px-6 py-2 text-[13.5px] font-bold text-white hover:bg-[#85a09c]"
                >
                  <RotateCcw size={14} /> Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eee] px-5 py-3">
          <span className="text-[15px] font-bold text-[#333]">Member details pending for approval</span>
          <span className="cursor-pointer text-[12.5px] text-[#2f80b5] hover:underline">View All</span>
        </div>
        <div className="px-6 py-5">
          {pendingMembers.length === 0 ? (
            <p className="text-[13px] text-[#888]">No records found.</p>
          ) : (
            <div className="overflow-hidden rounded border border-[#eee]">
              <table className="w-full text-[13px]">
                <thead className="bg-[#f7f7f7] text-[#555]">
                  <tr>
                    <th className="border-b border-[#eee] px-4 py-2 text-left font-semibold">Name</th>
                    <th className="border-b border-[#eee] px-4 py-2 text-left font-semibold">UAN</th>
                    <th className="border-b border-[#eee] px-4 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMembers.map((m) => (
                    <tr key={m.uan}>
                      <td className="border-b border-[#f2f2f2] px-4 py-2 text-[#333]">{m.name}</td>
                      <td className="border-b border-[#f2f2f2] px-4 py-2 text-[#333]">{m.uan}</td>
                      <td className="border-b border-[#f2f2f2] px-4 py-2 text-[#e8954b] font-semibold">
                        Pending Approval
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onCancel}
        className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#2f80b5] hover:underline"
      >
        <ArrowLeft size={14} /> Back to Home
      </button>
    </main>
  );
}

// ─── KYC Details table row config ──────────────────────────────────────────
type KycRow = {
  key: string;
  label: string;
  required?: boolean;
  other?: "IFSC" | "EXPIRY DT";
  selected: boolean;
  docNumber: string;
  nameOnDoc: string;
  otherValue: string;
};

function makeInitialKycRows(aadhaarNo: string, name: string): KycRow[] {
  return [
    { key: "bank", label: "Bank", other: "IFSC", selected: false, docNumber: "", nameOnDoc: "", otherValue: "" },
    { key: "pan", label: "PAN", selected: false, docNumber: "", nameOnDoc: "", otherValue: "" },
    {
      key: "aadhaar",
      label: "AADHAAR",
      required: true,
      selected: true,
      docNumber: aadhaarNo,
      nameOnDoc: name,
      otherValue: "",
    },
    { key: "passport", label: "Passport", other: "EXPIRY DT", selected: false, docNumber: "", nameOnDoc: "", otherValue: "" },
    {
      key: "driving",
      label: "Driving License",
      other: "EXPIRY DT",
      selected: false,
      docNumber: "",
      nameOnDoc: "",
      otherValue: "",
    },
    { key: "election", label: "Election Card", selected: false, docNumber: "", nameOnDoc: "", otherValue: "" },
    { key: "ration", label: "Ration Card", selected: false, docNumber: "", nameOnDoc: "", otherValue: "" },
    { key: "npr", label: "National Population Register", selected: false, docNumber: "", nameOnDoc: "", otherValue: "" },
  ];
}

// ─── Reusable full Member Registration form + KYC Details ─────────────────
function NewEmployeeForm({
  basic,
  onCancel,
  onSubmit,
}: {
  basic: BasicDetails;
  onCancel?: () => void;
  onSubmit: (newMemberId: string, name: string) => void;
}) {
  const [form, setForm] = useState({
    title: "Mr.",
    name: basic.name.toUpperCase(),
    dob: toIsoDate(basic.dob),
    gender: "Male",
    nationality: "INDIAN",
    fatherName: "",
    relation: "Father",
    maritalStatus: "",
    mobile: "",
    email: "",
    qualification: "",
    doj: "",
    wages: "",
    internationalWorker: false,
    differentlyAbled: false,
    neStates: false,
    newMemberId: "",
  });
  const [kycRows, setKycRows] = useState<KycRow[]>(() => makeInitialKycRows(basic.aadhaar, basic.name.toUpperCase()));
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const toggleKyc = (key: string) =>
    setKycRows((rows) => rows.map((r) => (r.key === key ? { ...r, selected: !r.selected } : r)));
  const setKycField = (key: string, field: "docNumber" | "nameOnDoc" | "otherValue", value: string) =>
    setKycRows((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const submit = () => {
    if (
      !form.fatherName.trim() ||
      !form.relation.trim() ||
      !form.maritalStatus.trim() ||
      !form.doj.trim() ||
      !form.newMemberId.trim()
    ) {
      setError("Please fill all required fields marked with *");
      return;
    }
    const aadhaarRow = kycRows.find((r) => r.key === "aadhaar");
    if (!aadhaarRow?.selected || !aadhaarRow.docNumber.trim()) {
      setError("Aadhaar number or Aadhaar Enrollment Number is mandatory");
      return;
    }
    setError("");
    onSubmit(form.newMemberId.trim());
  };

  return (
    <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-4 py-6">
      <div className="flex items-center gap-2 text-[13px] text-[#555]">
        <span className="cursor-pointer text-[#2f80b5] hover:underline" onClick={onCancel}>
          Member Registration
        </span>
        <span>/</span>
        <span>Add New Employee</span>
      </div>

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eee] px-5 py-3">
          <span className="text-[15px] font-bold text-[#333]">Member Registration</span>
          <Minus size={14} className="text-[#888]" />
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                Name ( As on AADHAAR ) <span className="text-[#e53e3e]">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={form.title}
                  onChange={(e) => set("title")(e.target.value)}
                  className="h-[38px] w-[80px] shrink-0 rounded border border-[#c0c0c0] bg-white px-2 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                >
                  {["Mr.", "Mrs.", "Ms."].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <input
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value.toUpperCase())}
                  className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                Nationality <span className="text-[#e53e3e]">*</span>
              </label>
              <select
                value={form.nationality}
                onChange={(e) => set("nationality")(e.target.value)}
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              >
                {["INDIAN", "FOREIGN NATIONAL"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                Date of Birth ( As on AADHAAR ) <span className="text-[#e53e3e]">*</span>
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => set("dob")(e.target.value)}
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                Relation <span className="text-[#e53e3e]">*</span>
              </label>
              <select
                value={form.relation}
                onChange={(e) => set("relation")(e.target.value)}
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              >
                {["Father", "Husband"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                Gender <span className="text-[#e53e3e]">*</span>
              </label>
              <div className="flex h-[38px] items-center gap-5">
                {["Male", "Female", "Transgender"].map((g) => (
                  <label key={g} className="flex items-center gap-1.5 text-[13.5px] text-[#333]">
                    <input
                      type="radio"
                      checked={form.gender === g}
                      onChange={() => set("gender")(g)}
                      className="accent-[#2f80b5]"
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                Father&apos;s/Husband&apos;s Name <span className="text-[#e53e3e]">*</span>
              </label>
              <input
                value={form.fatherName}
                onChange={(e) => set("fatherName")(e.target.value.toUpperCase())}
                placeholder="Enter Name"
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] placeholder:normal-case focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                Marital Status <span className="text-[#e53e3e]">*</span>
              </label>
              <select
                value={form.maritalStatus}
                onChange={(e) => set("maritalStatus")(e.target.value)}
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              >
                <option value="">Select</option>
                {["MARRIED", "UNMARRIED", "WIDOW(ER)", "DIVORCED"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">Email Id</label>
              <input
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                placeholder="Enter Email"
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">Mobile</label>
              <input
                value={form.mobile}
                onChange={(e) => set("mobile")(digitsOnly(e.target.value))}
                placeholder="Enter Mobile"
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">Qualification</label>
              <select
                value={form.qualification}
                onChange={(e) => set("qualification")(e.target.value)}
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              >
                <option value="">Select</option>
                {["BELOW MATRICULATION", "MATRICULATION", "HIGHER SECONDARY", "GRADUATE", "POST GRADUATE", "DIPLOMA", "PROFESSIONAL DEGREE"].map(
                  (o) => (
                    <option key={o}>{o}</option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">
                Date of Joining <span className="text-[#e53e3e]">*</span>
              </label>
              <input
                type="date"
                value={form.doj}
                onChange={(e) => set("doj")(e.target.value)}
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#333]">Monthly wages as on Joining</label>
              <input
                value={form.wages}
                onChange={(e) => set("wages")(digitsOnly(e.target.value))}
                placeholder="Enter Wages"
                className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-[13.5px] text-[#333]">
              <input
                type="checkbox"
                checked={form.internationalWorker}
                onChange={(e) => set("internationalWorker")(e.target.checked)}
                className="h-4 w-4 accent-[#2f80b5]"
              />
              International Worker
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-[#333]">
              <input
                type="checkbox"
                checked={form.differentlyAbled}
                onChange={(e) => set("differentlyAbled")(e.target.checked)}
                className="h-4 w-4 accent-[#2f80b5]"
              />
              Differently Abled
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-[#333]">
              <input
                type="checkbox"
                checked={form.neStates}
                onChange={(e) => set("neStates")(e.target.checked)}
                className="h-4 w-4 accent-[#2f80b5]"
              />
              Member is from Assam, Meghalaya, Nagaland, Nepal &amp; Bhutan
            </label>
          </div>

          <div className="max-w-[360px]">
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">
              New Member Id <span className="text-[#e53e3e]">*</span>
            </label>
            <input
              value={form.newMemberId}
              onChange={(e) => set("newMemberId")(e.target.value)}
              placeholder="Enter New Member Id"
              className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
            />
          </div>
        </div>
      </div>

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eee] px-5 py-3">
          <span className="text-[15px] font-bold text-[#333]">KYC Details</span>
          <Minus size={14} className="text-[#888]" />
        </div>

        <div className="overflow-x-auto px-6 py-5">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="bg-[#f7f7f7] text-[#555]">
              <tr>
                <th className="border-b border-[#eee] px-3 py-2 text-left font-semibold">Select</th>
                <th className="border-b border-[#eee] px-3 py-2 text-left font-semibold">Document Type</th>
                <th className="border-b border-[#eee] px-3 py-2 text-left font-semibold">Document Number</th>
                <th className="border-b border-[#eee] px-3 py-2 text-left font-semibold">Name as per Document</th>
                <th className="border-b border-[#eee] px-3 py-2 text-left font-semibold">Other</th>
              </tr>
            </thead>
            <tbody>
              {kycRows.map((row) => (
                <tr key={row.key}>
                  <td className="border-b border-[#f2f2f2] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleKyc(row.key)}
                      className="h-4 w-4 accent-[#2f80b5]"
                    />
                  </td>
                  <td className="border-b border-[#f2f2f2] px-3 py-2 font-semibold text-[#333]">
                    {row.required && <span className="text-[#e53e3e]">*</span>} {row.label}
                  </td>
                  <td className="border-b border-[#f2f2f2] px-3 py-2">
                    <input
                      value={row.docNumber}
                      onChange={(e) => setKycField(row.key, "docNumber", e.target.value)}
                      disabled={!row.selected}
                      placeholder="DOCUMENT NUMBER"
                      className="h-[34px] w-full rounded border border-[#c0c0c0] bg-white px-2.5 text-[12.5px] uppercase text-[#333] outline-none placeholder:text-[#aaa] placeholder:normal-case disabled:bg-[#f5f5f5] disabled:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                    />
                  </td>
                  <td className="border-b border-[#f2f2f2] px-3 py-2">
                    <input
                      value={row.nameOnDoc}
                      onChange={(e) => setKycField(row.key, "nameOnDoc", e.target.value)}
                      disabled={!row.selected}
                      placeholder="NAME AS PER DOCUMENT"
                      className="h-[34px] w-full rounded border border-[#c0c0c0] bg-white px-2.5 text-[12.5px] uppercase text-[#333] outline-none placeholder:text-[#aaa] placeholder:normal-case disabled:bg-[#f5f5f5] disabled:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                    />
                  </td>
                  <td className="border-b border-[#f2f2f2] px-3 py-2">
                    {row.other ? (
                      <input
                        value={row.otherValue}
                        onChange={(e) => setKycField(row.key, "otherValue", e.target.value)}
                        disabled={!row.selected}
                        placeholder={row.other}
                        className="h-[34px] w-full rounded border border-[#c0c0c0] bg-white px-2.5 text-[12.5px] text-[#333] outline-none placeholder:text-[#aaa] disabled:bg-[#f5f5f5] disabled:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                      />
                    ) : (
                      <span className="text-[#ccc]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mx-6 mb-5 rounded border border-[#cfe8b0] bg-[#f2f9e6] px-4 py-3 text-[12.5px] leading-relaxed text-[#7a8f2f]">
          <p>
            <Info size={13} className="mr-1 inline-block shrink-0 align-text-top" /> Aadhaar number and Aadhaar
            information provided here will be used for doing authentication of the member using the tools provided by
            the UIDAI.
          </p>
          <p className="mt-1">Please correct your details against Aadhaar or against UAN wherever it is incorrect.</p>
          <p className="mt-1">Aadhaar number or Aadhaar Enrollment Number is mandatory</p>
        </div>

        {error && <p className="px-6 pb-2 text-[12px] text-[#e53e3e]">{error}</p>}

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={submit}
            className="rounded bg-[#2f80b5] px-8 py-2 text-[13.5px] font-bold text-white hover:bg-[#256a96]"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded bg-[#d98a86] px-6 py-2 text-[13.5px] font-bold text-white hover:bg-[#c97470]"
          >
            <ArrowLeft size={14} /> Cancel
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Success page ────────────────────────────────────────────────────────────
function SuccessPage({
  basic,
  memberId,
  onBackToHome,
}: {
  basic: BasicDetails;
  memberId: string;
  onBackToHome: () => void;
}) {
  return (
    <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-4 py-6">
      <div className="flex items-start gap-3 rounded bg-[#e3f3e1] px-4 py-3 text-[14px] text-[#1a7a3a]">
        <CheckCircle size={18} className="mt-0.5 shrink-0" />
        <span>
          <strong>{basic.name}</strong> (UAN {basic.uan}, Member Id {memberId}) has been added successfully and
          submitted for approval under Member Registration.
        </span>
      </div>

      <button
        onClick={onBackToHome}
        className="mt-2 w-fit rounded-full bg-[#1a4f8b] px-6 py-2.5 text-[14px] font-bold text-white hover:bg-[#153f70]"
      >
        Back to Home
      </button>
    </main>
  );
}

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg4Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [memberOpen, setMemberOpen] = useState(false);
  // Bumped after a successful verify to remount a fresh verify form
  const [regFormKey, setRegFormKey] = useState(0);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState("");
  const [basic, setBasic] = useState<BasicDetails | null>(null);
  const [memberId, setMemberId] = useState("");
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };

  const handleMemberItemClick = (item: string) => {
    setMemberOpen(false);
    if (item === "REGISTER-INDIVIDUAL") {
      setView("memberReg");
    } else {
      showToast("Not available in this simulation.");
    }
  };

  const handleNavClick = (item: string) => {
    if (item === "Home") {
      setView("dashboard");
    } else {
      showToast("Not available in this simulation.");
    }
  };

  // The experiment ends at a successful verify: show the tick, then load a
  // fresh verify form so the student can retry (no employee-details step).
  const handleVerified = (details: BasicDetails) => {
    setBasic(details);
    setTick("Details Verified!");
    setTimeout(() => {
      setTick("");
      setRegFormKey((k) => k + 1);
    }, 1400);
  };

  const handleSubmit = (newMemberId: string) => {
    if (basic) {
      setPendingMembers((prev) => [...prev, { name: basic.name, uan: basic.uan, memberId: newMemberId }]);
    }
    setMemberId(newMemberId);
    setTick("Member Registered!");
    setTimeout(() => setTick(""), 1400);
    setView("success");
  };

  const handleLogout = () => {
    setView("dashboard");
    setBasic(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]" onClick={() => memberOpen && setMemberOpen(false)}>
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {tick && <TickOverlay label={tick} />}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}

      {view === "dashboard" && (
        <Dashboard
          memberOpen={memberOpen}
          onToggleMember={() => setMemberOpen((v) => !v)}
          onMemberItemClick={handleMemberItemClick}
          onNavClick={handleNavClick}
          onLogout={handleLogout}
        />
      )}

      {view === "memberReg" && (
        <>
          <DashboardHeader
            memberOpen={memberOpen}
            onToggleMember={() => setMemberOpen((v) => !v)}
            onMemberItemClick={handleMemberItemClick}
            onNavClick={handleNavClick}
            onLogout={handleLogout}
          />
          <MemberRegistrationPage
            key={regFormKey}
            pendingMembers={pendingMembers}
            onVerified={handleVerified}
            onCancel={() => setView("dashboard")}
          />
          <footer className="mt-auto bg-[#1a3a66] py-4 text-center text-[12px] leading-relaxed text-[#dde6f0]">
            <p>Designed, Developed and Hosted by: Employees&apos; Provident Fund Organisation, India</p>
          </footer>
        </>
      )}

      {view === "employeeDetails" && basic && (
        <>
          <DashboardHeader
            memberOpen={memberOpen}
            onToggleMember={() => setMemberOpen((v) => !v)}
            onMemberItemClick={handleMemberItemClick}
            onNavClick={handleNavClick}
            onLogout={handleLogout}
          />
          <EmployeeDetailsPage basic={basic} onCancel={() => setView("memberReg")} onSubmit={handleSubmit} />
          <footer className="mt-auto bg-[#1a3a66] py-4 text-center text-[12px] leading-relaxed text-[#dde6f0]">
            <p>Designed, Developed and Hosted by: Employees&apos; Provident Fund Organisation, India</p>
          </footer>
        </>
      )}

      {view === "success" && basic && (
        <>
          <DashboardHeader
            memberOpen={memberOpen}
            onToggleMember={() => setMemberOpen((v) => !v)}
            onMemberItemClick={handleMemberItemClick}
            onNavClick={handleNavClick}
            onLogout={handleLogout}
          />
          <SuccessPage basic={basic} memberId={memberId} onBackToHome={() => setView("dashboard")} />
          <footer className="mt-auto bg-[#1a3a66] py-4 text-center text-[12px] leading-relaxed text-[#dde6f0]">
            <p>Designed, Developed and Hosted by: Employees&apos; Provident Fund Organisation, India</p>
          </footer>
        </>
      )}
    </div>
  );
}
