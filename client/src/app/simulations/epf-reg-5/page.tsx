"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle,
  Bell,
  FileText,
  Info,
  ChevronDown,
  ChevronRight,
  LogOut,
  Home as HomeIcon,
  UserPlus2,
  NotebookText,
  X,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { EpfoNavItem } from "../../components/EpfoNavMenus";
import {
  useSimulationConfig,
  findFieldValue,
  type SimulationCredConfig,
} from "@/lib/useSimulationConfig";

const SIMULATION_SLUG = "epf-reg-5";
const COMPANY_NAME = "IICPA PRIVATE LIMITED";
const EST_ID = "APHYD1577313000";
const COMPANY_LIN = "9778613527";
const COMPANY_PAN = "BGRPA6026U";

const DASHBOARD_MENU_ITEMS = [
  "MISSING DETAILS",
  "ACTIVE MEMBER",
  "EXITED MEMBER",
  "MEMBER SERVICE DETAILS",
  "MEMBERS COMPLETING 58 YEARS",
  "J&K MEMBER MAPPING",
  "PMGKY ELIGIBLE MEMBERS",
  "PMGKY REIMBURSEMENT BENEFIT DETAILS",
];

const NAV_BEFORE = ["Member", "Establishment", "Payments"];
const NAV_AFTER = ["User", "Admin", "Online Services", "ABRY"];

type ExitedMember = {
  uan: string;
  memberId: string;
  name: string;
  gender: string;
  dob: string;
  doj: string;
  dateOfExit: string;
  fatherName: string;
  relation: string;
  maritalStatus: string;
  mobile: string;
  email: string;
  aadhaar: string;
  pan: string;
  bankAcc: string;
  nomination: string;
};

const EXITED_MEMBERS: ExitedMember[] = [
  {
    uan: "100512345678",
    memberId: "APHYD15773130000000201",
    name: "VIKRAM SINGH",
    gender: "Male",
    dob: "1988-03-21",
    doj: "2021-04-05",
    dateOfExit: "2024-11-30",
    fatherName: "RANJIT SINGH",
    relation: "Father",
    maritalStatus: "MARRIED",
    mobile: "9876500011",
    email: "vikramsingh88@gmail.com",
    aadhaar: "456745674567",
    pan: "NOT AVAILABLE",
    bankAcc: "NOT AVAILABLE",
    nomination: "NO",
  },
  {
    uan: "100698765432",
    memberId: "APHYD15773130000000202",
    name: "MEENA KUMARI",
    gender: "Female",
    dob: "1992-09-10",
    doj: "2022-01-17",
    dateOfExit: "2025-02-28",
    fatherName: "MOHAN LAL",
    relation: "Father",
    maritalStatus: "MARRIED",
    mobile: "9876500012",
    email: "meenakumari92@gmail.com",
    aadhaar: "567856785678",
    pan: "NOT AVAILABLE",
    bankAcc: "NOT AVAILABLE",
    nomination: "NO",
  },
  {
    uan: "101287654321",
    memberId: "APHYD15773130000000203",
    name: "JOHN DCOSTA",
    gender: "Male",
    dob: "1990-12-05",
    doj: "2021-08-02",
    dateOfExit: "2025-05-15",
    fatherName: "PETER DCOSTA",
    relation: "Father",
    maritalStatus: "MARRIED",
    mobile: "9876500013",
    email: "johndcosta90@gmail.com",
    aadhaar: "678967896789",
    pan: "NOT AVAILABLE",
    bankAcc: "NOT AVAILABLE",
    nomination: "NO",
  },
  {
    uan: "101876543210",
    memberId: "APHYD15773130000000204",
    name: "PRIYA NAIR",
    gender: "Female",
    dob: "1996-07-22",
    doj: "2023-03-01",
    dateOfExit: "2025-06-20",
    fatherName: "SURESH NAIR",
    relation: "Father",
    maritalStatus: "UNMARRIED",
    mobile: "9876500014",
    email: "priyanair96@gmail.com",
    aadhaar: "789078907890",
    pan: "NOT AVAILABLE",
    bankAcc: "NOT AVAILABLE",
    nomination: "NO",
  },
  {
    uan: "101765432109",
    memberId: "APHYD15773130000000205",
    name: "RAHUL MEHTA",
    gender: "Male",
    dob: "1991-11-11",
    doj: "2022-06-13",
    dateOfExit: "2025-04-10",
    fatherName: "ANIL MEHTA",
    relation: "Father",
    maritalStatus: "MARRIED",
    mobile: "9876500015",
    email: "rahulmehta91@gmail.com",
    aadhaar: "890189018901",
    pan: "NOT AVAILABLE",
    bankAcc: "NOT AVAILABLE",
    nomination: "NO",
  },
];

