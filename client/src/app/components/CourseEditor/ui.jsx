"use client";
import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export const Spinner = ({ className = "h-5 w-5" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

export const Card = ({ title, subtitle, actions, children, className = "" }) => (
  <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
    {(title || actions) && (
      <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
        <div>
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className="p-6">{children}</div>
  </section>
);

export const Field = ({ label, required, hint, error, children }) => (
  <label className="block">
    <span className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
    {hint && !error && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
  </label>
);

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition disabled:bg-slate-50";

const BTN = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
  dark: "bg-[#1a237e] text-white hover:bg-[#283593] border-[#1a237e]",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  ai: "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700 border-transparent",
  outline: "bg-white text-slate-700 hover:bg-slate-50 border-slate-300",
  danger: "bg-white text-red-600 hover:bg-red-50 border-red-200",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent",
};

export const Btn = ({ variant = "outline", size = "md", className = "", loading, children, ...props }) => (
  <button
    type="button"
    {...props}
    disabled={props.disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
      size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
    } ${BTN[variant]} ${className}`}
  >
    {loading && <Spinner className="h-4 w-4" />}
    {children}
  </button>
);

export const Badge = ({ className = "", children }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${className}`}>
    {children}
  </span>
);

export const Modal = ({ open, onClose, title, subtitle, children, footer, size = "xl", bodyClassName = "" }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl", full: "max-w-[96vw]" }[size];
  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-slate-900/60 p-2 sm:p-4" onMouseDown={onClose}>
      <div
        className={`flex max-h-[95vh] w-full ${width} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <FaTimes />
          </button>
        </header>
        <div className={`flex-1 overflow-y-auto ${bodyClassName || "p-6"}`}>{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">{footer}</footer>}
      </div>
    </div>
  );
};

/** Full-card loading state shown while the AI workflow runs */
export const GeneratingPanel = ({ label = "Generating with IICPA AI", elapsed, onCancel }) => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 px-6 py-12 text-center">
    <div className="relative">
      <div className="h-14 w-14 rounded-full border-4 border-violet-200" />
      <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-violet-600" />
    </div>
    <div>
      <p className="text-base font-semibold text-slate-800">{label}…</p>
      <p className="mt-1 text-sm text-slate-500">
        Waiting for the AI workflow{elapsed ? ` · ${elapsed}` : ""}. This usually takes under a minute.
      </p>
    </div>
    {onCancel && (
      <Btn size="sm" variant="ghost" onClick={onCancel}>
        Stop waiting
      </Btn>
    )}
  </div>
);
