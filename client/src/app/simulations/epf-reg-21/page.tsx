"use client";

import React, { useState } from "react";
import { CheckCircle, RotateCcw, Upload } from "lucide-react";
import {
  useSimulationConfig,
  type SimulationCredConfig,
} from "@/lib/useSimulationConfig";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

// Every credential field below is admin-configured (Simulation Manager, or
// the course editor's per-insert "Add/Edit Creds") for slug "epf-reg-21" —
// nothing about the employee, employer, bank, or nominee is hardcoded here.
// Recommended field labels to set up for this "Add Employees" experiment:
//   Code (or LIN / User ID)      — employer/subunit code number
//   Name                         — employee's full name
//   Insurance Number             — leave blank/omit for a brand-new employee
//   Aadhaar No
//   Mobile
//   Date of Birth
//   Date of Joining (or "Date of Appointment") — must match what the student
//     types on the lookup step below when credential validation is enabled
//   Marital Status
//   Gender
//   Father's/Husband's Name
//   Address                      — used as both present & permanent address
//   Dispensary                   — dispensary/IMP/mEUD for IP & family
//   Firm Name (or "Employer Name")
//   Employer Address
//   Account Number, Bank, IFSC Code, Branch Name, Account Type — bank details
//   Nominee 1 Name / Nominee 1 Address / Nominee 1 Mobile / Nominee 1 Relationship
//   Nominee 2 Name / Nominee 2 Address / Nominee 2 Mobile / Nominee 2 Relationship
// Only the Employer/Subunit Code No. and Date of Appointment are validated
// against the configured values (when requireCredentialValidation is on) —
// everything else is simply displayed once the student continues past.
const SIMULATION_SLUG = "epf-reg-21";

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

