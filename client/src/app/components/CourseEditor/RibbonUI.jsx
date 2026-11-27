"use client";
// Small building blocks for the editor ribbon (Office-style grouped toolbar).
// Every control prevents mousedown default so the editor keeps its selection.
import React from "react";

const keep = (e) => e.preventDefault();

export const RibbonGroup = ({ label, children, className = "" }) => (
  <div className={`flex shrink-0 flex-col items-stretch border-r border-slate-200 px-2 last:border-r-0 ${className}`}>
    <div className="flex flex-1 items-center gap-0.5">{children}</div>
    <div className="mt-1 text-center text-[11px] font-medium text-slate-500">{label}</div>
  </div>
);

/** Large button: icon above label (Insert / Design / Interactive / AI / Review) */
export const BigBtn = ({ icon, label, onClick, title, active, disabled, badge }) => (
  <button
    type="button"
    onMouseDown={keep}
    onClick={onClick}
    disabled={disabled}
    title={title || label}
    className={`relative flex min-w-[54px] flex-col items-center justify-start gap-1 rounded-md px-1.5 py-1 text-[11.5px] leading-tight text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 ${
      active ? "bg-blue-100 text-blue-700" : ""
    }`}
  >
    <span className="text-[19px] leading-none text-blue-600">{icon}</span>
    <span className="max-w-[72px] whitespace-normal text-center">{label}</span>
    {badge && <span className="absolute -right-0.5 -top-0.5 rounded bg-violet-600 px-1 text-[9px] font-bold text-white">{badge}</span>}
  </button>
);

/** Small icon button (Home tab formatting) */
export const IconBtn = ({ icon, onClick, title, active, disabled, className = "" }) => (
  <button
    type="button"
    onMouseDown={keep}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    aria-pressed={active || undefined}
    className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-md px-1.5 text-[15px] text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 ${
      active ? "bg-blue-100 text-blue-700" : ""
    } ${className}`}
  >
    {icon}
  </button>
);

/** Large style tile ("Heading", "Sub-heading", "Normal text") */
export const StyleTile = ({ label, onClick, className = "", title }) => (
  <button
    type="button"
    onMouseDown={keep}
    onClick={onClick}
    title={title || label}
    className={`h-[52px] min-w-[86px] rounded-lg border border-slate-200 bg-white px-3 text-slate-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 ${className}`}
  >
    {label}
  </button>
);

export const RSelect = ({ value, onChange, options, title, className = "", placeholder }) => (
  <select
    value={value ?? ""}
    title={title}
    aria-label={title}
    onChange={(e) => onChange(e.target.value)}
    className={`h-8 rounded-md border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none hover:border-blue-400 focus:border-blue-500 ${className}`}
  >
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      return (
        <option key={v} value={v}>
          {l}
        </option>
      );
    })}
  </select>
);

/** Colour button: icon with a colour bar; clicking opens the native colour picker */
export const ColorBtn = ({ icon, value, onChange, title }) => (
  <label
    title={title}
    onMouseDown={(e) => e.stopPropagation()}
    className="relative inline-flex h-8 w-8 cursor-pointer flex-col items-center justify-center rounded-md text-slate-700 hover:bg-blue-50"
  >
    <span className="text-[14px] leading-none">{icon}</span>
    <span className="mt-0.5 h-[3px] w-5 rounded" style={{ background: value }} />
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="absolute inset-0 cursor-pointer opacity-0"
      aria-label={title}
    />
  </label>
);

/** Dropdown menu button (e.g. Columns ▾, Table ▾, Shapes ▾) */
export function MenuBtn({ icon, label, items, title }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <BigBtn icon={icon} label={`${label} ▾`} title={title || label} onClick={() => setOpen((o) => !o)} active={open} />
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 min-w-[190px] rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
          {items.map((it, i) =>
            it === "-" ? (
              <div key={`sep-${i}`} className="my-1 border-t border-slate-100" />
            ) : (
              <button
                key={it.label}
                type="button"
                onMouseDown={keep}
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-slate-700 hover:bg-blue-50 disabled:opacity-40"
              >
                {it.icon && <span className="w-5 text-center">{it.icon}</span>}
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
