"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ContactRound,
  FileText,
  Menu,
  PencilLine,
  ShieldAlert,
  ShieldQuestion,
  Plug,
  Truck,
  Users,
  KeyRound,
} from "lucide-react";
import GSTBannerCarousel from "../../../components/GSTBannerCarousel";

type View = "home" | "dashboard" | "print";

export default function GSTEInvoicing3Page() {
  const [view, setView] = useState<View>("dashboard");
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [isStartingExperiment, setIsStartingExperiment] = useState(false);
  const [isInvoiceMenuOpen, setIsInvoiceMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cancelBasis, setCancelBasis] = useState<"ack" | "irn" | "">("");
  const [ackNumber, setAckNumber] = useState("");
  const [showPrintDetails, setShowPrintDetails] = useState(false);
  const [showPrintSuccess, setShowPrintSuccess] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "AIR",
    password: "IICPA@123",
    captcha: "",
  });
  const launchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
    };
  }, []);

  const marqueeItems = [
    {
      text: "Taxpayers with AATO between Rs.5 Crore to Rs.10 Crore are enabled for einvoicing",
      className: "text-[#8a1f11]",
    },
    {
      text: "Taxpayers who are above Rs.5 Crore but not enabled for e-invoicing can get enabled voluntarily by clicking Registration -> e-Invoice Enablement",
      className: "text-[#1e6b1f]",
    },
    {
      text: "2-Factor Authentication for all taxpayers with AATO above Rs 20 Cr is mandatory from 1st November 2023",
      className: "text-[#152a8a]",
    },
  ];

  const latestUpdates = [
    {
      date: "01 OCT 2023",
      text: "Implementation of atleast 6 digit HSN in e-Invoices and e-Waybills has been deferred.",
    },
    {
      date: "19 SEP 2023",
      text: "The tax payers, notified for generation of e-invoices and supplying to government departments / agencies, need to generate B2B e-Invoices with the GSTIN of the Government department / agency.",
    },
    {
      date: "11 SEP 2023",
      text: "2-Factor Authentication for all taxpayers with AATO above Rs 20 Cr is mandatory from 1st November 2023.",
    },
    {
      date: "11 SEP 2023",
      text: "As per directions by GST Authority, a time limit of 30 days for reporting of invoices from date of invoice is imposed on e-invoice portals, and is applicable for taxpayers with AATO greater than or equal to 100 crores from 1st November 2023.",
    },
  ];

  const bannerSlides = [
    { src: "/images/simulations/main-gst-banner-image.jpg", alt: "GST main banner" },
    // { src: "/images/simulations/gst-image-2.jpg", alt: "GST banner slide 2" },
    ,
    { src: "/images/simulations/gst-image-3.jpg", alt: "GST banner slide 3" },
    // { src: "/images/simulations/gst-image-4.jpg", alt: "GST banner slide 4" }, 
    ,
    { src: "/images/simulations/gst-image-5.png", alt: "GST banner slide 5" },
  ];

  const sidebarMenuItems = [
    { label: "MIS Reports", Icon: Menu },
    { label: "User Management", Icon: Users },
    { label: "API Registration", Icon: Plug },
    { label: "Change Password", Icon: KeyRound },
    { label: "Feedback on GePP", Icon: ShieldQuestion },
    { label: "Update Contact Details", Icon: ContactRound },
    { label: "Update", Icon: PencilLine },
    { label: "e-Way Bill", Icon: Truck },
    { label: "2 Factor Authentication", Icon: ShieldAlert },
  ];

  const startAgain = () => {
    setShowLoginModal(false);
    setLoginData((prev) => ({ ...prev, captcha: "" }));
    setView("dashboard");
    setIsInvoiceMenuOpen(false);
    setCancelBasis("");
    setAckNumber("");
    setShowPrintDetails(false);
    setShowPrintSuccess(false);
  };

  const handleStartExperiment = () => {
    if (isStartingExperiment) {
      return;
    }

    setIsStartingExperiment(true);
    launchTimerRef.current = window.setTimeout(() => {
      setShowLaunchScreen(false);
      setIsStartingExperiment(false);
      launchTimerRef.current = null;
    }, 1500);
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    setView("dashboard");
  };

  const openPrintScreen = () => {
    setView("print");
    setIsInvoiceMenuOpen(true);
    setCancelBasis("");
    setAckNumber("");
    setShowPrintDetails(false);
    setShowPrintSuccess(false);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handlePrintGo = () => {
    if (!ackNumber.trim()) {
      setAckNumber("146872643383543");
    }
    setCancelBasis("ack");
    setShowPrintDetails(true);
    setShowPrintSuccess(false);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleFinalPrint = () => {
    setShowPrintSuccess(true);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleRetryPrint = () => {
    setShowPrintSuccess(false);
    setShowPrintDetails(false);
    setAckNumber("");
    setCancelBasis("");
  };

  const renderPrintScreen = () => (
    <div className="min-h-screen bg-[#f4f7fb] pb-12">
      <div className="sticky top-0 z-50 w-full">
        <div className="bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
          This is a Simulation. Use For Educational Purposes ONLY.
        </div>

        <div className="bg-[#f4f7fb] px-0 pb-0 pt-0">
          <div className="bg-[#24668f] text-white">
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
                      e - INVOICE SYSTEM
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[14px] font-bold lg:text-[16px]">e-Invoice 1 Portal</div>
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

            <div className="border-t border-white/15 bg-[#ccd4e9] px-4 py-2.5 text-[12px] text-slate-700 lg:text-[14px]">
              <div className="flex items-center justify-between gap-4 whitespace-nowrap">
                <div className="text-left whitespace-nowrap">
                  GSTIN: 09ABCDE1234F1Z5 - Name: ABC XYZ Private Limited
                </div>
                <div className="whitespace-nowrap">Account : Main User</div>
                <div className="whitespace-nowrap">Client IP:1.1.1.1</div>
                <button
                  onClick={startAgain}
                  className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                >
                  Start Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 pt-4 lg:px-6">
        <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <div className="px-4 py-4 lg:px-6 lg:py-5">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setShowPrintDetails(false);
                  setView("dashboard");
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Back
              </button>
              <div className="flex-1 text-center text-[18px] font-extrabold text-[#1b66a0] lg:text-[22px]">
                e-Invoice Print
              </div>
              <div className="w-[84px]" />
            </div>

            <div className="mt-8 flex items-center justify-center gap-5 text-[14px] font-semibold text-slate-700">
              <span>Based On :</span>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="cancel-basis"
                  checked={cancelBasis === "ack"}
                  onChange={() => setCancelBasis("ack")}
                  className="h-4 w-4 accent-blue-600"
                />
                <span>Ack No.</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="cancel-basis"
                  checked={cancelBasis === "irn"}
                  onChange={() => setCancelBasis("irn")}
                  className="h-4 w-4 accent-blue-600"
                />
                <span>IRN</span>
              </label>
            </div>

            {cancelBasis !== "" && (
            <div className="mt-14 flex flex-wrap items-center justify-center gap-3 px-4 pb-8">
              <label className="text-[14px] font-semibold text-slate-700">
                {cancelBasis === "ack" ? "Enter Ack. No. :" : "Enter IRN No. :"}
              </label>
              <input
                value={ackNumber}
                onChange={(e) => setAckNumber(e.target.value)}
                className="h-[42px] w-full max-w-[520px] rounded-[4px] border border-slate-300 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={handlePrintGo}
                className="rounded-[4px] bg-[#2f7fd3] px-5 py-2.5 text-[14px] font-medium text-white shadow-sm hover:bg-[#256ab3]"
              >
                Go
              </button>
              <button
                onClick={() => {
                  setShowPrintDetails(false);
                  setView("dashboard");
                }}
                className="rounded-[4px] bg-[#d9534f] px-5 py-2.5 text-[14px] font-medium text-white shadow-sm hover:bg-[#c64541]"
              >
                Exit
              </button>
            </div>
            )}

            <div className="relative mx-auto mt-4 w-full max-w-[1700px] px-2">
              {showPrintSuccess && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[1px]">
                  <div className="relative flex flex-col items-center">
                    <img
                      src="/images/simulations/tick.png"
                      alt="Success tick"
                      className="h-[128px] w-[128px] bg-transparent object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] sm:h-[150px] sm:w-[150px]"
                    />
                    <button
                      onClick={handleRetryPrint}
                      className="mt-3 rounded-[6px] bg-[#f60f0f] px-6 py-2 text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(0,0,0,0.28)] hover:bg-[#e10e0e]"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {showPrintDetails && (
                <div className="w-full">
                <div className="text-center text-[18px] font-extrabold text-[#1b66a0] lg:text-[22px]">
                  e-Invoice Print
                </div>

                <div className="mt-2 overflow-hidden rounded-[8px] border border-slate-200 bg-[#f7f8fd]">
                  <div className="flex items-start justify-between gap-4 px-3 py-4 lg:px-4">
                    <div className="pt-20 text-[24px] font-bold leading-tight text-slate-800 lg:text-[32px]">
                      <div>09ABCDE1234F1Z5</div>
                      <div>ABC XYZ Private Limited</div>
                    </div>

                    <div className="flex-shrink-0 rounded-[4px] border border-slate-200 bg-white p-2 shadow-sm">
                      <div className="grid h-[210px] w-[210px] place-items-center bg-white">
                        <img
                          src="/images/simulations/qr-gst.webp"
                          alt="GST QR code"
                          className="h-[180px] w-[180px] object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-2 text-[14px] font-semibold text-slate-700">
                      1.e-Invoice Details
                    </div>
                    <div className="grid gap-4 px-4 py-4 text-[13px] text-slate-800 lg:grid-cols-3">
                      <div>
                        <span className="font-bold">IRN</span> :
                        <span className="ml-2 break-all">
                          uncWIpXGNqaGmHkd5U3v4IfYXI6OW6s7kJAjOcHe6Inj6wo6rQZHF0EnElP
                          P1jAY
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">Ack. No</span> :
                        <span className="ml-2">146872643383543</span>
                      </div>
                      <div>
                        <span className="font-bold">Ack. Date</span> :
                        <span className="ml-2">09/10/2023</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 px-4 py-2 text-[14px] font-semibold text-slate-700">
                      2.Transaction Details
                    </div>
                    <div className="grid gap-4 px-4 py-4 text-[13px] text-slate-800 lg:grid-cols-3">
                      <div>
                        <span className="font-bold">Supply Type Code</span> :
                        <span className="ml-2">B2B</span>
                      </div>
                      <div>
                        <span className="font-bold">Document No</span> :
                        <span className="ml-2">STC/23-24/masdks</span>
                      </div>
                      <div>
                        <span className="font-bold">
                          IGST applicable despite Supplier and Recipient located in same State
                        </span>
                        <span className="ml-2">: No</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 px-4 py-2 text-[14px] font-semibold text-slate-700">
                      3.Party Details
                    </div>
                    <div className="grid gap-4 px-4 py-4 text-[13px] text-slate-800 lg:grid-cols-2">
                      <div className="space-y-1">
                        <div className="text-[18px] font-bold">Supplier</div>
                        <div>GSTIN : 09ABCDE1234F1Z5</div>
                        <div>ABC XYZ Private Limited</div>
                        <div>ABC XYZ Campus, Sector 62, Noida</div>
                        <div>Noida, Uttar Pradesh 201309</div>
                        <div>NOIDA</div>
                        <div>201309 UP</div>
                      </div>
                      <div className="space-y-1 border-l border-slate-200 pl-4">
                        <div className="text-[18px] font-bold">Recipient</div>
                        <div>GSTIN : 09ZZZZZ6789K1Z2</div>
                        <div>ZZZZ Enterprises LLP</div>
                        <div>ZZZZ Tower, Sector 18, Noida</div>
                        <div>Noida, Uttar Pradesh 201301</div>
                        <div>NOIDA Place of Supply: UP</div>
                        <div>201301 UP</div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 px-4 py-2 text-[14px] font-semibold text-slate-700">
                      4.Details of Goods / Services
                    </div>
                    <div className="overflow-x-auto px-2 py-3">
                      <table className="w-full border-collapse text-[12px] text-slate-800">
                        <thead>
                          <tr className="bg-slate-100 text-[12px] font-semibold">
                            <th className="border border-slate-200 px-2 py-2 text-left">SlNo</th>
                            <th className="border border-slate-200 px-2 py-2 text-left">Item Description</th>
                            <th className="border border-slate-200 px-2 py-2 text-left">HSN Code</th>
                            <th className="border border-slate-200 px-2 py-2 text-left">Quantity</th>
                            <th className="border border-slate-200 px-2 py-2 text-left">Unit</th>
                            <th className="border border-slate-200 px-2 py-2 text-left">Unit Price(Rs)</th>
                            <th className="border border-slate-200 px-2 py-2 text-left">Discount(Rs)</th>
                            <th className="border border-slate-200 px-2 py-2 text-left">Taxable Amount(Rs)</th>
                            <th className="border border-slate-200 px-2 py-2 text-left">
                              Tax Rate (GST+Cess | State Cess+Cess Non.Advol)
                            </th>
                            <th className="border border-slate-200 px-2 py-2 text-left">
                              Other charges(Rs)
                            </th>
                            <th className="border border-slate-200 px-2 py-2 text-left">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-200 px-2 py-2">1</td>
                            <td className="border border-slate-200 px-2 py-2">
                              SILK GLAMOR P0 BASE-..4 L(F00X400991004000)
                            </td>
                            <td className="border border-slate-200 px-2 py-2">32091090</td>
                            <td className="border border-slate-200 px-2 py-2">6</td>
                            <td className="border border-slate-200 px-2 py-2">NOS</td>
                            <td className="border border-slate-200 px-2 py-2">1907.63</td>
                            <td className="border border-slate-200 px-2 py-2">0</td>
                            <td className="border border-slate-200 px-2 py-2">11445.78</td>
                            <td className="border border-slate-200 px-2 py-2">18+0|0+0</td>
                            <td className="border border-slate-200 px-2 py-2" />
                            <td className="border border-slate-200 px-2 py-2">13506.02</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-200 px-2 py-2">2</td>
                            <td className="border border-slate-200 px-2 py-2">
                              SILK GLAMOR N2 BASE-..3.6 L(F00X420991003600)
                            </td>
                            <td className="border border-slate-200 px-2 py-2">32091090</td>
                            <td className="border border-slate-200 px-2 py-2">1</td>
                            <td className="border border-slate-200 px-2 py-2">NOS</td>
                            <td className="border border-slate-200 px-2 py-2">1950</td>
                            <td className="border border-slate-200 px-2 py-2">0</td>
                            <td className="border border-slate-200 px-2 py-2">1950</td>
                            <td className="border border-slate-200 px-2 py-2">18+0|0+0</td>
                            <td className="border border-slate-200 px-2 py-2" />
                            <td className="border border-slate-200 px-2 py-2">2301</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-200 px-2 py-2">3</td>
                            <td className="border border-slate-200 px-2 py-2">
                              SILK GLAMOR RED BASE-..900 ML(F00X430991000900)
                            </td>
                            <td className="border border-slate-200 px-2 py-2">32091090</td>
                            <td className="border border-slate-200 px-2 py-2">900</td>
                            <td className="border border-slate-200 px-2 py-2">MLT</td>
                            <td className="border border-slate-200 px-2 py-2">0.56</td>
                            <td className="border border-slate-200 px-2 py-2">0</td>
                            <td className="border border-slate-200 px-2 py-2">505.93</td>
                            <td className="border border-slate-200 px-2 py-2">18+0|0+0</td>
                            <td className="border border-slate-200 px-2 py-2" />
                            <td className="border border-slate-200 px-2 py-2">596.99</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 border-t border-slate-200 px-4 py-3 text-[12px] lg:grid-cols-4">
                      <div>
                        <div className="font-semibold">Tax'ble Amt</div>
                        <div>13901.71</div>
                      </div>
                      <div>
                        <div className="font-semibold">CGST Amt</div>
                        <div>1251.15</div>
                      </div>
                      <div>
                        <div className="font-semibold">SGST Amt</div>
                        <div>1251.15</div>
                      </div>
                      <div>
                        <div className="font-semibold">IGST Amt</div>
                        <div>0</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 border-t border-slate-200 px-4 py-4 text-[12px] text-slate-800 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                    <div>
                      <div className="font-semibold">Generated By : <span className="font-normal">09ABCDE1234F1Z5</span></div>
                      <div className="font-semibold">Print Date : <span className="font-normal">08-05-2026 16:46:19</span></div>
                    </div>
                    <div className="text-center">
                      <img
                        src="/images/simulations/barcode-image.jpg"
                        alt="Barcode"
                        className="mx-auto h-[52px] w-[140px] object-contain"
                      />
                      <div className="mt-1 text-[10px] text-slate-500">182314594723038</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">Digitally Signed by NIC-IRP</div>
                      <div>on: 09-10-2023 18:52:00</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 border-t border-slate-200 px-4 py-4">
                    <button
                      onClick={handleFinalPrint}
                      className="rounded-[4px] bg-sky-500 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm hover:bg-sky-600"
                    >
                      Print
                    </button>
                    <button className="rounded-[4px] bg-sky-400 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm hover:bg-sky-500">
                      Download Signed Json
                    </button>
                    <button
                      onClick={() => setView("dashboard")}
                      className="rounded-[4px] bg-[#d9534f] px-5 py-2.5 text-[14px] font-medium text-white shadow-sm hover:bg-[#c64541]"
                    >
                      ExitA
                    </button>
                  </div>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-[#1d5d83] px-4 py-2 text-white">
        <div className="mx-auto flex w-full max-w-[1780px] items-center justify-between gap-4">
          <div className="text-[11px] lg:text-[12px]">Version 1.01</div>
          <div className="text-[11px] lg:text-[12px]">
            © 2022 - Powered By National Informatics Centre.
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderHome = () => (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="fixed inset-x-0 top-0 z-50 w-full bg-[#24668f] shadow-sm">
        <div className="flex w-full items-center justify-between gap-6 px-6 py-4 text-white">
          <div className="flex min-w-0 flex-[0.55] items-center gap-4">
            <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
              <img
                src="/images/simulations/satyamev-jayate.jpg"
                alt="Satyamev Jayate emblem"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-[1.25] justify-center">
            <div className="whitespace-nowrap text-[21px] font-semibold leading-none tracking-tight text-white">
              e-Invoice 1 Portal
            </div>
          </div>

          <div className="flex flex-[1.05] items-start justify-end gap-6 text-right">
            <div className="flex items-center gap-3">
              <img
                src="/images/simulations/red-1-logo.png"
                alt="Nation Tax Market logo"
                className="h-[56px] w-auto object-contain"
              />
              <img
                src="/images/simulations/nic-logo-remove-1.png"
                alt="NIC logo"
                className="ml-2 h-[56px] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white pt-[110px]">
        <div className="mx-auto w-full max-w-[1780px] px-0">
          <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
            <div className="flex min-h-[48px] w-full flex-wrap items-stretch bg-white">
              {["Home", "Laws", "Help", "Search", "Contact Us", "Registration", "Statistics"].map(
                (tab, index) => (
                  <button
                    key={tab}
                    className={`min-w-[140px] flex-1 border-r border-slate-200 px-6 py-4 text-[16px] font-medium transition-colors ${
                      index === 0
                        ? "bg-[#69aee8] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
              <button
                onClick={() => setShowLoginModal(true)}
                className="min-w-[140px] border-l border-slate-200 bg-slate-100 px-6 py-4 text-[16px] font-medium text-slate-600 hover:bg-slate-200"
              >
                LOGIN
              </button>
            </div>
          </div>

          <div className="relative left-1/2 mt-0 w-screen -translate-x-1/2 overflow-hidden border-b border-slate-200 bg-[#eceef2] py-1">
            <div className="marquee-track flex min-w-max items-center gap-8 whitespace-nowrap text-[14px] font-medium leading-none">
              {marqueeItems.map((item) => (
                <span key={item.text} className={item.className}>
                  {item.text}
                </span>
              ))}
              {marqueeItems.map((item) => (
                <span key={`${item.text}-copy`} className={item.className}>
                  {item.text}
                </span>
              ))}
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
              <GSTBannerCarousel slides={bannerSlides} className="mt-3" />
              <div className="border-t border-slate-200 bg-white px-5 py-3 text-[15px] leading-6 text-blue-700">
                The e-Invoice System is for GST registered person for uploading all
                the B2B invoices to the Invoice Registration Portal (IRP). The IRP
                generates and returns a unique Invoice Reference Number (IRN),
                digitally signed e-invoice and QR code to the user.
              </div>
            </section>

            <aside className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <h3 className="text-[19px] font-extrabold tracking-wide text-slate-600">
                  LATEST UPDATES
                </h3>
              </div>

              <div className="space-y-3 px-3 py-4">
                {latestUpdates.map((item) => (
                  <div
                    key={`${item.date}-${item.text}`}
                    className="group grid grid-cols-[40px_minmax(0,1fr)] gap-2 rounded-md px-2 py-2 transition-all duration-200 hover:bg-slate-50 hover:shadow-[0_3px_10px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-col items-center justify-center rounded-sm bg-slate-100 px-1 py-1 text-center text-[10px] font-semibold leading-tight text-slate-500 transition-colors group-hover:bg-slate-200 group-hover:text-slate-600">
                      <span>{item.date.split(" ")[0]}</span>
                      <span>{item.date.split(" ")[1]}</span>
                      <span>{item.date.split(" ")[2]}</span>
                    </div>
                    <p className="text-[12.5px] font-semibold leading-5 text-blue-700/90 transition-colors group-hover:text-blue-800">
                      • {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-3 text-right text-[14px] font-semibold text-blue-600">
                Previous Updates
              </div>
            </aside>
          </div>

          <div className="pb-8" />
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 bg-[#245f87] px-6 py-4 text-white">
        <div className="mx-auto w-full max-w-[1780px]">
          <div className="text-[16px] font-semibold uppercase tracking-wide">
            IMPORTANT LINKS
          </div>
        </div>
      </footer>

      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[438px] rounded-[14px] border border-white/70 bg-[#dbe3ee] px-4 pb-4 pt-3 shadow-[0_24px_60px_rgba(15,23,42,0.34)]">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/55 text-[22px] font-semibold leading-none text-[#2f4f7d] shadow-sm ring-1 ring-white/60"
              aria-label="Close login modal"
            >
              ×
            </button>

            <div className="flex flex-col items-center pt-5">
              <div className="flex flex-col items-center">
                <img
                  src="/images/simulations/satyamev-jayate.jpg"
                  alt="Satyamev Jayate emblem"
                  className="h-[72px] w-[72px] object-contain"
                />
                <div className="mt-1 text-[10px] leading-none text-slate-700">
                  सत्यमेव जयते
                </div>
              </div>
              <div className="mt-2 text-[19px] font-semibold tracking-tight text-red-600">
                E-INVOICE SYSTEM LOGIN
              </div>
              <div className="mt-1 text-[11px] leading-none text-slate-500">
                Enter username and password to login
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="rounded-[4px] border border-slate-300/70 bg-white/45 px-2 py-1 text-[11px] leading-4 text-slate-500">
                Use <span className="font-medium text-slate-700">AIR</span> as
                username and <span className="font-medium text-slate-700">IICPA@123</span>{" "}
                as password to login
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-normal text-slate-600">
                  User name
                </label>
                <input
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="h-[34px] w-full rounded-[4px] border border-slate-300/80 bg-white px-2 text-[13px] text-slate-900 shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-normal text-slate-600">
                  Password
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="h-[34px] w-full rounded-[4px] border border-slate-300/80 bg-white px-2 text-[13px] text-slate-900 shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="mb-1 text-[14px] font-normal text-slate-600">
                  Captcha
                </div>
                <div className="flex items-center justify-start">
                  <div className="flex h-8 w-[205px] items-center justify-center overflow-hidden rounded-[4px] border border-slate-300/90 bg-white px-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="grid h-full w-full place-items-center border border-dashed border-slate-400 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.22)_1px,transparent_0)] bg-[length:6px_6px]">
                      <span className="font-mono text-[25px] font-black leading-none tracking-[-0.08em] text-black">
                        P2B7(Y
                      </span>
                    </div>
                  </div>
                </div>
                <input
                  value={loginData.captcha}
                  onChange={(e) =>
                    setLoginData((prev) => ({ ...prev, captcha: e.target.value }))
                  }
                  className="mt-2 h-[34px] w-full rounded-[4px] border border-slate-300/80 bg-white px-2 text-[13px] text-slate-900 shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter Above Captcha"
                />
              </div>

              <button
                onClick={handleLogin}
                className="mt-1 h-10 w-full rounded-[4px] border border-red-500 bg-[#0f69e7] text-[15px] font-medium tracking-wide text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset] transition-colors hover:bg-[#0b5fd3]"
              >
                LOGIN
              </button>

              <div className="flex items-center justify-between pt-1 text-[12px] text-blue-700">
                <a href="#" className="hover:underline">
                  Forgot Password ?
                </a>
                <a href="#" className="hover:underline">
                  Forgot Username ?
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 28s linear infinite;
        }

        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="sticky top-0 z-50 w-full">
        <div className="bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
          This is a Simulation. Use For Educational Purposes ONLY.
        </div>

        <div className="bg-[#f4f7fb] px-0 pb-0 pt-0">
          <div className="bg-[#24668f] text-white">
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
                      e - INVOICE SYSTEM
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[14px] font-bold lg:text-[16px]">e-Invoice 1 Portal</div>
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

            <div className="border-t border-white/15 bg-[#ccd4e9] px-4 py-2.5 text-[12px] text-slate-700 lg:text-[14px]">
              <div className="flex items-center justify-between gap-4 whitespace-nowrap">
                <div className="text-left whitespace-nowrap">
                  GSTIN: 09ABCDE1234F1Z5 - Name: ABC XYZ Private Limited
                </div>
                <div className="whitespace-nowrap">Account : Main User</div>
                <div className="whitespace-nowrap">Client IP:1.1.1.1</div>
                <button
                  onClick={startAgain}
                  className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                >
                  Start Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-0 pt-0">
        <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
          <div className="flex min-h-[calc(100vh-128px)] w-full">
            <aside className="sticky top-[175px] flex h-[calc(100vh-128px)] w-[260px] flex-col bg-[#d7def0]">
              <div className="border-b border-white/60 px-4 py-3">
                <div className="flex w-full items-center gap-3 rounded-sm bg-[#2f7fd3] px-3 py-2 text-[12px] font-semibold text-white shadow-sm">
                  <span className="text-lg leading-none">e</span>
                  <span>e-Way bill Portal</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className={isInvoiceMenuOpen ? "overflow-hidden border-2 border-red-500 bg-[#d7def0]" : ""}>
                  <button
                    onClick={() => setIsInvoiceMenuOpen((current) => !current)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-[12px] font-medium text-slate-700 ${
                      isInvoiceMenuOpen
                        ? "bg-[#cbd3f2] border-b border-red-500/80"
                        : "border-2 border-red-500 bg-[#d7def0]"
                    } hover:bg-[#e8edf8]`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={15} className="text-slate-600" />
                      <span>e-Invoice</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-slate-500 transition-transform ${
                        isInvoiceMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isInvoiceMenuOpen && (
                    <div className="bg-[#d7def0]">
                      <button className="flex w-full items-center justify-between border-t border-white/60 bg-[#d7def0] px-4 py-3 text-left text-[12px] font-medium text-slate-700 hover:bg-[#e8edf8]">
                        <div className="flex items-center gap-3">
                          <FileText size={15} className="text-slate-600" />
                          <span>Bulk Upload</span>
                        </div>
                      </button>
                      <button className="flex w-full items-center justify-between border-t border-white/60 bg-[#d7def0] px-4 py-3 text-left text-[12px] font-medium text-slate-700 hover:bg-[#e8edf8]">
                        <div className="flex items-center gap-3">
                          <FileText size={15} className="text-slate-600" />
                          <span>Cancel</span>
                        </div>
                      </button>
                      <div className="overflow-hidden border-2 border-red-500 bg-[#d7def0]">
                        <button
                          onClick={openPrintScreen}
                          className="flex w-full items-center justify-between bg-[#cbd3f2] px-4 py-3 text-left text-[12px] font-medium text-slate-700 hover:bg-[#e8edf8]"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={15} className="text-slate-600" />
                            <span>Print</span>
                          </div>
                        </button>
                      </div>
                      <button className="flex w-full items-center justify-between border-t border-white/60 bg-[#d7def0] px-4 py-3 text-left text-[12px] font-medium text-slate-700 hover:bg-[#e8edf8]">
                        <div className="flex items-center gap-3">
                          <FileText size={15} className="text-slate-600" />
                          <span>Bulk IRN Cancel</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {sidebarMenuItems.map(({ label, Icon }, index) => (
                  <button
                    key={label}
                    className="flex w-full items-center justify-between border-b border-white/60 bg-[#d7def0] px-4 py-3 text-left text-[12px] font-medium text-slate-700 hover:bg-[#e8edf8]"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={15} className="text-slate-600" />
                      <span>{label}</span>
                    </div>
                    {index < sidebarMenuItems.length - 1 ? (
                      <ChevronDown size={14} className="text-slate-500" />
                    ) : null}
                  </button>
                ))}
              </div>
            </aside>

            <main className="flex-1 px-3 py-3 lg:px-4">
              <div className="w-full">
                <div className="grid gap-4">
                  <section className="rounded-b-xl bg-white shadow-sm">
                    <div className="px-6 pt-3 text-center text-[18px] font-extrabold text-[#1b66a0] lg:text-[22px]">
                      Dash Board
                    </div>

                    <div className="mt-3 grid gap-4 px-4 md:grid-cols-2 lg:px-6">
                      <div className="rounded border border-blue-200">
                        <div className="flex items-center justify-between bg-blue-500 px-4 py-2.5 text-white">
                          <div className="text-[12px] font-semibold">Generations</div>
                          <div className="text-[12px]">◔</div>
                        </div>
                        <div className="bg-white px-4 py-3 text-[12px] text-slate-700 lg:text-[13px]">
                          <div className="flex justify-between border-b border-slate-200 py-1.5">
                            <span className="underline">Yesterday</span>
                            <span className="underline">0</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="underline">During This month</span>
                            <span className="underline">67</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded border border-red-200">
                        <div className="flex items-center justify-between bg-red-500 px-4 py-2.5 text-white">
                          <div className="text-[12px] font-semibold">Cancelled</div>
                          <div className="text-[12px]">↪</div>
                        </div>
                        <div className="bg-white px-4 py-3 text-[12px] text-slate-700 lg:text-[13px]">
                          <div className="flex justify-between border-b border-slate-200 py-1.5">
                            <span className="underline">Yesterday</span>
                            <span className="underline">0</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="underline">During This month</span>
                            <span className="underline">0</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mx-4 mt-4 rounded border border-slate-200 bg-white lg:mx-6">
                      <div className="border-b border-slate-200 px-4 py-2 text-[13px] font-semibold text-cyan-500 lg:text-[14px]">
                        Notes:
                      </div>
                      <div className="space-y-2.5 px-4 py-3 text-[12px] leading-5 text-slate-700 lg:px-6 lg:text-[13px] lg:leading-6">
                        <div className="flex gap-3">
                          <span>•</span>
                          <span>
                            The Bulk IRN generation facility has been enabled.
                            You may download the tools from the portal under Help
                            -&gt; Tools.
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <span>•</span>
                          <span>
                            The e-Waybills generated in this portal will be
                            reflected in the e-waybill system. To Update Part-B
                            details, cancel or extend, you may login to
                            e-waybill system with same credentials.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-4 py-4 lg:px-6">
                      <button
                        onClick={startAgain}
                        className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Back to Portal
                      </button>
                      <button
                        onClick={startAgain}
                        className="rounded-md bg-blue-700 px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-blue-800"
                      >
                        Start Again
                      </button>
                    </div>
                  </section>

                </div>

                <div className="mt-3 flex items-center justify-between bg-[#1d5d83] px-4 py-2 text-white">
                  <div className="text-[11px] lg:text-[12px]">Version 1.03</div>
                  <div className="text-[11px] lg:text-[12px]">
                    © 2022 - Powered By National Informatics Centre.
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );

  const portalView =
    view === "dashboard" ? renderDashboard() : view === "print" ? renderPrintScreen() : renderHome();

  return (
    <div className={`relative min-h-screen ${showLaunchScreen ? "overflow-hidden" : ""}`}>
      {portalView}

      {showLaunchScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4 text-white backdrop-blur-[4px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.38),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_24%),radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.42)_0%,rgba(233,241,252,0.28)_35%,rgba(255,255,255,0.18)_100%)]" />
          <div className="absolute inset-0 bg-white/8" />
          <div className="absolute inset-0 opacity-[0.04]">
            <div className="grid h-full grid-cols-12 gap-4 p-6">
              {Array.from({ length: 132 }).map((_, index) => (
                <div key={index} className="rounded-md border border-slate-500/20" />
              ))}
            </div>
          </div>

          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <button
              onClick={handleStartExperiment}
              disabled={isStartingExperiment}
              className="inline-flex min-h-[66px] w-[min(78vw,32rem)] items-center justify-center rounded-[22px] bg-[#1f4eb8] px-6 text-[16px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_14px_34px_rgba(31,78,184,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#18439c] disabled:cursor-wait disabled:opacity-90 sm:min-h-[72px] sm:w-[min(72vw,34rem)] sm:px-7 sm:text-[18px]"
              aria-label="Start experiment"
            >
              {isStartingExperiment ? "EXPERIMENTING..." : "START EXPERIMENT"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