const digitsOnly = (v: string) => v.replace(/\D/g, "");

// dd/mm/yyyy (as typed in the course editor) -> yyyy-mm-dd (table/date-input format)
const normalizeDate = (v: string): string => {
  const m = v.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!m) return v.trim();
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
};

// Establishment-level labels (never treated as employee fields)
const COMPANY_LABEL = /company|establishment|est\.?\s*id|\blin\b/i;
// Course-editor default credential labels — ignored (this sim has no login)
const CRED_LABEL = /user|pass|captcha|otp/i;
// "Employee 2 ..." / "Member 3 ..." prefix selecting which roster row a field targets
const GROUP_PREFIX = /(?:employee|emp|member|row)\s*#?\s*(\d+)/i;

// Map a configured field label to the ExitedMember property it overrides.
// Specific labels are matched before the generic "name".
const employeeKeyForLabel = (label: string): keyof ExitedMember | null => {
  const l = label.toLowerCase();
  if (/uan/.test(l)) return "uan";
  if (/member\s*id/.test(l)) return "memberId";
  if (/father|husband/.test(l)) return "fatherName";
  if (/relation/.test(l)) return "relation";
  if (/marital/.test(l)) return "maritalStatus";
  if (/gender/.test(l)) return "gender";
  if (/birth|dob/.test(l)) return "dob";
  if (/exit|doe/.test(l)) return "dateOfExit";
  if (/join|doj/.test(l)) return "doj";
  if (/mobile|phone/.test(l)) return "mobile";
  if (/email/.test(l)) return "email";
  if (/aadhaar|aadhar/.test(l)) return "aadhaar";
  if (/pan/.test(l)) return "pan";
  if (/bank/.test(l)) return "bankAcc";
  if (/nomination|nomnation/.test(l)) return "nomination";
  if (/name/.test(l)) return "name";
  return null;
};

const EMPTY_MEMBER: ExitedMember = {
  uan: "",
  memberId: "",
  name: "",
  gender: "Male",
  dob: "",
  doj: "",
  dateOfExit: "",
  fatherName: "",
  relation: "Father",
  maritalStatus: "",
  mobile: "",
  email: "",
  aadhaar: "",
  pan: "NOT AVAILABLE",
  bankAcc: "NOT AVAILABLE",
  nomination: "NO",
};

type PortalData = {
  companyName: string;
  estId: string;
  lin: string;
  pan: string;
  bannerText: string;
  members: ExitedMember[];
};

