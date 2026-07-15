"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  FileText,
  Info,
  LogOut,
  Home as HomeIcon,
  Download,
} from "lucide-react";
import { EpfoNavItem } from "../../components/EpfoNavMenus";
import {
  useSimulationConfig,
  findFieldValue,
  SimulationCredConfig,
} from "@/lib/useSimulationConfig";

const SIMULATION_SLUG = "epf-reg-11";
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

// Configured values may carry commas / currency symbols ("11,725")
const parseAmount = (v: string, fallback: number) => {
  const n = Number(v.replace(/[^0-9.-]/g, ""));
  return v && Number.isFinite(n) ? n : fallback;
};

const fmtAmount = (n: number) => n.toLocaleString("en-IN");

// Summary figures shown on the ECR Summary page. Every number can be
// overridden from the course editor / Simulation Manager by adding a
// credential field whose label matches the pattern (e.g. "Gross Wages",
// "EPF EE Share", "Total Contribution Remitted", "Admin Charges").
const getSummaryFigures = (config: SimulationCredConfig | null) => {
  const num = (pattern: RegExp, fallback: number) =>
    parseAmount(findFieldValue(config, pattern), fallback);
  return {
    grossWages: num(/^gross\s*wages/i, 0),
    epfWages: num(/^epf\s*wages/i, 0),
    epsWages: num(/^eps\s*wages/i, 0),
    edliWages: num(/^edli\s*wages/i, 0),
    ncpDays: num(/ncp/i, 0),
    uanCount: num(/uan/i, 0),
    epfEeShare: num(/ee\s*share/i, 0),
    epfErShare: num(/er\s*share/i, 0),
    epsContribution: num(/eps\s*contri/i, 0),
    edliContribution: num(/edli\s*contri/i, 0),
    refundOfAdvance: num(/refund/i, 0),
    totalRemitted: num(/total\s*contribution|remit/i, 11725),
    adminCharges: num(/admin/i, 500),
  };
};

type SummaryFigures = ReturnType<typeof getSummaryFigures>;

type UploadedEcr = {
  wageMonth: string; // "2026-01"
  salaryDate: string; // "2026-02-04"
  fileType: "ECR" | "Arrear";
  contrRate: string;
  remarks: string;
  uploadDate: string; // ISO
  trrn: string;
};

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

