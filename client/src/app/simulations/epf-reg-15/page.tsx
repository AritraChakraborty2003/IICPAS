"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  RotateCcw,
  HelpCircle,
  Phone,
  ChevronDown,
  User,
  Settings,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  useSimulationConfig,
  findFieldValue,
} from "@/lib/useSimulationConfig";

// UAN, Name, Date of Birth, Bank Account Number, IFSC, PAN and the Aadhaar
// OTP all come from the admin Simulation Manager (or the course editor's
// per-insert "Add/Edit Creds") for slug "epf-reg-15", matched by field
// label: UAN / Name / DOB (or Date of Birth) / Account (or Bank Account
// Number) / IFSC / PAN / OTP. If nothing is configured, the values below
// (matching the standard "Upload KYC" experiment for Mr. Nagarjun Patel)
// are used as the default expected answers. There is deliberately no
// hardcoded banner fallback — the instructional banner only appears if an
// admin sets bannerText; otherwise none is shown.
const SIMULATION_SLUG = "epf-reg-15";
const DEFAULT_UAN = "201973667382";
const DEFAULT_NAME = "Nagarjun Patel";
const DEFAULT_DOB = "22/12/1991";
const DEFAULT_ACCOUNT = "0333888222444";
const DEFAULT_IFSC = "CNRB0001735";
const DEFAULT_PAN = "NPSPP2414N";
const DEFAULT_OTP = "777999";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

// ─── Top simulation disclaimer ─────────────────────────────────────────────
function SimBanner() {
  return (
    <div className="sticky top-0 z-50 bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
      This is a Simulation. Use For Educational Purposes ONLY.
    </div>
  );
}

// ─── Header: Company / Member profile branding ─────────────────────────────
function Header({ uan, name }: { uan: string; name: string }) {
  return (
    <header className="border-b border-[#ddd] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="leading-[1.4]">
          <div className="text-[19px] font-bold text-[#157a72]">COMPANY PRIVATE LIMITED, INDIA</div>
          <div className="text-[12px] font-bold tracking-wide text-[#8a4b16]">
            MINISTRY OF LABOUR &amp; EMPLOYMENT, SIMULATION
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded bg-[#157a72] px-3 py-1.5 text-[12.5px] font-semibold text-white">
            UAN&nbsp;: {uan} {name}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#555]">
            <span className="cursor-pointer rounded border border-[#ccc] px-1">A-</span>
            <span className="cursor-pointer rounded border border-[#ccc] px-1">A</span>
            <span className="cursor-pointer rounded border border-[#ccc] px-1">A+</span>
          </div>
          <span className="cursor-pointer text-[13px] font-semibold text-[#157a72] hover:underline">
            &rarr; Logout
          </span>
        </div>
      </div>
    </header>
  );
}

// ─── Top navigation bar — every menu opens its real dropdown; only
// "Manage &gt; KYC" actually navigates (everything else in this experiment
// is decorative, matching the real EPFO member portal's menu contents) ────
type MenuKey = "view" | "manage" | "account" | "online";

const MENU_ITEMS: Record<MenuKey, string[]> = {
  view: ["PROFILE", "SERVICE HISTORY", "UAN CARD", "PASSBOOK"],
  manage: ["CHANGE PASSWORD", "BASIC DETAILS", "CONTACT DETAILS", "KYC", "E-NOMINATION", "MARK EXIT"],
  account: ["MANAGE MOBILE NUMBER", "MANAGE EMAIL ID", "TDS DETAILS"],
  online: [
    "CLAIM (FORM-31,19,10C&10D)",
    "ONE MEMBER - ONE EPF ACCOUNT (TRANSFER REQUEST)",
    "TRACK CLAIM STATUS",
    "DOWNLOAD ANNEXURE K",
  ],
};

const MENU_LABELS: Record<MenuKey, string> = {
  view: "View",
  manage: "Manage",
  account: "Account",
  online: "Online Services",
};

function NavBar({ onKycClick, onHomeClick }: { onKycClick: () => void; onHomeClick: () => void }) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [notice, setNotice] = useState("");

  const selectItem = (menu: MenuKey, item: string) => {
    setOpenMenu(null);
    if (menu === "manage" && item === "KYC") {
      onKycClick();
      return;
    }
    setNotice(`"${item}" is not available in this simulation.`);
    setTimeout(() => setNotice(""), 2500);
  };

  return (
    <nav className="relative bg-[#157a72] px-6 text-[13.5px] font-semibold text-white">
      <div className="flex items-center gap-6 py-2.5">
        <span
          className="cursor-pointer"
          onClick={() => {
            setOpenMenu(null);
            onHomeClick();
          }}
        >
          Home
        </span>
        {(Object.keys(MENU_ITEMS) as MenuKey[]).map((menu) => (
          <span
            key={menu}
            className="flex cursor-pointer items-center gap-1"
            onClick={() => setOpenMenu((v) => (v === menu ? null : menu))}
          >
            {MENU_LABELS[menu]} <ChevronDown size={13} />
          </span>
        ))}
      </div>

      {openMenu && (
        <div className="absolute left-6 top-full z-20 w-[280px] rounded-b border border-t-0 border-[#c0c0c0] bg-white shadow-md">
          {MENU_ITEMS[openMenu].map((item) => {
            const isKyc = openMenu === "manage" && item === "KYC";
            return (
              <div
                key={item}
                onClick={() => selectItem(openMenu, item)}
                className={
                  isKyc
                    ? "cursor-pointer px-4 py-2.5 text-[12.5px] font-bold text-[#157a72] hover:bg-[#eaf7f4]"
                    : "cursor-pointer px-4 py-2.5 text-[12.5px] font-semibold text-[#555] hover:bg-[#f3f3f3]"
                }
              >
                {item}
              </div>
            );
          })}
        </div>
      )}

      {notice && (
        <div className="absolute right-6 top-full z-20 mt-2 rounded border border-[#e8d3a3] bg-[#fdf6e3] px-3 py-2 text-[12px] font-semibold text-[#8a4b16] shadow-md">
          {notice}
        </div>
      )}
    </nav>
  );
}

