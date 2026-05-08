"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCheckCircle, FaRedo } from "react-icons/fa";

type UploadRow = {
  invoiceNo: string;
  invoiceDate: string;
  buyerGstin: string;
  invoiceValue: string;
  ackNo: string;
  irn: string;
  ewb: string;
};

type UploadSummary = {
  invoiceCount: number;
  itemCount: number;
  uploadedCount: number;
  failedCount: number;
  rows: UploadRow[];
};

export default function EInvoicing2BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedFileRef = useRef<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("Choose file");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [uploadError, setUploadError] = useState("");

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    selectedFileRef.current = file || null;
    setSelectedFileName(file ? file.name : "Choose file");
    setUploadError("");
  };

  const buildSummaryFromJson = (payload: unknown): UploadSummary => {
    const invoices = Array.isArray(payload) ? payload : [payload];

    const rows: UploadRow[] = invoices.map((invoice: any, index: number) => ({
      invoiceNo: invoice?.DocDtls?.No || `INV-${index + 1}`,
      invoiceDate: invoice?.DocDtls?.Dt || "",
      buyerGstin: invoice?.BuyerDtls?.Gstin || "",
      invoiceValue: String(invoice?.ValDtls?.TotInvVal ?? ""),
      ackNo: "146872643383543",
      irn:
        "wXa35MiLjPVezoAco1hxKnnx3oS6VRTcmzCkHhNCkFDXAhzyi241NZ2LlQaIGb19",
      ewb: "",
    }));

    return {
      invoiceCount: rows.length,
      itemCount: invoices.reduce((total: number, invoice: any) => {
        const items = Array.isArray(invoice?.ItemList) ? invoice.ItemList.length : 0;
        return total + items;
      }, 0),
      uploadedCount: rows.length,
      failedCount: 0,
      rows,
    };
  };

  const handleUpload = async () => {
    if (isUploading) {
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      let payload: unknown;
      const selectedFile = selectedFileRef.current;

      if (selectedFile) {
        const text = await selectedFile.text();
        payload = JSON.parse(text);
      } else {
        const response = await fetch("/images/simulations/e-inv_air%202.json");
        payload = await response.json();
      }

      setUploadSummary(buildSummaryFromJson(payload));
    } catch (error) {
      setUploadSummary(null);
      setUploadError("Unable to read the JSON file. Please choose a valid e-invoice JSON file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = () => {
    window.location.assign("/simulations/gst/e-invoicing-2");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 w-full">
        <div className="bg-[#ec1e18] px-4 py-2.5 text-center text-[14px] font-medium leading-tight text-white sm:text-[16px]">
          This is a Simulation. Use For Educational Purposes ONLY.
        </div>

        <div className="bg-white px-0 pb-0 pt-0">
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
                  <div className="text-[14px] font-bold lg:text-[16px]">
                    e-Invoice 2 Portal
                  </div>
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
                  GSTIN: 29BRYFP02061V7YP - Name: IICPA Private Limited
                </div>
                <div className="whitespace-nowrap">Account : Main User</div>
                <div className="whitespace-nowrap">Client IP:1.1.1.1</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1700px] px-4 py-6">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/simulations/gst/e-invoicing-2")}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FaArrowLeft size={12} />
                Back
              </button>
              <a
                href="/images/simulations/e-inv_air%202.json"
                download="e-inv_air 2.json"
                className="inline-flex items-center gap-2 rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-[12px] font-semibold text-sky-700 hover:bg-sky-100"
              >
                Download JSON
              </a>
            </div>
            <div className="text-center text-lg font-extrabold text-[#1b66a0] sm:text-2xl">
              Invoice Bulk Upload
            </div>
            <div className="w-[72px]" />
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-5 rounded-lg border border-sky-100 bg-[#f8fcff] px-4 py-4 text-slate-700 shadow-sm">
              <div className="text-[14px] font-medium leading-7 sm:text-[16px]">
                Upload e-Invoice JSON file using the bulk upload facility.
              </div>
              <div className="mt-1 text-[13px] leading-6 text-slate-600">
                Choose a file and submit it to continue the simulation flow.
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-center text-[15px] font-bold text-slate-700">
                Upload e-Invoice JSON File
              </div>

              <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={selectedFileName}
                    readOnly
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-600 outline-none"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="h-10 rounded-md border border-slate-300 bg-slate-100 px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Browse
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-[13px] font-semibold text-slate-700">
                    Upload e-Invoice JSON File (Less than 2 MB) :
                  </label>
                  <button
                    type="button"
                    onClick={handleUpload}
                    className="rounded-md bg-[#2ea6d9] px-8 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#2397c8] disabled:cursor-wait disabled:opacity-80"
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>

              <div className="px-4 pb-5 text-center text-[14px] font-semibold leading-6 text-[#d94b4b] sm:px-6">
                Note: For preparation of e-Invoice JSON file for bulk generation, please go to the
                "Bulk Generation Tools" under Help -&gt; Tools in the homepage of eInvoice portal.
              </div>

              {uploadError ? (
                <div className="px-4 pb-5 text-center text-[13px] font-semibold text-red-600 sm:px-6">
                  {uploadError}
                </div>
              ) : null}

              {uploadSummary ? (
                <div className="px-4 pb-6 sm:px-6">
                  <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-[#22a7c3] px-4 py-2 text-white">
                      <div className="mx-auto text-[14px] font-bold">
                        Uploaded File Contains
                      </div>
                    </div>
                    <div className="grid gap-4 px-4 py-5">
                      <div className="overflow-hidden rounded-md border border-slate-200">
                        <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-2 text-[14px] text-slate-700">
                          <span>Total number of invoices in the file:</span>
                          <span className="font-semibold text-[#5147a5]">
                            {uploadSummary.invoiceCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-2 text-[14px] text-slate-700">
                          <span>Total number of items in the file:</span>
                          <span className="font-semibold text-[#5147a5]">
                            {uploadSummary.itemCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-2 text-[14px] text-slate-700">
                          <span>Invoices uploaded successfully :</span>
                          <span className="font-semibold text-[#5147a5]">
                            {uploadSummary.uploadedCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] px-4 py-2 text-[14px] text-slate-700">
                          <span>Failed to upload:</span>
                          <span className="font-semibold text-[#5147a5]">
                            {uploadSummary.failedCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-2 text-center text-[15px] font-bold text-slate-700">
                      Successfully Uploaded Invoice Details.
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left text-[12px] text-slate-700">
                        <thead>
                          <tr className="bg-[#2da6c1] text-white">
                            <th className="w-[72px] border-r border-white/20 px-3 py-3">Sl. No</th>
                            <th className="border-r border-white/20 px-3 py-3">Invoice No</th>
                            <th className="border-r border-white/20 px-3 py-3">Invoice Date</th>
                            <th className="border-r border-white/20 px-3 py-3">Buyer GSTIN</th>
                            <th className="border-r border-white/20 px-3 py-3">Invoice Value</th>
                            <th className="border-r border-white/20 px-3 py-3">Ack No</th>
                            <th className="border-r border-white/20 px-3 py-3">IRN</th>
                            <th className="px-3 py-3">EWB No. / If Any Errors While Creating EWB.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadSummary.rows.map((row, index) => (
                            <tr key={`${row.invoiceNo}-${index}`} className="border-t border-slate-200">
                              <td className="border-r border-slate-200 px-3 py-3 align-top text-center">
                                {index + 1}
                              </td>
                              <td className="border-r border-slate-200 px-3 py-3 align-top">
                                {row.invoiceNo}
                              </td>
                              <td className="border-r border-slate-200 px-3 py-3 align-top">
                                {row.invoiceDate}
                              </td>
                              <td className="border-r border-slate-200 px-3 py-3 align-top">
                                {row.buyerGstin}
                              </td>
                              <td className="border-r border-slate-200 px-3 py-3 align-top">
                                {row.invoiceValue}
                              </td>
                              <td className="border-r border-slate-200 px-3 py-3 align-top">
                                {row.ackNo}
                              </td>
                              <td className="border-r border-slate-200 px-3 py-3 align-top">
                                {row.irn}
                              </td>
                              <td className="px-3 py-3 align-top">{row.ewb}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {uploadSummary ? (
        <div className="pointer-events-none fixed inset-0 z-[2000] flex items-center justify-center px-4">
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <FaCheckCircle className="text-[#42c864] drop-shadow-[0_10px_24px_rgba(66,200,100,0.35)]" size={132} />
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 rounded-md bg-red-600 px-6 py-3 text-[14px] font-bold text-white shadow-[0_10px_24px_rgba(220,38,38,0.28)] hover:bg-red-700"
            >
              <FaRedo size={11} />
              Retry
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