// ─── ECR Upload View (form + Draft / In-Process / Recent ECR sections) ─────
function EcrUploadView({
  step,
  setStep,
  uploadedEcr,
  onUploaded,
  onPrepareChallan,
}: {
  step: number;
  setStep: (s: number) => void;
  uploadedEcr: UploadedEcr | null;
  onUploaded: (ecr: UploadedEcr) => void;
  onPrepareChallan: () => void;
}) {
  const [wageMonth, setWageMonth] = useState("");
  const [salaryDate, setSalaryDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"ECR" | "Arrear">("ECR");
  const [contrRate, setContrRate] = useState("12");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inProcessRef = useRef<HTMLDivElement>(null);

  // Admin-configured values (per-insert override or Simulation Manager).
  // When set, the form only accepts the configured wage month / salary date.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const targetWageMonth = findFieldValue(simConfig, /wage|month/i);
  const targetSalaryDate = findFieldValue(simConfig, /salary|disburs/i);
  const validateCreds = simConfig ? simConfig.requireCredentialValidation : true;
  const normMonth = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  useEffect(() => {
    if (uploadedEcr) {
      inProcessRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [uploadedEcr]);

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
    onUploaded({
      wageMonth,
      salaryDate,
      fileType,
      contrRate,
      remarks: remarks.trim(),
      uploadDate: new Date().toISOString(),
      trrn: `24${String(Math.floor(10000000000 + Math.random() * 89999999999))}`,
    });
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

          {step >= 2 && (
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
                  <div className="flex flex-col items-start gap-2">
                    <button
                      onClick={upload}
                      disabled={!!uploadedEcr}
                      className="bg-[#5bc0de] text-white px-4 py-1.5 rounded border border-[#46b8da] font-medium hover:bg-[#31b0d5] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Upload
                    </button>
                    <button
                      onClick={cancel}
                      disabled={!!uploadedEcr}
                      className="bg-white text-[#333] px-4 py-1.5 rounded border border-[#ccc] hover:bg-[#ebebeb] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Draft / In-Process / Recent ECR sections appear after upload */}
        {uploadedEcr && (
          <div ref={inProcessRef}>
            <div className="mt-4 border-t border-[#ddd]">
              <div className="flex items-center gap-1 px-4 py-2.5 font-bold cursor-pointer hover:bg-[#f5f5f5]">
                <span className="text-[10px]">▶</span> Draft ECR's:
              </div>
            </div>

            <div className="border-t border-[#ddd]">
              <div className="flex items-center gap-1 px-4 py-2.5 font-bold cursor-pointer hover:bg-[#f5f5f5]">
                <span className="text-[10px]">▼</span> In-Process ECR's:
              </div>
              <div className="overflow-x-auto px-4 pb-5">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      {[
                        "S No.",
                        "Wage Month",
                        "ECR Type",
                        "Salary Disb. Date",
                        "Contr. Rate %",
                        "Upload Date",
                        "Status",
                        "Remarks",
                        "ECR File",
                        "ECR Statement",
                        "Error File",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="border border-[#ddd] bg-[#f9f9f9] px-2 py-2 text-left font-bold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[#ddd] px-2 py-2">1</td>
                      <td className="border border-[#ddd] px-2 py-2">
                        {uploadedEcr.wageMonth}
                      </td>
                      <td className="border border-[#ddd] px-2 py-2">
                        {uploadedEcr.fileType}
                      </td>
                      <td className="border border-[#ddd] px-2 py-2">
                        {uploadedEcr.salaryDate}
                      </td>
                      <td className="border border-[#ddd] px-2 py-2">
                        {uploadedEcr.contrRate}
                      </td>
                      <td className="border border-[#ddd] px-2 py-2">
                        {uploadedEcr.uploadDate}
                      </td>
                      <td className="border border-[#ddd] px-2 py-2">
                        Validated
                      </td>
                      <td className="border border-[#ddd] px-2 py-2">
                        {uploadedEcr.remarks}
                      </td>
                      <td className="border border-[#ddd] px-2 py-2 text-center">
                        <Download size={15} className="inline text-[#333]" />
                      </td>
                      <td className="border border-[#ddd] px-2 py-2 text-center">
                        <Download size={15} className="inline text-[#333]" />
                      </td>
                      <td className="border border-[#ddd] px-2 py-2">N/A</td>
                      <td className="border border-[#ddd] px-2 py-2">
                        <div className="flex flex-col items-start gap-1.5">
                          <button
                            onClick={onPrepareChallan}
                            className={`bg-[#5bc0de] text-white px-3 py-1 rounded border border-[#46b8da] font-medium hover:bg-[#31b0d5] whitespace-nowrap ${step === 3 ? "animate-pulse ring-2 ring-red-500" : ""}`}
                          >
                            Prepare Challan
                          </button>
                          <button className="bg-[#f0ad4e] text-white px-3 py-1 rounded border border-[#eea236] font-medium hover:bg-[#ec971f]">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-[#ddd]">
              <div className="flex items-center gap-1 px-4 py-2.5 font-bold cursor-pointer hover:bg-[#f5f5f5]">
                <span className="text-[10px]">▼</span> Recent ECR's:
              </div>
              <div className="overflow-x-auto px-4 pb-5">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      {[
                        "S No.",
                        "Wage Month",
                        "ECR Type",
                        "Salary Disb. Date",
                        "Contr. Rate %",
                        "Upload Date",
                        "Status",
                        "Remarks",
                        "ECR File",
                        "ECR Statement",
                      ].map((h) => (
                        <th
                          key={h}
                          className="border border-[#ddd] bg-[#f9f9f9] px-2 py-2 text-left font-bold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={10}
                        className="border border-[#ddd] px-2 py-3 text-center text-[#888]"
                      >
                        No records found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ECR Summary View (Prepare Challan → Generate Challan) ─────────────────
function EcrSummaryView({
  ecr,
  figures,
  onGenerate,
  onCancel,
}: {
  ecr: UploadedEcr;
  figures: SummaryFigures;
  onGenerate: () => void;
  onCancel: () => void;
}) {
  const [edliContribution, setEdliContribution] = useState("");
  const [epfInspection, setEpfInspection] = useState("");
  const [edliAdmin, setEdliAdmin] = useState("");
  const [edliInspection, setEdliInspection] = useState("");
  const [totalEmployees, setTotalEmployees] = useState("");
  const [excludedEmployees, setExcludedEmployees] = useState("");
  const [excludedGrossWages, setExcludedGrossWages] = useState("");
  const [error, setError] = useState("");

  const num = (v: string) => {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const netEdli = num(edliContribution);
  const netEpfAdmin = figures.adminCharges;
  const netEpfInspection = num(epfInspection);
  const netEdliAdmin = num(edliAdmin);
  const netEdliInspection = num(edliInspection);
  const totalRemittedCol =
    figures.epfEeShare + figures.epsContribution + netEdli;
  const totalNetPayable =
    netEdli + netEpfAdmin + netEpfInspection + netEdliAdmin + netEdliInspection;

  const generate = () => {
    if (
      !edliContribution.trim() ||
      !epfInspection.trim() ||
      !edliAdmin.trim() ||
      !edliInspection.trim() ||
      !totalEmployees.trim() ||
      !excludedEmployees.trim() ||
      !excludedGrossWages.trim()
    ) {
      setError("Please fill all required fields marked with *");
      return;
    }
    setError("");
    onGenerate();
  };

  const cellInput = (
    value: string,
    onChange: (v: string) => void
  ): React.ReactNode => (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      className="w-[130px] border border-[#ccc] rounded px-2 py-1 text-right bg-white text-[#333] outline-none focus:border-[#2f80b5] focus:ring-1 focus:ring-[#2f80b5]"
    />
  );

  const td = "border border-[#ddd] px-3 py-2";
  const tdRight = `${td} text-right`;

  return (
    <div className="mx-auto w-[98vw] flex-1 py-6">
      <div className="bg-white border border-[#ddd] shadow-sm text-[13px] text-[#333]">
        {/* Breadcrumbs */}
        <div className="px-4 py-2 border-b border-[#ddd] bg-[#f9f9f9] text-[#2f80b5]">
          Home / ECR Home Page / ECR Upload /{" "}
          <span className="text-[#333]">ECR Summary</span>
        </div>

        {/* Blue title bar */}
        <div className="mx-4 mt-4 bg-[#2f80b5] px-4 py-2 font-bold text-white">
          ▼ Summary of uploaded Electronic Challan cum Return (ECR):
        </div>

        {/* ECR Details */}
        <div className="mx-4 mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className={`${td} bg-[#e8f4f8] font-bold`}
                >
                  ECR Details:- (TRRN: {ecr.trrn})
                </td>
              </tr>
              <tr>
                <td className={`${td} w-[28%] font-bold`}>
                  Establishment Name
                </td>
                <td className={`${td} w-[28%]`}>{COMPANY_NAME}</td>
                <td className={`${td} w-[22%] font-bold`}>Establishment Id</td>
                <td className={td}>{LOGIN_USER}</td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>Wage Month</td>
                <td className={td}>{ecr.wageMonth}</td>
                <td className={`${td} font-bold`}>Return Month</td>
                <td className={td}>{ecr.wageMonth}</td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>CONTRIBUTION RATE (%)</td>
                <td className={td}>{ecr.contrRate}</td>
                <td className={`${td} font-bold`}>Exemption Status</td>
                <td className={td}>Unexempted</td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>Upload Date Time</td>
                <td className={td}>{ecr.uploadDate}</td>
                <td className={`${td} font-bold`}>Total Number of UAN's</td>
                <td className={td}>{fmtAmount(figures.uanCount)}</td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>ECR File Type</td>
                <td className={td} colSpan={3}>
                  {ecr.fileType}
                </td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>Remarks</td>
                <td className={td} colSpan={3}>
                  {ecr.remarks}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ECR Summary tables */}
        <div className="mx-4 mt-6">
          <h3 className="mb-3 text-[17px] font-semibold text-[#333]">
            ECR Summary
          </h3>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${td} bg-[#e8f4f8]`}></th>
                    <th className={`${td} bg-[#e8f4f8] text-right font-bold`}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["Gross Wages (₹)", figures.grossWages],
                      ["EPF Wages (₹)", figures.epfWages],
                      ["EPS Wages (₹)", figures.epsWages],
                      ["EDLI Wages (₹)", figures.edliWages],
                      ["NCP Days", figures.ncpDays],
                    ] as [string, number][]
                  ).map(([label, value]) => (
                    <tr key={label}>
                      <td className={`${td} font-bold`}>{label}</td>
                      <td className={tdRight}>{fmtAmount(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${td} bg-[#e8f4f8]`}></th>
                    <th className={`${td} bg-[#e8f4f8] text-right font-bold`}>
                      UAN Count
                    </th>
                    <th className={`${td} bg-[#e8f4f8] text-right font-bold`}>
                      Contribution Remitted (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["EPF EE Share", figures.epfEeShare],
                      ["EPF ER Share", figures.epfErShare],
                      ["EPS Contribution", figures.epsContribution],
                      ["EDLI Contribution", figures.edliContribution],
                    ] as [string, number][]
                  ).map(([label, value]) => (
                    <tr key={label}>
                      <td className={`${td} font-bold`}>{label}</td>
                      <td className={tdRight}>{fmtAmount(figures.uanCount)}</td>
                      <td className={tdRight}>{fmtAmount(value)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className={`${td} font-bold`}>
                      Total Refund of Advance
                    </td>
                    <td className={td}></td>
                    <td className={tdRight}>
                      {fmtAmount(figures.refundOfAdvance)}
                    </td>
                  </tr>
                  <tr>
                    <td className={`${td} font-bold`}>
                      Total Contribution Remitted
                    </td>
                    <td className={td}></td>
                    <td className={`${tdRight} font-bold`}>
                      {fmtAmount(figures.totalRemitted)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details table */}
        <div className="mx-4 mt-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  colSpan={2}
                  rowSpan={2}
                  className={`${td} bg-[#e8f4f8] text-left align-top font-bold`}
                >
                  Details:-
                </th>
                <th className={`${td} bg-[#e8f4f8] font-bold`}>
                  Remitted as per ECR
                </th>
                <th className={`${td} bg-[#e8f4f8] font-bold`}>
                  PMRPY/PMPRPY Benefit
                </th>
                <th className={`${td} bg-[#e8f4f8] font-bold`}>ABRY Benefit</th>
                <th className={`${td} bg-[#e8f4f8] font-bold`}>Net Payable</th>
              </tr>
              <tr>
                <th className={`${td} bg-[#e8f4f8] font-normal`}>(₹)</th>
                <th className={`${td} bg-[#e8f4f8] font-normal`}>(₹)</th>
                <th className={`${td} bg-[#e8f4f8] font-normal`}>(₹)</th>
                <th className={`${td} bg-[#e8f4f8] font-normal`}>(₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} className={`${td} font-bold`}>
                  Total EPF Contribution EE Share (A/C 1)
                </td>
                <td className={tdRight}>{fmtAmount(figures.epfEeShare)}</td>
                <td className={`${td} text-center`}>-</td>
                <td className={tdRight}>0</td>
                <td className={tdRight}>0</td>
              </tr>
              <tr>
                <td colSpan={2} className={`${td} font-bold`}>
                  Total EPS Contribution (A/C 10)
                </td>
                <td className={tdRight}>
                  {fmtAmount(figures.epsContribution)}
                </td>
                <td className={tdRight}>0</td>
                <td className={tdRight}>0</td>
                <td className={tdRight}>0</td>
              </tr>
              <tr>
                <td colSpan={2} className={`${td} font-bold`}>
                  Total Difference Between EPF &amp; EPS (ER Share A/C 1)
                </td>
                <td className={tdRight}>0</td>
                <td className={tdRight}>0</td>
                <td className={tdRight}>0</td>
                <td className={tdRight}>0</td>
              </tr>
              <tr>
                <td colSpan={2} className={`${td} font-bold`}>
                  Total EDLI Contribution (ER Share A/C 21){" "}
                  <span className="text-red-500">*</span>
                </td>
                <td className={tdRight}>
                  {cellInput(edliContribution, setEdliContribution)}
                </td>
                <td className={`${td} text-center`}>-</td>
                <td className={`${td} text-center`}>-</td>
                <td className={tdRight}>{fmtAmount(netEdli)}</td>
              </tr>
              <tr>
                <td rowSpan={2} className={`${td} font-bold`}>
                  Total EPF Charges (A/C 2)
                </td>
                <td className={`${td} font-bold`}>
                  Administration <span className="text-red-500">*</span>
                </td>
                <td className={tdRight}>0</td>
                <td className={`${td} text-center`}>-</td>
                <td className={`${td} text-center`}>-</td>
                <td className={tdRight}>{fmtAmount(netEpfAdmin)}</td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>
                  Inspection <span className="text-red-500">*</span>
                </td>
                <td className={tdRight}>
                  {cellInput(epfInspection, setEpfInspection)}
                </td>
                <td className={`${td} text-center`}>-</td>
                <td className={`${td} text-center`}>-</td>
                <td className={tdRight}>{fmtAmount(netEpfInspection)}</td>
              </tr>
              <tr>
                <td rowSpan={2} className={`${td} font-bold`}>
                  Total EDLI Charges (A/C 22)
                </td>
                <td className={`${td} font-bold`}>
                  Administration <span className="text-red-500">*</span>
                </td>
                <td className={tdRight}>{cellInput(edliAdmin, setEdliAdmin)}</td>
                <td className={`${td} text-center`}>-</td>
                <td className={`${td} text-center`}>-</td>
                <td className={tdRight}>{fmtAmount(netEdliAdmin)}</td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>
                  Inspection <span className="text-red-500">*</span>
                </td>
                <td className={tdRight}>
                  {cellInput(edliInspection, setEdliInspection)}
                </td>
                <td className={`${td} text-center`}>-</td>
                <td className={`${td} text-center`}>-</td>
                <td className={tdRight}>{fmtAmount(netEdliInspection)}</td>
              </tr>
              <tr>
                <td colSpan={2} className={`${td} font-bold`}>
                  Total Refund of Advance (A/C 1)
                </td>
                <td className={tdRight}>
                  {fmtAmount(figures.refundOfAdvance)}
                </td>
                <td className={`${td} text-center`}>-</td>
                <td className={`${td} text-center`}>-</td>
                <td className={tdRight}>0</td>
              </tr>
              <tr className="bg-[#dff0d8]">
                <td colSpan={2} className={`${td} font-bold`}>
                  Total
                </td>
                <td className={`${tdRight} font-bold`}>
                  {fmtAmount(totalRemittedCol)}
                </td>
                <td className={`${tdRight} font-bold`}>0</td>
                <td className={`${tdRight} font-bold`}>0</td>
                <td className={`${tdRight} font-bold`}>
                  {fmtAmount(totalNetPayable)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Employer Details */}
        <div className="mx-4 mt-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td colSpan={2} className={`${td} bg-[#e8f4f8] font-bold`}>
                  Employer Details :-
                </td>
              </tr>
              <tr>
                <td className={`${td} w-[60%] font-bold`}>
                  Total number of Employees in the month{" "}
                  <span className="text-red-500">*</span>
                </td>
                <td className={tdRight}>
                  {cellInput(totalEmployees, setTotalEmployees)}
                </td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>
                  Number of excluded employees{" "}
                  <span className="text-red-500">*</span>
                </td>
                <td className={tdRight}>
                  {cellInput(excludedEmployees, setExcludedEmployees)}
                </td>
              </tr>
              <tr>
                <td className={`${td} font-bold`}>
                  Gross wages of the Excluded Employees (₹){" "}
                  <span className="text-red-500">*</span>
                </td>
                <td className={tdRight}>
                  {cellInput(excludedGrossWages, setExcludedGrossWages)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && (
          <p className="mt-4 text-center text-[12.5px] text-[#e53e3e]">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="my-6 flex items-center justify-center gap-3">
          <button
            onClick={generate}
            className="bg-[#1a4f8b] text-white px-4 py-1.5 rounded border border-[#164271] font-medium hover:bg-[#164271]"
          >
            Generate Challan
          </button>
          <button
            onClick={onCancel}
            className="bg-white text-[#333] px-4 py-1.5 rounded border border-[#ccc] hover:bg-[#ebebeb]"
          >
            Cancel
          </button>
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
      <p className="text-[18px] font-bold text-white">
        Challan Generated — Experiment Complete!
      </p>
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
export default function EpfReg11Page() {
  const [launched, setLaunched] = useState(false);
  const [step, setStep] = useState(1);
  const [view, setView] = useState<"upload" | "summary">("upload");
  const [uploadedEcr, setUploadedEcr] = useState<UploadedEcr | null>(null);
  const [showTick, setShowTick] = useState(false);

  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const figures = getSummaryFigures(simConfig);

  const handleUploaded = (ecr: UploadedEcr) => {
    setUploadedEcr(ecr);
    setStep(3);
  };

  const openSummary = () => {
    setView("summary");
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToUpload = () => {
    setView("upload");
    setStep(3);
  };

  const handleLogout = () => {
    // optional logout logic
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {showTick && <TickOverlay />}

      <DashboardHeader user={LOGIN_USER} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col">
        {view === "upload" || !uploadedEcr ? (
          <EcrUploadView
            step={step}
            setStep={setStep}
            uploadedEcr={uploadedEcr}
            onUploaded={handleUploaded}
            onPrepareChallan={openSummary}
          />
        ) : (
          <EcrSummaryView
            ecr={uploadedEcr}
            figures={figures}
            onGenerate={() => setShowTick(true)}
            onCancel={backToUpload}
          />
        )}
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
