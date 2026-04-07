"use client";

import axios from "axios";
import { jsPDF } from "jspdf";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import {
  FaBuilding,
  FaCalculator,
  FaDownload,
  FaExchangeAlt,
  FaFileInvoiceDollar,
  FaPlus,
  FaPrint,
  FaSave,
  FaSearch,
  FaSyncAlt,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import { getApiBase } from "@/lib/apiBase";

type CompanySettings = {
  companyName?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  gstin?: string;
  cin?: string;
  pan?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  invoicePrefix?: string;
  supportEmail?: string;
  supportPhone?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
  invoiceNotes?: string;
};

type CustomerRecord = {
  id: string;
  customerName: string;
  companyName: string;
  gstin: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  billingState: string;
  shippingState: string;
  city: string;
  pincode: string;
  country: string;
};

type QuoteItem = {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  discountType: "percent" | "flat";
  discountValue: number;
  gstRate: number;
};

type QuoteMeta = {
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  subject: string;
  notes: string;
  terms: string;
};

type QuotationState = {
  company: CompanySettings;
  customer: CustomerRecord;
  meta: QuoteMeta;
  items: QuoteItem[];
  overallDiscountType: "percent" | "flat";
  overallDiscountValue: number;
};

type LineSummary = {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  grossAmount: number;
  itemDiscountAmount: number;
  adjustedTaxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
};

type QuoteSummary = {
  lines: LineSummary[];
  isInterstate: boolean;
  subtotal: number;
  itemDiscountTotal: number;
  overallDiscountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
};

const API_BASE = getApiBase();
const DRAFT_STORAGE_KEY = "iicpa-quotation-draft-v1";
const CUSTOMER_STORAGE_KEY = "iicpa-quotation-customers-v1";
const SEQUENCE_STORAGE_KEY = "iicpa-quotation-sequence-v1";

const DEFAULT_COMPANY: CompanySettings = {
  companyName: "",
  legalName: "",
  email: "",
  phone: "",
  website: "",
  gstin: "",
  cin: "",
  pan: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  invoicePrefix: "QTN",
  supportEmail: "",
  supportPhone: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  invoiceNotes: "",
};

const DEFAULT_CUSTOMER: CustomerRecord = {
  id: "",
  customerName: "",
  companyName: "",
  gstin: "",
  email: "",
  phone: "",
  billingAddress: "",
  shippingAddress: "",
  billingState: "",
  shippingState: "",
  city: "",
  pincode: "",
  country: "India",
};

const DEFAULT_META: QuoteMeta = {
  quoteNumber: "",
  quoteDate: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  subject: "Quotation for services",
  notes: "",
  terms:
    "Quotation is valid for the period shown above. GST will be applied based on the shipping state and company state.",
};

const GST_RATES = [0, 5, 12, 18, 28];

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Chandigarh",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Lakshadweep",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
];

const normalizeText = (value?: string) => (value || "").trim().toLowerCase();

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => money.format(Number(value || 0));

const roundMoney = (value: number) => Number((Number(value || 0) || 0).toFixed(2));

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createDefaultItem = (): QuoteItem => ({
  id: createId(),
  description: "",
  hsnSac: "",
  quantity: 1,
  unit: "NOS",
  rate: 0,
  discountType: "percent",
  discountValue: 0,
  gstRate: 18,
});

const getNextQuotationNumber = (prefix: string) => {
  if (typeof window === "undefined") return `${prefix}-0001`;
  const current = Number(localStorage.getItem(SEQUENCE_STORAGE_KEY) || "0") + 1;
  localStorage.setItem(SEQUENCE_STORAGE_KEY, String(current));
  const padded = String(current).padStart(4, "0");
  return `${prefix}-${padded}`;
};

const normalizeDiscount = (
  amount: number,
  total: number,
  type: "percent" | "flat"
) => {
  if (!Number.isFinite(amount) || amount <= 0 || total <= 0) return 0;
  const raw = type === "percent" ? (total * amount) / 100 : amount;
  return Math.max(0, Math.min(total, roundMoney(raw)));
};

