"use client";

import React, { useState } from "react";
import { CheckCircle, RotateCcw, ChevronRight } from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";
import {
  DEFAULT_CODE,
  DEFAULT_ESTABLISHMENT,
  EMPLOYEES,
  SimBanner,
  TopStrip,
  Header,
  Footer,
} from "./_shared";

// Employer's Code Number and Establishment name come from the admin
// Simulation Manager (or the course editor's per-insert "Add/Edit Creds")
// for slug "epf-reg-23" — matched by field label: Code (or LIN/User) /
// Establishment (or Firm/Name). If nothing is configured, the values below
// (matching the standard "e-Pehchan Card" experiment, continuing on from
// epf-reg-18/epf-reg-22) are used as defaults. The employee roster itself
// is fixed demo data — there is no list-type credential field to source it
// from. The instructional banner only appears if an admin sets bannerText.
const SIMULATION_SLUG = "epf-reg-23";

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

// ─── Step 1: search panel to look up registered employees ─────────────────
function SearchPanel({ code, onView }: { code: string; onView: () => void }) {
  return (
    <div className="overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        View/Generate Counterfoils for Registered Employees
      </div>
      <div className="border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-2 text-[12.5px] font-bold text-[#7a1f1a]">
        Search By
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333] sm:grid-cols-2">
        <label className="flex items-center gap-3">
          <span className="w-[150px] shrink-0 font-semibold text-[#7a1f1a]">Employer Unit Type :</span>
          <select
            disabled
            className="h-[34px] flex-1 rounded border border-[#c0c0c0] bg-white px-2 text-[#555]"
          >
            <option>Main Unit</option>
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className="w-[150px] shrink-0 font-semibold text-[#7a1f1a]">Employer&apos;s Code No. :</span>
          <input
            readOnly
            value={code}
            className="h-[34px] flex-1 rounded border border-[#c0c0c0] bg-[#f4f4f4] px-2 font-mono"
          />
        </label>
        <label className="flex items-center gap-3">
          <span className="w-[150px] shrink-0 font-semibold text-[#7a1f1a]">Employee&apos;s Insurance No. :</span>
          <input
            placeholder="Optional"
            className="h-[34px] flex-1 rounded border border-[#c0c0c0] bg-white px-2 outline-none focus:border-[#1a6fa8]"
          />
        </label>
        <label className="flex items-center gap-3">
          <span className="w-[150px] shrink-0 font-semibold text-[#7a1f1a]">Employer&apos;s Name :</span>
          <input
            readOnly
            value={DEFAULT_ESTABLISHMENT}
            className="h-[34px] flex-1 rounded border border-[#c0c0c0] bg-[#f4f4f4] px-2"
          />
        </label>
        <label className="flex items-center gap-3 sm:col-span-2">
          <span className="w-[150px] shrink-0 font-semibold text-[#7a1f1a]">Employee&apos;s Name :</span>
          <input
            placeholder="Optional"
            className="h-[34px] flex-1 rounded border border-[#c0c0c0] bg-white px-2 outline-none focus:border-[#1a6fa8]"
          />
        </label>
      </div>
      <div className="flex justify-center gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          onClick={onView}
          className="rounded border border-[#7a1f1a] bg-[#c0392b] px-5 py-1.5 text-[13px] font-bold text-white hover:bg-[#a93226]"
        >
          View
        </button>
        <button
          type="button"
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
          Reset
        </button>
        <button
          type="button"
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: registered employee results, one "View Counter Foil" per row ─
function ResultsTable({
  code,
  onViewCounterfoil,
}: {
  code: string;
  onViewCounterfoil: (index: number) => void;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Registered Employee Details
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#fdfaf0] text-left text-[#7a1f1a]">
              <th className="border border-[#e0ddc8] px-3 py-2 font-semibold">Employer&apos;s Code No.</th>
              <th className="border border-[#e0ddc8] px-3 py-2 font-semibold">Employer&apos;s Name</th>
              <th className="border border-[#e0ddc8] px-3 py-2 font-semibold">I.P No.</th>
              <th className="border border-[#e0ddc8] px-3 py-2 font-semibold">I.P Name</th>
              <th className="border border-[#e0ddc8] px-3 py-2 font-semibold">Gender</th>
              <th className="border border-[#e0ddc8] px-3 py-2 font-semibold">Date of Registration</th>
              <th className="border border-[#e0ddc8] px-3 py-2 font-semibold">View Counterfoil</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {EMPLOYEES.map((emp, i) => (
              <tr key={emp.insuranceNo}>
                <td className="border border-[#e0ddc8] px-3 py-2">{code}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{DEFAULT_ESTABLISHMENT}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{emp.insuranceNo}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{emp.name}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{emp.gender}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{emp.dateOfRegistration}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onViewCounterfoil(i)}
                    className="flex items-center gap-1 font-bold text-[#1a56db] underline hover:text-[#1a6fa8]"
                  >
                    View Counter Foil <ChevronRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-2.5 text-[12.5px]">
        <div className="flex items-center gap-2">
          <button className="rounded border border-[#c0c0c0] bg-white px-3 py-1 text-[#555]" disabled>
            Previous
          </button>
          <button className="rounded border border-[#c0c0c0] bg-white px-3 py-1 text-[#555]" disabled>
            Next
          </button>
        </div>
        <span className="text-[#555]">Total No. of Records: {EMPLOYEES.length}</span>
      </div>
    </div>
  );
}

// ─── Step 3: e-Pehchan Card counterfoil for the selected employee ─────────
function CounterfoilCard({
  employee,
  code,
  onDownload,
}: {
  employee: Employee;
  code: string;
  onDownload: () => void;
}) {
  const fieldRow = (label: string, value: string) => (
    <div className="border-b border-[#e0ddc8] px-3 py-1.5">
      <span className="font-semibold text-[#7a1f1a]">{label}:</span> <span>{value}</span>
    </div>
  );
  return (
    <div className="mt-5 overflow-hidden rounded-[6px] border border-[#e0ddc8] bg-white">
      <div className="border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-2 text-center">
        <div className="text-[15px] font-bold text-[#0b2e57]">EMPLOYEES&apos; STATE INSURANCE CORPORATION</div>
        <div className="text-[13.5px] font-bold text-[#333]">e-Pehchan Card</div>
      </div>

      <div className="border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3 text-center text-[13px] text-[#333]">
        <div>
          <span className="font-semibold">Insured Person :</span> {employee.name}
        </div>
        <div>
          <span className="font-semibold">Insurance No. :</span> {employee.insuranceNo}
        </div>
        <div>
          <span className="font-semibold">Date of Registration :</span> {employee.dateOfRegistration}
        </div>
      </div>

      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-1.5 text-center text-[12.5px] font-bold text-[#7a1f1a]">
        YOUR REGISTRATION DETAILS
      </div>
      <div className="grid grid-cols-1 text-[12.5px] text-[#333] sm:grid-cols-2">
        {fieldRow("Employee Name", employee.name)}
        {fieldRow("Date of Birth", employee.dob)}
        {fieldRow("Marital Status", employee.maritalStatus)}
        {fieldRow("Gender", employee.gender)}
        {fieldRow("Present Address", employee.address)}
        {fieldRow("Dispensary / IMP for IP", employee.dispensary)}
        {fieldRow("Employer's Code No.", code)}
        {fieldRow("Name of Employer", DEFAULT_ESTABLISHMENT)}
        {fieldRow("Address of Employer", EMPLOYER_ADDRESS)}
        {fieldRow("Mobile No.", employee.mobile)}
      </div>

      <div className="border-y border-[#e0ddc8] bg-[#f5f2e2] px-4 py-1.5 text-center text-[12.5px] font-bold text-[#7a1f1a]">
        Family Details
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#fdfaf0] text-left text-[#7a1f1a]">
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Name</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Relationship</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Date of Birth</th>
              <th className="border border-[#e0ddc8] px-2 py-1.5 font-semibold">Residing with IP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#e0ddc8] px-2 py-1.5 text-[#999]">-</td>
              <td className="border border-[#e0ddc8] px-2 py-1.5 text-[#999]">-</td>
              <td className="border border-[#e0ddc8] px-2 py-1.5 text-[#999]">-</td>
              <td className="border border-[#e0ddc8] px-2 py-1.5 text-[#999]">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-2 text-[11.5px] text-[#555]">
        Documents Uploaded: none
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[12px] font-semibold text-[#7a1f1a]">
            Signature / LTI of Registered Employee / IP
          </div>
          <div className="h-[60px] rounded border border-[#c0c0c0] bg-white" />
        </div>
        <div>
          <div className="mb-1 text-[12px] font-semibold text-[#7a1f1a]">
            Affix Family Photograph Here (Attested and Stamped by Employer / ESIC Official)
          </div>
          <div className="h-[60px] rounded border border-[#c0c0c0] bg-white" />
        </div>
      </div>

      <div className="border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3 text-[11.5px] leading-relaxed text-[#555]">
        <div className="font-semibold text-[#7a1f1a]">NOTE:</div>
        <div>1. Please keep this printout for future reference along with your Photo ID Card for claims and medical benefits.</div>
        <div>2. This copy should be retained with you until the Pehchan Card is received.</div>
        <div>3. Employer to please affix employee and family photo here and attest with official stamp.</div>
      </div>

      <div className="flex justify-center gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-1.5 rounded border border-[#155d8e] bg-[#1a6fa8] px-5 py-1.5 text-[13px] font-bold text-white hover:bg-[#155d8e]"
        >
          <Download size={14} /> Download/Print
        </button>
        <button
          type="button"
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
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
          style={{ animation: "epfReg23TickPop 0.15s ease-out" }}
        >
          <CheckCircle size={48} className="text-white" />
        </div>
        <p className="text-center text-[15px] font-semibold text-[#0b2e57]">
          e-Pehchan Card Downloaded Successfully
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] hover:bg-[#c90f15]"
        >
          <RotateCcw size={15} /> Retry
        </button>
      </div>
      <style jsx>{`
        @keyframes epfReg23TickPop {
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
export default function EpfReg23Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<"search" | "results" | "card">("search");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [downloaded, setDownloaded] = useState(false);

  // Admin-configured Employer's Code Number (Simulation Manager slug
  // "epf-reg-23", or the course editor's per-insert "Add/Edit Creds")
  // drives the search panel and card header — falling back to the
  // standard demo establishment when nothing is configured.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const code = findFieldValue(simConfig, /code|lin|user/i) || DEFAULT_CODE;
  const bannerText = simConfig?.bannerText || "";
  const notifyGroupComplete = useSimGroupComplete();

  const selectedEmployee = EMPLOYEES[selectedIdx];

  const handleDownload = () => {
    const emp = selectedEmployee;
    const blob = new Blob(
      [
        `EMPLOYEES' STATE INSURANCE CORPORATION\ne-Pehchan Card\n\nInsured Person: ${emp.name}\nInsurance No.: ${emp.insuranceNo}\nDate of Registration: ${emp.dateOfRegistration}\nEmployer's Code No.: ${code}\nEmployer: ${DEFAULT_ESTABLISHMENT}\n`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `e-Pehchan-Card_${emp.insuranceNo}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    notifyGroupComplete();
  };

  const handleRetry = () => {
    setDownloaded(false);
    setView("search");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {downloaded && <SuccessOverlay onRetry={handleRetry} />}

      <TopStrip />
      <Header />
      <InstructionBanner bannerText={bannerText} />

      <main className="mx-auto w-full max-w-[1300px] flex-1 px-6 py-8">
        <SearchPanel code={code} onView={() => setView("results")} />

        {view !== "search" && (
          <ResultsTable
            code={code}
            onViewCounterfoil={(i) => {
              setSelectedIdx(i);
              setView("card");
            }}
          />
        )}

        {view === "card" && (
          <CounterfoilCard employee={selectedEmployee} code={code} onDownload={handleDownload} />
        )}
      </main>

      <Footer />
    </div>
  );
}
