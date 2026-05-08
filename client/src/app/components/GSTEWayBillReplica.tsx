"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogIn } from "lucide-react";
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
  const screen = initialScreen;
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
        <div className="bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
          This is a Simulation. Use For Educational Purposes ONLY.
        </div>

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
                className={`shrink-0 rounded-full px-5 py-2.5 text-[15px] font-medium transition-colors ${
                  index === 0
                    ? "bg-white/70 text-[#3f3479] shadow-sm"
                    : "text-[#4a5d86] hover:bg-white/55"
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
              onClick={() => setShowLoginModal(true)}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 px-2 py-1 text-[15px] font-medium text-[#395789] transition-colors duration-200 hover:text-[#173f73]"
            >
              Login
              <LogIn size={16} className="text-current" />
            </button>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1840px] gap-4 px-4 pt-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
            <GSTBannerCarousel slides={bannerSlides} className="bg-[#eef6fb]" heightClassName="h-[340px] lg:h-[430px]" />
            <div className="border-t border-slate-200 bg-white px-5 py-4 text-[15px] leading-7 text-slate-700">
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
