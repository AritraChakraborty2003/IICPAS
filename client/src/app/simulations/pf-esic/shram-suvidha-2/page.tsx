"use client";

import React, { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Menu, Bell, User, Calendar } from "lucide-react";

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
      <button type="button" onClick={handle} disabled={starting}
        className="relative z-10 inline-flex min-h-[72px] w-[min(84vw,34rem)] items-center justify-center rounded-[22px] bg-[#1244b8] px-6 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(18,68,184,0.30)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0f3a9a] disabled:cursor-wait disabled:opacity-80 sm:min-h-[78px] sm:px-8 sm:text-xl">
        {starting ? "LOADING..." : "START EXPERIMENT"}
      </button>
    </div>
  );
}

// ─── Top Bar ───────────────────────────────────────────────────────────────────
function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <div className="flex h-[52px] shrink-0 items-center border-b border-[#e0e0e0] bg-white px-4 shadow-sm">
      {/* Hamburger */}
      <button onClick={onToggleSidebar} className="mr-4 text-[#555] hover:text-[#222]">
        <Menu size={20} />
      </button>

      {/* Title — centred absolutely */}
      <div className="absolute left-1/2 -translate-x-1/2 select-none text-[20px] font-black tracking-tight"
        style={{ fontFamily: "'Arial Black', sans-serif" }}>
        <span className="text-[#1a6fa8]">SHRAM SUVIDHA</span>
        <span className="mx-2 text-[#555]">/</span>
        <span className="text-[#c0392b]">श्रम सुविधा</span>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2 text-[12px] text-[#333]">
        <button className="flex items-center gap-1 rounded border border-[#ccc] bg-[#f8f8f8] px-2.5 py-1 text-[11px] hover:bg-[#eee]">
          Post: External User <ChevronDown size={11} className="ml-0.5" />
        </button>
        <button className="flex items-center gap-1 rounded border border-[#ccc] bg-[#f8f8f8] px-2.5 py-1 text-[11px] hover:bg-[#eee]">
          Role: Establishment User <ChevronDown size={11} className="ml-0.5" />
        </button>
        <button className="flex items-center gap-1 rounded border border-[#ccc] bg-[#f8f8f8] px-2.5 py-1 text-[11px] hover:bg-[#eee]">
          🌐 English <ChevronDown size={11} className="ml-0.5" />
        </button>
        <Bell size={17} className="ml-1 text-[#555]" />
        <User size={17} className="ml-1 text-[#555]" />
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ open }: { open: boolean }) {
  const [expanded, setExpanded] = useState<string>("home");

  const toggle = (k: string) => setExpanded((p) => (p === k ? "" : k));

  return (
    <aside
      className={`shrink-0 overflow-hidden border-r border-[#e0e0e0] bg-white transition-all duration-200 ${open ? "w-[185px]" : "w-0"}`}
    >
      {/* Ministry logo block */}
      <div className="flex items-center gap-2 border-b border-[#e8e8e8] px-3 py-3">
        <img src="/images/simulations/satyamev-jayate.jpg" alt="Emblem"
          className="h-[38px] w-[38px] shrink-0 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="text-[10px] leading-[1.4] text-[#444]">
          <div className="font-bold text-[#222]">MINISTRY OF LABOUR &amp;</div>
          <div className="font-bold text-[#222]">EMPLOYMENT</div>
          <div className="text-[9px] text-[#666]">GOVERNMENT OF INDIA</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="py-1">
        {[
          { key: "home", label: "Home", children: ["Home"] },
          { key: "establishments", label: "Establishments", children: [] },
          { key: "registration", label: "Registration", children: [] },
          { key: "license", label: "License", children: [] },
        ].map(({ key, label, children }) => (
          <div key={key}>
            <button
              onClick={() => toggle(key)}
              className={`flex w-full items-center justify-between px-3 py-2 text-[13px] transition ${
                expanded === key ? "text-[#1a6fa8]" : "text-[#333]"
              } hover:bg-[#f0f4ff]`}
            >
              <span className="flex items-center gap-2">
                <span className={`h-[7px] w-[7px] rounded-full border-2 ${expanded === key ? "border-[#1a6fa8] bg-[#1a6fa8]" : "border-[#888] bg-white"}`} />
                {label}
              </span>
              {children.length > 0 && (expanded === key ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
            </button>
            {children.length > 0 && expanded === key && (
              <div className="bg-[#f8faff]">
                {children.map((c) => (
                  <div key={c} className="cursor-pointer py-1.5 pl-8 text-[12px] text-[#1a6fa8] hover:underline">
                    • {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ─── Reusable form primitives ──────────────────────────────────────────────────
function FLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="mb-1 block text-[13px] font-medium text-[#333]">
      {children} {req && <span className="text-[#e53e3e]">*</span>}
    </label>
  );
}

function FInput({ value, onChange, placeholder, disabled }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled}
      className="h-[36px] w-full rounded border border-[#ccc] bg-white px-3 text-[13px] text-[#333] outline-none placeholder:text-[#bbb] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8] disabled:bg-[#f5f5f5] disabled:text-[#999]" />
  );
}

function FSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-[36px] w-full appearance-none rounded border border-[#ccc] bg-white px-3 text-[13px] text-[#333] outline-none focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23888' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function VBtn({ label = "Verify" }: { label?: string }) {
  return (
    <button className="h-[36px] shrink-0 rounded bg-[#1a6fa8] px-4 text-[13px] font-semibold text-white hover:bg-[#155d8e]">
      {label}
    </button>
  );
}

function SecHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4 mt-6 border-b border-[#e8e8e8] pb-1">
      <span className="text-[15px] font-bold text-[#1a6fa8]">{title}</span>
      {sub && <span className="ml-2 text-[12px] text-[#888]">{sub}</span>}
    </div>
  );
}

// ─── Main edit form ────────────────────────────────────────────────────────────
function EditUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [f, setF] = useState({
    name: "ESI PF TESTING",
    nameAadhaar: "",
    nameRegional: "ESI PF TESTING",
    email: "student@iicpa.in",
    mobile: "9876543210",
    nationality: "Indian",
    lang: "Hindi",
    pan: "",
    nameOnPan: "",
    dob: "",
    premise: "",
    subLocality: "",
    locality: "",
    city: "",
    state: "Select State",
    district: "Select district",
    pincode: "Select Pincode",
    postOffice: "Select Post Office",
    lat: "",
    lng: "",
    ctType: "Mobile",
    ctValue: "9811111111",
    idType: "PAN",
    idValue: "AAAAA1234A",
    idName: "",
  });

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdate = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => { setSaved(false); onSuccess(); }, 1600); }, 900);
  };

  const now = new Date();
  const dtStr = `${now.getDate()} ${now.toLocaleString("en-IN", { month: "long" })} ${now.getFullYear()}, ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} am`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6fb]">
      {/* Breadcrumb bar */}
      <div className="flex items-center justify-between border-b border-[#e8e8e8] bg-white px-6 py-2">
        <div className="flex items-center gap-1 text-[12px] text-[#888]">
          <span className="cursor-pointer text-[#1a6fa8] hover:underline">User Management</span>
          <span className="mx-1 text-[#bbb]">/</span>
          <span className="text-[#555]">Edit</span>
        </div>
        <div className="text-[12px] font-semibold text-[#c0392b]">Date &amp; Time: {dtStr}</div>
      </div>

      {/* Form card */}
      <div className="mx-auto max-w-[1200px] px-6 py-5">
        <div className="rounded bg-white px-8 py-6 shadow-sm">
          <h2 className="mb-6 text-[18px] font-bold text-[#1a6fa8]">Edit User</h2>

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-6">
            <div><FLabel req>Name</FLabel><FInput value={f.name} onChange={set("name")} /></div>
            <div>
              <FLabel req>Name (as per Aadhaar)</FLabel>
              <div className="flex gap-2">
                <FInput value={f.nameAadhaar} onChange={set("nameAadhaar")} placeholder="Enter Name (as per Aadhaar)" />
                <VBtn />
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div><FLabel req>Name as per Regional Language</FLabel><FInput value={f.nameRegional} onChange={set("nameRegional")} /></div>
            <div><FLabel req>Email ID</FLabel><FInput value={f.email} onChange={set("email")} /></div>
          </div>

          {/* Row 3 */}
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div><FLabel req>Mobile No</FLabel><FInput value={f.mobile} onChange={set("mobile")} /></div>
            <div><FLabel req>Nationality</FLabel><FSelect value={f.nationality} onChange={set("nationality")} options={["Indian", "Foreign National"]} /></div>
          </div>

          {/* Row 4 — preferred lang (half width) */}
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <FLabel req>Preferred Language</FLabel>
              <FSelect value={f.lang} onChange={set("lang")} options={["Hindi", "English", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Odia", "Punjabi"]} />
            </div>
            <div />
          </div>

          {/* Row 5 — PAN / Name on PAN / DOB (3 cols) */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div><FLabel req>PAN</FLabel><FInput value={f.pan} onChange={set("pan")} /></div>
            <div><FLabel req>Name as on PAN</FLabel><FInput value={f.nameOnPan} onChange={set("nameOnPan")} /></div>
            <div>
              <FLabel req>Date of Birth (DD-MM-YYYY)</FLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input value={f.dob} onChange={(e) => set("dob")(e.target.value)} placeholder="DD-MM-YYYY"
                    className="h-[36px] w-full rounded border border-[#ccc] bg-white px-3 pr-8 text-[13px] text-[#333] outline-none placeholder:text-[#bbb] focus:border-[#1a6fa8] focus:ring-1 focus:ring-[#1a6fa8]" />
                  <Calendar size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#999]" />
                </div>
                <VBtn />
              </div>
            </div>
          </div>

          {/* ─ Office Address ─ */}
          <SecHead title="Office Address" sub="(Please fill proper address and Pin Code to get actual Geo-coordinates)" />

          <div className="grid grid-cols-2 gap-6">
            <div><FLabel req>Premise Number / Name</FLabel><FInput value={f.premise} onChange={set("premise")} placeholder="Enter Premise Number / Name" /></div>
            <div><FLabel>Sub Locality / Street / Colony Name</FLabel><FInput value={f.subLocality} onChange={set("subLocality")} placeholder="Enter Sub Locality / Street / Colony Name" /></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div><FLabel>Locality / Landmark</FLabel><FInput value={f.locality} onChange={set("locality")} placeholder="Enter Locality / Landmark" /></div>
            <div><FLabel req>City / Town / Village</FLabel><FInput value={f.city} onChange={set("city")} placeholder="Enter City / Town / Village" /></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div><FLabel req>State</FLabel><FSelect value={f.state} onChange={set("state")} options={["Select State", "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Uttar Pradesh", "Gujarat", "Rajasthan", "Punjab", "Bihar"]} /></div>
            <div><FLabel req>District</FLabel><FSelect value={f.district} onChange={set("district")} options={["Select district", "Central", "New Delhi", "South", "North", "East", "West"]} /></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div><FLabel req>Pincode</FLabel><FSelect value={f.pincode} onChange={set("pincode")} options={["Select Pincode", "110001", "110002", "110003", "400001", "560001", "600001", "700001"]} /></div>
            <div><FLabel req>Post Office Name</FLabel><FSelect value={f.postOffice} onChange={set("postOffice")} options={["Select Post Office", "New Delhi HO", "Connaught Place SO", "Parliament Street SO"]} /></div>
          </div>
          <div className="mt-4">
            <FLabel>Geo Co-ordinates</FLabel>
            <div className="grid grid-cols-2 gap-6">
              <FInput value={f.lat} onChange={set("lat")} placeholder="Enter Latitude" />
              <FInput value={f.lng} onChange={set("lng")} placeholder="Enter Longitude" />
            </div>
          </div>

          {/* ─ eContact ─ */}
          <SecHead title="eContact" />
          <div className="overflow-hidden rounded border border-[#ddd]">
            <table className="w-full text-[13px]">
              <thead className="bg-[#f5f5f5]">
                <tr>
                  {["S No.", "Contact Type", "Contact Value", "Actions"].map((h) => (
                    <th key={h} className="border-r border-[#ddd] px-4 py-2 text-left text-[12px] font-semibold text-[#555] last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#ddd]">
                  <td className="border-r border-[#ddd] px-4 py-2 text-[#777]"></td>
                  <td className="border-r border-[#ddd] px-4 py-2 w-[200px]">
                    <FSelect value={f.ctType} onChange={set("ctType")} options={["Mobile", "Email", "Fax"]} />
                  </td>
                  <td className="border-r border-[#ddd] px-4 py-2">
                    <FInput value={f.ctValue} onChange={set("ctValue")} />
                  </td>
                  <td className="px-4 py-2">
                    <button className="flex h-[26px] w-[26px] items-center justify-center rounded bg-[#1a6fa8] text-[18px] font-bold leading-none text-white hover:bg-[#155d8e]">+</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ─ Identifier Type ─ */}
          <SecHead title="Identifier Type" />
          <div className="overflow-hidden rounded border border-[#ddd]">
            <table className="w-full text-[13px]">
              <thead className="bg-[#f5f5f5]">
                <tr>
                  {["Sr. No.", "Identifier Type", "Identifier Value", "Name as on Identifier", "Actions"].map((h) => (
                    <th key={h} className="border-r border-[#ddd] px-4 py-2 text-left text-[12px] font-semibold text-[#555] last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#ddd]">
                  <td className="border-r border-[#ddd] px-4 py-2 text-[#777]"></td>
                  <td className="border-r border-[#ddd] px-4 py-2 w-[160px]">
                    <FSelect value={f.idType} onChange={set("idType")} options={["PAN", "Aadhaar", "Passport", "Voter ID", "Driving Licence"]} />
                  </td>
                  <td className="border-r border-[#ddd] px-4 py-2 w-[160px]">
                    <FInput value={f.idValue} onChange={set("idValue")} />
                  </td>
                  <td className="border-r border-[#ddd] px-4 py-2">
                    <FInput value={f.idName} onChange={set("idName")} placeholder="Enter Name as on Identifier" />
                    {!f.idName && <p className="mt-0.5 text-[10px] text-[#e53e3e]">Name as on identifier is required</p>}
                  </td>
                  <td className="px-4 py-2">
                    <button className="flex h-[26px] w-[26px] items-center justify-center rounded bg-[#1a6fa8] text-[18px] font-bold leading-none text-white hover:bg-[#155d8e]">+</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Previous / Update */}
          <div className="mt-8 flex justify-end gap-3">
            <button className="rounded border border-[#ccc] bg-white px-6 py-2 text-[13px] font-semibold text-[#555] hover:bg-[#f5f5f5]">Previous</button>
            <button onClick={handleUpdate} disabled={saving || saved}
              className="flex min-w-[88px] items-center justify-center gap-1.5 rounded bg-[#1a6fa8] px-6 py-2 text-[13px] font-semibold text-white transition hover:bg-[#155d8e] disabled:opacity-75">
              {saved ? <><CheckCircle size={14} className="text-green-300" /> Updated!</>
                : saving ? "Saving…" : "Update"}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#aaa]">
          ©2026 Ministry of Labour and Employment. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────────
function UpdateSuccess() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#f4f6fb]">
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
      <TopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} />
        {/* Green right border accent — visible in screenshot */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {done ? <UpdateSuccess /> : <EditUserForm onSuccess={() => setDone(true)} />}
          </div>
          <div className="w-[4px] shrink-0 bg-[#2ecc71]" />
        </div>
      </div>
    </div>
  );
}
