"use client";

import React, { useRef, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  LogOut,
  Home as HomeIcon,
  Bell,
  FileText,
  AlertCircle,
  Minus,
  X,
  Download,
} from "lucide-react";
import { EpfoNavItem } from "../../components/EpfoNavMenus";

const COMPANY_NAME = "IICPA PRIVATE LIMITED";
const EST_ID = "APHYD1577313000";
const EMPLOYER_PROFILE_NAME = "IICPA PRIVATE LIMITED";

const NAV_ITEMS = ["Member", "Establishment", "Dashboards", "User", "Admin", "Online Services", "ABRY"];
const PAYMENTS_MENU_ITEMS = ["ECR UPLOAD", "PAID CHALLAN LIST", "TRRN STATUS", "VIEW/PRINT CHALLAN", "GENERATE CHALLAN"];

type View = "dashboard" | "ecrUpload";
type EcrStatus = "In Process" | "Approved";
type EcrRecord = {
  sNo: number;
  wageMonth: string;
  ecrType: string;
  salaryDisbDate: string;
  contrRate: string;
  uploadDate: string;
  status: EcrStatus;
  remarks: string;
};

const fmtMonth = (v: string) => {
  if (!v) return "";
  const [y, m] = v.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};
const fmtDate = (v: string) => {
  if (!v) return "";
  const d = new Date(v);
  return d.toLocaleDateString("en-GB");
};
const todayStr = () => new Date().toLocaleDateString("en-GB");

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
        style={{ animation: "epfTickPop9 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">{label}</p>
      <style jsx>{`
        @keyframes epfTickPop9 {
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

// ─── Dashboard header: company strip + nav bar with Payments dropdown ──────
function DashboardHeader({
  paymentsOpen,
  onTogglePayments,
  onPaymentsItemClick,
  onNavClick,
  onLogout,
}: {
  paymentsOpen: boolean;
  onTogglePayments: () => void;
  onPaymentsItemClick: (item: string) => void;
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
          <div className="font-semibold text-[#2f80b5]">{EMPLOYER_PROFILE_NAME}</div>
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
          <div className="mt-1 text-[#888]">Wed 18 Aug (PV 3.3.32)</div>
        </div>
      </div>

      <nav className="flex flex-wrap items-stretch bg-[#1a4f8b] text-white">
        <button
          onClick={() => onNavClick("Home")}
          className="flex items-center gap-1.5 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10"
        >
          <HomeIcon size={14} /> Home
        </button>

        {NAV_ITEMS.slice(0, 2).map((item) => (
          <EpfoNavItem
            key={item}
            label={item}
            open={openNavMenu === item}
            onToggle={setOpenNavMenu}
          />
        ))}

        <div className="relative">
          <button
            onClick={onTogglePayments}
            className={`flex items-center gap-1 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10 ${
              paymentsOpen ? "bg-white/10" : ""
            }`}
          >
            Payments <ChevronDown size={12} />
          </button>

          {paymentsOpen && (
            <div className="absolute left-0 top-full z-40 w-[240px] rounded-b border border-t-0 border-[#ccc] bg-white py-1 text-left shadow-lg">
              {PAYMENTS_MENU_ITEMS.map((item) => {
                const isTarget = item === "ECR UPLOAD";
                return (
                  <button
                    key={item}
                    onClick={() => onPaymentsItemClick(item)}
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

        {NAV_ITEMS.slice(2).map((item) => (
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

// ─── Employer Home dashboard ─────────────────────────────────────────────────
function Dashboard({
  paymentsOpen,
  onTogglePayments,
  onPaymentsItemClick,
  onNavClick,
  onLogout,
}: {
  paymentsOpen: boolean;
  onTogglePayments: () => void;
  onPaymentsItemClick: (item: string) => void;
  onNavClick: (item: string) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <DashboardHeader
        paymentsOpen={paymentsOpen}
        onTogglePayments={onTogglePayments}
        onPaymentsItemClick={onPaymentsItemClick}
        onNavClick={onNavClick}
        onLogout={onLogout}
      />
      <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
        <InfoPanel icon={<Bell size={15} />} title="Alerts and To Do Tasks">
          <ul className="space-y-2.5 text-[13.5px] text-[#333]">
            <li className="flex gap-2 font-semibold text-[#c0392b]">
              <Bell size={14} className="mt-0.5 shrink-0" />
              <span>Kind attention Employers. Now Aadhaar is mandatory for filing ECR.</span>
            </li>
            <li className="flex gap-2">
              <FileText size={14} className="mt-0.5 shrink-0 text-[#888]" />
              <span className="cursor-pointer text-[#2f80b5] hover:underline">
                Open Payments &rarr; ECR Upload to file this month&apos;s Electronic Challan cum Return.
              </span>
            </li>
          </ul>
        </InfoPanel>
      </main>
      <footer className="mt-auto bg-[#1a3a66] py-4 text-center text-[12px] leading-relaxed text-[#dde6f0]">
        <p>Designed, Developed and Hosted by: Employees&apos; Provident Fund Organisation, India</p>
        <p>Wed 18 Aug (PV 3.3.32)</p>
      </footer>
    </>
  );
}

// ─── Reusable collapsible section ──────────────────────────────────────────
function Collapsible({
  title,
  defaultOpen,
  highlight,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const borderColor = highlight && open ? "border-[#f0a8a8]" : "border-[#d8d8d8]";
  
  return (
    <div className={`rounded border bg-white ${borderColor}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 border-b px-5 py-3 text-left bg-[#fcfcfc] hover:bg-[#f5f5f5] ${borderColor}`}
      >
        {open ? (
          <ChevronUp size={14} className="text-[#555]" />
        ) : (
          <ChevronDown size={14} className="text-[#555]" />
        )}
        <span className="text-[13.5px] font-bold text-[#333]">{title}</span>
      </button>
      {open && <div className="px-6 py-5">{children}</div>}
    </div>
  );
}

function EcrTable({ rows, withActions }: { rows: EcrRecord[]; withActions?: boolean }) {
  const cols = withActions
    ? ["S No.", "Wage Month", "ECR Type", "Salary Disb. Date", "Contr. Rate %", "Upload Date", "Status", "Remarks", "ECR File", "ECR Statement", "Error File", "Action"]
    : ["S No.", "Wage Month", "ECR Type", "Salary Disb. Date", "Contr. Rate %", "Upload Date", "Status", "Remarks", "ECR File", "ECR Statement"];

  if (rows.length === 0) {
    return <p className="text-[13px] text-[#888]">No records found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-[#eee]">
      <table className="w-full min-w-[900px] text-[12.5px]">
        <thead className="bg-[#f7f7f7] text-[#555]">
          <tr>
            {cols.map((c) => (
              <th key={c} className="whitespace-nowrap border-b border-[#eee] px-3 py-2 text-left font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sNo}>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{r.sNo}</td>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{r.wageMonth}</td>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{r.ecrType}</td>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{r.salaryDisbDate}</td>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{r.contrRate}</td>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{r.uploadDate}</td>
              <td
                className={`border-b border-[#f2f2f2] px-3 py-2 font-semibold ${
                  r.status === "Approved" ? "text-[#1a7a3a]" : "text-[#e8954b]"
                }`}
              >
                {r.status}
              </td>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#333]">{r.remarks}</td>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#2f80b5]">
                <span className="cursor-pointer hover:underline">Download</span>
              </td>
              <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#2f80b5]">
                <span className="cursor-pointer hover:underline">View</span>
              </td>
              {withActions && (
                <>
                  <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#ccc]">—</td>
                  <td className="border-b border-[#f2f2f2] px-3 py-2 text-[#ccc]">—</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ECR Upload page ────────────────────────────────────────────────────────
function EcrUploadPage({
  onHome,
  onDownloaded,
  onUploaded,
  inProcess,
  recent,
}: {
  onHome: () => void;
  onDownloaded: () => void;
  onUploaded: (rec: EcrRecord) => void;
  inProcess: EcrRecord[];
  recent: EcrRecord[];
}) {
  const [dlWageMonth, setDlWageMonth] = useState("");
  const [dlFileType, setDlFileType] = useState("ECR");
  const [dlError, setDlError] = useState("");

  const [upWageMonth, setUpWageMonth] = useState("");
  const [upSalaryDate, setUpSalaryDate] = useState("");
  const [upFileName, setUpFileName] = useState("");
  const [upFileType, setUpFileType] = useState<"ECR" | "Arrear" | "">("");
  const [upContrRate, setUpContrRate] = useState("12");
  const [upRemarks, setUpRemarks] = useState("");
  const [upError, setUpError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tick, setTick] = useState("");

  const resetDownload = () => {
    setDlWageMonth("");
    setDlFileType("ECR");
    setDlError("");
  };

  const download = () => {
    if (!dlWageMonth) {
      setDlError("Please select Wage Month");
      return;
    }
    setDlError("");

    const blob = new Blob(
      [
        `ECR File Experiment\nWage Month: ${fmtMonth(dlWageMonth)}\nFile Type: ${dlFileType}\nEstablishment: ${EST_ID}\n`,
      ],
      { type: "application/vnd.ms-excel" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ECR File_Experiment.xls";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setTick("Downloaded!");
    setTimeout(() => setTick(""), 1400);
    onDownloaded();
  };

  const upload = () => {
    if (!upWageMonth || !upSalaryDate || !upFileName || !upFileType || !upRemarks.trim()) {
      setUpError("Please fill all required fields marked with *");
      return;
    }
    setUpError("");
    const rec: EcrRecord = {
      sNo: inProcess.length + recent.length + 1,
      wageMonth: fmtMonth(upWageMonth),
      ecrType: upFileType,
      salaryDisbDate: fmtDate(upSalaryDate),
      contrRate: upContrRate,
      uploadDate: todayStr(),
      status: "In Process",
      remarks: upRemarks.trim(),
    };
    onUploaded(rec);
    setTick("ECR Uploaded!");
    setTimeout(() => setTick(""), 1400);

    setUpWageMonth("");
    setUpSalaryDate("");
    setUpFileName("");
    setUpFileType("");
    setUpContrRate("12");
    setUpRemarks("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelUpload = () => {
    setUpWageMonth("");
    setUpSalaryDate("");
    setUpFileName("");
    setUpFileType("");
    setUpContrRate("12");
    setUpRemarks("");
    setUpError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-4 py-6">
      {tick && <TickOverlay label={tick} />}

      <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#555]">
        <span className="cursor-pointer text-[#2f80b5] hover:underline" onClick={onHome}>
          Home
        </span>
        <span>/</span>
        <span className="text-[#555]">ECR Home Page</span>
        <span>/</span>
        <span className="cursor-pointer font-semibold text-[#2f80b5] underline">Actionable ECR Challans</span>
        <span>/</span>
        <span className="font-semibold text-[#333]">ECR Upload</span>
      </div>

      <Collapsible title="Download ECR File:" defaultOpen highlight>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">Wage Month</label>
            <input
              type="month"
              value={dlWageMonth}
              onChange={(e) => setDlWageMonth(e.target.value)}
              className="h-[38px] w-[220px] rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">File Type</label>
            <select
              value={dlFileType}
              onChange={(e) => setDlFileType(e.target.value)}
              className="h-[38px] w-[220px] rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
            >
              {["ECR", "Arrear"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <button
            onClick={download}
            className="flex h-[38px] items-center gap-1.5 rounded bg-[#2f80b5] px-5 text-[13px] font-semibold text-white hover:bg-[#256a96]"
          >
            <Download size={14} /> ECR File Download
          </button>
          <button
            onClick={resetDownload}
            className="flex h-[38px] items-center gap-1.5 rounded bg-[#2f80b5] px-4 text-[13px] font-semibold text-white/90 hover:bg-[#256a96]"
          >
            Reset
          </button>
        </div>
        {dlError && <p className="mt-2 text-[12px] text-[#e53e3e]">{dlError}</p>}
      </Collapsible>

      <Collapsible title="ECR File Upload:" defaultOpen={false}>
        <div className="mb-5 rounded border border-[#bcdff2] bg-[#eaf6fd] px-4 py-3 text-[12.5px] leading-relaxed text-[#1a4f8b]">
          <p className="mb-2 flex items-center gap-1.5 font-semibold">
            <AlertCircle size={14} /> IMPORTANT NOTE:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Click here to download{" "}
              <span className="ml-1 inline-flex items-center gap-1 rounded bg-[#bcdff2] px-2 py-0.5 text-[11.5px] font-semibold text-[#1a4f8b]">
                <FileText size={11} /> ECR Help File
              </span>
            </li>
            <li>Please only use alphabets and numbers in file names. Remove special characters and spaces from the file name.</li>
            <li>Max Size of File Upload is 2 Mb. If text file size exceeds 2 Mb, please compress it using winzip etc. Smaller files can also be uploaded in zip format.</li>
            <li>Do not upload any other files like jpg, gif, doc, xls, ppt etc bundled inside the zip.</li>
            <li>Only text file or zip file containing only one text file can be uploaded (file extension should be in small case).</li>
            <li>For bigger ECR files, the system may take some more processing time. After uploading the file, kindly revisit the page after some time.</li>
            <li className="font-bold">Gross Wages are mandatory in ECR.</li>
            <li className="font-bold">
              &quot;EMPLOYERS REGISTERED UNDER PMRPY ARE ADVISED TO ENSURE FILING THEIR ECR BY 15TH OF THE MONTH FOLLOWING THE WAGE MONTH TO AVAIL INCENTIVES UNDER THE SCHEME.&quot;
            </li>
          </ol>
        </div>

        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">
              Wage Month <span className="text-[#e53e3e]">*</span>
            </label>
            <input
              type="month"
              value={upWageMonth}
              onChange={(e) => setUpWageMonth(e.target.value)}
              className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">
              Salary Disbursal Date <span className="text-[#e53e3e]">*</span>
            </label>
            <input
              type="date"
              value={upSalaryDate}
              onChange={(e) => setUpSalaryDate(e.target.value)}
              className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">
              Select File <span className="text-[#e53e3e]">*</span>
            </label>
            <div className="flex h-[38px] items-center gap-3 rounded border border-[#c0c0c0] bg-white px-2">
              <label className="flex h-[28px] shrink-0 cursor-pointer items-center rounded border border-[#bbb] bg-[#f0f0f0] px-3 text-[12.5px] font-semibold text-[#333] hover:bg-[#e6e6e6]">
                Choose file
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setUpFileName(e.target.files?.[0]?.name ?? "")}
                />
              </label>
              <span className="truncate text-[12.5px] text-[#666]">{upFileName || "No file chosen"}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">
              File Type <span className="text-[#e53e3e]">*</span>
            </label>
            <div className="flex h-[38px] items-center gap-6">
              {(["ECR", "Arrear"] as const).map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-[13.5px] text-[#333]">
                  <input
                    type="radio"
                    checked={upFileType === t}
                    onChange={() => setUpFileType(t)}
                    className="accent-[#2f80b5]"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">
              Contribution Rate % <span className="text-[#e53e3e]">*</span>
            </label>
            <select
              value={upContrRate}
              onChange={(e) => setUpContrRate(e.target.value)}
              className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
            >
              {["12", "10"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#333]">
              Remarks <span className="text-[#e53e3e]">*</span>
            </label>
            <input
              value={upRemarks}
              onChange={(e) => setUpRemarks(e.target.value)}
              placeholder="Enter Remarks"
              className="h-[38px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[13.5px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
            />
          </div>
        </div>

        {upError && <p className="mt-3 text-[12px] text-[#e53e3e]">{upError}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={upload}
            className="rounded border border-[#c0c0c0] bg-[#f0f0f0] px-6 py-2 text-[13px] font-semibold text-[#333] hover:bg-[#e6e6e6]"
          >
            Upload
          </button>
          <button
            onClick={cancelUpload}
            className="rounded border border-[#c0c0c0] bg-[#f0f0f0] px-6 py-2 text-[13px] font-semibold text-[#333] hover:bg-[#e6e6e6]"
          >
            Cancel
          </button>
        </div>
      </Collapsible>

      <Collapsible title="Draft ECR's:" defaultOpen={false}>
        <p className="text-[13px] text-[#888]">No records found.</p>
      </Collapsible>

      <Collapsible title="In-Process ECR's:" defaultOpen>
        <EcrTable rows={inProcess} withActions />
      </Collapsible>

      <Collapsible title="Recent ECR's:" defaultOpen>
        <EcrTable rows={recent} />
      </Collapsible>
    </main>
  );
}

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg9Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [inProcess, setInProcess] = useState<EcrRecord[]>([]);
  const [recent, setRecent] = useState<EcrRecord[]>([]);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };

  const handlePaymentsItemClick = (item: string) => {
    setPaymentsOpen(false);
    if (item === "ECR UPLOAD") {
      setView("ecrUpload");
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

  const handleUploaded = (rec: EcrRecord) => {
    setInProcess((prev) => [...prev, rec]);
    setTimeout(() => {
      setInProcess((prev) => prev.filter((r) => r.sNo !== rec.sNo));
      setRecent((prev) => [...prev, { ...rec, status: "Approved" }]);
    }, 4000);
  };

  const handleLogout = () => {
    setView("dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]" onClick={() => paymentsOpen && setPaymentsOpen(false)}>
      <div className="fixed bottom-0 right-0 top-[41px] w-[5px] bg-[#16c60c] z-[100]"></div>
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}

      {view === "dashboard" && (
        <Dashboard
          paymentsOpen={paymentsOpen}
          onTogglePayments={() => setPaymentsOpen((v) => !v)}
          onPaymentsItemClick={handlePaymentsItemClick}
          onNavClick={handleNavClick}
          onLogout={handleLogout}
        />
      )}

      {view === "ecrUpload" && (
        <>
          <DashboardHeader
            paymentsOpen={paymentsOpen}
            onTogglePayments={() => setPaymentsOpen((v) => !v)}
            onPaymentsItemClick={handlePaymentsItemClick}
            onNavClick={handleNavClick}
            onLogout={handleLogout}
          />
          <EcrUploadPage
            onHome={() => setView("dashboard")}
            onDownloaded={() => {}}
            onUploaded={handleUploaded}
            inProcess={inProcess}
            recent={recent}
          />
          <footer className="mt-auto bg-[#1a3a66] py-4 text-center text-[12px] leading-relaxed text-[#dde6f0]">
            <p>Designed, Developed and Hosted by: Employees&apos; Provident Fund Organisation, India</p>
          </footer>
        </>
      )}
    </div>
  );
}