// Merge the admin/course-editor config (Simulation Manager slug config or the
// per-insert ?simCfg override) onto the hardcoded defaults. Establishment
// fields use labels like "Company Name" / "Est Id" / "LIN"; employee fields
// use "UAN" / "Name" / "Email" / "Date of Exit" ... (row 1) or "Employee 2
// Name", "Employee 2 UAN" ... to override or append other roster rows.
function buildPortalData(config: SimulationCredConfig | null): PortalData {
  const base: PortalData = {
    companyName: COMPANY_NAME,
    estId: EST_ID,
    lin: COMPANY_LIN,
    pan: COMPANY_PAN,
    bannerText: "",
    members: EXITED_MEMBERS,
  };
  if (!config) return base;

  const estId =
    findFieldValue(config, /est(ablishment)?\.?\s*id/i).replace(/\s/g, "").toUpperCase() ||
    base.estId;
  const overrides = new Map<number, Partial<ExitedMember>>();

  for (const { label, value } of config.credentialFields) {
    const v = value.trim();
    if (!v || COMPANY_LABEL.test(label) || CRED_LABEL.test(label)) continue;
    const group = label.match(GROUP_PREFIX);
    const idx = group ? Math.max(parseInt(group[1], 10) - 1, 0) : 0;
    const key = employeeKeyForLabel(label.replace(GROUP_PREFIX, " "));
    if (!key) continue;
    const val = key === "dob" || key === "doj" || key === "dateOfExit" ? normalizeDate(v) : v;
    overrides.set(idx, { ...(overrides.get(idx) || {}), [key]: val });
  }

  let members = base.members;
  if (overrides.size) {
    const rows = Math.max(base.members.length, ...Array.from(overrides.keys(), (i) => i + 1));
    members = Array.from({ length: rows }, (_, i) => ({
      ...(base.members[i] ?? EMPTY_MEMBER),
      ...(overrides.get(i) || {}),
    })).filter((m) => m.uan || m.name);
  }

  return {
    companyName: findFieldValue(config, /company\s*name|^company$/i) || base.companyName,
    estId,
    lin: findFieldValue(config, /\blin\b/i) || base.lin,
    pan: findFieldValue(config, /company\s*pan/i) || base.pan,
    bannerText: config.bannerText,
    members,
  };
}

