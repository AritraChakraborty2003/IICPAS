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
  Bell,
  FileText,
  Info,
  ChevronDown,
  LogOut,
  Home as HomeIcon,
} from "lucide-react";

const LOGIN_USER = "APHYD1577313000";
const LOGIN_PASS = "Epfo@123";

const COMPANY_NAME = "APMC Marketing Services";
const COMPANY_LIN = "9778613527";
const COMPANY_PAN = "BGRPA6026U";
const COMPANY_ADDRESS =
  "#258/1, 1st Floor, Near, 31E, Bus Stop Rd, 2nd Block, Thyagaraja Nagar, Bengaluru, Karnataka 560028";

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

// ─── Full-screen success tick overlay (shown briefly after login) ──────────
function TickOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">
      <div
        className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
        style={{ animation: "epfTickPop 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">Login Successful!</p>
      <style jsx>{`
        @keyframes epfTickPop {
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

// ─── Dashboard header: company strip + nav bar ──────────────────────────────
function DashboardHeader({ user, onLogout }: { user: string; onLogout: () => void }) {
  const navItems = ["Member", "Establishment", "Payments", "Dashboards", "User", "Admin", "Online Services", "ABRY"];
  return (
    <header className="border-b border-[#ddd] bg-white">
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
            <div className="text-[16px] font-bold text-[#1a4f8b]">
              {COMPANY_NAME.toUpperCase()}, INDIA
            </div>
            <div className="text-[11px] font-bold tracking-wide text-[#555]">
              Ministry of Labour &amp; Employment, Simulation
            </div>
          </div>
        </div>

        <div className="text-center text-[12.5px] leading-[1.5]">
          <div className="text-[#e8954b]">
            Welcome: <span className="font-semibold">{user}</span>
          </div>
          <div className="font-semibold text-[#2f80b5]">{user}</div>
          <div className="font-semibold text-[#2f80b5]">{COMPANY_NAME}</div>
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
        <button className="flex items-center gap-1.5 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10">
          <HomeIcon size={14} /> Home
        </button>
        {navItems.map((item) => (
          <button
            key={item}
            className="flex items-center gap-1 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10 whitespace-nowrap"
          >
            {item} <ChevronDown size={12} />
          </button>
        ))}
      </nav>
    </header>
  );
}

// ─── Dashboard info panel: white bg, icon chip + blue title ────────────────
function InfoPanel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
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
            <li
              key={text}
              className={`flex gap-2 ${isNotification ? "font-semibold text-[#c0392b]" : "text-[#333]"}`}
            >
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
        <li className="flex items-center gap-2 text-[#333]">
          <FileText size={14} className="shrink-0 text-[#888]" />
          <span className="cursor-pointer hover:underline">ABRY Process Flow</span>
        </li>
      </ul>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 rounded border border-[#f0c7b0] bg-[#fdeee5] px-3 py-2.5 text-[13px]">
          <span className="rounded bg-[#d9534f] px-1.5 py-[1px] text-[10px] font-bold text-white">NEW!</span>
          <span>Do you wish to register at National Career Service (NCS) Portal ?</span>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="ncs" defaultChecked className="accent-[#2f80b5]" /> YES
          </label>
          <button className="rounded bg-[#2f80b5] px-3 py-1 text-[12px] font-semibold text-white hover:bg-[#256a96]">
            Register
          </button>
          <Info size={15} className="text-[#888]" />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded border border-[#f0c7b0] bg-[#fdeee5] px-3 py-2.5 text-[13px]">
          <span className="rounded bg-[#d9534f] px-1.5 py-[1px] text-[10px] font-bold text-white">NEW!</span>
          <span>
            Click <span className="cursor-pointer text-[#2f80b5] hover:underline">here</span> to view PMGKY
            Reimbursement Benefit Details.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded border border-[#bee3f8] bg-[#ebf8ff] px-3 py-2.5 text-[13px]">
          <span className="rounded bg-[#d9534f] px-1.5 py-[1px] text-[10px] font-bold text-white">NEW!</span>
          <span>
            Click <span className="cursor-pointer text-[#2f80b5] hover:underline">here</span> to view pendency
            statistics.
          </span>
        </div>

        <div className="rounded border border-[#bee3f8] bg-[#ebf8ff] px-3 py-2.5 text-[13px] text-[#1a4f8b]">
          <p className="font-bold">
            File Monthly ECR in respect of employees who have completed 58 years of age before first week of
            every month and submit their Pension/PF claim
          </p>
          <p className="mt-1">
            Employees&apos; attaining 58 years of age in the current Month{" "}
            <span className="cursor-pointer underline">PDF</span> |{" "}
            <span className="cursor-pointer underline">Excel</span>
          </p>
        </div>
      </div>
    </InfoPanel>
  );
}

// ─── Dashboard "What's New" panel ───────────────────────────────────────────
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

// ─── Employer Profile panel ─────────────────────────────────────────────────
function EmployerProfilePanel({ estId }: { estId: string }) {
  const rows: [string, React.ReactNode][] = [
    ["Est. Id", estId],
    ["LIN", COMPANY_LIN],
    ["PAN", COMPANY_PAN],
    ["PF", "Un-Exempted"],
    ["Pension", "Un-Exempted"],
    [
      "National Industrial Classification Code (NIC)",
      <span key="nic" className="cursor-pointer text-[#2f80b5] hover:underline">
        Update NIC2008 Code
      </span>,
    ],
    ["Address", COMPANY_ADDRESS],
    ["PF Office", "—"],
  ];
  return (
    <InfoPanel icon={<UserPlus2 size={15} />} title="Employer Profile">
      <div className="w-full overflow-hidden text-[12.5px]">
        <table className="w-full border-collapse border border-[#eee]">
          <tbody>
            <tr>
              <td
                colSpan={2}
                className="border border-[#eee] bg-white px-3 py-2 text-center text-[#333]"
              >
                {COMPANY_NAME}
              </td>
            </tr>
            {rows.map(([label, value], i) => (
              <tr key={label} className={i % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}>
                <td className="w-[45%] border border-[#eee] px-3 py-2 font-semibold text-[#555]">
                  {label}
                </td>
                <td className="border border-[#eee] px-3 py-2 text-left text-[#333]">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoPanel>
  );
}

// ─── Online Services panel ──────────────────────────────────────────────────
function OnlineServicesPanel() {
  return (
    <InfoPanel icon={<Info size={15} />} title="Online Services">
      <div className="w-full overflow-hidden text-[12.5px]">
        <table className="w-full border-collapse border border-[#eee]">
          <tbody>
            <tr className="bg-white">
              <td className="w-[60%] border border-[#eee] px-3 py-2 font-semibold text-[#555]">
                No. Of Pending Transfer Claims
              </td>
              <td className="border border-[#eee] px-3 py-2 text-center text-[#333]">
                -
              </td>
            </tr>
            <tr className="bg-[#f9f9f9]">
              <td className="w-[60%] border border-[#eee] px-3 py-2 font-semibold text-[#555]">
                Oldest Claim Pending Since
              </td>
              <td className="border border-[#eee] px-3 py-2 text-center text-[#333]">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </InfoPanel>
  );
}

// ─── Post-login employer Dashboard ──────────────────────────────────────────
function Dashboard({ user, onLogout }: { user: string; onLogout: () => void }) {
  return (
    <>
      <DashboardHeader user={user} onLogout={onLogout} />
      <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
        <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-5">
            <AlertsPanel />
            <DashboardWhatsNewPanel />
          </div>
          <div className="flex flex-col gap-5">
            <EmployerProfilePanel estId={user} />
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
        className="relative z-10 inline-flex min-h-[72px] w-[min(84vw,34rem)] items-center justify-center rounded-[22px] bg-[#1244b8] px-6 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(18,68,184,0.30)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0f3a9a] disabled:cursor-wait disabled:opacity-80 sm:min-h-[78px] sm:px-8 sm:text-xl"
      >
        {starting ? "LOADING..." : "START EXPERIMENT"}
      </button>
    </div>
  );
}

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg1Page() {
  const [launched, setLaunched] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [view, setView] = useState<"portal" | "dashboard">("portal");
  const [showTick, setShowTick] = useState(false);

  const handleLoginSuccess = (user: string) => {
    setLoggedInUser(user);
    setView("dashboard");
    setShowTick(true);
    setTimeout(() => setShowTick(false), 1400);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setView("portal");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {showTick && <TickOverlay />}

      {view === "dashboard" && loggedInUser ? (
        <Dashboard user={loggedInUser} onLogout={handleLogout} />
      ) : (
        <>
          <Header />
          <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
            <div className="grid gap-5 md:grid-cols-[2.4fr_1fr_1fr]">
              <G20Banner />
              <InstructionsPanel />
              <SignInPanel onSuccess={handleLoginSuccess} />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <WelcomeEmployersPanel />
              <ImportantLinksPanel />
              <WhatsNewPanel />
            </div>
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}
