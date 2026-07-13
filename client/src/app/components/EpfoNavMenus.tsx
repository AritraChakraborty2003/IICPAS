"use client";

import { ChevronDown } from "lucide-react";

// Dropdown contents replicating the EPFO Unified Employer Portal nav menus.
export const EPFO_NAV_MENUS: Record<string, string[]> = {
  Member: [
    "MEMBER PROFILE",
    "REGISTER-INDIVIDUAL",
    "REGISTER-BULK",
    "KYC-BULK",
    "EXIT-BULK",
    "APPROVALS",
    "MISSING DETAILS BULK",
    "APPROVE MISSING DETAILS",
    "AADHAAR VERIFICATION",
    "APPROVE KYC PENDING FOR DS",
    "BASIC DETAILS CHANGE REQUESTS",
    "APPROVE KYC SEEDED BY MEMBER",
    "UAN ALLOTMENT FOR EXISTING MEMBER",
    "INTERNATIONAL WORKER <-> DOMESTIC WORKER CHANGE",
  ],
  Establishment: [
    "VIEW PROFILE",
    "EXEMPTED RETURNS",
    "CONTACT DETAILS",
    "VIEW ADDRESS",
    "DSC / E-SIGN",
    "FORM-5A",
    "BRANCHES (FORM-2A)",
    "DOWNLOAD PDFS",
    "MEMBER LOCATION MAPPING",
  ],
  Payments: [
    "ECR/RETURN FILING",
    "PAYMENT (ECR)",
    "PAYMENT (DIRECT CHALLAN)",
  ],
  Dashboards: [
    "MISSING DETAILS",
    "ACTIVE MEMBER",
    "EXITED MEMBER",
    "MEMBER SERVICE DETAILS",
    "MEMBERS COMPLETING 58 YEARS",
    "J&K MEMBER MAPPING",
    "PMGKY ELIGIBLE MEMBERS",
    "PMGKY REIMBURSEMENT BENEFIT DETAILS",
  ],
  User: ["MY PROFILE", "CHANGE PASSWORD"],
  "Online Services": [
    "STOP AUTO TRANSFER REQUEST",
    "TRANSFER CLAIMS",
    "ANNEXURE K",
    "PDF PENDING CASES",
    "EXEMPTED TO UNEXEMPTED PF TRANSFER",
    "EXEMPTED TO UNEXEMPTED PF TRANSFER - BULK",
  ],
  ABRY: ["ESTABLISHMENT REGISTRATION", "MEMBER REGISTRATION"],
};

// One nav tab that opens its EPFO menu on click; tabs without a menu render as
// a plain button. The parent keeps track of which menu is open so only one
// dropdown shows at a time.
export function EpfoNavItem({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: (label: string | null) => void;
}) {
  const items = EPFO_NAV_MENUS[label] || [];
  return (
    <div className="relative">
      <button
        onClick={() => onToggle(open || !items.length ? null : label)}
        className={`flex h-full items-center gap-1 whitespace-nowrap border-r border-white/15 px-4 py-2.5 text-[13px] font-medium hover:bg-white/10 ${
          open ? "bg-white/10" : ""
        }`}
      >
        {label} <ChevronDown size={12} />
      </button>
      {open && items.length > 0 && (
        <div className="absolute left-0 top-full z-50 min-w-[260px] rounded-b border border-t-0 border-[#ccc] bg-white py-1 text-left shadow-lg">
          {items.map((item) => (
            <button
              key={item}
              onClick={() => onToggle(null)}
              className="block w-full border-b border-[#f0f0f0] px-4 py-2 text-left text-[12.5px] uppercase text-[#333] last:border-b-0 hover:bg-[#eef4fb]"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
