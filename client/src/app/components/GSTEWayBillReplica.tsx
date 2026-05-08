"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, Truck, FileText, Search, Printer, CircleGauge, MapPin, ShieldCheck, Users, Plug, KeyRound, ContactRound, PencilLine, ShieldAlert, ShieldQuestion } from "lucide-react";
import GSTBannerCarousel from "./GSTBannerCarousel";

type Screen = "home" | "generate" | "search" | "print" | "dashboard";

type GSTEWayBillReplicaProps = {
  initialScreen?: Screen;
  portalTitle?: string;
  companyName?: string;
  baseRoute?: string;
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
  launchTitle = "GST E-Way Bill Simulation",
  initialShowLaunchScreen = true,
}: GSTEWayBillReplicaProps) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [showLaunchScreen, setShowLaunchScreen] = useState(initialShowLaunchScreen);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const bannerSlides = useMemo(
    () => [
      { src: "/images/simulations/e-way-bill/ewaybill_banner-2.jpg", alt: "E-Way Bill banner" },
      { src: "/images/simulations/e-way-bill/ewaybill_banner_road-1.jpg", alt: "E-Way Bill road banner" },
      { src: "/images/simulations/e-way-bill/ewaybill-image-2.png", alt: "E-Way Bill information slide" },
    ],
    [],
  );

  const navTabs = ["Home", "Laws", "Help", "Search", "Registration", "Statistics", "Contact Us"];
  const sidebarMenu = [
    { label: "e-Way Bill", Icon: FileText },
    { label: "Generate", Icon: Truck },
    { label: "Search", Icon: Search },
    { label: "Print", Icon: Printer },
    { label: "Distance Calc", Icon: CircleGauge },
    { label: "Track Vehicle", Icon: MapPin },
    { label: "MIS Reports", Icon: Menu },
    { label: "User Management", Icon: Users },
    { label: "API Registration", Icon: Plug },
    { label: "Change Password", Icon: KeyRound },
    { label: "Feedback", Icon: ShieldQuestion },
    { label: "Update Contact", Icon: ContactRound },
    { label: "Update", Icon: PencilLine },
    { label: "2 Factor Auth", Icon: ShieldAlert },
  ];

  const openSection = (nextScreen: Screen) => {
    setScreen(nextScreen);
    setShowLaunchScreen(false);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const menuScreenMap: Record<number, Screen> = {
    0: "home",
    1: "generate",
    2: "search",
    3: "print",
  };

  const introCopy = {
    home: {
      title: "GST E-Way Bill Portal",
      description:
        "A simulation of the e-Way Bill portal with the familiar government-style header, dashboard shell, and rotating banner announcements.",
      action: "START EXPERIMENT",
      primaryLabel: "Generate New Bill",
      secondaryLabel: "Search / Print",
    },
    generate: {
      title: "Generate E-Way Bill",
      description:
        "Create a new e-way bill for transport of goods using the simulated portal flow.",
      action: "OPEN GENERATION FLOW",
      primaryLabel: "Proceed to Generation",
      secondaryLabel: "Review Documents",
    },
    search: {
      title: "Search E-Way Bill",
      description:
        "Search an existing e-way bill, inspect its status, and review transportation details.",
      action: "OPEN SEARCH FLOW",
      primaryLabel: "Search Bill",
      secondaryLabel: "View History",
    },
    print: {
      title: "Print E-Way Bill",
      description:
        "Open the print-ready view for an already generated e-way bill and review the document.",
      action: "OPEN PRINT FLOW",
      primaryLabel: "Print Bill",
      secondaryLabel: "Download Copy",
    },
    dashboard: {
      title: "E-Way Bill Dashboard",
      description:
        "Monitor e-way bill generation, manage transport documents, and explore the latest portal updates.",
      action: "OPEN DASHBOARD",
      primaryLabel: "Generate",
      secondaryLabel: "Search",
    },
  }[screen];

  return (
    <div className="min-h-screen bg-[#f5f8fb]">
      <div className="sticky top-0 z-40">
        <div className="bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
          This is a Simulation. Use For Educational Purposes ONLY.
        </div>

        <div className="bg-[#f5f8fb] px-0 pb-0 pt-0">
          <div className="bg-[#2f7a9f] text-white shadow-[0_2px_8px_rgba(15,23,42,0.18)]">
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

            <div className="border-t border-white/15 bg-[#c9d6f0] px-4 py-2.5 text-[12px] text-slate-700 lg:text-[14px]">
              <div className="flex items-center justify-between gap-4 whitespace-nowrap">
                <div className="text-left whitespace-nowrap">
                  GSTIN: 29BRYFP02061V7YP - Name: {companyName}
                </div>
                <div className="whitespace-nowrap">Account : Main User</div>
                <div className="whitespace-nowrap">Client IP:1.1.1.1</div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[1840px] px-4 pb-8 pt-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.12)]">
              <div className="flex min-h-[48px] w-full flex-wrap items-stretch border-b border-slate-200 bg-white">
                {navTabs.map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    className={`min-w-[120px] flex-1 border-r border-slate-200 px-6 py-4 text-[15px] font-medium transition-colors ${
                      index === 0
                        ? "bg-[#cfe0ff] text-[#173f73]"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="min-w-[120px] border-l border-slate-200 bg-white px-6 py-4 text-[15px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Login
                </button>
              </div>

              <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_410px]">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
                  <GSTBannerCarousel slides={bannerSlides} className="bg-[#eef6fb]" heightClassName="h-[340px] lg:h-[430px]" />
                  <div className="border-t border-slate-200 bg-white px-5 py-4 text-[15px] leading-7 text-slate-700">
                    The e-Way Bill System is for GST registered person / enrolled
                    transporter for generating the way bill electronically on
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
                        className={`border-l-4 pl-4 ${
                          item.color === "blue"
                            ? "border-blue-500"
                            : item.color === "green"
                              ? "border-green-500"
                              : item.color === "orange"
                                ? "border-orange-500"
                                : "border-red-500"
                        }`}
                      >
                        <div className="mb-1 text-sm font-semibold text-slate-400">
                          {item.date}
                        </div>
                        <p className="text-[15px] font-semibold leading-6 text-blue-700/95">
                          • {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>

              <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[280px_1fr]">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#f7fbff]">
                  <div className="border-b border-slate-200 bg-[#f2f7ff] px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">
                        Portal Actions
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="space-y-1 p-2">
                    {sidebarMenu.map(({ label, Icon }, index) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() => openSection(menuScreenMap[index] ?? "dashboard")}
                        className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[14px] font-medium transition-colors ${
                          index === 0 && screen === "home"
                            ? "bg-[#387fca] text-white"
                            : index === 1 && screen === "generate"
                              ? "bg-[#387fca] text-white"
                              : index === 2 && screen === "search"
                                ? "bg-[#387fca] text-white"
                                : index === 3 && screen === "print"
                                  ? "bg-[#387fca] text-white"
                                  : "bg-[#e8eef8] text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
                        {screen === "home" ? "Home" : screen === "generate" ? "Generate" : screen === "search" ? "Search" : screen === "print" ? "Print" : "Dashboard"}
                      </div>
                      <h1 className="mt-4 text-3xl font-extrabold text-slate-800">
                        {introCopy.title}
                      </h1>
                      <p className="mt-3 max-w-3xl text-[16px] leading-7 text-slate-600">
                        {introCopy.description}
                      </p>
                    </div>

                    <div className="hidden min-w-[240px] rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white shadow-[0_16px_50px_rgba(37,99,235,0.2)] lg:block">
                      <div className="text-xs font-bold uppercase tracking-[0.35em] text-white/90">
                        {screen === "home" ? "Featured" : "Quick Access"}
                      </div>
                      <div className="mt-3 text-4xl font-extrabold">0%</div>
                      <div className="mt-3 text-sm leading-6 text-white/90">
                        Use the menu or the buttons below to move through the e-way bill simulation.
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                        Activity
                      </div>
                      <div className="mt-2 text-xl font-bold text-slate-800">
                        Generate, Search, Print
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Simulated portal actions for the e-way bill flow.
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                        Documents
                      </div>
                      <div className="mt-2 text-xl font-bold text-slate-800">
                        E-Way Bill JSON
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Use the uploaded sample data to preview the workflow.
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                        Access
                      </div>
                      <div className="mt-2 text-xl font-bold text-slate-800">
                        Admin or GST Course
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Protected by the GST route guard already in place.
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => openSection("generate")}
                      className="rounded-xl bg-[#18365f] px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#102745]"
                    >
                      {introCopy.primaryLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => openSection("search")}
                      className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[15px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      {introCopy.secondaryLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(true)}
                      className="rounded-xl border border-red-200 bg-white px-6 py-3 text-[15px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-red-50"
                    >
                      LOGIN
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#245f87] px-6 py-5 text-white">
              <div className="text-lg font-semibold uppercase tracking-wide opacity-90">
                Important Links
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLaunchScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4">
          <div className="rounded-3xl bg-white px-10 py-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.35)]">
            <div className="mb-4 text-3xl font-extrabold tracking-[0.25em] text-[#274d80]">
              {launchTitle}
            </div>
            <button
              type="button"
              onClick={() => setShowLaunchScreen(false)}
              className="rounded-2xl bg-[#2450bf] px-10 py-4 text-2xl font-bold tracking-[0.25em] text-white shadow-lg"
            >
              START EXPERIMENT
            </button>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[560px] rounded-2xl bg-[#dfe7f3] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-3xl font-bold text-[#274d80]"
            >
              ×
            </button>

            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="text-6xl">🇮🇳</div>
              <div className="text-2xl font-extrabold text-red-600">
                E-WAY BILL SYSTEM LOGIN
              </div>
            </div>

            <div className="mt-5 rounded-md border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 shadow-inner">
              <div className="font-semibold text-slate-800">Login Details</div>
              <div className="mt-1">User name: AIR</div>
              <div>Password: Fin@123</div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-lg text-slate-700">User name</label>
                <input className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base shadow-inner outline-none focus:border-blue-500" defaultValue="AIR" />
              </div>

              <div>
                <label className="mb-1 block text-lg text-slate-700">Password</label>
                <input type="password" className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base shadow-inner outline-none focus:border-blue-500" defaultValue="Fin@123" />
              </div>

              <div>
                <div className="mb-1 text-lg text-slate-700">Enter Above Captcha</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex h-14 items-center justify-center rounded-md border border-slate-300 bg-white px-4 font-mono text-3xl font-black tracking-tight">
                    R4T8Z
                  </div>
                  <input className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base shadow-inner outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    router.push(baseRoute);
                  }}
                  className="rounded-xl bg-[#2450bf] px-6 py-3 font-semibold text-white shadow-sm"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