const calculateQuotationSummary = (
  state: QuotationState
): QuoteSummary => {
  const companyState = normalizeText(state.company.state);
  const shippingState = normalizeText(state.customer.shippingState || state.customer.billingState);
  const isInterstate = Boolean(companyState && shippingState && companyState !== shippingState);

  const baseLines = state.items.map((item) => {
    const grossAmount = roundMoney(Number(item.quantity || 0) * Number(item.rate || 0));
    const itemDiscountAmount = normalizeDiscount(
      Number(item.discountValue || 0),
      grossAmount,
      item.discountType
    );
    const adjustedTaxableAmount = Math.max(0, roundMoney(grossAmount - itemDiscountAmount));
    return {
      id: item.id,
      description: item.description.trim(),
      hsnSac: item.hsnSac.trim(),
      quantity: Number(item.quantity || 0),
      unit: item.unit.trim() || "NOS",
      rate: Number(item.rate || 0),
      grossAmount,
      itemDiscountAmount,
      adjustedTaxableAmount,
      cgstRate: isInterstate ? 0 : Number(item.gstRate || 0) / 2,
      sgstRate: isInterstate ? 0 : Number(item.gstRate || 0) / 2,
      igstRate: isInterstate ? Number(item.gstRate || 0) : 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    } satisfies LineSummary;
  });

  const subtotal = roundMoney(
    baseLines.reduce((sum, line) => sum + line.grossAmount, 0)
  );
  const itemDiscountTotal = roundMoney(
    baseLines.reduce((sum, line) => sum + line.itemDiscountAmount, 0)
  );
  const netAfterItemDiscount = Math.max(0, roundMoney(subtotal - itemDiscountTotal));
  const overallDiscountAmount = normalizeDiscount(
    Number(state.overallDiscountValue || 0),
    netAfterItemDiscount,
    state.overallDiscountType
  );
  const taxableAmount = Math.max(
    0,
    roundMoney(netAfterItemDiscount - overallDiscountAmount)
  );
  const allocationFactor =
    netAfterItemDiscount > 0 ? taxableAmount / netAfterItemDiscount : 1;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const lines = baseLines.map((line) => {
    const taxablePortion = roundMoney(line.adjustedTaxableAmount * allocationFactor);
    let lineCgst = 0;
    let lineSgst = 0;
    let lineIgst = 0;

    if (isInterstate) {
      lineIgst = roundMoney((taxablePortion * line.igstRate) / 100);
      igstAmount += lineIgst;
    } else {
      lineCgst = roundMoney((taxablePortion * line.cgstRate) / 100);
      lineSgst = roundMoney((taxablePortion * line.sgstRate) / 100);
      cgstAmount += lineCgst;
      sgstAmount += lineSgst;
    }

    return {
      ...line,
      adjustedTaxableAmount: taxablePortion,
      cgstAmount: lineCgst,
      sgstAmount: lineSgst,
      igstAmount: lineIgst,
      totalAmount: roundMoney(
        taxablePortion + lineCgst + lineSgst + lineIgst
      ),
    };
  });

  const grandTotal = roundMoney(taxableAmount + cgstAmount + sgstAmount + igstAmount);

  return {
    lines,
    isInterstate,
    subtotal,
    itemDiscountTotal,
    overallDiscountAmount,
    taxableAmount,
    cgstAmount: roundMoney(cgstAmount),
    sgstAmount: roundMoney(sgstAmount),
    igstAmount: roundMoney(igstAmount),
    grandTotal,
  };
};

const wrap = (doc: jsPDF, text: string, maxWidth: number) =>
  doc.splitTextToSize(text || "-", maxWidth) as string[];

