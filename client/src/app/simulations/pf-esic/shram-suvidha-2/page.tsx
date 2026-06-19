"use client";

import React, { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Menu, Bell, User, Calendar } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type SideKey = "home" | "establishments" | "registration" | "license";

// ─── Launch Overlay ────────────────────────────────────────────────────────────
function LaunchOverlay({ onStart }: { onStart: () => void }) {
  const [starting, setStarting] = useState(false);
  const handle = () => {
    if (starting) return;
    setStarting(true);
    setTimeout(onStart, 1200);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#07111f]/25 backdrop-blur-[2px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_30%),linear-gradient(135deg,rgba(7,17,31,0.16)_0%,rgba(11,27,51,0.12)_50%,rgba(8,17,31,0.16)_100%)]" />
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

// ─── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <div className="flex h-[56px] items-center justify-between border-b border-[#e0e0e0] bg-white px-4 shadow-sm">
      {/* Left: hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 text-[#555] hover:text-[#222]">
        <Menu size={22} />
      </button>

      {/* Centre: portal title */}
      <div className="absolute left-1/2 -translate-x-1/2 text-[22px] font-black tracking-tight text-[#1a6fa8]"
        style={{ fontFamily: "'Arial Black', sans-serif" }}>
        SHRAM SUVIDHA / <span className="text-[#c0392b]">श्रम सुविधा</span>
      </div>

      {/* Right: user controls */}
      <div className="flex items-center gap-3 text-[12px] text-[#333]">
        <button className="flex items-center gap-1 rounded border border-[#ccc] bg-[#f5f5f5] px-2 py-1 hover:bg-[#e9e9e9]">
          Post: External User <ChevronDown size={12} />
        </button>
        <button className="flex items-center gap-1 rounded border border-[#ccc] bg-[#f5f5f5] px-2 py-1 hover:bg-[#e9e9e9]">
          Role: Establishment User <ChevronDown size={12} />
        </button>
        <button className="flex items-center gap-1 rounded border border-[#ccc] bg-[#f5f5f5] px-2 py-1 hover:bg-[#e9e9e9]">
          🌐 English <ChevronDown size={12} />
        </button>
        <Bell size={18} className="text-[#555]" />
        <User size={18} className="text-[#555]" />
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ open }: { open: boolean }) {
  const [expanded, setExpanded] = useState<SideKey>("home");

  const toggle = (key: SideKey) => setExpanded((p) => (p === key ? ("" as SideKey) : key));

  const Item = ({ k, label, children }: { k: SideKey; label: string; children?: string[] }) => (
    <div>
      <button
        onClick={() => toggle(k)}
        className={`flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold transition hover:bg-[#e8f0fe] ${expanded === k ? "bg-[#e8f0fe] text-[#1a6fa8]" : "text-[#333]"}`}
      >
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {label}
        </span>
        {children && (expanded === k ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>
      {children && expanded === k && (
        <div className="bg-[#f5f7ff]">
          {children.map((c) => (
            <div key={c} className="cursor-pointer py-2 pl-10 text-[12px] text-[#1a6fa8] hover:underline">
              • {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <aside className={`${open ? "w-[200px]" : "w-0 overflow-hidden"} shrink-0 border-r border-[#e0e0e0] bg-white transition-all duration-200`}>
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-[#e0e0e0] px-3 py-3">
        <img src="/images/simulations/satyamev-jayate.jpg" alt="Emblem"
          className="h-10 w-10 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="text-[10px] leading-tight text-[#444]">
          <div className="font-bold text-[#333]">MINISTRY OF LABOUR &amp;</div>
          <div className="font-bold text-[#333]">EMPLOYMENT</div>
          <div>GOVERNMENT OF INDIA</div>
        </div>
      </div>

      <nav className="py-2">
        <Item k="home" label="Home" children={["Home"]} />
        <Item k="establishments" label="Establishments" />
        <Item k="registration" label="Registration" />
        <Item k="license" label="License" />
      </nav>
    </aside>
  );
}

// ─── Field components ──────────────────────────────────────────────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="mb-1 block text-[13px] font-medium text-[#333]">
      {text} {required && <span className="text-[#e53e3e]">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, disabled }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-[38px] w-full rounded border border-[#ccc] bg-white px-3 text-[13px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8] disabled:bg-[#f5f5f5] disabled:text-[#999]"
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[38px] w-full rounded border border-[#ccc] bg-white px-3 text-[13px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function VerifyBtn({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="h-[38px] rounded bg-[#1a6fa8] px-4 text-[13px] font-semibold text-white hover:bg-[#155d8e]">
      Verify
    </button>
  );
}

function SectionTitle({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="mb-4 mt-6">
      <h3 className="text-[16px] font-bold text-[#1a6fa8]">
        {text} {sub && <span className="text-[13px] font-normal text-[#888]">{sub}</span>}
      </h3>
    </div>
  );
}

// ─── Edit User Form ────────────────────────────────────────────────────────────
function EditUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "ESI PF TESTING",
    nameAadhaar: "",
    nameRegional: "ESI PF TESTING",
    email: "student@iicpa.in",
    mobile: "9876543210",
    nationality: "Indian",
    preferredLang: "Hindi",
    pan: "",
    nameOnPan: "",
    dob: "",
    // Office Address
    premise: "",
    subLocality: "",
    locality: "",
    city: "",
    state: "Select State",
    district: "Select district",
    pincode: "Select Pincode",
    postOffice: "Select Post Office",
    latitude: "",
    longitude: "",
    // eContact
    contactType: "Mobile",
    contactValue: "9811111111",
    // Identifier
    identifierType: "PAN",
    identifierValue: "AAAAA1234A",
    nameOnIdentifier: "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (v: string) => setForm((p) => ({ ...p, [key]: v })),
  });

  const handleUpdate = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSuccess();
      }, 1600);
    }, 900);
  };

  const now = new Date();
  const dateTimeStr = `${now.getDate()} ${now.toLocaleString("en-IN", { month: "long" })} ${now.getFullYear()}, ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} am`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6fb] p-6">
      {/* Breadcrumb + date */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[12px] text-[#888]">
          <span className="cursor-pointer text-[#1a6fa8] hover:underline">User Management</span>
          <span className="mx-1">/</span>
          <span className="text-[#555]">Edit</span>
        </div>
        <div className="text-[12px] font-semibold text-[#c0392b]">
          Date &amp; Time: {dateTimeStr}
        </div>
      </div>

      {/* Card */}
      <div className="rounded-lg bg-white px-8 py-6 shadow-sm">
        <h2 className="mb-6 text-[20px] font-bold text-[#1a6fa8]">Edit User</h2>

        {/* Row 1: Name + Name as per Aadhaar */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label text="Name" required />
            <Input {...f("name")} />
          </div>
          <div>
            <Label text="Name (as per Aadhaar)" required />
            <div className="flex gap-2">
              <Input {...f("nameAadhaar")} placeholder="Enter Name (as per Aadhaar)" />
              <VerifyBtn />
            </div>
          </div>
        </div>

        {/* Row 2: Name Regional + Email */}
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <Label text="Name as per Regional Language" required />
            <Input {...f("nameRegional")} />
          </div>
          <div>
            <Label text="Email ID" required />
            <Input {...f("email")} />
          </div>
        </div>

        {/* Row 3: Mobile + Nationality */}
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <Label text="Mobile No" required />
            <Input {...f("mobile")} />
          </div>
          <div>
            <Label text="Nationality" required />
            <Select {...f("nationality")} options={["Indian", "Foreign National"]} />
          </div>
        </div>

        {/* Row 4: Preferred Language */}
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <Label text="Preferred Language" required />
            <Select {...f("preferredLang")} options={["Hindi", "English", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Odia", "Punjabi"]} />
          </div>
          <div /> {/* spacer */}
        </div>

        {/* Row 5: PAN + Name on PAN + DOB */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <Label text="PAN" required />
            <Input {...f("pan")} placeholder="" />
          </div>
          <div>
            <Label text="Name as on PAN" required />
            <Input {...f("nameOnPan")} placeholder="" />
          </div>
          <div>
            <Label text="Date of Birth (DD-MM-YYYY)" required />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={form.dob}
                  onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                  placeholder="DD-MM-YYYY"
                  className="h-[38px] w-full rounded border border-[#ccc] bg-white px-3 pr-8 text-[13px] text-[#333] outline-none placeholder:text-[#aaa] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
                />
                <Calendar size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888]" />
              </div>
              <VerifyBtn />
            </div>
          </div>
        </div>

        {/* ── Office Address ── */}
        <SectionTitle text="Office Address" sub="(Please fill proper address and Pin Code to get actual Geo-coordinates)" />

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label text="Premise Number / Name" required />
            <Input {...f("premise")} placeholder="Enter Premise Number / Name" />
          </div>
          <div>
            <Label text="Sub Locality / Street / Colony Name" />
            <Input {...f("subLocality")} placeholder="Enter Sub Locality / Street / Colony Name" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <Label text="Locality / Landmark" />
            <Input {...f("locality")} placeholder="Enter Locality / Landmark" />
          </div>
          <div>
            <Label text="City / Town / Village" required />
            <Input {...f("city")} placeholder="Enter City / Town / Village" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <Label text="State" required />
            <Select {...f("state")} options={["Select State", "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Uttar Pradesh", "Gujarat", "Rajasthan", "Punjab", "Bihar"]} />
          </div>
          <div>
            <Label text="District" required />
            <Select {...f("district")} options={["Select district", "Central", "New Delhi", "South", "North", "East", "West"]} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <Label text="Pincode" required />
            <Select {...f("pincode")} options={["Select Pincode", "110001", "110002", "110003", "400001", "560001", "600001", "700001"]} />
          </div>
          <div>
            <Label text="Post Office Name" required />
            <Select {...f("postOffice")} options={["Select Post Office", "New Delhi HO", "Connaught Place SO", "Parliament Street SO"]} />
          </div>
        </div>

        {/* Geo co-ordinates */}
        <div className="mt-4">
          <Label text="Geo Co-ordinates" />
          <div className="grid grid-cols-2 gap-6">
            <Input {...f("latitude")} placeholder="Enter Latitude" />
            <Input {...f("longitude")} placeholder="Enter Longitude" />
          </div>
        </div>

        {/* ── eContact ── */}
        <SectionTitle text="eContact" />
        <div className="overflow-hidden rounded border border-[#ddd]">
          <table className="w-full text-[13px]">
            <thead className="bg-[#f5f5f5] text-[#555]">
              <tr>
                <th className="border-r border-[#ddd] px-4 py-2 text-left font-semibold">S No.</th>
                <th className="border-r border-[#ddd] px-4 py-2 text-left font-semibold">Contact Type</th>
                <th className="border-r border-[#ddd] px-4 py-2 text-left font-semibold">Contact Value</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#ddd]">
                <td className="border-r border-[#ddd] px-4 py-2 text-[#777]">1</td>
                <td className="border-r border-[#ddd] px-4 py-2">
                  <Select value={form.contactType} onChange={(v) => setForm((p) => ({ ...p, contactType: v }))} options={["Mobile", "Email", "Fax"]} />
                </td>
                <td className="border-r border-[#ddd] px-4 py-2">
                  <Input value={form.contactValue} onChange={(v) => setForm((p) => ({ ...p, contactValue: v }))} />
                </td>
                <td className="px-4 py-2">
                  <button className="flex h-[28px] w-[28px] items-center justify-center rounded bg-[#1a6fa8] text-white text-xl font-bold hover:bg-[#155d8e]">+</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Identifier Type ── */}
        <SectionTitle text="Identifier Type" />
        <div className="overflow-hidden rounded border border-[#ddd]">
          <table className="w-full text-[13px]">
            <thead className="bg-[#f5f5f5] text-[#555]">
              <tr>
                <th className="border-r border-[#ddd] px-4 py-2 text-left font-semibold">Sr. No.</th>
                <th className="border-r border-[#ddd] px-4 py-2 text-left font-semibold">Identifier Type</th>
                <th className="border-r border-[#ddd] px-4 py-2 text-left font-semibold">Identifier Value</th>
                <th className="border-r border-[#ddd] px-4 py-2 text-left font-semibold">Name as on Identifier</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#ddd]">
                <td className="border-r border-[#ddd] px-4 py-2 text-[#777]">1</td>
                <td className="border-r border-[#ddd] px-4 py-2">
                  <Select value={form.identifierType} onChange={(v) => setForm((p) => ({ ...p, identifierType: v }))} options={["PAN", "Aadhaar", "Passport", "Voter ID", "Driving Licence"]} />
                </td>
                <td className="border-r border-[#ddd] px-4 py-2">
                  <Input value={form.identifierValue} onChange={(v) => setForm((p) => ({ ...p, identifierValue: v }))} />
                </td>
                <td className="border-r border-[#ddd] px-4 py-2">
                  <div>
                    <Input value={form.nameOnIdentifier} onChange={(v) => setForm((p) => ({ ...p, nameOnIdentifier: v }))} placeholder="Enter Name as on Identifier" />
                    {!form.nameOnIdentifier && (
                      <p className="mt-0.5 text-[10px] text-[#e53e3e]">Name as on identifier is required</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <button className="flex h-[28px] w-[28px] items-center justify-center rounded bg-[#1a6fa8] text-white text-xl font-bold hover:bg-[#155d8e]">+</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Previous / Update buttons ── */}
        <div className="mt-8 flex justify-end gap-3">
          <button className="rounded border border-[#ccc] bg-white px-6 py-2 text-[13px] font-semibold text-[#555] hover:bg-[#f5f5f5]">
            Previous
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving || saved}
            className="flex min-w-[90px] items-center justify-center gap-2 rounded bg-[#1a6fa8] px-6 py-2 text-[13px] font-semibold text-white transition hover:bg-[#155d8e] disabled:opacity-80"
          >
            {saved
              ? <><CheckCircle size={15} className="text-green-300" /> Updated!</>
              : saving
              ? "Saving..."
              : "Update"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-[11px] text-[#999]">
        ©2026 Ministry of Labour and Employment. All rights reserved.
      </p>
    </div>
  );
}

// ─── Success Screen (green tick centred) ──────────────────────────────────────
function UpdateSuccess() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#f4f6fb] py-24">
      <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.18),0_0_0_22px_rgba(34,197,94,0.08)]">
        <svg viewBox="0 0 52 52" className="h-[58px] w-[58px]" fill="none">
          <polyline points="14,27 23,36 38,18" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="mt-6 text-[22px] font-bold text-[#1a7a3a]">Profile Updated!</p>
      <p className="mt-1 text-[14px] text-[#555]">Your changes have been saved successfully.</p>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function ShramSuvidha2Page() {
  const [launched, setLaunched] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [done, setDone] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f6fb]">
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}

      <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} />
        {done
          ? <UpdateSuccess />
          : <EditUserForm onSuccess={() => setDone(true)} />
        }
      </div>
    </div>
  );
}
