"use client";

import React, { useRef, useState } from "react";
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
  LogOut,
  Home as HomeIcon,
  Calendar,
} from "lucide-react";
import { EpfoNavItem } from "../../components/EpfoNavMenus";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";

const SIMULATION_SLUG = "epf-reg-10";
const LOGIN_USER = "APHYD1577313000";
const COMPANY_NAME = "IICPA PRIVATE LIMITED";

// "2021-08" (month input) -> "August 2021"
const fmtMonth = (v: string) => {
  if (!v) return "";
  const date = new Date(`${v}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return v;
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const digitsOnly = (v: string) => v.replace(/\D/g, "");

// ─── Top simulation disclaimer ─────────────────────────────────────────────
function SimBanner() {
  return (
    <div className="sticky top-0 z-50 bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
      This is a Simulation. Use For Educational Purposes ONLY.
    </div>
  );
}

// ─── Dashboard header: company strip + nav bar ──────────────────────────────
function DashboardHeader({
  user,
  onLogout,
}: {
  user: string;
  onLogout: () => void;
}) {
  const [openNavMenu, setOpenNavMenu] = useState<string | null>(null);
  const navItems = [
    "Establishment",
    "Payments",
    "Dashboards",
    "User",
    "Admin",
    "Online Services",
    "ABRY",
  ];
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
              IICPA PRIVATE LIMITED, INDIA
            </div>
            <div className="text-[11px] font-bold tracking-wide text-[#c0392b]">
              MINISTRY OF LABOUR &amp; EMPLOYMENT, SIMULATION
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
            <span className="rounded bg-[#1a4f8b] px-1 text-[10px] font-bold text-white">
              A-
            </span>
            <span className="rounded bg-[#1a4f8b] px-1 text-[10px] font-bold text-white">
              A
            </span>
            <span className="rounded bg-[#1a4f8b] px-1 text-[10px] font-bold text-white">
              A+
            </span>
            <span className="text-[#888]">
              employerfeedback[at]epfindia[dot]gov[dot]in
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-end gap-1 text-[#2f80b5] hover:underline"
          >
            <LogOut size={13} /> Logout
          </button>
          <div className="mt-1 text-[#888]">Mon 09 Aug 2021 (PV 3.3.30)</div>
        </div>
      </div>

      <nav className="flex flex-wrap items-stretch bg-[#1a4f8b] text-white">
        <button className="flex items-center gap-1.5 border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10">
          <HomeIcon size={14} /> Home
        </button>
        {["Member", ...navItems].map((item) => (
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

// ─── ECR Upload View ──────────────────────────────────────────
function EcrUploadView({
  step,
  setStep,
  onComplete,
}: {
  step: number;
  setStep: (s: number) => void;
  onComplete: () => void;
}) {
  const [wageMonth, setWageMonth] = useState("");
  const [salaryDate, setSalaryDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"ECR" | "Arrear">("ECR");
  const [contrRate, setContrRate] = useState("12");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin-configured values (per-insert override or Simulation Manager).
  // When set, the form only accepts the configured wage month / salary date.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const targetWageMonth = findFieldValue(simConfig, /wage|month/i);
  const targetSalaryDate = findFieldValue(simConfig, /salary|disburs/i);
  const validateCreds = simConfig ? simConfig.requireCredentialValidation : true;
  const normMonth = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const upload = () => {
    if (!wageMonth || !salaryDate || !fileName || !remarks.trim()) {
      setError("Please fill all required fields marked with *");
      return;
    }
    if (
      validateCreds &&
      targetWageMonth &&
      normMonth(wageMonth) !== normMonth(targetWageMonth) &&
      normMonth(fmtMonth(wageMonth)) !== normMonth(targetWageMonth)
    ) {
      setError(
        `Wage Month does not match — for this simulation use ${targetWageMonth}`
      );
      return;
    }
    if (
      validateCreds &&
      targetSalaryDate &&
      digitsOnly(salaryDate) !== digitsOnly(targetSalaryDate) &&
      digitsOnly(salaryDate.split("-").reverse().join("/")) !==
        digitsOnly(targetSalaryDate)
    ) {
      setError(
        `Salary Disbursal Date does not match — for this simulation use ${targetSalaryDate}`
      );
      return;
    }
    setError("");
    onComplete();
  };

  const cancel = () => {
    setWageMonth("");
    setSalaryDate("");
    setFileName("");
    setFileType("ECR");
    setContrRate("12");
    setRemarks("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto w-[98vw] flex-1 py-6">
      <div className="bg-white border border-[#ddd] shadow-sm text-[13px] text-[#333]">
        {/* Breadcrumbs */}
        <div className="px-4 py-2 border-b border-[#ddd] bg-[#f9f9f9] text-[#2f80b5]">
          Home / ECR Home Page / Actionable ECR Challans /{" "}
          <span className="text-[#333]">ECR Upload</span>
        </div>

        {/* Download ECR File section */}
        <div className="border-b border-[#ddd]">
          <div className="flex items-center gap-1 px-4 py-2.5 font-bold cursor-pointer hover:bg-[#f5f5f5]">
            <span className="text-[10px]">▼</span> Download ECR File:
          </div>
        </div>

        {/* ECR File Upload section */}
        <div>
          <div
            className={`flex items-center gap-1 px-4 py-2.5 font-bold cursor-pointer hover:bg-[#f5f5f5] ${step === 1 ? "animate-pulse ring-2 ring-inset ring-red-500 z-10 text-[#c0392b]" : ""}`}
            onClick={() => step === 1 && setStep(2)}
          >
            <span className="text-[10px]">{step === 1 ? "▶" : "▼"}</span> ECR
            File Upload:
          </div>

          {step === 2 && (
            <div className="p-6 bg-white border-t border-[#ddd]">
              {/* Important Note Box */}
              <div className="bg-[#e8f4f8] border border-[#bce8f1] rounded p-4 mb-6 text-[#31708f]">
                <div className="flex gap-2 font-bold mb-2">
                  <Info size={16} className="mt-0.5" /> IMPORTANT NOTE:
                </div>
                <ol className="list-decimal pl-8 space-y-1.5">
                  <li>
                    Click here to download{" "}
                    <span className="inline-flex items-center gap-1 bg-[#5bc0de] text-white px-2 py-0.5 rounded text-[11px]">
                      <FileText size={12} /> ECR Help File
                    </span>
                  </li>
                  <li>
                    Please only use alphabets and numbers in file names. Remove
                    special characters and spaces from the file name.
                  </li>
                  <li>
                    Max Size of File Upload is 2 Mb. If text file size exceeds 2
                    Mb, please compress it using winzip etc. Smaller files can
                    also be uploaded in zip format.
                  </li>
                  <li>
                    Do not upload any other files like jpg, gif, doc, xls, ppt
                    etc bundled inside the zip.
                  </li>
                  <li>
                    Only text file or zip file containing only one text file can
                    be uploaded (file extension should be in small case).
                  </li>
                  <li>
                    For bigger ECR files, the system may take some more
                    processing time. After uploading the file, kindly revisit
                    the page after some time.
                  </li>
                  <li className="font-bold">
                    Gross Wages are mandatory in ECR.
                  </li>
                  <li className="font-bold uppercase text-[#005580] leading-relaxed">
                    "EMPLOYERS REGISTERED UNDER PMRPY ARE ADVISED TO ENSURE
                    FILING THEIR ECR BY 15TH OF THE MONTH FOLLOWING THE WAGE
                    MONTH TO AVAIL INCENTIVES UNDER THE SCHEME."
                  </li>
                </ol>
              </div>

              {/* Form */}
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                  <div className="text-right font-bold">
                    Wage Month <span className="text-red-500">*</span>
                  </div>
                  <div>
                    <input
                      type="month"
                      value={wageMonth}
                      onChange={(e) => setWageMonth(e.target.value)}
                      className="border border-[#ccc] rounded px-3 py-1.5 w-[180px] bg-white text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                  <div className="text-right font-bold">
                    Salary Disbursal Date{" "}
                    <span className="text-red-500">*</span>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={salaryDate}
                      onChange={(e) => setSalaryDate(e.target.value)}
                      className="border border-[#ccc] rounded px-3 py-1.5 w-[180px] bg-white text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                  <div className="text-right font-bold">
                    Select File <span className="text-red-500">*</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.zip,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) =>
                        setFileName(e.target.files?.[0]?.name || "")
                      }
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-[#ccc] bg-[#f8f8f8] px-3 py-1 rounded text-[#333] hover:bg-[#ebebeb]"
                    >
                      Choose file
                    </button>
                    <span className={fileName ? "text-[#333]" : "text-[#888]"}>
                      {fileName || "No file chosen"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                  <div className="text-right font-bold">
                    File Type <span className="text-red-500">*</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="fileType"
                        checked={fileType === "ECR"}
                        onChange={() => setFileType("ECR")}
                        className="accent-[#333]"
                      />{" "}
                      ECR
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="fileType"
                        checked={fileType === "Arrear"}
                        onChange={() => setFileType("Arrear")}
                        className="accent-[#333]"
                      />{" "}
                      Arrear
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                  <div className="text-right font-bold">
                    Contribution Rate % <span className="text-red-500">*</span>
                  </div>
                  <div>
                    <select
                      value={contrRate}
                      onChange={(e) => setContrRate(e.target.value)}
                      className="border border-[#ccc] rounded px-3 py-1.5 w-[140px] bg-white outline-none"
                    >
                      <option>12</option>
                      <option>10</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                  <div className="text-right font-bold">
                    Remarks <span className="text-red-500">*</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter Remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="border border-[#ccc] rounded px-3 py-1.5 w-[250px] bg-white text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                    <div></div>
                    <p className="text-[12.5px] text-[#e53e3e]">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-[180px_1fr] items-center gap-4 pt-2">
                  <div></div>
                  <div className="flex gap-2">
                    <button
                      onClick={upload}
                      className="bg-[#5bc0de] text-white px-4 py-1.5 rounded border border-[#46b8da] font-medium hover:bg-[#31b0d5]"
                    >
                      Upload
                    </button>
                    <button
                      onClick={cancel}
                      className="bg-white text-[#333] px-4 py-1.5 rounded border border-[#ccc] hover:bg-[#ebebeb]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
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
        className="relative z-10 inline-flex min-h-[72px] w-[min(84vw,34rem)] items-center justify-center rounded-[22px] bg-[#1244b8] px-6 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(18,68,184,0.30)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0f3a9a] disabled:cursor-wait disabled:opacity-80 sm:min-h-[78px] sm:px-8 sm:text-xl"
      >
        {starting ? "LOADING..." : "START EXPERIMENT"}
      </button>
    </div>
  );
}

// ─── Full-screen success tick overlay ──────────
function TickOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">
      <div
        className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
        style={{ animation: "epfTickPop 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">Experiment Complete!</p>
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

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg10Page() {
  const [launched, setLaunched] = useState(false);
  const [step, setStep] = useState(1);
  const [showTick, setShowTick] = useState(false);

  const completeExperiment = () => {
    setShowTick(true);
  };

  const handleLogout = () => {
    // optional logout logic
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {showTick && <TickOverlay />}

      {/* When running this specific experiment we go straight into the ECR Upload view */}
      <DashboardHeader user={LOGIN_USER} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col">
        <EcrUploadView
          step={step}
          setStep={setStep}
          onComplete={completeExperiment}
        />
      </main>

      <footer className="mt-auto bg-[#1a3a66] py-4 text-center text-[12px] leading-relaxed text-[#dde6f0]">
        <p>
          Designed, Developed and Hosted by: Employees&apos; Provident Fund
          Organisation, India
        </p>
        <p>Last Updated Mon 09 Aug 2021 (PV 3.3.30)</p>
      </footer>
    </div>
  );
}
