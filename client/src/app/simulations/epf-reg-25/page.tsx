"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle, RotateCcw, Download, ChevronRight, Upload } from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

// Employer's Code Number comes from the admin Simulation Manager (or the
// course editor's per-insert "Add/Edit Creds") for slug "epf-reg-25" —
// matched by field label: Code (or LIN/User). If nothing is configured, the
// default below (matching the standard "Upload ESI Contribution" experiment,
// continuing on from epf-reg-18/22/23/24) is used. The employee roster and
// contribution figures are fixed demo data — there is no list-type
// credential field to source them from. The instructional banner only
// appears if an admin sets bannerText.
const SIMULATION_SLUG = "epf-reg-25";
const DEFAULT_CODE = "63000728280002700";
const DEFAULT_ESTABLISHMENT = "Aprilia EV Motors LLP";
const REGION_CODE = "BN - Bangalore";
const CONTRIBUTION_MONTH = "Nov";
const CONTRIBUTION_YEAR = "20XX";

type ContribRow = {
  type: "Existing" | "Left" | "New";
  name: string;
  insuranceNo: string;
  workingDays: number;
  yearlyCTC: number;
  monthlyGross: number;
  basic: number;
  hra: number;
  other: number;
  esiEmployee: number;
  esiEmployer: number;
};

const CONTRIBUTIONS: ContribRow[] = [
  { type: "Existing", name: "Aarav Sharma", insuranceNo: "6304234211", workingDays: 30, yearlyCTC: 240000, monthlyGross: 20000, basic: 8000, hra: 3200, other: 8800, esiEmployee: 150, esiEmployer: 650 },
  { type: "Left", name: "Ananya Gupta", insuranceNo: "545168350", workingDays: 30, yearlyCTC: 108000, monthlyGross: 9000, basic: 3600, hra: 1440, other: 3960, esiEmployee: 68, esiEmployer: 293 },
  { type: "Existing", name: "Rohit Chatterjee", insuranceNo: "6730423113", workingDays: 30, yearlyCTC: 234000, monthlyGross: 19500, basic: 7800, hra: 3120, other: 8580, esiEmployee: 146, esiEmployer: 634 },
  { type: "New", name: "Lohith Yadav", insuranceNo: "5347437544", workingDays: 30, yearlyCTC: 240000, monthlyGross: 20000, basic: 8000, hra: 3200, other: 8800, esiEmployee: 150, esiEmployer: 650 },
  { type: "New", name: "Rahul Kedia", insuranceNo: "8752566013", workingDays: 30, yearlyCTC: 73800, monthlyGross: 6150, basic: 2460, hra: 984, other: 2706, esiEmployee: 46, esiEmployer: 200 },
];

const fmt = (n: number) => n.toLocaleString("en-IN");

const TOTALS = CONTRIBUTIONS.reduce(
  (acc, r) => ({
    yearlyCTC: acc.yearlyCTC + r.yearlyCTC,
    monthlyGross: acc.monthlyGross + r.monthlyGross,
    basic: acc.basic + r.basic,
    hra: acc.hra + r.hra,
    other: acc.other + r.other,
    esiEmployee: acc.esiEmployee + r.esiEmployee,
    esiEmployer: acc.esiEmployer + r.esiEmployer,
  }),
  { yearlyCTC: 0, monthlyGross: 0, basic: 0, hra: 0, other: 0, esiEmployee: 0, esiEmployer: 0 }
);

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

const REASON_OPTIONS = ["Leave", "Absent", "Resigned", "On Notice", "Other"];

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

// ─── Instructional banner (admin Simulation Manager bannerText only) ──────
function InstructionBanner({ bannerText }: { bannerText: string }) {
  if (!bannerText) return null;
  return (
    <div className="mx-auto w-full max-w-[1300px] px-6 pt-6">
      <div className="rounded-[8px] border border-[#bee3da] bg-[#e3f4f1] px-5 py-4 text-[13.5px] leading-relaxed text-[#0b3d3a] whitespace-pre-line">
        {bannerText}
      </div>
    </div>
  );
}

