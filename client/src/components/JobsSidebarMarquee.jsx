"use client";

import {
  DEFAULT_OUR_PARTNERS_SETTINGS,
  normalizeOurPartnersSettings,
} from "@/components/ourPartnersConfig";

export default function JobsSidebarMarquee({ settings }) {
  const normalized = normalizeOurPartnersSettings(settings);

  if (!normalized.enabled) {
    return null;
  }

  const items = [
    ...(normalized.items?.length
      ? normalized.items
      : DEFAULT_OUR_PARTNERS_SETTINGS.items),
    ...(normalized.items?.length
      ? normalized.items
      : DEFAULT_OUR_PARTNERS_SETTINGS.items),
  ];

  return (
    <aside className="hidden xl:block xl:w-full">
      <div className="sticky top-28 w-full rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-4 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-3 px-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
            {normalized.title}
          </p>
        </div>

        <div className="relative h-[76vh] min-h-[560px] overflow-hidden rounded-[24px] bg-white">
          <div
            className="absolute inset-x-0 top-0 animate-[jobsSidebarMarquee_linear_infinite]"
            style={{ animationDuration: `${normalized.durationSeconds}s` }}
          >
            {items.map((item, index) => {
              return (
                <div key={`${item.name}-${index}`} className="px-2 py-2.5">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-4 text-center shadow-sm">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.name}
                        className="mx-auto h-14 w-full max-w-[120px] object-contain"
                      />
                    ) : (
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.25)]">
                        <span className="text-xs font-bold">
                          {(item.name || "P").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                      {item.name}
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
