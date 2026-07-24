"use client";

import React, { useState } from "react";
import { CheckCircle, RotateCcw, Printer, ChevronRight } from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

// Employer's Code Number and Establishment name come from the admin
// Simulation Manager (or the course editor's per-insert "Add/Edit Creds")
// for slug "epf-reg-22" — matched by field label: Code (or LIN/User) /
// Establishment (or Firm/Name). If nothing is configured, the values below
// (matching the standard "List of Employees" experiment for Aprilia EV
// Motors LLP, continuing on from the epf-reg-18 login) are used as
// defaults. The employee roster itself is fixed demo data — there is no
// list-type credential field to source it from. The instructional banner
// only appears if an admin sets bannerText; otherwise none is shown.
const SIMULATION_SLUG = "epf-reg-22";
const DEFAULT_CODE = "63000728280002700";
const DEFAULT_ESTABLISHMENT = "Aprilia EV Motors LLP";

const EMPLOYEES = [
  { name: "Lohith yadav", insuranceNo: "5347437544" },
  { name: "Ananya gupta", insuranceNo: "545168350" },
  { name: "Aarav Sharma", insuranceNo: "6304234211" },
  { name: "Rohit Chatterjee", insuranceNo: "6730423113" },
  { name: "Rahul Kedia", insuranceNo: "8752566013" },
];

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

// ─── Employer dashboard: three-column menu, "List of Employees" actionable ─
function DashboardMenu({ onOpenList }: { onOpenList: () => void }) {
  const columns: { title: string; items: string[] }[] = [
    { title: "EMPLOYER", items: EMPLOYER_LINKS },
    { title: "EMPLOYEE", items: EMPLOYEE_LINKS },
    { title: "MONTHLY CONTRIBUTION", items: CONTRIBUTION_LINKS },
  ];
  return (
    <div className="rounded-[8px] border border-[#e0ddc8] bg-[#fdfaf0]">
      <div className="border-b border-[#e0ddc8] bg-[#d9d2ae] px-5 py-2 text-[12px] font-semibold text-[#4a4630]">
        User Login: Employer Dashboard
      </div>
      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
        {columns.map((col) => (
          <div key={col.title}>
            <div className="mb-3 text-[12px] font-bold tracking-wide text-[#a08968]">
              {col.title}
            </div>
            <ul className="space-y-2.5">
              {col.items.map((item) =>
                item === "List of Employees" ? (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={onOpenList}
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

// ─── Return of Declaration Form (Regulation 14) with the employee table ───
function DeclarationForm({
  code,
  establishment,
  onPrint,
}: {
  code: string;
  establishment: string;
  onPrint: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e0ddc8] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
      <div className="h-[10px] bg-[#c9b878]" />
      <div className="px-8 py-7">
        <div className="mb-6 text-center leading-[1.5]">
          <div className="text-[16px] font-bold text-[#0b2e57]">
            EMPLOYEE&apos;S STATE INSURANCE CORPORATION
          </div>
          <div className="text-[14px] font-bold text-[#333]">Return of Declaration Form</div>
          <div className="text-[13px] text-[#555]">Regulation 14</div>
        </div>

        <div className="mb-3 border-b border-[#ddd] pb-1 text-[13px] font-semibold text-[#333]">
          Name and address of Factory or Establishment&nbsp;: {establishment}
        </div>

        <div className="mb-4 flex items-center gap-3 text-[13px] text-[#333]">
          <span className="font-semibold">Employer&apos;s Code Number</span>
          <span className="rounded border border-[#333] px-3 py-1 font-mono font-bold">{code}</span>
        </div>

        <p className="mb-5 text-[13px] leading-relaxed text-[#333]">
          I send herewith Declaration Forms in respect of the employees mentioned below. I hereby declare that
          every person employed as an employee within the meaning of Section 2(9) of the Employees&apos; State
          Insurance Act, 1948 on ................................ in this factory or establishment and is respect
          of a remuneration not exceeding Rs. 15,000/- (excluding remuneration for overtime work) per month has
          been included in this list (excepting only those in respect of whom declaration forms have been sent to
          the Corporation in the past).
        </p>

        <div className="mb-1 grid grid-cols-2 gap-4 text-[13px] text-[#333]">
          <div>
            <span className="font-semibold">Place</span>&nbsp;&nbsp;&nbsp;&nbsp;Local Office
          </div>
          <div>
            <span className="font-semibold">Date</span>&nbsp;&nbsp;{today}&nbsp;&nbsp;&nbsp;&nbsp;Designation
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f5f2e2] text-left text-[#333]">
                <th className="border border-[#ddd] px-3 py-2 font-semibold">Sl No.</th>
                <th className="border border-[#ddd] px-3 py-2 font-semibold">Employee Name</th>
                <th className="border border-[#ddd] px-3 py-2 font-semibold">Insurance Number</th>
                <th className="border border-[#ddd] px-3 py-2 font-semibold">From date:</th>
                <th className="border border-[#ddd] px-3 py-2 font-semibold">To date:</th>
                <th className="border border-[#ddd] px-3 py-2 font-semibold">Exemption Status</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.map((emp, i) => (
                <tr key={emp.insuranceNo}>
                  <td className="border border-[#ddd] px-3 py-2">{i + 1}</td>
                  <td className="border border-[#ddd] px-3 py-2">{emp.name}</td>
                  <td className="border border-[#ddd] px-3 py-2">{emp.insuranceNo}</td>
                  <td className="border border-[#ddd] px-3 py-2">-</td>
                  <td className="border border-[#ddd] px-3 py-2">-</td>
                  <td className="border border-[#ddd] px-3 py-2">NO</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 rounded bg-[#1a6fa8] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(26,111,168,0.28)] transition hover:bg-[#155d8e] active:scale-[0.99]"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
      <div className="h-[10px] bg-[#c9b878]" />
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
          style={{ animation: "epfReg22TickPop 0.4s ease-out" }}
        >
          <CheckCircle size={48} className="text-white" />
        </div>
        <p className="text-center text-[15px] font-semibold text-[#0b2e57]">
          List of Employees Printed Successfully
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] hover:bg-[#c90f15]"
        >
          <RotateCcw size={15} /> Retry
        </button>
      </div>
      <style jsx>{`
        @keyframes epfReg22TickPop {
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
export default function EpfReg22Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<"menu" | "form">("menu");
  const [printed, setPrinted] = useState(false);

  // Admin-configured Employer's Code Number / Establishment name (Simulation
  // Manager slug "epf-reg-22", or the course editor's per-insert "Add/Edit
  // Creds") drive the declaration form header — falling back to the
  // standard demo establishment when nothing is configured.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const code = findFieldValue(simConfig, /code|lin|user/i) || DEFAULT_CODE;
  const establishment =
    findFieldValue(simConfig, /firm|establishment|name/i) || DEFAULT_ESTABLISHMENT;
  const bannerText = simConfig?.bannerText || "";
  const notifyGroupComplete = useSimGroupComplete();

  const handlePrint = () => {
    setPrinted(true);
    notifyGroupComplete();
  };

  const handleRetry = () => {
    setPrinted(false);
    setView("menu");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {printed && <SuccessOverlay onRetry={handleRetry} />}

      <TopStrip />
      <Header />
      <InstructionBanner bannerText={bannerText} />

      <main className="mx-auto w-full max-w-[1300px] flex-1 px-6 py-8">
        {view === "menu" ? (
          <DashboardMenu onOpenList={() => setView("form")} />
        ) : (
          <DeclarationForm code={code} establishment={establishment} onPrint={handlePrint} />
        )}
      </main>

      <Footer />
    </div>
  );
}