// ─── Reference contribution table + downloadable template ─────────────────
function ContributionSummary({ onDownloadTemplate }: { onDownloadTemplate: () => void }) {
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={onDownloadTemplate}
        className="mb-4 flex items-center gap-2 rounded bg-[#1a56db] px-4 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#1745ad]"
      >
        <Download size={16} /> Click here to download the template of ESI contribution details
      </button>

      <div className="overflow-x-auto rounded-[6px] border border-[#e0ddc8]">
        <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#0b2e57] text-left text-white">
              <th className="border border-[#ddd] px-3 py-2 font-semibold">Type</th>
              <th className="border border-[#ddd] px-3 py-2 font-semibold">Employee Name (IP Name)</th>
              <th className="border border-[#ddd] px-3 py-2 font-semibold">Insurance Number (IP Number)</th>
              <th className="border border-[#ddd] px-3 py-2 font-semibold">Working Days</th>
              <th className="border border-[#ddd] px-3 py-2 font-semibold">Yearly CTC</th>
              <th className="border border-[#ddd] px-3 py-2 font-semibold">Monthly Gross</th>
              <th className="border border-[#ddd] px-3 py-2 font-semibold">Basic</th>
              <th className="border border-[#ddd] px-3 py-2 font-semibold">HRA</th>
              <th className="border border-[#ddd] px-3 py-2 font-semibold">Other Allowances</th>
              <th className="border border-[#ddd] bg-[#c9781a] px-3 py-2 font-semibold" colSpan={2}>
                ESI Contribution
              </th>
            </tr>
            <tr className="bg-[#12386b] text-left text-white">
              <th className="border border-[#ddd] px-3 py-1" colSpan={9} />
              <th className="border border-[#ddd] px-3 py-1 font-semibold">Employee</th>
              <th className="border border-[#ddd] px-3 py-1 font-semibold">Employer</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {CONTRIBUTIONS.map((r) => (
              <tr key={r.insuranceNo}>
                <td className="border border-[#e0ddc8] px-3 py-2">{r.type}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{r.name}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{r.insuranceNo}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{r.workingDays}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{fmt(r.yearlyCTC)}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{fmt(r.monthlyGross)}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{fmt(r.basic)}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{fmt(r.hra)}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{fmt(r.other)}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{r.esiEmployee}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{r.esiEmployer}</td>
              </tr>
            ))}
            <tr className="bg-[#f5f2e2] font-bold">
              <td className="border border-[#e0ddc8] px-3 py-2" colSpan={4}>
                Total
              </td>
              <td className="border border-[#e0ddc8] px-3 py-2">{fmt(TOTALS.yearlyCTC)}</td>
              <td className="border border-[#e0ddc8] px-3 py-2">{fmt(TOTALS.monthlyGross)}</td>
              <td className="border border-[#e0ddc8] px-3 py-2">{fmt(TOTALS.basic)}</td>
              <td className="border border-[#e0ddc8] px-3 py-2">{fmt(TOTALS.hra)}</td>
              <td className="border border-[#e0ddc8] px-3 py-2">{fmt(TOTALS.other)}</td>
              <td className="border border-[#e0ddc8] px-3 py-2">{TOTALS.esiEmployee}</td>
              <td className="border border-[#e0ddc8] px-3 py-2">{TOTALS.esiEmployer}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[12.5px] italic text-[#333]">
        * Employee Ananya Gupta has left the organization w.e.f 15th November {CONTRIBUTION_YEAR}
      </p>
      <p className="text-[12.5px] italic text-[#333]">
        * New Employee Lohith Yadav &amp; Rahul Kedia joined
      </p>
    </div>
  );
}

