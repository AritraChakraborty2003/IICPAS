"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogIn } from "lucide-react";
import GSTBannerCarousel from "./GSTBannerCarousel";

type Screen = "home" | "generate" | "search" | "print" | "dashboard";

type GSTEWayBillReplicaProps = {
  initialScreen?: Screen;
  portalTitle?: string;
  companyName?: string;
  baseRoute?: string;
  loginRoute?: string;
  launchTitle?: string;
  initialShowLaunchScreen?: boolean;
};

const updates = [
  {
    date: "28 JUL 2023",
    text: "Mandatory 2 Factor Authentication for taxpayers with AATO above 100 Cr is further extended till 20/08/2023.",
    color: "blue",
  },
  {
    date: "26 MAY 2023",
    text: "Latest updates on 2 Factor Authentication, Deregistration of Enrolment and Common Enrolment have been issued.",
    color: "green",
  },
  {
    date: "07 OCT 2022",
    text: "Single sign-on (SSO) for e-Invoice and e-Waybill enabled.",
    color: "orange",
  },
  {
    date: "14 SEP 2022",
    text: "e-Waybill for Gold will be available only after the notification is issued by Government.",
    color: "red",
  },
];

export default function GSTEWayBillReplica({
  initialScreen = "home",
  portalTitle = "e-Way Bill Portal",
  companyName = "IICPA Private Limited",
  baseRoute = "/simulations/gst/e-way-bill-1",
  loginRoute = "/simulations/gst/e-way-bill-login",
  launchTitle = "GST E-Way Bill Simulation",
  initialShowLaunchScreen = true,
}: GSTEWayBillReplicaProps) {
  const router = useRouter();
  const screen = initialScreen;
  const [showLaunchScreen, setShowLaunchScreen] = useState(initialShowLaunchScreen);
  const [isStartingExperiment, setIsStartingExperiment] = useState(false);
  const launchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
    };
  }, []);

  const handleStartExperiment = () => {
    if (isStartingExperiment) {
      return;
    }

    setIsStartingExperiment(true);
    launchTimerRef.current = window.setTimeout(() => {
      setShowLaunchScreen(false);
    }, 1500);
  };

  const bannerSlides = useMemo(
    () => [
      { src: "/images/simulations/e-way-bill/ewaybill_banner-2.jpg", alt: "E-Way Bill banner" },
      { src: "/images/simulations/e-way-bill/ewaybill_banner_road-1.jpg", alt: "E-Way Bill road banner" },
      { src: "/images/simulations/e-way-bill/ewaybill-image-2.png", alt: "E-Way Bill information slide" },
    ],
    [],
  );

  const navTabs = [
    { label: "Home", chevron: false },
    { label: "Laws", chevron: true },
    { label: "Help", chevron: true },
    { label: "Search", chevron: true },
    { label: "Registration", chevron: true },
    { label: "Statistics", chevron: false },
    { label: "Contact Us", chevron: false },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f8fb]">
      <header className="sticky top-0 z-40">
        <div className="bg-[#f5f8fb] px-0 pb-0 pt-0">
          <div className="bg-[#5a4bb0] text-white shadow-[0_2px_8px_rgba(15,23,42,0.18)]">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/simulations/satyamev-jayate.jpg"
                    alt="Satyamev Jayate emblem"
                    className="h-[54px] w-[54px] object-contain lg:h-[60px] lg:w-[60px]"
                  />
                  <div>
                    <div className="text-[10px] font-semibold uppercase leading-tight lg:text-[11px]">
                      GOODS AND SERVICES TAX
                    </div>
                    <div className="text-[14px] font-bold uppercase leading-tight lg:text-[16px]">
                      E - WAY BILL SYSTEM
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[14px] font-bold lg:text-[16px]">{portalTitle}</div>
                </div>

                <div className="flex items-center gap-4 lg:gap-6">
                  <img
                    src="/images/simulations/red-1-logo.png"
                    alt="Nation Tax Market logo"
                    className="h-[34px] w-auto object-contain lg:h-[40px]"
                  />
                  <img
                    src="/images/simulations/nic-logo-remove-1.png"
                    alt="NIC logo"
                    className="h-[34px] w-auto object-contain lg:h-[40px]"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 pb-6">
        <div className="w-full border-b border-white/60 bg-[#d9d2f6] px-4 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex w-full max-w-[1840px] items-center gap-1 overflow-x-auto whitespace-nowrap">
            {navTabs.map((tab, index) => (
              <button
                key={tab.label}
                type="button"
                className={`shrink-0 px-4 py-2 text-[15px] font-medium transition-colors ${
                  index === 0
                    ? "text-[#3f3479]"
                    : "text-[#4a5d86] hover:text-[#3f3479]"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{tab.label}</span>
                  {tab.chevron && <ChevronDown size={14} className="mt-[1px]" />}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => router.push(`${loginRoute}?returnTo=${encodeURIComponent(baseRoute)}`)}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 border border-red-500 px-2 py-1 text-[15px] font-medium text-[#395789] transition-colors duration-200 hover:text-[#173f73]"
            >
              Login
              <LogIn size={16} className="text-current" />
            </button>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1840px] gap-4 px-4 pt-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
            <GSTBannerCarousel slides={bannerSlides} className="bg-[#eef6fb]" heightClassName="h-[340px] lg:h-[430px]" />
            <div className="border-t border-slate-200 bg-white px-5 py-4 text-[14px] leading-7 text-slate-700 lg:text-[15px]">
              E-Way bill system is for GST registered person / enrolled
              transporter for generating the way bill (a document to be carried
              by the person in charge of conveyance) electronically on
              commencement of movement of goods exceeding the value of Rs.
              50,000 in relation to supply or for reasons other than supply or
              due to inward supply from an unregistered person.
            </div>
          </section>

          <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-[20px] font-extrabold tracking-wide text-slate-700">
                LATEST UPDATES
              </h3>
            </div>

            <div className="space-y-4 px-4 py-4">
              {updates.map((item) => (
                <div
                  key={`${item.date}-${item.text}`}
                  className="group flex gap-4 rounded-lg border-b border-slate-100 px-1 py-3 transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#f6f2ff] hover:shadow-[0_4px_12px_rgba(63,52,121,0.08)] last:border-b-0"
                >
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-md bg-[#f8e4e3] px-1.5 py-2 text-center text-slate-900 transition-colors duration-200 group-hover:bg-[#ead6ff] group-hover:text-[#3f3479] shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                    {item.date.split(" ").map((part) => (
                      <span
                        key={part}
                        className={`${
                          part.length <= 3 ? "text-sm font-extrabold" : "text-[11px] font-bold"
                        } leading-tight`}
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-6 text-blue-700/95 transition-colors duration-200 group-hover:text-[#244bb7]">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      <footer className="relative mt-auto w-full overflow-hidden bg-[#3f357f] text-white shadow-[0_-8px_24px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_24%)]" />
        <div className="relative mx-auto w-full max-w-[1840px] px-4 py-10 lg:py-12">
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Important Links</h2>
              <div className="mt-2 h-0.5 w-40 bg-white/80" />
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <ul className="space-y-4 text-[15px] leading-6 text-white/92">
                <li>Central Board of Excise</li>
                <li>GST Common Portal</li>
              </ul>
              <ul className="space-y-4 text-[15px] leading-6 text-white/92">
                <li>National Informatics Centre</li>
                <li>National Portal</li>
              </ul>
              <ul className="space-y-4 text-[15px] leading-6 text-white/92">
                <li>Goods and Service Tax Network</li>
                <li>State Tax Websites</li>
              </ul>
              <ul className="space-y-4 text-[15px] leading-6 text-white/92">
                <li>Website Policies</li>
                <li>Help</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/20 pt-4 text-sm text-white/80 lg:flex-row lg:items-center lg:justify-between">
              <div>Ver. 1.3.0 Rel.1218</div>
              <div className="max-w-4xl">
                This site can be best viewed in Firefox 43.5 and above, IE 11 and
                above, chrome 45 and above.{" "}
                <span className="text-amber-300">Check your browser version</span>
              </div>
              <div>© 2022 - Powered By National Informatics Centre</div>
            </div>
          </div>
        </div>
      </footer>

      {showLaunchScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#07111f]/22 px-4 text-white backdrop-blur-[2px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_26%),linear-gradient(135deg,rgba(7,17,31,0.18)_0%,rgba(11,27,51,0.14)_45%,rgba(8,17,31,0.18)_100%)]" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/5 blur-3xl" />
          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={handleStartExperiment}
              disabled={isStartingExperiment}
              className="inline-flex min-h-[72px] w-[min(84vw,34rem)] items-center justify-center rounded-[22px] bg-[#1244b8] px-6 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_rgba(18,68,184,0.24)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0f3a9a] disabled:cursor-wait disabled:opacity-90 sm:min-h-[78px] sm:px-8 sm:text-xl"
              aria-label={launchTitle}
              title={launchTitle}
            >
              {isStartingExperiment ? "EXPERIMENTING..." : "START EXPERIMENT"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
