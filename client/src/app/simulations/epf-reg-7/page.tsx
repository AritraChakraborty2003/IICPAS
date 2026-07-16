"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle,
  Bell,
  FileText,
  Info,
  ChevronDown,
  LogOut,
  Home as HomeIcon,
  UserPlus2,
  NotebookText,
  X,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { EpfoNavItem, EPFO_NAV_MENUS } from "../../components/EpfoNavMenus";
import {
  useSimulationConfig,
  findFieldValue,
  type SimulationCredConfig,
} from "@/lib/useSimulationConfig";

const SIMULATION_SLUG = "epf-reg-7";
const COMPANY_NAME = "IICPA PRIVATE LIMITED";
const EST_ID = "APHYD1577313000";
const COMPANY_LIN = "9778613527";
const COMPANY_PAN = "BGRPA6026U";

const NAV_AFTER_MEMBER = ["Establishment", "Payments", "Dashboards"];
const NAV_AFTER = ["User", "Admin", "Online Services", "ABRY"];

const EXIT_REASONS = [
  "RETIREMENT",
  "DEATH IN SERVICE",
  "SUPERNNUATION",
  "PERMANENT DISABLEMENT",
  "CESSATION (SHORT SERVICE) - Any other reason",
  "CESSATION (SHORT SERVICE) - The employee ill health",
  "CESSATION (SHORT SERVICE) - The contraction or discontinuance of employer's business",
  "CESSATION (SHORT SERVICE) - Other cause beyond the control of employee",
];

type MemberRecord = {
  uan: string;
  memberId: string;
  badgeId: string;
  name: string;
  dob: string;
  doj: string;
  gender: string;
  maritalStatus: string;
  fatherName: string;
  relation: string;
  mobile: string;
  email: string;
  internationalWorker: string;
  qualification: string;
  epfWages: string;
  differentlyAbled: string;
  nomination: string;
};

const DEFAULT_MEMBER: MemberRecord = {
  uan: "101999827383",
  memberId: "101999",
  badgeId: "91519494838",
  name: "RIYA VERMA",
  dob: "1997-12-22",
  doj: "2024-01-01",
  gender: "Female",
  maritalStatus: "Married",
  fatherName: "RAJ VERMA",
  relation: "-",
  mobile: "9937373939",
  email: "riyaverma1@gmail.com",
  internationalWorker: "No",
  qualification: "-",
  epfWages: "19000",
  differentlyAbled: "NO",
  nomination: "Not Filed",
};

const digitsOnly = (v: string) => v.replace(/\D/g, "");

// dd/mm/yyyy (as typed in the course editor) -> yyyy-mm-dd (table/date-input format)
const normalizeDate = (v: string): string => {
  const m = v.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!m) return v.trim();
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
};

// Establishment-level labels (never treated as member fields)
const COMPANY_LABEL = /company|establishment|est\.?\s*id|\blin\b|welcome/i;
// Course-editor default credential labels — ignored (this sim has no login)
const CRED_LABEL = /user|pass|captcha|otp/i;

// Map a configured field label to the MemberRecord property it overrides.
// Specific labels are matched before the generic "name".
const memberKeyForLabel = (label: string): keyof MemberRecord | null => {
  const l = label.toLowerCase();
  if (/uan/.test(l)) return "uan";
  if (/badge/.test(l)) return "badgeId";
  if (/member\s*id/.test(l)) return "memberId";
  if (/father|husband/.test(l)) return "fatherName";
  if (/relation/.test(l)) return "relation";
  if (/marital/.test(l)) return "maritalStatus";
  if (/gender/.test(l)) return "gender";
  if (/birth|dob/.test(l)) return "dob";
  if (/join|doj/.test(l)) return "doj";
  if (/mobile|phone/.test(l)) return "mobile";
  if (/email/.test(l)) return "email";
  if (/wage/.test(l)) return "epfWages";
  if (/international/.test(l)) return "internationalWorker";
  if (/qualification/.test(l)) return "qualification";
  if (/abled|disab/.test(l)) return "differentlyAbled";
  if (/nomination|nomnation/.test(l)) return "nomination";
  if (/name/.test(l)) return "name";
  return null;
};

type PortalData = {
  companyName: string;
  welcomeName: string;
  estId: string;
  lin: string;
  pan: string;
  bannerText: string;
  member: MemberRecord;
};