// ─── Portal home: UAN Card / Account Settings tiles + Member Profile ──────
function PortalHome({ uan, name, dob }: { uan: string; name: string; dob: string }) {
  const [expanded, setExpanded] = useState<{ profile: boolean; more: boolean }>({
    profile: false,
    more: false,
  });

  return (
    <main className="mx-auto flex w-[98vw] flex-1 flex-col gap-5 py-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded border border-[#d8d8d8] bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#eaf7f4] text-[#157a72]">
                <FileText size={26} />
              </div>
              <div className="text-[15px] font-bold text-[#157a72]">UAN Card</div>
              <span className="cursor-pointer text-[12px] font-semibold text-[#8a4b16] hover:underline">
                More Info &rarr;
              </span>
            </div>

            <div className="flex h-[70px] w-[160px] shrink-0 items-center justify-center rounded border border-[#e2e2e2] bg-[#fafafa]" />

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#eaf7f4] text-[#157a72]">
                <Settings size={26} />
              </div>
              <div className="text-[15px] font-bold text-[#157a72]">Account Settings</div>
              <span className="cursor-pointer text-[12px] font-semibold text-[#8a4b16] hover:underline">
                More Info &rarr;
              </span>
            </div>
          </div>

          <div className="mt-8 rounded border border-[#e8d3a3] bg-[#fdf6e3] px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-[13.5px] font-bold text-[#8a4b16]">
              <AlertCircle size={15} /> Alert
            </div>
            <ul className="space-y-1.5 text-[12.5px]">
              <li className="flex gap-1.5">
                <FileText size={12} className="mt-0.5 shrink-0 text-[#c0392b]" />
                <span className="cursor-pointer font-semibold text-[#c0392b] hover:underline">
                  Kind attention Members. Now Aadhaar is mandatory for filing ECR.
                </span>
              </li>
              <li className="flex gap-1.5">
                <FileText size={12} className="mt-0.5 shrink-0 text-[#c0392b]" />
                <span className="cursor-pointer font-semibold text-[#c0392b] hover:underline">
                  Important notice about mobile number updation. Click here to read.
                </span>
              </li>
              <li className="flex gap-1.5">
                <FileText size={12} className="mt-0.5 shrink-0 text-[#c0392b]" />
                <span className="cursor-pointer font-semibold text-[#c0392b] hover:underline">
                  How to file e Nomination. Click here to read
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
          <div className="flex items-center gap-2 bg-[#157a72] px-4 py-2.5 text-[15px] font-bold text-white">
            <User size={16} /> Member Profile
          </div>
          <div className="p-4 text-[13.5px]">
            <div className="grid grid-cols-[110px_1fr] gap-y-2">
              <span className="font-semibold text-[#333]">UAN</span>
              <span className="text-[#333]">{uan}</span>
              <span className="font-semibold text-[#333]">Name</span>
              <span className="text-[#333]">{name}</span>
              <span className="font-semibold text-[#333]">Birth Date</span>
              <span className="text-[#333]">{dob}</span>
            </div>
            <div className="mt-3 space-y-1.5 border-t border-[#eee] pt-3">
              <div
                className="cursor-pointer text-[12.5px] font-semibold text-[#8a4b16] hover:underline"
                onClick={() => setExpanded((p) => ({ ...p, profile: !p.profile }))}
              >
                {expanded.profile ? "-" : "+"} Profile information
              </div>
              {expanded.profile && (
                <p className="pl-3 text-[11.5px] text-[#777]">Not available in this simulation.</p>
              )}
              <div
                className="cursor-pointer text-[12.5px] font-semibold text-[#8a4b16] hover:underline"
                onClick={() => setExpanded((p) => ({ ...p, more: !p.more }))}
              >
                {expanded.more ? "-" : "+"} More information
              </div>
              {expanded.more && (
                <p className="pl-3 text-[11.5px] text-[#777]">Not available in this simulation.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

type KycDraft = {
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  panName: string;
  pan: string;
};

// ─── "Add KYC" form (Bank + PAN docs) ──────────────────────────────────────
function KycForm({
  nameValue,
  accountValue,
  ifscValue,
  panValue,
  validateCreds,
  bannerText,
  onSubmit,
}: {
  nameValue: string;
  accountValue: string;
  ifscValue: string;
  panValue: string;
  validateCreds: boolean;
  bannerText: string;
  onSubmit: (draft: KycDraft) => void;
}) {
  const [docTypes, setDocTypes] = useState<{ bank: boolean; pan: boolean; passport: boolean }>({
    bank: true,
    pan: true,
    passport: false,
  });
  const [form, setForm] = useState<KycDraft>({
    bankName: nameValue,
    accountNumber: "",
    confirmAccountNumber: "",
    ifsc: "",
    panName: "",
    pan: "",
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof KycDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = () => {
    if (
      !form.accountNumber.trim() ||
      !form.confirmAccountNumber.trim() ||
      !form.ifsc.trim() ||
      !form.panName.trim() ||
      !form.pan.trim()
    ) {
      setError("All Bank and PAN fields are required.");
      return;
    }
    if (!consent) {
      setError("Please provide Aadhaar consent to continue.");
      return;
    }
    if (normalize(form.accountNumber) !== normalize(form.confirmAccountNumber)) {
      setError("Bank Account Number and Confirm Bank Account Number do not match.");
      return;
    }
    if (
      validateCreds &&
      (normalize(form.accountNumber) !== normalize(accountValue) ||
        normalize(form.ifsc) !== normalize(ifscValue) ||
        normalize(form.pan) !== normalize(panValue) ||
        normalize(form.panName) !== normalize(nameValue))
    ) {
      setError(
        "These KYC details do not match the records given for this experiment. Please re-check the Bank Account Number, IFSC, Name and PAN."
      );
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <main className="mx-auto flex w-[98vw] max-w-[1300px] flex-1 flex-col gap-4 py-6">
      <div className="flex items-start gap-2 rounded border border-[#bee3da] bg-[#eaf7f4] px-4 py-3 text-[13.5px] text-[#157a72]">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        Note&nbsp;: An OTP will be sent to your AADHAAR linked mobile while submitting KYC.
      </div>

      {bannerText && (
        <div className="rounded border border-[#bcd7ee] bg-[#eaf3fb] px-4 py-3 text-[12.5px] text-[#1a4f8b]">
          {bannerText}
        </div>
      )}

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#d8d8d8] bg-[#eaf3fb] px-5 py-3 text-[15px] font-bold text-[#1a4f8b]">
          <span>&#9776; Add KYC</span>
        </div>

        <div className="px-6 py-6">
          <p className="mb-4 text-center text-[13px] font-semibold text-[#555]">
            CLICK ON KYC DOCUMENT TO ADD
          </p>
          <div className="mb-6 flex justify-center gap-3">
            <button
              onClick={() => setDocTypes((p) => ({ ...p, bank: !p.bank }))}
              className={`rounded-full px-6 py-1.5 text-[13px] font-bold ${
                docTypes.bank ? "bg-[#157a72] text-white" : "border border-[#c0c0c0] text-[#555]"
              }`}
            >
              Bank
            </button>
            <button
              onClick={() => setDocTypes((p) => ({ ...p, pan: !p.pan }))}
              className={`rounded-full px-6 py-1.5 text-[13px] font-bold ${
                docTypes.pan ? "bg-[#157a72] text-white" : "border border-[#c0c0c0] text-[#555]"
              }`}
            >
              PAN
            </button>
            <button
              onClick={() => setDocTypes((p) => ({ ...p, passport: !p.passport }))}
              className={`rounded-full px-6 py-1.5 text-[13px] font-bold ${
                docTypes.passport ? "bg-[#157a72] text-white" : "border border-[#c0c0c0] text-[#555]"
              }`}
            >
              Passport
            </button>
          </div>

          <div className="mx-auto max-w-[760px] space-y-5">
            {docTypes.bank && (
              <div className="relative rounded border border-[#d8d8d8] p-5">
                <button
                  onClick={() => setDocTypes((p) => ({ ...p, bank: false }))}
                  className="absolute right-3 top-3 text-[#e1141a] hover:text-[#c90f15]"
                >
                  <X size={16} />
                </button>
                <div className="mb-3 text-[14px] font-bold text-[#157a72]">Bank Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-semibold text-[#333]">Name as per Bank account&nbsp;:</label>
                    <div className="mt-1 text-[13.5px] text-[#555]">{form.bankName}</div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[13px] font-semibold text-[#333]">
                      <AlertCircle size={12} className="text-[#e8954b]" /> Bank Account Number&nbsp;:
                    </label>
                    <input
                      type="password"
                      value={form.accountNumber}
                      onChange={set("accountNumber")}
                      placeholder="Enter Bank Account Number"
                      className="mt-1 h-[38px] w-full rounded border border-[#c0c0c0] px-3 text-[13.5px] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#333]">Confirm Bank Account Number&nbsp;:</label>
                    <input
                      value={form.confirmAccountNumber}
                      onChange={set("confirmAccountNumber")}
                      placeholder="Confirm Bank Account Number"
                      className="mt-1 h-[38px] w-full rounded border border-[#c0c0c0] px-3 text-[13.5px] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#333]">Bank IFSC&nbsp;:</label>
                    <input
                      value={form.ifsc}
                      onChange={set("ifsc")}
                      placeholder="Enter Bank IFSC"
                      className="mt-1 h-[38px] w-full rounded border border-[#c0c0c0] px-3 text-[13.5px] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
                    />
                  </div>
                </div>
              </div>
            )}

            {docTypes.pan && (
              <div className="relative rounded border border-[#d8d8d8] p-5">
                <button
                  onClick={() => setDocTypes((p) => ({ ...p, pan: false }))}
                  className="absolute right-3 top-3 text-[#e1141a] hover:text-[#c90f15]"
                >
                  <X size={16} />
                </button>
                <div className="mb-3 text-[14px] font-bold text-[#157a72]">PAN Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-semibold text-[#333]">Name as per PAN&nbsp;:</label>
                    <input
                      value={form.panName}
                      onChange={set("panName")}
                      placeholder="Enter Name as per PAN"
                      className="mt-1 h-[38px] w-full rounded border border-[#c0c0c0] px-3 text-[13.5px] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#333]">PAN&nbsp;:</label>
                    <input
                      value={form.pan}
                      onChange={set("pan")}
                      placeholder="Enter PAN"
                      className="mt-1 h-[38px] w-full rounded border border-[#c0c0c0] px-3 text-[13.5px] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
                    />
                  </div>
                </div>
              </div>
            )}

            <label className="flex items-start gap-2 rounded border border-[#bee3da] bg-[#eaf7f4] px-3 py-3 text-[12px] leading-relaxed text-[#157a72]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#157a72]"
              />
              <span>
                मैं अपने यूएएन के साथ आधार को जोड़ने के लिए अपनी पहचान स्थापित करने के उद्देश्य से आधार आधारित
                प्रमाणीकरण के लिए अपना आधार नंबर प्रदान करने के लिए सहमति देता हूं।
                <br />I hereby consent to provide my Aadhaar Number, Biometric and/or One Time Pin (OTP) data for
                Aadhaar based authentication for the purpose of establishing my identity
              </span>
            </label>

            {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={submit}
                className="rounded bg-[#157a72] px-6 py-2 text-[14px] font-bold text-white hover:bg-[#0f5f59]"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setForm({ bankName: nameValue, accountNumber: "", confirmAccountNumber: "", ifsc: "", panName: "", pan: "" });
                  setConsent(false);
                  setError("");
                }}
                className="rounded bg-[#d8b27a] px-6 py-2 text-[14px] font-bold text-white hover:bg-[#c79e60]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Aadhaar OTP page shown while submitting KYC ───────────────────────────
function OtpEntryPage({
  otpValue,
  validateCreds,
  onCancel,
  onSuccess,
}: {
  otpValue: string;
  validateCreds: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6 digit OTP sent to your Aadhaar linked mobile number.");
      return;
    }
    if (validateCreds && normalize(otp) !== normalize(otpValue)) {
      setError("Invalid OTP. Please use the Aadhaar OTP provided for this experiment.");
      return;
    }
    setError("");
    onSuccess();
  };

  return (
    <main className="mx-auto flex w-[98vw] max-w-[1300px] flex-1 flex-col gap-4 py-6">
      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="border-b border-[#d8d8d8] bg-[#eaf3fb] px-5 py-3 text-[16px] font-bold text-[#1a4f8b]">
          Submit KYC &mdash; Aadhaar OTP Verification
        </div>
        <div className="px-6 py-6">
          <div className="mb-6 flex items-center gap-2 rounded bg-[#e3f3e1] px-4 py-3 text-[14px] font-semibold text-[#1a7a3a]">
            <CheckCircle size={16} className="shrink-0" />
            An OTP has been sent to your AADHAAR linked mobile number: *********
          </div>

          <div className="mx-auto max-w-[600px] space-y-4">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[14px] font-semibold text-[#333]">
                Enter OTP <span className="text-[#e53e3e]">*</span>
              </label>
              <input
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                  setError("");
                }}
                type="password"
                placeholder="Enter 6 digit OTP"
                className="h-[42px] w-full rounded border border-[#c0c0c0] bg-white px-3 text-[14px] text-[#333] outline-none focus:border-[#157a72] focus:ring-1 focus:ring-[#157a72]"
              />
            </div>

            {error && <p className="text-[12px] text-[#e53e3e]">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={submit}
                className="rounded bg-[#157a72] px-6 py-2 text-[14px] font-bold text-white hover:bg-[#0f5f59]"
              >
                Submit KYC
              </button>
              <button
                onClick={onCancel}
                className="rounded bg-[#d98a86] px-6 py-2 text-[14px] font-bold text-white hover:bg-[#c97470]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Final KYC status view — Currently Active / Pending / Rejected ────────
function KycStatusView({
  uan,
  name,
  ifsc,
  onReset,
}: {
  uan: string;
  name: string;
  ifsc: string;
  onReset: () => void;
}) {
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <main className="mx-auto flex w-[98vw] max-w-[1300px] flex-1 flex-col gap-5 py-6">
      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center gap-2 bg-[#157a72] px-4 py-2.5 text-[14px] font-bold text-white">
          <CheckCircle size={15} /> Currently Active KYC
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#eee] text-[#555]">
                {["UAN", "Document Type", "Name as per Document", "Document No", "IFSC", "Employer Name", "Status", "Sign Type", "Remarks"].map(
                  (h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#f3f3f3]">
                <td className="px-3 py-2.5">{uan}</td>
                <td className="px-3 py-2.5">Bank</td>
                <td className="px-3 py-2.5">{name}</td>
                <td className="px-3 py-2.5">--</td>
                <td className="px-3 py-2.5">{ifsc}</td>
                <td className="px-3 py-2.5">{today}</td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1 text-[#157a72]">
                    <User size={12} /> MEMBER
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1 text-[#1a7a3a]">
                    <CheckCircle size={12} /> KYC Verified
                  </span>
                </td>
                <td className="px-3 py-2.5">--</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center gap-2 bg-[#8a4b16] px-4 py-2.5 text-[14px] font-bold text-white">
          <RotateCcw size={14} /> KYC Pending for Approval
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#eee] text-[#555]">
                {["UAN", "Document Type", "Name as per Document", "Document No", "IFSC", "Document Expiry", "Seeded On", "Seeded By", "Status", "Remarks"].map(
                  (h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={10} className="px-3 py-4 text-center text-[#999]">
                  No records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded border border-[#d8d8d8] bg-white shadow-sm">
        <div className="flex items-center gap-2 bg-[#c0392b] px-4 py-2.5 text-[14px] font-bold text-white">
          <RotateCcw size={14} className="rotate-180" /> Rejected KYC
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#eee] text-[#555]">
                {["UAN", "Document Type", "Name as per Document", "Document No", "IFSC", "Document Expiry", "Seeded By", "Status", "Sign Type", "Action Time", "Remarks"].map(
                  (h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={11} className="px-3 py-4 text-center text-[#999]">
                  No records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-1 flex w-fit items-center gap-1.5 rounded-full border border-[#157a72] px-5 py-2 text-[13px] font-semibold text-[#157a72] hover:bg-[#eaf7f4]"
      >
        <RotateCcw size={14} /> Reset Simulation
      </button>
    </main>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-auto">
      <div className="flex items-center justify-end gap-5 border-t border-[#ddd] bg-white px-6 py-2 text-[13px] font-semibold text-[#157a72]">
        <span className="flex cursor-pointer items-center gap-1.5 hover:underline">
          <Phone size={14} /> Contact Us
        </span>
        <span className="flex cursor-pointer items-center gap-1.5 hover:underline">
          <HelpCircle size={14} /> FAQs
        </span>
      </div>
      <div className="bg-[#157a72] py-3 text-center text-[12px] leading-relaxed text-white">
        <p>©2015. Powered by EPFO Wed 06, September 2023 (PV 2.9.10)</p>
        <p>This site is best viewed at 1920 x 1080 resolution in Mozilla Firefox 58.0+</p>
      </div>
    </footer>
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
        className="relative z-10 inline-flex min-h-[72px] w-[min(84vw,34rem)] items-center justify-center rounded-[22px] bg-[#157a72] px-6 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(21,122,114,0.30)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0f5f59] disabled:cursor-wait disabled:opacity-80 sm:min-h-[78px] sm:px-8 sm:text-xl"
      >
        {starting ? "LOADING..." : "START EXPERIMENT"}
      </button>
    </div>
  );
}

// ─── Full-screen success tick overlay (brief, shown right when KYC is
// verified — the "tick at the top" completion cue) ─────────────────────────
function TickOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">
      <div
        className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
        style={{ animation: "epfReg15TickPop 0.4s ease-out" }}
      >
        <CheckCircle size={52} className="text-white" />
      </div>
      <p className="text-[18px] font-bold text-white">KYC Verified!</p>
      <style jsx>{`
        @keyframes epfReg15TickPop {
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

type View = "portal" | "kyc" | "otp" | "success";

// ─── Root page ──────────────────────────────────────────────────────────────
export default function EpfReg15Page() {
  const [launched, setLaunched] = useState(false);
  const [view, setView] = useState<View>("portal");
  const [showTick, setShowTick] = useState(false);
  const [kycDraft, setKycDraft] = useState<KycDraft | null>(null);

  // Admin-configured experiment values (Simulation Manager slug
  // "epf-reg-15", or the course editor's per-insert "Add/Edit Creds")
  // override the default Mr. Nagarjun Patel values when present.
  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const uanValue = findFieldValue(simConfig, /uan/i) || DEFAULT_UAN;
  const nameValue = findFieldValue(simConfig, /name/i) || DEFAULT_NAME;
  const dobValue = findFieldValue(simConfig, /dob|birth/i) || DEFAULT_DOB;
  const accountValue = findFieldValue(simConfig, /account/i) || DEFAULT_ACCOUNT;
  const ifscValue = findFieldValue(simConfig, /ifsc/i) || DEFAULT_IFSC;
  const panValue = findFieldValue(simConfig, /pan/i) || DEFAULT_PAN;
  const otpValue = findFieldValue(simConfig, /otp/i) || DEFAULT_OTP;
  const validateCreds = simConfig?.requireCredentialValidation ?? true;
  // No hardcoded fallback text — the banner only shows if an admin sets one.
  const bannerText = simConfig?.bannerText || "";

  const handleKycSubmit = (draft: KycDraft) => {
    setKycDraft(draft);
    setView("otp");
  };

  const handleOtpSuccess = () => {
    setShowTick(true);
    setTimeout(() => setShowTick(false), 1400);
    setView("success");
  };

  const handleReset = () => {
    setKycDraft(null);
    setView("portal");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <SimBanner />
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      {showTick && <TickOverlay />}

      <Header uan={uanValue} name={nameValue} />
      <NavBar onKycClick={() => setView("kyc")} onHomeClick={() => setView("portal")} />

      {view === "portal" && <PortalHome uan={uanValue} name={nameValue} dob={dobValue} />}
      {view === "kyc" && (
        <KycForm
          nameValue={nameValue}
          accountValue={accountValue}
          ifscValue={ifscValue}
          panValue={panValue}
          validateCreds={validateCreds}
          bannerText={bannerText}
          onSubmit={handleKycSubmit}
        />
      )}
      {view === "otp" && (
        <OtpEntryPage
          otpValue={otpValue}
          validateCreds={validateCreds}
          onCancel={handleReset}
          onSuccess={handleOtpSuccess}
        />
      )}
      {view === "success" && kycDraft && (
        <KycStatusView uan={uanValue} name={nameValue} ifsc={kycDraft.ifsc} onReset={handleReset} />
      )}

      <Footer />
    </div>
  );
}
