"use client";

import {
  getJobSidebarIconComponent,
  normalizeJobSidebarMarqueeSettings,
} from "@/components/jobSidebarMarqueeConfig";

export default function JobsSidebarMarquee({ settings }) {
  const normalized = normalizeJobSidebarMarqueeSettings(settings);

  if (!normalized.enabled) {
    return null;
  }

  const items = [...normalized.items, ...normalized.items];

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-28 rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-3 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-3 px-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
            {normalized.title}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">
            {normalized.subtitle}
          </p>
        </div>

        <div className="relative h-[76vh] min-h-[560px] overflow-hidden rounded-[24px] bg-white">
          <div
            className="absolute inset-x-0 top-0 animate-[jobsSidebarMarquee_linear_infinite]"
            style={{ animationDuration: `${normalized.durationSeconds}s` }}
          >
            {items.map((item, index) => {
              const Icon = getJobSidebarIconComponent(item.icon);

              return (
                <div key={`${item.icon}-${item.label}-${index}`} className="px-3 py-2.5">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-4 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.25)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/85 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent" />
        </div>
      </div>

      <style jsx>{`
        @keyframes jobsSidebarMarquee {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </aside>
  );
}
