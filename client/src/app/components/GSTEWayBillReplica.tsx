"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleAlert,
  CheckCircle2,
  Info,
  LogIn,
  LogOut,
  Menu,
  Printer,
  Settings,
  RotateCcw,
  Video,
} from "lucide-react";
import GSTBannerCarousel from "./GSTBannerCarousel";
import {
  findFieldValue,
  getSimCfgIdFromLocation,
  useSimulationConfig,
} from "@/lib/useSimulationConfig";

type Screen = "home" | "generate" | "search" | "print" | "dashboard" | "experiment4";

type GSTEWayBillReplicaProps = {
  initialScreen?: Screen;
  generateLayout?: "portal" | "content";
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
  },
  {
    date: "26 MAY 2023",
    text: "Latest updates on 2 Factor Authentication, Deregistration of Enrolment and Common Enrolment have been issued.",
  },
  {
    date: "07 OCT 2022",
    text: "Single sign-on (SSO) for e-Invoice and e-Waybill enabled.",
  },
  {
    date: "14 SEP 2022",
    text: "e-Waybill for Gold will be available only after the notification is issued by Government.",
  },
];

const generateModes = ["Road", "Rail", "Air", "Ship or Ship Cum Road/Rail"];
const vehicleTypes = ["Regular", "Over Dimensional Cargo"];
const gstRateOptions = ["0", "0.25", "3", "5", "12", "18", "28"];

// /simulations/gst/e-way-bill-4 -> gst-e-way-bill-4 (must match the slug
// derivation used by the course editor's Topic Simulations creds list).
const slugFromRoute = (route: string): string => {
  const match = route.match(/\/simulations\/(.+)/);
  if (!match) return "";
  return match[1].replace(/\/+$/, "").split("/").join("-").toLowerCase();
};