type View = "dashboard" | "exitedMember";

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
        style={{ animation: "epfTickPop5 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">{label}</p>
      <style jsx>{`
        @keyframes epfTickPop5 {
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

// ─── Dashboard header: company strip + nav bar with Dashboards dropdown ────
function DashboardHeader({
  companyName,
  estId,
  dashboardsOpen,
  onToggleDashboards,
  onDashboardItemClick,
  onNavClick,
  onLogout,
}: {
  companyName: string;
  estId: string;
  dashboardsOpen: boolean;
  onToggleDashboards: () => void;
  onDashboardItemClick: (item: string) => void;
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
            <div className="text-[16px] font-bold text-[#1a4f8b]">{companyName}, INDIA</div>
            <div className="text-[11px] font-bold tracking-wide text-[#c0392b]">
              MINISTRY OF LABOUR &amp; EMPLOYMENT, SIMULATION
            </div>
          </div>
        </div>

        <div className="text-center text-[12.5px] leading-[1.5]">
          <div className="text-[#e8954b]">
            Welcome: <span className="font-semibold">{estId}</span>
          </div>
          <div className="font-semibold text-[#2f80b5]">{estId}</div>
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
          <div className="mt-1 text-[#888]">Wed 18 Aug 2021 (PV 3.3.32)</div>
        </div>
      </div>

      <nav className="flex flex-wrap items-stretch bg-[#1a4f8b] text-white">
        <button
          onClick={() => onNavClick("Home")}
          className="flex items-center gap-1.5 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10"
        >
          <HomeIcon size={14} /> Home
        </button>

        {NAV_BEFORE.map((item) => (
          <EpfoNavItem key={item} label={item} open={openNavMenu === item} onToggle={setOpenNavMenu} />
        ))}

        <div className="relative">
          <button
            onClick={onToggleDashboards}
            className={`flex h-full items-center gap-1 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10 ${
              dashboardsOpen ? "bg-white/10" : ""
            }`}
          >
            Dashboards <ChevronDown size={12} />
          </button>

          {dashboardsOpen && (
            <div className="absolute left-0 top-full z-40 w-[300px] rounded-b border border-t-0 border-[#ccc] bg-white py-1 text-left shadow-lg">
              {DASHBOARD_MENU_ITEMS.map((item) => {
                const isTarget = item === "EXITED MEMBER";
                return (
                  <button
                    key={item}
                    onClick={() => onDashboardItemClick(item)}
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

        {NAV_AFTER.map((item) => (
          <EpfoNavItem key={item} label={item} open={openNavMenu === item} onToggle={setOpenNavMenu} />
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

function EmployerProfilePanel({ portal }: { portal: PortalData }) {
  const rows: [string, React.ReactNode][] = [
    ["Est. Id", portal.estId],
    ["LIN", portal.lin],
    ["PAN", portal.pan],
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
      <p className="mb-3 text-center text-[14px] font-bold text-[#1a4f8b]">{portal.companyName}</p>
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
function DashboardMain({ portal }: { portal: PortalData }) {
  return (
    <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
      <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          <AlertsPanel />
          <DashboardWhatsNewPanel />
        </div>
        <div className="flex flex-col gap-5">
          <EmployerProfilePanel portal={portal} />
          <OnlineServicesPanel />
        </div>
      </div>
    </main>
  );
}

// ─── Exited Member dashboard: search + list all exited employees ───────────
function ExitedMemberPage({
  portal,
  onVerified,
  onBack,
}: {
  portal: PortalData;
  onVerified: (label: string) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState({
    uan: "",
    name: "",
    email: "",
    dojFrom: "",
    dojTill: "",
    y58From: "",
    y58Till: "",
  });
  const [results, setResults] = useState<ExitedMember[] | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  // The experiment's answer key: the admin-configured target employee
  // (course-editor row-1 fields override the first roster member).
  const target = portal.members[0];

  const search = () => {
    const uan = digitsOnly(form.uan);
    const name = form.name.trim().toLowerCase().replace(/^(mr|mrs|ms)\.?\s+/i, "");
    const email = form.email.trim().toLowerCase();
    if (!uan && !name && !email && !form.dojFrom && !form.dojTill) {
      setError("Please enter at least one search criteria");
      return;
    }
    const matched = portal.members.filter((m) => {
      if (uan && !m.uan.includes(uan)) return false;
      if (name && !m.name.toLowerCase().includes(name)) return false;
      if (email && !m.email.toLowerCase().includes(email)) return false;
      if (form.dojFrom && m.doj < form.dojFrom) return false;
      if (form.dojTill && m.doj > form.dojTill) return false;
      return true;
    });
    setError(matched.length === 0 ? "No exited member found for the given criteria" : "");
    setResults(matched);
    setDetailsOpen(true);

    // Success tick only when the student searched with the target employee's
    // UAN, Name and Email exactly as set by the admin in the course editor.
    if (
      target &&
      uan === target.uan &&
      name === target.name.trim().toLowerCase() &&
      email === target.email.trim().toLowerCase()
    ) {
      onVerified("Member Verified!");
    }
  };

  const showAll = () => {
    setError("");
    setResults(portal.members);
    setDetailsOpen(true);
    onVerified("Exited Members Listed!");
  };

  // Member ID prefix segments derived from the (possibly admin-configured)
  // establishment id, e.g. APHYD1577313000 -> AP | HYD | 1577313 | 000
  const idSegments = [
    portal.estId.slice(0, 2),
    portal.estId.slice(2, 5),
    portal.estId.slice(5, 12),
    portal.estId.slice(12, 15),
  ].filter(Boolean);

  const cancel = () => {
    setForm({ uan: "", name: "", email: "", dojFrom: "", dojTill: "", y58From: "", y58Till: "" });
    setResults(null);
    setError("");
  };

  const inputCls =
    "h-[36px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]";
  const dateCls =
    "h-[36px] w-[150px] rounded border border-[#c0c0c0] bg-[#f5f5f5] px-2 text-[13px] text-[#333] outline-none focus:border-[#2f80b5] focus:bg-white focus:ring-1 focus:ring-[#2f80b5]";

  return (
    <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-4 py-6">
      <div className="flex items-center gap-2 text-[13px] text-[#555]">
        <span className="cursor-pointer text-[#2f80b5] hover:underline" onClick={onBack}>
          Home
        </span>
        <span>/</span>
        <span>Dashboards</span>
        <span>/</span>
        <span>Exited Member</span>
      </div>

      {portal.bannerText && (
        <div className="flex items-start gap-2 rounded border border-[#bee3f8] bg-[#ebf8ff] px-4 py-2.5 text-[13px] text-[#1a4f8b]">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>{portal.bannerText}</span>
        </div>
      )}

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="divide-y divide-[#eee]">
          <div className="grid items-center gap-3 px-5 py-3 md:grid-cols-[110px_1fr_110px_1fr]">
            <label className="text-[13.5px] font-semibold text-[#333]">UAN</label>
            <input value={form.uan} onChange={(e) => set("uan")(digitsOnly(e.target.value))} className={inputCls} />
            <label className="text-[13.5px] font-semibold text-[#333]">Member ID</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {idSegments.map((seg) => (
                <input
                  key={seg}
                  value={seg}
                  readOnly
                  className="h-[36px] rounded border border-[#c0c0c0] bg-[#f0f0f0] px-2 text-center text-[13px] text-[#555]"
                  style={{ width: `${Math.max(seg.length + 2, 4)}ch` }}
                />
              ))}
              <input
                value="0000000"
                readOnly
                className="h-[36px] w-[10ch] rounded border border-[#c0c0c0] bg-white px-2 text-center text-[13px] text-[#555]"
              />
            </div>
          </div>

          <div className="grid items-center gap-3 px-5 py-3 md:grid-cols-[110px_1fr_110px_1fr]">
            <label className="text-[13.5px] font-semibold text-[#333]">Name</label>
            <input value={form.name} onChange={(e) => set("name")(e.target.value)} className={inputCls} />
            <label className="text-[13.5px] font-semibold text-[#333]">Email Id</label>
            <input value={form.email} onChange={(e) => set("email")(e.target.value)} className={inputCls} />
          </div>

          <div className="flex flex-wrap items-center gap-3 px-5 py-3">
            <label className="w-[210px] text-[13.5px] font-semibold text-[#333]">Joining Date Between</label>
            <input type="date" value={form.dojFrom} onChange={(e) => set("dojFrom")(e.target.value)} className={dateCls} />
            <span className="text-[13px] text-[#555]">And</span>
            <input type="date" value={form.dojTill} onChange={(e) => set("dojTill")(e.target.value)} className={dateCls} />
          </div>

          <div className="flex flex-wrap items-center gap-3 px-5 py-3">
            <label className="w-[210px] text-[13.5px] font-semibold text-[#333]">58 Years Completed Between</label>
            <input type="date" value={form.y58From} onChange={(e) => set("y58From")(e.target.value)} className={dateCls} />
            <span className="text-[13px] text-[#555]">And</span>
            <input type="date" value={form.y58Till} onChange={(e) => set("y58Till")(e.target.value)} className={dateCls} />
          </div>
        </div>

        {error && <p className="px-5 pt-3 text-[12.5px] text-[#e53e3e]">{error}</p>}

        <div className="flex flex-wrap gap-3 px-5 py-4">
          <button
            onClick={search}
            className="rounded bg-[#2f80b5] px-6 py-2 text-[13.5px] font-bold text-white hover:bg-[#256a96]"
          >
            Search
          </button>
          <button
            onClick={showAll}
            className="rounded bg-[#1a4f8b] px-6 py-2 text-[13.5px] font-bold text-white hover:bg-[#153f70]"
          >
            Show Member exited in Last 3 months
          </button>
          <button
            onClick={cancel}
            className="flex items-center gap-1.5 rounded bg-[#9fb4b1] px-6 py-2 text-[13.5px] font-bold text-white hover:bg-[#85a09c]"
          >
            <RotateCcw size={14} /> Cancel
          </button>
        </div>
      </div>

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <button
          onClick={() => setDetailsOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 border-b border-[#eee] px-5 py-3 text-left text-[14.5px] font-bold text-[#333]"
        >
          {detailsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />} Exited Member Details
        </button>

        {detailsOpen && (
          <div className="overflow-x-auto px-5 py-4">
            <table className="w-full min-w-[1360px] text-[12.5px]">
              <thead className="bg-[#f7f7f7] text-[#1a4f8b]">
                <tr>
                  {[
                    "",
                    "UAN",
                    "Member ID",
                    "Name",
                    "Gender",
                    "Date of Birth",
                    "Date of Joining",
                    "Date of Exit",
                    "Father's / Husband's Name",
                    "Relation",
                    "Marital Status",
                    "Mobile",
                    "Email ID",
                    "Aadhaar",
                    "PAN",
                    "Bank Acc.",
                    "Nomnation",
                  ].map((head, i) => (
                    <th key={i} className="border-b border-[#eee] px-3 py-2 text-left font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results === null && (
                  <tr>
                    <td colSpan={17} className="px-3 py-6 text-center text-[#888]">
                      Use <strong>Search</strong> or <strong>Show Member exited in Last 3 months</strong> to view
                      exited members.
                    </td>
                  </tr>
                )}
                {results !== null && results.length === 0 && (
                  <tr>
                    <td colSpan={17} className="px-3 py-6 text-center text-[#888]">
                      No records found.
                    </td>
                  </tr>
                )}
                {results?.map((m, i) => (
                  <tr key={m.uan} className="align-top odd:bg-white even:bg-[#fafafa]">
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#555]">{i + 1}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.uan}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.memberId}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 font-semibold text-[#333]">{m.name}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.gender}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.dob}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.doj}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.dateOfExit}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.fatherName}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.relation}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.maritalStatus}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.mobile}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#2f80b5]">{m.email}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.aadhaar}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#888]">{m.pan}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#888]">{m.bankAcc}</td>
                    <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{m.nomination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#2f80b5] hover:underline"
      >
        <ArrowLeft size={14} /> Back to Home
      </button>
    </main>
  );
}

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg5Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [dashboardsOpen, setDashboardsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState("");
  // Bumped when re-entering the Exited Member page so it loads a clean form
  const [pageKey, setPageKey] = useState(0);

  // Admin-configured values (per-insert ?simCfg override from the course
  // editor, or the slug config from the Simulation Manager) replace the
  // hardcoded company/employee defaults when available.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const portal = useMemo(() => buildPortalData(simConfig), [simConfig]);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };

  const handleDashboardItemClick = (item: string) => {
    setDashboardsOpen(false);
    if (item === "EXITED MEMBER") {
      setPageKey((k) => k + 1);
      setView("exitedMember");
    } else {
      showToast("Not available in this simulation.");
    }
  };

  // Success tick: fires when the full list is shown, or when the student
  // searches with the target employee's UAN, Name and Email (as configured
  // by the admin).
  const handleVerified = (label: string) => {
    setTick(label);
    setTimeout(() => setTick(""), 1400);
  };

  const handleNavClick = (item: string) => {
    if (item === "Home") {
      setView("dashboard");
    } else {
      showToast("Not available in this simulation.");
    }
  };

  const handleLogout = () => {
    setView("dashboard");
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[#f0f0f0]"
      onClick={() => dashboardsOpen && setDashboardsOpen(false)}
    >
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {tick && <TickOverlay label={tick} />}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}

      <DashboardHeader
        companyName={portal.companyName}
        estId={portal.estId}
        dashboardsOpen={dashboardsOpen}
        onToggleDashboards={() => setDashboardsOpen((v) => !v)}
        onDashboardItemClick={handleDashboardItemClick}
        onNavClick={handleNavClick}
        onLogout={handleLogout}
      />

      {view === "dashboard" && <DashboardMain portal={portal} />}
      {view === "exitedMember" && (
        <ExitedMemberPage
          key={pageKey}
          portal={portal}
          onVerified={handleVerified}
          onBack={() => setView("dashboard")}
        />
      )}

      <footer className="mt-auto bg-[#1a3a66] py-4 text-center text-[12px] leading-relaxed text-[#dde6f0]">
        <p>Designed, Developed and Hosted by: Employees&apos; Provident Fund Organisation, India</p>
        <p>Last Updated Wed 18 Aug 2021 (PV 3.3.32)</p>
      </footer>
    </div>
  );
}