// Merge the admin/course-editor config (Simulation Manager slug config or the
// per-insert ?simCfg override) onto the hardcoded defaults. Establishment
// fields use labels like "Company Name" / "Welcome Name" / "Est Id" / "LIN" /
// "Company PAN"; member fields use "UAN" / "Name" / "Badge Id" / "Member Id" /
// "Date of Birth" / "Date of Joining" / "Mobile" / "Email" / "Monthly EPF
// Wages" / "Qualification" / "Nomination" ...
function buildPortalData(config: SimulationCredConfig | null): PortalData {
  const base: PortalData = {
    companyName: COMPANY_NAME,
    welcomeName: COMPANY_NAME,
    estId: EST_ID,
    lin: COMPANY_LIN,
    pan: COMPANY_PAN,
    bannerText: "",
    member: DEFAULT_MEMBER,
  };
  if (!config) return base;

  const estId =
    findFieldValue(config, /est(ablishment)?\.?\s*id/i).replace(/\s/g, "").toUpperCase() ||
    base.estId;

  const member: MemberRecord = { ...base.member };
  for (const { label, value } of config.credentialFields) {
    const v = value.trim();
    if (!v || COMPANY_LABEL.test(label) || CRED_LABEL.test(label)) continue;
    const key = memberKeyForLabel(label);
    if (!key) continue;
    member[key] = key === "dob" || key === "doj" ? normalizeDate(v) : v;
  }

  const companyName =
    findFieldValue(config, /company\s*name|^company$/i) || base.companyName;
  return {
    companyName,
    welcomeName: findFieldValue(config, /welcome/i) || companyName,
    estId,
    lin: findFieldValue(config, /\blin\b/i) || base.lin,
    pan: findFieldValue(config, /company\s*pan/i) || base.pan,
    bannerText: config.bannerText,
    member,
  };
}

// "X Years Y Months Z Days" from an ISO dob to today
function computeAge(dobIso: string): string {
  const dob = new Date(dobIso);
  if (isNaN(dob.getTime())) return "-";
  const now = new Date();
  let y = now.getFullYear() - dob.getFullYear();
  let m = now.getMonth() - dob.getMonth();
  let d = now.getDate() - dob.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (m < 0) {
    m += 12;
    y -= 1;
  }
  return `${y} Years ${m} Months ${d} Days`;
}

