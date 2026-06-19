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
    <div className="relative flex h-[52px] shrink-0 items-center border-b border-[#e0e0e0] bg-white shadow-sm">
      {/* Hamburger — always visible on the far left */}
      <button
        onClick={onToggleSidebar}
        className="flex h-full w-[48px] shrink-0 items-center justify-center text-[#555] hover:bg-[#f5f5f5] hover:text-[#222]"
      >
        <Menu size={20} />
      </button>

      {/* Title — centred in the full bar */}
      <div className="absolute left-1/2 -translate-x-1/2 select-none text-[20px] font-black tracking-tight"
        style={{ fontFamily: "'Arial Black', sans-serif" }}>
        <span className="text-[#1a6fa8]">SHRAM SUVIDHA</span>
        <span className="mx-2 text-[#555]">/</span>
        <span className="text-[#c0392b]">श्रम सुविधा</span>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2 pr-4 text-[12px] text-[#333]">
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
function Sidebar({ open, onHomeClick, mainView }: {
  open: boolean;
  onHomeClick: () => void;
  mainView: "edit" | "welcome" | "success";
}) {
  const [expanded, setExpanded] = useState<string>("home");
  const toggle = (k: string) => setExpanded((p) => (p === k ? "" : k));

  const items = [
    { key: "home",           label: "Home",           children: ["Home"] },
    { key: "establishments", label: "Establishments", children: ["Establishments"] },
    { key: "registration",   label: "Registration",   children: ["Registration"] },
    { key: "license",        label: "License",        children: ["License"] },
  ];

  return (
    <aside className={`shrink-0 overflow-hidden border-r border-[#ddd] bg-white transition-all duration-200 ${open ? "w-[240px]" : "w-0"}`}>
      {/* Ministry logo */}
      <div className="flex items-start gap-2 px-3 py-4">
        <img src="/images/simulations/satyamev-jayate.jpg" alt="Emblem"
          className="mt-0.5 h-[42px] w-[42px] shrink-0 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="text-[10px] leading-[1.5] text-[#333]">
          <div className="font-bold">MINISTRY OF LABOUR &</div>
          <div className="font-bold">EMPLOYMENT</div>
          <div className="text-[9px] text-[#666]">GOVERNMENT OF INDIA</div>
        </div>
      </div>

      {/* Nav items — exact match to screenshot */}
      <nav className="border-t border-[#e8e8e8]">
        {items.map(({ key, label, children }) => {
          const isHome = key === "home";
          const isExpanded = expanded === key;
          return (
            <div key={key}>
              <button
                onClick={() => { toggle(key); if (isHome) onHomeClick(); }}
                className={`flex w-full items-center justify-between border-b border-[#ececec] py-[9px] pl-3 pr-2 text-[13px] text-[#333] hover:bg-[#f5f5f5]`}
              >
                <span className="flex items-center gap-2">
                  {/* Bullet dot */}
                  <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#555]" />
                  <span className="font-medium">{label}</span>
                </span>
                {isExpanded ? <ChevronUp size={13} className="text-[#888]" /> : <ChevronDown size={13} className="text-[#888]" />}
              </button>

              {/* Sub-items */}
              {isExpanded && (
                <div className="border-b border-[#ececec] bg-[#fafafa]">
                  {children.map((c) => (
                    <button key={c} onClick={() => { if (isHome) onHomeClick(); }}
                      className={`block w-full py-[7px] pl-8 text-left text-[12px] hover:bg-[#f0f4ff]
                        ${mainView === "welcome" && isHome ? "font-semibold text-[#1a6fa8]" : "text-[#555]"}
                      `}>
                      • {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── Welcome / Home page (4 cards) ────────────────────────────────────────────
function WelcomePage({ onEditClick }: { onEditClick: () => void }) {
  const [tickCard, setTickCard] = useState<string | null>(null);

  const handleViewDetails = (title: string) => {
    setTickCard(title);
    setTimeout(() => {
      setTickCard(null);
      onEditClick();
    }, 1600);
  };
  const cards = [
    {
      color: "#1a6fa8",
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75a2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
        </svg>
      ),
      title: "Registration",
      subtitle: "OSH & WC Code, 2020",
      items: ["Account & Authentication", "Establishment Identity", "Establishment Details"],
    },
    {
      color: "#27ae60",
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286z" />
        </svg>
      ),
      title: "Licence",
      subtitle: "Form XII",
      items: ["Contractor Details", "Principal Employer Details", "Work Details"],
    },
    {
      color: "#8e44ad",
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      title: "Returns",
      subtitle: "Form IX",
      items: ["General Information", "Hours of Work", "Manpower Details"],
    },
    {
      color: "#e67e22",
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      title: "Notices",
      subtitle: "Notices",
      items: ["Notice Details", "Employer Details", "Work Details"],
    },
  ];

  return (
    <div className="relative flex-1 overflow-y-auto bg-[#f4f6fb]">
      {/* Green tick overlay — high z-index, centred above everything */}
      {tickCard && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[3px]">
          <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.18),0_0_0_22px_rgba(34,197,94,0.08)]">
            <svg viewBox="0 0 52 52" className="h-[58px] w-[58px]" fill="none">
              <polyline points="14,27 23,36 38,18" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-5 text-[20px] font-bold text-green-700">{tickCard} Selected!</p>
          <p className="mt-1 text-[13px] text-[#666]">Opening details…</p>
        </div>
      )}
      {/* Breadcrumb */}
      <div className="flex items-center justify-between border-b border-[#e8e8e8] bg-white px-6 py-2">
        <div className="text-[12px] text-[#888]">
          <span className="cursor-pointer text-[#1a6fa8] hover:underline" onClick={onEditClick}>Welcome Page</span>
        </div>
        <div className="text-[12px] font-semibold text-[#c0392b]">
          Date &amp; Time: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}, {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} am
        </div>
      </div>

      <div className="p-6">
        {/* Pre-Requisites label row */}
        <div className="mb-3 grid grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.title} className="text-center text-[11px] font-semibold uppercase tracking-wider text-[#888]">
              Pre-Requisites
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.title} className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm">
              {/* Icon header */}
              <div className="flex flex-col items-center justify-center py-5" style={{ color: card.color }}>
                {card.icon}
              </div>
              {/* Title */}
              <div className="border-t border-[#eee] px-3 pb-1 pt-2 text-center">
                <div className="text-[14px] font-bold" style={{ color: card.color }}>{card.title}</div>
                <div className="text-[11px] text-[#888]">{card.subtitle}</div>
              </div>
              {/* Items */}
              <div className="flex-1 px-3 pb-3">
                {card.items.map((item) => (
                  <div key={item} className="flex items-start gap-1.5 py-1 text-[11px] text-[#555]">
                    <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#ccc]" />
                    {item}
                  </div>
                ))}
              </div>
              {/* View Details button */}
              <div className="px-3 pb-3">
                <button
                  onClick={() => handleViewDetails(card.title)}
                  className="w-full rounded py-1.5 text-[12px] font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: card.color }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
  const [mainView, setMainView] = useState<"edit" | "welcome" | "success">("edit");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f6fb]">
      {!launched && <LaunchOverlay onStart={() => setLaunched(true)} />}
      <TopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onHomeClick={() => setMainView("welcome")}
          mainView={mainView}
        />
        {/* Green right border accent */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {mainView === "welcome" && <WelcomePage onEditClick={() => setMainView("edit")} />}
            {mainView === "edit"    && <EditUserForm onSuccess={() => setMainView("success")} />}
            {mainView === "success" && <UpdateSuccess />}
          </div>
          <div className="w-[4px] shrink-0 bg-[#2ecc71]" />
        </div>
      </div>
    </div>
  );
}