const QuotationStudio = () => {
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [recentCustomers, setRecentCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [state, setState] = useState<QuotationState>({
    company: DEFAULT_COMPANY,
    customer: DEFAULT_CUSTOMER,
    meta: DEFAULT_META,
    items: [createDefaultItem()],
    overallDiscountType: "percent",
    overallDiscountValue: 0,
  });

  const summary = useMemo(
    () => calculateQuotationSummary(state),
    [state]
  );

  const quotePrefix = (state.company.invoicePrefix || "QTN").trim().toUpperCase();
  const companyName = state.company.companyName || state.company.legalName || "Company";
  const companyState = state.company.state || "Not set";
  const shippingState =
    state.customer.shippingState || state.customer.billingState || "Not set";

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    const savedCustomers = localStorage.getItem(CUSTOMER_STORAGE_KEY);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as Partial<QuotationState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          company: { ...DEFAULT_COMPANY, ...(parsed.company || {}) },
          customer: { ...DEFAULT_CUSTOMER, ...(parsed.customer || {}) },
          meta: { ...DEFAULT_META, ...(parsed.meta || {}) },
          items:
            Array.isArray(parsed.items) && parsed.items.length > 0
              ? parsed.items
              : [createDefaultItem()],
          overallDiscountType:
            parsed.overallDiscountType === "flat" ? "flat" : "percent",
          overallDiscountValue: Number(parsed.overallDiscountValue || 0),
        }));
      } catch {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }

    if (savedCustomers) {
      try {
        const parsed = JSON.parse(savedCustomers) as CustomerRecord[];
        setRecentCustomers(Array.isArray(parsed) ? parsed : []);
      } catch {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      }
    }

    const fetchCompanySettings = async () => {
      try {
        const response = await axios.get(`${API_BASE}/invoice-company-settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const settings = response.data?.settings || {};
        setState((prev) => {
          const nextCompany = { ...DEFAULT_COMPANY, ...settings };
          const shouldGenerateNumber = !prev.meta.quoteNumber;
          return {
            ...prev,
            company: nextCompany,
            meta: {
              ...prev.meta,
              quoteNumber: shouldGenerateNumber
                ? getNextQuotationNumber(
                    (nextCompany.invoicePrefix || "QTN").trim().toUpperCase()
                  )
                : prev.meta.quoteNumber,
            },
          };
        });
      } catch (error) {
        console.warn("Failed to load invoice company settings:", error);
        setState((prev) => ({
          ...prev,
          meta: {
            ...prev.meta,
            quoteNumber: prev.meta.quoteNumber || getNextQuotationNumber(quotePrefix),
          },
        }));
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchCompanySettings();
  }, []);

  const persistDraft = async () => {
    setSavingDraft(true);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
      toast.success("Quotation draft saved");
    } finally {
      setSavingDraft(false);
    }
  };

  const updateCompany = (field: keyof CompanySettings, value: string) => {
    setState((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }));
  };

  const updateCustomer = (field: keyof CustomerRecord, value: string) => {
    setState((prev) => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }));
  };

  const updateMeta = (field: keyof QuoteMeta, value: string) => {
    setState((prev) => ({
      ...prev,
      meta: { ...prev.meta, [field]: value },
    }));
  };

  const updateItem = (
    id: string,
    field: keyof QuoteItem,
    value: string | number
  ) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity" ||
                field === "rate" ||
                field === "discountValue" ||
                field === "gstRate"
                  ? Number(value)
                  : value,
            }
          : item
      ),
    }));
  };

  const addItem = () => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, createDefaultItem()],
    }));
  };

  const removeItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((item) => item.id !== id) : prev.items,
    }));
  };

  const resetQuotation = () => {
    const nextQuoteNumber = getNextQuotationNumber(quotePrefix);
    setSelectedCustomerId("");
    setState({
      company: { ...state.company, invoicePrefix: quotePrefix },
      customer: DEFAULT_CUSTOMER,
      meta: { ...DEFAULT_META, quoteNumber: nextQuoteNumber },
      items: [createDefaultItem()],
      overallDiscountType: "percent",
      overallDiscountValue: 0,
    });
    toast.success("Quotation reset");
  };

  const saveCurrentCustomer = () => {
    const customerName = state.customer.customerName.trim();
    if (!customerName) {
      toast.error("Enter a customer name before saving");
      return;
    }

    const nextRecord: CustomerRecord = {
      ...state.customer,
      id: state.customer.id || createId(),
      customerName,
    };

    setRecentCustomers((prev) => {
      const filtered = prev.filter((item) => item.id !== nextRecord.id);
      const updated = [nextRecord, ...filtered].slice(0, 12);
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setState((prev) => ({
      ...prev,
      customer: nextRecord,
    }));

    toast.success("Customer saved");
  };

  const loadCustomer = (id: string) => {
    const matched = recentCustomers.find((customer) => customer.id === id);
    if (!matched) return;

    setSelectedCustomerId(id);
    setState((prev) => ({
      ...prev,
      customer: matched,
    }));
    toast.success("Customer loaded");
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const left = 14;
    const pageWidth = 210;
    const contentWidth = pageWidth - left * 2;
    const right = pageWidth - left;
    let y = 14;
    const headers = [
      { label: "#", width: 7 },
      { label: "Description", width: 47 },
      { label: "HSN/SAC", width: 18 },
      { label: "Qty", width: 12 },
      { label: "Rate", width: 20 },
      { label: "Taxable", width: 24 },
      { label: "GST", width: 15 },
      { label: "Total", width: 20 },
    ];

    const ensureSpace = (requiredHeight: number) => {
      if (y + requiredHeight > 282) {
        doc.addPage();
        y = 14;
        drawTableHeader();
      }
    };

    const drawTableHeader = () => {
      let x = left;
      doc.setFillColor(232, 240, 254);
      doc.rect(left, y - 5, contentWidth, 7, "F");
      doc.setFontSize(8.5);
      headers.forEach((header) => {
        doc.text(header.label, x + 1, y);
        x += header.width;
      });
      y += 3;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(companyName || "Quotation", left, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Quotation No: ${state.meta.quoteNumber || "-"}`, left, y);
    y += 5;
    doc.text(`Quotation Date: ${state.meta.quoteDate || "-"}`, left, y);
    y += 5;
    doc.text(`Valid Until: ${state.meta.validUntil || "-"}`, left, y);

    const companyBlock = [
      state.company.legalName || state.company.companyName || "",
      state.company.addressLine1 || "",
      state.company.addressLine2 || "",
      [state.company.city, state.company.state, state.company.pincode]
        .filter(Boolean)
        .join(", "),
      state.company.country || "",
      state.company.gstin ? `GSTIN: ${state.company.gstin}` : "",
      state.company.email ? `Email: ${state.company.email}` : "",
      state.company.phone ? `Phone: ${state.company.phone}` : "",
      state.company.website ? `Website: ${state.company.website}` : "",
    ].filter(Boolean);

    y = 14;
    doc.setFont("helvetica", "bold");
    doc.text("Bill From", right - 60, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    companyBlock.forEach((line) => {
      ensureSpace(5);
      doc.text(wrap(doc, line, 58), right - 60, y);
      y += 5;
    });

    y = Math.max(y, 44);
    doc.line(left, y, right, y);
    y += 5;

    const customerBlock = [
      state.customer.customerName || "",
      state.customer.companyName || "",
      state.customer.billingAddress || "",
      state.customer.shippingAddress || "",
      [state.customer.city, state.customer.shippingState, state.customer.pincode]
        .filter(Boolean)
        .join(", "),
      state.customer.country || "",
      state.customer.gstin ? `GSTIN: ${state.customer.gstin}` : "",
      state.customer.email ? `Email: ${state.customer.email}` : "",
      state.customer.phone ? `Phone: ${state.customer.phone}` : "",
    ].filter(Boolean);

    doc.setFont("helvetica", "bold");
    doc.text("Bill To", left, y);
    doc.text("Tax Logic", right - 42, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    customerBlock.forEach((line) => {
      ensureSpace(5);
      doc.text(wrap(doc, line, 84), left, y);
      y += 5;
    });
    doc.text(
      summary.isInterstate
        ? "IGST applies because shipping state differs from company state."
        : "CGST + SGST applies because shipping state matches company state.",
      right - 42,
      y
    );
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Items", left, y);
    y += 5;
    drawTableHeader();

    summary.lines.forEach((line, index) => {
      const requiredHeight = 12;
      ensureSpace(requiredHeight + 10);
      let x = left;
      y += 4;
      doc.setDrawColor(220, 225, 235);
      doc.line(left, y + 4, right, y + 4);

      const row = [
        String(index + 1),
        line.description || "-",
        line.hsnSac || "-",
        String(line.quantity || 0),
        formatMoney(line.rate),
        formatMoney(line.adjustedTaxableAmount),
        summary.isInterstate
          ? `IGST ${line.igstRate.toFixed(2)}%`
          : `CGST ${line.cgstRate.toFixed(2)}% / SGST ${line.sgstRate.toFixed(2)}%`,
        formatMoney(line.totalAmount),
      ];

      row.forEach((cell, cellIndex) => {
        const header = headers[cellIndex];
        const wrapped = wrap(doc, cell, header.width - 2);
        doc.text(wrapped, x + 1, y);
        x += header.width;
      });
      y += 8;
    });

    y += 4;
    ensureSpace(60);
    const summaryStart = y;
    const summaryRows: Array<[string, number]> = [
      ["Subtotal", summary.subtotal],
      ["Item Discount", summary.itemDiscountTotal],
      ["Additional Discount", summary.overallDiscountAmount],
      ["Taxable Value", summary.taxableAmount],
      ["CGST", summary.cgstAmount],
      ["SGST", summary.sgstAmount],
      ["IGST", summary.igstAmount],
      ["Grand Total", summary.grandTotal],
    ];

    doc.setFont("helvetica", "bold");
    summaryRows.forEach((row, rowIndex) => {
      const rowY = summaryStart + rowIndex * 6;
      doc.text(row[0], right - 80, rowY);
      doc.text(formatMoney(Number(row[1])), right - 25, rowY, { align: "right" });
    });

    const footerY = summaryStart + summaryRows.length * 6 + 6;
    if (state.meta.notes) {
      doc.setFont("helvetica", "normal");
      doc.text("Notes", left, footerY);
      doc.text(wrap(doc, state.meta.notes, 170), left, footerY + 5);
    }

    if (state.company.invoiceNotes) {
      const noteY = footerY + (state.meta.notes ? 12 : 5);
      doc.setFont("helvetica", "normal");
      doc.text(wrap(doc, state.company.invoiceNotes, 170), left, noteY);
    }

    doc.save(`${state.meta.quoteNumber || "quotation"}.pdf`);
    toast.success("Quotation PDF downloaded");
  };

  const renderPreviewBadge = () => (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        summary.isInterstate
          ? "bg-amber-100 text-amber-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {summary.isInterstate ? "IGST" : "CGST + SGST"} logic active
    </span>
  );

  const handleTextChange =
    <T extends HTMLInputElement | HTMLTextAreaElement>(
      updater: (value: string) => void
    ) =>
    (event: ChangeEvent<T>) =>
      updater(event.target.value);

  if (loadingSettings) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Loading quotation studio...</p>
      </div>
    );
  }

  return (
    <div className="quotation-page min-h-screen bg-[radial-gradient(circle_at_top_left,_#eff6ff_0,_#f8fafc_32%,_#eef2ff_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="quotation-no-print rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <FaFileInvoiceDollar />
                Quotation Studio
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Complete quotation builder with GST-aware preview
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 md:text-base">
                Company prefix, company state, customer shipping state, line items,
                item-level discounts, summary discounts, and PDF output are all
                handled here.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={persistDraft}
                disabled={savingDraft}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:opacity-60"
              >
                <FaSave />
                {savingDraft ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FaPrint />
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={generatePdf}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <FaDownload />
                Download PDF
              </button>
              <button
                type="button"
                onClick={resetQuotation}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <FaSyncAlt />
                New Quotation
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <FaBuilding />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Company Details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Pulled from invoice company settings.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Company Name">
                  <input
                    value={state.company.companyName || ""}
                    onChange={handleTextChange((value) => updateCompany("companyName", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Company name"
                  />
                </Field>
                <Field label="Invoice Prefix">
                  <input
                    value={state.company.invoicePrefix || ""}
                    onChange={handleTextChange((value) =>
                      updateCompany("invoicePrefix", value.toUpperCase())
                    )}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="QTN"
                  />
                </Field>
                <Field label="Company State">
                  <select
                    value={state.company.state || ""}
                    onChange={(event) => updateCompany("state", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Select state</option>
                    {STATES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="GSTIN">
                  <input
                    value={state.company.gstin || ""}
                    onChange={handleTextChange((value) => updateCompany("gstin", value.toUpperCase()))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="GSTIN"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <FaUser />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Customer Details
                    </h2>
                    <p className="text-sm text-slate-500">
                      Save and reload customer data without retyping.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveCurrentCustomer}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <FaSave />
                  Save Customer
                </button>
              </div>

              <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
                <Field label="Recent Customers">
                  <select
                    value={selectedCustomerId}
                    onChange={(event) => loadCustomer(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Load saved customer</option>
                    {recentCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customerName}
                        {customer.phone ? ` • ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="self-end rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {recentCustomers.length} saved
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Customer Name">
                  <input
                    value={state.customer.customerName}
                    onChange={handleTextChange((value) => updateCustomer("customerName", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Customer name"
                  />
                </Field>
                <Field label="Company Name">
                  <input
                    value={state.customer.companyName}
                    onChange={handleTextChange((value) => updateCustomer("companyName", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Customer company"
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={state.customer.email}
                    onChange={handleTextChange((value) => updateCustomer("email", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Email address"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={state.customer.phone}
                    onChange={handleTextChange((value) => updateCustomer("phone", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Phone number"
                  />
                </Field>
                <Field label="Shipping State">
                  <select
                    value={state.customer.shippingState}
                    onChange={(event) =>
                      updateCustomer("shippingState", event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Select state</option>
                    {STATES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Billing State">
                  <select
                    value={state.customer.billingState}
                    onChange={(event) =>
                      updateCustomer("billingState", event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Select state</option>
                    {STATES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="GSTIN">
                  <input
                    value={state.customer.gstin}
                    onChange={handleTextChange((value) => updateCustomer("gstin", value.toUpperCase()))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Customer GSTIN"
                  />
                </Field>
                <Field label="Billing Address" className="md:col-span-2">
                  <textarea
                    value={state.customer.billingAddress}
                    onChange={handleTextChange((value) =>
                      updateCustomer("billingAddress", value)
                    )}
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Billing address"
                  />
                </Field>
                <Field label="Shipping Address" className="md:col-span-2">
                  <textarea
                    value={state.customer.shippingAddress}
                    onChange={handleTextChange((value) =>
                      updateCustomer("shippingAddress", value)
                    )}
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Shipping address"
                  />
                </Field>
                <Field label="City">
                  <input
                    value={state.customer.city}
                    onChange={handleTextChange((value) => updateCustomer("city", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="City"
                  />
                </Field>
                <Field label="Pincode">
                  <input
                    value={state.customer.pincode}
                    onChange={handleTextChange((value) => updateCustomer("pincode", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Pincode"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                    <FaCalculator />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Quotation Meta
                    </h2>
                    <p className="text-sm text-slate-500">
                      Numbering uses the saved company prefix.
                    </p>
                  </div>
                </div>
                {renderPreviewBadge()}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Quotation Number">
                  <input
                    value={state.meta.quoteNumber}
                    onChange={handleTextChange((value) => updateMeta("quoteNumber", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Auto generated"
                  />
                </Field>
                <Field label="Quotation Subject">
                  <input
                    value={state.meta.subject}
                    onChange={handleTextChange((value) => updateMeta("subject", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Subject"
                  />
                </Field>
                <Field label="Quotation Date">
                  <input
                    type="date"
                    value={state.meta.quoteDate}
                    onChange={handleTextChange((value) => updateMeta("quoteDate", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Valid Until">
                  <input
                    type="date"
                    value={state.meta.validUntil}
                    onChange={handleTextChange((value) => updateMeta("validUntil", value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Summary Discount Type">
                  <select
                    value={state.overallDiscountType}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        overallDiscountType: event.target.value === "flat" ? "flat" : "percent",
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat amount (₹)</option>
                  </select>
                </Field>
                <Field label="Summary Discount Value">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={state.overallDiscountValue}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        overallDiscountValue: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="0"
                  />
                </Field>
                <Field label="Notes" className="md:col-span-2">
                  <textarea
                    value={state.meta.notes}
                    onChange={handleTextChange((value) => updateMeta("notes", value))}
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Optional notes for the quotation"
                  />
                </Field>
                <Field label="Terms" className="md:col-span-2">
                  <textarea
                    value={state.meta.terms}
                    onChange={handleTextChange((value) => updateMeta("terms", value))}
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Terms and conditions"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <FaExchangeAlt />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Line Items
                    </h2>
                    <p className="text-sm text-slate-500">
                      Add services, taxes, discounts, and GST per line.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  <FaPlus />
                  Add Line
                </button>
              </div>

              <div className="space-y-4">
                {state.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-700">
                        Line {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <FaTrash />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="Description" className="xl:col-span-2">
                        <input
                          value={item.description}
                          onChange={handleTextChange((value) =>
                            updateItem(item.id, "description", value)
                          )}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          placeholder="Service or product description"
                        />
                      </Field>
                      <Field label="HSN / SAC">
                        <input
                          value={item.hsnSac}
                          onChange={handleTextChange((value) =>
                            updateItem(item.id, "hsnSac", value)
                          )}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          placeholder="HSN / SAC"
                        />
                      </Field>
                      <Field label="Unit">
                        <input
                          value={item.unit}
                          onChange={handleTextChange((value) =>
                            updateItem(item.id, "unit", value)
                          )}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          placeholder="NOS"
                        />
                      </Field>
                      <Field label="Quantity">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={handleTextChange((value) =>
                            updateItem(item.id, "quantity", value)
                          )}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        />
                      </Field>
                      <Field label="Rate">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={handleTextChange((value) =>
                            updateItem(item.id, "rate", value)
                          )}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        />
                      </Field>
                      <Field label="Discount Type">
                        <select
                          value={item.discountType}
                          onChange={(event) =>
                            updateItem(item.id, "discountType", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="percent">Percent (%)</option>
                          <option value="flat">Flat amount (₹)</option>
                        </select>
                      </Field>
                      <Field label="Discount Value">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discountValue}
                          onChange={handleTextChange((value) =>
                            updateItem(item.id, "discountValue", value)
                          )}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        />
                      </Field>
                      <Field label="GST Rate (%)">
                        <select
                          value={item.gstRate}
                          onChange={(event) =>
                            updateItem(item.id, "gstRate", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        >
                          {GST_RATES.map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}%
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-6 space-y-6">
              <section className="quotation-preview-wrap overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Browser Preview
                    </span>
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-slate-200 pb-4">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-slate-900">
                        {companyName}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-blue-700">
                        Quotation Preview
                      </p>
                      <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                        {state.company.addressLine1 || "Company address line 1"}
                        {state.company.addressLine2 ? `, ${state.company.addressLine2}` : ""}
                        {state.company.city ? `, ${state.company.city}` : ""}
                        {state.company.state ? `, ${state.company.state}` : ""}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                        Quote No
                      </div>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {state.meta.quoteNumber || "-"}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {state.meta.quoteDate} to {state.meta.validUntil}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <PreviewCard title="Bill From">
                      <PreviewLine label={companyName} />
                      <PreviewLine
                        label={[
                          state.company.addressLine1,
                          state.company.addressLine2,
                          state.company.city,
                          state.company.state,
                          state.company.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      />
                      <PreviewLine label={state.company.gstin ? `GSTIN: ${state.company.gstin}` : "GSTIN: -"} />
                      <PreviewLine label={state.company.email ? `Email: ${state.company.email}` : "Email: -"} />
                    </PreviewCard>

                    <PreviewCard title="Bill To">
                      <PreviewLine label={state.customer.customerName || "Customer name"} />
                      <PreviewLine label={state.customer.companyName || "Customer company"} />
                      <PreviewLine label={state.customer.billingAddress || "Billing address"} />
                      <PreviewLine
                        label={[
                          state.customer.city,
                          shippingState,
                          state.customer.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      />
                      <PreviewLine label={state.customer.gstin ? `GSTIN: ${state.customer.gstin}` : "GSTIN: -"} />
                    </PreviewCard>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-[2fr_0.8fr_0.8fr_0.9fr_0.9fr_0.9fr] gap-0 border-b border-slate-200 bg-slate-900 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                      <span>Description</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Rate</span>
                      <span className="text-right">Discount</span>
                      <span className="text-right">GST</span>
                      <span className="text-right">Total</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {summary.lines.map((line, index) => (
                        <div
                          key={line.id}
                          className="grid grid-cols-[2fr_0.8fr_0.8fr_0.9fr_0.9fr_0.9fr] gap-0 px-4 py-3 text-sm"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {index + 1}. {line.description || "Line item"}
                            </div>
                            <div className="text-xs text-slate-500">
                              HSN/SAC: {line.hsnSac || "-"}
                            </div>
                          </div>
                          <div className="text-right text-slate-700">
                            {line.quantity} {line.unit}
                          </div>
                          <div className="text-right text-slate-700">
                            {formatMoney(line.rate)}
                          </div>
                          <div className="text-right text-slate-700">
                            {formatMoney(line.itemDiscountAmount)}
                          </div>
                          <div className="text-right text-slate-700">
                            {summary.isInterstate
                              ? `${line.igstRate.toFixed(2)}%`
                              : `${line.cgstRate.toFixed(2)}% + ${line.sgstRate.toFixed(2)}%`}
                          </div>
                          <div className="text-right font-semibold text-slate-900">
                            {formatMoney(line.totalAmount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        Tax Logic
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Company state: <span className="font-semibold">{companyState}</span>
                        <br />
                        Shipping state: <span className="font-semibold">{shippingState}</span>
                      </p>
                      <div className="mt-3">{renderPreviewBadge()}</div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <SummaryRow label="Subtotal" value={summary.subtotal} />
                      <SummaryRow label="Item Discount" value={summary.itemDiscountTotal} />
                      <SummaryRow
                        label="Additional Discount"
                        value={summary.overallDiscountAmount}
                      />
                      <SummaryRow label="Taxable Amount" value={summary.taxableAmount} />
                      <SummaryRow label="CGST" value={summary.cgstAmount} />
                      <SummaryRow label="SGST" value={summary.sgstAmount} />
                      <SummaryRow label="IGST" value={summary.igstAmount} />
                      <div className="my-3 border-t border-dashed border-slate-200" />
                      <SummaryRow label="Grand Total" value={summary.grandTotal} emphasize />
                    </div>
                  </div>

                  {state.meta.notes ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">Notes</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {state.meta.notes}
                      </p>
                    </div>
                  ) : null}

                  {state.meta.terms ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        Terms & Conditions
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {state.meta.terms}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <FaSearch />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Quick Actions
                    </h2>
                    <p className="text-sm text-slate-500">
                      Save, print, or inspect the current quotation.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={persistDraft}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Save quotation draft
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Open print dialog
                  </button>
                  <button
                    type="button"
                    onClick={generatePdf}
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:col-span-2"
                  >
                    Download browser PDF
                  </button>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
          }

          .quotation-page {
            background: #fff !important;
            padding: 0 !important;
          }

          .quotation-no-print {
            display: none !important;
          }

          .quotation-preview-wrap {
            box-shadow: none !important;
            border: none !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function PreviewCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function PreviewLine({ label }: { label: string }) {
  return <div className="text-sm leading-6 text-slate-600">{label || "-"}</div>;
}

function SummaryRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-1 text-sm ${
        emphasize ? "font-bold text-slate-900" : "text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}

export default QuotationStudio;