type View = "dashboard" | "memberProfile";

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
        style={{ animation: "epfTickPop7 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">{label}</p>
      <style jsx>{`
        @keyframes epfTickPop7 {
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

// ─── Dashboard header: company strip + nav bar with Member dropdown ─────────
function DashboardHeader({
  companyName,
  welcomeName,
  estId,
  memberMenuOpen,
  onToggleMemberMenu,
  onMemberItemClick,
  onNavClick,
  onLogout,
}: {
  companyName: string;
  welcomeName: string;
  estId: string;
  memberMenuOpen: boolean;
  onToggleMemberMenu: () => void;
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
            <div className="text-[16px] font-bold text-[#1a4f8b]">{companyName}, INDIA</div>
            <div className="text-[11px] font-bold tracking-wide text-[#c0392b]">
              MINISTRY OF LABOUR &amp; EMPLOYMENT, SIMULATION
            </div>
          </div>
        </div>

        <div className="text-center text-[12.5px] leading-[1.5]">
          <div className="text-[#e8954b]">
            Welcome: <span className="font-semibold">{welcomeName}</span>
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

        <div className="relative">
          <button
            onClick={onToggleMemberMenu}
            className={`flex h-full items-center gap-1 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10 ${
              memberMenuOpen ? "bg-white/10" : ""
            }`}
          >
            Member <ChevronDown size={12} />
          </button>

          {memberMenuOpen && (
            <div className="absolute left-0 top-full z-40 w-[340px] rounded-b border border-t-0 border-[#ccc] bg-white py-1 text-left shadow-lg">
              {EPFO_NAV_MENUS.Member.map((item) => {
                const isTarget = item === "MEMBER PROFILE";
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

        {NAV_AFTER_MEMBER.map((item) => (
          <EpfoNavItem key={item} label={item} open={openNavMenu === item} onToggle={setOpenNavMenu} />
        ))}

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

// ─── Mark Exit tab: exit reason + EPF/EPS exit dates + Save ─────────────────
function MarkExitForm({
  member,
  onVerified,
}: {
  member: MemberRecord;
  onVerified: (label: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [epfDate, setEpfDate] = useState("");
  const [epsDate, setEpsDate] = useState("");
  const [error, setError] = useState("");

  const dateCls =
    "h-[36px] w-[170px] rounded border border-[#c0c0c0] bg-[#f5f5f5] px-2 text-[13px] text-[#333] outline-none focus:border-[#2f80b5] focus:bg-white focus:ring-1 focus:ring-[#2f80b5]";

  const save = () => {
    if (!reason || !epfDate || !epsDate) {
      setError("Please select Exit Reason and enter both Exit Dates");
      return;
    }
    setError("");
    onVerified("Exit Marked Successfully!");
  };

  const rows: [string, React.ReactNode][] = [
    ["Date of Birth", <span key="dob">{member.dob}</span>],
    ["Age", <span key="age">{computeAge(member.dob)}</span>],
    [
      "Exit Reason *",
      <select
        key="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="h-[36px] w-full max-w-[640px] rounded border border-[#c0c0c0] bg-white px-2 text-[13px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
      >
        <option value="">--Select--</option>
        {EXIT_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>,
    ],
    [
      "Exit Date (EPF) *",
      <input
        key="epf"
        type="date"
        value={epfDate}
        onChange={(e) => setEpfDate(e.target.value)}
        className={dateCls}
      />,
    ],
    [
      "Exit Date (EPS) *",
      <input
        key="eps"
        type="date"
        value={epsDate}
        onChange={(e) => setEpsDate(e.target.value)}
        className={dateCls}
      />,
    ],
  ];

  return (
    <div>
      <h3 className="border-b-2 border-[#e8954b] pb-2 text-[15px] font-bold text-[#2f80b5]">
        Member - Exit Details
      </h3>
      <div className="mt-3 overflow-hidden rounded border border-[#e4e4e4]">
        {rows.map(([label, control]) => (
          <div
            key={label}
            className="grid items-center gap-3 border-b border-[#eee] px-4 py-2.5 last:border-b-0 md:grid-cols-[200px_1fr]"
          >
            <span className="text-[13px] font-semibold text-[#e8954b]">{label}</span>
            <div className="text-[13.5px] text-[#333]">{control}</div>
          </div>
        ))}
        <div className="flex justify-center border-t border-[#eee] px-4 py-4">
          <button
            onClick={save}
            className="flex items-center gap-1.5 rounded-full bg-green-600 px-7 py-2 text-[13.5px] font-bold text-white shadow hover:bg-green-700"
          >
            <CheckCircle size={15} /> Save
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-[12.5px] text-[#e53e3e]">{error}</p>}
    </div>
  );
}

// ─── Member Profile: UAN search + Profile / Missing / KYC / Mark Exit tabs ──
type TabKey = "profile" | "missing" | "kyc" | "markExit";

const TABS: { key: TabKey; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "missing", label: "Missing Details" },
  { key: "kyc", label: "KYC" },
  { key: "markExit", label: "Mark Exit" },
];

function MemberProfilePage({
  portal,
  onVerified,
  onBack,
}: {
  portal: PortalData;
  onVerified: (label: string) => void;
  onBack: () => void;
}) {
  const [uan, setUan] = useState("");
  const [found, setFound] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const member = portal.member;

  const search = () => {
    const v = digitsOnly(uan);
    if (!v) {
      setFound(false);
      setError("Please enter UAN");
      return;
    }
    if (v === member.uan) {
      setError("");
      setActiveTab("profile");
      setFound(true);
    } else {
      setFound(false);
      setError("No member found for the given UAN");
    }
  };

  const cancel = () => {
    setUan("");
    setFound(false);
    setError("");
    setActiveTab("profile");
  };

  const inputCls =
    "h-[36px] w-full max-w-[280px] rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]";

  // [label, value] pairs; a row holds one or two pairs (matching the EPFO layout)
  const detailRows: [string, string][][] = [
    [["Member ID", member.memberId]],
    [["Name", member.name]],
    [
      ["Date of Birth", member.dob],
      ["Date of Joining", member.doj],
    ],
    [
      ["Gender", member.gender],
      ["Marital Status", member.maritalStatus],
    ],
    [
      ["Father's/Husband's Name", member.fatherName],
      ["Relation", member.relation],
    ],
    [
      ["Mobile", member.mobile],
      ["Email Id", member.email],
    ],
    [["International Worker", member.internationalWorker]],
    [
      ["Qualification", member.qualification],
      ["Monthly EPF Wages as on Joining", member.epfWages],
    ],
    [["Differently Abled", member.differentlyAbled]],
    [["Nomination", member.nomination]],
  ];

  return (
    <main className="mx-auto flex w-[min(98vw,1500px)] flex-1 flex-col gap-4 py-6">
      <div className="flex items-center gap-2 text-[13px] text-[#555]">
        <span className="cursor-pointer text-[#2f80b5] hover:underline" onClick={onBack}>
          Home
        </span>
        <span>/</span>
        <span>Member</span>
        <span>/</span>
        <span>Member Profile</span>
      </div>

      {portal.bannerText && (
        <div className="flex items-start gap-2 rounded border border-[#bee3f8] bg-[#ebf8ff] px-4 py-2.5 text-[13px] text-[#1a4f8b]">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>{portal.bannerText}</span>
        </div>
      )}

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="px-5 pt-4">
          <h3 className="border-b-2 border-[#e8954b] pb-2 text-[15px] font-bold text-[#2f80b5]">Search</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <label className="w-[60px] text-[13.5px] font-semibold text-[#333]">UAN</label>
          <input
            value={uan}
            onChange={(e) => setUan(digitsOnly(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className={inputCls}
          />
        </div>

        {error && <p className="px-5 pb-1 text-[12.5px] text-[#e53e3e]">{error}</p>}

        <div className="flex flex-wrap gap-3 px-5 pb-4">
          <button
            onClick={search}
            className="rounded bg-[#2f80b5] px-6 py-2 text-[13.5px] font-bold text-white hover:bg-[#256a96]"
          >
            Search
          </button>
          <button
            onClick={cancel}
            className="flex items-center gap-1.5 rounded bg-[#1a4f8b] px-6 py-2 text-[13.5px] font-bold text-white hover:bg-[#153f70]"
          >
            <RotateCcw size={14} /> Cancel
          </button>
        </div>
      </div>

      {found && (
        <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#eee] px-5 pt-4 pb-3">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`rounded px-4 py-2 text-[13.5px] font-semibold transition-colors ${
                  activeTab === key
                    ? "border border-[#1a4f8b] bg-white text-[#1a4f8b] shadow-sm"
                    : "text-[#2f80b5] hover:bg-[#eef4fb]"
                }`}
              >
                {label}
              </button>
            ))}

            <div className="ml-2 rounded bg-[#efb034] px-8 py-1.5 text-center leading-[1.5] text-white shadow-sm">
              <div className="text-[13.5px] font-bold">{member.badgeId}</div>
              <div className="text-[12px] font-semibold">{member.name}</div>
            </div>
          </div>

          <div className="px-5 py-4">
            {activeTab === "profile" && (
              <div>
                <h3 className="border-b-2 border-[#e8954b] pb-2 text-[15px] font-bold text-[#2f80b5]">
                  Member Details
                </h3>
                <table className="mt-3 w-full border-collapse text-[13px]">
                  <tbody>
                    {detailRows.map((pairs, i) => (
                      <tr key={i} className="border-b border-[#eee] last:border-b-0">
                        <td className="w-[220px] px-4 py-2.5 font-semibold text-[#555]">{pairs[0][0]}</td>
                        <td className="px-4 py-2.5 text-[#222]" colSpan={pairs.length === 1 ? 3 : 1}>
                          {pairs[0][1]}
                        </td>
                        {pairs.length === 2 && (
                          <>
                            <td className="w-[260px] px-4 py-2.5 font-semibold text-[#555]">{pairs[1][0]}</td>
                            <td className="px-4 py-2.5 text-[#222]">{pairs[1][1]}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "missing" && (
              <div>
                <h3 className="border-b-2 border-[#e8954b] pb-2 text-[15px] font-bold text-[#2f80b5]">
                  Missing Details
                </h3>
                <p className="py-6 text-center text-[13px] text-[#888]">
                  No records found in this simulation.
                </p>
              </div>
            )}

            {activeTab === "kyc" && (
              <div>
                <h3 className="border-b-2 border-[#e8954b] pb-2 text-[15px] font-bold text-[#2f80b5]">
                  KYC Details
                </h3>
                <p className="py-6 text-center text-[13px] text-[#888]">
                  No records found in this simulation.
                </p>
              </div>
            )}

            {activeTab === "markExit" && <MarkExitForm member={member} onVerified={onVerified} />}
          </div>
        </div>
      )}

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
export default function EpfReg7Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState("");
  // Bumped when re-entering the Member Profile page so it loads a clean form
  const [pageKey, setPageKey] = useState(0);

  // Admin-configured values (per-insert ?simCfg override from the course
  // editor, or the slug config from the Simulation Manager) replace the
  // hardcoded company/member defaults when available.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const portal = useMemo(() => buildPortalData(simConfig), [simConfig]);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };

  const handleMemberItemClick = (item: string) => {
    setMemberMenuOpen(false);
    if (item === "MEMBER PROFILE") {
      setPageKey((k) => k + 1);
      setView("memberProfile");
    } else {
      showToast("Not available in this simulation.");
    }
  };

  // Success tick: fires when the student searches the target member's UAN and
  // saves the Mark Exit form with a reason and both EPF/EPS exit dates.
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
      onClick={() => memberMenuOpen && setMemberMenuOpen(false)}
    >
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {tick && <TickOverlay label={tick} />}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}

      <DashboardHeader
        companyName={portal.companyName}
        welcomeName={portal.welcomeName}
        estId={portal.estId}
        memberMenuOpen={memberMenuOpen}
        onToggleMemberMenu={() => setMemberMenuOpen((v) => !v)}
        onMemberItemClick={handleMemberItemClick}
        onNavClick={handleNavClick}
        onLogout={handleLogout}
      />

      {view === "dashboard" && <DashboardMain portal={portal} />}
      {view === "memberProfile" && (
        <MemberProfilePage
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
