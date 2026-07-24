"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";
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
function ResultsTable({ code }: { code: string }) {
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
            {EMPLOYEES.map((emp) => (
              <tr key={emp.insuranceNo}>
                <td className="border border-[#e0ddc8] px-3 py-2">{code}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{DEFAULT_ESTABLISHMENT}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{emp.insuranceNo}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{emp.name}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{emp.gender}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">{emp.dateOfRegistration}</td>
                <td className="border border-[#e0ddc8] px-3 py-2">
                  <a
                    href={`/simulations/epf-reg-23/counterfoil/${emp.insuranceNo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-bold text-[#1a56db] underline hover:text-[#1a6fa8]"
                  >
                    View Counter Foil <ChevronRight size={13} />
                  </a>
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

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg23Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<"search" | "results">("search");

  // Admin-configured Employer's Code Number (Simulation Manager slug
  // "epf-reg-23", or the course editor's per-insert "Add/Edit Creds")
  // drives the search panel and card header — falling back to the
  // standard demo establishment when nothing is configured.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const code = findFieldValue(simConfig, /code|lin|user/i) || DEFAULT_CODE;
  const bannerText = simConfig?.bannerText || "";

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}

      <TopStrip />
      <Header />
      <InstructionBanner bannerText={bannerText} />

      <main className="mx-auto w-full max-w-[1300px] flex-1 px-6 py-8">
        <SearchPanel code={code} onView={() => setView("results")} />

        {view !== "search" && <ResultsTable code={code} />}
      </main>

      <Footer />
    </div>
  );
}