// ─── Instructional banner: every configured credential field, verbatim ────
function CredsBanner({ fields }: { fields: { label: string; value: string }[] }) {
  if (!fields.length) return null;
  return (
    <div className="mx-auto w-full max-w-[1300px] px-6 pt-6">
      <div className="rounded-[8px] border border-[#bee3da] bg-[#e3f4f1] px-5 py-4 text-[13.5px] leading-relaxed text-[#0b3d3a]">
        <p className="mb-1 font-bold">Experiment 3:</p>
        <p className="mb-2">
          Register an employee in ESI portal using the Experiment below. Following details are available:
        </p>
        {fields.map((f) => (
          <p key={f.label}>
            <span className="font-semibold">{f.label}:</span> {f.value}
          </p>
        ))}
      </div>
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

// ─── Step 1: "Track Registered Employees" lookup panel ────────────────────
// Employer/Subunit Code No. is auto-filled (read-only) from the configured
// Code/LIN field. The employee's Insurance No. and Date of Appointment are
// typed in by the student and — when requireCredentialValidation is on —
// checked against whatever the admin configured for this experiment, the
// same way the rest of the ESIC simulations validate entered credentials.
function EmployeeLookupPanel({
  code,
  insuranceNoConfigured,
  dateOfAppointmentConfigured,
  validateCreds,
  onContinue,
}: {
  code: string;
  insuranceNoConfigured: string;
  dateOfAppointmentConfigured: string;
  validateCreds: boolean;
  onContinue: (insuranceNo: string, dateOfAppointment: string) => void;
}) {
  const [allottedBefore, setAllottedBefore] = useState<"yes" | "no">("no");
  const [insuranceNo, setInsuranceNo] = useState("");
  const [dateOfAppointment, setDateOfAppointment] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setAllottedBefore("no");
    setInsuranceNo("");
    setDateOfAppointment("");
    setError("");
  };

  const submit = () => {
    if (!dateOfAppointment.trim()) {
      setError("Date of Appointment is required.");
      return;
    }
    if (allottedBefore === "yes" && !insuranceNo.trim()) {
      setError("Employee's Insurance No. is required.");
      return;
    }
    if (
      validateCreds &&
      dateOfAppointmentConfigured &&
      dateOfAppointment.trim().toLowerCase() !== dateOfAppointmentConfigured.trim().toLowerCase()
    ) {
      setError("Date of Appointment does not match the details given for this experiment.");
      return;
    }
    if (
      validateCreds &&
      allottedBefore === "yes" &&
      insuranceNoConfigured &&
      insuranceNo.trim().toLowerCase() !== insuranceNoConfigured.trim().toLowerCase()
    ) {
      setError("Insurance Number does not match the details given for this experiment.");
      return;
    }
    setError("");
    onContinue(insuranceNo.trim(), dateOfAppointment.trim());
  };

  return (
    <div className="mx-auto w-full max-w-[1300px] overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="border-b border-[#e0ddc8] bg-[#d9d2ae] px-4 py-2 text-[12px] font-semibold text-[#4a4630]">
        User Login: {code || "—"}
      </div>
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Track Registered Employees
      </div>
      <div className="space-y-3.5 bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <label className="flex items-center gap-3">
          <span className="w-[280px] shrink-0 font-semibold text-[#7a1f1a]">Employer/Subunit Code No.:*</span>
          <input
            readOnly
            value={code}
            className="h-[32px] w-[240px] rounded border border-[#c0c0c0] bg-[#f4f4f4] px-2 font-mono"
          />
        </label>
        <label className="flex flex-wrap items-center gap-3">
          <span className="w-[280px] shrink-0 font-semibold text-[#7a1f1a]">
            Was the Employee ever allotted a ESI Number?:*
          </span>
          <span className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={allottedBefore === "yes"}
              onChange={() => setAllottedBefore("yes")}
            />
            Yes
          </span>
          <span className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={allottedBefore === "no"}
              onChange={() => setAllottedBefore("no")}
            />
            No
          </span>
        </label>

        <div className="border-t border-[#e0ddc8] pt-3 text-[12px] font-semibold text-[#7a1f1a]">Enter Details</div>
        <label className="flex items-center gap-3">
          <span className="w-[280px] shrink-0 font-semibold text-[#7a1f1a]">Employee&apos;s Insurance No.:</span>
          <input
            value={insuranceNo}
            onChange={(e) => setInsuranceNo(e.target.value)}
            disabled={allottedBefore === "no"}
            placeholder={allottedBefore === "no" ? "Not applicable — new employee" : ""}
            className="h-[32px] w-[240px] rounded border border-[#c0c0c0] px-2 disabled:bg-[#f4f4f4] disabled:text-[#999]"
          />
        </label>
        <label className="flex items-center gap-3">
          <span className="w-[280px] shrink-0 font-semibold text-[#7a1f1a]">Date of Appointment:*</span>
          <input
            value={dateOfAppointment}
            onChange={(e) => setDateOfAppointment(e.target.value)}
            placeholder="As given in the experiment details"
            className="h-[32px] w-[240px] rounded border border-[#c0c0c0] px-2"
          />
        </label>

        {error && <p className="text-[12.5px] font-semibold text-[#e53e3e]">{error}</p>}

        <p className="text-[11.5px] italic text-[#7a1f1a]">
          ** One IP, One Insurance Number, One Nation. An employee shall have only One ESI Insurance Number in
          his/her lifetime irrespective of number of change of employment or Employer.
        </p>
        <p className="text-[11.5px] italic text-[#7a1f1a]">
          As per the provisions of Regulation 10B read with Regulation 11 &amp; 12 of the Employees&apos; State
          Insurance (General) Regulation, 1950, Registration of an employee is required to be done within 10 days
          from the Date of Appointment. Where the Date of Registration of an employee is more than 10 days from the
          date of Appointment, the matter may be forwarded to the concerned RO/SRO for examination/verification.
          Until then, the date of registration shall be treated as the date of appointment.
        </p>
      </div>
      <div className="flex justify-center gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          onClick={submit}
          className="rounded border border-[#7a1f1a] bg-[#c0392b] px-6 py-1.5 text-[13px] font-bold text-white hover:bg-[#a93226]"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-6 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── A read-only "label: value" row used throughout the registration form ─
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-[260px] shrink-0 font-semibold text-[#7a1f1a]">{label}:</span>
      <input
        readOnly
        value={value}
        className="h-[32px] flex-1 min-w-0 rounded border border-[#c0c0c0] bg-[#f4f4f4] px-2"
      />
    </label>
  );
}

type EmployeeDetails = {
  code: string;
  name: string;
  dob: string;
  maritalStatus: string;
  gender: string;
  fatherHusbandName: string;
  aadhaar: string;
  mobile: string;
  address: string;
  dispensary: string;
  employerName: string;
  employerAddress: string;
  dateOfAppointment: string;
  bankAccountNo: string;
  bankName: string;
  ifsc: string;
  branch: string;
  accountType: string;
  nominees: { name: string; address: string; mobile: string; relationship: string }[];
};

// ─── Step 2: Employees Registration Form-1, pre-filled from configured creds
function EmployeeRegistrationForm({
  details,
  onSubmit,
  onCancel,
}: {
  details: EmployeeDetails;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [declared, setDeclared] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1300px] overflow-hidden rounded-[6px] border border-[#e0ddc8]">
      <div className="border-b border-[#e0ddc8] bg-[#d9d2ae] px-4 py-2 text-[12px] font-semibold text-[#4a4630]">
        Employer &gt; Employee Registration
      </div>
      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Employees Registration Form-1 — Insured Person&apos;s Particulars
      </div>

      <div className="space-y-3 border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <label className="flex flex-wrap items-center gap-3">
          <span className="w-[260px] shrink-0 font-semibold text-[#7a1f1a]">Is IP Disabled:</span>
          <span className="flex items-center gap-1.5">
            <input type="radio" checked readOnly /> No
          </span>
          <span className="ml-6 w-[160px] shrink-0 font-semibold text-[#7a1f1a]">Type of Disability:</span>
          <select disabled className="h-[32px] w-[200px] rounded border border-[#c0c0c0] bg-[#f4f4f4] px-2">
            <option>--Please Select--</option>
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className="w-[260px] shrink-0 font-semibold text-[#7a1f1a]">Select Certificate:</span>
          <span className="flex cursor-not-allowed items-center gap-1.5 rounded border border-[#c0c0c0] bg-[#f4f4f4] px-3 py-1.5 text-[#999]">
            <Upload size={13} /> No file chosen
          </span>
        </label>

        <InfoField label="Name" value={details.name} />
        <InfoField label="Name of Father/Husband" value={details.fatherHusbandName} />
        <InfoField label="Date of Birth" value={details.dob} />
        <InfoField label="Marital Status" value={details.maritalStatus} />
        <InfoField label="Gender" value={details.gender} />
        <InfoField label="Aadhaar No." value={details.aadhaar} />
        <InfoField label="Mobile No." value={details.mobile} />
      </div>

      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Present &amp; Permanent Address (same, as given)
      </div>
      <div className="space-y-3 border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <InfoField label="Address" value={details.address} />
        <InfoField label="Dispensary Or IMP or mEUD (for IP &amp; Family)" value={details.dispensary} />
      </div>

      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Current Employer&apos;s Particulars
      </div>
      <div className="space-y-3 border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <InfoField label="Employer's Code No." value={details.code} />
        <InfoField label="Date of Appointment" value={details.dateOfAppointment} />
        <InfoField label="Name of the Employer" value={details.employerName} />
        <InfoField label="Address of the Employer" value={details.employerAddress} />
        <label className="flex items-center gap-3">
          <span className="w-[260px] shrink-0 font-semibold text-[#7a1f1a]">Have Previous Employer:</span>
          <span className="flex items-center gap-1.5">
            <input type="radio" checked readOnly /> No
          </span>
        </label>
      </div>

      <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
        Bank Account Details of Insured Person
      </div>
      <div className="space-y-3 border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <InfoField label="Account Number" value={details.bankAccountNo} />
        <InfoField label="Bank" value={details.bankName} />
        <InfoField label="IFSC Code" value={details.ifsc} />
        <InfoField label="Branch Name" value={details.branch} />
        <InfoField label="Account Type" value={details.accountType} />
      </div>

      {details.nominees.length > 0 && (
        <>
          <div className="border-b border-[#e0ddc8] bg-[#f5f2e2] px-4 py-2 text-[13px] font-bold text-[#7a1f1a]">
            Details of Nominee
          </div>
          <div className="space-y-4 border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
            {details.nominees.map((n, i) => (
              <div key={i} className="space-y-2 border-b border-dashed border-[#e0ddc8] pb-3 last:border-b-0 last:pb-0">
                <div className="text-[12px] font-semibold text-[#7a1f1a]">Nominee {i + 1}</div>
                <InfoField label="Name" value={n.name} />
                <InfoField label="Address" value={n.address} />
                <InfoField label="Mobile" value={n.mobile} />
                <InfoField label="Relationship" value={n.relationship} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="space-y-3 border-b border-[#e0ddc8] bg-[#fdfaf0] px-4 py-4 text-[13px] text-[#333]">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={declared}
            onChange={(e) => setDeclared(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I Hereby Declare that the Statement Given Above is Correct to the Best of My Knowledge and Belief. I
            Also Undertake to Intimate Changes.*
          </span>
        </label>
      </div>

      <div className="flex justify-center gap-2.5 border-t border-[#e0ddc8] bg-[#fdfaf0] px-4 py-3">
        <button
          type="button"
          disabled={!declared}
          onClick={onSubmit}
          className="rounded border border-[#7a1f1a] bg-[#c0392b] px-6 py-1.5 text-[13px] font-bold text-white hover:bg-[#a93226] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={() => setDeclared(false)}
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-6 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-6 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
        >
          Cancel
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

// ─── Success overlay: tick + red Retry, appearing once registration is submitted
function SuccessOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-[#07111f]/45 px-4 pt-24 backdrop-blur-[3px] sm:pt-32">
      <div className="flex flex-col items-center gap-4 rounded-[16px] bg-white/95 px-10 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div
          className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
          style={{ animation: "epfReg21TickPop 0.15s ease-out" }}
        >
          <CheckCircle size={48} className="text-white" />
        </div>
        <p className="text-center text-[15px] font-semibold text-[#0b2e57]">
          Employee Registered Successfully
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] hover:bg-[#c90f15]"
        >
          <RotateCcw size={15} /> Retry
        </button>
      </div>
      <style jsx>{`
        @keyframes epfReg21TickPop {
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

// Pick a configured credential value by matching its label, optionally
// excluding labels that also match a second pattern (to keep, e.g., the
// employee's own "Mobile" from being confused with "Nominee 1 Mobile").
const pickField = (
  config: SimulationCredConfig | null,
  match: RegExp,
  exclude?: RegExp
): string =>
  config?.credentialFields.find(
    (f) => match.test(f.label) && !(exclude && exclude.test(f.label))
  )?.value || "";

const pickNominee = (config: SimulationCredConfig | null, n: number) => ({
  name: pickField(config, new RegExp(`nominee\\s*${n}.*name`, "i")),
  address: pickField(config, new RegExp(`nominee\\s*${n}.*address`, "i")),
  mobile: pickField(config, new RegExp(`nominee\\s*${n}.*mobile`, "i")),
  relationship: pickField(config, new RegExp(`nominee\\s*${n}.*relation`, "i")),
});

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg21Page() {
  const [launched, setLaunched] = useState(false);
  const [step, setStep] = useState<"lookup" | "form">("lookup");
  const [dateOfAppointment, setDateOfAppointment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const validateCreds = simConfig?.requireCredentialValidation ?? true;
  const notifyGroupComplete = useSimGroupComplete();

  const code = pickField(simConfig, /code|lin|user/i);
  const insuranceNoConfigured = pickField(simConfig, /insurance/i);
  const dateOfJoiningConfigured = pickField(simConfig, /date of joining|date of appointment/i);
  const employeeDetails: EmployeeDetails = {
    code,
    name: pickField(simConfig, /^name$/i),
    dob: pickField(simConfig, /date of birth|^dob$/i),
    maritalStatus: pickField(simConfig, /marital/i),
    gender: pickField(simConfig, /^gender$/i),
    fatherHusbandName: pickField(simConfig, /father|husband/i, /nominee/i),
    aadhaar: pickField(simConfig, /aadhaar|aadhar/i),
    mobile: pickField(simConfig, /mobile/i, /nominee/i),
    address: pickField(simConfig, /address/i, /employer|nominee/i),
    dispensary: pickField(simConfig, /dispensary/i),
    employerName: pickField(simConfig, /firm name|employer.?s?\s*name|company name/i),
    employerAddress: pickField(simConfig, /employer.?s?\s*address/i),
    dateOfAppointment,
    bankAccountNo: pickField(simConfig, /account number/i, /nominee/i),
    bankName: pickField(simConfig, /^bank$/i),
    ifsc: pickField(simConfig, /ifsc/i),
    branch: pickField(simConfig, /branch/i),
    accountType: pickField(simConfig, /account type|^type$/i, /disability/i),
    nominees: [1, 2].map((n) => pickNominee(simConfig, n)).filter((n) => n.name),
  };

  const handleLookupContinue = (_insuranceNo: string, dateOfAppt: string) => {
    setDateOfAppointment(dateOfAppt);
    setStep("form");
  };

  const handleFinalSubmit = () => {
    setSubmitted(true);
    notifyGroupComplete();
  };

  const handleRetry = () => {
    setSubmitted(false);
    setDateOfAppointment("");
    setStep("lookup");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {submitted && <SuccessOverlay onRetry={handleRetry} />}

      <TopStrip />
      <Header />
      <CredsBanner fields={simConfig?.credentialFields || []} />

      <main className="flex-1 px-6 py-10">
        {step === "lookup" && (
          <EmployeeLookupPanel
            code={code}
            insuranceNoConfigured={insuranceNoConfigured}
            dateOfAppointmentConfigured={dateOfJoiningConfigured}
            validateCreds={validateCreds}
            onContinue={handleLookupContinue}
          />
        )}
        {step === "form" && (
          <EmployeeRegistrationForm
            details={employeeDetails}
            onSubmit={handleFinalSubmit}
            onCancel={() => setStep("lookup")}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
