"use client";

import { useEffect, useState } from "react";

type BookingDisclaimerModalProps = {
  isOpen: boolean;
  itemTitle: string;
  bookingPercent: number;
  bookingAmount: number;
  baseAmount: number;
  remainingAmount: number;
  onClose: () => void;
  onProceed: () => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export default function BookingDisclaimerModal({
  isOpen,
  itemTitle,
  bookingPercent,
  bookingAmount,
  baseAmount,
  remainingAmount,
  onClose,
  onProceed,
}: BookingDisclaimerModalProps) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAccepted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Course Registration Confirmation</h2>
          <p className="mt-1 text-sm text-slate-600">{itemTitle}</p>
        </div>

        <div className="space-y-3 px-6 py-5 text-sm text-slate-700">
          <p>This payment is for course registration only.</p>
          <p>
            You are paying <strong>{bookingPercent.toFixed(2)}%</strong> now:{" "}
            <strong>{formatCurrency(bookingAmount)}</strong>.
          </p>
          <p>
            Total course fee: <strong>{formatCurrency(baseAmount)}</strong>.
          </p>
          <p>
            Remaining amount: <strong>{formatCurrency(remainingAmount)}</strong>.
          </p>
          <p className="font-medium text-slate-900">
            Full payment is required for full course access.
          </p>

          <label className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span className="text-sm text-slate-700">
              I understand this is a registration payment and full payment is required for
              complete access.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={!accepted}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Proceed to Secure Payment
          </button>
        </div>
      </div>
    </div>
  );
}
