"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getArrayFromResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.payments)) return payload.payments;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  return [];
};

const normalizeInvoice = (item, index) => ({
  id: item?._id || item?.id || `row-${index}`,
  course:
    item?.courseId?.title ||
    item?.course?.title ||
    item?.courseTitle ||
    item?.courseName ||
    "Course",
  amount: Number(
    item?.amount ??
      item?.paidAmount ??
      item?.course?.price ??
      item?.courseId?.price ??
      0
  ),
  status: (item?.status || item?.paymentStatus || "pending").toString(),
  reference:
    item?.utrNumber || item?.transactionId || item?.referenceId || "N/A",
  date: item?.createdAt || item?.paymentDate || item?.updatedAt || item?.date,
  invoiceSent: Boolean(item?.invoiceSent || item?.receiptSent),
});

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

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export default function StudentInvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchInvoices = async () => {
      setLoading(true);
      setError("");

      try {
        const studentRes = await axios.get(`${API_BASE}/api/v1/students/isstudent`, {
          withCredentials: true,
        });

        const studentEmail = studentRes.data?.student?.email;
        const endpoints = [
          `${API_BASE}/api/v1/transactions/student`,
          `${API_BASE}/api/v1/transactions/my`,
          `${API_BASE}/api/v1/payments/student`,
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
        ].filter(Boolean);

        let records = [];

        for (const url of endpoints) {
          try {
            const response = await axios.get(url, { withCredentials: true });
            const extracted = getArrayFromResponse(response.data);
            if (Array.isArray(extracted)) {
              records = extracted;
              break;
            }
          } catch (endpointError) {
            continue;
          }
        }

        if (!cancelled) {
          setInvoices(records.map(normalizeInvoice));
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError("Unable to load invoices right now.");
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

  const hasInvoices = useMemo(() => invoices.length > 0, [invoices]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
        <p className="text-sm text-gray-600">
          Your payment records and invoice status.
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">Loading invoices...</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : !hasInvoices ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-600">
          No invoices found for your account yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Course
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ref/UTR
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Invoice Sent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">{invoice.course}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatMoney(invoice.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-gray-700">
                    {invoice.status}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">
                    {invoice.reference}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {invoice.invoiceSent ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