export default function GSTEWayBillReplica({
  initialScreen = "home",
  generateLayout = "portal",
  portalTitle = "e-Way Bill Portal",
  companyName = "ABC XYZ Private Limited",
  baseRoute = "/simulations/gst/e-way-bill-1",
  loginRoute = "/simulations/gst/e-way-bill-login",
  launchTitle = "GST E-Way Bill Simulation",
  initialShowLaunchScreen = true,
}: GSTEWayBillReplicaProps) {
  const router = useRouter();
  const screen = initialScreen;
  const [showLaunchScreen, setShowLaunchScreen] = useState(initialShowLaunchScreen);
  const [isStartingExperiment, setIsStartingExperiment] = useState(false);
  const [selectedMode, setSelectedMode] = useState("Road");
  const [selectedVehicleType, setSelectedVehicleType] = useState("Regular");
  const [vehicleNo, setVehicleNo] = useState("MH12AB1234");
  const [distanceKm, setDistanceKm] = useState("");
  const [transporterDocNo, setTransporterDocNo] = useState("");
  const [vehicleDetailsError, setVehicleDetailsError] = useState("");
  const [showVehiclePreview, setShowVehiclePreview] = useState(false);
  const [isExperiment4Submitted, setIsExperiment4Submitted] = useState(false);
  const [itemProductName, setItemProductName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemHsn, setItemHsn] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemTaxableValue, setItemTaxableValue] = useState("");
  const [itemGstRate, setItemGstRate] = useState("");
  const [totalTaxableAmount, setTotalTaxableAmount] = useState("");
  const [cgstAmount, setCgstAmount] = useState("");
  const [sgstAmount, setSgstAmount] = useState("");
  const [igstAmount, setIgstAmount] = useState("");
  const [cessAdvolAmount, setCessAdvolAmount] = useState("");
  const [cessNonAdvolAmount, setCessNonAdvolAmount] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [totalInvAmount, setTotalInvAmount] = useState("");
  const launchTimerRef = useRef<number | null>(null);
  const experiment4Config = useSimulationConfig(slugFromRoute(baseRoute));

  useEffect(() => {
    if (!experiment4Config) return;
    const productName = findFieldValue(experiment4Config, /product/i);
    const description = findFieldValue(experiment4Config, /description/i);
    const hsn = findFieldValue(experiment4Config, /hsn/i);
    const quantity = findFieldValue(experiment4Config, /qty|quantity/i);
    const unit = findFieldValue(experiment4Config, /unit/i);
    const taxableValue = findFieldValue(experiment4Config, /value|price/i);
    const gstRate = findFieldValue(experiment4Config, /gst|tax rate/i);

    if (productName) setItemProductName(productName);
    if (description) setItemDescription(description);
    if (hsn) setItemHsn(hsn);
    if (quantity) setItemQuantity(quantity);
    if (unit) setItemUnit(unit);
    if (taxableValue) setItemTaxableValue(taxableValue);
    if (gstRate) setItemGstRate(gstRate);

    const vehicleNumber = findFieldValue(experiment4Config, /vehicle/i);
    const distance = findFieldValue(experiment4Config, /distance|km/i);
    const docNo = findFieldValue(experiment4Config, /doc/i);

    if (vehicleNumber) setVehicleNo(vehicleNumber);
    if (distance) setDistanceKm(distance);
    if (docNo) setTransporterDocNo(docNo);
  }, [experiment4Config]);

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
    if (launchTimerRef.current !== null) {
      window.clearTimeout(launchTimerRef.current);
    }
    launchTimerRef.current = window.setTimeout(() => {
      setShowLaunchScreen(false);
      setIsStartingExperiment(false);
      launchTimerRef.current = null;
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

  const handleRetryVehiclePreview = () => {
    setVehicleNo("");
    setDistanceKm("");
    setTransporterDocNo("");
    setVehicleDetailsError("");
    setShowVehiclePreview(false);
  };

  const handleSubmitVehiclePreview = () => {
    if (experiment4Config?.requireCredentialValidation) {
      const expectedVehicleNo = findFieldValue(experiment4Config, /vehicle/i);
      const expectedDistance = findFieldValue(experiment4Config, /distance|km/i);
      const expectedDocNo = findFieldValue(experiment4Config, /doc/i);
      const onlyDigits = (value: string) => value.replace(/[^0-9.]/g, "");

      const isValid =
        (!expectedVehicleNo ||
          vehicleNo.trim().toUpperCase() === expectedVehicleNo.trim().toUpperCase()) &&
        (!expectedDistance || onlyDigits(distanceKm) === onlyDigits(expectedDistance)) &&
        (!expectedDocNo ||
          transporterDocNo.trim().toUpperCase() === expectedDocNo.trim().toUpperCase());

      if (!isValid) {
        setVehicleDetailsError(
          "Invalid details. Please use the values provided for this experiment."
        );
        return;
      }
    }
    setVehicleDetailsError("");
    setShowVehiclePreview(true);
  };

  const handleReturnToLaunch = () => {
    if (launchTimerRef.current !== null) {
      window.clearTimeout(launchTimerRef.current);
      launchTimerRef.current = null;
    }

    setIsStartingExperiment(false);
    setSelectedMode("Road");
    setSelectedVehicleType("Regular");
    setVehicleNo("MH12AB1234");
    setDistanceKm("");
    setTransporterDocNo("");
    setVehicleDetailsError("");
    setShowVehiclePreview(false);
    setShowLaunchScreen(true);
  };

  const handleSubmitExperiment4 = () => {
    setIsExperiment4Submitted(true);
  };

  const handleRetryExperiment4 = () => {
    setIsExperiment4Submitted(false);
  };

  const renderVehiclePreview = () => (
    <div className="rounded-[12px] border border-[#d8ecf6] bg-white p-4 shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-[8px] border border-slate-300 bg-white shadow-[0_1px_6px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-[#ececf2] px-4 py-3 text-center">
          <div className="text-[20px] font-bold text-slate-800">e-Way Bill</div>
        </div>

        <div className="px-4 py-4">
          <div className="mx-auto flex h-28 w-28 items-center justify-center border border-slate-300 bg-white p-2">
            <img
              src="/images/simulations/qr-gst.webp"
              alt="E-Way Bill QR code"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-[2px] border border-slate-200">
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 font-medium text-slate-700">
                E-Way Bill No:
              </div>
              <div className="px-2 py-1 font-semibold text-slate-900">975741208388</div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 font-medium text-slate-700">
                E-Way Bill Date:
              </div>
              <div className="px-2 py-1 font-semibold text-slate-900">May 08 2026 23:52</div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 font-medium text-slate-700">
                Generated By:
              </div>
              <div className="px-2 py-1 font-semibold text-slate-900">
                09ABCDE1234F1Z5 - Name: {companyName}
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 font-medium text-slate-700">
                Valid From:
              </div>
              <div className="px-2 py-1 font-semibold text-slate-900">May 08 2026 23:52</div>
            </div>
            <div className="grid grid-cols-[140px_1fr] text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 font-medium text-slate-700">
                Valid Until:
              </div>
              <div className="px-2 py-1 font-semibold text-slate-900">May 09 2026 23:52</div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden border border-slate-200">
            <div className="bg-[#8b7bc6] px-3 py-1.5 text-[13px] font-bold text-white">Part - A</div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">GSTIN of Supplier</div>
              <div className="px-2 py-1 font-semibold text-slate-900">
                09ABCDE1234F1Z5 - Name: {companyName}
              </div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">Place of Dispatch</div>
              <div className="px-2 py-1 font-semibold text-slate-900">Noida, Uttar Pradesh: 201301</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">GSTIN of Recipient</div>
              <div className="px-2 py-1 font-semibold text-slate-900">09ZZZZZ6789K1Z2 Name: ZZZZ Enterprises LLP</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">Place of Delivery</div>
              <div className="px-2 py-1 font-semibold text-slate-900">Sector 18, Noida, Uttar Pradesh</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">Document No.</div>
              <div className="px-2 py-1 font-semibold text-slate-900">AB134</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">Document Date</div>
              <div className="px-2 py-1 font-semibold text-slate-900">May 08 2026</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">Transaction Type:</div>
              <div className="px-2 py-1 font-semibold text-slate-900">1</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">Value of Goods</div>
              <div className="px-2 py-1 font-semibold text-slate-900">500000</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-slate-200 text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">HSN Code</div>
              <div className="px-2 py-1 font-semibold text-slate-900">720690</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] text-[13px]">
              <div className="border-r border-slate-200 px-2 py-1 text-slate-700">
                Reason for Transportation
              </div>
              <div className="px-2 py-1 font-semibold text-slate-900">Supply - 1</div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden border border-slate-200">
            <div className="bg-[#8b7bc6] px-3 py-1.5 text-[13px] font-bold text-white">Part - B</div>
            <div className="grid grid-cols-[90px_110px_1fr_120px_120px] border-b border-slate-200 bg-[#ddd4f2] text-[11px] font-semibold text-slate-700">
              <div className="px-2 py-1">Mode</div>
              <div className="px-2 py-1">Vehicle / Trans Doc No & Dt.</div>
              <div className="px-2 py-1">From</div>
              <div className="px-2 py-1">Entered Date</div>
              <div className="px-2 py-1">Entered By</div>
            </div>
            <div className="grid grid-cols-[90px_110px_1fr_120px_120px] border-b border-slate-200 text-[12px]">
              <div className="px-2 py-2">Road</div>
              <div className="px-2 py-2">{vehicleNo || "1402"}</div>
              <div className="px-2 py-2">#14, 2nd Floor, Off Veera Desai Rd.</div>
              <div className="px-2 py-2">May 08 2026 23:52</div>
              <div className="px-2 py-2">27MNHFP2782H1YZ</div>
            </div>
            <div className="flex justify-center px-4 py-3">
              <div className="flex flex-col items-center">
                <img
                  src="/images/simulations/barcode-image.jpg"
                  alt="E-Way Bill barcode"
                  className="h-16 w-40 object-contain"
                />
                <div className="mt-1 text-[10px] text-slate-500">182314594723038</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-[#f2f2f2] px-3 py-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded bg-[#6b5fc2] px-4 py-2 text-[13px] font-semibold text-white"
              >
                <Printer size={14} />
                Print
              </button>
              <button
                type="button"
                onClick={handleRetryVehiclePreview}
                className="inline-flex items-center gap-2 rounded bg-[#ea7a68] px-4 py-2 text-[13px] font-semibold text-white"
              >
                <RotateCcw size={14} />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenerateContent = () => (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="w-full px-4 py-4">
        <div className="w-full rounded-[12px] border border-[#d8ecf6] bg-white p-4 shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
          <div className="overflow-hidden rounded-[8px] border border-[#d8d8df] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
            <div className="bg-[#a58ad6] px-3 py-2 text-[16px] font-semibold text-slate-800">
              Transportation Details
            </div>

            <div className="grid gap-4 border-b border-slate-200 px-3 py-4 lg:grid-cols-[1.1fr_1.1fr_1fr_1fr]">
              <label className="grid gap-1 text-[14px] text-slate-700">
                <span>Transporter ID</span>
                <input
                  type="text"
                  className="h-10 rounded border border-slate-300 px-3 text-[14px] outline-none"
                />
              </label>
              <label className="grid gap-1 text-[14px] text-slate-700">
                <span>Transporter Name</span>
                <input
                  type="text"
                  className="h-10 rounded border border-slate-300 px-3 text-[14px] outline-none"
                  placeholder="Name"
                />
              </label>
              <div className="grid gap-1 text-[14px] text-slate-700">
                <span>Auto Calculated PIN to PIN (in KM)</span>
                <div className="h-10 rounded border border-dashed border-slate-300 bg-slate-50 px-3" />
              </div>
              <label className="grid gap-1 text-[14px] text-slate-700">
                <span className="flex items-center gap-1">
                  Approximate Distance (in KM)
                  <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  value={distanceKm}
                  onChange={(e) => {
                    setVehicleDetailsError("");
                    setDistanceKm(e.target.value);
                  }}
                  className="h-10 rounded border border-slate-300 px-3 text-[14px] outline-none"
                />
              </label>
            </div>

            <div className="bg-[#a58ad6] px-3 py-2 text-[16px] font-semibold text-slate-800">
              PART-B
            </div>

            <div className="border-b border-slate-200">
              <div className="grid gap-2 px-3 py-3 lg:grid-cols-[1.1fr_1.3fr] lg:items-center">
                <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-700">
                  <span>Mode</span>
                  {generateModes.map((mode) => (
                    <label key={mode} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="mode"
                        checked={selectedMode === mode}
                        onChange={() => setSelectedMode(mode)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-700">
                  <span>Vehicle Type</span>
                  {vehicleTypes.map((vehicleType) => (
                    <label key={vehicleType} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="vehicleType"
                        checked={selectedVehicleType === vehicleType}
                        onChange={() => setSelectedVehicleType(vehicleType)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span>{vehicleType}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-0 border-t border-slate-200 lg:grid-cols-[1fr_1.2fr]">
                <label className="flex items-center gap-3 border-b border-slate-200 px-3 py-4 text-[14px] text-slate-700 lg:border-b-0 lg:border-r">
                  <span className="whitespace-nowrap">Vehicle No.</span>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => {
                      setVehicleDetailsError("");
                      setVehicleNo(e.target.value);
                    }}
                    className="h-11 w-full max-w-[165px] rounded border-2 border-red-500 px-3 text-[14px] outline-none"
                  />
                </label>

                <div className="grid gap-3 px-3 py-4 lg:grid-cols-[1fr_220px] lg:items-center">
                  <label className="flex items-center gap-3 text-[14px] text-slate-700">
                    <span className="whitespace-nowrap">Transporter Doc. No. & Date</span>
                    <input
                      type="text"
                      value={transporterDocNo}
                      onChange={(e) => {
                        setVehicleDetailsError("");
                        setTransporterDocNo(e.target.value);
                      }}
                      className="h-11 min-w-0 flex-1 rounded border border-slate-300 px-3 text-[14px] outline-none"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="dd/mm/yy"
                    className="h-11 rounded border border-slate-300 px-3 text-[14px] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-3 py-6">
              {vehicleDetailsError && (
                <div className="mb-3 flex justify-center">
                  <div className="max-w-[1120px] rounded-sm border border-red-300 bg-red-50 px-4 py-2 text-center text-[13px] text-red-600">
                    {vehicleDetailsError}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  className="min-w-[84px] rounded-sm bg-[#d7a14b] px-4 py-2 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#c88b33]"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVehiclePreview}
                  className="min-w-[112px] rounded-sm bg-[#5e56b6] px-4 py-2 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#4d46a8]"
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="min-w-[104px] rounded-sm bg-[#de776b] px-4 py-2 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#d36154]"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-4 flex justify-center">
                <div className="max-w-[1120px] rounded-full bg-[#d9d9dd] px-4 py-2 text-center text-[13px] leading-5 text-slate-700 shadow-inner">
                  <span className="font-semibold">Note:</span> Railway Receipt numbers are
                  validated as per the given formats. If you have RR number other than these
                  formats then, please raise a ticket by mentioning the RR no. Presently, the
                  validation is optional, but in future, invalid formats will not be allowed.
                </div>
              </div>
            </div>
          </div>

          {showVehiclePreview && (
            <div className="mt-4 min-h-[520px] rounded-[8px] border border-[#e0e0e0] bg-white p-4">
              {renderVehiclePreview()}
            </div>
          )}
        </div>
      </main>
    </div>
  );

  const experiment4ItemFields: {
    key: string;
    value: string;
    onChange: (value: string) => void;
    type: "text" | "select";
    disabled?: boolean;
  }[] = [
    { key: "Product Name", value: itemProductName, onChange: setItemProductName, type: "text" },
    { key: "Description", value: itemDescription, onChange: setItemDescription, type: "text" },
    { key: "HSN", value: itemHsn, onChange: setItemHsn, type: "text" },
    { key: "Quantity", value: itemQuantity, onChange: setItemQuantity, type: "text" },
    { key: "Unit", value: itemUnit, onChange: setItemUnit, type: "text" },
    { key: "Value/Taxable Value (Rs.)", value: itemTaxableValue, onChange: setItemTaxableValue, type: "text" },
    { key: "CGST+ SGST Rate(%)", value: itemGstRate, onChange: setItemGstRate, type: "select" },
  ];

  const experiment4TotalFields: {
    key: string;
    value: string;
    onChange: (value: string) => void;
  }[] = [
    { key: "Total Tax'ble Amount", value: totalTaxableAmount, onChange: setTotalTaxableAmount },
    { key: "CGST Amount", value: cgstAmount, onChange: setCgstAmount },
    { key: "SGST Amount", value: sgstAmount, onChange: setSgstAmount },
    { key: "IGST Amount", value: igstAmount, onChange: setIgstAmount },
    { key: "CESS Advol Amount", value: cessAdvolAmount, onChange: setCessAdvolAmount },
    { key: "CESS Non Advol Amount", value: cessNonAdvolAmount, onChange: setCessNonAdvolAmount },
    { key: "Other Amount(+/-)", value: otherAmount, onChange: setOtherAmount },
    { key: "Total Inv. Amount", value: totalInvAmount, onChange: setTotalInvAmount },
  ];

  const renderExperiment4Screen = () => (
    <div className="min-h-screen bg-[#f4f7fb] pb-8 text-slate-900">
      <main className="px-4 py-4">
        <div className="rounded-[12px] border border-[#d8ecf6] bg-[#dff3fb] p-4 shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
          <div className="overflow-hidden rounded-[8px] border border-[#d8d8df] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
            <div className="bg-[#a58ad6] px-4 py-3 text-[16px] font-semibold text-slate-800">
              Item Details
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px] p-3">
                <div className="grid grid-cols-[1.25fr_1.15fr_1fr_1fr_1fr_1.2fr_1fr] border border-slate-200 text-[12px]">
                  {["Product Name", "Description", "HSN", "Quantity", "Unit", "Value/Taxable Value (Rs.)", "CGST+ SGST Rate(%)"].map(
                    (label, index) => (
                      <div key={label} className="border-r border-slate-200 px-3 py-2 last:border-r-0">
                        <span className="inline-flex items-center gap-1">
                          <span>{label}</span>
                          {index !== 1 && <CheckCircle2 size={11} className="text-green-500" />}
                        </span>
                      </div>
                    ),
                  )}
                  {experiment4ItemFields.map((field) =>
                    field.type === "select" ? (
                      <div
                        key={field.key}
                        className="border-t border-r border-slate-200 px-2 py-2 last:border-r-0"
                      >
                        <select
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-10 w-full rounded border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none"
                        >
                          <option value="">-Select-</option>
                          {gstRateOptions.map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}%
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div
                        key={field.key}
                        className="border-t border-r border-slate-200 px-2 py-2 last:border-r-0"
                      >
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder={field.key}
                          className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-[13px] text-slate-700 outline-none focus:border-[#5e56b6]"
                        />
                      </div>
                    ),
                  )}
                </div>

                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-x border-b border-slate-200 text-[12px]">
                  {experiment4TotalFields.map((field) => (
                    <div key={field.key} className="border-r border-slate-200 px-3 py-2 last:border-r-0">
                      <span className="inline-flex items-center gap-1">
                        <span>{field.key}</span>
                        <CheckCircle2 size={11} className="text-green-500" />
                      </span>
                    </div>
                  ))}
                  {experiment4TotalFields.map((field) => (
                    <div
                      key={field.key}
                      className="border-t border-r border-slate-200 px-2 py-2 last:border-r-0"
                    >
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-[13px] text-slate-700 outline-none focus:border-[#5e56b6]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3">
              {isExperiment4Submitted ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] font-semibold text-green-700">
                    <CheckCircle2 size={15} className="text-green-600" />
                    Submitted
                  </div>
                  <button
                    type="button"
                    onClick={handleRetryExperiment4}
                    className="inline-flex items-center gap-2 rounded-md bg-[#e1141a] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(225,20,26,0.18)] transition-colors hover:bg-[#c90f15]"
                  >
                    <RotateCcw size={14} />
                    Retry
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitExperiment4}
                  className="inline-flex items-center gap-2 rounded-md bg-[#5e56b6] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(94,86,182,0.18)] transition-colors hover:bg-[#4d46a8]"
                >
                  <CheckCircle2 size={14} />
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderGenerateScreen = () =>
    generateLayout === "portal" ? (
      <div className="min-h-screen bg-[#eef1f5] text-slate-900">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
          <div className="mx-auto flex max-w-[1760px] items-center gap-4 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#f5f7fb] text-lg font-black text-slate-700">
                  ⟲
                </div>
                <div>
                  <div className="text-[22px] font-extrabold leading-none text-slate-900">
                    E-Way Bill
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-3 w-28 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-[16%] rounded-full bg-[#4976d1]" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-600">16%</span>
                  </div>
                </div>
              </div>

              <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-[14px] text-slate-700 shadow-sm outline-none">
                <option>Language</option>
              </select>
            </div>

            <div className="flex-1 text-center text-[20px] font-semibold text-slate-900">
              Generate
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-[#fff8e8] px-4 py-2 text-[18px] font-extrabold text-[#f08a00] shadow-sm">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ffd55b] text-white shadow-inner">
                <span className="text-[16px]">₹</span>
              </span>
              <span>1850</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <aside className="fixed left-0 top-[73px] z-20 flex h-[calc(100vh-73px)] w-[72px] flex-col items-center border-r border-slate-200 bg-[#b8d2fb] px-2 py-4 shadow-[1px_0_0_rgba(15,23,42,0.04)]">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/75 shadow-sm">
              <img
                src="/images/simulations/red-1-logo.png"
                alt="FinCl"
                className="h-7 w-7 object-contain"
              />
            </div>

            <div className="flex flex-1 flex-col items-center gap-5 pt-2">
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                aria-label="Menu"
              >
                <Menu size={24} />
              </button>
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-red-500 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                aria-label="Video"
              >
                <Video size={22} />
              </button>
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-amber-500 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                aria-label="Settings"
              >
                <Settings size={22} />
              </button>
            </div>

            <div className="mt-auto flex flex-col items-center gap-4 pb-2">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-transparent text-slate-700"
                aria-label="Help"
              >
                <Info size={20} />
              </button>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-transparent text-slate-700"
                aria-label="Alerts"
              >
                <CircleAlert size={20} />
              </button>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-transparent text-slate-700"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </aside>

          <main className="pl-[72px]">
            <div className="px-4 py-4">
              <div className="rounded-[12px] border border-[#d8ecf6] bg-[#dff3fb] p-4 shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
                <div className="overflow-hidden rounded-[8px] border border-[#d8d8df] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
                  <div className="bg-[#a58ad6] px-3 py-2 text-[16px] font-semibold text-slate-800">
                    Transportation Details
                  </div>

                  <div className="grid gap-4 border-b border-slate-200 px-3 py-4 lg:grid-cols-[1.1fr_1.1fr_1fr_1fr]">
                    <label className="grid gap-1 text-[14px] text-slate-700">
                      <span>Transporter ID</span>
                      <input
                        type="text"
                        className="h-10 rounded border border-slate-300 px-3 text-[14px] outline-none"
                      />
                    </label>
                    <label className="grid gap-1 text-[14px] text-slate-700">
                      <span>Transporter Name</span>
                      <input
                        type="text"
                        className="h-10 rounded border border-slate-300 px-3 text-[14px] outline-none"
                        placeholder="Name"
                      />
                    </label>
                    <div className="grid gap-1 text-[14px] text-slate-700">
                      <span>Auto Calculated PIN to PIN (in KM)</span>
                      <div className="h-10 rounded border border-dashed border-slate-300 bg-slate-50 px-3" />
                    </div>
                    <label className="grid gap-1 text-[14px] text-slate-700">
                      <span className="flex items-center gap-1">
                        Approximate Distance (in KM)
                        <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        className="h-10 rounded border border-slate-300 px-3 text-[14px] outline-none"
                      />
                    </label>
                  </div>

                  <div className="bg-[#a58ad6] px-3 py-2 text-[16px] font-semibold text-slate-800">
                    PART-B
                  </div>

                  <div className="border-b border-slate-200">
                    <div className="grid gap-2 px-3 py-3 lg:grid-cols-[1.1fr_1.3fr] lg:items-center">
                      <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-700">
                        <span>Mode</span>
                        {generateModes.map((mode) => (
                          <label key={mode} className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="mode"
                              checked={selectedMode === mode}
                              onChange={() => setSelectedMode(mode)}
                              className="h-4 w-4 accent-blue-600"
                            />
                            <span>{mode}</span>
                          </label>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-700">
                        <span>Vehicle Type</span>
                        {vehicleTypes.map((vehicleType) => (
                          <label key={vehicleType} className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="vehicleType"
                              checked={selectedVehicleType === vehicleType}
                              onChange={() => setSelectedVehicleType(vehicleType)}
                              className="h-4 w-4 accent-blue-600"
                            />
                            <span>{vehicleType}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-0 border-t border-slate-200 lg:grid-cols-[1fr_1.2fr]">
                      <label className="flex items-center gap-3 border-b border-slate-200 px-3 py-4 text-[14px] text-slate-700 lg:border-b-0 lg:border-r">
                        <span className="whitespace-nowrap">Vehicle No.</span>
                        <input
                          type="text"
                          value={vehicleNo}
                          onChange={(e) => setVehicleNo(e.target.value)}
                          className="h-11 w-full max-w-[165px] rounded border-2 border-red-500 px-3 text-[14px] outline-none"
                        />
                      </label>

                      <div className="grid gap-3 px-3 py-4 lg:grid-cols-[1fr_220px] lg:items-center">
                        <label className="flex items-center gap-3 text-[14px] text-slate-700">
                          <span className="whitespace-nowrap">Transporter Doc. No. & Date</span>
                          <input
                            type="text"
                            className="h-11 min-w-0 flex-1 rounded border border-slate-300 px-3 text-[14px] outline-none"
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="dd/mm/yy"
                          className="h-11 rounded border border-slate-300 px-3 text-[14px] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-6">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        className="min-w-[84px] rounded-sm bg-[#d7a14b] px-4 py-2 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#c88b33]"
                      >
                        Preview
                      </button>
                <button
                  type="button"
                  onClick={handleSubmitVehiclePreview}
                  className="min-w-[112px] rounded-sm bg-[#5e56b6] px-4 py-2 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#4d46a8]"
                >
                  Submit
                </button>
                      <button
                        type="button"
                        className="min-w-[104px] rounded-sm bg-[#de776b] px-4 py-2 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#d36154]"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <div className="max-w-[1120px] rounded-full bg-[#d9d9dd] px-4 py-2 text-center text-[13px] leading-5 text-slate-700 shadow-inner">
                        <span className="font-semibold">Note:</span> Railway Receipt numbers are
                        validated as per the given formats. If you have RR number other than these
                        formats then, please raise a ticket by mentioning the RR no. Presently, the
                        validation is optional, but in future, invalid formats will not be allowed.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 min-h-[520px] rounded-[8px] border border-[#e0e0e0] bg-[#f3f3f3] p-4">
                  {showVehiclePreview ? (
                    renderVehiclePreview()
                  ) : (
                    <div className="flex h-full min-h-[480px] items-center justify-center rounded-[8px] border border-dashed border-slate-300 bg-white/40 text-center text-[15px] text-slate-500">
                      Enter a vehicle number to preview the e-Way Bill document.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    ) : (
      renderGenerateContent()
    );

  const renderHomeScreen = () => (
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
                  index === 0 ? "text-[#3f3479]" : "text-[#4a5d86] hover:text-[#3f3479]"
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
              onClick={() => {
                const simCfgId = getSimCfgIdFromLocation();
                const query = new URLSearchParams({ returnTo: baseRoute });
                if (simCfgId) query.set("simCfg", simCfgId);
                router.push(`${loginRoute}?${query.toString()}`);
              }}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 border border-red-500 px-2 py-1 text-[15px] font-medium text-[#395789] transition-colors duration-200 hover:text-[#173f73]"
            >
              Login
              <LogIn size={16} className="text-current" />
            </button>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1840px] gap-4 px-4 pt-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
            <GSTBannerCarousel
              slides={bannerSlides}
              className="bg-[#eef6fb]"
              heightClassName="h-[340px] lg:h-[430px]"
            />
            <div className="border-t border-slate-200 bg-white px-5 py-4 text-[14px] leading-7 text-slate-700 lg:text-[15px]">
              E-Way bill system is for GST registered person / enrolled transporter for generating
              the way bill (a document to be carried by the person in charge of conveyance)
              electronically on commencement of movement of goods exceeding the value of Rs.
              50,000 in relation to supply or for reasons other than supply or due to inward
              supply from an unregistered person.
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
                This site can be best viewed in Firefox 43.5 and above, IE 11 and above, chrome
                45 and above. <span className="text-amber-300">Check your browser version</span>
              </div>
              <div>© 2022 - Powered By National Informatics Centre</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="relative">
      {screen === "generate"
        ? renderGenerateScreen()
        : screen === "experiment4"
          ? renderExperiment4Screen()
          : renderHomeScreen()}

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
