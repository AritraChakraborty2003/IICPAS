import React from "react";
import { Download } from "lucide-react";

export const DEFAULT_CODE = "63000728280002700";
export const DEFAULT_ESTABLISHMENT = "Aprilia EV Motors LLP";
export const EMPLOYER_ADDRESS = "258/1, 1st Floor, Near 31E, Bus Stop Rd, 2nd Block, Thyagaraj Nagar";

export type Employee = {
  name: string;
  insuranceNo: string;
  gender: "Male" | "Female";
  dob: string;
  maritalStatus: string;
  dateOfRegistration: string;
  address: string;
  dispensary: string;
  mobile: string;
};

export const EMPLOYEES: Employee[] = [
  {
    name: "Lohith yadav",
    insuranceNo: "5347437544",
    gender: "Male",
    dob: "11/07/1992",
    maritalStatus: "Married",
    dateOfRegistration: "01/11/2023",
    address: "#22, 15th Cross Rd, 1st Block, Govindaraj Garden, RT Nagar, Bengaluru, Karnataka 560032",
    dispensary: "R.T.Nagar, KA (ESIS Disp.)",
    mobile: "9900008797",
  },
  {
    name: "Ananya gupta",
    insuranceNo: "545168350",
    gender: "Female",
    dob: "22/03/1996",
    maritalStatus: "Single",
    dateOfRegistration: "30/10/2024",
    address: "#14, 4th Main, Jayanagar 3rd Block, Bengaluru, Karnataka 560011",
    dispensary: "Jayanagar, KA (ESIS Disp.)",
    mobile: "9900008798",
  },
  {
    name: "Aarav Sharma",
    insuranceNo: "6304234211",
    gender: "Male",
    dob: "15/05/1994",
    maritalStatus: "Married",
    dateOfRegistration: "12/02/2024",
    address: "#7, MG Road, Indiranagar, Bengaluru, Karnataka 560038",
    dispensary: "Indiranagar, KA (ESIS Disp.)",
    mobile: "9900008799",
  },
  {
    name: "Rohit Chatterjee",
    insuranceNo: "6730423113",
    gender: "Male",
    dob: "08/09/1990",
    maritalStatus: "Married",
    dateOfRegistration: "05/06/2024",
    address: "#31, Whitefield Main Road, Bengaluru, Karnataka 560066",
    dispensary: "Whitefield, KA (ESIS Disp.)",
    mobile: "9900008800",
  },
  {
    name: "Rahul Kedia",
    insuranceNo: "8752566013",
    gender: "Male",
    dob: "30/12/1993",
    maritalStatus: "Single",
    dateOfRegistration: "30/10/2024",
    address: "#9, Koramangala 5th Block, Bengaluru, Karnataka 560095",
    dispensary: "Koramangala, KA (ESIS Disp.)",
    mobile: "9900008801",
  },
];

// ─── Top simulation disclaimer ─────────────────────────────────────────────
export function SimBanner() {
  return (
    <div className="sticky top-0 z-50 bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
      This is a Simulation. Use For Educational Purposes ONLY.
    </div>
  );
}

// ─── Top nav: tricolour strip + accessibility row ──────────────────────────
export function TopStrip() {
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
export function Header() {
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

// ─── Footer ─────────────────────────────────────────────────────────────────
export function Footer() {
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

// ─── e-Pehchan Card counterfoil for the selected employee ─────────────────
export function CounterfoilCard({
  employee,
  code,
  onDownload,
  onClose,
}: {
  employee: Employee;
  code: string;
  onDownload: () => void;
  onClose?: () => void;
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
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
