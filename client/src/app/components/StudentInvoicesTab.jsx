"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const SUCCESS_STATUSES = new Set([
  "success",
  "successful",
  "completed",
  "complete",
  "paid",
  "verified",
  "captured",
  "settled",
]);

const PENDING_STATUSES = new Set([
  "pending",
  "processing",
  "in_progress",
  "review",
  "under_review",
]);

const FAILURE_STATUSES = new Set([
  "failed",
  "rejected",
  "cancelled",
  "canceled",
  "declined",
  "expired",
]);

const getArrayFromResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.payments)) return payload.payments;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
  if (Array.isArray(payload?.data?.payments)) return payload.data.payments;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const normalizeStatus = (value) =>
  String(value || "pending")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const getStatusPriority = (status) => {
  const normalized = normalizeStatus(status);
  if (SUCCESS_STATUSES.has(normalized)) return 3;
  if (PENDING_STATUSES.has(normalized)) return 2;
  if (FAILURE_STATUSES.has(normalized)) return 1;
  return 0;
};

const toTimestamp = (value) => {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const pickLatestDate = (currentValue, incomingValue) =>
  toTimestamp(incomingValue) > toTimestamp(currentValue)
    ? incomingValue
    : currentValue;

const chooseText = (currentValue, incomingValue, fallback = "N/A") => {
  const incomingText = String(incomingValue || "").trim();
  const currentText = String(currentValue || "").trim();
  if (incomingText && incomingText !== fallback) return incomingText;
  if (currentText && currentText !== fallback) return currentText;
  return fallback;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatLabel = (value) => {
  const text = String(value || "").trim();
  if (!text || text === "N/A") return "N/A";
  if (text.length <= 4 && /^[a-z0-9]+$/i.test(text)) {
    return text.toUpperCase();
  }
  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolveUrl = (url) => {
  const text = String(url || "").trim();
  if (!text) return "";

  if (text.startsWith("http://") || text.startsWith("https://")) {
    return text;
  }

  try {
    return new URL(text, API_BASE).toString();
  } catch {
    return text;
  }
};

const sanitizeFileName = (value) =>
  String(value || "invoice")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "invoice";

const getInvoiceDownloadConfig = (invoice) => {
  const invoiceUrl = String(invoice?.invoiceUrl || "").trim();
  if (invoiceUrl) {
    return {
      url: resolveUrl(invoiceUrl),
      fileName: `${sanitizeFileName(invoice?.invoiceLabel || invoice?.transactionRef || invoice?.course || "invoice")}.pdf`,
    };
  }

  const raw = invoice?.raw || {};
  const rawId = String(raw?._id || "").trim();
  const bookingId = String(raw?.bookingId || raw?.booking?.bookingId || "").trim();

  const hasCourseBookingShape =
    Array.isArray(raw?.payments) ||
    Object.prototype.hasOwnProperty.call(raw || {}, "remainingAmount") ||
    Object.prototype.hasOwnProperty.call(raw || {}, "bookingAmount") ||
    Object.prototype.hasOwnProperty.call(raw || {}, "itemType");

  if (bookingId && raw?.liveSessionId) {
    return {
      url: `${API_BASE}/api/test-payment/receipts/booking/${encodeURIComponent(
        bookingId
      )}/download`,
      fileName: `Live-Session-Invoice-${bookingId.slice(-8).toUpperCase()}.pdf`,
    };
  }

  if (rawId && hasCourseBookingShape) {
    return {
      url: `${API_BASE}/api/v1/course-bookings/${encodeURIComponent(rawId)}/invoice`,
      fileName: `Booking-Invoice-${rawId.slice(-8).toUpperCase()}.pdf`,
    };
  }

  return null;
};

const downloadBlob = async (url, fileName) => {
  const response = await axios.get(url, {
    withCredentials: true,
    responseType: "blob",
  });

  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const readBlobErrorMessage = async (error) => {
  const blob = error?.response?.data;
  if (!(blob instanceof Blob)) return "";

  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return String(parsed?.message || "").trim();
  } catch {
    return "";
  }
};

const normalizePaymentRecord = (item, index) => {
  const amount = Number(
    item?.amount ??
      item?.paidAmount ??
      item?.course?.price ??
      item?.courseId?.price ??
      item?.baseAmount ??
      0
  );

  const status = normalizeStatus(item?.status || item?.paymentStatus || "pending");
  const transactionRef =
    item?.transactionId ||
    item?.razorpay_payment_id ||
    item?.paymentId ||
    item?.utrNumber ||
    item?.referenceId ||
    item?.reference ||
    item?.paymentRef ||
    item?.transactionRef ||
    "N/A";

  const invoiceNumber =
    item?.invoiceNumber ||
    item?.invoiceNo ||
    item?.invoiceId ||
    item?.invoice?.number ||
    item?.invoice?.invoiceNumber ||
    item?.receiptNo ||
    item?.receiptNumber ||
    "N/A";

  const paymentMethod =
    item?.paymentMethod || item?.method || item?.mode || item?.gateway || "N/A";

  const date =
    item?.paidAt ||
    item?.createdAt ||
    item?.paymentDate ||
    item?.updatedAt ||
    item?.date ||
    item?.verifiedAt ||
    "";

  const course =
    item?.courseId?.title ||
    item?.course?.title ||
    item?.courseTitle ||
    item?.courseName ||
    item?.itemTitle ||
    item?.description ||
    item?.for ||
    "Course";

  const invoiceSent = Boolean(
    item?.invoiceSent ||
      item?.receiptSent ||
      item?.invoiceGenerated ||
      item?.invoiceStatus === "sent"
  );

  const invoiceSentAt = item?.invoiceSentAt || item?.receiptSentAt || "";
  const invoiceUrl =
    item?.invoiceUrl ||
    item?.invoicePdfUrl ||
    item?.receiptUrl ||
    item?.receiptPdfUrl ||
    item?.invoiceFile ||
    item?.receiptFile ||
    "";

  const invoiceLabel =
    invoiceNumber !== "N/A"
      ? `#${String(invoiceNumber).replace(/^#/, "")}`
      : transactionRef !== "N/A"
      ? `Ref ${String(transactionRef)}`
      : `Record ${index + 1}`;

  return {
    id: String(item?._id || item?.id || `row-${index}`),
    course,
    amount,
    status,
    transactionRef: String(transactionRef || "N/A"),
    invoiceNumber: String(invoiceNumber || "N/A"),
    paymentMethod: String(paymentMethod || "N/A"),
    date,
    invoiceSent,
    invoiceSentAt,
    invoiceUrl,
    invoiceLabel,
    raw: item,
  };
};

const getRecordKey = (item, normalized) => {
  const candidates = [
    item?._id,
    item?.id,
    item?.transactionId,
    item?.razorpay_payment_id,
    item?.paymentId,
    item?.utrNumber,
    item?.referenceId,
    item?.invoiceNumber,
    item?.invoiceNo,
    item?.receiptNo,
    normalized?.transactionRef,
    normalized?.invoiceNumber,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value && value !== "N/A") return value;
  }

  return [
    normalized?.course,
    normalized?.amount,
    normalized?.date,
    normalized?.status,
  ]
    .filter(Boolean)
    .join("|");
};

const mergePaymentRecords = (current, incoming) => {
  const nextStatus =
    getStatusPriority(incoming.status) >= getStatusPriority(current.status)
      ? incoming.status
      : current.status;

  return {
    ...current,
    ...incoming,
    course: chooseText(current.course, incoming.course, "Course"),
    transactionRef: chooseText(
      current.transactionRef,
      incoming.transactionRef,
      "N/A"
    ),
    invoiceNumber: chooseText(
      current.invoiceNumber,
      incoming.invoiceNumber,
      "N/A"
    ),
    paymentMethod: chooseText(
      current.paymentMethod,
      incoming.paymentMethod,
      "N/A"
    ),
    date: pickLatestDate(current.date, incoming.date),
    status: nextStatus,
    invoiceSent: current.invoiceSent || incoming.invoiceSent,
    invoiceSentAt: pickLatestDate(current.invoiceSentAt, incoming.invoiceSentAt),
    invoiceUrl: chooseText(current.invoiceUrl, incoming.invoiceUrl, ""),
    invoiceLabel: chooseText(
      current.invoiceLabel,
      incoming.invoiceLabel,
      "N/A"
    ),
    raw: incoming.raw || current.raw,
  };
};

const getStatusClass = (status) => {
  const normalized = normalizeStatus(status);
  if (SUCCESS_STATUSES.has(normalized)) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (PENDING_STATUSES.has(normalized)) {
    return "bg-amber-100 text-amber-700";
  }
  if (FAILURE_STATUSES.has(normalized)) {
    return "bg-red-100 text-red-700";
  }
  return "bg-blue-100 text-blue-700";
};

export default function StudentInvoicesTab({
  title = "Invoices",
  description = "Your payment records and invoice status.",
  loadingMessage = "Loading invoices...",
  emptyMessage = "No results found",
}) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchInvoices = async () => {
      setLoading(true);
      setError("");

      try {
        const studentRes = await axios.get(
          `${API_BASE}/api/v1/students/isstudent`,
          {
            withCredentials: true,
          }
        );

        const studentEmail = studentRes.data?.student?.email;
        const studentId = studentRes.data?.student?._id;

        const endpoints = [
          `${API_BASE}/api/v1/transactions/student`,
          studentId ? `${API_BASE}/api/v1/payments/student/${studentId}` : null,
          `${API_BASE}/api/v1/transactions/my`,
          studentEmail
            ? `${API_BASE}/api/payments/transactions?email=${encodeURIComponent(
                studentEmail
              )}`
            : null,
          studentEmail
            ? `${API_BASE}/payments/transactions?email=${encodeURIComponent(
                studentEmail
              )}`
            : null,
          studentEmail
            ? `${API_BASE}/payments/transactions-by-email/${encodeURIComponent(
                studentEmail
              )}`
            : null,
        ].filter(Boolean);

        const results = await Promise.allSettled(
          endpoints.map((url) => axios.get(url, { withCredentials: true }))
        );

        const recordMap = new Map();

        results.forEach((result) => {
          if (result.status !== "fulfilled") {
            return;
          }

          const records = getArrayFromResponse(result.value?.data);
          records.forEach((item, index) => {
            const normalized = normalizePaymentRecord(item, index);
            const key = getRecordKey(item, normalized);
            const current = recordMap.get(key);

            if (current) {
              recordMap.set(key, mergePaymentRecords(current, normalized));
            } else {
              recordMap.set(key, normalized);
            }
          });
        });

        const mergedRecords = Array.from(recordMap.values()).sort((left, right) => {
          return toTimestamp(right.date) - toTimestamp(left.date);
        });

        if (!cancelled) {
          setInvoices(mergedRecords);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load payment history right now.");
          setInvoices([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const completedRecords = invoices.filter((record) =>
      SUCCESS_STATUSES.has(normalizeStatus(record.status))
    );

    return {
      totalPaid: completedRecords.reduce(
        (sum, record) => sum + Number(record.amount || 0),
        0
      ),
      completedCount: completedRecords.length,
      pendingCount: invoices.filter((record) =>
        PENDING_STATUSES.has(normalizeStatus(record.status))
      ).length,
      invoiceSentCount: invoices.filter((record) => record.invoiceSent).length,
    };
  }, [invoices]);

  const hasInvoices = useMemo(() => invoices.length > 0, [invoices]);

  const handleDownloadInvoice = async (invoice) => {
    const downloadConfig = getInvoiceDownloadConfig(invoice);
    if (!downloadConfig?.url) {
      toast.error("Invoice download is not available for this record.");
      return;
    }

    try {
      setDownloadingInvoiceId(invoice.id);
      await downloadBlob(downloadConfig.url, downloadConfig.fileName);
    } catch (downloadError) {
      console.error("Failed to download invoice:", downloadError);
      const parsedMessage = await readBlobErrorMessage(downloadError);
      toast.error(
        parsedMessage ||
          downloadError?.response?.data?.message ||
          "Unable to download invoice"
      );
    } finally {
      setDownloadingInvoiceId("");
    }
  };

  const summaryCards = [
    {
      label: "Total Paid",
      value: formatMoney(summary.totalPaid),
      tone: "emerald",
    },
    {
      label: "Completed",
      value: summary.completedCount,
      tone: "blue",
    },
    {
      label: "Invoices Sent",
      value: summary.invoiceSentCount,
      tone: "slate",
    },
    {
      label: "Pending",
      value: summary.pendingCount,
      tone: "amber",
    },
  ];

  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">{loadingMessage}</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : !hasInvoices ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-600">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-xl border px-4 py-4 ${toneClasses[card.tone]}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {card.label}
                </p>
                <p className="mt-2 text-lg font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Transaction / Ref
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {invoices.map((invoice) => {
                  const downloadConfig = getInvoiceDownloadConfig(invoice);

                  return (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {invoice.invoiceLabel}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {invoice.invoiceSent
                            ? "Invoice sent"
                            : invoice.invoiceUrl
                            ? "Invoice available"
                            : "Invoice pending"}
                          {invoice.invoiceSentAt
                            ? ` • ${formatDate(invoice.invoiceSentAt)}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {invoice.course}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatMoney(invoice.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-mono text-xs leading-5">
                          {invoice.transactionRef}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatLabel(invoice.paymentMethod)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(
                            invoice.status
                          )}`}
                        >
                          {formatLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(invoice.date)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(invoice)}
                          disabled={
                            !downloadConfig?.url ||
                            downloadingInvoiceId === invoice.id
                          }
                          aria-label={`Download invoice for ${invoice.invoiceLabel}`}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            downloadConfig?.url &&
                            downloadingInvoiceId !== invoice.id
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "cursor-not-allowed bg-gray-100 text-gray-400"
                          }`}
                        >
                          {downloadingInvoiceId === invoice.id
                            ? "Downloading..."
                            : "Download invoice"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
