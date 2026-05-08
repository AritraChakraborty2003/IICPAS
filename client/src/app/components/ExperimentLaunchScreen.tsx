"use client";

import React from "react";

type ExperimentLaunchScreenProps = {
  title?: string;
  subtitle?: string;
  onStart: () => void;
  buttonLabel?: string;
  accent?: "blue" | "indigo" | "emerald" | "cyan";
  disabled?: boolean;
};

const accentMap = {
  blue: {
    ring: "border-sky-300/25",
    glow: "bg-sky-400/25",
    button: "bg-[#1244b8] hover:bg-[#0f3a9a] shadow-[0_24px_60px_rgba(18,68,184,0.45)]",
  },
  indigo: {
    ring: "border-indigo-300/25",
    glow: "bg-indigo-400/25",
    button: "bg-[#5c4dff] hover:bg-[#4839e0] shadow-[0_24px_60px_rgba(92,77,255,0.38)]",
  },
  emerald: {
    ring: "border-emerald-300/25",
    glow: "bg-emerald-400/25",
    button: "bg-[#0d7a5f] hover:bg-[#0a634d] shadow-[0_24px_60px_rgba(13,122,95,0.38)]",
  },
  cyan: {
    ring: "border-cyan-300/25",
    glow: "bg-cyan-400/25",
    button: "bg-[#1577c7] hover:bg-[#1162a2] shadow-[0_24px_60px_rgba(21,119,199,0.38)]",
  },
} as const;

export default function ExperimentLaunchScreen({
  title,
  subtitle,
  onStart,
  buttonLabel = "START EXPERIMENT",
  accent = "blue",
  disabled = false,
}: ExperimentLaunchScreenProps) {
  const tone = accentMap[accent];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/72 px-4 py-6 text-white backdrop-blur-[5px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_24%),linear-gradient(135deg,rgba(0,0,0,0.86)_0%,rgba(10,16,28,0.74)_48%,rgba(0,0,0,0.86)_100%)]" />
      <div className={`absolute -left-16 top-8 h-80 w-80 rounded-full ${tone.glow} blur-3xl opacity-50`} />
      <div className={`absolute -right-20 bottom-10 h-[26rem] w-[26rem] rounded-full ${tone.glow} blur-3xl opacity-40`} />
      <div className="absolute inset-0 opacity-[0.05]">
        <div className="grid h-full grid-cols-12 gap-4 p-6">
          {Array.from({ length: 132 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-md border ${tone.ring}`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 h-full w-full">
        {(title || subtitle) && (
          <div className="absolute left-1/2 top-16 w-[min(92vw,48rem)] -translate-x-1/2 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Ready to launch
            </div>

            {title && (
              <h1 className="text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onStart}
          disabled={disabled}
          className={`absolute left-1/2 top-1/2 inline-flex min-h-[84px] w-[min(92vw,40rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[22px] px-8 text-2xl font-black uppercase tracking-[0.14em] text-white transition-transform duration-200 hover:scale-[1.02] sm:px-10 sm:text-3xl disabled:cursor-wait disabled:opacity-90 ${tone.button}`}
          aria-label={buttonLabel}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