// ─── Employer dashboard: three-column menu, "File Monthly Contributions" actionable
function DashboardMenu({ code, onFileContributions }: { code: string; onFileContributions: () => void }) {
  const columns: { title: string; items: string[] }[] = [
    { title: "EMPLOYER", items: EMPLOYER_LINKS },
    { title: "EMPLOYEE", items: EMPLOYEE_LINKS },
    { title: "MONTHLY CONTRIBUTION", items: CONTRIBUTION_LINKS },
  ];
  return (
    <div className="rounded-[8px] border border-[#e0ddc8] bg-[#fdfaf0]">
      <div className="border-b border-[#e0ddc8] bg-[#d9d2ae] px-5 py-2 text-[12px] font-semibold text-[#4a4630]">
        User Login: {code}
      </div>
      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
        {columns.map((col) => (
          <div key={col.title}>
            <div className="mb-3 text-[12px] font-bold tracking-wide text-[#a08968]">{col.title}</div>
            <ul className="space-y-2.5">
              {col.items.map((item) =>
                item === "File Monthly Contributions" ? (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={onFileContributions}
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

// ─── Step: Contribution details upload form (month/type/code/excel) ───────
function ContributionUploadForm({
  code,
  onSubmit,
  onClose,
}: {
  code: string;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const [fileName, setFileName] = useState("");
  return (
    <div className="mt-5 overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="flex items-center justify-between border-b border-[#e0ddc8] bg-[#d9d2ae] px-4 py-2 text-[12px] font-semibold text-[#4a4630]">
        <span>Employer &gt; Monthly Contribution</span>
      </div>
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Monthly Contribution
      </div>
      <div className="space-y-3 bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <label className="flex items-center gap-3">
          <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Contribution Details for:*</span>
          <select disabled className="h-[32px] w-[90px] rounded border border-[#c0c0c0] bg-white px-2">
            <option>{CONTRIBUTION_MONTH}</option>
          </select>
          <select disabled className="h-[32px] w-[90px] rounded border border-[#c0c0c0] bg-white px-2">
            <option>{CONTRIBUTION_YEAR}</option>
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Contribution Details Type:*</span>
          <select disabled className="h-[32px] w-[220px] rounded border border-[#c0c0c0] bg-white px-2">
            <option>MonthlyContribution</option>
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Employer&apos;s Code No.:*</span>
          <input readOnly value={code} className="h-[32px] w-[220px] rounded border border-[#c0c0c0] bg-[#f4f4f4] px-2 font-mono" />
        </label>
        <label className="flex items-center gap-3">
          <span className="w-[220px] shrink-0 font-semibold text-[#7a1f1a]">Upload Your Data Using Excel file:*</span>
          <label className="flex cursor-pointer items-center gap-1.5 text-[#1a56db] underline">
            <Upload size={13} />
            Upload Excel
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />
          </label>
          <span className="text-[#1a56db] underline">Sample MC excel template</span>
          {fileName && <span className="text-[#555]">({fileName})</span>}
        </label>
      </div>
      <div className="flex justify-center gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          onClick={onSubmit}
          className="rounded border border-[#7a1f1a] bg-[#c0392b] px-5 py-1.5 text-[13px] font-bold text-white hover:bg-[#a93226]"
        >
          Submit
        </button>
        <button type="button" className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]">
          Reset
        </button>
        <button type="button" onClick={onClose} className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]">
          Cancel
        </button>
        <button type="button" onClick={onClose} className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]">
          Close
        </button>
      </div>
      <div className="border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-2 text-center text-[11.5px] font-semibold text-[#c0392b]">
        REVISED EXEMPTION OF CONTRIBUTION FOR AVERAGE DAILY WAGES OF RS. 176 OR LESS HAS BEEN MADE EFFECTIVE FROM 1ST SEPTEMBER, 2019.
      </div>
    </div>
  );
}

type WageRow = { daysPaid: string; totalWages: string; ipContribution: string; reason: string; lastWorkingDay: string };

// ─── Step: per-employee wage entry table (Save reveals Payment History) ───
function WageEntryTable({
  code,
  rows,
  onChange,
  onSave,
  onCancel,
}: {
  code: string;
  rows: WageRow[];
  onChange: (i: number, field: keyof WageRow, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const now = useMemo(
    () =>
      new Date().toLocaleString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "GMT",
        timeZoneName: "short",
      }),
    []
  );
  return (
    <div className="mt-5 overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0ddc8] bg-[#d9d2ae] px-4 py-2 text-[12px] font-semibold text-[#4a4630]">
        <span>User Login: {code}</span>
        <span>{now}</span>
      </div>
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-1.5 text-[12px] font-semibold text-[#7a1f1a]">
        Employer &gt; Monthly Contribution
      </div>
      <div className="border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Monthly Contribution Details
      </div>
      <div className="grid grid-cols-1 gap-x-6 border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3 text-[12.5px] text-[#333] sm:grid-cols-2">
        <div>
          <span className="font-semibold text-[#7a1f1a]">Employer&apos;s Name:</span> {DEFAULT_ESTABLISHMENT}
        </div>
        <div>
          <span className="font-semibold text-[#7a1f1a]">Contribution Period:</span> {CONTRIBUTION_MONTH}-{CONTRIBUTION_YEAR}
        </div>
        <div>
          <span className="font-semibold text-[#7a1f1a]">Employer&apos;s Code No.:</span> {code}
        </div>
        <div>
          <span className="font-semibold text-[#7a1f1a]">Region Code:</span> {REGION_CODE}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#fdfaf0] text-left text-[#7a1f1a]">
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Sl.No.</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Insurance Number</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Insured Person</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">No. of Days for Which Wages Paid/Payable*</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Total Monthly Wages*</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">IP Contribution</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Reason For Zero Working Days*</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Last Working Day</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {CONTRIBUTIONS.map((emp, i) => (
              <tr key={emp.insuranceNo}>
                <td className="border border-[#e0ddc8] px-2 py-1.5">{i + 1}</td>
                <td className="border border-[#e0ddc8] px-2 py-1.5">{emp.insuranceNo}</td>
                <td className="border border-[#e0ddc8] px-2 py-1.5">{emp.name}</td>
                <td className="border border-[#e0ddc8] px-2 py-1.5">
                  <input
                    value={rows[i].daysPaid}
                    onChange={(e) => onChange(i, "daysPaid", e.target.value)}
                    className="h-[26px] w-[60px] rounded border border-[#c0c0c0] px-1 text-right"
                  />
                </td>
                <td className="border border-[#e0ddc8] px-2 py-1.5">
                  <input
                    value={rows[i].totalWages}
                    onChange={(e) => onChange(i, "totalWages", e.target.value)}
                    className="h-[26px] w-[80px] rounded border border-[#c0c0c0] px-1 text-right"
                  />
                </td>
                <td className="border border-[#e0ddc8] px-2 py-1.5">
                  <input
                    value={rows[i].ipContribution}
                    onChange={(e) => onChange(i, "ipContribution", e.target.value)}
                    className="h-[26px] w-[70px] rounded border border-[#c0c0c0] px-1 text-right"
                  />
                </td>
                <td className="border border-[#e0ddc8] px-2 py-1.5">
                  <select
                    value={rows[i].reason}
                    onChange={(e) => onChange(i, "reason", e.target.value)}
                    className="h-[26px] w-[110px] rounded border border-[#c0c0c0] px-1"
                  >
                    <option value="">Select</option>
                    {REASON_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border border-[#e0ddc8] px-2 py-1.5">
                  <input
                    type="date"
                    value={rows[i].lastWorkingDay}
                    onChange={(e) => onChange(i, "lastWorkingDay", e.target.value)}
                    className="h-[26px] w-[130px] rounded border border-[#c0c0c0] px-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-2 text-[11.5px] text-[#0b3d3a]">
        NB: Please enter ip details in all pages for filing(submitting) MC data
      </div>
      <div className="flex gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          onClick={onSave}
          className="rounded border border-[#7a1f1a] bg-[#c0392b] px-5 py-1.5 text-[13px] font-bold text-white hover:bg-[#a93226]"
        >
          Save
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

// ─── Payment History summary panel, shown after Save ───────────────────────
function PaymentHistoryPanel({
  rows,
  verified,
  onToggleVerified,
  onSubmit,
}: {
  rows: WageRow[];
  verified: boolean;
  onToggleVerified: (v: boolean) => void;
  onSubmit: () => void;
}) {
  const totalIP = rows.reduce((s, r) => s + (Number(r.ipContribution) || 0), 0);
  const totalEmployer = Math.round(totalIP * 4.33);
  const totalWages = rows.reduce((s, r) => s + (Number(r.totalWages) || 0), 0);
  const grandTotal = totalIP + totalEmployer;

  return (
    <div className="mt-4 w-full max-w-[360px] overflow-hidden rounded-[6px] border border-[#7a1f1a]">
      <div className="bg-[#7a1f1a] px-3 py-1.5 text-[13px] font-bold text-white">Payment History</div>
      <div className="divide-y divide-[#e0ddc8] bg-[#fdfaf0] text-[12.5px] text-[#333]">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span>Total IP Contribution(Rs.)</span>
          <span className="font-semibold">{totalIP}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span>Total Employer Contribution(Rs.)</span>
          <span className="font-semibold">{totalEmployer}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span>Grand Total( Employee &amp; Employer Contribution)(Rs.)</span>
          <span className="font-semibold">{grandTotal}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span>Total Central Government Contribution(Rs.)</span>
          <span className="font-semibold">0</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span>Total Wages(Rs.)</span>
          <span className="font-semibold">{totalWages}</span>
        </div>
        <div className="px-3 py-1.5 font-semibold text-[#1a56db]">
          Contribution once submitted cannot be altered or deleted
        </div>
        <label className="flex items-center gap-2 px-3 py-2">
          <input type="checkbox" checked={verified} onChange={(e) => onToggleVerified(e.target.checked)} />
          Data Verified
        </label>
      </div>
      <div className="flex gap-2 border-t border-[#e0ddc8] bg-[#fdfaf0] px-3 py-2">
        <button
          type="button"
          disabled={!verified}
          onClick={onSubmit}
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-4 py-1 text-[12.5px] font-bold text-[#555] hover:bg-[#e5dfc8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
        </button>
        <button type="button" className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-4 py-1 text-[12.5px] font-bold text-[#555] hover:bg-[#e5dfc8]">
          Close
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
          style={{ animation: "epfReg25TickPop 0.15s ease-out" }}
        >
          <CheckCircle size={48} className="text-white" />
        </div>
        <p className="text-center text-[15px] font-semibold text-[#0b2e57]">
          ESI Contribution Submitted Successfully
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] hover:bg-[#c90f15]"
        >
          <RotateCcw size={15} /> Retry
        </button>
      </div>
      <style jsx>{`
        @keyframes epfReg25TickPop {
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

const EMPTY_WAGE_ROW: WageRow = { daysPaid: "0", totalWages: "0", ipContribution: "0", reason: "", lastWorkingDay: "" };

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg25Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<"summary" | "form" | "wageEntry">("summary");
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [verified, setVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rows, setRows] = useState<WageRow[]>(CONTRIBUTIONS.map(() => ({ ...EMPTY_WAGE_ROW })));

  // Admin-configured Employer's Code Number (Simulation Manager slug
  // "epf-reg-25", or the course editor's per-insert "Add/Edit Creds") drives
  // the contribution form — falling back to the standard demo code when
  // nothing is configured.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const code = findFieldValue(simConfig, /code|lin|user/i) || DEFAULT_CODE;
  const bannerText = simConfig?.bannerText || "";
  const notifyGroupComplete = useSimGroupComplete();

  const handleDownloadTemplate = () => {
    const header = "Type,Employee Name,Insurance Number,Working Days,Yearly CTC,Monthly Gross,Basic,HRA,Other Allowances,ESI Employee,ESI Employer\n";
    const body = CONTRIBUTIONS.map(
      (r) => `${r.type},${r.name},${r.insuranceNo},${r.workingDays},${r.yearlyCTC},${r.monthlyGross},${r.basic},${r.hra},${r.other},${r.esiEmployee},${r.esiEmployer}`
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ESI_Contribution_Template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleRowChange = (i: number, field: keyof WageRow, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const handleFinalSubmit = () => {
    setSubmitted(true);
    notifyGroupComplete();
  };

  const handleRetry = () => {
    setSubmitted(false);
    setShowPaymentHistory(false);
    setVerified(false);
    setView("summary");
    setRows(CONTRIBUTIONS.map(() => ({ ...EMPTY_WAGE_ROW })));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {submitted && <SuccessOverlay onRetry={handleRetry} />}

      <TopStrip />
      <Header />
      <InstructionBanner bannerText={bannerText} />

      <main className="mx-auto w-full max-w-[1300px] flex-1 px-6 py-8">
        <ContributionSummary onDownloadTemplate={handleDownloadTemplate} />

        {view === "summary" && (
          <DashboardMenu code={code} onFileContributions={() => setView("form")} />
        )}

        {view === "form" && (
          <ContributionUploadForm code={code} onSubmit={() => setView("wageEntry")} onClose={() => setView("summary")} />
        )}

        {view === "wageEntry" && (
          <>
            <WageEntryTable
              code={code}
              rows={rows}
              onChange={handleRowChange}
              onSave={() => setShowPaymentHistory(true)}
              onCancel={() => setView("summary")}
            />
            {showPaymentHistory && (
              <PaymentHistoryPanel
                rows={rows}
                verified={verified}
                onToggleVerified={setVerified}
                onSubmit={handleFinalSubmit}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
